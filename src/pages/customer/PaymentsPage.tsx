import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Plus, Wallet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  name: string;
  details: string;
  isDefault: boolean;
}

const mockPayments: PaymentMethod[] = [
  { id: '1', type: 'card', name: 'Visa', details: '•••• •••• •••• 4242', isDefault: true },
  { id: '2', type: 'card', name: 'Mastercard', details: '•••• •••• •••• 8888', isDefault: false },
  { id: '3', type: 'wallet', name: 'Apple Pay', details: 'Connected', isDefault: false },
];

export function PaymentsPage() {
  const [payments] = useState<PaymentMethod[]>(mockPayments);

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
          <h1 className="text-lg font-semibold">Payment Methods</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add New Payment */}
        <FadeIn>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors mb-6"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Payment Method</span>
          </motion.button>
        </FadeIn>

        {/* Payment Methods List */}
        <FadeInStagger className="space-y-3" staggerDelay={0.05}>
          {payments.map((payment) => {
            const Icon = payment.type === 'card' ? CreditCard : Wallet;
            return (
              <FadeInStaggerItem key={payment.id}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl bg-card border-2 transition-colors ${
                    payment.isDefault ? 'border-primary/30' : 'border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      payment.isDefault ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${payment.isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold">{payment.name}</h3>
                        {payment.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.details}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
