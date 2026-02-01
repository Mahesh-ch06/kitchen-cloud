/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Number(distance.toFixed(2));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param km Distance in kilometers
 * @returns Formatted string (e.g., "2.5 km" or "500 m")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Check if delivery is "fast" (within 3km)
 * @param km Distance in kilometers
 * @returns true if distance is 3km or less
 */
export function isFastDelivery(km: number): boolean {
  return km <= 3;
}

/**
 * Estimate delivery time based on distance
 * @param km Distance in kilometers
 * @returns Estimated delivery time in minutes
 */
export function estimateDeliveryTime(km: number): number {
  // Base time: 20 minutes
  // Add 5 minutes per km
  const baseTime = 20;
  const timePerKm = 5;
  return Math.round(baseTime + (km * timePerKm));
}

/**
 * Geocode a pincode to get latitude and longitude (India)
 * Uses India Post API for pincode details, then a backup coordinate lookup
 * @param pincode Indian pincode (6 digits)
 * @returns Promise with latitude and longitude, or null if not found
 */
export async function geocodePincode(pincode: string): Promise<{
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
  state?: string;
} | null> {
  if (!pincode || pincode.length !== 6) {
    return null;
  }

  try {
    // First try the India Post API for postal details
    const indiaPostResponse = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );
    const indiaPostData = await indiaPostResponse.json();

    if (indiaPostData && indiaPostData[0]?.Status === 'Success' && indiaPostData[0]?.PostOffice?.length > 0) {
      const postOffice = indiaPostData[0].PostOffice[0];
      
      // Now get coordinates using a CORS-friendly geocoding service
      // Using OpenStreetMap's Nominatim with proper headers
      const searchQuery = `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}, India`;
      
      try {
        const geoResponse = await fetch(
          `https://geocode.maps.co/search?q=${encodeURIComponent(searchQuery)}&api_key=`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData && geoData.length > 0) {
            return {
              latitude: parseFloat(geoData[0].lat),
              longitude: parseFloat(geoData[0].lon),
              area: postOffice.Name,
              city: postOffice.District,
              state: postOffice.State,
            };
          }
        }
      } catch (geoError) {
        console.log('Geocoding fallback failed, using approximate coordinates');
      }

      // Fallback: Use approximate coordinates based on major Indian cities/districts
      const coords = getApproximateCoordinates(postOffice.District, postOffice.State);
      if (coords) {
        return {
          latitude: coords.lat,
          longitude: coords.lng,
          area: postOffice.Name,
          city: postOffice.District,
          state: postOffice.State,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Get approximate coordinates for Indian districts/states
 * This is a fallback when geocoding APIs fail
 */
function getApproximateCoordinates(district: string, state: string): { lat: number; lng: number } | null {
  // Major Indian cities/districts with approximate coordinates
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    // Telangana
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Adilabad': { lat: 19.6640, lng: 78.5320 },
    'Karimnagar': { lat: 18.4386, lng: 79.1288 },
    'Nizamabad': { lat: 18.6725, lng: 78.0940 },
    'Warangal': { lat: 17.9689, lng: 79.5941 },
    'Khammam': { lat: 17.2473, lng: 80.1514 },
    'Nalgonda': { lat: 17.0500, lng: 79.2667 },
    'Mahabubnagar': { lat: 16.7488, lng: 77.9850 },
    'Rangareddy': { lat: 17.2543, lng: 78.2035 },
    'Medak': { lat: 18.0500, lng: 78.2667 },
    // Andhra Pradesh
    'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'Vijayawada': { lat: 16.5062, lng: 80.6480 },
    'Guntur': { lat: 16.3067, lng: 80.4365 },
    'Tirupati': { lat: 13.6288, lng: 79.4192 },
    'Kurnool': { lat: 15.8281, lng: 78.0373 },
    'Nellore': { lat: 14.4426, lng: 79.9865 },
    'Kadapa': { lat: 14.4673, lng: 78.8242 },
    'Anantapur': { lat: 14.6819, lng: 77.6006 },
    'Chittoor': { lat: 13.2172, lng: 79.1003 },
    'East Godavari': { lat: 17.3180, lng: 82.1833 },
    'West Godavari': { lat: 16.9174, lng: 81.3399 },
    'Krishna': { lat: 16.6100, lng: 80.7272 },
    'Prakasam': { lat: 15.3333, lng: 79.6167 },
    'Srikakulam': { lat: 18.2949, lng: 83.8938 },
    'Vizianagaram': { lat: 18.1066, lng: 83.4205 },
    // Maharashtra
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Mumbai Suburban': { lat: 19.1136, lng: 72.8697 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 },
    'Thane': { lat: 19.2183, lng: 72.9781 },
    'Nashik': { lat: 19.9975, lng: 73.7898 },
    'Aurangabad': { lat: 19.8762, lng: 75.3433 },
    'Solapur': { lat: 17.6599, lng: 75.9064 },
    'Amravati': { lat: 20.9320, lng: 77.7523 },
    'Kolhapur': { lat: 16.7050, lng: 74.2433 },
    // Karnataka
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Bangalore Urban': { lat: 12.9716, lng: 77.5946 },
    'Mysore': { lat: 12.2958, lng: 76.6394 },
    'Mysuru': { lat: 12.2958, lng: 76.6394 },
    'Hubli': { lat: 15.3647, lng: 75.1240 },
    'Mangalore': { lat: 12.9141, lng: 74.8560 },
    'Belgaum': { lat: 15.8497, lng: 74.4977 },
    'Gulbarga': { lat: 17.3297, lng: 76.8343 },
    'Davangere': { lat: 14.4644, lng: 75.9218 },
    'Bellary': { lat: 15.1394, lng: 76.9214 },
    'Shimoga': { lat: 13.9299, lng: 75.5681 },
    // Tamil Nadu
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
    'Salem': { lat: 11.6643, lng: 78.1460 },
    'Tirunelveli': { lat: 8.7139, lng: 77.7567 },
    'Erode': { lat: 11.3410, lng: 77.7172 },
    'Vellore': { lat: 12.9165, lng: 79.1325 },
    'Thoothukudi': { lat: 8.7642, lng: 78.1348 },
    'Thanjavur': { lat: 10.7870, lng: 79.1378 },
    // Kerala
    'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Kozhikode': { lat: 11.2588, lng: 75.7804 },
    'Thrissur': { lat: 10.5276, lng: 76.2144 },
    'Kollam': { lat: 8.8932, lng: 76.6141 },
    'Kannur': { lat: 11.8745, lng: 75.3704 },
    'Alappuzha': { lat: 9.4981, lng: 76.3388 },
    'Palakkad': { lat: 10.7867, lng: 76.6548 },
    'Malappuram': { lat: 11.0509, lng: 76.0710 },
    'Kottayam': { lat: 9.5916, lng: 76.5222 },
    // Delhi NCR
    'New Delhi': { lat: 28.6139, lng: 77.2090 },
    'Delhi': { lat: 28.7041, lng: 77.1025 },
    'Gurgaon': { lat: 28.4595, lng: 77.0266 },
    'Gurugram': { lat: 28.4595, lng: 77.0266 },
    'Noida': { lat: 28.5355, lng: 77.3910 },
    'Faridabad': { lat: 28.4089, lng: 77.3178 },
    'Ghaziabad': { lat: 28.6692, lng: 77.4538 },
    // Uttar Pradesh
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Kanpur': { lat: 26.4499, lng: 80.3319 },
    'Agra': { lat: 27.1767, lng: 78.0081 },
    'Varanasi': { lat: 25.3176, lng: 82.9739 },
    'Allahabad': { lat: 25.4358, lng: 81.8463 },
    'Prayagraj': { lat: 25.4358, lng: 81.8463 },
    'Meerut': { lat: 28.9845, lng: 77.7064 },
    'Bareilly': { lat: 28.3670, lng: 79.4304 },
    'Aligarh': { lat: 27.8974, lng: 78.0880 },
    'Moradabad': { lat: 28.8389, lng: 78.7769 },
    'Gorakhpur': { lat: 26.7606, lng: 83.3732 },
    // Gujarat
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Bhavnagar': { lat: 21.7645, lng: 72.1519 },
    'Jamnagar': { lat: 22.4707, lng: 70.0577 },
    'Junagadh': { lat: 21.5222, lng: 70.4579 },
    'Gandhinagar': { lat: 23.2156, lng: 72.6369 },
    // West Bengal
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Howrah': { lat: 22.5958, lng: 88.2636 },
    'Durgapur': { lat: 23.5204, lng: 87.3119 },
    'Asansol': { lat: 23.6739, lng: 86.9524 },
    'Siliguri': { lat: 26.7271, lng: 88.3953 },
    'Bardhaman': { lat: 23.2324, lng: 87.8615 },
    // Rajasthan
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Jodhpur': { lat: 26.2389, lng: 73.0243 },
    'Udaipur': { lat: 24.5854, lng: 73.7125 },
    'Kota': { lat: 25.2138, lng: 75.8648 },
    'Bikaner': { lat: 28.0229, lng: 73.3119 },
    'Ajmer': { lat: 26.4499, lng: 74.6399 },
    // Madhya Pradesh
    'Bhopal': { lat: 23.2599, lng: 77.4126 },
    'Indore': { lat: 22.7196, lng: 75.8577 },
    'Jabalpur': { lat: 23.1815, lng: 79.9864 },
    'Gwalior': { lat: 26.2183, lng: 78.1828 },
    'Ujjain': { lat: 23.1765, lng: 75.7885 },
    // Bihar
    'Patna': { lat: 25.5941, lng: 85.1376 },
    'Gaya': { lat: 24.7914, lng: 85.0002 },
    'Bhagalpur': { lat: 25.2425, lng: 86.9842 },
    'Muzaffarpur': { lat: 26.1209, lng: 85.3647 },
    // Odisha
    'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'Cuttack': { lat: 20.4625, lng: 85.8830 },
    'Rourkela': { lat: 22.2604, lng: 84.8536 },
    'Berhampur': { lat: 19.3150, lng: 84.7941 },
    // Punjab
    'Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Ludhiana': { lat: 30.9010, lng: 75.8573 },
    'Amritsar': { lat: 31.6340, lng: 74.8723 },
    'Jalandhar': { lat: 31.3260, lng: 75.5762 },
    'Patiala': { lat: 30.3398, lng: 76.3869 },
    // Haryana
    'Panipat': { lat: 29.3909, lng: 76.9635 },
    'Ambala': { lat: 30.3782, lng: 76.7767 },
    'Karnal': { lat: 29.6857, lng: 76.9905 },
    'Rohtak': { lat: 28.8955, lng: 76.6066 },
    'Hisar': { lat: 29.1492, lng: 75.7217 },
    // Jharkhand
    'Ranchi': { lat: 23.3441, lng: 85.3096 },
    'Jamshedpur': { lat: 22.8046, lng: 86.2029 },
    'Dhanbad': { lat: 23.7957, lng: 86.4304 },
    'Bokaro': { lat: 23.6693, lng: 86.1511 },
    // Chhattisgarh
    'Raipur': { lat: 21.2514, lng: 81.6296 },
    'Bhilai': { lat: 21.2094, lng: 81.4285 },
    'Bilaspur': { lat: 22.0797, lng: 82.1409 },
    // Assam
    'Guwahati': { lat: 26.1445, lng: 91.7362 },
    'Dibrugarh': { lat: 27.4728, lng: 94.9120 },
    'Silchar': { lat: 24.8333, lng: 92.7789 },
    // Others
    'Dehradun': { lat: 30.3165, lng: 78.0322 },
    'Shimla': { lat: 31.1048, lng: 77.1734 },
    'Jammu': { lat: 32.7266, lng: 74.8570 },
    'Srinagar': { lat: 34.0837, lng: 74.7973 },
    'Imphal': { lat: 24.8170, lng: 93.9368 },
    'Shillong': { lat: 25.5788, lng: 91.8933 },
    'Aizawl': { lat: 23.7271, lng: 92.7176 },
    'Kohima': { lat: 25.6586, lng: 94.1086 },
    'Agartala': { lat: 23.8315, lng: 91.2868 },
    'Itanagar': { lat: 27.0844, lng: 93.6053 },
    'Gangtok': { lat: 27.3389, lng: 88.6065 },
    'Port Blair': { lat: 11.6234, lng: 92.7265 },
    'Panaji': { lat: 15.4909, lng: 73.8278 },
    'Daman': { lat: 20.4283, lng: 72.8397 },
    'Silvassa': { lat: 20.2766, lng: 73.0166 },
    'Kavaratti': { lat: 10.5626, lng: 72.6369 },
    'Puducherry': { lat: 11.9416, lng: 79.8083 },
    'Pondicherry': { lat: 11.9416, lng: 79.8083 },
  };

  // State capitals as fallback
  const stateCoords: Record<string, { lat: number; lng: number }> = {
    'Telangana': { lat: 17.3850, lng: 78.4867 },
    'Andhra Pradesh': { lat: 16.5062, lng: 80.6480 },
    'Maharashtra': { lat: 19.0760, lng: 72.8777 },
    'Karnataka': { lat: 12.9716, lng: 77.5946 },
    'Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
    'Kerala': { lat: 8.5241, lng: 76.9366 },
    'Gujarat': { lat: 23.0225, lng: 72.5714 },
    'Rajasthan': { lat: 26.9124, lng: 75.7873 },
    'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
    'Madhya Pradesh': { lat: 23.2599, lng: 77.4126 },
    'West Bengal': { lat: 22.5726, lng: 88.3639 },
    'Bihar': { lat: 25.5941, lng: 85.1376 },
    'Odisha': { lat: 20.2961, lng: 85.8245 },
    'Punjab': { lat: 30.7333, lng: 76.7794 },
    'Haryana': { lat: 28.4595, lng: 77.0266 },
    'Jharkhand': { lat: 23.3441, lng: 85.3096 },
    'Chhattisgarh': { lat: 21.2514, lng: 81.6296 },
    'Assam': { lat: 26.1445, lng: 91.7362 },
    'Uttarakhand': { lat: 30.3165, lng: 78.0322 },
    'Himachal Pradesh': { lat: 31.1048, lng: 77.1734 },
    'Goa': { lat: 15.4909, lng: 73.8278 },
    'Tripura': { lat: 23.8315, lng: 91.2868 },
    'Meghalaya': { lat: 25.5788, lng: 91.8933 },
    'Manipur': { lat: 24.8170, lng: 93.9368 },
    'Nagaland': { lat: 25.6586, lng: 94.1086 },
    'Mizoram': { lat: 23.7271, lng: 92.7176 },
    'Arunachal Pradesh': { lat: 27.0844, lng: 93.6053 },
    'Sikkim': { lat: 27.3389, lng: 88.6065 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Jammu and Kashmir': { lat: 34.0837, lng: 74.7973 },
    'Ladakh': { lat: 34.1526, lng: 77.5771 },
    'Puducherry': { lat: 11.9416, lng: 79.8083 },
    'Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Andaman and Nicobar Islands': { lat: 11.6234, lng: 92.7265 },
    'Dadra and Nagar Haveli and Daman and Diu': { lat: 20.4283, lng: 72.8397 },
    'Lakshadweep': { lat: 10.5626, lng: 72.6369 },
  };

  // First try to match district
  const districtKey = Object.keys(cityCoords).find(
    key => key.toLowerCase() === district.toLowerCase()
  );
  if (districtKey) {
    return cityCoords[districtKey];
  }

  // Then try to match state
  const stateKey = Object.keys(stateCoords).find(
    key => key.toLowerCase() === state.toLowerCase()
  );
  if (stateKey) {
    return stateCoords[stateKey];
  }

  return null;
}

/**
 * Calculate distance between store and delivery pincode
 * @param storeLat Store latitude
 * @param storeLng Store longitude
 * @param deliveryPincode Delivery pincode
 * @returns Promise with distance in km, or null if geocoding fails
 */
export async function calculateDistanceByPincode(
  storeLat: number,
  storeLng: number,
  deliveryPincode: string
): Promise<number | null> {
  const geocoded = await geocodePincode(deliveryPincode);
  if (!geocoded) return null;
  
  return calculateDistance(storeLat, storeLng, geocoded.latitude, geocoded.longitude);
}
