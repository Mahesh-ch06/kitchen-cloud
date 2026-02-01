import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Clock, CheckCircle, XCircle, 
  Truck, ChefHat, AlertCircle, MoreVertical,
  Package, Navigation, MapPin, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FadeIn } from '@/components/ui/animated-container';
import { VendorOrderWithDetails, useUpdateOrderStatus } from '@/hooks/useVendorData';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrdersTabProps {
  orders: VendorOrderWithDetails[] | undefined;
  isLoading: boolean;
}

const statusConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  label: string;
  nextStatus?: string;
  nextLabel?: string;
}> = {
  pending: { 
    icon: Clock, 
    color: 'bg-warning/20 text-warning', 
    label: 'Pending',
    nextStatus: 'confirmed',
    nextLabel: 'Confirm Order'
  },
  confirmed: { 
    icon: CheckCircle, 
    color: 'bg-primary/20 text-primary', 
    label: 'Confirmed',
    nextStatus: 'preparing',
    nextLabel: 'Start Preparing'
  },
  preparing: { 
    icon: ChefHat, 
    color: 'bg-accent/20 text-accent', 
    label: 'Preparing',
    nextStatus: 'ready',
    nextLabel: 'Mark Ready'
  },
  ready: { 
    icon: AlertCircle, 
    color: 'bg-success/20 text-success', 
    label: 'Ready for Pickup',
    nextStatus: 'dispatched',
    nextLabel: 'Dispatch Order'
  },
  dispatched: { 
    icon: Truck, 
    color: 'bg-primary/20 text-primary', 
    label: 'Dispatched' 
  },
  delivered: { 
    icon: CheckCircle, 
    color: 'bg-success/20 text-success', 
    label: 'Delivered' 
  },
  cancelled: { 
    icon: XCircle, 
    color: 'bg-destructive/20 text-destructive', 
    label: 'Cancelled' 
  },
};

// Delivery status configuration (for showing delivery partner progress)
const deliveryStatusConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  description: string;
}> = {
  pending: {
    icon: Clock,
    color: 'bg-warning/20 text-warning',
    label: 'Waiting for Pickup',
    description: 'Waiting for a delivery partner to accept'
  },
  accepted: {
    icon: User,
    color: 'bg-primary/20 text-primary',
    label: 'Partner Assigned',
    description: 'Delivery partner is on the way to pickup'
  },
  picked_up: {
    icon: Package,
    color: 'bg-accent/20 text-accent',
    label: 'Picked Up',
    description: 'Order picked up by delivery partner'
  },
  in_transit: {
    icon: Navigation,
    color: 'bg-primary/20 text-primary',
    label: 'Out for Delivery',
    description: 'On the way to customer'
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-success/20 text-success',
    label: 'Delivered',
    description: 'Successfully delivered to customer'
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-destructive/20 text-destructive',
    label: 'Cancelled',
    description: 'Delivery was cancelled'
  },
};

// Check if order can be cancelled (not after pickup)
const canCancelOrder = (order: VendorOrderWithDetails): boolean => {
  // Can't cancel if already cancelled or delivered
  if (order.status === 'cancelled' || order.status === 'delivered') return false;
  
  // Check delivery assignment status
  const deliveryStatus = order.delivery_assignment?.status;
  
  // Can't cancel if picked up, in transit, or delivered
  if (deliveryStatus && ['picked_up', 'in_transit', 'delivered'].includes(deliveryStatus)) {
    return false;
  }
  
  return true;
};

export function OrdersTab({ orders, isLoading }: OrdersTabProps) {
  const [filter, setFilter] = useState<string>('all');
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <FadeIn>
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Orders will appear here when customers place them</p>
        </div>
      </FadeIn>
    );
  }

  // Custom filter logic to handle delivery status
  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    
    if (filter === 'dispatched') {
      // Dispatched = order dispatched but NOT yet picked up
      return orders.filter(o => 
        o.status === 'dispatched' && 
        (!o.delivery_assignment?.status || 
         ['pending', 'accepted'].includes(o.delivery_assignment.status))
      );
    }
    
    if (filter === 'out_for_delivery') {
      // Out for delivery = picked up or in transit
      return orders.filter(o => 
        o.status === 'dispatched' && 
        o.delivery_assignment?.status && 
        ['picked_up', 'in_transit'].includes(o.delivery_assignment.status)
      );
    }
    
    return orders.filter(o => o.status === filter);
  };

  const filteredOrders = getFilteredOrders();

  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );

  // Count for dispatched (waiting for pickup)
  const dispatchedCount = orders.filter(o => 
    o.status === 'dispatched' && 
    (!o.delivery_assignment?.status || 
     ['pending', 'accepted'].includes(o.delivery_assignment.status))
  ).length;

  // Count for out for delivery
  const outForDeliveryCount = orders.filter(o => 
    o.status === 'dispatched' && 
    o.delivery_assignment?.status && 
    ['picked_up', 'in_transit'].includes(o.delivery_assignment.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery', 'delivered'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="flex-shrink-0"
          >
            {status === 'all' ? 'All Orders' : 
             status === 'out_for_delivery' ? 'Out for Delivery' :
             status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'pending' && activeOrders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-warning text-warning-foreground text-xs rounded-full">
                {activeOrders.filter(o => o.status === 'pending').length}
              </span>
            )}
            {status === 'dispatched' && dispatchedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {dispatchedCount}
              </span>
            )}
            {status === 'out_for_delivery' && outForDeliveryCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {outForDeliveryCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <FadeIn>
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={order.id}
                whileHover={{ y: -2 }}
                className="rounded-2xl bg-card border border-border p-5 hover:shadow-medium transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono font-semibold">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status.nextStatus && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(order.id, status.nextStatus!)}
                            className="text-primary"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {status.nextLabel}
                          </DropdownMenuItem>
                        )}
                        {canCancelOrder(order) ? (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        ) : order.delivery_assignment?.status && ['picked_up', 'in_transit'].includes(order.delivery_assignment.status) ? (
                          <DropdownMenuItem disabled className="text-muted-foreground">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cannot cancel (picked up)
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Delivery Status - Show when order is dispatched */}
                {order.delivery_assignment && order.status === 'dispatched' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        Delivery Status
                      </p>
                      {(() => {
                        const deliveryStatus = deliveryStatusConfig[order.delivery_assignment?.status || 'pending'];
                        const DeliveryIcon = deliveryStatus?.icon || Clock;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${deliveryStatus?.color || 'bg-muted text-muted-foreground'}`}>
                            <DeliveryIcon className="w-3.5 h-3.5" />
                            {deliveryStatus?.label || 'Unknown'}
                          </span>
                        );
                      })()}
                    </div>
                    
                    {/* Delivery Progress */}
                    <div className="flex items-center gap-2 mb-3">
                      {['pending', 'accepted', 'picked_up', 'in_transit', 'delivered'].map((step, index) => {
                        const currentIndex = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered'].indexOf(order.delivery_assignment?.status || 'pending');
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`w-3 h-3 rounded-full ${
                              isCompleted 
                                ? 'bg-primary' 
                                : 'bg-muted'
                            } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                            {index < 4 && (
                              <div className={`flex-1 h-0.5 ${
                                index < currentIndex ? 'bg-primary' : 'bg-muted'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {deliveryStatusConfig[order.delivery_assignment?.status || 'pending']?.description}
                    </p>
                    
                    {order.delivery_assignment?.picked_up_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Picked up at: {format(new Date(order.delivery_assignment.picked_up_at), 'HH:mm')}
                      </p>
                    )}
                    {order.delivery_assignment?.delivered_at && (
                      <p className="text-xs text-success mt-1">
                        ✓ Delivered at: {format(new Date(order.delivery_assignment.delivered_at), 'HH:mm')}
                      </p>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium mb-2">Order Items</p>
                  <div className="space-y-2">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">₹{Number(item.price_at_order).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="text-sm font-medium truncate max-w-[300px]">{order.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold">₹{Number(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                {status.nextStatus && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, status.nextStatus!)}
                    >
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {status.nextLabel}
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </FadeIn>
    </div>
  );
}
