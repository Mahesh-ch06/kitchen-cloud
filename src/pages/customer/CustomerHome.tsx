import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Search, MapPin, ChevronDown, User, Bell,
  Clock, Star, Heart, Zap, ShieldCheck,
  Pizza, IceCream, Cake, Sandwich, Salad, Coffee, Soup, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from '@/contexts/LocationContext';
import { useStores, useMenuItems } from '@/hooks/useCustomerData';
import { FadeIn, FadeInStagger, FadeInStaggerItem, HoverScale } from '@/components/ui/animated-container';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { formatPrice } from '@/lib/currency';
import { calculateDistance, formatDistance, isFastDelivery, estimateDeliveryTime } from '@/lib/distance';
import { ConnoisseurStackInteractor } from '@/components/ui/connoisseur-stack-interactor';

// Food categories with icons
const foodCategories = [
  { name: 'Pizzas', icon: Pizza, color: 'bg-orange-100 dark:bg-orange-900/30' },
  { name: 'Biryani', icon: Soup, color: 'bg-amber-100 dark:bg-amber-900/30' },
  { name: 'Ice Cream', icon: IceCream, color: 'bg-pink-100 dark:bg-pink-900/30' },
  { name: 'Cakes', icon: Cake, color: 'bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Burgers', icon: Sandwich, color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { name: 'Salads', icon: Salad, color: 'bg-green-100 dark:bg-green-900/30' },
  { name: 'Coffee', icon: Coffee, color: 'bg-brown-100 dark:bg-stone-900/30' },
];

const curatedCollections = [
  {
    title: 'Under ₹199',
    subtitle: 'Budget bites near you',
    gradient: 'from-emerald-500 to-green-600',
    pill: 'Saver picks',
  },
  {
    title: '15 min delivery',
    subtitle: 'Bolt menu, piping hot',
    gradient: 'from-orange-500 to-amber-500',
    pill: 'Lightning fast',
  },
  {
    title: 'Top rated',
    subtitle: '4.5★ and above',
    gradient: 'from-indigo-500 to-purple-500',
    pill: 'Chef favourites',
  },
  {
    title: 'Pure veg',
    subtitle: 'Handpicked veg spots',
    gradient: 'from-emerald-600 to-lime-500',
    pill: 'Certified veg',
  },
];

const assuranceCards = [
  { title: 'Live tracking', desc: 'Track your rider in real time', icon: MapPin },
  { title: 'Hygiene first', desc: 'Kitchens with safety audits', icon: ShieldCheck },
  { title: 'On-time promise', desc: 'Or we make it right', icon: Clock },
];

export function CustomerHome() {
  const { user } = useAuth();
  const { itemCount, cart } = useCart();
  const { location, openLocationModal } = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);
  const [dealCountdown, setDealCountdown] = useState({ hours: 0, minutes: 41, seconds: 48 });

  // Fetch real data
  const { data: stores, isLoading: storesLoading } = useStores();
  const { data: allMenuItems } = useMenuItems(null);

  // Open location modal if no location is set
  useEffect(() => {
    if (!location) {
      openLocationModal();
    }
  }, [location, openLocationModal]);

  // Deal countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDealCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCategoryClick = (category: string) => {
    navigate(`/menu?category=${encodeURIComponent(category)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Get featured deals from menu items
  const dealItems = (allMenuItems || [])
    .filter(item => item.is_available)
    .slice(0, 6)
    .map(item => ({
      ...item,
      originalPrice: Math.round(Number(item.price) * 1.3),
      discountedPrice: Number(item.price),
    }));

  return (
    <div className="min-h-screen bg-background pb-safe-area-bottom">
      {/* Header - cleaner, airy */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="px-4 py-3 space-y-3">
          {/* Location Row */}
          <div className="flex items-center justify-between">
            <button onClick={openLocationModal} className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    {location ? location.area || 'Home' : 'Set location'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {location ? location.address : 'Tap to choose delivery address'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
                  <Bell className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" size="icon" className="rounded-full border-border">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Row */}
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for biryani, pizza, salads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border border-border/70 bg-card shadow-sm focus:bg-card"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/70 bg-card shadow-sm">
              <span className="text-xs font-semibold text-success">VEG</span>
              <Switch
                checked={vegOnly}
                onCheckedChange={setVegOnly}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </form>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Hero Banner */}
        <FadeIn>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="relative rounded-3xl bg-gradient-to-r from-primary to-emerald-500 p-6 overflow-hidden shadow-xl shadow-primary/25"
          >
            <div className="absolute inset-0 opacity-20 bg-white/30 blur-3xl" />
            <div className="relative z-10 grid gap-4 sm:grid-cols-[2fr,1fr] sm:items-center">
              <div className="space-y-2">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-[0.08em]">CloudKitchen+</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Meals you love, delivered faster.</h2>
                <p className="text-white/85 text-sm max-w-xl">Trending picks from top-rated kitchens with live tracking and on-time promise.</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 text-xs font-semibold bg-white/15 text-white rounded-full border border-white/20">Free delivery above ₹199</span>
                  <span className="px-3 py-1 text-xs font-semibold bg-white/15 text-white rounded-full border border-white/20">Fast delivery under 3km</span>
                  <span className="px-3 py-1 text-xs font-semibold bg-white/15 text-white rounded-full border border-white/20">Hygiene audits</span>
                </div>
              </div>
              <div className="flex sm:justify-end">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full font-semibold px-6 shadow-lg">
                  Browse menu
                </Button>
              </div>
            </div>
          </motion.div>
        </FadeIn>

        {/* Collections slider */}
        <FadeIn delay={0.1}>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {curatedCollections.map((collection, i) => (
              <motion.div
                key={collection.title}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-shrink-0 min-w-[200px] rounded-2xl p-4 text-white shadow-lg bg-gradient-to-r ${collection.gradient}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-white/80">{collection.pill}</p>
                    <p className="text-lg font-bold leading-tight">{collection.title}</p>
                    <p className="text-sm text-white/85 mt-1">{collection.subtitle}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/25" />
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* Quick filters */}
        <FadeIn delay={0.15}>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button variant="outline" size="sm" className="rounded-full border-border/70 flex-shrink-0 gap-2">
              <Star className="w-4 h-4 text-amber-500" /> 4.5★+
            </Button>
            <Button 
              variant={fastDeliveryOnly ? "default" : "outline"} 
              size="sm" 
              className="rounded-full border-border/70 flex-shrink-0 gap-2"
              onClick={() => setFastDeliveryOnly(!fastDeliveryOnly)}
            >
              <Zap className={`w-4 h-4 ${fastDeliveryOnly ? 'text-white' : 'text-emerald-500'}`} />
              Fast Delivery (&lt;3km)
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-border/70 flex-shrink-0">
              Pure veg
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-border/70 flex-shrink-0">
              Under 25 mins
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-border/70 flex-shrink-0">
              New on CloudKitchen
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-border/70 flex-shrink-0">
              Offers
            </Button>
          </div>
        </FadeIn>

        {/* What's on your mind? */}
        <FadeIn delay={0.2}>
          <div>
            <h2 className="text-lg font-bold mb-4">What's on your mind?</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {foodCategories.map((category, i) => (
                <motion.button
                  key={category.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryClick(category.name)}
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center shadow-sm`}>
                    <category.icon className="w-8 h-8 text-foreground/80" />
                  </div>
                  <span className="text-xs font-medium text-center w-16 truncate">{category.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Deal Rush Section */}
        {dealItems.length > 0 && (
          <FadeIn delay={0.25}>
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-4 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-200">Lightning deals</h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300/80">Refreshed every hour • Limited slots</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/80 dark:bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-100">
                    {String(dealCountdown.hours).padStart(2, '0')}:
                    {String(dealCountdown.minutes).padStart(2, '0')}:
                    {String(dealCountdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {dealItems.slice(0, 4).map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.03 }}
                    className="flex-shrink-0 w-40 bg-card rounded-xl overflow-hidden shadow-md border border-border/60"
                  >
                    <div className="relative h-28 bg-secondary">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg">
                        <span className="text-green-600 font-bold text-lg">+</span>
                      </button>
                      <span className="absolute top-2 left-2 bg-white/90 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        30% OFF
                      </span>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{item.originalPrice}
                        </span>
                        <span className="text-sm font-bold text-emerald-700">
                          {formatPrice(item.discountedPrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        4.2 • 20 mins
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button variant="ghost" className="w-full mt-3 text-emerald-700 hover:text-emerald-800 font-semibold">
                View all live deals
              </Button>
            </div>
          </FadeIn>
        )}

        {/* Assurance row */}
        <FadeIn delay={0.3}>
          <div className="grid gap-3 sm:grid-cols-3">
            {assuranceCards.map(card => (
              <div key={card.title} className="rounded-2xl border border-border/60 bg-card p-4 flex items-start gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{card.title}</p>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Animated chef picks section */}
        <FadeIn delay={0.35}>
          <div className="rounded-3xl border border-border/60 bg-card shadow-lg overflow-hidden">
            <ConnoisseurStackInteractor className="p-6 md:p-10" />
          </div>
        </FadeIn>

        {/* Filter Pills */}
        <FadeIn delay={0.35}>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button variant="outline" size="sm" className="rounded-full gap-2 flex-shrink-0">
              <span>Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-2 flex-shrink-0">
              <span>Sort by</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-full flex-shrink-0">
              Extra off
            </Button>
            <Button variant="outline" size="sm" className="rounded-full flex-shrink-0">
              ₹99 Store
            </Button>
          </div>
        </FadeIn>

        {/* Restaurants Section */}
        <FadeIn delay={0.4}>
          <div>
            <h2 className="text-lg font-bold mb-1">
              Top {stores?.filter(store => {
                // Use actual store coordinates from database
                if (!store.latitude || !store.longitude || !location?.latitude || !location?.longitude) {
                  return !fastDeliveryOnly; // Show if location unknown and filter not active
                }
                const distance = calculateDistance(location.latitude, location.longitude, store.latitude, store.longitude);
                return !fastDeliveryOnly || isFastDelivery(distance);
              }).length || 0} restaurants to explore
            </h2>
            
            {storesLoading ? (
              <div className="space-y-4 mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse rounded-2xl bg-secondary h-72" />
                ))}
              </div>
            ) : stores && stores.length > 0 ? (
              <FadeInStagger className="space-y-4 mt-4" staggerDelay={0.08}>
                {stores
                  .filter(store => {
                    // Filter by fast delivery if enabled using actual coordinates
                    if (!store.latitude || !store.longitude || !location?.latitude || !location?.longitude) {
                      return !fastDeliveryOnly; // Show if location unknown and filter not active
                    }
                    const distance = calculateDistance(location.latitude, location.longitude, store.latitude, store.longitude);
                    return !fastDeliveryOnly || isFastDelivery(distance);
                  })
                  .map(store => {
                    // Calculate distance using actual store coordinates
                    const hasCoordinates = store.latitude && store.longitude && location?.latitude && location?.longitude;
                    const distance = hasCoordinates 
                      ? calculateDistance(location.latitude, location.longitude, store.latitude, store.longitude)
                      : null;
                    const isFast = distance !== null ? isFastDelivery(distance) : false;
                    const deliveryTime = distance !== null ? estimateDeliveryTime(distance) : 30;

                    return (
                  <FadeInStaggerItem key={store.id}>
                    <Link to={`/menu?store=${store.id}`}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-md hover:shadow-xl transition-all"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-secondary to-secondary/50">
                          {store.banner_url ? (
                            <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
                          ) : store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                            <span className="bg-white/90 text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-full">
                              Up to 50% OFF
                            </span>
                            <span className="bg-black/70 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                              {deliveryTime} min
                            </span>
                            {isFast && (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] px-2 py-1">
                                <Zap className="w-3 h-3 mr-1" />
                                Fast
                              </Badge>
                            )}
                          </div>

                          <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                          </button>

                          <div className="absolute bottom-3 left-3 bg-white/95 text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-full shadow">
                            Free delivery on ₹199+
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold leading-tight">{store.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">{store.description || 'Multi-cuisine'}</p>
                            </div>
                            {store.review_count > 0 ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                                  <Star className="w-4 h-4 fill-white" /> {Number(store.average_rating || 0).toFixed(1)}
                                </div>
                                <span className="text-xs text-muted-foreground">{store.review_count} {store.review_count === 1 ? 'review' : 'reviews'}</span>
                              </div>
                            ) : (
                              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{store.address?.split(',')[0] || 'Nearby'}</span>
                            <span>•</span>
                            <span>₹400 for two</span>
                            {distance !== null && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {formatDistance(distance)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="px-2 py-1 rounded-full bg-secondary text-foreground/80">On-time badge</span>
                            <span className="px-2 py-1 rounded-full bg-secondary text-foreground/80">Tracked delivery</span>
                            {isFast && (
                              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                                🚀 Free Delivery
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </FadeInStaggerItem>
                    );
                  })}
              </FadeInStagger>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No restaurants yet</h3>
                <p className="text-muted-foreground">Check back later for new restaurants in your area</p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Floating Cart */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-md z-40"
          >
            <Link to="/cart">
              <HoverScale scale={1.02}>
                <Button variant="hero" size="lg" className="w-full h-14 rounded-xl shadow-strong font-bold">
                  View Cart ({itemCount}) – {formatPrice(cart?.total || 0)}
                </Button>
              </HoverScale>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomerBottomNav />
    </div>
  );
}
