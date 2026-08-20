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
 * Industry Niche Presets with High-Yield Commercial Subcategories
 */
export interface NichePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  keywords: string[];
}

export const INDUSTRY_NICHE_PRESETS: NichePreset[] = [
  {
    id: 'healthcare_medical',
    name: 'Healthcare & Specialized Medical',
    emoji: '🩺',
    description: 'Dentists, cosmetic clinics, physiotherapists, chiropractors & specialists',
    keywords: [
      'dentist',
      'cosmetic dentist',
      'dental clinic',
      'physiotherapist',
      'chiropractor',
      'aesthetic clinic',
      'dermatologist',
      'optometrist',
      'orthodontist',
      'private doctor clinic',
    ],
  },
  {
    id: 'trades_home_services',
    name: 'Home Services, Solar & Trades',
    emoji: '⚡',
    description: 'Solar installers, electricians, plumbers, HVAC, roofing & contractors',
    keywords: [
      'solar installer',
      'solar power company',
      'electrician',
      'plumber',
      'air conditioning hvac',
      'roofing contractor',
      'renovation contractor',
      'pest control',
      'landscaping services',
      'pool service',
    ],
  },
  {
    id: 'beauty_aesthetics',
    name: 'Beauty, Hair & MedSpas',
    emoji: '💅',
    description: 'Hair salons, medical spas, nail bars, aesthetics & barber shops',
    keywords: [
      'beauty salon',
      'hair salon',
      'med spa',
      'skincare clinic',
      'nail salon',
      'barber shop',
      'laser clinic',
      'day spa',
      'eyelash and brow studio',
      'massage therapy',
    ],
  },
  {
    id: 'fitness_wellness',
    name: 'Fitness, CrossFit & Wellness',
    emoji: '🏋️',
    description: 'Gyms, CrossFit boxes, Pilates, Yoga, personal trainers & martial arts',
    keywords: [
      'gym',
      'crossfit box',
      'pilates studio',
      'yoga studio',
      'personal trainer',
      'boxing gym',
      'martial arts academy',
      'fitness center',
      'ems fitness',
    ],
  },
  {
    id: 'hospitality_dining',
    name: 'Hospitality, Dining & Venues',
    emoji: '🍽️',
    description: 'Fine dining, boutique restaurants, cafes, steakhouses & event venues',
    keywords: [
      'restaurant',
      'fine dining',
      'steakhouse',
      'italian restaurant',
      'seafood restaurant',
      'artisan cafe',
      'boutique hotel',
      'wedding venue',
      'catering company',
    ],
  },
  {
    id: 'professional_legal',
    name: 'Legal, Accounting & Corporate Services',
    emoji: '⚖️',
    description: 'Law firms, conveyancers, accounting practices, tax consultants & architects',
    keywords: [
      'law firm',
      'attorney',
      'conveyancing attorney',
      'chartered accountant',
      'tax consultant',
      'financial advisor',
      'architect',
      'interior designer',
      'commercial cleaning',
    ],
  },
  {
    id: 'automotive_services',
    name: 'Automotive Repair & Detailing',
    emoji: '🚗',
    description: 'Auto repair, panel beaters, ceramic coating, tyre centres & workshops',
    keywords: [
      'car detailing',
      'ceramic coating',
      'auto repair mechanic',
      'panel beater',
      'tyre and fitment center',
      'car audio security',
      'towing service',
      'vehicle wrap',
    ],
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Property Management',
    emoji: '🏡',
    description: 'Estate agencies, property managers, commercial brokers & developments',
    keywords: [
      'real estate agency',
      'estate agent',
      'property management',
      'commercial property broker',
      'property developer',
      'luxury villa rental',
    ],
  },
  {
    id: 'all_high_yield',
    name: 'All High-Yield Niches (Full Spectrum)',
    emoji: '🚀',
    description: 'Cross-industry extraction across all primary B2B & local service verticals',
    keywords: [
      'dentist',
      'solar installer',
      'beauty salon',
      'gym',
      'law firm',
      'physiotherapist',
      'real estate agent',
      'car detailing',
      'electrician',
      'plumber',
      'restaurant',
      'chartered accountant',
    ],
  },
];

export const COMMERCIAL_INTENT_MODIFIERS = [
  '',
  'best',
  'top rated',
  'specialist',
  'emergency',
  'private',
  'clinic',
  'services',
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
 * Get keyword list for a specific niche preset ID
 */
export function getNicheKeywords(presetIdOrKey: string): string[] {
  const preset = INDUSTRY_NICHE_PRESETS.find(
    (p) => p.id.toLowerCase() === presetIdOrKey.toLowerCase() || p.name.toLowerCase().includes(presetIdOrKey.toLowerCase())
  );
  return preset ? preset.keywords : [presetIdOrKey];
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

export interface ExpandedMatrixOptions {
  niches?: string[]; // Preset IDs or raw keywords
  provinces?: string[]; // Province codes (e.g. ['KZN', 'GP'] or ['ALL'])
  suburbs?: string[]; // Specific suburb names or IDs
  useModifiers?: boolean;
  maxQueries?: number;
}

/**
 * Advanced Query Matrix Generator for National Search Population
 */
export function buildExpandedQueryMatrix(options: ExpandedMatrixOptions = {}): string[] {
  let targetKeywords: string[] = [];

  if (options.niches && options.niches.length > 0) {
    for (const n of options.niches) {
      const kw = getNicheKeywords(n);
      targetKeywords.push(...kw);
    }
  } else {
    // Default to all high yield
    targetKeywords = getNicheKeywords('all_high_yield');
  }
  targetKeywords = Array.from(new Set(targetKeywords));

  let targetAreas: string[] = [];
  if (options.suburbs && options.suburbs.length > 0) {
    targetAreas = options.suburbs;
  } else if (options.provinces && options.provinces.length > 0) {
    for (const prov of options.provinces) {
      const subs = getSuburbsByProvince(prov);
      targetAreas.push(...subs.map((s) => s.name.replace(/\s*\(.*?\)/, '').trim()));
    }
  } else {
    // Default popular hubs
    targetAreas = ['Umhlanga', 'Sandton', 'Sea Point', 'Durban North', 'Rosebank', 'Ballito', 'Pretoria East', 'Century City'];
  }
  targetAreas = Array.from(new Set(targetAreas));

  const queries: string[] = [];
  for (const area of targetAreas) {
    for (const kw of targetKeywords) {
      queries.push(`${kw} ${area}`);
      if (options.useModifiers) {
        queries.push(`best ${kw} ${area}`);
      }
    }
  }

  const max = options.maxQueries || 150;
  return queries.slice(0, max);
}

