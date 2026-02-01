import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, MapPin, Clock, Phone, Star, Plus, 
  Edit, Settings, Eye, EyeOff, Utensils, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { Tables } from '@/integrations/supabase/types';
import { CreateStoreModal } from './CreateStoreModal';
import { EditStoreModal } from './EditStoreModal';
import { StoreSettingsModal } from './StoreSettingsModal';
import { RequestMoreStoresModal } from './RequestMoreStoresModal';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface StoresTabProps {
  stores: Tables<'stores'>[] | undefined;
  menuItems: any[] | undefined;
  isLoading: boolean;
}

export function StoresTab({ stores, menuItems, isLoading }: StoresTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Tables<'stores'> | null>(null);
  const [settingsStore, setSettingsStore] = useState<Tables<'stores'> | null>(null);
  const [maxStores, setMaxStores] = useState(2);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch vendor's max_stores limit
  useEffect(() => {
    const fetchMaxStores = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('max_stores')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const limit = data?.max_stores || 2;
        setMaxStores(limit);
        setCanCreateMore((stores?.length || 0) < limit);
      } catch (error) {
        console.error('Error fetching max stores:', error);
      }
    };

    fetchMaxStores();
  }, [user?.id, stores?.length]);

  const handleToggleActive = async (storeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !currentStatus })
        .eq('id', storeId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['vendor-stores', user?.id] });
      toast.success(`Store ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update store status');
    }
  };

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Your Stores</h2>
            <p className="text-sm text-muted-foreground">
              {stores?.length || 0} of {maxStores} stores created
            </p>
          </div>
          <div className="flex gap-2">
            {canCreateMore ? (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Store
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsRequestModalOpen(true)}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Request More
              </Button>
            )}
          </div>
        </div>

        {!canCreateMore && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your limit of {maxStores} stores. Request an increase from admin to create more.
            </AlertDescription>
          </Alert>
        )}

        {!stores || stores.length === 0 ? (
          <FadeIn>
            <div className="text-center py-12">
              <Store className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stores yet</h3>
              <p className="text-muted-foreground mb-6">Create your first store to start selling</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Store
              </Button>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="grid lg:grid-cols-2 gap-6" staggerDelay={0.1}>
            {stores.map((store) => {
              const storeMenuItems = menuItems?.filter(m => m.store_id === store.id) || [];
              
              return (
                <FadeInStaggerItem key={store.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="rounded-2xl bg-card border border-border overflow-hidden hover:shadow-medium transition-all"
                  >
                    {/* Banner */}
                    <div className="relative h-36 bg-gradient-to-br from-primary/20 to-accent/20">
                      {store.banner_url ? (
                        <img 
                          src={store.banner_url} 
                          alt={store.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : store.logo_url ? (
                        <img 
                          src={store.logo_url} 
                          alt={store.name} 
                          className="w-full h-full object-cover opacity-50"
                        />
                      ) : null}
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                          store.is_active 
                            ? 'bg-success/20 text-success border border-success/30' 
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {store.is_active ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </div>
                      </div>

                      {/* Logo */}
                      <div className="absolute -bottom-8 left-6">
                        <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-lg">
                          {store.logo_url ? (
                            <img 
                              src={store.logo_url} 
                              alt={store.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                              <Store className="w-7 h-7 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-12 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{store.name}</h3>
                          {store.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {store.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/20">
                          <Star className="w-4 h-4 text-warning fill-warning" />
                          <span className="font-semibold text-warning">
                            {store.rating || 'New'}
                          </span>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </div>
                        {store.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {store.opening_time?.slice(0, 5) || '09:00'} - {store.closing_time?.slice(0, 5) || '22:00'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Utensils className="w-4 h-4 flex-shrink-0" />
                          <span>{storeMenuItems.length} menu items</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Store Active</span>
                          <Switch 
                            checked={store.is_active || false}
                            onCheckedChange={() => handleToggleActive(store.id, store.is_active || false)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingStore(store)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSettingsStore(store)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </FadeInStaggerItem>
              );
            })}
          </FadeInStagger>
        )}
      </div>

      <CreateStoreModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        currentStoreCount={stores?.length || 0}
      />

      <RequestMoreStoresModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentLimit={maxStores}
      />

      {editingStore && (
        <EditStoreModal
          isOpen={true}
          onClose={() => setEditingStore(null)}
          store={editingStore}
        />
      )}

      {settingsStore && (
        <StoreSettingsModal
          isOpen={true}
          onClose={() => setSettingsStore(null)}
          store={settingsStore}
        />
      )}
    </>
  );
}
