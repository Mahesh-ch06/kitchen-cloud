import { motion } from 'framer-motion';
import { 
  ShoppingBag, Clock, CheckCircle, XCircle, 
  Truck, ChefHat, AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn } from '@/components/ui/animated-container';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

interface RecentOrdersTabProps {
  orders: (Tables<'orders'> & { store?: { name: string } | null })[] | undefined;
  isLoading: boolean;
}

const statusConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  label: string 
}> = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-800', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Confirmed' },
  preparing: { icon: ChefHat, color: 'bg-orange-100 text-orange-700', label: 'Preparing' },
  ready: { icon: AlertCircle, color: 'bg-emerald-50 text-emerald-700', label: 'Ready' },
  dispatched: { icon: Truck, color: 'bg-amber-100 text-amber-800', label: 'Dispatched' },
  delivered: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
};

export function RecentOrdersTab({ orders, isLoading }: RecentOrdersTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
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
          <p className="text-muted-foreground">Orders will appear here once customers start ordering</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <div className="rounded-2xl bg-white border border-amber-100 overflow-hidden shadow-[0_18px_42px_-28px_rgba(249,115,22,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/60">
                <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Store</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-amber-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.tr
                    key={order.id}
                    whileHover={{ backgroundColor: 'rgba(255, 237, 213, 0.6)' }}
                    className="border-b border-amber-100 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                          <ShoppingBag className="w-5 h-5 text-amber-700" />
                        </div>
                        <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium">{order.store?.name || 'Unknown Store'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-amber-800">${Number(order.total_amount).toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </FadeIn>
  );
}
