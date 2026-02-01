import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Plus, Utensils, Clock, 
  Eye, EyeOff, Leaf, ChefHat, Edit, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { formatPrice } from '@/lib/currency';
import { CreateMenuItemModal } from './CreateMenuItemModal';
import { useVendorStores } from '@/hooks/useVendorData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';

interface MenuTabProps {
  menuItems: (Tables<'menu_items'> & { 
    category?: { name: string } | null;
    store?: { name: string } | null;
  })[] | undefined;
  isLoading: boolean;
}

export function MenuTab({ menuItems, isLoading }: MenuTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVeg, setFilterVeg] = useState<boolean | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: stores } = useVendorStores();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['vendor-menu-items', user?.id] });
      toast.success(`Item ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error('Failed to update item');
    }
  };

  const filteredItems = (menuItems || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = filterVeg === null || item.is_veg === filterVeg;
    return matchesSearch && matchesVeg;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Menu Items</h2>
            <p className="text-sm text-muted-foreground">{filteredItems.length} items</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterVeg === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterVeg(null)}
            className="rounded-full"
          >
            All
          </Button>
          <Button
            variant={filterVeg === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterVeg(true)}
            className="rounded-full gap-1"
          >
            <Leaf className="w-3 h-3" />
            Veg Only
          </Button>
          <Button
            variant={filterVeg === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterVeg(false)}
            className="rounded-full"
          >
            Non-Veg
          </Button>
        </div>

        {/* No stores warning */}
        {(!stores || stores.length === 0) && (
          <FadeIn>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-center">
              <p className="text-warning font-medium">You need to create a store first before adding menu items</p>
            </div>
          </FadeIn>
        )}

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <FadeIn>
            <div className="text-center py-12">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No menu items</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'No items match your search' : 'Add your first menu item to get started'}
              </p>
              {!searchQuery && stores && stores.length > 0 && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              )}
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.05}>
            {filteredItems.map((item) => (
              <FadeInStaggerItem key={item.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="rounded-2xl bg-card border border-border overflow-hidden hover:shadow-medium transition-all"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gradient-to-br from-secondary to-secondary/50">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {item.is_veg && (
                        <span className="w-6 h-6 rounded bg-success flex items-center justify-center">
                          <Leaf className="w-4 h-4 text-white" />
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        item.is_available 
                          ? 'bg-success/20 text-success' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {item.is_available ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Available
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                        {item.store?.name && (
                          <p className="text-xs text-muted-foreground">{item.store.name}</p>
                        )}
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(Number(item.price))}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{item.preparation_time || 15} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Available</span>
                        <Switch
                          checked={item.is_available || false}
                          onCheckedChange={() => handleToggleAvailability(item.id, item.is_available || false)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        )}
      </div>

      <CreateMenuItemModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        stores={stores}
      />
    </>
  );
}
