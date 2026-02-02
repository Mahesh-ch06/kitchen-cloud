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

  const itemsCount = order.order_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0;
  const statusLabel = trackingSteps.find((step) => step.status === order.status)?.label ?? 'In progress';
  const progressPercent = Math.min(100, (currentStep / (trackingSteps.length - 1)) * 100);

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-safe-area-bottom overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
          <Link to="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold">CloudKitchen Track</span>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-8 max-w-6xl">
        <FadeIn>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border border-primary/20 shadow-xl shadow-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                    <h1 className="text-2xl font-bold">{isDelivered ? 'Delivered 🎉' : 'Live order tracking'}</h1>
                    <p className="text-sm text-muted-foreground">Placed on {format(new Date(order.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                      {statusLabel}
                    </Badge>
                    <Badge className="px-3 py-1 text-sm" variant={isDelivered ? 'secondary' : 'default'}>
                      {isDelivered ? 'Completed' : `ETA • ${estimatedTime}`}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      Status
                    </div>
                    <p className="mt-2 text-lg font-semibold">{statusLabel}</p>
                    <p className="text-xs text-muted-foreground">ETA {estimatedTime}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      Items
                    </div>
                    <p className="mt-2 text-lg font-semibold">{itemsCount} item{itemsCount === 1 ? '' : 's'}</p>
                    <p className="text-xs text-muted-foreground">Total {formatPrice(Number(order.total_amount))}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapIcon className="w-4 h-4" />
                      Destination
                    </div>
                    <p className="mt-2 text-lg font-semibold">{order.delivery_address.split(',')[0]}</p>
                    <p className="text-xs text-muted-foreground">{order.delivery_address.split(',').slice(1, 3).join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/20 bg-primary/5 shadow-xl shadow-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Quick actions</h3>
                </div>
                <div className="space-y-3">
                  <Link to="/orders" className="block">
                    <Button variant="outline" className="w-full justify-between">
                      View all orders
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-between" asChild>
                    <a href="tel:+91-0000000000">
                      Call support
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  {!isDelivered && (
                    <Button variant="secondary" className="w-full justify-between">
                      Share live status
                      <MapPin className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <AnimatePresence>
            {showMap ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-2"
              >
                <Card className="overflow-hidden border border-primary/20 shadow-xl shadow-primary/5">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
                        <div className="bg-background/90 backdrop-blur-md rounded-xl px-4 py-2 shadow-lg border border-border/70">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                            />
                            <span className="text-sm font-semibold">Live tracking</span>
                          </div>
                        </div>
                        <div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 shadow-lg font-semibold text-sm">
                          ETA {estimatedTime}
                        </div>
                      </div>

                      <div className="h-[420px] rounded-xl overflow-hidden">
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

                      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                        <div className="bg-background/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-border/70">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-xs text-muted-foreground">Restaurant</div>
                              <div className="text-sm font-semibold mt-1">
                                {currentStep >= 5 ? 'Picked up' : 'Preparing'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Status</div>
                              <div className="text-sm font-semibold mt-1">{statusLabel}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">ETA</div>
                              <div className="text-sm font-semibold mt-1 text-primary">{estimatedTime}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="border border-dashed border-border/80 bg-background/70 shadow-inner">
                <CardContent className="p-6 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Live map will appear once your order is dispatched.</p>
                    <p className="text-sm text-muted-foreground">We will start tracking as soon as a partner is assigned.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 overflow-hidden border border-border/80">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    Journey
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Current: {statusLabel}
                  </Badge>
                </div>
                <div className="relative mt-2 overflow-x-auto pb-4">
                  <div className="min-w-[720px]">
                    <div className="relative">
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-100" />
                      <div
                        className="absolute left-0 top-1/2 h-0.5 bg-emerald-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                      <div className="relative flex justify-between">
                        {trackingSteps.map((step, index) => {
                          const isCompleted = index <= currentStep;
                          const isCurrent = index === currentStep;
                          const StepIcon = step.icon;
                          const isFuture = index > currentStep;
                          return (
                            <div key={step.status} className="flex flex-col items-center text-center w-full">
                              <motion.div
                                animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                                transition={{ duration: 1.1, repeat: isCurrent ? Infinity : 0 }}
                                className={`flex h-11 w-11 items-center justify-center rounded-full border-[2px] shadow-sm transition-all ${
                                  isCurrent
                                    ? 'border-emerald-500 bg-white text-emerald-600 shadow-lg shadow-emerald-100 scale-110 -translate-y-1'
                                    : isCompleted
                                      ? 'border-emerald-400 bg-white text-emerald-600'
                                      : 'border-border text-muted-foreground bg-muted/40'
                                }`}
                              >
                                <StepIcon className="w-5 h-5" />
                              </motion.div>
                              <p
                                className={`mt-2 text-xs font-semibold transition-colors ${
                                  isCurrent
                                    ? 'text-emerald-600'
                                    : isFuture
                                      ? 'text-muted-foreground/70'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {trackingSteps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.status}
                        className={`rounded-2xl border p-4 transition-all ${
                          isCurrent
                            ? 'border-primary/60 bg-primary/5 shadow-md'
                            : isCompleted
                              ? 'border-border bg-background'
                              : 'border-border/70 bg-background/60 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${isCurrent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{step.label}</h4>
                              {isCompleted && <CheckCircle className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <AnimatePresence>
              {deliveryPartner && currentStep >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border border-primary/20 bg-primary/5 shadow-lg">
                    <CardContent className="p-6 space-y-4">
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

                      {currentStep >= 5 && currentStep < 6 && (
                        <div className="mt-2 p-3 bg-background rounded-lg flex items-center gap-3 border border-border/70">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-3 h-3 rounded-full bg-emerald-500"
                          />
                          <span className="text-sm">
                            {deliveryPartner.current_latitude && deliveryPartner.current_longitude
                              ? 'Live location active'
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
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border border-border/80">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
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
                    {order.store?.phone && (
                      <a href={`tel:${order.store.phone}`} className="text-sm text-primary hover:underline">
                        Call restaurant
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery address
                </h3>
                <p className="text-muted-foreground leading-relaxed">{order.delivery_address}</p>
                {order.notes && (
                  <div className="rounded-lg bg-muted/50 border border-border/70 p-3 text-sm text-muted-foreground">
                    Note: {order.notes}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order summary
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
          </div>

          <div className="mt-6 text-center">
            <Link to="/help">
              <Button variant="ghost" className="text-muted-foreground">
                Need help with your order?
              </Button>
            </Link>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
