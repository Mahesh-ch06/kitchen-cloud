import { motion } from 'framer-motion';
import { 
  Store, Users, TrendingUp, DollarSign, 
  ShoppingBag, Truck, Activity, AlertCircle
} from 'lucide-react';
import { FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformStats } from '@/hooks/useAdminData';

interface StatsOverviewProps {
  stats: PlatformStats | undefined;
  isLoading: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      icon: Store,
      label: 'Total Vendors',
      value: stats?.totalVendors || 0,
      subtext: `${stats?.verifiedVendors || 0} verified`,
      color: 'amber',
      trend: stats?.verifiedVendors ? `${Math.round((stats.verifiedVendors / stats.totalVendors) * 100)}% verified` : undefined,
    },
    {
      icon: Truck,
      label: 'Delivery Partners',
      value: stats?.totalDeliveryPartners || 0,
      subtext: `${stats?.activeDeliveryPartners || 0} active`,
      color: 'emerald',
      trend: stats?.activeDeliveryPartners ? `${stats.activeDeliveryPartners} online` : undefined,
    },
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      subtext: `${stats?.pendingOrders || 0} pending`,
      color: 'amber',
      trend: stats?.pendingOrders ? `${stats.pendingOrders} in progress` : undefined,
    },
    {
      icon: DollarSign,
      label: 'Platform Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtext: 'From completed orders',
      color: 'amber',
      isRevenue: true,
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    amber: { bg: 'bg-amber-50', icon: 'text-amber-700', border: 'hover:border-amber-300' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-700', border: 'hover:border-emerald-300' },
  };

  return (
    <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" staggerDelay={0.05}>
      {statsCards.map((card, index) => {
        const colors = colorClasses[card.color];
        
        return (
          <FadeInStaggerItem key={index}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className={`p-6 rounded-2xl bg-white border border-amber-100 ${colors.border} hover:shadow-[0_18px_42px_-28px_rgba(249,115,22,0.45)] transition-all ${
                card.isRevenue ? 'bg-gradient-to-br from-amber-50 via-orange-50/80 to-white border-amber-200' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.isRevenue ? 'bg-amber-500 shadow-[0_14px_36px_-18px_rgba(249,115,22,0.7)]' : colors.bg} flex items-center justify-center border ${card.isRevenue ? 'border-amber-400' : 'border-amber-100'}`}>
                  <card.icon className={`w-6 h-6 ${card.isRevenue ? 'text-white' : colors.icon}`} />
                </div>
                {card.trend && (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {card.trend}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-amber-900">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{card.subtext}</p>
            </motion.div>
          </FadeInStaggerItem>
        );
      })}
    </FadeInStagger>
  );
}
