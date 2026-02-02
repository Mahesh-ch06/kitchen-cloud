import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, ArrowLeft, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FadeIn, HoverScale, FloatingElement } from '@/components/ui/animated-container';
import { generateOTP, sendOTPEmail, storeOTP, verifyOTP } from '@/lib/emailService';
import { supabase } from '@/integrations/supabase/client';

export function CustomerLogin() {
  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(email, password, 'customer');
    
    if (result.success) {
      toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      navigate('/menu');
    } else {
      toast({ title: 'Login failed', description: result.error || 'Please check your credentials.', variant: 'destructive' });
    }
    
    setIsLoading(false);
  };

  const handleSendOTP = async () => {
    if (!otpEmail || !otpEmail.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsOtpLoading(true);

    try {
      // Generate OTP
      const otpCode = generateOTP();
      
      // Store OTP in Supabase database
      const { error: dbError } = await supabase
        .from('otp_verification')
        .insert([{ email: otpEmail, otp: otpCode }]);

      if (dbError) {
        console.error('DB Error:', dbError);
        toast({ title: 'Error', description: 'Failed to generate OTP. Please try again.', variant: 'destructive' });
        setIsOtpLoading(false);
        return;
      }

      // Send OTP via EmailJS
      const result = await sendOTPEmail(otpEmail, otpCode, 'Customer');

      if (result.success) {
        setOtpSent(true);
        setCountdown(60);
        
        // Start countdown
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({ 
          title: 'OTP sent!', 
          description: `Check your email (${otpEmail}) for the 6-digit verification code.` 
        });
      } else {
        // Cleanup database if email failed
        await supabase.from('otp_verification').delete().eq('email', otpEmail).eq('otp', otpCode);
        toast({ title: 'Failed to send OTP', description: 'Please try again later.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({ title: 'Error', description: 'Failed to send OTP. Please try again.', variant: 'destructive' });
    }

    setIsOtpLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit code.', variant: 'destructive' });
      return;
    }

    setIsOtpLoading(true);

    try {
      // Verify OTP from Supabase database
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verification')
        .select('*')
        .eq('email', otpEmail)
        .eq('otp', otp)
        .order('created_at', { ascending: false })
        .limit(1);

      if (otpError || !otpData || otpData.length === 0) {
        toast({ 
          title: 'Invalid OTP', 
          description: 'The code you entered is incorrect.', 
          variant: 'destructive' 
        });
        setIsOtpLoading(false);
        return;
      }

      // Check if OTP expired (10 minutes)
      const otpTime = new Date(otpData[0].created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - otpTime.getTime()) / (1000 * 60);

      if (diffMinutes > 10) {
        // Delete expired OTP
        await supabase.from('otp_verification').delete().eq('email', otpEmail);
        toast({ 
          title: 'OTP Expired', 
          description: 'This code has expired. Please request a new one.', 
          variant: 'destructive' 
        });
        setIsOtpLoading(false);
        return;
      }

      // OTP is valid! Get user data
      const { data: userData } = await supabase.rpc(
        'verify_user_for_otp' as any,
        { email_to_verify: otpEmail }
      );

      if (userData && Array.isArray(userData) && userData.length > 0 && userData[0].user_exists) {
        const userId = userData[0].user_id;
        
        // Delete used OTP
        await supabase.from('otp_verification').delete().eq('email', otpEmail);
        
        // Login user using AuthContext
        const success = await loginWithOtp(userId, otpEmail);

        if (success) {
          toast({ 
            title: 'Welcome back!', 
            description: 'You have successfully logged in with OTP.',
          });
          navigate('/menu');
        } else {
          toast({ 
            title: 'Login failed', 
            description: 'Could not load your profile. Please try password login.',
            variant: 'destructive'
          });
        }
      } else {
        toast({ 
          title: 'Account not found', 
          description: 'No account found with this email. Please sign up first.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({ title: 'Verification failed', description: 'Please try again.', variant: 'destructive' });
    }

    setIsOtpLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-10 transition-colors group">
            <motion.span whileHover={{ x: -4 }}>
              <ArrowLeft className="w-4 h-4" />
            </motion.span>
            Back to home
          </Link>
          
          <FadeIn delay={0.1}>
            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-3 tracking-tight">Welcome back</h1>
              <p className="text-lg text-muted-foreground">Sign in to your account to continue ordering</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="password" className="text-base">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="otp" className="text-base">
                  <KeyRound className="w-4 h-4 mr-2" />
                  OTP
                </TabsTrigger>
              </TabsList>

              {/* Password Login Tab */}
              <TabsContent value="password">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 rounded-xl border-2 border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-base font-medium">Password</Label>
                      <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 rounded-xl border-2 border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <HoverScale>
                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      className="w-full h-14 text-base font-semibold rounded-xl shadow-glow" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Signing in...
                        </motion.span>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </HoverScale>
                </form>
              </TabsContent>

              {/* OTP Login Tab */}
              <TabsContent value="otp">
                <div className="space-y-6">
                  {!otpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp-email" className="text-base font-medium">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            id="otp-email"
                            type="email"
                            placeholder="Enter your email"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            className="pl-12 h-14 rounded-xl border-2 border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all text-base"
                            required
                          />
                        </div>
                      </div>
                      
                      <HoverScale>
                        <Button
                          onClick={handleSendOTP}
                          disabled={isOtpLoading}
                          variant="hero"
                          size="lg"
                          className="w-full h-14 text-base font-semibold rounded-xl shadow-glow"
                        >
                          {isOtpLoading ? 'Sending OTP...' : 'Send OTP'}
                        </Button>
                      </HoverScale>
                    </>
                  ) : (
                    <>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                        <p className="text-foreground">
                          We've sent a 6-digit code to <strong>{otpEmail}</strong>
                        </p>
                        <p className="text-muted-foreground mt-1">Check your inbox and enter the code below</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="otp-code" className="text-base font-medium">Enter OTP</Label>
                        <div className="relative group">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            id="otp-code"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="pl-12 h-14 rounded-xl border-2 border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all text-center tracking-widest text-2xl font-bold"
                            maxLength={6}
                            required
                          />
                        </div>
                      </div>

                      <HoverScale>
                        <Button
                          onClick={handleVerifyOTP}
                          disabled={isOtpLoading || otp.length !== 6}
                          variant="hero"
                          size="lg"
                          className="w-full h-14 text-base font-semibold rounded-xl shadow-glow"
                        >
                          {isOtpLoading ? 'Verifying...' : 'Verify & Sign In'}
                        </Button>
                      </HoverScale>

                      <div className="flex items-center justify-between text-sm">
                        <button
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Change email
                        </button>
                        <button
                          onClick={handleSendOTP}
                          disabled={countdown > 0 || isOtpLoading}
                          className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <p className="text-center mt-8 text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
            </p>
          </FadeIn>
        </motion.div>
      </div>
      
      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <FloatingElement className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-10 shadow-glow"
          >
            <ChefHat className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <h2 className="text-5xl font-bold text-primary-foreground mb-6">CloudKitchen</h2>
          <p className="text-xl text-primary-foreground/80 max-w-sm leading-relaxed">
            Order from the best cloud kitchens in your area
          </p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-3 text-primary-foreground/60"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">AI-powered recommendations</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
