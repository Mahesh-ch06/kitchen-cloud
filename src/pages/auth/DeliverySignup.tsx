import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Phone, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function DeliverySignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (!acceptTerms) {
      toast({ title: 'Please accept the terms and conditions', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create user account
      const result = await signup(email, password, name);
      
      if (!result.success || !result.user) {
        toast({ title: 'Signup failed', description: result.error || 'Please try again.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Update the auto-created customer role to delivery_partner
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'delivery_partner' })
        .eq('user_id', result.user.id);

      if (roleError) {
        console.error('Error updating to delivery partner role:', roleError);
        toast({ title: 'Error', description: 'Failed to set delivery partner role', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Create delivery_partners record
      const { error: partnerError } = await supabase
        .from('delivery_partners')
        .insert({
          id: result.user.id,
          vehicle_type: vehicleType || null,
          vehicle_number: licenseNumber || null,
          is_available: false, // Not available until verified by admin
          is_verified: false,
          rating: 0,
        });

      if (partnerError) {
        console.error('Error creating delivery partner:', partnerError);
        toast({ title: 'Error', description: 'Failed to create delivery partner record', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Update profile with phone
      if (phone) {
        const { error: phoneError } = await supabase
          .from('profiles')
          .update({ phone })
          .eq('id', result.user.id);
        
        if (phoneError) {
          console.error('Error updating phone:', phoneError);
        }
      }

      // Sign out the user immediately after signup so they must login
      await supabase.auth.signOut();

      // Invalidate admin queries to show the new delivery partner immediately
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

      toast({ 
        title: 'Application submitted!', 
        description: 'Your delivery partner account has been created. Please login to continue. An admin will verify your account before you can start accepting deliveries.' 
      });
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        navigate('/delivery/login');
      }, 1000);
    } catch (error: any) {
      toast({ title: 'Signup failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/delivery/landing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to landing
          </Link>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Become a Delivery Partner</h1>
            <p className="text-muted-foreground">Join our network and start earning today</p>
          </div>
          
          {/* Security Notice */}
          <div className="p-4 rounded-lg bg-accent/50 border border-border mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Application Process:</strong> After signing up, your application will be reviewed by our team. 
                Once verified, your account will be upgraded to delivery partner status.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="vehicleType"
                    type="text"
                    placeholder="e.g., Bike, Scooter"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="licenseNumber"
                    type="text"
                    placeholder="DL Number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  minLength={8}
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

            <div className="flex items-start gap-3 pt-2">
              <Checkbox 
                id="terms" 
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link to="#" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="#" className="text-primary hover:underline">Partner Agreement</Link>
              </Label>
            </div>
            
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Submitting application...' : 'Apply Now'}
            </Button>
          </form>
          
          <p className="text-center mt-6 text-muted-foreground">
            Already a partner?{' '}
            <Link to="/delivery/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      
      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 to-teal-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Join Our Fleet</h2>
          <p className="text-xl text-white/80 max-w-sm mb-8">
            Be your own boss and earn on your own schedule
          </p>
          
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              { title: 'Flexible Hours', desc: 'Work when you want' },
              { title: 'Weekly Payments', desc: 'Get paid every week' },
              { title: 'Insurance Coverage', desc: 'Stay protected on the road' },
              { title: 'Growth Opportunities', desc: 'Earn more with incentives' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{i + 1}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
