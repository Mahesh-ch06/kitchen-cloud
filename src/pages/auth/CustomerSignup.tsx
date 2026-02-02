import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Phone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sendWelcomeEmail, generateOTP, sendOTPEmail } from '@/lib/emailService';
import { supabase } from '@/integrations/supabase/client';

export function CustomerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendVerification = async () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    const otpCode = generateOTP();
    
    // Store OTP in Supabase database
    const { error: dbError } = await supabase
      .from('otp_verification')
      .insert([{ email: email, otp: otpCode }]);

    if (dbError) {
      console.error('DB Error:', dbError);
      toast({ title: 'Error', description: 'Failed to generate verification code.', variant: 'destructive' });
      return;
    }

    const result = await sendOTPEmail(email, otpCode, name || 'User');

    if (result.success) {
      setOtpSent(true);
      setCountdown(60);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast({ title: 'Verification code sent!', description: 'Check your email for the 6-digit code.' });
    } else {
      // Cleanup database if email failed
      await supabase.from('otp_verification').delete().eq('email', email).eq('otp', otpCode);
      toast({ title: 'Failed to send code', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationOtp || verificationOtp.length !== 6) {
      toast({ title: 'Invalid code', description: 'Please enter the 6-digit code.', variant: 'destructive' });
      return;
    }

    // Verify OTP from Supabase database
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('email', email)
      .eq('otp', verificationOtp)
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpData || otpData.length === 0) {
      toast({ title: 'Invalid code', description: 'The code is incorrect.', variant: 'destructive' });
      return;
    }

    // Check if OTP expired (10 minutes)
    const otpTime = new Date(otpData[0].created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - otpTime.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      await supabase.from('otp_verification').delete().eq('email', email);
      toast({ title: 'Code expired', description: 'Please request a new code.', variant: 'destructive' });
      return;
    }

    // Valid OTP - delete it and mark email as verified
    await supabase.from('otp_verification').delete().eq('email', email);
    setEmailVerified(true);
    toast({ title: 'Email verified!', description: 'You can now complete your registration.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailVerified) {
      toast({ title: 'Email not verified', description: 'Please verify your email first.', variant: 'destructive' });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    const result = await signup(email, password, name);
    
    if (result.success) {
      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, name).catch(err => {
        console.error('Failed to send welcome email:', err);
        // Don't block signup if email fails
      });
      
      toast({ 
        title: 'Account created!', 
        description: 'Welcome to CloudKitchen! You can now login with password or OTP.',
        duration: 5000,
      });
      navigate('/menu');
    } else {
      toast({ title: 'Signup failed', description: result.error || 'Please try again.', variant: 'destructive' });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create account</h1>
            <p className="text-muted-foreground">Sign up to start ordering from the best kitchens</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={emailVerified}
                  />
                </div>
                {!emailVerified && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerification}
                    disabled={!email || otpSent}
                    className="h-12"
                  >
                    {otpSent ? (countdown > 0 ? `${countdown}s` : 'Resend') : 'Verify'}
                  </Button>
                )}
                {emailVerified && (
                  <Button type="button" variant="outline" className="h-12 bg-green-50 text-green-600 border-green-200" disabled>
                    ✓ Verified
                  </Button>
                )}
              </div>
            </div>
            
            {otpSent && !emailVerified && (
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value)}
                      className="pl-10 h-12"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={verificationOtp.length !== 6}
                    className="h-12"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <p className="text-center mt-6 text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      
      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow">
            <ChefHat className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">Join CloudKitchen</h2>
          <p className="text-xl text-primary-foreground/80 max-w-sm">
            Discover amazing food from cloud kitchens near you
          </p>
        </div>
      </div>
    </div>
  );
}
