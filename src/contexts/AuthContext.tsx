import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'customer' | 'vendor' | 'admin' | 'delivery_partner';

export interface User {
  id: string;
  email: string;
  name: string; // Computed from firstName + lastName
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithOtp: (userId: string, email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const firstName = profile.first_name || '';
        const lastName = profile.last_name || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || profile.email || '';
        
        return {
          id: userId,
          email: profile.email || '',
          name,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: profile.phone || undefined,
          avatarUrl: profile.avatar_url || undefined,
          role: (roleData?.role as UserRole) || 'customer',
          createdAt: profile.created_at ? new Date(profile.created_at) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const userData = await fetchUserProfile(currentSession.user.id);
      setUser(userData);
    } else {
      // Check for OTP verified user
      const otpVerifiedData = localStorage.getItem('otp_verified_user');
      if (otpVerifiedData) {
        try {
          const parsed = JSON.parse(otpVerifiedData);
          if (parsed.expiresAt > Date.now()) {
            const userData = await fetchUserProfile(parsed.userId);
            if (userData) {
              setUser(userData);
            }
          } else {
            localStorage.removeItem('otp_verified_user');
          }
        } catch (e) {
          localStorage.removeItem('otp_verified_user');
        }
      }
    }
  };

  useEffect(() => {
    // Check for OTP verified user first
    const checkOtpUser = async () => {
      const otpVerifiedData = localStorage.getItem('otp_verified_user');
      if (otpVerifiedData) {
        try {
          const parsed = JSON.parse(otpVerifiedData);
          if (parsed.expiresAt > Date.now() && parsed.userId) {
            // Use RPC function to get profile (bypasses RLS)
            const { data: profileData, error } = await supabase.rpc(
              'get_user_profile_for_otp' as any,
              { user_uuid: parsed.userId }
            );
            
            console.log('OTP user profile:', { profileData, error });
            
            if (profileData && Array.isArray(profileData) && profileData.length > 0) {
              const profile = profileData[0];
              const userData: User = {
                id: profile.id,
                email: profile.email || parsed.email,
                name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || '',
                firstName: profile.first_name || undefined,
                lastName: profile.last_name || undefined,
                phone: profile.phone || undefined,
                avatarUrl: profile.avatar_url || undefined,
                role: (profile.user_role as UserRole) || 'customer',
              };
              setUser(userData);
              setIsLoading(false);
              return true;
            }
          } else {
            localStorage.removeItem('otp_verified_user');
          }
        } catch (e) {
          console.error('Error checking OTP user:', e);
          localStorage.removeItem('otp_verified_user');
        }
      }
      return false;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(async () => {
            const userData = await fetchUserProfile(currentSession.user.id);
            setUser(userData);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check current session or OTP user
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id).then((userData) => {
          setUser(userData);
          setIsLoading(false);
        });
      } else {
        // Check for OTP verified user if no session
        const otpUserFound = await checkOtpUser();
        if (!otpUserFound) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, _role?: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // SECURITY: All signups create customers only
  // Vendors and delivery partners must be created by admins through a separate process
  const signup = async (
    email: string, 
    password: string, 
    name: string
  ): Promise<{ success: boolean; error?: string; user?: any }> => {
    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: firstName,
            last_name: lastName || undefined,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Note: The database trigger automatically creates a 'customer' role
      // Non-customer roles (vendor, delivery_partner) can only be assigned by admins

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // Clear OTP verified user
    localStorage.removeItem('otp_verified_user');
    setUser(null);
    setSession(null);
  };

  // Login with OTP - set user directly without Supabase session
  const loginWithOtp = async (userId: string, email: string): Promise<boolean> => {
    try {
      // Get full profile using RPC
      const { data: profileData, error } = await supabase.rpc(
        'get_user_profile_for_otp' as any,
        { user_uuid: userId }
      );

      console.log('loginWithOtp profile:', { profileData, error });

      if (profileData && Array.isArray(profileData) && profileData.length > 0) {
        const profile = profileData[0];
        const userData: User = {
          id: profile.id,
          email: profile.email || email,
          name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || email,
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
          phone: profile.phone || undefined,
          avatarUrl: profile.avatar_url || undefined,
          role: (profile.user_role as UserRole) || 'customer',
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('otp_verified_user', JSON.stringify({
          email: email,
          userId: userId,
          verifiedAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        
        setUser(userData);
        return true;
      }
      return false;
    } catch (e) {
      console.error('loginWithOtp error:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        isAuthenticated: !!user, 
        isLoading,
        login, 
        signup, 
        logout,
        refreshUser,
        loginWithOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
