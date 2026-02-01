import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Edit2, Trash2, Clock, TrendingUp, Percent, DollarSign, Calendar, Check, X, Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { format } from 'date-fns';

interface Offer {
  id: string;
  store_id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

interface StoreData {
  id: string;
  name: string;
  address?: string;
}

interface OffersTabProps {
  stores?: StoreData[] | null;
  isLoading?: boolean;
}

export function OffersTab({ stores, isLoading: storesLoading }: OffersTabProps) {
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Auto-select first store if only one exists
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    valid_until: '',
    is_active: true,
  });

  // Fetch offers
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['vendor-offers', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('store_id', selectedStoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!selectedStoreId,
  });

  // Create offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedStoreId) throw new Error('No store selected');
      
      const { error } = await supabase.from('offers').insert({
        store_id: selectedStoreId,
        code: data.code.toUpperCase(),
        description: data.description,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        min_order_amount: data.min_order_amount ? parseFloat(data.min_order_amount) : 0,
        max_discount: data.max_discount ? parseFloat(data.max_discount) : null,
        usage_limit: data.usage_limit ? parseInt(data.usage_limit) : null,
        valid_until: data.valid_until,
        is_active: data.is_active,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers', selectedStoreId] });
      toast.success('Offer created successfully!');
      resetForm();
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create offer');
    },
  });

  // Update offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const updateData: any = {};
      if (data.description) updateData.description = data.description;
      if (data.discount_value) updateData.discount_value = parseFloat(data.discount_value);
      if (data.min_order_amount) updateData.min_order_amount = parseFloat(data.min_order_amount);
      if (data.max_discount) updateData.max_discount = parseFloat(data.max_discount);
      if (data.usage_limit) updateData.usage_limit = parseInt(data.usage_limit);
      if (data.valid_until) updateData.valid_until = data.valid_until;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { error } = await supabase
        .from('offers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers', selectedStoreId] });
      toast.success('Offer updated successfully!');
      setEditingOffer(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update offer');
    },
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers', selectedStoreId] });
      toast.success('Offer deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete offer');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount: '',
      usage_limit: '',
      valid_until: '',
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      toast.error('Please select a store first');
      return;
    }
    if (editingOffer) {
      updateOfferMutation.mutate({ id: editingOffer.id, data: formData });
    } else {
      createOfferMutation.mutate(formData);
    }
  };

  const toggleOfferStatus = (offer: Offer) => {
    updateOfferMutation.mutate({
      id: offer.id,
      data: { is_active: !offer.is_active },
    });
  };

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date();

  const isLoading = storesLoading || offersLoading;

  // Show loading state
  if (storesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Show message if no stores
  if (!stores || stores.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Store className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Stores Found</h3>
          <p className="text-muted-foreground mb-4">Create a store first to add offers</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Selector (if multiple stores) */}
      {stores.length > 1 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
          <Store className="w-5 h-5 text-muted-foreground" />
          <Select value={selectedStoreId || ''} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offers & Coupons</h2>
          <p className="text-muted-foreground">Create and manage promotional offers for your customers</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Offers List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40 bg-secondary/20" />
            </Card>
          ))}
        </div>
      ) : offers && offers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {offers.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card className={`border-2 ${offer.is_active && !isExpired(offer.valid_until) ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-border bg-muted/30'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-5 h-5 text-amber-600" />
                          <code className="text-lg font-bold text-amber-700 bg-white px-3 py-1 rounded-lg border-2 border-amber-200">
                            {offer.code}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={offer.is_active}
                          onCheckedChange={() => toggleOfferStatus(offer)}
                          disabled={isExpired(offer.valid_until)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Discount Info */}
                    <div className="flex items-center gap-2 text-sm">
                      {offer.discount_type === 'percentage' ? (
                        <Percent className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="font-semibold text-emerald-700">
                        {offer.discount_type === 'percentage'
                          ? `${offer.discount_value}% OFF`
                          : `${formatPrice(offer.discount_value)} OFF`}
                      </span>
                      {offer.max_discount && offer.discount_type === 'percentage' && (
                        <span className="text-xs text-muted-foreground">
                          (Max: {formatPrice(offer.max_discount)})
                        </span>
                      )}
                    </div>

                    {/* Min Order */}
                    {offer.min_order_amount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Min. order: {formatPrice(offer.min_order_amount)}
                      </div>
                    )}

                    {/* Usage Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                          {offer.usage_count} {offer.usage_limit ? `/ ${offer.usage_limit}` : ''} used
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Until {format(new Date(offer.valid_until), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                      {isExpired(offer.valid_until) ? (
                        <Badge variant="destructive" className="text-xs">
                          <X className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      ) : offer.is_active ? (
                        <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      {offer.usage_limit && offer.usage_count >= offer.usage_limit && (
                        <Badge variant="outline" className="text-xs">
                          Limit Reached
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingOffer(offer);
                          setFormData({
                            code: offer.code,
                            description: offer.description,
                            discount_type: offer.discount_type,
                            discount_value: offer.discount_value.toString(),
                            min_order_amount: offer.min_order_amount.toString(),
                            max_discount: offer.max_discount?.toString() || '',
                            usage_limit: offer.usage_limit?.toString() || '',
                            valid_until: format(new Date(offer.valid_until), "yyyy-MM-dd'T'HH:mm"),
                            is_active: offer.is_active,
                          });
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this offer?')) {
                            deleteOfferMutation.mutate(offer.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Tag className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No offers yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first promotional offer to attract more customers
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Offer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Offer Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          resetForm();
          setEditingOffer(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? 'Edit Offer' : 'Create New Offer'}
            </DialogTitle>
            <DialogDescription>
              {editingOffer 
                ? 'Update your promotional offer details below'
                : 'Create a promotional offer to attract more customers to your store'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code */}
            <div>
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SAVE50"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                disabled={!!editingOffer}
                maxLength={20}
                className="font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="e.g., Get 50% off on orders above ₹299"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={2}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount_value">
                  Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  placeholder={formData.discount_type === 'percentage' ? '50' : '100'}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  required
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                />
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_order_amount">Min. Order Amount (₹)</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  min="0"
                />
              </div>
              {formData.discount_type === 'percentage' && (
                <div>
                  <Label htmlFor="max_discount">Max Discount (₹)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* Usage Limit */}
            <div>
              <Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
              <Input
                id="usage_limit"
                type="number"
                placeholder="Leave empty for unlimited"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                min="1"
              />
            </div>

            {/* Valid Until */}
            <div>
              <Label htmlFor="valid_until">Valid Until *</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="is_active" className="text-base font-semibold">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this offer for customers to use
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                  setEditingOffer(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
              >
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
