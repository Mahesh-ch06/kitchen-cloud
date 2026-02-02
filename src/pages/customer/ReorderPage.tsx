import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowLeft, Plus, Search, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomerOrders } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { formatPrice } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';

interface OrderedItem {
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  lastOrderedDate: string;
  timesOrdered: number;
  isVeg?: boolean;
  rating?: number;
}

export function ReorderPage() {
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading } = useCustomerOrders();
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  // Extract unique items from all orders
  const orderedItems = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const itemsMap = new Map<string, OrderedItem>();

    orders.forEach(order => {
      order.order_items?.forEach(orderItem => {
        const key = `${orderItem.name}-${order.store_id}`;
        
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)!;
          existing.timesOrdered += orderItem.quantity;
          // Update to most recent order date if newer
          if (new Date(order.created_at) > new Date(existing.lastOrderedDate)) {
            existing.lastOrderedDate = order.created_at;
          }
        } else {
          itemsMap.set(key, {
            menuItemId: orderItem.id,
            name: orderItem.name,
            description: undefined,
            price: Number(orderItem.price_at_order),
            image: undefined,
            category: undefined,
            storeId: order.store_id,
            storeName: order.store?.name || 'Unknown Store',
            storeLogo: order.store?.logo_url,
            lastOrderedDate: order.created_at,
            timesOrdered: orderItem.quantity,
            isVeg: undefined,
            rating: undefined,
          });
        }
      });
    });

    // Sort by most recently ordered
    return Array.from(itemsMap.values()).sort(
      (a, b) => new Date(b.lastOrderedDate).getTime() - new Date(a.lastOrderedDate).getTime()
    );
  }, [orders]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return orderedItems;
    const query = searchQuery.toLowerCase();
    return orderedItems.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.storeName.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
  }, [orderedItems, searchQuery]);

  const handleAddToCart = async (item: OrderedItem) => {
    const itemKey = `${item.name}-${item.storeId}`;
    setAddingItems(prev => new Set([...prev, itemKey]));

    try {
      // Fetch current menu item from database
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', item.storeId)
        .eq('name', item.name)
        .eq('is_available', true)
        .limit(1);

      if (menuItems && menuItems.length > 0) {
        const menuItem = menuItems[0];
        
        // Convert database item to MenuItem type
        const cartItem: any = {
          id: menuItem.id,
          vendorId: menuItem.store_id,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          category: menuItem.category_id,
          image: menuItem.image_url,
          available: menuItem.is_available,
          preparationTime: menuItem.preparation_time,
        };
        
        // Check if adding from different vendor
        if (cart && cart.vendorId !== item.storeId) {
          const confirmed = window.confirm(
            `Your cart contains items from another store. Do you want to clear the cart and add items from ${item.storeName}?`
          );
          if (!confirmed) {
            setAddingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemKey);
              return newSet;
            });
            return;
          }
        }

        addToCart(cartItem, item.storeId);
        toast.success(`${item.name} added to cart!`, {
          description: `From ${item.storeName}`,
        });
      } else {
        toast.error(`${item.name} is currently unavailable`, {
          description: 'This item may have been removed from the menu',
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">You need to sign in to view your reorder items</p>
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold hidden sm:inline">CloudKitchen</span>
            </Link>
          </div>
          
          <Link to="/orders">
            <Button variant="ghost" size="sm">My Orders</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 max-w-5xl">
        {/* Page Title & Search */}
        <FadeIn>
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Reorder</h1>
            <p className="text-muted-foreground">Your favorite items, ready to order again</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your previous orders..."
              className="pl-12 h-12 rounded-xl border-2 text-base"
            />
          </div>
        </FadeIn>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <FadeIn>
            <div className="text-center py-16">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No items found' : 'No previous orders'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term' : 'Start ordering to see items here'}
              </p>
              <Link to="/menu">
                <Button variant="hero">Browse Menu</Button>
              </Link>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.05}>
            {filteredItems.map(item => {
              const itemKey = `${item.name}-${item.storeId}`;
              const isAdding = addingItems.has(itemKey);
              const isInCart = cart?.items.some(
                cartItem => cartItem.name === item.name && cart.vendorId === item.storeId
              );

              return (
                <FadeInStaggerItem key={itemKey}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  >
                    {/* Item Image */}
                    <div className="relative h-32 bg-gradient-to-br from-secondary to-secondary/50">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Veg/Non-veg Badge */}
                      {item.isVeg !== undefined && (
                        <div className={`absolute top-2 left-2 w-5 h-5 border-2 flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1 line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            {item.storeLogo && (
                              <img src={item.storeLogo} alt="" className="w-4 h-4 rounded-full" />
                            )}
                            {item.storeName}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ordered {item.timesOrdered}x
                        </span>
                        {item.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Price & Add Button */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={isAdding}
                          size="sm"
                          className={`h-9 ${isInCart ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {isAdding ? 'Adding...' : isInCart ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </FadeInStaggerItem>
              );
            })}
          </FadeInStagger>
        )}
      </div>

      <CustomerBottomNav />
    </div>
  );
}
