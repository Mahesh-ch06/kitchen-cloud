import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface RequestMoreStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
}

export function RequestMoreStoresModal({ isOpen, onClose, currentLimit }: RequestMoreStoresModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [requestedLimit, setRequestedLimit] = useState(currentLimit + 1);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    if (requestedLimit <= currentLimit) {
      toast.error('Requested limit must be greater than current limit');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for your request');
      return;
    }

    setIsLoading(true);

    try {
      // Check for existing pending request
      // @ts-ignore - Type will be available after migration
      const { data: existingRequest } = await supabase
        .from('store_limit_requests')
        .select('id')
        .eq('vendor_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast.error('You already have a pending request');
        setIsLoading(false);
        return;
      }

      // Create the request
      // @ts-ignore - Type will be available after migration
      const { error } = await supabase
        .from('store_limit_requests')
        .insert({
          vendor_id: user.id,
          current_limit: currentLimit,
          requested_limit: requestedLimit,
          reason: reason.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Request submitted successfully!');
      toast.info('Admin will review your request soon');
      
      // Reset form and close
      setRequestedLimit(currentLimit + 1);
      setReason('');
      onClose();
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 bg-background rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Request More Stores</h2>
                  <p className="text-sm text-muted-foreground">Submit request to admin</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Current Limit Info */}
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Current store limit</p>
                <p className="text-2xl font-bold">{currentLimit} stores</p>
              </div>

              {/* Requested Limit */}
              <div className="space-y-2">
                <Label htmlFor="requested_limit">Requested Limit *</Label>
                <Input
                  id="requested_limit"
                  type="number"
                  min={currentLimit + 1}
                  max={100}
                  value={requestedLimit}
                  onChange={(e) => setRequestedLimit(parseInt(e.target.value) || currentLimit + 1)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You're requesting {requestedLimit - currentLimit} additional store{requestedLimit - currentLimit > 1 ? 's' : ''}
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Business Justification *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need more stores (e.g., expanding to new locations, high demand, multiple cuisines)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide details about your business growth plans
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
