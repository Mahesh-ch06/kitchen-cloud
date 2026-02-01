import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, MapPin, Phone, Clock, Loader2, Navigation, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { geocodePincode } from '@/lib/distance';

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoreCount: number;
}

export function CreateStoreModal({ isOpen, onClose, currentStoreCount }: CreateStoreModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingPincode, setIsGeocodingPincode] = useState(false);
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
  const [maxStores, setMaxStores] = useState(2);
  const [canCreateStore, setCanCreateStore] = useState(true);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    phone: '',
    opening_time: '09:00',
    closing_time: '22:00',
    is_active: true,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Fetch vendor's max_stores limit and check for existing requests
  useEffect(() => {
    const fetchVendorLimits = async () => {
      if (!user?.id || !isOpen) return;

      try {
        // Get vendor's max_stores
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('max_stores')
          .eq('id', user.id)
          .single();

        if (vendorError) throw vendorError;

        const limit = vendorData?.max_stores || 2;
        setMaxStores(limit);
        setCanCreateStore(currentStoreCount < limit);

        // Check for pending requests
        const { data: requestData } = await supabase
          .from('store_limit_requests')
          .select('id')
          .eq('vendor_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        setHasExistingRequest(!!requestData);
      } catch (error) {
        console.error('Error fetching vendor limits:', error);
      }
    };

    fetchVendorLimits();
  }, [user?.id, isOpen, currentStoreCount]);

  // Geocode pincode to get coordinates
  useEffect(() => {
    const pincode = formData.pincode.trim();
    
    // Only geocode if pincode is exactly 6 digits
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeValid(null);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsGeocodingPincode(true);
      setPincodeValid(null);

      try {
        const result = await geocodePincode(pincode);
        
        if (result) {
          setFormData(prev => ({
            ...prev,
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.city || prev.city,
            state: result.state || prev.state,
          }));
          setPincodeValid(true);
        } else {
          setPincodeValid(false);
        }
      } catch (error) {
        console.error('Error geocoding pincode:', error);
        setPincodeValid(false);
      } finally {
        setIsGeocodingPincode(false);
      }
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [formData.pincode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          address: data.display_name || prev.address,
        }));
        
        toast.success('Location detected successfully');
      } catch {
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
        }));
        toast.success('Coordinates saved');
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      if (geoError.code === 1) {
        toast.error('Location permission denied');
      } else {
        toast.error('Unable to get location');
      }
    } finally {
      setIsLocating(false);
    }
  };

  const ensureVendorExists = async () => {
    if (!user?.id) return false;
    
    // Check if vendor record exists
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      // No vendor record, create one
      const { error: createError } = await supabase
        .from('vendors')
        .insert({
          id: user.id,
          business_name: user.name || 'My Kitchen',
          is_verified: false,
        });
      
      if (createError) {
        console.error('Error creating vendor:', createError);
        throw new Error('Failed to create vendor profile');
      }
    } else if (checkError) {
      throw checkError;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    if (!canCreateStore) {
      toast.error('You have reached your store limit');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Address is required');
      return;
    }

    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      toast.error('Valid 6-digit pincode is required');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Could not determine store location from pincode. Please check the pincode.');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure vendor record exists
      await ensureVendorExists();
      
      // Build full address with city/state/pincode
      const fullAddress = [
        formData.address.trim(),
        formData.city,
        formData.state,
        formData.pincode
      ].filter(Boolean).join(', ');
      
      // Create the store
      const { error } = await supabase
        .from('stores')
        .insert({
          vendor_id: user.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          address: fullAddress,
          phone: formData.phone.trim() || null,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          is_active: formData.is_active,
          latitude: formData.latitude,
          longitude: formData.longitude,
        });

      if (error) throw error;

      toast.success('Store created successfully!');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['vendor-stores'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      
      // Reset form and close
      setFormData({
        name: '',
        description: '',
        address: '',
        pincode: '',
        city: '',
        state: '',
        phone: '',
        opening_time: '09:00',
        closing_time: '22:00',
        is_active: true,
        latitude: null,
        longitude: null,
      });
      setPincodeValid(null);
      onClose();
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast.error(error.message || 'Failed to create store');
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
            <div className="relative flex items-center justify-center p-4 border-b border-border">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold">Create New Store</h2>
                  <p className="text-sm text-muted-foreground">Add a new kitchen location</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Spice Kitchen"
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
                  placeholder="Describe your kitchen and specialties..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    name="address"
                    placeholder="Building name, Street, Area"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Pincode, City, State */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <div className="relative">
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="6-digit"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      maxLength={6}
                      className={`pr-8 ${pincodeValid === true ? 'border-green-500' : pincodeValid === false ? 'border-red-500' : ''}`}
                      required
                    />
                    {isGeocodingPincode && (
                      <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {!isGeocodingPincode && pincodeValid === true && (
                      <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                    )}
                    {!isGeocodingPincode && pincodeValid === false && (
                      <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              {pincodeValid === true && formData.latitude && formData.longitude && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Location detected: {formData.city}, {formData.state} ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                </p>
              )}
              {pincodeValid === false && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Could not find location for this pincode. Please verify.
                </p>
              )}

              {/* Alternative: Use Current Location */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="w-full gap-2"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {isLocating ? 'Detecting...' : 'Use Current GPS Location'}
              </Button>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening_time">Opening Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="opening_time"
                      name="opening_time"
                      type="time"
                      value={formData.opening_time}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing_time">Closing Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="closing_time"
                      name="closing_time"
                      type="time"
                      value={formData.closing_time}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium">Store Active</p>
                  <p className="text-sm text-muted-foreground">Make your store visible to customers</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                className="flex-1" 
                disabled={isLoading || !canCreateStore}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Store'
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
