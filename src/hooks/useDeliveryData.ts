import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Types
export interface DeliveryStats {
  todayDeliveries: number;
  todayEarnings: number;
  totalDistance: number;
  averageRating: number;
  onlineHours: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

export interface DeliveryAssignmentWithDetails extends Tables<'delivery_assignments'> {
  order?: {
    id: string;
    total_amount: number;
    delivery_address: string;
    notes: string | null;
    store?: {
      name: string;
      address: string;
      phone: string | null;
    } | null;
    customer?: {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    } | null;
  } | null;
}

// Fetch delivery partner profile
export function useDeliveryProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['delivery-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// Fetch active delivery assignment
export function useActiveDelivery() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['active-delivery', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders(
            id,
            total_amount,
            delivery_address,
            notes,
            store:stores(name, address, phone)
          )
        `)
        .eq('delivery_partner_id', user.id)
        .in('status', ['accepted', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DeliveryAssignmentWithDetails | null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Fetch pending delivery assignments (available to accept) with REAL-TIME updates
export function usePendingDeliveries() {
  const { user } = useAuth();
  const { data: profile } = useDeliveryProfile();
  const queryClient = useQueryClient();
  
  // Set up real-time subscription for delivery_assignments changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for delivery assignments...');
    
    const channel = supabase
      .channel('delivery-assignments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'delivery_assignments',
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // If an assignment was updated (accepted by someone)
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            // If it was pending and now has a delivery_partner_id (accepted by someone else)
            if (oldData.delivery_partner_id === null && newData.delivery_partner_id !== null) {
              // Check if it was accepted by someone else
              if (newData.delivery_partner_id !== user.id) {
                toast.info('Order was accepted by another partner', {
                  description: 'This order is no longer available',
                });
              }
            }
          }
          
          // Immediately refresh the pending deliveries list
          queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=in.(ready,dispatched)',
        },
        (payload) => {
          console.log('Order status changed:', payload);
          // Refresh when orders become ready/dispatched
          queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['pending-deliveries', user?.id],
    queryFn: async () => {
      console.log('=== FETCHING PENDING DELIVERIES ===');
      console.log('User ID:', user?.id);
      console.log('Profile:', profile);
      
      // Fetch ALL pending assignments - no filters on delivery_partner_id initially
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders(
            id,
            total_amount,
            delivery_address,
            notes,
            status,
            customer_id,
            store:stores(name, address, phone)
          )
        `)
        .eq('status', 'pending')
        .is('delivery_partner_id', null)
        .order('created_at', { ascending: true })
        .limit(20);

      console.log('Raw pending deliveries from DB:', data);
      console.log('Query error:', error);
      
      if (error) {
        console.error('Error fetching pending deliveries:', error);
        throw error;
      }
      
      // Only show orders that are DISPATCHED (ready for delivery partner pickup)
      const dispatchedOrders = (data || []).filter(d => 
        d.order !== null && d.order.status === 'dispatched'
      );
      
      console.log('Dispatched orders for pickup:', dispatchedOrders);
      
      return dispatchedOrders as DeliveryAssignmentWithDetails[];
    },
    enabled: !!user?.id, // Always fetch when user is logged in
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000, // Consider data stale after 2 seconds
  });
}

// Fetch delivery history
export function useDeliveryHistory(limit = 20) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['delivery-history', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders(
            id,
            total_amount,
            delivery_address,
            store:stores(name)
          )
        `)
        .eq('delivery_partner_id', user.id)
        .in('status', ['delivered', 'cancelled'])
        .order('delivered_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as DeliveryAssignmentWithDetails[];
    },
    enabled: !!user?.id,
  });
}

// Fetch delivery stats
export function useDeliveryStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['delivery-stats', user?.id],
    queryFn: async (): Promise<DeliveryStats> => {
      if (!user?.id) {
        return {
          todayDeliveries: 0,
          todayEarnings: 0,
          totalDistance: 0,
          averageRating: 0,
          onlineHours: 0,
          weeklyEarnings: 0,
          monthlyEarnings: 0,
        };
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get week's date range
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get month's date range
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const [assignmentsResult, profileResult] = await Promise.all([
        supabase
          .from('delivery_assignments')
          .select(`
            *,
            order:orders(total_amount)
          `)
          .eq('delivery_partner_id', user.id)
          .eq('status', 'delivered'),
        supabase
          .from('delivery_partners')
          .select('rating')
          .eq('id', user.id)
          .single(),
      ]);

      const assignments = assignmentsResult.data || [];
      
      const todayDeliveries = assignments.filter(a => {
        if (!a.delivered_at) return false;
        const deliveredDate = new Date(a.delivered_at);
        return deliveredDate >= today && deliveredDate < tomorrow;
      });

      const weekDeliveries = assignments.filter(a => {
        if (!a.delivered_at) return false;
        const deliveredDate = new Date(a.delivered_at);
        return deliveredDate >= weekAgo;
      });

      const monthDeliveries = assignments.filter(a => {
        if (!a.delivered_at) return false;
        const deliveredDate = new Date(a.delivered_at);
        return deliveredDate >= monthAgo;
      });

      // Calculate earnings (assuming 10% delivery fee)
      const calcEarnings = (items: typeof assignments) => 
        items.reduce((sum, a) => {
          const orderAmount = (a.order as any)?.total_amount || 0;
          return sum + (Number(orderAmount) * 0.1) + 30; // 10% + base ₹30
        }, 0);

      return {
        todayDeliveries: todayDeliveries.length,
        todayEarnings: calcEarnings(todayDeliveries),
        totalDistance: Math.round(todayDeliveries.length * 3.2), // Estimated avg 3.2km per delivery
        averageRating: profileResult.data?.rating || 0,
        onlineHours: 6.5, // Mock for now
        weeklyEarnings: calcEarnings(weekDeliveries),
        monthlyEarnings: calcEarnings(monthDeliveries),
      };
    },
    enabled: !!user?.id,
  });
}

// Accept delivery assignment with RACE CONDITION handling (like Swiggy/Zomato)
export function useAcceptDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      console.log('Attempting to accept delivery:', assignmentId);
      
      // First, check if the assignment is still available (optimistic check)
      const { data: currentAssignment, error: checkError } = await supabase
        .from('delivery_assignments')
        .select('id, status, delivery_partner_id')
        .eq('id', assignmentId)
        .single();

      if (checkError) {
        console.error('Error checking assignment:', checkError);
        throw new Error('Unable to verify order availability');
      }

      // If already taken by someone else
      if (currentAssignment.delivery_partner_id !== null) {
        throw new Error('ORDER_ALREADY_TAKEN');
      }

      if (currentAssignment.status !== 'pending') {
        throw new Error('ORDER_NO_LONGER_AVAILABLE');
      }

      // Attempt to accept with optimistic locking
      // The WHERE clause ensures only pending, unassigned orders can be updated
      const { data, error } = await supabase
        .from('delivery_assignments')
        .update({ 
          delivery_partner_id: user?.id,
          status: 'accepted',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('status', 'pending')
        .is('delivery_partner_id', null) // CRITICAL: Only update if still unassigned
        .select()
        .single();

      if (error) {
        console.error('Error accepting delivery:', error);
        // If no rows were updated, someone else got it first
        if (error.code === 'PGRST116') {
          throw new Error('ORDER_ALREADY_TAKEN');
        }
        throw error;
      }

      if (!data) {
        throw new Error('ORDER_ALREADY_TAKEN');
      }

      console.log('Successfully accepted delivery:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-stats'] });
    },
    onError: (error: Error) => {
      console.error('Accept delivery error:', error);
      // Immediately refresh to get the latest state
      queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
    },
  });
}

// Update delivery status
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      status 
    }: { 
      assignmentId: string; 
      status: 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
    }) => {
      // Get the assignment to find the order_id
      const { data: assignment, error: fetchError } = await supabase
        .from('delivery_assignments')
        .select('order_id')
        .eq('id', assignmentId)
        .single();

      if (fetchError) throw fetchError;

      const updates: Record<string, any> = { status };
      
      if (status === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      // Update delivery assignment status
      const { error } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .eq('delivery_partner_id', user?.id);

      if (error) throw error;

      // Also update the order status when delivered
      if (status === 'delivered' && assignment?.order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', assignment.order_id);

        if (orderError) {
          console.error('Failed to update order status:', orderError);
          // Don't throw - delivery update succeeded
        }
      }

      return { assignmentId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-stats'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-history'] });
      // Also refresh vendor orders so they see the update
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      
      if (data.status === 'delivered') {
        // Clear pending deliveries
        queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
      }
    },
  });
}

// Toggle availability
export function useToggleAvailability() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_available: isAvailable })
        .eq('id', user?.id);

      if (error) throw error;
      return isAvailable;
    },
    onSuccess: async (isAvailable) => {
      // Invalidate and refetch profile immediately
      await queryClient.invalidateQueries({ queryKey: ['delivery-profile'] });
      
      // If going online, also fetch pending deliveries
      if (isAvailable) {
        queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
      }
    },
  });
}
