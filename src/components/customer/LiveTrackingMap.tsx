import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons using divIcon for better control
const createSvgIcon = (svg: string, size: number = 40) => {
  return L.divIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const restaurantIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="white" stroke-width="2"/>
    <path d="M20 12 L20 22 M16 14 C16 14 16 16 16 18 C16 20 18 20 18 20 L22 20 C22 20 24 20 24 18 C24 16 24 14 24 14 M14 24 L26 24 C26 24 28 24 28 26 L28 28 C28 28 28 30 26 30 L14 30 C14 30 12 30 12 28 L12 26 C12 26 12 24 14 24" fill="white" stroke="white" stroke-width="1"/>
  </svg>
`;

const deliveryPartnerIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="2"/>
    <path d="M12 24 L16 24 L16 20 L24 20 L24 24 L28 24 M18 16 L18 20 M22 16 L22 20 M14 24 C14 24 14 26 16 26 C18 26 18 24 18 24 M22 24 C22 24 22 26 24 26 C26 26 26 24 26 24" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
`;

const customerIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="2"/>
    <circle cx="20" cy="16" r="5" fill="white"/>
    <path d="M12 30 C12 25 16 22 20 22 C24 22 28 25 28 30" fill="white"/>
  </svg>
`;

interface DeliveryPartner {
  id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

interface LiveTrackingMapProps {
  restaurantLocation: [number, number];
  customerLocation: [number, number];
  deliveryPartnerLocation: [number, number];
  storeName: string;
  deliveryAddress: string;
  deliveryPartner: DeliveryPartner | null;
  currentStep: number;
}

export function LiveTrackingMap({
  restaurantLocation,
  customerLocation,
  deliveryPartnerLocation,
  storeName,
  deliveryAddress,
  deliveryPartner,
  currentStep,
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{
    restaurant?: L.Marker;
    customer?: L.Marker;
    deliveryPartner?: L.Marker;
    polyline?: L.Polyline;
  }>({});
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: deliveryPartnerLocation,
      zoom: 13,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // Create icons
    const restaurantIcon = createSvgIcon(restaurantIconSvg);
    const deliveryIcon = createSvgIcon(deliveryPartnerIconSvg);
    const customerIcon = createSvgIcon(customerIconSvg);

    // Remove existing markers
    if (markersRef.current.restaurant) {
      markersRef.current.restaurant.remove();
    }
    if (markersRef.current.customer) {
      markersRef.current.customer.remove();
    }
    if (markersRef.current.deliveryPartner) {
      markersRef.current.deliveryPartner.remove();
    }
    if (markersRef.current.polyline) {
      markersRef.current.polyline.remove();
    }

    // Add restaurant marker
    markersRef.current.restaurant = L.marker(restaurantLocation, { icon: restaurantIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <div style="font-weight: bold;">${storeName}</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${currentStep < 5 ? 'Preparing your order' : 'Order picked up'}
          </div>
        </div>
      `);

    // Add customer marker
    markersRef.current.customer = L.marker(customerLocation, { icon: customerIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <div style="font-weight: bold;">Your Location</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px; max-width: 200px;">
            ${deliveryAddress.split(',').slice(0, 2).join(',')}
          </div>
        </div>
      `);

    // Add delivery partner marker
    if (deliveryPartner) {
      const partnerName = `${deliveryPartner.profile?.first_name || 'Delivery'} ${deliveryPartner.profile?.last_name || 'Partner'}`;
      markersRef.current.deliveryPartner = L.marker(deliveryPartnerLocation, { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center;">
            <div style="font-weight: bold;">${partnerName}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ${currentStep >= 5 ? 'On the way to you' : 'Heading to restaurant'}
            </div>
            ${deliveryPartner.vehicle_number ? `
              <div style="margin-top: 8px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                ${deliveryPartner.vehicle_number}
              </div>
            ` : ''}
          </div>
        `);
    }

    // Add route polyline
    const routePositions: L.LatLngExpression[] = currentStep >= 5
      ? [restaurantLocation, deliveryPartnerLocation, customerLocation]
      : [restaurantLocation, deliveryPartnerLocation];

    markersRef.current.polyline = L.polyline(routePositions, {
      color: '#10b981',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10',
    }).addTo(map);

    // Fit bounds to show all markers
    const bounds = L.latLngBounds([restaurantLocation, customerLocation, deliveryPartnerLocation]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [
    isMapReady,
    restaurantLocation,
    customerLocation,
    deliveryPartnerLocation,
    storeName,
    deliveryAddress,
    deliveryPartner,
    currentStep,
  ]);

  // Update delivery partner position smoothly
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !markersRef.current.deliveryPartner) return;

    markersRef.current.deliveryPartner.setLatLng(deliveryPartnerLocation);

    // Update polyline
    if (markersRef.current.polyline) {
      const routePositions: L.LatLngExpression[] = currentStep >= 5
        ? [restaurantLocation, deliveryPartnerLocation, customerLocation]
        : [restaurantLocation, deliveryPartnerLocation];
      markersRef.current.polyline.setLatLngs(routePositions);
    }
  }, [deliveryPartnerLocation, currentStep, restaurantLocation, customerLocation, isMapReady]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      className="z-0"
    />
  );
}
