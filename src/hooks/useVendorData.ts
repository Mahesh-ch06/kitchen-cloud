import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Types
export interface VendorStats {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalMenuItems: number;
  totalStores: number;
}

export interface VendorOrderWithDetails extends Tables<'orders'> {
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price_at_order: number;
    notes: string | null;
  }>;
  delivery_assignment?: {
    id: string;
    status: string;
    delivery_partner_id: string | null;
    assigned_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
  } | null;
}

// Fetch vendor profile
export function useVendorProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// Fetch vendor's stores
export function useVendorStores() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendor-stores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// Fetch vendor's orders across all stores with REAL-TIME delivery updates
export function useVendorOrders(limit = 20) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Set up real-time subscription for delivery status updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('vendor-delivery-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_assignments',
        },
        (payload) => {
          console.log('Vendor: Delivery status updated:', payload);
          // Refresh orders when delivery status changes
          queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Vendor: New order received:', payload);
          queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['vendor-orders', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get vendor's store IDs
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('vendor_id', user.id);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) return [];

      const storeIds = stores.map(s => s.id);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(id, name, quantity, price_at_order, notes),
          delivery_assignment:delivery_assignments(id, status, delivery_partner_id, assigned_at, picked_up_at, delivered_at)
        `)
        .in('store_id', storeIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VendorOrderWithDetails[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Backup polling every 30 seconds
  });
}

// Fetch vendor's menu items across all stores
export function useVendorMenuItems() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendor-menu-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get vendor's store IDs
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('vendor_id', user.id);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) return [];

      const storeIds = stores.map(s => s.id);

      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(name),
          store:stores(name)
        `)
        .in('store_id', storeIds)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// Fetch vendor statistics
export function useVendorStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendor-stats', user?.id],
    queryFn: async (): Promise<VendorStats> => {
      if (!user?.id) {
        return {
          todayOrders: 0,
          pendingOrders: 0,
          todayRevenue: 0,
          totalMenuItems: 0,
          totalStores: 0,
        };
      }
      
      // Get vendor's store IDs
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('vendor_id', user.id);

      if (storesError) throw storesError;
      
      const storeIds = stores?.map(s => s.id) || [];
      
      if (storeIds.length === 0) {
        return {
          todayOrders: 0,
          pendingOrders: 0,
          todayRevenue: 0,
          totalMenuItems: 0,
          totalStores: 0,
        };
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch orders and menu items count
      const [ordersResult, menuItemsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('status, total_amount, created_at')
          .in('store_id', storeIds),
        supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .in('store_id', storeIds),
      ]);

      const orders = ordersResult.data || [];
      
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= today && orderDate < tomorrow;
      });

      const pendingOrders = orders.filter(o => 
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      );

      const todayRevenue = todayOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        todayOrders: todayOrders.length,
        pendingOrders: pendingOrders.length,
        todayRevenue,
        totalMenuItems: menuItemsResult.count || 0,
        totalStores: storeIds.length,
      };
    },
    enabled: !!user?.id,
  });
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats', user?.id] });
    },
  });
}
