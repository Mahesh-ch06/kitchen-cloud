import { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Package, Clock, CheckCircle, Truck, ArrowLeft, 
  MapPin, Phone, Star, Navigation, User, Bike,
  ShoppingBag, Utensils, Timer, Map as MapIcon, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/currency';
import { FadeIn } from '@/components/ui/animated-container';
import { LiveTrackingMap } from '@/components/customer/LiveTrackingMap';
import 'leaflet/dist/leaflet.css';

// Order status steps for tracking
const trackingSteps = [
  { status: 'pending', label: 'Order Placed', icon: ShoppingBag, description: 'Your order has been received' },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Restaurant confirmed your order' },
  { status: 'preparing', label: 'Preparing', icon: Utensils, description: 'Your food is being prepared' },
  { status: 'ready', label: 'Ready', icon: Package, description: 'Order is ready for pickup' },
  { status: 'dispatched', label: 'Dispatched', icon: Bike, description: 'Delivery partner on the way to pickup' },
  { status: 'picked_up', label: 'Picked Up', icon: Truck, description: 'Delivery partner picked up your order' },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Order delivered successfully!' },
];

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  notes: string | null;
  created_at: string;
  store?: {
    name: string;
    address: string;
    phone: string | null;
    logo_url: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price_at_order: number;
  }>;
  delivery_assignment?: {
    id: string;
    status: string;
    delivery_partner_id: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    delivery_partner?: {
      id: string;
      vehicle_type: string | null;
      vehicle_number: string | null;
      current_latitude: number | null;
      current_longitude: number | null;
      profile?: {
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        avatar_url: string | null;
      } | null;
    } | null;
  } | null;
}

// Custom hook for real-time order tracking
function useOrderTracking(orderId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!orderId || !user?.id) return;

    console.log('Setting up real-time tracking for order:', orderId);

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Order update:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Delivery update:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] });
        }
      )
      .subscribe((status) => {
        console.log('Tracking subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id, queryClient]);

  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      // First, get order with basic delivery assignment
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          delivery_address,
          delivery_latitude,
          delivery_longitude,
          notes,
          created_at,
          store:stores(name, address, phone, logo_url, latitude, longitude),
          order_items(id, name, quantity, price_at_order),
          delivery_assignment:delivery_assignments(
            id,
            status,
            delivery_partner_id,
            picked_up_at,
            delivered_at
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      // Handle delivery_assignment array
      let order = orderData as any;
      if (Array.isArray(order.delivery_assignment)) {
        order.delivery_assignment = order.delivery_assignment[0] || null;
      }

      // If there's a delivery partner, fetch their details separately
      if (order.delivery_assignment?.delivery_partner_id) {
        const { data: partnerData } = await supabase
          .from('delivery_partners')
          .select(`
            id,
            vehicle_type,
            vehicle_number,
            current_latitude,
            current_longitude
          `)
          .eq('id', order.delivery_assignment.delivery_partner_id)
          .single();

        if (partnerData) {
          // Also try to get profile info
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone, avatar_url')
            .eq('id', order.delivery_assignment.delivery_partner_id)
            .single();

          order.delivery_assignment.delivery_partner = {
            ...partnerData,
            profile: profileData || null
          };
        }
      }
      
      return order as OrderDetails;
    },
    enabled: !!orderId && !!user?.id,
    refetchInterval: 10000, // Backup polling every 10 seconds
  });
}

// Get the current step index based on order and delivery status
function getCurrentStepIndex(order: OrderDetails): number {
  const orderStatus = order.status;
  const deliveryStatus = order.delivery_assignment?.status;

  // Map statuses to step indices
  if (orderStatus === 'delivered' || deliveryStatus === 'delivered') return 6;
  if (deliveryStatus === 'in_transit' || deliveryStatus === 'picked_up') return 5;
  if (orderStatus === 'dispatched' && deliveryStatus === 'accepted') return 4;
  if (orderStatus === 'dispatched') return 4;
  if (orderStatus === 'ready') return 3;
  if (orderStatus === 'preparing') return 2;
  if (orderStatus === 'confirmed') return 1;
  return 0; // pending
}

// Estimated time based on status
function getEstimatedTime(stepIndex: number): string {
  if (stepIndex >= 6) return 'Delivered!';
  if (stepIndex >= 5) return '5-10 mins';
  if (stepIndex >= 4) return '15-20 mins';
  if (stepIndex >= 3) return '20-25 mins';
  if (stepIndex >= 2) return '25-35 mins';
  if (stepIndex >= 1) return '30-40 mins';
  return '35-45 mins';
}

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated } = useAuth();
  const { data: order, isLoading, error } = useOrderTracking(orderId || '');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">You need to sign in to track your order</p>
          <Link to="/login">
            <Button variant="hero">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pb-safe-area-bottom">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <p className="text-muted-foreground mb-6">This order doesn't exist or you don't have access</p>
          <Link to="/orders">
            <Button variant="hero">View Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex(order);
  const estimatedTime = getEstimatedTime(currentStep);
  const isDelivered = currentStep >= 6;
  const deliveryPartner = order.delivery_assignment?.delivery_partner;

  // Map coordinates using actual data from order and store
  // Default to a central India location if coordinates are not available
  const defaultLat = 20.5937;
  const defaultLng = 78.9629;
  
  const restaurantLocation: [number, number] = [
    order.store?.latitude ?? defaultLat,
    order.store?.longitude ?? defaultLng
  ];
  
  const customerLocation: [number, number] = [
    order.delivery_latitude ?? defaultLat,
    order.delivery_longitude ?? defaultLng
  ];
  
  // Delivery partner location - use their real-time coordinates if available
  // Otherwise interpolate between restaurant and customer based on status
  const getDeliveryPartnerLocation = (): [number, number] => {
    // If we have real delivery partner coordinates, use them
    if (deliveryPartner?.current_latitude && deliveryPartner?.current_longitude) {
      return [deliveryPartner.current_latitude, deliveryPartner.current_longitude];
    }
    
    // Otherwise, estimate position based on status
    // dispatched/accepted = near restaurant
    // picked_up/in_transit = between restaurant and customer
    if (currentStep <= 4) {
      // Near restaurant
      return restaurantLocation;
    } else if (currentStep === 5) {
      // Midway between restaurant and customer
      const midLat = (restaurantLocation[0] + customerLocation[0]) / 2;
      const midLng = (restaurantLocation[1] + customerLocation[1]) / 2;
      return [midLat, midLng];
    }
    // Delivered - at customer location
    return customerLocation;
  };
  
  const deliveryPartnerLocation: [number, number] = getDeliveryPartnerLocation();

  // Show map only when delivery partner is assigned (step 4+) and we have valid coordinates
  const hasValidCoordinates = (
    order.store?.latitude && order.store?.longitude &&
    order.delivery_latitude && order.delivery_longitude
  );
  const showMap = currentStep >= 4 && !isDelivered && hasValidCoordinates;

  return (
    <div className="min-h-screen bg-background pb-safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">CloudKitchen</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <FadeIn>
          {/* Order Status Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                isDelivered 
                  ? 'bg-green-500/20 text-green-600' 
                  : 'bg-primary/20 text-primary'
              }`}
            >
              {isDelivered ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Timer className="w-5 h-5" />
                </motion.div>
              )}
              <span className="font-semibold">
                {isDelivered ? 'Delivered!' : `ETA: ${estimatedTime}`}
              </span>
            </motion.div>

            <h1 className="text-2xl font-bold mb-2">
              {isDelivered ? 'Order Delivered! 🎉' : 'Tracking Your Order'}
            </h1>
            <p className="text-muted-foreground">
              Order #{order.id.slice(0, 8)} • {format(new Date(order.created_at), 'MMM d, h:mm a')}
            </p>
          </div>

          {/* Live Map - Show when delivery partner is on the way */}
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      {/* Map Header */}
                      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-2.5 h-2.5 rounded-full bg-green-500"
                            />
                            <span className="text-sm font-semibold">Live Tracking</span>
                          </div>
                        </div>
                        <div className="bg-amber-500 text-white rounded-xl px-4 py-2 shadow-lg font-semibold text-sm">
                          {estimatedTime}
                        </div>
                      </div>

                      {/* Map */}
                      <div className="h-[400px] rounded-xl overflow-hidden">
                        <LiveTrackingMap
                          restaurantLocation={restaurantLocation}
                          customerLocation={customerLocation}
                          deliveryPartnerLocation={deliveryPartnerLocation}
                          storeName={order.store?.name || 'Restaurant'}
                          deliveryAddress={order.delivery_address}
                          deliveryPartner={deliveryPartner}
                          currentStep={currentStep}
                        />
                      </div>

                      {/* Map Footer - Quick Stats */}
                      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-xs text-muted-foreground">Restaurant</div>
                              <div className="text-sm font-semibold mt-1">
                                {currentStep >= 5 ? '✓ Picked up' : 'Preparing'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Distance</div>
                              <div className="text-sm font-semibold mt-1">~2.3 km</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">ETA</div>
                              <div className="text-sm font-semibold mt-1 text-amber-600">{estimatedTime}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Tracker */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="relative">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.status} className="relative">
                      {/* Connection Line */}
                      {index < trackingSteps.length - 1 && (
                        <div 
                          className={`absolute left-5 top-10 w-0.5 h-12 transition-colors duration-500 ${
                            index < currentStep ? 'bg-primary' : 'bg-border'
                          }`}
                        />
                      )}

                      <div className="flex items-start gap-4 mb-6 last:mb-0">
                        {/* Step Icon */}
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isCurrent ? 1.1 : 1,
                            backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                          }}
                          className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isCompleted ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {isCurrent && !isDelivered && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-primary/30"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          <StepIcon className="w-5 h-5" />
                        </motion.div>

                        {/* Step Content */}
                        <div className={`flex-1 pt-1 ${!isCompleted && 'opacity-50'}`}>
                          <h3 className={`font-semibold ${isCurrent && 'text-primary'}`}>
                            {step.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>

                        {/* Completed Check */}
                        {isCompleted && index < currentStep && (
                          <CheckCircle className="w-5 h-5 text-primary mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Partner Card */}
          <AnimatePresence>
            {deliveryPartner && currentStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                          {deliveryPartner.profile?.avatar_url ? (
                            <img 
                              src={deliveryPartner.profile.avatar_url} 
                              alt="Delivery Partner"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-7 h-7 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {deliveryPartner.profile?.first_name || 'Delivery'} {deliveryPartner.profile?.last_name || 'Partner'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {deliveryPartner.vehicle_type && (
                              <span className="flex items-center gap-1">
                                <Bike className="w-4 h-4" />
                                {deliveryPartner.vehicle_type}
                              </span>
                            )}
                            {deliveryPartner.vehicle_number && (
                              <Badge variant="secondary">{deliveryPartner.vehicle_number}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {deliveryPartner.profile?.phone && (
                        <a href={`tel:${deliveryPartner.profile.phone}`}>
                          <Button size="icon" variant="outline" className="rounded-full">
                            <Phone className="w-5 h-5" />
                          </Button>
                        </a>
                      )}
                    </div>

                    {/* Live Location Indicator */}
                    {currentStep >= 5 && currentStep < 6 && (
                      <div className="mt-4 p-3 bg-background rounded-lg flex items-center gap-3">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 rounded-full bg-green-500"
                        />
                        <span className="text-sm">
                          {deliveryPartner.current_latitude && deliveryPartner.current_longitude
                            ? 'Live location available'
                            : 'On the way to you'}
                        </span>
                        <Navigation className="w-4 h-4 text-muted-foreground ml-auto" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Restaurant Info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                Restaurant
              </h3>
              <div className="flex items-center gap-4">
                {order.store?.logo_url ? (
                  <img 
                    src={order.store.logo_url} 
                    alt={order.store.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{order.store?.name || 'Restaurant'}</p>
                  <p className="text-sm text-muted-foreground">{order.store?.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Delivery Address
              </h3>
              <p className="text-muted-foreground">{order.delivery_address}</p>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Order Summary
              </h3>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatPrice(Number(item.price_at_order) * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(Number(order.total_amount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Button */}
          <div className="mt-6 text-center">
            <Link to="/help">
              <Button variant="ghost" className="text-muted-foreground">
                Need help with your order?
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
