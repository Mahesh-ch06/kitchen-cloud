import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChefHat, BarChart3, Package, TrendingUp, ArrowRight, 
  ShoppingBag, Users, Sparkles, Check, MapPin, Clock, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, FadeInStagger, FadeInStaggerItem, GlowingBadge, HoverScale, FloatingElement } from '@/components/ui/animated-container';
import { MobileNav } from '@/components/MobileNav';

const features = [
  {
    icon: ShoppingBag,
    title: 'Order Management',
    description: 'Real-time order tracking and seamless kitchen workflow.',
  },
  {
    icon: Package,
    title: 'Inventory Control',
    description: 'Smart inventory with low-stock alerts and reorder suggestions.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Insights into sales, popular items, and revenue trends.',
  },
  {
    icon: TrendingUp,
    title: 'AI Forecasting',
    description: 'Predict demand patterns with machine learning.',
  },
  {
    icon: MapPin,
    title: 'Multi-Branch Support',
    description: 'Manage multiple locations from one dashboard.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Assign roles and track performance metrics.',
  },
];

const stats = [
  { value: '500+', label: 'Active Kitchens' },
  { value: '2M+', label: 'Orders Processed' },
  { value: '35%', label: 'Avg Revenue Increase' },
  { value: '98%', label: 'Uptime' },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    description: 'Perfect for small cloud kitchens',
    features: ['1 Kitchen Location', 'Up to 500 orders/month', 'Basic Analytics', 'Email Support'],
  },
  {
    name: 'Professional',
    price: '$149',
    description: 'For growing kitchen businesses',
    features: ['Up to 5 Locations', 'Unlimited Orders', 'Advanced Analytics', 'AI Forecasting', 'Priority Support'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large-scale operations',
    features: ['Unlimited Locations', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'API Access'],
  },
];

const navLinks = [
  { label: 'Features', href: '#features', isExternal: true },
  { label: 'Pricing', href: '#pricing', isExternal: true },
  { label: 'Customer Site', href: '/' },
];

export function VendorLanding() {
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
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            </motion.div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">CloudKitchen</span>
              <span className="text-xs text-primary font-semibold hidden sm:inline">for Vendors</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Features</a>
            <a href="#pricing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Pricing</a>
            <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Customer Site</Link>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Link to="/vendor/login">
              <Button variant="ghost" className="font-medium text-amber-800 hover:bg-amber-50">Sign In</Button>
            </Link>
            <Link to="/vendor/login">
              <HoverScale>
                <Button className="btn-hover-lift bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold shadow-[0_12px_28px_-16px_rgba(249,115,22,0.7)]">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </HoverScale>
            </Link>
          </div>

          <MobileNav 
            links={navLinks}
            secondaryButton={{ label: 'Sign In', href: '/vendor/login' }}
            ctaButton={{ label: 'Get Started', href: '/vendor/login', icon: <ArrowRight className="w-4 h-4 mr-2" /> }}
          />
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 relative bg-gradient-to-b from-amber-50 via-orange-50/70 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement className="absolute top-40 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-amber-200/40 rounded-full blur-3xl" />
          <FloatingElement className="absolute top-60 right-20 w-64 sm:w-96 h-64 sm:h-96 bg-orange-200/40 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <FadeIn>
            <GlowingBadge className="mb-6 sm:mb-8 bg-amber-100 border-amber-200 text-amber-800 inline-flex">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span className="font-semibold">Trusted by 500+ Cloud Kitchens</span>
            </GlowingBadge>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight text-foreground">
              Manage Your
              <br />
              <span className="text-amber-700">Cloud Kitchen</span>
              <br />
              Like a Pro
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-foreground/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-4">
              The all-in-one platform for cloud kitchen operations. Streamline orders, manage inventory, 
              and grow your business.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/vendor/login">
                <HoverScale>
                  <Button size="lg" className="btn-hover-lift shadow-lg bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 font-semibold w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </HoverScale>
              </Link>
              <a href="#features">
                <HoverScale>
                  <Button variant="outline" size="lg" className="btn-hover-lift border-2 border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold w-full sm:w-auto">
                    See Features
                  </Button>
                </HoverScale>
              </a>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={0.4}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-border">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -4 }}
                  className="text-center p-3 sm:p-4 rounded-xl bg-card/50 border border-border/50"
                >
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-700">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/70 mt-1 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 bg-card">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Everything You Need to Succeed</h2>
              <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto font-medium">
                Powerful tools designed for cloud kitchen operations
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

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 bg-background">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Simple, Transparent Pricing</h2>
              <p className="text-base sm:text-lg text-foreground/70 max-w-xl mx-auto font-medium">
                Start free for 14 days. No credit card required.
              </p>
            </div>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
            {pricingPlans.map((plan, i) => (
              <FadeInStaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all h-full flex flex-col ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white border-amber-400 shadow-[0_22px_60px_-30px_rgba(249,115,22,0.55)]' 
                      : 'bg-white border-amber-100 hover:border-amber-300'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-md">
                      Most Popular
                    </span>
                  )}
                  <div className="mb-4 sm:mb-6">
                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>{plan.name}</h3>
                    <p className={`text-xs sm:text-sm font-medium ${plan.popular ? 'text-primary-foreground/80' : 'text-foreground/70'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-4 sm:mb-6">
                    <span className={`text-3xl sm:text-4xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.price}</span>
                    {plan.price !== 'Custom' && <span className={`text-sm font-medium ${plan.popular ? 'text-white/85' : 'text-foreground/70'}`}>/month</span>}
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs sm:text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-amber-700'}`} />
                        <span className={`font-medium ${plan.popular ? 'text-white/90' : 'text-foreground/80'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/vendor/login" className="mt-auto">
                    <Button 
                      className={`w-full font-semibold ${plan.popular ? 'bg-white text-amber-800 hover:bg-white/90' : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500'}`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
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
                <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                  Ready to Grow Your Kitchen?
                </h2>
                <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-lg mx-auto font-medium">
                  Join hundreds of successful cloud kitchens already using our platform.
                </p>
                <Link to="/vendor/login">
                  <HoverScale>
                    <Button size="lg" className="bg-white text-amber-800 hover:bg-white/90 font-semibold shadow-lg">
                      Start Free Trial
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
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">CloudKitchen</span>
              <span className="text-xs text-amber-700 font-semibold hidden sm:inline">for Vendors</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm">
              <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Customer Site</Link>
              <Link to="/admin/landing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Admin</Link>
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
