import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChefHat, ShoppingBag, Clock, Star, MapPin, ArrowRight, 
  Truck, Sparkles, Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeaturedStores } from '@/hooks/useCustomerData';
import { FadeIn, FadeInStagger, FadeInStaggerItem, GlowingBadge, HoverScale, FloatingElement } from '@/components/ui/animated-container';
import { MobileNav } from '@/components/MobileNav';
import { Skeleton } from '@/components/ui/skeleton';
import heroImage from '@/assets/hero-food.jpg';
import { ConnoisseurStackInteractor } from '@/components/ui/connoisseur-stack-interactor';

const benefits = [
  { icon: Clock, title: 'Fast Delivery', description: '20-35 min average' },
  { icon: Utensils, title: 'Fresh Food', description: 'Made in cloud kitchens' },
  { icon: Star, title: 'Top Rated', description: '4.8+ average rating' },
  { icon: Truck, title: 'Live Tracking', description: 'Real-time updates' },
];

const navLinks = [
  { label: 'Menu', href: '/menu' },
  { label: 'Kitchens', href: '#kitchens', isExternal: true },
  { label: 'How it Works', href: '#how-it-works', isExternal: true },
  { label: 'For Vendors', href: '/vendor/landing' },
];

export function CustomerLanding() {
  const { data: featuredStores, isLoading: storesLoading } = useFeaturedStores(6);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav"
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
            >
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">CloudKitchen</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/menu" className="text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
            <a href="#kitchens" className="text-muted-foreground hover:text-foreground transition-colors">Kitchens</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link to="/menu">
              <HoverScale>
                <Button variant="hero" className="btn-hover-lift">
                  Order Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </HoverScale>
            </Link>
          </div>

          <MobileNav 
            links={navLinks}
            secondaryButton={{ label: 'Sign In', href: '/login' }}
            ctaButton={{ label: 'Order Now', href: '/menu', icon: <ArrowRight className="w-4 h-4 mr-2" /> }}
          />
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 relative gradient-mesh">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement className="absolute top-40 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/5 rounded-full blur-3xl" />
          <FloatingElement className="absolute top-60 right-20 w-64 sm:w-96 h-64 sm:h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <FadeIn>
                <GlowingBadge className="mb-4 sm:mb-6 inline-flex">
                  <Sparkles className="w-4 h-4" />
                  Free delivery on first order
                </GlowingBadge>
              </FadeIn>
              
              <FadeIn delay={0.1}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight">
                  Delicious Food,
                  <br />
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Delivered Fast
                  </span>
                </h1>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Order from the best cloud kitchens near you. Fresh meals prepared by expert chefs, delivered to your doorstep.
                </p>
              </FadeIn>
              
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link to="/menu">
                    <HoverScale>
                      <Button variant="hero" size="lg" className="btn-hover-lift shadow-glow w-full sm:w-auto">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Browse Menu
                      </Button>
                    </HoverScale>
                  </Link>
                  <Link to="/signup">
                    <HoverScale>
                      <Button variant="outline" size="lg" className="btn-hover-lift border-2 w-full sm:w-auto">
                        Create Account
                      </Button>
                    </HoverScale>
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="grid grid-cols-2 gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border/50">
                  {benefits.slice(0, 2).map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs sm:text-sm">{benefit.title}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.3}>
              <div className="relative hidden sm:block">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-60" />
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative rounded-3xl overflow-hidden shadow-strong border border-border/50"
                >
                  <img 
                    src={heroImage} 
                    alt="Delicious food" 
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
                
                {/* Floating order card */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 p-3 sm:p-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-strong"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">Your order is on the way!</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Arriving in 15 mins</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Chef picks animated promo */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white text-foreground">
        <div className="container mx-auto">
          <FadeIn>
            <div className="mb-6 sm:mb-8 text-center">
              <span className="text-orange-400 font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">Chef Picks</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Signature stacks from our top kitchens</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">Hover to reveal categories and watch the grid animate in real time.</p>
            </div>
          </FadeIn>
          <div className="rounded-3xl border border-border/60 bg-card/90 shadow-2xl overflow-hidden">
            <ConnoisseurStackInteractor className="p-6 md:p-10 bg-transparent" />
          </div>
        </div>
      </section>

      {/* Featured Kitchens */}
      <section id="kitchens" className="py-12 sm:py-20 px-4 sm:px-6 bg-secondary/30">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-8 sm:mb-12">
              <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                Popular Kitchens
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Top Rated Cloud Kitchens</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Order from our highest-rated kitchens
              </p>
            </div>
          </FadeIn>

          {storesLoading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : !featuredStores || featuredStores.length === 0 ? (
            <FadeIn>
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No kitchens yet</h3>
                <p className="text-muted-foreground">Check back soon for amazing cloud kitchens</p>
              </div>
            </FadeIn>
          ) : (
            <FadeInStagger className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" staggerDelay={0.1}>
              {featuredStores.map(store => (
                <FadeInStaggerItem key={store.id}>
                  <Link to="/menu">
                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="group p-4 sm:p-6 rounded-2xl bg-card border-2 border-border/50 hover:border-primary/30 hover:shadow-strong transition-all"
                    >
                      {store.logo_url ? (
                        <img 
                          src={store.logo_url} 
                          alt={store.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover mb-4 sm:mb-5"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl gradient-primary flex items-center justify-center mb-4 sm:mb-5 group-hover:shadow-glow transition-shadow">
                          <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                        </div>
                      )}
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">{store.name}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1 sm:gap-1.5 bg-accent/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-accent fill-accent" />
                          <span className="font-semibold text-accent text-sm">{store.rating || 'New'}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground text-xs sm:text-sm">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>20-35 min</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          )}

          <FadeIn delay={0.4}>
            <div className="text-center mt-8 sm:mt-10">
              <Link to="/menu">
                <Button variant="outline" size="lg" className="border-2">
                  View All Kitchens
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4 block">
                How it Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Order in 3 Simple Steps</h2>
            </div>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8" staggerDelay={0.1}>
            {[
              { step: '01', title: 'Choose Kitchen', description: 'Browse our curated list of cloud kitchens', icon: ChefHat },
              { step: '02', title: 'Select Dishes', description: 'Add delicious items to your cart', icon: Utensils },
              { step: '03', title: 'Get Delivered', description: 'Relax while we deliver to you', icon: Truck },
            ].map((item, i) => (
              <FadeInStaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border/50 text-center"
                >
                  <span className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full gradient-primary text-primary-foreground text-xs sm:text-sm font-bold">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mt-3 sm:mt-4 mb-4 sm:mb-5">
                    <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <FadeIn>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-card/95 backdrop-blur-xl p-8 sm:p-12 md:p-16 text-center shadow-strong"
            >
              <div className="absolute inset-0 opacity-25">
                <motion.div 
                  animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                  transition={{ duration: 12, repeat: Infinity }}
                  className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-orange-400/25 rounded-full blur-3xl" 
                />
                <motion.div 
                  animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
                  transition={{ duration: 14, repeat: Infinity, delay: 1 }}
                  className="absolute bottom-0 right-1/4 w-52 sm:w-80 h-52 sm:h-80 bg-amber-300/20 rounded-full blur-3xl" 
                />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                  Hungry? Order Now!
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Get your favorites in minutes. Your first delivery is on us.
                </p>
                <Link to="/menu">
                  <HoverScale>
                    <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 shadow-strong">
                      Start Ordering
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
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border/50 bg-secondary/20">
        <div className="container mx-auto">
          <div className="flex flex-col gap-6 items-center text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <span className="text-lg sm:text-xl font-bold">CloudKitchen</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <Link to="/vendor/landing" className="hover:text-foreground transition-colors">For Vendors</Link>
              <Link to="/delivery/landing" className="hover:text-foreground transition-colors">Delivery Partners</Link>
              <Link to="/admin/landing" className="hover:text-foreground transition-colors">Admin</Link>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
            
            <div className="text-xs sm:text-sm text-muted-foreground">
              © 2024 CloudKitchen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
