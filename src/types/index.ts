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
  house_livery_url?: string;
  manufacturers?: Manufacturer; 
}