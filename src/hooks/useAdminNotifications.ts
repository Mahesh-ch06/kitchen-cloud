import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only subscribe if user is an admin
    if (user?.role !== 'admin') return;

    // Subscribe to new vendors
    const vendorsChannel = supabase
      .channel('admin-vendors-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendors',
        },
        async (payload) => {
          // Fetch profile info for the new vendor
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', payload.new.id)
            .single();

          const vendorName = payload.new.business_name || 'Unknown Business';
          const ownerName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email 
            : 'Unknown';

          toast.info('New Vendor Registration', {
            description: `${vendorName} (${ownerName}) has registered and is pending verification.`,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to vendors tab - this will be handled by the component
                window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'vendors' }));
              },
            },
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }
      )
      .subscribe();

    // Subscribe to new delivery partners
    const deliveryPartnersChannel = supabase
      .channel('admin-delivery-partners-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_partners',
        },
        async (payload) => {
          // Fetch profile info for the new delivery partner
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', payload.new.id)
            .single();

          const partnerName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email 
            : 'Unknown';

          toast.info('New Delivery Partner Registration', {
            description: `${partnerName} has registered and is pending verification.`,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'delivery' }));
              },
            },
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin', 'deliveryPartners'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(vendorsChannel);
      supabase.removeChannel(deliveryPartnersChannel);
    };
  }, [user?.role, queryClient]);
}
