import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  address: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
}

interface LocationContextType {
  location: Location | null;
  isLocationModalOpen: boolean;
  setLocation: (location: Location) => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_KEY = 'user_location';

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<Location | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Load location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCATION_KEY);
    if (stored) {
      try {
        setLocationState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(LOCATION_KEY);
      }
    }
  }, []);

  const setLocation = (newLocation: Location) => {
    setLocationState(newLocation);
    localStorage.setItem(LOCATION_KEY, JSON.stringify(newLocation));
    setIsLocationModalOpen(false);
  };

  const clearLocation = () => {
    setLocationState(null);
    localStorage.removeItem(LOCATION_KEY);
  };

  const openLocationModal = () => setIsLocationModalOpen(true);
  const closeLocationModal = () => setIsLocationModalOpen(false);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocationModalOpen,
        setLocation,
        openLocationModal,
        closeLocationModal,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
