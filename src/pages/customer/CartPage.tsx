import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Tag, Clock, Star, Sparkles, Gift, TrendingUp, Utensils, MapPin, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useStore } from '@/hooks/useCustomerData';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/currency';
import { calculateDistance, formatDistance, isFastDelivery, estimateDeliveryTime } from '@/lib/distance';
import { ViewOffersModal } from '@/components/customer/ViewOffersModal';
import { useState } from 'react';

export function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState<{ code: string; discount: number } | null>(null);

  // Fetch store info from Supabase
  const { data: store } = useStore(cart?.vendorId || null);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please sign in', description: 'You need to sign in to place an order.' });
      navigate('/login');
      return;
    }
    
    // Navigate to checkout page with applied offer
    navigate('/checkout', { 
      state: { 
        appliedOffer: appliedOffer ? {
          code: appliedOffer.code,
          discount: appliedOffer.discount
        } : null 
      } 
    });
  };

  const handleApplyOffer = (offerCode: string, discountAmount: number) => {
    setAppliedOffer({ code: offerCode, discount: discountAmount });
    setShowOffersModal(false);
    toast({
      title: '🎉 Offer Applied!',
      description: `You saved ${formatPrice(discountAmount)} with code ${offerCode}`,
    });
  };

  const handleRemoveOffer = () => {
    setAppliedOffer(null);
    toast({
      title: 'Offer Removed',
      description: 'Coupon code has been removed from your order',
      variant: 'destructive',
    });
  };

  // Calculate distance between user and store using actual store coordinates
  const storeLatitude = store?.latitude ?? null;
  const storeLongitude = store?.longitude ?? null;
  const userLatitude = location?.latitude ?? null;
  const userLongitude = location?.longitude ?? null;
  
  // Calculate distance only if we have valid coordinates
  const distance = (storeLatitude && storeLongitude && userLatitude && userLongitude)
    ? calculateDistance(userLatitude, userLongitude, storeLatitude, storeLongitude)
    : null;
  
  const isFast = distance !== null ? isFastDelivery(distance) : false;
  const deliveryTime = distance !== null ? estimateDeliveryTime(distance) : 30;

  // Calculate delivery fee based on distance
  // FREE if < 3km, otherwise ₹8 per km
  const FREE_DELIVERY_DISTANCE = 3; // km
  const DELIVERY_FEE_PER_KM = 8; // ₹8 per km
  
  const calculateDeliveryFee = () => {
    if (distance === null) return 40; // Default fee if location unknown
    if (distance < FREE_DELIVERY_DISTANCE) return 0; // Free delivery within 3km
    return Math.round(distance * DELIVERY_FEE_PER_KM); // ₹8 per km
  };
  
  const deliveryFee = calculateDeliveryFee();
  const platformFee = 5;
  const packagingCharges = 15;
  const taxes = Math.round((cart?.total || 0) * 0.05);
  
  // Apply discount from offer
  const discount = appliedOffer?.discount || 0;
  const grandTotal = (cart?.total || 0) + deliveryFee + platformFee + packagingCharges + taxes - discount;

  // Show distance info for free delivery
  const distanceForFreeDelivery = distance !== null && distance >= FREE_DELIVERY_DISTANCE
    ? distance - FREE_DELIVERY_DISTANCE
    : 0;

  // Suggested items (mock data - replace with real suggestions)
  const suggestedItems = [
    { id: '1', name: 'Garlic Bread', price: 99, image: null },
    { id: '2', name: 'Cold Drink', price: 40, image: null },
    { id: '3', name: 'French Fries', price: 89, image: null },
  ];

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <ShoppingBag className="w-16 h-16 text-amber-600" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Looks like you haven't added anything yet
          </p>
          <Link to="/menu">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg"
            >
              <Utensils className="w-5 h-5 mr-2" />
              Browse Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background pb-safe-area-bottom md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-amber-100 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold hidden sm:inline">CloudKitchen</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/menu" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Continue shopping</span>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with Store Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-amber-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {store?.logo_url ? (
                      <img 
                        src={store.logo_url} 
                        alt={store.name} 
                        className="w-16 h-16 rounded-xl object-cover border-2 border-amber-100" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                        <ChefHat className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h1 className="text-xl md:text-2xl font-bold">{store?.name || 'Your Cart'}</h1>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {distance !== null ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{formatDistance(distance)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Location unavailable</span>
                          </div>
                        )}
                        {isFast && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                              <Zap className="w-3 h-3 mr-1" />
                              Free Delivery
                            </Badge>
                          </>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{deliveryTime}-{deliveryTime + 10} mins</span>
                        </div>
                        {store?.average_rating && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                              <span className="text-xs font-semibold text-emerald-700">
                                {Number(store.average_rating).toFixed(1)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cart Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  Your Items ({cart.items.length})
                </h2>
                {cart.items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {cart.items.map((item, index) => (
                  <motion.div
                    key={item.menuItemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card className="mb-3 border-border/50 hover:border-amber-200 transition-colors shadow-sm hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Item Image */}
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Utensils className="w-8 h-8 text-amber-600" />
                          </div>
                          
                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base mb-1">{item.name}</h3>
                            <p className="text-amber-700 font-semibold text-sm mb-3">
                              {formatPrice(item.price)} each
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg border border-emerald-200 p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-emerald-100"
                                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                >
                                  <Minus className="w-3.5 h-3.5 text-emerald-700" />
                                </Button>
                                <span className="w-8 text-center font-bold text-emerald-700">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-emerald-100"
                                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-red-50"
                                onClick={() => removeFromCart(item.menuItemId)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                          
                          {/* Item Total */}
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold">Add more items?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestedItems.map((item) => (
                  <Card key={item.id} className="border-dashed border-amber-200 hover:border-amber-400 transition-colors cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-amber-600" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                      <p className="text-amber-700 font-semibold text-xs">{formatPrice(item.price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Offers Banner - Mobile */}
            <div className="lg:hidden">
              <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Apply Coupon</h3>
                      <p className="text-xs text-muted-foreground">Save more on checkout</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-amber-700 font-semibold"
                      onClick={() => setShowOffersModal(true)}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Order Summary (Sticky on Desktop) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-24"
            >
              <Card className="border-amber-100 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    Bill Details
                  </h2>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Item Total</span>
                      <span className="font-medium">{formatPrice(cart.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Delivery Fee</span>
                        {deliveryFee === 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                            FREE
                          </Badge>
                        )}
                      </div>
                      <span className={`font-medium ${deliveryFee === 0 ? 'text-emerald-600' : ''}`}>
                        {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span className="font-medium">{formatPrice(platformFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Packaging</span>
                      <span className="font-medium">{formatPrice(packagingCharges)}</span>
                    </div>
                    <div className="flex justify-between text-sm pb-3 border-b border-border">
                      <span className="text-muted-foreground">GST & Taxes</span>
                      <span className="font-medium">{formatPrice(taxes)}</span>
                    </div>
                    
                    {/* Discount if applied */}
                    {appliedOffer && (
                      <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                        <span>Discount ({appliedOffer.code})</span>
                        <span>-{formatPrice(appliedOffer.discount)}</span>
                      </div>
                    )}
                    
                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-lg">TO PAY</span>
                      <span className="font-bold text-2xl text-amber-700">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Free Delivery Info based on distance */}
                  {deliveryFee === 0 ? (
                    <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          🎉 FREE delivery! You're within 3km from the store
                        </span>
                      </div>
                    </div>
                  ) : distance !== null ? (
                    <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 mb-1">
                            Delivery fee: {formatPrice(deliveryFee)}
                          </h4>
                          <p className="text-xs text-amber-700">
                            You're {formatDistance(distance)} away • ₹8/km for orders beyond 3km
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          Enable location to see delivery fee
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Coupon Section */}
                  <div className="mb-5">
                    {appliedOffer ? (
                      <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Tag className="w-4 h-4 text-emerald-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-emerald-900">{appliedOffer.code}</p>
                              <p className="text-xs text-emerald-700">Saved {formatPrice(appliedOffer.discount)}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-emerald-700 hover:text-emerald-900 text-xs"
                            onClick={handleRemoveOffer}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-amber-700" />
                            <span className="font-semibold text-sm text-amber-900">Apply Coupon</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-amber-700 font-semibold text-xs"
                            onClick={() => setShowOffersModal(true)}
                          >
                            VIEW OFFERS
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Checkout Button - Desktop */}
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Extra Info */}
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Review your order on the next page
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Checkout Button - Mobile */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe-bottom bg-white/95 backdrop-blur-xl border-t border-amber-100 z-50 shadow-2xl"
      >
        <Button 
          size="lg" 
          className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg text-base"
          onClick={handleCheckout}
        >
          <div className="flex items-center justify-between w-full">
            <span>Checkout</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </Button>
      </motion.div>

      {/* Offers Modal */}
      {cart?.vendorId && (
        <ViewOffersModal
          isOpen={showOffersModal}
          onClose={() => setShowOffersModal(false)}
          storeId={cart.vendorId}
          cartTotal={cart.total}
          onApplyOffer={handleApplyOffer}
          appliedCode={appliedOffer?.code}
        />
      )}
    </div>
  );
}
