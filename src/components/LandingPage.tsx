import { ChefHat, ShoppingBag, Users, TrendingUp, Truck, BarChart3, Sparkles, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FadeIn, FadeInStagger, FadeInStaggerItem, GlowingBadge, HoverScale, FloatingElement } from '@/components/ui/animated-container';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import heroImage from '@/assets/hero-food.jpg';

const features = [
  {
    icon: ShoppingBag,
    title: 'Smart Orders',
    description: 'Real-time order management with live status tracking and notifications',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: ChefHat,
    title: 'Kitchen Operations',
    description: 'Streamline kitchen workflows with automated inventory and recipe management',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: TrendingUp,
    title: 'AI Forecasting',
    description: 'Predict demand patterns and optimize stock levels with machine learning',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Truck,
    title: 'Delivery Tracking',
    description: 'Real-time delivery tracking with route optimization and ETA updates',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Comprehensive insights into sales, performance, and growth metrics',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Users,
    title: 'Multi-Branch',
    description: 'Manage multiple kitchen locations from a single unified dashboard',
    gradient: 'from-pink-500 to-rose-500',
  },
];

const stats = [
  { value: '500+', label: 'Cloud Kitchens', icon: ChefHat },
  { value: '2M+', label: 'Orders Processed', icon: ShoppingBag },
  { value: '98%', label: 'Uptime', icon: Sparkles },
  { value: '4.9', label: 'User Rating', icon: Star },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
            >
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight">CloudKitchen</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Pricing'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link to="/signup">
              <HoverScale>
                <Button variant="hero" className="btn-hover-lift">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </HoverScale>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative gradient-mesh">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement className="absolute top-40 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <FloatingElement className="absolute top-60 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <FadeIn>
            <GlowingBadge className="mb-8">
              <Sparkles className="w-4 h-4" />
              Now with AI-powered demand forecasting
            </GlowingBadge>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight">
              Manage Your
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Cloud Kitchen</span>
              <br />
              Like Never Before
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              The complete platform for cloud kitchen operations. From orders to inventory, 
              delivery to analytics – everything you need in one place.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <HoverScale>
                  <Button variant="hero" size="xl" className="btn-hover-lift shadow-glow">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </HoverScale>
              </Link>
              <Link to="/menu">
                <HoverScale>
                  <Button variant="outline" size="xl" className="btn-hover-lift border-2">
                    Browse Menu
                  </Button>
                </HoverScale>
              </Link>
            </div>
          </FadeIn>
          
          {/* Hero Image */}
          <FadeIn delay={0.4}>
            <div className="mt-16 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <motion.div 
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative rounded-2xl overflow-hidden shadow-strong border border-border/50"
              >
                <img 
                  src={heroImage} 
                  alt="Delicious food from cloud kitchens" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </motion.div>
              
              {/* Floating badges */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-strong"
              >
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2.5 h-2.5 rounded-full bg-success" 
                    />
                  </div>
                  <span className="font-medium">Free 14-day trial</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="w-2.5 h-2.5 rounded-full bg-success" 
                    />
                  </div>
                  <span className="font-medium">No credit card required</span>
                </div>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="container mx-auto px-6 relative z-10">
          <FadeInStagger className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <FadeInStaggerItem key={i}>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30"
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-muted-foreground mt-2 font-medium">{stat.label}</div>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 px-6 relative">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="container mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-20">
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block"
              >
                Features
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything You Need</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed specifically for cloud kitchen operations
              </p>
            </div>
          </FadeIn>
          
          <FadeInStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
            {features.map((feature, i) => (
              <FadeInStaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-strong transition-all duration-300 h-full"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:shadow-lg transition-shadow`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-28 px-6">
        <div className="container mx-auto">
          <FadeIn>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="rounded-3xl gradient-dark p-12 md:p-20 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-20">
                <motion.div 
                  animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" 
                />
                <motion.div 
                  animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
                  transition={{ duration: 12, repeat: Infinity }}
                  className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" 
                />
              </div>
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow"
                >
                  <ChefHat className="w-10 h-10 text-primary-foreground" />
                </motion.div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                  Ready to Transform
                  <br />
                  Your Kitchen?
                </h2>
                <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
                  Join hundreds of cloud kitchens already using our platform to grow their business.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/signup">
                    <HoverScale>
                      <Button variant="hero" size="xl" className="bg-background text-foreground hover:bg-background/90 shadow-strong">
                        Start Free Trial
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </HoverScale>
                  </Link>
                  <Link to="/vendor/login">
                    <HoverScale>
                      <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                        Vendor Login
                      </Button>
                    </HoverScale>
                  </Link>
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border/50 bg-secondary/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CloudKitchen</span>
            </motion.div>
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              {['Privacy', 'Terms', 'Contact'].map((item) => (
                <a key={item} href="#" className="hover:text-foreground transition-colors relative group">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
              <Link to="/admin/login" className="hover:text-foreground transition-colors relative group">
                Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2024 CloudKitchen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
