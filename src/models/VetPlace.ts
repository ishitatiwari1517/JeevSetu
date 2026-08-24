export interface VetLocation {
  latitude: number;
  longitude: number;
}

export interface VetPlace {
  placeId: string;
  name: string;
  address?: string;
  location?: VetLocation;
  rating?: number;
  userRatingCount?: number;
  phone?: string;
  openNow?: boolean;
  distanceMeters?: number;
}

export interface VetPlaceDetails extends VetPlace {
  weekdayHours?: string[];
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
}

export interface NearbyVetsQuery {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  keyword?: string;
}
