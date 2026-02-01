import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, Loader2, IndianRupee, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';

interface CreateMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Tables<'stores'>[] | undefined;
}

export function CreateMenuItemModal({ isOpen, onClose, stores }: CreateMenuItemModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Tables<'menu_categories'>[]>([]);
  
  const [formData, setFormData] = useState({
    store_id: '',
    name: '',
    description: '',
    price: '',
    preparation_time: '15',
    is_veg: false,
    is_available: true,
    category_id: '',
    image_url: '',
  });

  // Fetch categories when store changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (!formData.store_id) {
        setCategories([]);
        return;
      }

      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('store_id', formData.store_id)
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, [formData.store_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.store_id) {
      toast.error('Please select a store');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          store_id: formData.store_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          preparation_time: parseInt(formData.preparation_time) || 15,
          is_veg: formData.is_veg,
          is_available: formData.is_available,
          category_id: formData.category_id || null,
          image_url: formData.image_url.trim() || null,
        });

      if (error) throw error;

      toast.success('Menu item created successfully!');
      
      // Invalidate queries for both vendor and customer views
      queryClient.invalidateQueries({ queryKey: ['vendor-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] }); // Customer menu items
      queryClient.invalidateQueries({ queryKey: ['popular-menu-items'] }); // Customer popular items
      
      // Reset and close
      setFormData({
        store_id: '',
        name: '',
        description: '',
        price: '',
        preparation_time: '15',
        is_veg: false,
        is_available: true,
        category_id: '',
        image_url: '',
      });
      onClose();
    } catch (error: any) {
      console.error('Error creating menu item:', error);
      toast.error(error.message || 'Failed to create menu item');
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
            className="fixed inset-x-4 top-0 bottom-0 md:inset-auto md:left-[25%] md:top-[5%] md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[90vh] z-50 bg-background rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Add Menu Item</h2>
                  <p className="text-sm text-muted-foreground">Create a new dish</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Store Selection */}
              <div className="space-y-2">
                <Label>Select Store *</Label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value, category_id: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!stores || stores.length === 0) && (
                  <p className="text-sm text-destructive">You need to create a store first</p>
                )}
              </div>

              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Butter Chicken"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the dish..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>

              {/* Price and Prep Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="199"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparation_time">Prep Time (min)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="preparation_time"
                      name="preparation_time"
                      type="number"
                      min="1"
                      placeholder="15"
                      value={formData.preparation_time}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="https://example.com/dish.jpg"
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </div>

              {/* Veg Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-success/10">
                <div className="flex items-center gap-3">
                  <Leaf className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Vegetarian</p>
                    <p className="text-sm text-muted-foreground">Mark as veg item</p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_veg}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_veg: checked }))}
                  className="data-[state=checked]:bg-success"
                />
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium">Available</p>
                  <p className="text-sm text-muted-foreground">Item can be ordered</p>
                </div>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={isLoading || !stores?.length}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
