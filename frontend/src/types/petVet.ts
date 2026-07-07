export type VetClinicDto = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  distanceKm: number;
  rating?: number;
  placeId?: string;
};

export type NearbyVetsSearchParams = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};
