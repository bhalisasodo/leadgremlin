/**
 * South Africa Geographic Regions & Search Universe Data Model
 * Complete coverage of all 9 South African Provinces, Metropolitan Hubs, Major Cities & Suburbs
 */

export interface Suburb {
  id: string;
  name: string;
  province: string;
  popular?: boolean;
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
    province: 'KwaZulu-Natal (KZN Coast & Midlands)',
    code: 'KZN',
    flagEmoji: '🌊',
    description: 'Durban Metro, North Coast, Umhlanga, Highway & Midlands',
    suburbs: [
      { id: 'umhlanga', name: 'Umhlanga (Rocks & Ridge)', province: 'KZN', popular: true },
      { id: 'ballito', name: 'Ballito & Salt Rock', province: 'KZN', popular: true },
      { id: 'durban_north', name: 'Durban North & Broadway', province: 'KZN', popular: true },
      { id: 'morningside_kzn', name: 'Morningside & Berea Durban', province: 'KZN', popular: true },
      { id: 'hillcrest', name: 'Hillcrest & Kloof', province: 'KZN', popular: true },
      { id: 'westville', name: 'Westville & Pinetown', province: 'KZN', popular: true },
      { id: 'amanzimtoti', name: 'Amanzimtoti & South Coast', province: 'KZN' },
      { id: 'pietermaritzburg', name: 'Pietermaritzburg & Hilton', province: 'KZN', popular: true },
      { id: 'richards_bay', name: 'Richards Bay & Empangeni', province: 'KZN' },
      { id: 'margate', name: 'Margate & Port Shepstone', province: 'KZN' },
      { id: 'newcastle_kzn', name: 'Newcastle & Ladysmith', province: 'KZN' },
      { id: 'st_lucia', name: 'St Lucia & Zululand', province: 'KZN' },
    ],
  },
  {
    province: 'Gauteng (JHB & Pretoria Metro)',
    code: 'GP',
    flagEmoji: '🏙️',
    description: 'Johannesburg Metro, Sandton, Midrand, Pretoria, East & West Rand',
    suburbs: [
      { id: 'sandton', name: 'Sandton & Bryanston', province: 'GP', popular: true },
      { id: 'rosebank', name: 'Rosebank & Parkhurst', province: 'GP', popular: true },
      { id: 'fourways', name: 'Fourways & Lonehill', province: 'GP', popular: true },
      { id: 'midrand', name: 'Midrand & Waterfall', province: 'GP', popular: true },
      { id: 'centurion', name: 'Centurion & Irene', province: 'GP', popular: true },
      { id: 'pretoria_east', name: 'Pretoria East & Menlyn', province: 'GP', popular: true },
      { id: 'pretoria_central', name: 'Pretoria Central & Hatfield', province: 'GP', popular: true },
      { id: 'bedfordview', name: 'Bedfordview & Edenvale', province: 'GP', popular: true },
      { id: 'roodepoort', name: 'Roodepoort & Krugersdorp', province: 'GP' },
      { id: 'soweto', name: 'Soweto & Glenvista', province: 'GP' },
      { id: 'benoni', name: 'Benoni & Boksburg', province: 'GP' },
      { id: 'kempton_park', name: 'Kempton Park & Midvaal', province: 'GP' },
    ],
  },
  {
    province: 'Western Cape (Cape Town & Winelands)',
    code: 'WC',
    flagEmoji: '⛰️',
    description: 'Cape Town Metro, Atlantic Seaboard, Winelands, Overberg & Garden Route',
    suburbs: [
      { id: 'sea_point', name: 'Sea Point & Waterfront', province: 'WC', popular: true },
      { id: 'camps_bay', name: 'Camps Bay & Clifton', province: 'WC', popular: true },
      { id: 'century_city', name: 'Century City & Milnerton', province: 'WC', popular: true },
      { id: 'constantia', name: 'Constantia & Southern Suburbs', province: 'WC', popular: true },
      { id: 'durbanville', name: 'Durbanville & Northern Suburbs', province: 'WC', popular: true },
      { id: 'stellenbosch', name: 'Stellenbosch & Winelands', province: 'WC', popular: true },
      { id: 'paarl', name: 'Paarl & Wellington', province: 'WC', popular: true },
      { id: 'somerset_west', name: 'Somerset West & Gordon\'s Bay', province: 'WC', popular: true },
      { id: 'hermanus', name: 'Hermanus & Walker Bay', province: 'WC' },
      { id: 'george', name: 'George & Garden Route', province: 'WC', popular: true },
      { id: 'knysna', name: 'Knysna & Plettenberg Bay', province: 'WC' },
      { id: 'saldanha', name: 'Saldanha & West Coast (Langebaan)', province: 'WC' },
    ],
  },
  {
    province: 'Eastern Cape (Nelson Mandela Bay & Buffalo City)',
    code: 'EC',
    flagEmoji: '🏖️',
    description: 'Gqeberha (Port Elizabeth), East London, Sunshine Coast & Karoo',
    suburbs: [
      { id: 'gqeberha', name: 'Gqeberha (Port Elizabeth - Walmer & Summerstrand)', province: 'EC', popular: true },
      { id: 'east_london', name: 'East London & Beacon Bay', province: 'EC', popular: true },
      { id: 'kariega', name: 'Kariega (Uitenhage)', province: 'EC' },
      { id: 'makhanda', name: 'Makhanda (Grahamstown)', province: 'EC', popular: true },
      { id: 'mthatha', name: 'Mthatha & Wild Coast', province: 'EC' },
      { id: 'jeffreys_bay', name: 'Jeffreys Bay & Cape St Francis', province: 'EC', popular: true },
      { id: 'port_alfred', name: 'Port Alfred & Sunshine Coast', province: 'EC' },
      { id: 'queenstown', name: 'Queenstown (Komani)', province: 'EC' },
    ],
  },
  {
    province: 'Free State (Bloemfontein & Goldfields)',
    code: 'FS',
    flagEmoji: '🌾',
    description: 'Bloemfontein Metro, Goldfields, Maluti Route & Vaal River',
    suburbs: [
      { id: 'bloemfontein', name: 'Bloemfontein (Dan Pienaar & Langenhovenpark)', province: 'FS', popular: true },
      { id: 'welkom', name: 'Welkom & Goldfields', province: 'FS' },
      { id: 'bethlehem', name: 'Bethlehem & Clarens', province: 'FS', popular: true },
      { id: 'sasolburg', name: 'Sasolburg & Vaal Park', province: 'FS' },
      { id: 'kroonstad', name: 'Kroonstad', province: 'FS' },
      { id: 'parys', name: 'Parys & Vaal River', province: 'FS', popular: true },
    ],
  },
  {
    province: 'Mpumalanga (Lowveld & Energy Belt)',
    code: 'MP',
    flagEmoji: '🌄',
    description: 'Mbombela (Nelspruit), White River, eMalahleni & Panorama Route',
    suburbs: [
      { id: 'nelspruit', name: 'Nelspruit (Mbombela & Riverside)', province: 'MP', popular: true },
      { id: 'white_river', name: 'White River & Hazyview', province: 'MP', popular: true },
      { id: 'witbank', name: 'Witbank (eMalahleni)', province: 'MP', popular: true },
      { id: 'middelburg_mp', name: 'Middelburg Mpumalanga', province: 'MP' },
      { id: 'secunda', name: 'Secunda & Trichardt', province: 'MP' },
      { id: 'dullstroom', name: 'Dullstroom & Sabie', province: 'MP', popular: true },
    ],
  },
  {
    province: 'Limpopo (Polokwane & Waterberg)',
    code: 'LP',
    flagEmoji: '🦁',
    description: 'Polokwane Metro, Tzaneen, Waterberg Bushveld & Vhembe',
    suburbs: [
      { id: 'polokwane', name: 'Polokwane & Bendor', province: 'LP', popular: true },
      { id: 'tzaneen', name: 'Tzaneen & Letaba', province: 'LP', popular: true },
      { id: 'mokopane', name: 'Mokopane (Potgietersrus)', province: 'LP' },
      { id: 'bela_bela', name: 'Bela-Bela (Warmbaths)', province: 'LP', popular: true },
      { id: 'lephalale', name: 'Lephalale (Ellisras)', province: 'LP' },
      { id: 'thohoyandou', name: 'Thohoyandou & Makhado', province: 'LP' },
      { id: 'phalaborwa', name: 'Phalaborwa & Kruger Border', province: 'LP' },
    ],
  },
  {
    province: 'North West (Rustenburg & Bojanala)',
    code: 'NW',
    flagEmoji: '⛏️',
    description: 'Rustenburg, Potchefstroom, Klerksdorp & Hartbeespoort',
    suburbs: [
      { id: 'rustenburg', name: 'Rustenburg & Waterfall East', province: 'NW', popular: true },
      { id: 'potchefstroom', name: 'Potchefstroom & Baillie Park', province: 'NW', popular: true },
      { id: 'klerksdorp', name: 'Klerksdorp & Stilfontein', province: 'NW', popular: true },
      { id: 'hartbeespoort', name: 'Hartbeespoort & Brits', province: 'NW', popular: true },
      { id: 'mahikeng', name: 'Mahikeng (Mafikeng)', province: 'NW' },
      { id: 'sun_city', name: 'Sun City & Ledig', province: 'NW' },
    ],
  },
  {
    province: 'Northern Cape (Kimberley & Kalahari)',
    code: 'NC',
    flagEmoji: '💎',
    description: 'Kimberley, Upington, Diamond Fields & Namakwa',
    suburbs: [
      { id: 'kimberley', name: 'Kimberley & Monument Heights', province: 'NC', popular: true },
      { id: 'upington', name: 'Upington & Orange River', province: 'NC', popular: true },
      { id: 'kathu', name: 'Kathu & Kuruman', province: 'NC' },
      { id: 'springbok', name: 'Springbok & Namakwa', province: 'NC' },
      { id: 'de_aar', name: 'De Aar & Karoo Hubs', province: 'NC' },
    ],
  },
];

/**
 * Get all available provinces metadata
 */
export function getAllProvinces() {
  return SOUTH_AFRICA_REGIONS.map((r) => ({
    code: r.code,
    province: r.province,
    flagEmoji: r.flagEmoji,
    description: r.description,
    suburbCount: r.suburbs.length,
  }));
}

/**
 * Get flat list of all suburbs in South Africa
 */
export function getAllSuburbs(): Suburb[] {
  return SOUTH_AFRICA_REGIONS.flatMap((r) => r.suburbs);
}

/**
 * Get suburbs filtered by province code
 */
export function getSuburbsByProvince(code: string): Suburb[] {
  if (!code || code.toUpperCase() === 'ALL') {
    return getAllSuburbs();
  }
  // Support legacy OTH code mapping
  if (code.toUpperCase() === 'OTH') {
    const oths = ['EC', 'FS', 'MP', 'LP', 'NW', 'NC'];
    return SOUTH_AFRICA_REGIONS.filter((r) => oths.includes(r.code)).flatMap((r) => r.suburbs);
  }
  const group = SOUTH_AFRICA_REGIONS.find((r) => r.code.toUpperCase() === code.toUpperCase());
  return group ? group.suburbs : [];
}

/**
 * Find region group for a suburb id or suburb name
 */
export function findRegionBySuburb(suburbNameOrId: string): { group: RegionGroup; suburb: Suburb } | null {
  const term = suburbNameOrId.toLowerCase();
  for (const group of SOUTH_AFRICA_REGIONS) {
    const suburb = group.suburbs.find(
      (s) => s.id.toLowerCase() === term || s.name.toLowerCase().includes(term)
    );
    if (suburb) {
      return { group, suburb };
    }
  }
  return null;
}

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

