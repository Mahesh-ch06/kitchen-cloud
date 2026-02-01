import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Check, Percent, Clock, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/lib/currency';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Offer {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_until: string;
}

interface ViewOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  cartTotal: number;
  onApplyOffer: (code: string, discount: number) => void;
  appliedCode?: string | null;
}

export function ViewOffersModal({
  isOpen,
  onClose,
  storeId,
  cartTotal,
  onApplyOffer,
  appliedCode,
}: ViewOffersModalProps) {
  const [manualCode, setManualCode] = useState('');

  // Fetch available offers for the store
  const { data: offers, isLoading } = useQuery({
    queryKey: ['store-offers', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('valid_until', new Date().toISOString())
        .order('discount_value', { ascending: false });

      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!storeId && isOpen,
  });

  const calculateDiscount = (offer: Offer): number => {
    if (cartTotal < offer.min_order_amount) return 0;

    let discount = 0;
    if (offer.discount_type === 'percentage') {
      discount = (cartTotal * offer.discount_value) / 100;
      if (offer.max_discount && discount > offer.max_discount) {
        discount = offer.max_discount;
      }
    } else {
      discount = offer.discount_value;
    }

    return Math.min(discount, cartTotal); // Can't discount more than cart total
  };

  const handleApplyOffer = (offer: Offer) => {
    if (cartTotal < offer.min_order_amount) {
      toast.error(`Minimum order amount is ${formatPrice(offer.min_order_amount)}`);
      return;
    }

    if (offer.usage_limit && offer.usage_count >= offer.usage_limit) {
      toast.error('This offer has reached its usage limit');
      return;
    }

    const discount = calculateDiscount(offer);
    onApplyOffer(offer.code, discount);
    onClose();
  };

  const handleManualApply = () => {
    const code = manualCode.toUpperCase().trim();
    if (!code) return;

    const offer = offers?.find((o) => o.code === code);
    if (offer) {
      handleApplyOffer(offer);
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const isOfferUsable = (offer: Offer): boolean => {
    if (cartTotal < offer.min_order_amount) return false;
    if (offer.usage_limit && offer.usage_count >= offer.usage_limit) return false;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            Available Offers
          </DialogTitle>
          <DialogDescription>
            Apply a coupon code to get discounts on your order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Manual Code Entry */}
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50">
            <Label className="text-sm font-semibold mb-2 block">Have a coupon code?</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleManualApply()}
                className="flex-1 bg-white font-mono"
              />
              <Button
                onClick={handleManualApply}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Offers List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24 bg-secondary/20" />
                </Card>
              ))}
            </div>
          ) : offers && offers.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {offers.map((offer) => {
                  const discount = calculateDiscount(offer);
                  const usable = isOfferUsable(offer);
                  const isApplied = appliedCode === offer.code;

                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      layout
                    >
                      <Card
                        className={`border-2 transition-all ${
                          isApplied
                            ? 'border-emerald-500 bg-emerald-50'
                            : usable
                            ? 'border-amber-200 hover:border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
                            : 'border-border bg-muted/30 opacity-60'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-base font-bold text-amber-700 bg-white px-3 py-1 rounded-lg border border-amber-200">
                                  {offer.code}
                                </code>
                                {isApplied && (
                                  <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                    <Check className="w-3 h-3 mr-1" />
                                    Applied
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-foreground mb-2">{offer.description}</p>

                              {/* Offer Details */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1">
                                  {offer.discount_type === 'percentage' ? (
                                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                  <span className="font-semibold text-emerald-700">
                                    {offer.discount_type === 'percentage'
                                      ? `${offer.discount_value}% OFF`
                                      : `${formatPrice(offer.discount_value)} OFF`}
                                  </span>
                                </div>

                                {offer.min_order_amount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Min: {formatPrice(offer.min_order_amount)}</span>
                                  </>
                                )}

                                {offer.max_discount && offer.discount_type === 'percentage' && (
                                  <>
                                    <span>•</span>
                                    <span>Max: {formatPrice(offer.max_discount)}</span>
                                  </>
                                )}

                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Until {format(new Date(offer.valid_until), 'MMM dd')}</span>
                                </div>
                              </div>

                              {/* Savings */}
                              {usable && discount > 0 && (
                                <div className="mt-2 text-sm font-semibold text-emerald-700">
                                  You save {formatPrice(discount)}
                                </div>
                              )}

                              {/* Not Usable Message */}
                              {!usable && cartTotal < offer.min_order_amount && (
                                <div className="mt-2 text-sm text-amber-700">
                                  Add {formatPrice(offer.min_order_amount - cartTotal)} more to use this offer
                                </div>
                              )}
                            </div>

                            {/* Apply Button */}
                            <div>
                              {isApplied ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onApplyOffer('', 0)}
                                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleApplyOffer(offer)}
                                  disabled={!usable}
                                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No offers available</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Check back later for exciting deals and discounts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
