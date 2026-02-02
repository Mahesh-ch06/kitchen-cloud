import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UtensilsCrossed, Zap, Store, RotateCcw, Sparkles } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Food', href: '/menu', icon: UtensilsCrossed, highlight: true },
  { label: 'Bolt', href: '/menu?fast=true', icon: Zap, badge: '15 MIN' },
  { label: '99 store', href: '/menu?deal=99', icon: Store },
  { label: 'Reorder', href: '/reorder', icon: RotateCcw },
  { label: 'Deal Rush', href: '/menu?deals=true', icon: Sparkles, badge: 'LIVE', badgeColor: 'bg-red-500' },
];

export function CustomerBottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around max-w-md mx-auto py-2 pb-safe">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/menu' && location.pathname === '/menu' && item.highlight) ||
              (item.href === '/reorder' && location.pathname === '/reorder');
            const Icon = item.icon;
            const showCartBadge = item.label === 'Reorder' && itemCount > 0;

            return (
              <Link
                key={item.href + item.label}
                to={item.href}
                className="relative flex flex-col items-center min-w-[50px] px-1"
              >
                <div className="relative flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative flex items-center justify-center h-6 w-6"
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive || item.highlight ? "text-primary" : "text-muted-foreground"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Cart count badge */}
                    {showCartBadge && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
                      >
                        {itemCount > 9 ? '9+' : itemCount}
                      </motion.span>
                    )}
                  </motion.div>
                  
                  {/* Badge positioned above label */}
                  {item.badge && (
                    <span className={cn(
                      "px-1.5 py-0.5 text-[7px] font-bold text-white rounded mt-0.5",
                      item.badgeColor || "bg-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Label - only show if no badge */}
                  {!item.badge && (
                    <span
                      className={cn(
                        "text-[10px] mt-1 transition-colors text-center leading-tight",
                        isActive || item.highlight ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                  
                  {/* Label for items with badge */}
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] transition-colors text-center leading-tight",
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
