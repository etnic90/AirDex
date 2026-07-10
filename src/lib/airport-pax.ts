// Mapping of correct real-world annual passenger traffic (in millions) for major global and Italian hubs.
const MAJOR_AIRPORTS_PAX: Record<string, number> = {
  // Global Major Hubs (approx. recent annual traffic)
  "ATL": 104.6, // Atlanta
  "DXB": 86.9,  // Dubai
  "DFW": 81.7,  // Dallas/Fort Worth
  "LHR": 79.1,  // London Heathrow
  "HND": 78.7,  // Tokyo Haneda
  "DEN": 77.8,  // Denver
  "ORD": 73.8,  // Chicago O'Hare
  "LAX": 75.0,  // Los Angeles
  "IST": 76.0,  // Istanbul
  "CDG": 67.4,  // Paris Charles de Gaulle
  "SIN": 58.9,  // Singapore Changi
  "PEK": 70.0,  // Beijing Capital
  "CAN": 65.0,  // Guangzhou
  "JFK": 61.5,  // New York JFK
  "AMS": 61.8,  // Amsterdam Schiphol
  "FRA": 59.4,  // Frankfurt
  "MAD": 60.2,  // Madrid Barajas
  "EWR": 49.1,  // Newark
  "SFO": 50.0,  // San Francisco
  "BCN": 49.9,  // Barcelona
  "MIA": 52.3,  // Miami
  "HKG": 39.5,  // Hong Kong
  "MUC": 37.0,  // Munich
  "LIS": 33.6,  // Lisbon
  "YYZ": 49.5,  // Toronto Pearson
  "LAS": 51.5,  // Las Vegas
  "BOS": 40.8,  // Boston
  "SEA": 50.8,  // Seattle
  "MCO": 50.1,  // Orlando
  "CLT": 47.7,  // Charlotte
  "PHX": 46.8,  // Phoenix
  "IAH": 40.9,  // Houston
  "DEL": 72.2,  // Delhi
  "BOM": 48.8,  // Mumbai
  "HNL": 21.9,  // Honolulu
  "YVR": 26.4,  // Vancouver
  "DOH": 45.0,  // Doha
  "STN": 28.0,  // London Stansted
  "DUS": 25.0,  // Düsseldorf
  "PMI": 31.1,  // Palma de Mallorca
  "LGW": 40.9,  // London Gatwick

  // Italian Airports
  "FCO": 40.5,  // Roma Fiumicino
  "MXP": 26.1,  // Milano Malpensa
  "LIN": 9.4,   // Milano Linate
  "BGY": 15.9,  // Bergamo Orio al Serio
  "VCE": 11.3,  // Venezia
  "NAP": 12.4,  // Napoli
  "CTA": 10.1,  // Catania
  "BLQ": 9.9,   // Bologna
  "PMO": 8.1,   // Palermo
  "BRI": 6.4,   // Bari
  "PSA": 5.3,   // Pisa
  "CAG": 4.8,   // Cagliari
  "TRN": 4.3,   // Torino
  "VRN": 3.4,   // Verona
  "SUF": 2.8,   // Lamezia Terme
  "TSF": 2.4,   // Treviso
  "CIA": 3.9,   // Roma Ciampino
  "FLR": 2.9,   // Firenze
  "AHO": 1.4,   // Alghero
  "OLB": 3.2,   // Olbia
  "BXO": 0.3,   // Bolzano
  "CRV": 0.1,   // Crotone
  "REG": 0.3,   // Reggio Calabria
  "PSR": 0.7,   // Pescara
  "AOI": 0.5,   // Ancona
  "GOA": 1.2,   // Genova
  "TRS": 0.9,   // Trieste
  "FOG": 0.05,  // Foggia
  "PMF": 0.1,   // Parma
};

/**
 * Sanitizes the passenger count for airports.
 * If the airport is in the pre-defined list of major hubs, it returns the real-world value.
 * Otherwise, it returns the clean database value (synced with Wikidata).
 */
export function getSanitizedPassengers(
  iataCode: string | null,
  name: string,
  runwaysCount: number,
  dbVal: number | null
): number | null {
  if (!iataCode) return null;

  // 1. Return the curated real-world value if matched
  const matchedPax = MAJOR_AIRPORTS_PAX[iataCode.toUpperCase()];
  if (matchedPax !== undefined) {
    return matchedPax;
  }

  // 2. Return database value directly (now that the database has been cleaned and synced with Wikidata)
  return dbVal;
}
