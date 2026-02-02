import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Package, Clock, CheckCircle, Truck, ArrowLeft, Navigation, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerOrders } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/currency';
import { ReviewModal } from '@/components/customer/ReviewModal';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type OrderStatusType = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatusType, { icon: typeof Package; label: string; color: string; canTrack: boolean }> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-muted-foreground', canTrack: true },
  confirmed: { icon: CheckCircle, label: 'Confirmed', color: 'text-primary', canTrack: true },
  preparing: { icon: ChefHat, label: 'Preparing', color: 'text-accent', canTrack: true },
  ready: { icon: Package, label: 'Ready', color: 'text-success', canTrack: true },
  dispatched: { icon: Truck, label: 'On the way', color: 'text-primary', canTrack: true },
  delivered: { icon: CheckCircle, label: 'Delivered', color: 'text-success', canTrack: false },
  cancelled: { icon: Clock, label: 'Cancelled', color: 'text-destructive', canTrack: false },
};

export function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading, refetch } = useCustomerOrders();
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Check which orders have been reviewed
  useState(() => {
    const checkReviews = async () => {
      if (!orders) return;
      const { data: reviews } = await supabase
        .from('reviews')
        .select('order_id')
        .in('order_id', orders.map(o => o.id));
      
      if (reviews) {
        setReviewedOrders(new Set(reviews.map(r => r.order_id).filter(Boolean)));
      }
    };
    checkReviews();
  });

  const openReviewModal = (order: any) => {
    setSelectedOrder(order);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    if (selectedOrder) {
      setReviewedOrders(prev => new Set([...prev, selectedOrder.id]));
    }
    refetch();
  };

  const handleReorder = async (order: any) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error('This order has no items to reorder');
      return;
    }

    setReorderingId(order.id);

    try {
      // Clear current cart first
      clearCart();

      // Fetch menu items for this store to get current prices and availability
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', order.store_id)
        .eq('is_available', true);

      if (!menuItems) {
        toast.error('Could not load menu items. Please try again.');
        setReorderingId(null);
        return;
      }

      // Add each item from the order to cart
      let itemsAdded = 0;
      let unavailableItems: string[] = [];

      for (const orderItem of order.order_items) {
        // Find the current menu item
        const menuItem = menuItems.find(mi => mi.name === orderItem.name);
        
        if (menuItem) {
          // Add to cart multiple times based on quantity
          for (let i = 0; i < orderItem.quantity; i++) {
            addToCart(menuItem, order.store_id);
          }
          itemsAdded++;
        } else {
          unavailableItems.push(orderItem.name);
        }
      }

      if (itemsAdded > 0) {
        // Show success message
        if (unavailableItems.length > 0) {
          toast.warning(`${itemsAdded} items added to cart. ${unavailableItems.length} items are no longer available.`, {
            description: unavailableItems.length <= 3 
              ? `Unavailable: ${unavailableItems.join(', ')}` 
              : `${unavailableItems.length} items unavailable`,
          });
        } else {
          toast.success(`🎉 Order added to cart!`, {
            description: `${itemsAdded} items from ${order.store?.name || 'your order'}`,
          });
        }
        // Navigate to cart page
        navigate('/cart');
      } else {
        toast.error('None of the items from this order are currently available.', {
          description: 'The menu may have changed since your last order.',
        });
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder. Please try again.');
    } finally {
      setReorderingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">You need to sign in to view your orders</p>
          <Link to="/login">
            <Button variant="hero">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CloudKitchen</span>
          </Link>
          
          <Link to="/menu">
            <Button variant="ghost" className="text-sm md:text-base">Browse Menu</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
        <Link to="/menu" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to menu
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-8">Your Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <FadeIn>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">Start ordering from your favorite kitchens</p>
              <Link to="/menu">
                <Button variant="hero">Browse Menu</Button>
              </Link>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="space-y-4" staggerDelay={0.1}>
            {orders.map(order => {
              const status = statusConfig[order.status as OrderStatusType] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <FadeInStaggerItem key={order.id}>
                  <div className="p-6 rounded-xl bg-card border border-border/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.store?.name || 'Unknown Store'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.id.slice(0, 8)} • {format(new Date(order.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.name}
                          </span>
                          <span>{formatPrice(Number(item.price_at_order) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">{formatPrice(Number(order.total_amount))}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      {/* Reorder Button */}
                      <Button
                        onClick={() => handleReorder(order)}
                        disabled={reorderingId === order.id}
                        variant="outline"
                        className="flex-1 h-11"
                      >
                        <RotateCcw className={`w-4 h-4 mr-2 ${reorderingId === order.id ? 'animate-spin' : ''}`} />
                        {reorderingId === order.id ? 'Adding...' : 'Reorder'}
                      </Button>

                      {/* Track Order Button */}
                      {status.canTrack && (
                        <Link to={`/orders/${order.id}/track`} className="flex-1">
                          <Button variant="outline" className="w-full h-11">
                            <Navigation className="w-4 h-4 mr-2" />
                            Track Order
                          </Button>
                        </Link>
                      )}
                      
                      {/* Review Button - Only for delivered orders */}
                      {order.status === 'delivered' && !reviewedOrders.has(order.id) && (
                        <Button
                          onClick={() => openReviewModal(order)}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Leave Review
                        </Button>
                      )}
                      
                      {/* Already Reviewed Badge */}
                      {order.status === 'delivered' && reviewedOrders.has(order.id) && (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Reviewed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeInStaggerItem>
              );
            })}
          </FadeInStagger>
        )}
      </div>

      {/* Review Modal */}
      {selectedOrder && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          storeId={selectedOrder.store_id}
          storeName={selectedOrder.store?.name || 'Store'}
          orderId={selectedOrder.id}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
