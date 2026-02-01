import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Plus, Home, Briefcase, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  address: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  { id: '1', type: 'home', label: 'Home', address: '123 Main Street, Apt 4B, New York, NY 10001', isDefault: true },
  { id: '2', type: 'work', label: 'Work', address: '456 Business Ave, Floor 12, New York, NY 10002', isDefault: false },
];

const iconMap = {
  home: Home,
  work: Briefcase,
  other: MapPin,
};

export function AddressesPage() {
  const [addresses] = useState<Address[]>(mockAddresses);

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
          <h1 className="text-lg font-semibold">Saved Addresses</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add New Address */}
        <FadeIn>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors mb-6"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Address</span>
          </motion.button>
        </FadeIn>

        {/* Address List */}
        <FadeInStagger className="space-y-3" staggerDelay={0.05}>
          {addresses.map((addr) => {
            const Icon = iconMap[addr.type];
            return (
              <FadeInStaggerItem key={addr.id}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl bg-card border-2 transition-colors ${
                    addr.isDefault ? 'border-primary/30' : 'border-border/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      addr.isDefault ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${addr.isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{addr.label}</h3>
                        {addr.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{addr.address}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>
      </div>

      <CustomerBottomNav />
    </div>
  );
}
