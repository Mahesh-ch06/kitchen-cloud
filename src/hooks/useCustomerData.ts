import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useEffect } from 'react';

// Types
export interface StoreWithDetails extends Tables<'stores'> {
  vendor?: {
    business_name: string;
    is_verified: boolean;
  } | null;
  menu_items_count?: number;
  distance?: number; // Distance in km from user
}

export interface MenuItemWithCategory extends Tables<'menu_items'> {
  category?: {
    name: string;
    sort_order: number | null;
  } | null;
}

export interface OrderWithDetails extends Tables<'orders'> {
  store?: {
    name: string;
    logo_url: string | null;
  } | null;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price_at_order: number;
    notes: string | null;
  }>;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch all active stores with location-based filtering
export function useStores() {
  const { location } = useLocation();

  return useQuery({
    queryKey: ['stores', location?.latitude, location?.longitude, location?.area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          vendor:vendors(business_name, is_verified)
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      
      let stores = data as StoreWithDetails[];
      
      // If user has coordinates, calculate distance and filter/sort by proximity
      if (location?.latitude && location?.longitude) {
        stores = stores.map(store => {
          if (store.latitude && store.longitude) {
            const distance = calculateDistance(
              location.latitude!,
              location.longitude!,
              Number(store.latitude),
              Number(store.longitude)
            );
            return { ...store, distance };
          }
          return { ...store, distance: undefined };
        });
        
        // Filter stores within 15km radius (if they have coordinates)
        // Keep stores without coordinates (they'll appear at the end)
        stores = stores.filter(store => {
          if (store.distance !== undefined) {
            return store.distance <= 15;
          }
          return true; // Include stores without location data
        });
        
        // Sort by distance (stores with coordinates first, then by distance)
        stores.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }
      
      // If user has area name but no coordinates, filter by address matching
      if (location?.area && !location.latitude) {
        const areaLower = location.area.toLowerCase();
        stores = stores.filter(store => 
          store.address.toLowerCase().includes(areaLower) ||
          store.address.toLowerCase().includes(location.city?.toLowerCase() || '')
        );
      }
      
      return stores;
    },
  });
}

// Fetch a single store by ID
export function useStore(storeId: string | null) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          vendor:vendors(business_name, is_verified)
        `)
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data as StoreWithDetails;
    },
    enabled: !!storeId,
  });
}

// Fetch menu items for a store
export function useMenuItems(storeId: string | null) {
  return useQuery({
    queryKey: ['menu-items', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(name, sort_order)
        `)
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      return data as MenuItemWithCategory[];
    },
    enabled: !!storeId,
  });
}

// Fetch menu categories for a store
export function useMenuCategories(storeId: string | null) {
  return useQuery({
    queryKey: ['menu-categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
}

// Fetch customer orders with real-time updates
export function useCustomerOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('customer-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Customer order update:', payload);
          queryClient.invalidateQueries({ queryKey: ['customer-orders', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
        },
        (payload) => {
          // Refresh orders when delivery status changes
          queryClient.invalidateQueries({ queryKey: ['customer-orders', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
  
  return useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name, logo_url),
          order_items(id, name, quantity, price_at_order, notes)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderWithDetails[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Backup polling every 30 seconds
  });
}

// Fetch featured stores (high rated, with location awareness)
export function useFeaturedStores(limit = 6) {
  const { location } = useLocation();

  return useQuery({
    queryKey: ['featured-stores', limit, location?.latitude, location?.longitude],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          vendor:vendors(business_name, is_verified)
        `)
        .eq('is_active', true)
        .gte('rating', 4)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      let stores = data as StoreWithDetails[];
      
      // If user has location, add distance info
      if (location?.latitude && location?.longitude) {
        stores = stores.map(store => {
          if (store.latitude && store.longitude) {
            const distance = calculateDistance(
              location.latitude!,
              location.longitude!,
              Number(store.latitude),
              Number(store.longitude)
            );
            return { ...store, distance };
          }
          return store;
        });
      }
      
      return stores;
    },
  });
}

// Fetch popular menu items across all stores
export function usePopularMenuItems(limit = 6) {
  return useQuery({
    queryKey: ['popular-menu-items', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          store:stores(name, is_active)
        `)
        .eq('is_available', true)
        .order('price', { ascending: false })
        .limit(limit);

      if (error) throw error;
      // Filter out items from inactive stores
      return (data || []).filter((item: any) => item.store?.is_active);
    },
  });
}
