export type RarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type AircraftStatus = 'ACTIVE' | 'HISTORIC';

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  logo_url?: string;
}

export interface AircraftModel {
  id: string;
  manufacturer_id: string;
  model_name: string;
  type: string;
  engines: string;
  max_passengers: number;
  range_km: number;
  first_flight_year?: number;
  status?: AircraftStatus;
  rarity?: RarityTier;
  house_livery_url?: string;
  launch_customer_livery_url?: string;
  manufacturers?: Manufacturer;
  era?: string;
  description?: string;
  description_it?: string;
  description_en?: string;
  description_es?: string;
  description_fr?: string;
  trivia?: string[];
  extended_stats?: Record<string, unknown>;
  slug: string;
}