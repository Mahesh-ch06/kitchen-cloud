import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Home, Briefcase, Building, Plus, Check, Search, 
  Navigation, X, Trash2, Edit2, Star, Loader2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { calculateDistance, formatDistance } from '@/lib/distance';

interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address_type: 'home' | 'work' | 'other';
  flat_no: string;
  building_name: string | null;
  street: string | null;
  area: string;
  landmark: string | null;
  city: string;
  state: string | null;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

interface AddressSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: SavedAddress) => void;
  storeLatitude?: number | null;
  storeLongitude?: number | null;
  maxDeliveryDistance?: number; // in km, default 15
}

export function AddressSelector({
  isOpen,
  onClose,
  onSelectAddress,
  storeLatitude,
  storeLongitude,
  maxDeliveryDistance = 15,
}: AddressSelectorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'saved' | 'new'>('saved');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    area: string;
    city: string;
    pincode: string;
  } | null>(null);
  
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    address_type: 'home' as 'home' | 'work' | 'other',
    flat_no: '',
    building_name: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_default: false,
  });

  // Fetch saved addresses
  const { data: savedAddresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['saved-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedAddress[];
    },
    enabled: !!user?.id && isOpen,
  });

  // Save new address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (address: typeof newAddress) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          ...address,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast.success('Address saved successfully!');
      onSelectAddress(data as SavedAddress);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save address');
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addressId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast.success('Address deleted');
    },
    onError: () => {
      toast.error('Failed to delete address');
    },
  });

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          const address = data.address || {};
          setSelectedLocation({
            lat: latitude,
            lng: longitude,
            address: data.display_name || '',
            area: address.suburb || address.neighbourhood || address.road || '',
            city: address.city || address.town || address.village || '',
            pincode: address.postcode || '',
          });
          
          setNewAddress(prev => ({
            ...prev,
            area: address.suburb || address.neighbourhood || address.road || '',
            city: address.city || address.town || address.village || '',
            state: address.state || '',
            pincode: address.postcode || '',
            latitude,
            longitude,
          }));
          
          toast.success('Location detected!');
        } catch (error) {
          console.error('Geocoding error:', error);
          setNewAddress(prev => ({
            ...prev,
            latitude,
            longitude,
          }));
          toast.info('Location detected, please fill in address details');
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Search for address
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchAddress(searchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchAddress]);

  // Select search result
  const selectSearchResult = (result: any) => {
    const address = result.address || {};
    setSelectedLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      area: address.suburb || address.neighbourhood || address.road || '',
      city: address.city || address.town || address.village || '',
      pincode: address.postcode || '',
    });
    
    setNewAddress(prev => ({
      ...prev,
      area: address.suburb || address.neighbourhood || address.road || '',
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      pincode: address.postcode || '',
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    }));
    
    setSearchQuery('');
    setSearchResults([]);
  };

  // Check if address is deliverable
  const isDeliverable = (lat: number | null, lng: number | null): boolean => {
    if (!lat || !lng || !storeLatitude || !storeLongitude) return true;
    const distance = calculateDistance(storeLatitude, storeLongitude, lat, lng);
    return distance <= maxDeliveryDistance;
  };

  // Get distance from store
  const getDistanceFromStore = (lat: number | null, lng: number | null): number | null => {
    if (!lat || !lng || !storeLatitude || !storeLongitude) return null;
    return calculateDistance(storeLatitude, storeLongitude, lat, lng);
  };

  // Handle save new address
  const handleSaveAddress = () => {
    if (!newAddress.flat_no || !newAddress.area || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isDeliverable(newAddress.latitude, newAddress.longitude)) {
      toast.error(`Delivery not available beyond ${maxDeliveryDistance}km`);
      return;
    }

    saveAddressMutation.mutate(newAddress);
  };

  // Handle select saved address
  const handleSelectSavedAddress = (address: SavedAddress) => {
    if (!isDeliverable(address.latitude, address.longitude)) {
      toast.error(`This address is beyond ${maxDeliveryDistance}km delivery range`);
      return;
    }
    onSelectAddress(address);
    onClose();
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(savedAddresses && savedAddresses.length > 0 ? 'saved' : 'new');
      setNewAddress({
        label: 'Home',
        address_type: 'home',
        flat_no: '',
        building_name: '',
        street: '',
        area: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        latitude: null,
        longitude: null,
        is_default: false,
      });
      setSelectedLocation(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, savedAddresses]);

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'work': return Briefcase;
      default: return Building;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-amber-600" />
            Select Delivery Address
          </DialogTitle>
          <DialogDescription className="text-sm">
            Choose a saved address or add a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'saved' | 'new')}>
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="saved" className="flex items-center gap-1.5 text-sm">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Saved Addresses</span>
              <span className="sm:hidden">Saved</span>
              {savedAddresses && savedAddresses.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {savedAddresses.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" />
              Add New
            </TabsTrigger>
          </TabsList>

          {/* Saved Addresses Tab */}
          <TabsContent value="saved" className="space-y-4 mt-4">
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            ) : savedAddresses && savedAddresses.length > 0 ? (
              <div className="space-y-3">
                {savedAddresses.map((address) => {
                  const Icon = getAddressIcon(address.address_type);
                  const distance = getDistanceFromStore(address.latitude, address.longitude);
                  const deliverable = isDeliverable(address.latitude, address.longitude);
                  
                  return (
                    <motion.div
                      key={address.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative ${!deliverable ? 'opacity-60' : ''}`}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          !deliverable 
                            ? 'border-red-200 bg-red-50/50' 
                            : 'border-border hover:border-amber-300'
                        }`}
                        onClick={() => handleSelectSavedAddress(address)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              address.is_default 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-secondary text-muted-foreground'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{address.label}</span>
                                {address.is_default && (
                                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
                                    <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-500" />
                                    Default
                                  </Badge>
                                )}
                                {distance !== null && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] ${
                                      deliverable ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'
                                    }`}
                                  >
                                    {formatDistance(distance)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {address.flat_no}
                                {address.building_name && `, ${address.building_name}`}
                                {address.street && `, ${address.street}`}
                                , {address.area}, {address.city} - {address.pincode}
                              </p>
                              {!deliverable && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ Beyond {maxDeliveryDistance}km delivery range
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAddressMutation.mutate(address.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-4">No saved addresses yet</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('new')}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Add New Address Tab */}
          <TabsContent value="new" className="space-y-4 mt-4">
            {/* Location Detection */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={getCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Use Current Location
              </Button>
            </div>

            {/* Search Address */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search for area, street, pincode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                  >
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors border-b last:border-0"
                        onClick={() => selectSearchResult(result)}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <span className="text-sm line-clamp-2">{result.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Location Preview */}
            {selectedLocation && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Location Selected</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{selectedLocation.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Address Type */}
            <div className="space-y-2">
              <Label>Save As</Label>
              <RadioGroup
                value={newAddress.address_type}
                onValueChange={(value) => setNewAddress(prev => ({
                  ...prev,
                  address_type: value as 'home' | 'work' | 'other',
                  label: value.charAt(0).toUpperCase() + value.slice(1),
                }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home" className="flex items-center gap-1 cursor-pointer">
                    <Home className="w-4 h-4" /> Home
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="work" id="work" />
                  <Label htmlFor="work" className="flex items-center gap-1 cursor-pointer">
                    <Briefcase className="w-4 h-4" /> Work
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="flex items-center gap-1 cursor-pointer">
                    <Building className="w-4 h-4" /> Other
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Address Form */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flat_no">Flat/House No. *</Label>
                  <Input
                    id="flat_no"
                    placeholder="e.g., A-101"
                    value={newAddress.flat_no}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, flat_no: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building">Building/Society Name</Label>
                  <Input
                    id="building"
                    placeholder="e.g., Green Valley Apartments"
                    value={newAddress.building_name}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, building_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area/Locality *</Label>
                <Input
                  id="area"
                  placeholder="e.g., Koramangala 5th Block"
                  value={newAddress.area}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  id="landmark"
                  placeholder="e.g., Near Big Bazaar"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Bangalore"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="e.g., 560095"
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_default" className="text-sm cursor-pointer">
                  Set as default address
                </Label>
              </div>
            </div>

            {/* Delivery Check */}
            {newAddress.latitude && newAddress.longitude && (
              <div className={`p-3 rounded-lg ${
                isDeliverable(newAddress.latitude, newAddress.longitude)
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {isDeliverable(newAddress.latitude, newAddress.longitude) ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">
                        ✅ Delivery available! ({formatDistance(getDistanceFromStore(newAddress.latitude, newAddress.longitude) || 0)} from store)
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">
                        ❌ Delivery not available beyond {maxDeliveryDistance}km
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSaveAddress}
              disabled={saveAddressMutation.isPending}
            >
              {saveAddressMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Save & Use This Address
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
