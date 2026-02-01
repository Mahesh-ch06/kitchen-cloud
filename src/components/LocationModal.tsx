import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, Search, ChevronRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { geocodePincode } from '@/lib/distance';

// Predefined locations with coordinates for Hyderabad
const popularLocations = [
  { area: 'Jubilee Hills', city: 'Hyderabad', address: 'Jubilee Hills, Hyderabad, Telangana', latitude: 17.4326, longitude: 78.4071 },
  { area: 'Banjara Hills', city: 'Hyderabad', address: 'Banjara Hills, Hyderabad, Telangana', latitude: 17.4239, longitude: 78.4738 },
  { area: 'Hitech City', city: 'Hyderabad', address: 'Hitech City, Hyderabad, Telangana', latitude: 17.4484, longitude: 78.3748 },
  { area: 'Gachibowli', city: 'Hyderabad', address: 'Gachibowli, Hyderabad, Telangana', latitude: 17.4399, longitude: 78.3487 },
  { area: 'Madhapur', city: 'Hyderabad', address: 'Madhapur, Hyderabad, Telangana', latitude: 17.4486, longitude: 78.3908 },
  { area: 'Kukatpally', city: 'Hyderabad', address: 'Kukatpally, Hyderabad, Telangana', latitude: 17.4849, longitude: 78.4138 },
  { area: 'Ameerpet', city: 'Hyderabad', address: 'Ameerpet, Hyderabad, Telangana', latitude: 17.4374, longitude: 78.4482 },
  { area: 'Secunderabad', city: 'Hyderabad', address: 'Secunderabad, Hyderabad, Telangana', latitude: 17.4399, longitude: 78.4983 },
];

export function LocationModal() {
  const { isLocationModalOpen, closeLocationModal, setLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [pincodeQuery, setPincodeQuery] = useState('');
  const [isGeocodingPincode, setIsGeocodingPincode] = useState(false);
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
  const [pincodeResult, setPincodeResult] = useState<{latitude: number; longitude: number; city?: string; area?: string} | null>(null);

  const filteredLocations = popularLocations.filter(
    loc => 
      loc.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (loc: typeof popularLocations[0]) => {
    setLocation({
      address: loc.address,
      city: loc.city,
      area: loc.area,
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
  };

  const handleSearchPincode = async () => {
    const trimmed = pincodeQuery.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setIsGeocodingPincode(true);
    setPincodeValid(null);
    
    try {
      const result = await geocodePincode(trimmed);
      if (result) {
        setPincodeResult(result);
        setPincodeValid(true);
        setLocation({
          address: [result.area, result.city].filter(Boolean).join(', '),
          city: result.city || 'Your City',
          area: result.area || 'Your Area',
          latitude: result.latitude,
          longitude: result.longitude,
        });
        toast.success(`Location set to ${result.area || result.city}`);
      } else {
        setPincodeValid(false);
        toast.error('Could not find location for this pincode');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setPincodeValid(false);
      toast.error('Failed to detect location from pincode');
    } finally {
      setIsGeocodingPincode(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get address from coordinates
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        const data = await response.json();
        
        const address = data.address || {};
        const area = address.suburb || address.neighbourhood || address.village || address.town || 'Your Area';
        const city = address.city || address.state_district || address.county || 'Your City';
        const fullAddress = data.display_name || `${area}, ${city}`;
        
        setLocation({
          address: fullAddress,
          city: city,
          area: area,
          latitude,
          longitude,
        });
        
        toast.success(`Location set to ${area}`);
      } catch {
        // If reverse geocoding fails, still save coordinates
        setLocation({
          address: 'Current Location',
          city: 'Nearby',
          area: 'Your Location',
          latitude,
          longitude,
        });
        toast.success('Location detected');
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      if (geoError.code === 1) {
        toast.error('Location permission denied. Please enable location access.');
      } else if (geoError.code === 2) {
        toast.error('Unable to determine your location. Please try again.');
      } else {
        toast.error('Location request timed out. Please try again.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <AnimatePresence>
      {isLocationModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLocationModal}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Select Location</h2>
                <button onClick={closeLocationModal} className="p-2 hover:bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search by Area */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for area, street name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2"
                />
              </div>

              {/* Search by Pincode */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter 6-digit pincode"
                    value={pincodeQuery}
                    onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className={`pl-10 h-12 rounded-xl border-2 pr-10 ${pincodeValid === true ? 'border-green-500' : pincodeValid === false ? 'border-red-500' : ''}`}
                  />
                  {isGeocodingPincode && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                  {!isGeocodingPincode && pincodeValid === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                  )}
                  {!isGeocodingPincode && pincodeValid === false && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                  )}
                </div>
                <Button
                  onClick={handleSearchPincode}
                  disabled={isGeocodingPincode || pincodeQuery.length !== 6}
                  className="h-12 px-6 rounded-xl"
                >
                  Find
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {/* Use Current Location */}
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={isLoadingLocation}
                className="w-full h-14 justify-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {isLoadingLocation ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-primary">
                    {isLoadingLocation ? 'Detecting Location...' : 'Use Current Location'}
                  </p>
                  <p className="text-xs text-muted-foreground">Using GPS</p>
                </div>
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">POPULAR LOCATIONS</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Location List */}
              <div className="space-y-2">
                {filteredLocations.map((loc, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{loc.area}</p>
                      <p className="text-sm text-muted-foreground truncate">{loc.address}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              </div>

              {filteredLocations.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No locations found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
