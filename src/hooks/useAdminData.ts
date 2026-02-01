import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Types
export interface VendorWithProfile extends Tables<'vendors'> {
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  stores_count?: number;
}

export interface DeliveryPartnerWithProfile extends Tables<'delivery_partners'> {
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface UserWithRole {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  role: string;
}

export interface PlatformStats {
  totalVendors: number;
  verifiedVendors: number;
  totalDeliveryPartners: number;
  activeDeliveryPartners: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalUsers: number;
}

// Fetch all vendors with their profiles
export function useVendors() {
  return useQuery({
    queryKey: ['admin', 'vendors'],
    queryFn: async () => {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each vendor
      const vendorsWithProfiles: VendorWithProfile[] = await Promise.all(
        (vendors || []).map(async (vendor) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('id', vendor.id)
            .single();

          const { count } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);

          return {
            ...vendor,
            profile: profile || undefined,
            stores_count: count || 0,
          };
        })
      );

      return vendorsWithProfiles;
    },
  });
}

// Fetch all delivery partners with their profiles
export function useDeliveryPartners() {
  return useQuery({
    queryKey: ['admin', 'delivery-partners'],
    queryFn: async () => {
      const { data: partners, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const partnersWithProfiles: DeliveryPartnerWithProfile[] = await Promise.all(
        (partners || []).map(async (partner) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('id', partner.id)
            .single();

          return {
            ...partner,
            profile: profile || undefined,
          };
        })
      );

      return partnersWithProfiles;
    },
  });
}

// Fetch all users with roles
export function useUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          return {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
            created_at: profile.created_at,
            role: roleData?.role || 'customer',
          };
        })
      );

      return usersWithRoles;
    },
  });
}

// Fetch platform statistics
export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [
        vendorsResult,
        deliveryPartnersResult,
        ordersResult,
        usersResult,
      ] = await Promise.all([
        supabase.from('vendors').select('is_verified'),
        supabase.from('delivery_partners').select('is_available, is_verified'),
        supabase.from('orders').select('status, total_amount'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const vendors = vendorsResult.data || [];
      const deliveryPartners = deliveryPartnersResult.data || [];
      const orders = ordersResult.data || [];

      const stats: PlatformStats = {
        totalVendors: vendors.length,
        verifiedVendors: vendors.filter(v => v.is_verified).length,
        totalDeliveryPartners: deliveryPartners.length,
        activeDeliveryPartners: deliveryPartners.filter(dp => dp.is_available && dp.is_verified).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
        totalRevenue: orders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        totalUsers: usersResult.count || 0,
      };

      return stats;
    },
  });
}

// Fetch recent orders
export function useRecentOrders(limit = 10) {
  return useQuery({
    queryKey: ['admin', 'recent-orders', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

// Mutation to verify vendor
export function useVerifyVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, verified }: { vendorId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('vendors')
        .update({ is_verified: verified })
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Mutation to verify delivery partner
export function useVerifyDeliveryPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, verified }: { partnerId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_verified: verified })
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Mutation to update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log('Starting role change:', { userId, newRole: role });
      
      // Update the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: role as 'customer' | 'vendor' | 'delivery_partner' | 'admin' })
        .eq('user_id', userId);

      if (roleError) {
        console.error('Role update error:', roleError);
        throw new Error(`Failed to update role: ${roleError.message}`);
      }

      console.log('Role updated successfully');

      // If changing to delivery_partner, create delivery_partners record if it doesn't exist
      if (role === 'delivery_partner') {
        console.log('Checking for existing delivery_partners record...');
        
        // Check if delivery_partners record already exists
        const { data: existing, error: checkError } = await supabase
          .from('delivery_partners')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking delivery_partners:', checkError);
          throw new Error(`Failed to check delivery partner: ${checkError.message}`);
        }

        if (!existing) {
          console.log('Creating new delivery_partners record...');
          
          const { error: partnerError } = await supabase
            .from('delivery_partners')
            .insert({
              id: userId,
              is_available: false,
              is_verified: false, // Needs verification
              rating: 0,
              vehicle_type: null,
              vehicle_number: null,
            });

          if (partnerError) {
            console.error('Delivery partner insert error:', partnerError);
            throw new Error(`Failed to create delivery partner: ${partnerError.message} (${partnerError.code})`);
          }
          
          console.log('Delivery partner record created successfully');
        } else {
          console.log('Delivery partner record already exists');
        }
      }

      // If changing to vendor, create vendors record if it doesn't exist
      if (role === 'vendor') {
        console.log('Checking for existing vendors record...');
        
        // Check if vendors record already exists
        const { data: existing, error: checkError } = await supabase
          .from('vendors')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking vendors:', checkError);
          throw new Error(`Failed to check vendor: ${checkError.message}`);
        }

        if (!existing) {
          console.log('Creating new vendors record...');
          
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert({
              id: userId,
              business_name: 'Pending Business Name', // User must update this
              is_verified: false, // Needs verification
            });

          if (vendorError) {
            console.error('Vendor insert error:', vendorError);
            throw new Error(`Failed to create vendor: ${vendorError.message} (${vendorError.code})`);
          }
          
          console.log('Vendor record created successfully');
        } else {
          console.log('Vendor record already exists');
        }
      }
    },
    onSuccess: () => {
      console.log('Role change complete, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}
