import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Search, ShoppingCart, Star, Clock, Plus, Minus, MapPin, ArrowLeft, SlidersHorizontal, Check, Zap, Leaf, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStores, useMenuItems, useStore } from '@/hooks/useCustomerData';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { FadeIn, FadeInStagger, FadeInStaggerItem, HoverScale } from '@/components/ui/animated-container';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { VendorListSkeleton, MenuItemListSkeleton, CategorySkeleton } from '@/components/menu/MenuSkeletons';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';

type SortOption = 'default' | 'price-low' | 'price-high' | 'name';

export function MenuPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  // Quick filter states
  const [showFastDelivery, setShowFastDelivery] = useState(false);
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showVegOnly, setShowVegOnly] = useState(false);
  
  const { cart, addToCart, updateQuantity, itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Fetch data from Supabase
  const { data: stores, isLoading: storesLoading, refetch: refetchStores } = useStores();
  const { data: menuItems, isLoading: menuItemsLoading } = useMenuItems(selectedStoreId);
  const { data: selectedStore } = useStore(selectedStoreId);

  const handleRefresh = useCallback(async () => {
    await refetchStores();
    toast.success('Menu refreshed!');
  }, [refetchStores]);

  const resetFilters = () => {
    setSortBy('default');
    setPriceRange([0, 1000]);
    setShowAvailableOnly(false);
    setSelectedCategory('All');
    setShowFastDelivery(false);
    setShowBestsellers(false);
    setShowVegOnly(false);
  };

  const activeFilterCount = [
    sortBy !== 'default',
    priceRange[0] > 0 || priceRange[1] < 1000,
    showAvailableOnly,
    showFastDelivery,
    showBestsellers,
    showVegOnly,
  ].filter(Boolean).length;

  const filteredStores = useMemo(() => {
    return (stores || []).filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stores, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set((menuItems || []).map(item => item.category?.name || 'Uncategorized'));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  // Apply all filters to menu items
  const filteredMenuItems = useMemo(() => {
    let items = (menuItems || []).filter(item => {
      const categoryName = item.category?.name || 'Uncategorized';
      const matchesCategory = selectedCategory === 'All' || categoryName === selectedCategory;
      const matchesPrice = Number(item.price) >= priceRange[0] && Number(item.price) <= priceRange[1];
      const matchesAvailability = !showAvailableOnly || item.is_available;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFastDelivery = !showFastDelivery || (item.preparation_time || 15) <= 15;
      const matchesBestsellers = !showBestsellers || Number(item.price) >= 10;
      const matchesVeg = !showVegOnly || item.is_veg;
      return matchesCategory && matchesPrice && matchesAvailability && matchesSearch && matchesFastDelivery && matchesBestsellers && matchesVeg;
    });

    // Apply sorting
    if (sortBy === 'price-low') {
      items = [...items].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      items = [...items].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'name') {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [menuItems, selectedCategory, priceRange, showAvailableOnly, searchQuery, showFastDelivery, showBestsellers, showVegOnly, sortBy]);

  const getItemQuantity = (itemId: string) => {
    return cart?.items.find(i => i.menuItemId === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: any) => {
    if (selectedStoreId) {
      // Convert to MenuItem format
      const menuItem = {
        id: item.id,
        vendorId: selectedStoreId,
        name: item.name,
        description: item.description || '',
        price: Number(item.price),
        category: item.category?.name || 'Uncategorized',
        image: item.image_url || '/placeholder.svg',
        available: item.is_available ?? true,
        preparationTime: item.preparation_time || 15,
      };
      addToCart(menuItem, selectedStoreId);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe-area-bottom">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/60"
      >
        <div className="container mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
          <Link to="/home" className="flex items-center gap-2 group flex-shrink-0">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl gradient-primary flex items-center justify-center shadow-glow"
            >
              <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-lg md:text-xl font-bold tracking-tight hidden sm:inline">CloudKitchen</span>
          </Link>
          
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 md:pl-12 h-10 md:h-12 rounded-lg md:rounded-xl border-2 border-border/50 bg-secondary/50 focus:bg-background focus:border-primary/50 transition-all text-sm md:text-base"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden lg:block">Hi, {user?.name}</span>
                <Link to="/orders" className="hidden md:block">
                  <Button variant="ghost" className="font-medium">My Orders</Button>
                </Link>
              </>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
            )}
            <Link to="/cart">
              <HoverScale>
                <Button variant="outline" className="relative h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl border-2">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-glow"
                      >
                        {itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </HoverScale>
            </Link>
          </div>
        </div>
      </motion.header>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
        <AnimatePresence mode="wait">
          {!selectedStoreId ? (
            <motion.div
              key="stores"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FadeIn>
                <div className="mb-6 md:mb-10">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 backdrop-blur-xl rounded-3xl border border-border/60 p-4 md:p-5 shadow-soft">
                    <div className="space-y-1.5">
                      <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Explore Kitchens</h1>
                      <p className="text-sm md:text-lg text-muted-foreground">Handpicked cloud kitchens with fast delivery and live tracking.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1.5 rounded-full border border-amber-200/80 bg-amber-50 text-xs font-semibold text-amber-800 shadow-[0_6px_20px_-10px_rgba(249,115,22,0.45)]">{filteredStores.length || '0'} kitchens nearby</span>
                      <span className="px-3 py-1.5 rounded-full border border-amber-200/80 bg-amber-50 text-xs font-semibold text-amber-800 shadow-[0_6px_20px_-10px_rgba(249,115,22,0.45)]">Under 30 mins</span>
                      <span className="px-3 py-1.5 rounded-full border border-amber-200/80 bg-amber-50 text-xs font-semibold text-amber-800 shadow-[0_6px_20px_-10px_rgba(249,115,22,0.45)]">Free delivery on ₹149+</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-border/70 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 p-5 text-foreground shadow-xl shadow-amber-200/50">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-left">
                        <p className="text-xs uppercase tracking-[0.12em] text-amber-700/80">CloudKitchen picks</p>
                        <p className="text-lg font-semibold">Fast delivery • Hygiene audited • Live tracking</p>
                      </div>
                      <div className="flex gap-2 flex-wrap text-xs font-semibold">
                        <span className="px-3 py-1 rounded-full bg-white/70 border border-amber-200 text-amber-800">15 min lightning</span>
                        <span className="px-3 py-1 rounded-full bg-white/70 border border-amber-200 text-amber-800">Veg & non-veg</span>
                        <span className="px-3 py-1 rounded-full bg-white/70 border border-amber-200 text-amber-800">On-time promise</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {storesLoading ? (
                <VendorListSkeleton />
              ) : filteredStores.length === 0 ? (
                <FadeIn>
                  <div className="text-center py-12">
                    <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No kitchens available</h3>
                    <p className="text-muted-foreground mb-6">Check back later for new kitchens in your area</p>
                  </div>
                </FadeIn>
              ) : (
                <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" staggerDelay={0.08}>
                  {filteredStores.map(store => (
                  <FadeInStaggerItem key={store.id}>
                    <motion.button
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setSelectedStoreId(store.id)}
                    className="group text-left w-full rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-2xl overflow-hidden transition-all duration-300"
                    >
                      <div className="relative h-40 md:h-48 bg-gradient-to-br from-white to-secondary/40">
                        {store.banner_url ? (
                          <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
                        ) : store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-white/90 text-amber-700 text-[11px] font-semibold px-2 py-1 rounded-full">Up to 50% OFF</span>
                          <span className="bg-black/75 text-white text-[11px] font-semibold px-2 py-1 rounded-full">25-35 min</span>
                        </div>
                        <div className="absolute top-3 right-3 bg-white/90 text-amber-700 text-[11px] font-semibold px-2 py-1 rounded-full shadow">
                          Free delivery
                        </div>
                      </div>
                      <div className="p-4 md:p-5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <h3 className="text-lg md:text-xl font-semibold leading-tight truncate">{store.name}</h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm">
                              <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              <span className="truncate">{store.address}</span>
                            </div>
                            <div className="flex gap-2 text-[11px] text-muted-foreground">
                              <span className="px-2 py-1 rounded-full bg-secondary">On-time badge</span>
                              <span className="px-2 py-1 rounded-full bg-secondary">Live tracking</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {store.review_count > 0 ? (
                              <>
                                <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                                  <Star className="w-4 h-4 fill-white" /> {Number(store.average_rating || 0).toFixed(1)}
                                </div>
                                <span className="text-xs text-muted-foreground">{store.review_count} reviews</span>
                              </>
                            ) : (
                              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </FadeInStaggerItem>
                  ))}
                </FadeInStagger>
              )}
            </motion.div>
          ) : (
            // Menu View
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FadeIn>
                <div className="mb-6 md:mb-10 space-y-4">
                  <motion.button
                    whileHover={{ x: -5 }}
                    onClick={() => setSelectedStoreId(null)}
                    className="flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium transition-colors text-sm md:text-base"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to kitchens
                  </motion.button>

                  <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/70 to-orange-50 p-5 md:p-7 text-foreground shadow-[0_25px_80px_-40px_rgba(248,180,70,0.55)]">
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_25%,rgba(254,240,199,0.8),transparent_52%),radial-gradient(circle_at_82%_10%,rgba(251,191,36,0.35),transparent_40%)]" />
                    <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-amber-700/80">Curated kitchen</p>
                        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-foreground">{selectedStore?.name || 'Loading...'}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedStore?.address || 'Nearby'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 text-xs font-semibold">
                          <span className="px-3 py-1 rounded-full bg-white/90 border border-amber-200 text-amber-800 shadow-[0_10px_30px_-18px_rgba(248,180,70,0.9)]">On-time promise</span>
                          <span className="px-3 py-1 rounded-full bg-white/90 border border-amber-200 text-amber-800 shadow-[0_10px_30px_-18px_rgba(248,180,70,0.9)]">Live tracking</span>
                          <span className="px-3 py-1 rounded-full bg-white/90 border border-amber-200 text-amber-800 shadow-[0_10px_30px_-18px_rgba(248,180,70,0.9)]">Hygiene checks</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/85 border border-amber-100 rounded-2xl px-4 py-3 self-start text-amber-800 shadow-[0_14px_35px_-20px_rgba(248,180,70,0.8)]">
                        {selectedStore?.review_count > 0 ? (
                          <>
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {Number(selectedStore?.average_rating || 0).toFixed(1)}
                              <span className="text-xs text-muted-foreground ml-0.5">({selectedStore.review_count})</span>
                            </div>
                            <span className="text-amber-700/70 text-xs">|</span>
                            <div className="text-sm font-semibold">25-35 mins</div>
                          </>
                        ) : (
                          <>
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                              NEW
                            </span>
                            <span className="text-amber-700/70 text-xs">|</span>
                            <div className="text-sm font-semibold">25-35 mins</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Quick Filter Bar */}
              <FadeIn delay={0.1}>
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFastDelivery(!showFastDelivery)}
                    className={`rounded-full gap-1.5 flex-shrink-0 border transition-all duration-200 ${showFastDelivery ? 'bg-amber-500 text-white border-amber-400 shadow-[0_12px_32px_-18px_rgba(249,115,22,0.8)]' : 'bg-white text-amber-800 border-amber-100 hover:border-amber-200 hover:bg-amber-50/70'}`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${showFastDelivery ? 'text-white' : 'text-amber-600'}`} />
                    <span className={showFastDelivery ? 'text-white' : 'text-amber-900'}>Fast delivery</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBestsellers(!showBestsellers)}
                    className={`rounded-full gap-1.5 flex-shrink-0 border transition-all duration-200 ${showBestsellers ? 'bg-amber-500 text-white border-amber-400 shadow-[0_12px_32px_-18px_rgba(249,115,22,0.8)]' : 'bg-white text-amber-800 border-amber-100 hover:border-amber-200 hover:bg-amber-50/70'}`}
                  >
                    <Award className={`w-3.5 h-3.5 ${showBestsellers ? 'text-white' : 'text-amber-600'}`} />
                    <span className={showBestsellers ? 'text-white' : 'text-amber-900'}>Bestsellers</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVegOnly(!showVegOnly)}
                    className={`rounded-full gap-1.5 flex-shrink-0 border transition-all duration-200 ${showVegOnly ? 'bg-amber-500 text-white border-amber-400 shadow-[0_12px_32px_-18px_rgba(249,115,22,0.8)]' : 'bg-white text-amber-800 border-amber-100 hover:border-amber-200 hover:bg-amber-50/70'}`}
                  >
                    <Leaf className={`w-3.5 h-3.5 ${showVegOnly ? 'text-white' : 'text-amber-600'}`} />
                    <span className={showVegOnly ? 'text-white' : 'text-amber-900'}>Veg only</span>
                  </Button>

                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="relative rounded-full border-2 gap-2 flex-shrink-0 border-amber-200 bg-white hover:border-amber-300"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">More</span>
                        {activeFilterCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
                      <SheetHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={resetFilters}
                            className="text-primary"
                          >
                            Reset all
                          </Button>
                        </div>
                      </SheetHeader>
                      
                      <div className="space-y-6 overflow-y-auto pb-safe-bottom">
                        <div>
                          <h4 className="font-semibold mb-3 text-foreground">Sort by</h4>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'default', label: 'Relevance' },
                              { value: 'price-low', label: 'Price: Low to High' },
                              { value: 'price-high', label: 'Price: High to Low' },
                              { value: 'name', label: 'Name A-Z' },
                            ].map((option) => (
                              <Button
                                key={option.value}
                                variant={sortBy === option.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSortBy(option.value as SortOption)}
                                className="rounded-full"
                              >
                                {sortBy === option.value && <Check className="w-3 h-3 mr-1" />}
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 text-foreground">Price Range</h4>
                          <div className="px-2">
                            <Slider
                              value={priceRange}
                              onValueChange={(value) => setPriceRange(value as [number, number])}
                              min={0}
                              max={1000}
                              step={10}
                              className="mb-3"
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>₹{priceRange[0]}</span>
                              <span>₹{priceRange[1] === 1000 ? 'Any' : priceRange[1]}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 text-foreground">Availability</h4>
                          <Button
                            variant={showAvailableOnly ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                            className="rounded-full"
                          >
                            {showAvailableOnly && <Check className="w-3 h-3 mr-1" />}
                            Available items only
                          </Button>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
                        <Button 
                          className="w-full rounded-xl h-12" 
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Show {filteredMenuItems.length} items
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </FadeIn>

              {/* Categories */}
              {menuItemsLoading ? (
                <CategorySkeleton />
              ) : (
                <FadeIn delay={0.15}>
                  <div className="flex gap-2 md:gap-3 mb-6 md:mb-10 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {categories.map(category => (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                          selectedCategory === category
                            ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-[0_14px_36px_-18px_rgba(249,115,22,0.75)] border border-amber-300'
                            : 'bg-white text-amber-900 hover:bg-amber-50/70 border border-amber-100'
                        }`}
                      >
                        {category}
                      </motion.button>
                    ))}
                  </div>
                </FadeIn>
              )}

              {/* Menu Items */}
              {menuItemsLoading ? (
                <MenuItemListSkeleton />
              ) : filteredMenuItems.length === 0 ? (
                <FadeIn>
                  <div className="text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items found</h3>
                    <p className="text-muted-foreground mb-4">
                      {menuItems && menuItems.length > 0 
                        ? 'Try adjusting your filters' 
                        : 'This kitchen has no menu items yet'}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetFilters}
                        className="mt-2"
                      >
                        Clear all filters ({activeFilterCount})
                      </Button>
                    )}
                  </div>
                </FadeIn>
              ) : (
                <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5" staggerDelay={0.05}>
                  {filteredMenuItems.map(item => {
                    const quantity = getItemQuantity(item.id);
                    const prepTime = item.preparation_time || 20;
                    const rating = (item as any).rating ?? '4.3';
                  return (
                    <FadeInStaggerItem key={item.id}>
                      <motion.div
                        whileHover={{ y: -2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="flex gap-3 md:gap-5 p-3 md:p-5 rounded-2xl bg-card border border-border/70 hover:border-amber-300 hover:shadow-[0_18px_42px_-28px_rgba(249,115,22,0.6)] transition-all duration-300"
                      >
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ChefHat className="w-9 h-9 md:w-11 md:h-11 text-muted-foreground/50" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <span className="absolute top-2 left-2 bg-white/90 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {prepTime} mins
                          </span>
                          <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {rating} ★
                          </span>
                          {item.is_veg && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/85 text-emerald-700 text-[10px] font-semibold">Veg</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start gap-2">
                            <h3 className="font-semibold text-base md:text-lg mb-1 flex-1 leading-tight">{item.name}</h3>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">{item.description}</p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-1">
                              <span className="font-bold text-lg md:text-xl text-amber-700">{formatPrice(Number(item.price))}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" /> {prepTime} mins
                                <span>•</span>
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {rating}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                              <AnimatePresence mode="wait">
                                {quantity > 0 ? (
                                  <motion.div
                                    key="controls"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1 md:gap-2 bg-secondary/80 rounded-lg md:rounded-xl p-0.5 md:p-1"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 md:h-9 md:w-9 rounded-md md:rounded-lg hover:bg-background"
                                      onClick={() => updateQuantity(item.id, quantity - 1)}
                                    >
                                      <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                    <motion.span 
                                      key={quantity}
                                      initial={{ scale: 1.3 }}
                                      animate={{ scale: 1 }}
                                      className="w-6 md:w-8 text-center font-bold text-sm md:text-base"
                                    >
                                      {quantity}
                                    </motion.span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 md:h-9 md:w-9 rounded-md md:rounded-lg hover:bg-background"
                                      onClick={() => updateQuantity(item.id, quantity + 1)}
                                    >
                                      <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="add"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                  >
                                    <HoverScale>
                                      <Button
                                        variant="outline"
                                        className="h-9 md:h-10 px-3 md:px-5 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm bg-amber-500 text-white border-amber-400 hover:bg-amber-500/90 shadow-[0_12px_32px_-18px_rgba(249,115,22,0.8)]"
                                        onClick={() => handleAddToCart(item)}
                                      >
                                        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                        Add
                                      </Button>
                                    </HoverScale>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </FadeInStaggerItem>
                  );
                  })}
                </FadeInStagger>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </PullToRefresh>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] md:w-auto max-w-md"
          >
            <Link to="/cart">
              <HoverScale scale={1.03}>
                <Button variant="hero" size="lg" className="shadow-strong h-12 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl text-sm md:text-base font-semibold w-full">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                  <span className="truncate">Cart ({itemCount}) – {formatPrice(cart?.total || 0)}</span>
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
