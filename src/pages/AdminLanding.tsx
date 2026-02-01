import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, BarChart3, Users, Store, ArrowRight, 
  Activity, Lock, Bell, Sparkles, Check, Settings, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, FadeInStagger, FadeInStaggerItem, GlowingBadge, HoverScale, FloatingElement } from '@/components/ui/animated-container';
import { MobileNav } from '@/components/MobileNav';

const features = [
  {
    icon: Store,
    title: 'Vendor Management',
    description: 'Approve, monitor, and manage all registered cloud kitchen vendors.',
  },
  {
    icon: Users,
    title: 'User Administration',
    description: 'Full control over user accounts, roles, and permissions.',
  },
  {
    icon: BarChart3,
    title: 'Platform Analytics',
    description: 'Comprehensive insights into platform performance and growth.',
  },
  {
    icon: Bell,
    title: 'Alert System',
    description: 'Real-time notifications for vendor registrations and issues.',
  },
  {
    icon: Lock,
    title: 'Security Controls',
    description: 'Advanced security settings and audit logs.',
  },
  {
    icon: Database,
    title: 'Data Management',
    description: 'Export reports and maintain system integrity.',
  },
];

const capabilities = [
  'Approve & manage vendor accounts',
  'Monitor platform-wide analytics',
  'Configure system settings',
  'Manage user roles & permissions',
  'View audit logs & security events',
  'Generate financial reports',
  'Handle support escalations',
  'Configure notification rules',
];

const navLinks = [
  { label: 'Features', href: '#features', isExternal: true },
  { label: 'Capabilities', href: '#capabilities', isExternal: true },
  { label: 'Customer Site', href: '/' },
];

export function AdminLanding() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-amber-100"
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200"
            >
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            </motion.div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">CloudKitchen</span>
              <span className="text-xs text-primary font-semibold hidden sm:inline">Admin Portal</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Features</a>
            <a href="#capabilities" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Capabilities</a>
            <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Customer Site</Link>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Link to="/admin/login">
              <HoverScale>
                <Button className="btn-hover-lift bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold shadow-[0_12px_28px_-16px_rgba(249,115,22,0.7)]">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </HoverScale>
            </Link>
          </div>

          <MobileNav 
            links={navLinks}
            ctaButton={{ label: 'Admin Login', href: '/admin/login', icon: <Shield className="w-4 h-4 mr-2" /> }}
          />
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 relative bg-gradient-to-b from-amber-50 via-orange-50/70 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement className="absolute top-40 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-amber-200/40 rounded-full blur-3xl" />
          <FloatingElement className="absolute top-60 right-20 w-64 sm:w-96 h-64 sm:h-96 bg-orange-200/40 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <GlowingBadge className="mb-6 sm:mb-8 bg-amber-100 border-amber-200 text-amber-800 inline-flex">
                <Shield className="w-4 h-4 text-amber-700" />
                <span className="font-semibold">Administrative Access Required</span>
              </GlowingBadge>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight text-foreground">
                Platform
                <br />
                <span className="text-amber-700">Administration</span>
                <br />
                Center
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-4">
                Complete oversight and control of the CloudKitchen ecosystem. Manage vendors, 
                users, and platform operations.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link to="/admin/login">
                  <HoverScale>
                    <Button size="lg" className="btn-hover-lift shadow-lg bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold w-full sm:w-auto">
                      <Shield className="w-5 h-5 mr-2" />
                      Access Admin Panel
                    </Button>
                  </HoverScale>
                </Link>
                <a href="#features">
                  <HoverScale>
                    <Button variant="outline" size="lg" className="btn-hover-lift border-2 border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold w-full sm:w-auto">
                      Learn More
                    </Button>
                  </HoverScale>
                </a>
              </div>
            </FadeIn>

            {/* Security Note */}
            <FadeIn delay={0.4}>
              <div className="mt-10 sm:mt-12 p-4 sm:p-5 rounded-2xl bg-white/90 border border-amber-100 max-w-xl mx-auto shadow-[0_18px_48px_-32px_rgba(249,115,22,0.35)]">
                <div className="flex items-start sm:items-center gap-3 text-sm">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                  </div>
                  <p className="text-foreground/80 text-left font-medium text-xs sm:text-sm">
                    <span className="font-bold text-foreground">Secure Access:</span> Admin credentials are required. 
                    Contact your system administrator for access.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 bg-card">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                Admin Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Powerful Management Tools</h2>
              <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto font-medium">
                Everything you need to oversee and manage the platform
              </p>
            </div>
          </FadeIn>
          
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" staggerDelay={0.08}>
            {features.map((feature, i) => (
              <FadeInStaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-[0_18px_42px_-28px_rgba(249,115,22,0.45)] transition-all h-full"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3 sm:mb-4 border border-amber-100">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed font-medium">{feature.description}</p>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-12 sm:py-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center lg:text-left">
                <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                  Capabilities
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-foreground">Full Platform Control</h2>
                <p className="text-base sm:text-lg text-foreground/70 mb-6 sm:mb-8 font-medium leading-relaxed">
                  As an administrator, you have complete oversight of the CloudKitchen platform. 
                  Monitor operations, manage users, and ensure smooth performance.
                </p>
                <Link to="/admin/login">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold shadow-[0_12px_32px_-18px_rgba(249,115,22,0.7)]">
                    <Shield className="w-5 h-5 mr-2" />
                    Access Dashboard
                  </Button>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {capabilities.map((capability, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-amber-100 hover:border-amber-300 transition-all"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-foreground">{capability}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-card">
        <div className="container mx-auto">
          <FadeIn>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-[0_28px_80px_-40px_rgba(249,115,22,0.6)]"
            >
              <div className="absolute inset-0 opacity-25">
                <motion.div 
                  animate={{ x: [0, 50, 0] }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl" 
                />
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-white/30">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                  Administrative Access
                </h2>
                <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-lg mx-auto font-medium">
                  Secure login required. Only authorized administrators can access.
                </p>
                <Link to="/admin/login">
                  <HoverScale>
                    <Button size="lg" className="bg-white text-amber-800 hover:bg-white/90 font-semibold shadow-lg">
                      Login to Admin Panel
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </HoverScale>
                </Link>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border bg-background">
        <div className="container mx-auto">
          <div className="flex flex-col gap-6 items-center text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">CloudKitchen</span>
              <span className="text-xs text-amber-700 font-semibold hidden sm:inline">Admin</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm">
              <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Customer Site</Link>
              <Link to="/vendor/landing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Vendor Portal</Link>
              <Link to="/delivery/landing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Delivery</Link>
              <a href="#" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Privacy</a>
            </div>
            
            <div className="text-xs sm:text-sm text-foreground/60 font-medium">
              © 2024 CloudKitchen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
