import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Gift, ShoppingBag, Info, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

interface Notification {
  id: string;
  type: 'order' | 'promo' | 'info';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'order', title: 'Order Delivered!', message: 'Your order from Spice Kitchen has been delivered. Enjoy your meal!', time: '2 hours ago', isRead: false },
  { id: '2', type: 'promo', title: '50% Off Today!', message: 'Use code SAVE50 to get 50% off on your next order. Limited time offer!', time: '5 hours ago', isRead: false },
  { id: '3', type: 'info', title: 'New Restaurant Added', message: 'Fresh Bowls is now available in your area. Try their healthy options!', time: '1 day ago', isRead: true },
  { id: '4', type: 'order', title: 'Order Confirmed', message: 'Your order #1234 has been confirmed and is being prepared.', time: '2 days ago', isRead: true },
];

const iconMap = {
  order: ShoppingBag,
  promo: Gift,
  info: Info,
};

const colorMap = {
  order: 'bg-primary/10 text-primary',
  promo: 'bg-accent/10 text-accent',
  info: 'bg-muted text-muted-foreground',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <motion.div whileTap={{ scale: 0.9 }}>
                <ArrowLeft className="w-6 h-6" />
              </motion.div>
            </Link>
            <h1 className="text-lg font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-primary">
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {notifications.length === 0 ? (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No notifications</h2>
              <p className="text-muted-foreground text-sm">
                You're all caught up!
              </p>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="space-y-3" staggerDelay={0.03}>
            {notifications.map((notif) => {
              const Icon = iconMap[notif.type];
              const colorClass = colorMap[notif.type];
              return (
                <FadeInStaggerItem key={notif.id}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl bg-card border-2 transition-colors ${
                      notif.isRead ? 'border-border/50 opacity-70' : 'border-primary/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold text-sm ${notif.isRead ? '' : 'text-foreground'}`}>
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-2">{notif.time}</p>
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
