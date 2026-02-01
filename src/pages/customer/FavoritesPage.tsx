import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, MapPin, Clock, ChefHat } from 'lucide-react';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem, HoverScale } from '@/components/ui/animated-container';
import { mockVendors } from '@/data/mockData';

export function FavoritesPage() {
  const [favorites] = useState(mockVendors.slice(0, 2));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 px-4 h-14">
          <Link to="/profile">
            <motion.div whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-6 h-6" />
            </motion.div>
          </Link>
          <h1 className="text-lg font-semibold">Favorites</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {favorites.length === 0 ? (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Start exploring and save your favorite restaurants here
              </p>
              <Link to="/menu" className="mt-6">
                <HoverScale>
                  <motion.button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
                    Explore Restaurants
                  </motion.button>
                </HoverScale>
              </Link>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="space-y-3" staggerDelay={0.05}>
            {favorites.map((vendor) => (
              <FadeInStaggerItem key={vendor.id}>
                <Link to="/menu">
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-xl bg-card border-2 border-border/50 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <ChefHat className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{vendor.name}</h3>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            className="text-red-500"
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-accent fill-accent" />
                            <span className="font-semibold text-accent">{vendor.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>20-35 min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        )}
      </div>

      <CustomerBottomNav />
    </div>
  );
}
