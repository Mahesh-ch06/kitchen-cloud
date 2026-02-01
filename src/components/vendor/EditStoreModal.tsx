import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Store, MapPin, Phone, Clock, Image as ImageIcon, Loader2, Check, AlertCircle, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { geocodePincode } from '@/lib/distance';

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Tables<'stores'>;
}

export function EditStoreModal({ isOpen, onClose, store }: EditStoreModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocodingPincode, setIsGeocodingPincode] = useState(false);
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Extract pincode from existing address
  const extractPincodeFromAddress = (addr: string): string => {
    const match = addr.match(/\b(\d{6})\b/);
    return match ? match[1] : '';
  };

  // Populate form with existing store data
  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setDescription(store.description || '');
      setAddress(store.address || '');
      setPhone(store.phone || '');
      setOpeningTime(store.opening_time || '09:00');
      setClosingTime(store.closing_time || '22:00');
      setLogoUrl(store.logo_url || '');
      setBannerUrl(store.banner_url || '');
      setLatitude(store.latitude || null);
      setLongitude(store.longitude || null);
      
      // Try to extract pincode from address
      const extractedPincode = extractPincodeFromAddress(store.address || '');
      if (extractedPincode) {
        setPincode(extractedPincode);
        setPincodeValid(true); // Assume valid since it was saved
      }
    }
  }, [store]);

  // Geocode pincode when it changes
  useEffect(() => {
    const trimmedPincode = pincode.trim();
    
    // Only process 6-digit pincodes
    if (trimmedPincode.length !== 6 || !/^\d{6}$/.test(trimmedPincode)) {
      if (trimmedPincode.length > 0 && trimmedPincode.length < 6) {
        setPincodeValid(null);
      }
      return;
    }

    const geocode = async () => {
      setIsGeocodingPincode(true);
      setPincodeValid(null);
      
      try {
        const result = await geocodePincode(trimmedPincode);
        if (result) {
          setLatitude(result.latitude);
          setLongitude(result.longitude);
          setCity(result.city || '');
          setState(result.state || '');
          setPincodeValid(true);
        } else {
          setPincodeValid(false);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setPincodeValid(false);
      } finally {
        setIsGeocodingPincode(false);
      }
    };

    const debounce = setTimeout(geocode, 800);
    return () => clearTimeout(debounce);
  }, [pincode]);

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
        toast.success('Location detected!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not detect location. Please enter pincode manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Store name is required');
      return;
    }

    if (!address.trim()) {
      toast.error('Address is required');
      return;
    }

    if (!pincode.trim() || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    if (pincodeValid === false) {
      toast.error('Please enter a valid pincode for accurate distance calculation');
      return;
    }

    // Build full address with pincode, city, state
    const fullAddress = [
      address.trim(),
      city.trim(),
      state.trim(),
      pincode.trim()
    ].filter(Boolean).join(', ');

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          address: fullAddress,
          phone: phone.trim() || null,
          opening_time: openingTime,
          closing_time: closingTime,
          logo_url: logoUrl.trim() || null,
          banner_url: bannerUrl.trim() || null,
          latitude: latitude,
          longitude: longitude,
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('Store updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-stores', user?.id] });
      onClose();
    } catch (error: any) {
      console.error('Error updating store:', error);
      toast.error(error.message || 'Failed to update store');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Store className="w-5 h-5" />
            Edit Store
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Store Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Burger Palace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of your store..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background resize-none"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Street Address *
            </Label>
            <Input
              id="address"
              placeholder="Building name, Street, Area"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          {/* Pincode, City, State */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-semibold">
                Pincode *
              </Label>
              <div className="relative">
                <Input
                  id="pincode"
                  placeholder="6-digit"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className={`pr-8 bg-background ${pincodeValid === true ? 'border-green-500' : pincodeValid === false ? 'border-red-500' : ''}`}
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
              <Label htmlFor="city" className="text-sm font-semibold">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-semibold">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
          
          {pincodeValid === true && latitude && longitude && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Location: {city}, {state} ({latitude.toFixed(4)}, {longitude.toFixed(4)})
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
            <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opening" className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Opening Time
              </Label>
              <Input
                id="opening"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing" className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Closing Time
              </Label>
              <Input
                id="closing"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Logo URL
              </Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://example.com/logo.jpg"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner" className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Banner URL
              </Label>
              <Input
                id="banner"
                type="url"
                placeholder="https://example.com/banner.jpg"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
