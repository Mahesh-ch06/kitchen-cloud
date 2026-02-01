import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChefHat, ArrowLeft, MapPin, Home, Briefcase, Clock, CreditCard, Wallet, 
  BadgeIndianRupee, Plus, Check, Percent, Tag, ChevronRight, Shield, 
  Zap, Edit2, Bike, Timer, Star, Gift, TrendingUp, AlertTriangle, Navigation, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useStore } from '@/hooks/useCustomerData';
import { formatPrice } from '@/lib/currency';
import { calculateDistance, formatDistance, isFastDelivery, estimateDeliveryTime, geocodePincode, calculateDistanceByPincode } from '@/lib/distance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ViewOffersModal } from '@/components/customer/ViewOffersModal';
import { AddressSelector } from '@/components/customer/AddressSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type AddressType = 'home' | 'work' | 'other';
type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet';

interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address_type: 'home' | 'work' | 'other';
  flat_no: string;
  building_name: string | null;
  street: string | null;
  area: string;
  landmark: string | null;
  city: string;
  state: string | null;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

// Maximum delivery distance in km
const MAX_DELIVERY_DISTANCE = 15;

export function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { location } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: store } = useStore(cart?.vendorId || null);
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<SavedAddress | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    flatNo: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showUndeliverableDialog, setShowUndeliverableDialog] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [pincodeDistance, setPincodeDistance] = useState<number | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Fetch saved addresses
  const { data: savedAddresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['saved-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedAddress[];
    },
    enabled: !!user?.id,
  });

  // Get store coordinates from database (needed for pincode distance calculation)
  const storeLatitude = store?.latitude ?? null;
  const storeLongitude = store?.longitude ?? null;

  // Auto-select default address on load
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedSavedAddress) {
      const defaultAddr = savedAddresses.find(a => a.is_default) || savedAddresses[0];
      handleSelectSavedAddress(defaultAddr);
    }
  }, [savedAddresses]);

  // Calculate distance based on pincode when it changes (debounced)
  useEffect(() => {
    const pincode = deliveryAddress.pincode.trim();
    
    // Only calculate if pincode is exactly 6 digits (Indian pincode format)
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeDistance(null);
      setPincodeError(null);
      return;
    }

    // Must have store coordinates
    if (!storeLatitude || !storeLongitude) {
      setPincodeDistance(null);
      return;
    }

    // Debounce the API call
    const debounceTimer = setTimeout(async () => {
      setIsCalculatingDistance(true);
      setPincodeError(null);

      try {
        const distance = await calculateDistanceByPincode(
          storeLatitude,
          storeLongitude,
          pincode
        );

        if (distance === null) {
          setPincodeError('Could not locate this pincode. Please check and try again.');
          setPincodeDistance(null);
        } else {
          setPincodeDistance(distance);
          
          // Show undeliverable dialog if distance exceeds limit
          if (distance > MAX_DELIVERY_DISTANCE) {
            setShowUndeliverableDialog(true);
          }
        }
      } catch (error) {
        console.error('Error calculating distance by pincode:', error);
        setPincodeError('Error calculating distance. Please try again.');
        setPincodeDistance(null);
      } finally {
        setIsCalculatingDistance(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(debounceTimer);
  }, [deliveryAddress.pincode, storeLatitude, storeLongitude]);

  // Fetch available offers for this store
  const { data: storeOffers } = useQuery({
    queryKey: ['offers', cart?.vendorId],
    queryFn: async () => {
      if (!cart?.vendorId) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('store_id', cart.vendorId)
        .eq('is_active', true)
        .gt('valid_until', new Date().toISOString())
        .order('discount_value', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!cart?.vendorId,
  });

  // Use delivery address coordinates if available, otherwise use user's current location
  const deliveryLatitude = deliveryAddress.latitude ?? location?.latitude ?? null;
  const deliveryLongitude = deliveryAddress.longitude ?? location?.longitude ?? null;
  
  // Coordinate-based distance as fallback
  const coordDistance = (storeLatitude && storeLongitude && deliveryLatitude && deliveryLongitude)
    ? calculateDistance(deliveryLatitude, deliveryLongitude, storeLatitude, storeLongitude)
    : null;
  
  // Prefer pincode-based distance, fall back to coordinate-based distance
  const distance = pincodeDistance ?? coordDistance;
  
  // Check if delivery is available (within 15km)
  const isDeliveryAvailable = distance !== null ? distance <= MAX_DELIVERY_DISTANCE : true;
  
  const isFast = distance !== null ? isFastDelivery(distance) : false;
  const deliveryTime = distance !== null ? estimateDeliveryTime(distance) : 30;

  // Delivery fee based on distance: FREE if < 3km, otherwise ₹8/km
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
  const gst = Math.round((cart?.total || 0) * 0.05);
  const promoDiscount = appliedPromo?.discount || 0;
  const grandTotal = (cart?.total || 0) + deliveryFee + platformFee + packagingCharges + gst + tipAmount - promoDiscount;

  // Suggested tip amounts
  const tipOptions = [
    { amount: 0, label: 'No Tip' },
    { amount: 20, label: '₹20' },
    { amount: 30, label: '₹30' },
    { amount: 50, label: '₹50' },
  ];

  // Handle selecting a saved address
  const handleSelectSavedAddress = (address: SavedAddress) => {
    setSelectedSavedAddress(address);
    setDeliveryAddress({
      flatNo: address.flat_no,
      landmark: address.landmark || '',
      area: address.area,
      city: address.city,
      pincode: address.pincode,
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setAddressType(address.address_type);
    setIsAddingNewAddress(false);
  };

  // Handle address selection from modal
  const handleAddressFromSelector = (address: SavedAddress) => {
    handleSelectSavedAddress(address);
    queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    // Find the offer in store offers
    const offer = storeOffers?.find(
      (o) => o.code.toUpperCase() === promoCode.toUpperCase()
    );

    if (!offer) {
      toast.error('Invalid promo code for this store');
      return;
    }

    // Check minimum order amount
    if (offer.min_order_amount && cart && cart.total < Number(offer.min_order_amount)) {
      toast.error(`Minimum order of ${formatPrice(Number(offer.min_order_amount))} required`);
      return;
    }

    // Check usage limit
    if (offer.usage_limit && offer.usage_count >= offer.usage_limit) {
      toast.error('This promo code has reached its usage limit');
      return;
    }

    // Calculate discount
    let discount = 0;
    if (offer.discount_type === 'percentage') {
      discount = Math.round((cart?.total || 0) * (Number(offer.discount_value) / 100));
      if (offer.max_discount) {
        discount = Math.min(discount, Number(offer.max_discount));
      }
    } else {
      discount = Number(offer.discount_value);
    }

    setAppliedPromo({ code: offer.code, discount });
    setPromoCode('');
    toast.success(`Promo code applied! You saved ${formatPrice(discount)}`);
  };

  const handleApplyOffer = (offerCode: string, discountAmount: number) => {
    setAppliedPromo({ code: offerCode, discount: discountAmount });
    setShowOffersModal(false);
    toast.success(`Promo code applied! You saved ${formatPrice(discountAmount)}`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast.info('Promo code removed');
  };

  const handlePlaceOrder = async () => {
    if (!user?.id || !cart || !store) {
      toast.error('Unable to place order. Please try again.');
      return;
    }

    // Validate address
    if (!deliveryAddress.flatNo || !deliveryAddress.area || !deliveryAddress.city || !deliveryAddress.pincode) {
      toast.error('Please fill in all address fields');
      return;
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(deliveryAddress.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    // Wait if still calculating distance
    if (isCalculatingDistance) {
      toast.info('Please wait while we verify your delivery location');
      return;
    }

    // Check for pincode error
    if (pincodeError) {
      toast.error('Could not verify delivery location. Please check your pincode.');
      return;
    }

    // Check delivery availability
    if (!isDeliveryAvailable) {
      setShowUndeliverableDialog(true);
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Create the order with delivery coordinates
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          store_id: cart.vendorId,
          total_amount: grandTotal,
          status: 'pending',
          delivery_address: `${deliveryAddress.flatNo}, ${deliveryAddress.area}, ${deliveryAddress.city} - ${deliveryAddress.pincode}${deliveryAddress.landmark ? ', Near ' + deliveryAddress.landmark : ''}`,
          delivery_latitude: deliveryAddress.latitude,
          delivery_longitude: deliveryAddress.longitude,
          notes: deliveryInstructions || null,
          offer_code: appliedPromo?.code || null,
          discount_amount: promoDiscount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        name: item.name,
        quantity: item.quantity,
        price_at_order: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create delivery assignment
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .insert({
          order_id: order.id,
          status: 'pending',
          delivery_partner_id: null,
        });

      if (assignmentError) {
        console.error('Error creating delivery assignment:', assignmentError);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });

      clearCart();
      toast.success('Order placed successfully!', {
        description: `Order #${order.id.slice(0, 8)} will arrive in 30-40 mins`,
      });
      navigate(`/orders/${order.id}/track`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Redirect to menu if cart is empty (using useEffect to avoid render-time navigation)
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/menu');
    }
  }, [cart, navigate]);

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background pb-32 lg:pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-amber-100 shadow-sm">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link to="/cart" className="flex items-center gap-1.5 md:gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm md:text-base">Back</span>
          </Link>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-xs md:text-sm font-medium text-emerald-600">100% Secure</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-3 space-y-4">
            {/* Delivery Time Estimate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Timer className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Delivery in</div>
                    <div className="text-2xl font-bold">{deliveryTime}-{deliveryTime + 10} mins</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Bike className="w-8 h-8 opacity-80" />
                  {isFast && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">
                      <Zap className="w-3 h-3 mr-1" />
                      Fast Delivery
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Store Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl bg-white border border-amber-100 p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {store?.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt={store.name} 
                    className="w-16 h-16 rounded-xl object-cover border-2 border-amber-100" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{store?.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                    <MapPin className="w-3.5 h-3.5" />
                    {isCalculatingDistance ? (
                      <span className="line-clamp-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Calculating distance...
                      </span>
                    ) : distance !== null ? (
                      <span className="line-clamp-1">{formatDistance(distance)} away</span>
                    ) : (
                      <span className="line-clamp-1">Enter pincode for distance</span>
                    )}
                    <span>•</span>
                    <span className="line-clamp-1">{store?.address}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                      <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">
                        {store?.average_rating ? Number(store.average_rating).toFixed(1) : '4.2'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{cart.items.length} items</span>
                    {isFast && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-emerald-600 font-semibold">🚀 Free Delivery</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white border border-amber-100 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-700" />
                  </div>
                  <h2 className="text-lg font-bold">Delivery Address</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressSelector(true)}
                  className="gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Change
                </Button>
              </div>

              {/* Delivery Not Available Warning */}
              {!isDeliveryAvailable && distance !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Delivery Not Available</p>
                      <p className="text-sm text-red-700 mt-1">
                        This address is {formatDistance(distance)} away from the store. 
                        Delivery is available within {MAX_DELIVERY_DISTANCE}km only.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressSelector(true)}
                        className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                      >
                        Select Different Address
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Selected Address Display */}
              {selectedSavedAddress && !isAddingNewAddress ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedSavedAddress.address_type === 'home' ? 'bg-blue-100' :
                      selectedSavedAddress.address_type === 'work' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {selectedSavedAddress.address_type === 'home' ? <Home className="w-5 h-5 text-blue-600" /> :
                       selectedSavedAddress.address_type === 'work' ? <Briefcase className="w-5 h-5 text-purple-600" /> :
                       <MapPin className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold capitalize">{selectedSavedAddress.label}</span>
                        {selectedSavedAddress.is_default && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                            Default
                          </Badge>
                        )}
                        {distance !== null && isDeliveryAvailable && (
                          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200">
                            {formatDistance(distance)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSavedAddress.flat_no}
                        {selectedSavedAddress.building_name && `, ${selectedSavedAddress.building_name}`}
                        {selectedSavedAddress.street && `, ${selectedSavedAddress.street}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSavedAddress.area}, {selectedSavedAddress.city} - {selectedSavedAddress.pincode}
                      </p>
                      {selectedSavedAddress.landmark && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 Near {selectedSavedAddress.landmark}
                        </p>
                      )}
                    </div>
                    <Check className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              ) : addressesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                </div>
              ) : savedAddresses && savedAddresses.length > 0 && !isAddingNewAddress ? (
                // Saved Addresses List
                <div className="space-y-3">
                  {savedAddresses.slice(0, 3).map((addr) => {
                    const addrDistance = (storeLatitude && storeLongitude && addr.latitude && addr.longitude)
                      ? calculateDistance(addr.latitude, addr.longitude, storeLatitude, storeLongitude)
                      : null;
                    const addrDeliverable = addrDistance !== null ? addrDistance <= MAX_DELIVERY_DISTANCE : true;
                    
                    return (
                      <div
                        key={addr.id}
                        onClick={() => addrDeliverable && handleSelectSavedAddress(addr)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          !addrDeliverable 
                            ? 'border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed'
                            : selectedSavedAddress?.id === addr.id
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-border hover:border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              addr.address_type === 'home' ? 'bg-blue-100' :
                              addr.address_type === 'work' ? 'bg-purple-100' : 'bg-gray-100'
                            }`}>
                              {addr.address_type === 'home' ? <Home className="w-4 h-4 text-blue-600" /> :
                               addr.address_type === 'work' ? <Briefcase className="w-4 h-4 text-purple-600" /> :
                               <MapPin className="w-4 h-4 text-gray-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold capitalize">{addr.label}</span>
                                {addrDistance !== null && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] ${
                                      addrDeliverable ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'
                                    }`}
                                  >
                                    {formatDistance(addrDistance)}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {addr.flat_no}, {addr.area}, {addr.city} - {addr.pincode}
                              </div>
                              {!addrDeliverable && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ Beyond delivery range
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedSavedAddress?.id === addr.id && addrDeliverable && (
                            <Check className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {savedAddresses.length > 3 && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddressSelector(true)}
                      className="w-full text-amber-700"
                    >
                      View all {savedAddresses.length} addresses
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              ) : null}

              {/* Add New Address Button */}
              {!isAddingNewAddress && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddressSelector(true)}
                  className="w-full mt-4 border-dashed border-amber-300 hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {savedAddresses && savedAddresses.length > 0 ? 'Add New Address' : 'Add Delivery Address'}
                </Button>
              )}

              {/* New Address Form - Only show if explicitly adding */}
              <AnimatePresence>
                {isAddingNewAddress && !selectedSavedAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Address Type */}
                    <div>
                      <Label className="mb-3 block font-semibold">Address Type</Label>
                      <RadioGroup value={addressType} onValueChange={(value) => setAddressType(value as AddressType)}>
                        <div className="grid grid-cols-3 gap-3">
                          {(['home', 'work', 'other'] as AddressType[]).map((type) => (
                            <label
                              key={type}
                              className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                addressType === type
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-border hover:border-amber-200'
                              }`}
                            >
                              <RadioGroupItem value={type} id={type} className="sr-only" />
                              {type === 'home' && <Home className="w-4 h-4" />}
                              {type === 'work' && <Briefcase className="w-4 h-4" />}
                              {type === 'other' && <MapPin className="w-4 h-4" />}
                              <span className="capitalize font-medium">{type}</span>
                            </label>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="flatNo" className="font-semibold">
                          Flat / House No. / Building *
                        </Label>
                        <Input
                          id="flatNo"
                          placeholder="e.g., 123, Tower A"
                          value={deliveryAddress.flatNo}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, flatNo: e.target.value })}
                          className="mt-2 bg-background"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="area" className="font-semibold">
                          Area / Street / Locality *
                        </Label>
                        <Input
                          id="area"
                          placeholder="e.g., MG Road, Sector 21"
                          value={deliveryAddress.area}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, area: e.target.value })}
                          className="mt-2 bg-background"
                        />
                      </div>
                      <div>
                        <Label htmlFor="landmark" className="font-semibold">
                          Landmark
                        </Label>
                        <Input
                          id="landmark"
                          placeholder="e.g., Near City Mall"
                          value={deliveryAddress.landmark}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                          className="mt-2 bg-background"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="font-semibold">
                          City *
                        </Label>
                        <Input
                          id="city"
                          placeholder="e.g., Mumbai"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                          className="mt-2 bg-background"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode" className="font-semibold">
                          Pincode *
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="pincode"
                            placeholder="e.g., 400001"
                            value={deliveryAddress.pincode}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                            className={`bg-background pr-10 ${pincodeError ? 'border-red-500 focus-visible:ring-red-500' : ''} ${pincodeDistance !== null && pincodeDistance <= MAX_DELIVERY_DISTANCE ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                            maxLength={6}
                          />
                          {isCalculatingDistance && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                          )}
                          {!isCalculatingDistance && pincodeDistance !== null && pincodeDistance <= MAX_DELIVERY_DISTANCE && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                          )}
                          {!isCalculatingDistance && pincodeDistance !== null && pincodeDistance > MAX_DELIVERY_DISTANCE && (
                            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {pincodeError && (
                          <p className="text-sm text-red-500 mt-1">{pincodeError}</p>
                        )}
                        {pincodeDistance !== null && !pincodeError && (
                          <p className={`text-sm mt-1 ${pincodeDistance > MAX_DELIVERY_DISTANCE ? 'text-red-500' : 'text-green-600'}`}>
                            Distance: {formatDistance(pincodeDistance)} {pincodeDistance <= MAX_DELIVERY_DISTANCE ? '✓' : '(Too far)'}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Delivery Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-white border border-amber-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold">Delivery Instructions</h2>
                <span className="text-sm text-muted-foreground">(Optional)</span>
              </div>
              <Textarea
                placeholder="e.g., Ring the bell twice, Leave at the door, Call before arriving..."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                rows={3}
                className="resize-none bg-background"
              />
            </motion.div>

            {/* Tip for Delivery Partner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white border border-amber-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">Tip Your Delivery Partner</h2>
                  <p className="text-sm text-muted-foreground">The entire amount will go to your delivery partner</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {tipOptions.map((option) => (
                  <button
                    key={option.amount}
                    onClick={() => setTipAmount(option.amount)}
                    className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                      tipAmount === option.amount
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-border hover:border-emerald-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl bg-white border border-amber-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold">Payment Method</h2>
              </div>

              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-border hover:border-amber-200'
                  }`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <BadgeIndianRupee className="w-6 h-6 text-emerald-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Cash on Delivery</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Pay when you receive</div>
                    </div>
                    {paymentMethod === 'cod' && <Check className="w-5 h-5 text-amber-600" />}
                  </label>

                  {/* UPI - Disabled for now */}
                  <label className="flex items-center gap-4 p-4 rounded-xl border-2 opacity-50 cursor-not-allowed">
                    <RadioGroupItem value="upi" id="upi" disabled />
                    <Wallet className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-semibold">UPI / QR</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Coming soon</div>
                    </div>
                  </label>

                  {/* Card - Disabled for now */}
                  <label className="flex items-center gap-4 p-4 rounded-xl border-2 opacity-50 cursor-not-allowed">
                    <RadioGroupItem value="card" id="card" disabled />
                    <CreditCard className="w-6 h-6 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-semibold">Credit / Debit Card</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Coming soon</div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </motion.div>
          </div>

          {/* Right Column - Bill Summary (Sticky) */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white border border-amber-100 p-6 shadow-lg lg:sticky lg:top-24"
            >
              <h2 className="text-xl font-bold mb-5">Bill Details</h2>

              {/* Items List */}
              <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-2">
                {cart.items.map((item, idx) => (
                  <div key={item.menuItemId} className="flex justify-between gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-50 text-emerald-700 text-xs font-bold flex-shrink-0 mt-0.5">
                        {item.quantity}
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{item.name}</span>
                    </div>
                    <span className="font-medium flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-5" />

              {/* Bill Breakdown */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="font-medium">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Bike className="w-3.5 h-3.5" />
                    <span>Delivery Fee</span>
                    {distance !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        ({formatDistance(distance)})
                      </span>
                    )}
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
                  <span className="text-muted-foreground">Packaging Charges</span>
                  <span className="font-medium">{formatPrice(packagingCharges)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST & Restaurant Charges</span>
                  <span className="font-medium">{formatPrice(gst)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Gift className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivery Tip</span>
                    </div>
                    <span className="font-medium text-emerald-600">{formatPrice(tipAmount)}</span>
                  </div>
                )}
                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Promo ({appliedPromo.code})</span>
                    </div>
                    <span className="font-medium text-emerald-600">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-5" />

              {/* Grand Total */}
              <div className="flex justify-between items-center mb-5">
                <span className="text-lg font-bold">TO PAY</span>
                <span className="text-2xl font-bold text-amber-700">{formatPrice(grandTotal)}</span>
              </div>

              {/* Free Delivery Message based on distance */}
              {deliveryFee === 0 ? (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      🎉 FREE delivery! You're within 3km from the store
                    </span>
                  </div>
                </div>
              ) : distance !== null && (
                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      Delivery fee: ₹8/km for orders beyond 3km
                    </span>
                  </div>
                </div>
              )}

              {/* Promo Code */}
              {appliedPromo ? (
                <div className="mb-5 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-emerald-900">{appliedPromo.code}</p>
                        <p className="text-xs text-emerald-700">Saved {formatPrice(appliedPromo.discount)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-700 hover:text-emerald-900 text-xs"
                      onClick={handleRemovePromo}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-5 p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-700" />
                      <span className="font-semibold text-amber-900">Have a promo code?</span>
                    </div>
                    {storeOffers && storeOffers.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-700 font-semibold text-xs"
                        onClick={() => setShowOffersModal(true)}
                      >
                        VIEW OFFERS ({storeOffers.length})
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-white"
                    />
                    <Button
                      onClick={handleApplyPromo}
                      variant="outline"
                      className="border-amber-300 hover:bg-amber-100"
                    >
                      Apply
                    </Button>
                  </div>
                  {storeOffers && storeOffers.length > 0 ? (
                    <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                      <Percent className="w-3 h-3" />
                      <span>{storeOffers.length} offer{storeOffers.length > 1 ? 's' : ''} available for this store</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Percent className="w-3 h-3" />
                      <span>No offers available for this store</span>
                    </div>
                  )}
                </div>
              )}

              {/* Savings Badge */}
              {(appliedPromo || deliveryFee < 99) && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      You're saving {formatPrice(promoDiscount + (99 - deliveryFee))} on this order!
                    </span>
                  </div>
                </div>
              )}

              {/* Place Order Button */}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <span>Placing Order...</span>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span>Place Order</span>
                    <div className="flex items-center gap-2">
                      <span>{formatPrice(grandTotal)}</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Your payment information is secure</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Address Selector Modal */}
      <AddressSelector
        isOpen={showAddressSelector}
        onClose={() => setShowAddressSelector(false)}
        onSelectAddress={handleAddressFromSelector}
        storeLatitude={storeLatitude}
        storeLongitude={storeLongitude}
        maxDeliveryDistance={MAX_DELIVERY_DISTANCE}
      />

      {/* Offers Modal */}
      {cart?.vendorId && (
        <ViewOffersModal
          isOpen={showOffersModal}
          onClose={() => setShowOffersModal(false)}
          storeId={cart.vendorId}
          cartTotal={cart.total}
          onApplyOffer={handleApplyOffer}
          appliedCode={appliedPromo?.code}
        />
      )}

      {/* Undeliverable Alert Dialog */}
      <AlertDialog open={showUndeliverableDialog} onOpenChange={setShowUndeliverableDialog}>
        <AlertDialogContent className="max-w-md w-[90vw] mx-auto">
          <AlertDialogHeader>
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-2 text-center sm:text-left">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg sm:text-xl">Delivery Not Available</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm sm:text-base leading-relaxed text-center sm:text-left">
              <p className="mb-3">
                Sorry, we cannot deliver to this location. The delivery distance is{' '}
                <span className="font-semibold text-foreground">
                  {pincodeDistance ? formatDistance(pincodeDistance) : 'too far'}
                </span>
                , which exceeds our maximum delivery radius of{' '}
                <span className="font-semibold text-foreground">{MAX_DELIVERY_DISTANCE} km</span>.
              </p>
              <p className="text-muted-foreground">
                Please try a different delivery address within our service area.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogAction 
              onClick={() => setShowUndeliverableDialog(false)}
              className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
            >
              Change Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="px-4 py-3">
          {/* Delivery status indicator */}
          {isCalculatingDistance && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating delivery distance...</span>
            </div>
          )}
          {!isDeliveryAvailable && distance !== null && !isCalculatingDistance && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Delivery not available - {formatDistance(distance)} away</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {/* Total Summary */}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold text-amber-600">{formatPrice(grandTotal)}</p>
            </div>
            
            {/* Place Order Button */}
            <Button
              size="lg"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg h-12"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !isDeliveryAvailable || isCalculatingDistance}
            >
              {isPlacingOrder ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Place Order
                  <ChevronRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
