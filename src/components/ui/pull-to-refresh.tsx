import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  
  // All hooks must be called before any conditional returns
  const opacity = useTransform(pullDistance, [0, PULL_THRESHOLD], [0, 1]);
  const scale = useTransform(pullDistance, [0, PULL_THRESHOLD], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, MAX_PULL], [0, 360]);
  const indicatorY = useTransform(pullDistance, [0, MAX_PULL], [-40, 40]);
  const contentY = useTransform(pullDistance, [0, MAX_PULL], [0, MAX_PULL * 0.5]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      pullDistance.set(0);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      const dampedPull = Math.min(diff * 0.5, MAX_PULL);
      pullDistance.set(dampedPull);
    }
  }, [isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return;
    
    const currentPull = pullDistance.get();
    
    if (currentPull >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      animate(pullDistance, PULL_THRESHOLD, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { duration: 0.3 });
      }
    } else {
      animate(pullDistance, 0, { duration: 0.2 });
    }
  }, [isRefreshing, pullDistance, onRefresh]);

  // Conditional return AFTER all hooks
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Pull indicator */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 z-40 flex items-center justify-center"
        style={{ 
          top: indicatorY,
          opacity 
        }}
      >
        <motion.div 
          className="w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center shadow-lg"
          style={{ scale }}
        >
          <motion.div style={{ rotate: isRefreshing ? undefined : rotate }}>
            <RefreshCw 
              className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content container */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{ y: contentY }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
