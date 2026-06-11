export interface Aircraft {
  id: string;
  model_name: string;
  icao_code: string | null;
  airline: string;
  rarity: string;
  passengers: number | null;
  engines: string | null;
}