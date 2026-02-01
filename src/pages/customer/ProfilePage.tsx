import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Heart, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Settings,
  Gift
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

const menuItems = [
  { label: 'My Orders', href: '/orders', icon: Gift, description: 'View order history' },
  { label: 'Saved Addresses', href: '/addresses', icon: MapPin, description: 'Manage delivery addresses' },
  { label: 'Payment Methods', href: '/payments', icon: CreditCard, description: 'Cards & wallets' },
  { label: 'Favorites', href: '/favorites', icon: Heart, description: 'Your favorite restaurants' },
  { label: 'Notifications', href: '/notifications', icon: Bell, description: 'Alerts & updates' },
  { label: 'Settings', href: '/settings', icon: Settings, description: 'App preferences' },
  { label: 'Help & Support', href: '/help', icon: HelpCircle, description: 'FAQs & contact us' },
];

export function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 pt-12 pb-8">
        <FadeIn>
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/30"
            >
              <User className="w-10 h-10" />
            </motion.div>
            <div className="flex-1">
              {isAuthenticated ? (
                <>
                  <h1 className="text-xl font-bold">{user?.name || 'User'}</h1>
                  <p className="text-primary-foreground/80 text-sm">{user?.email}</p>
                  <p className="text-primary-foreground/60 text-xs mt-1">{user?.phone || '+1 234 567 890'}</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold">Welcome!</h1>
                  <p className="text-primary-foreground/80 text-sm">Sign in to get started</p>
                </>
              )}
            </div>
          </div>
          
          {!isAuthenticated && (
            <div className="mt-4 flex gap-3">
              <Link to="/login" className="flex-1">
                <Button variant="secondary" className="w-full font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button variant="outline" className="w-full font-semibold bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </FadeIn>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6">
        <FadeInStagger className="space-y-2" staggerDelay={0.05}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <FadeInStaggerItem key={item.href}>
                <Link to={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{item.label}</h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </Link>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>

        {/* Logout Button */}
        {isAuthenticated && (
          <FadeIn delay={0.3}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="w-full mt-6 flex items-center justify-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </motion.button>
          </FadeIn>
        )}

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          CloudKitchen v1.0.0
        </p>
      </div>

      <CustomerBottomNav />
    </div>
  );
}
