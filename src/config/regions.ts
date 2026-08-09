/**
 * South Africa Geographic Regions & Search Universe Data Model
 */

export interface Suburb {
  id: string;
  name: string;
  province: string;
}

export interface RegionGroup {
  province: string;
  code: string;
  flagEmoji: string;
  description: string;
  suburbs: Suburb[];
}

export const SOUTH_AFRICA_REGIONS: RegionGroup[] = [
  {
    province: 'KwaZulu-Natal (KZN Coast)',
    code: 'KZN',
    flagEmoji: '🌊',
    description: 'Durban Metro, North Coast, Umhlanga & Highway Region',
    suburbs: [
      { id: 'umhlanga', name: 'Umhlanga (Rocks & Ridge)', province: 'KZN' },
      { id: 'ballito', name: 'Ballito & Salt Rock', province: 'KZN' },
      { id: 'durban_north', name: 'Durban North & Broadway', province: 'KZN' },
      { id: 'morningside_kzn', name: 'Morningside & Berea Durban', province: 'KZN' },
      { id: 'hillcrest', name: 'Hillcrest & Kloof', province: 'KZN' },
      { id: 'amanzimtoti', name: 'Amanzimtoti & South Coast', province: 'KZN' },
      { id: 'westville', name: 'Westville & Pinetown', province: 'KZN' },
    ],
  },
  {
    province: 'Gauteng (JHB & Pretoria)',
    code: 'GP',
    flagEmoji: '🏙️',
    description: 'Johannesburg Metro, Sandton, Midrand & Pretoria',
    suburbs: [
      { id: 'sandton', name: 'Sandton & Bryanston', province: 'GP' },
      { id: 'rosebank', name: 'Rosebank & Parkhurst', province: 'GP' },
      { id: 'fourways', name: 'Fourways & Lonehill', province: 'GP' },
      { id: 'midrand', name: 'Midrand & Waterfall', province: 'GP' },
      { id: 'centurion', name: 'Centurion & Irene', province: 'GP' },
      { id: 'pretoria_east', name: 'Pretoria East & Menlyn', province: 'GP' },
      { id: 'bedfordview', name: 'Bedfordview & Edenvale', province: 'GP' },
    ],
  },
  {
    province: 'Western Cape (Cape Town)',
    code: 'WC',
    flagEmoji: '⛰️',
    description: 'Cape Town Metro, Atlantic Seaboard & Winelands',
    suburbs: [
      { id: 'sea_point', name: 'Sea Point & Waterfront', province: 'WC' },
      { id: 'camps_bay', name: 'Camps Bay & Clifton', province: 'WC' },
      { id: 'century_city', name: 'Century City & Milnerton', province: 'WC' },
      { id: 'constantia', name: 'Constantia & Southern Suburbs', province: 'WC' },
      { id: 'durbanville', name: 'Durbanville & Northern Suburbs', province: 'WC' },
      { id: 'stellenbosch', name: 'Stellenbosch & Somerset West', province: 'WC' },
    ],
  },
  {
    province: 'Other SA Major Hubs',
    code: 'OTH',
    flagEmoji: '🇿🇦',
    description: 'Eastern Cape, Free State & Mpumalanga Hubs',
    suburbs: [
      { id: 'gqeberha', name: 'Gqeberha (Port Elizabeth)', province: 'OTH' },
      { id: 'east_london', name: 'East London & Beacon Bay', province: 'OTH' },
      { id: 'bloemfontein', name: 'Bloemfontein & Dan Pienaar', province: 'OTH' },
      { id: 'nelspruit', name: 'Nelspruit (Mbombela)', province: 'OTH' },
      { id: 'polokwane', name: 'Polokwane', province: 'OTH' },
    ],
  },
];

/**
 * Generate multi-location batch search queries (e.g. "gym Sandton", "beauty salon Sea Point")
 */
export function buildMultiRegionQueries(categories: string[], areas: string[]): string[] {
  const queries: string[] = [];
  const cleanCategories = categories.length > 0 ? categories : ['gym', 'beauty salon', 'restaurant', 'dentist'];
  const cleanAreas = areas.length > 0 ? areas : ['Umhlanga', 'Sandton', 'Sea Point'];

  for (const area of cleanAreas) {
    for (const cat of cleanCategories) {
      // Remove country tag if already present in category string
      const cleanCat = cat.replace(/south africa/gi, '').trim();
      queries.push(`${cleanCat} ${area}`);
    }
  }

  return queries;
}
