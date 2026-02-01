import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bike, MapPin, Clock, Wallet, ArrowRight, 
  Shield, Star, TrendingUp, Check, Zap, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, FadeInStagger, FadeInStaggerItem, GlowingBadge, HoverScale, FloatingElement } from '@/components/ui/animated-container';
import { MobileNav } from '@/components/MobileNav';

const benefits = [
  {
    icon: Wallet,
    title: 'Earn More',
    description: 'Competitive pay per delivery with bonuses for peak hours.',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Work when you want. Set your own schedule.',
  },
  {
    icon: MapPin,
    title: 'Smart Routes',
    description: 'AI-optimized routes to maximize earnings.',
  },
  {
    icon: Shield,
    title: 'Insurance Coverage',
    description: 'Comprehensive insurance while on deliveries.',
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description: 'Get paid instantly after each delivery.',
  },
  {
    icon: Star,
    title: 'Rewards Program',
    description: 'Earn bonuses and unlock perks.',
  },
];

const stats = [
  { value: '5,000+', label: 'Active Partners' },
  { value: '₹25K+', label: 'Avg. Monthly' },
  { value: '98%', label: 'On-Time' },
  { value: '4.8★', label: 'Rating' },
];

const requirements = [
  'Valid driver\'s license',
  'Smartphone with GPS',
  'Clean background check',
  'Age 18 or above',
  'Knowledge of local area',
  'Reliable vehicle',
];

const navLinks = [
  { label: 'Benefits', href: '#benefits', isExternal: true },
  { label: 'Requirements', href: '#requirements', isExternal: true },
  { label: 'Customer Site', href: '/' },
];

export function DeliveryPartnerLanding() {
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
              <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            </motion.div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">CloudKitchen</span>
              <span className="text-xs text-primary font-semibold hidden sm:inline">Delivery Partner</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#benefits" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Benefits</a>
            <a href="#requirements" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Requirements</a>
            <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Customer Site</Link>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Link to="/delivery/login">
              <HoverScale>
                <Button variant="outline" className="border-amber-200 text-amber-800 font-semibold hover:bg-amber-50">
                  Login
                </Button>
              </HoverScale>
            </Link>
            <Link to="/delivery/signup">
              <HoverScale>
                <Button className="btn-hover-lift bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold shadow-[0_12px_28px_-16px_rgba(249,115,22,0.7)]">
                  <Bike className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
              </HoverScale>
            </Link>
          </div>

          <MobileNav 
            links={navLinks}
            secondaryButton={{ label: 'Login', href: '/delivery/login' }}
            ctaButton={{ label: 'Join Now', href: '/delivery/signup', icon: <Bike className="w-4 h-4 mr-2" /> }}
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
                <Bike className="w-4 h-4 text-amber-700" />
                <span className="font-semibold">Now Hiring Delivery Partners</span>
              </GlowingBadge>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight text-foreground">
                Earn on
                <br />
                <span className="text-amber-700">Your Schedule</span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-4">
                Join our network of delivery partners. Flexible hours, competitive pay, 
                and the freedom to be your own boss.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link to="/delivery/signup">
                  <HoverScale>
                    <Button size="lg" className="btn-hover-lift shadow-lg bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold w-full sm:w-auto">
                      <Bike className="w-5 h-5 mr-2" />
                      Become a Partner
                    </Button>
                  </HoverScale>
                </Link>
                <a href="#benefits">
                  <HoverScale>
                    <Button variant="outline" size="lg" className="btn-hover-lift border-2 border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold w-full sm:w-auto">
                      See Benefits
                    </Button>
                  </HoverScale>
                </a>
              </div>
            </FadeIn>
          </div>

          {/* Stats */}
          <FadeIn delay={0.4}>
            <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 sm:p-5 rounded-2xl bg-white border border-amber-100"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-amber-700 mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-foreground/70 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 sm:py-20 px-4 sm:px-6 bg-card">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                Partner Benefits
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Why Partner With Us?</h2>
              <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto font-medium">
                We value our delivery partners and provide the best support
              </p>
            </div>
          </FadeIn>
          
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" staggerDelay={0.08}>
            {benefits.map((benefit, i) => (
              <FadeInStaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-[0_18px_42px_-28px_rgba(249,115,22,0.45)] transition-all h-full"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3 sm:mb-4 border border-amber-100">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed font-medium">{benefit.description}</p>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="py-12 sm:py-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center lg:text-left">
                <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                  Get Started
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-foreground">What You Need</h2>
                <p className="text-base sm:text-lg text-foreground/70 mb-6 sm:mb-8 font-medium leading-relaxed">
                  Getting started is easy. Meet these basic requirements 
                  and start earning within 24 hours.
                </p>
                <Link to="/delivery/signup">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold shadow-[0_12px_32px_-18px_rgba(249,115,22,0.7)]">
                    <Bike className="w-5 h-5 mr-2" />
                    Apply Now
                  </Button>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {requirements.map((requirement, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-amber-100 hover:border-amber-300 transition-all"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-foreground">{requirement}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto max-w-4xl">
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
                  <Bike className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                  Ready to Start Earning?
                </h2>
                <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-lg mx-auto font-medium">
                  Join thousands of delivery partners earning on their own terms.
                </p>
                <Link to="/delivery/signup">
                  <HoverScale>
                    <Button size="lg" className="bg-white text-amber-800 hover:bg-white/90 font-semibold shadow-lg">
                      Join as Delivery Partner
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
                <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">CloudKitchen</span>
              <span className="text-xs text-amber-700 font-semibold hidden sm:inline">Delivery</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm">
              <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Customer Site</Link>
              <Link to="/vendor/landing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Vendor Portal</Link>
              <Link to="/admin/landing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Admin</Link>
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
