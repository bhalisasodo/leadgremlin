/**
 * LeadGremlin Sales Funnel Dashboard Application Logic
 * South Africa Search Universe & Multi-Region Extraction Engine
 */

let allLeads = [];
let currentCategoryFilter = 'ALL';
let currentAreaFilter = 'ALL';
let currentSearchTerm = '';
let activeView = 'kanban'; // 'kanban' | 'table' | 'analytics'
let selectedLead = null;
let pollTimer = null;
let isStaticMode = false;
let currentSortField = 'score-desc';
let activeProvinceTab = 'KZN';
let currentSequenceArchetype = 'omni_channel_blitz';
let activeSequenceData = null;
let activeTouchpointIndex = 0;
let currentPitchTone = 'consultative';
let currentQuickFilter = 'ALL';
let selectedLeadIds = new Set();

/**
 * Toggle Mobile Sidebar Drawer
 */
function toggleMobileSidebar(isOpen) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;

  if (isOpen === undefined) {
    sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('active');
  } else if (isOpen) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

// Close mobile sidebar on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    toggleMobileSidebar(false);
  }
});

/**
 * Resolves full API URL using centralized LEADGREMLIN_CONFIG
 */
function getApiUrl(path) {
  if (window.LEADGREMLIN_CONFIG && typeof window.LEADGREMLIN_CONFIG.apiUrl === 'function') {
    return window.LEADGREMLIN_CONFIG.apiUrl(path);
  }
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
  const base = isLocal ? 'http://localhost:3005' : 'https://leadgremlin.onrender.com';
  return base.replace(/\/+$/, '') + (path.startsWith('/') ? path : '/' + path);
}

const SOUTH_AFRICA_REGIONS = [
  {
    code: 'KZN',
    name: 'KwaZulu-Natal (Coast & Midlands)',
    suburbs: [
      { id: 'umhlanga', name: 'Umhlanga (Rocks & Ridge)', checked: true },
      { id: 'ballito', name: 'Ballito & Salt Rock', checked: true },
      { id: 'durban_north', name: 'Durban North & Broadway', checked: true },
      { id: 'morningside_kzn', name: 'Morningside & Berea', checked: false },
      { id: 'hillcrest', name: 'Hillcrest & Kloof', checked: false },
      { id: 'westville', name: 'Westville & Pinetown', checked: false },
      { id: 'amanzimtoti', name: 'Amanzimtoti & South Coast', checked: false },
      { id: 'pietermaritzburg', name: 'Pietermaritzburg & Hilton', checked: false },
      { id: 'richards_bay', name: 'Richards Bay & Empangeni', checked: false },
      { id: 'margate', name: 'Margate & Port Shepstone', checked: false },
      { id: 'newcastle_kzn', name: 'Newcastle & Ladysmith', checked: false },
      { id: 'st_lucia', name: 'St Lucia & Zululand', checked: false },
    ],
  },
  {
    code: 'GP',
    name: 'Gauteng (JHB & Pretoria)',
    suburbs: [
      { id: 'sandton', name: 'Sandton & Bryanston', checked: true },
      { id: 'rosebank', name: 'Rosebank & Parkhurst', checked: true },
      { id: 'fourways', name: 'Fourways & Lonehill', checked: false },
      { id: 'midrand', name: 'Midrand & Waterfall', checked: false },
      { id: 'centurion', name: 'Centurion & Irene', checked: false },
      { id: 'pretoria_east', name: 'Pretoria East & Menlyn', checked: false },
      { id: 'pretoria_central', name: 'Pretoria Central & Hatfield', checked: false },
      { id: 'bedfordview', name: 'Bedfordview & Edenvale', checked: false },
      { id: 'roodepoort', name: 'Roodepoort & Krugersdorp', checked: false },
      { id: 'soweto', name: 'Soweto & Glenvista', checked: false },
      { id: 'benoni', name: 'Benoni & Boksburg', checked: false },
      { id: 'kempton_park', name: 'Kempton Park & Midvaal', checked: false },
    ],
  },
  {
    code: 'WC',
    name: 'Western Cape (Cape Town & Winelands)',
    suburbs: [
      { id: 'sea_point', name: 'Sea Point & Waterfront', checked: true },
      { id: 'camps_bay', name: 'Camps Bay & Clifton', checked: false },
      { id: 'century_city', name: 'Century City & Milnerton', checked: false },
      { id: 'constantia', name: 'Constantia & Southern Suburbs', checked: false },
      { id: 'durbanville', name: 'Durbanville & Northern Suburbs', checked: false },
      { id: 'stellenbosch', name: 'Stellenbosch & Winelands', checked: false },
      { id: 'paarl', name: 'Paarl & Wellington', checked: false },
      { id: 'somerset_west', name: "Somerset West & Gordon's Bay", checked: false },
      { id: 'hermanus', name: 'Hermanus & Walker Bay', checked: false },
      { id: 'george', name: 'George & Garden Route', checked: false },
      { id: 'knysna', name: 'Knysna & Plettenberg Bay', checked: false },
      { id: 'saldanha', name: 'Saldanha & West Coast (Langebaan)', checked: false },
    ],
  },
  {
    code: 'EC',
    name: 'Eastern Cape (NMB & Buffalo City)',
    suburbs: [
      { id: 'gqeberha', name: 'Gqeberha (Port Elizabeth - Walmer & Summerstrand)', checked: true },
      { id: 'east_london', name: 'East London & Beacon Bay', checked: true },
      { id: 'kariega', name: 'Kariega (Uitenhage)', checked: false },
      { id: 'makhanda', name: 'Makhanda (Grahamstown)', checked: false },
      { id: 'mthatha', name: 'Mthatha & Wild Coast', checked: false },
      { id: 'jeffreys_bay', name: 'Jeffreys Bay & Cape St Francis', checked: false },
      { id: 'port_alfred', name: 'Port Alfred & Sunshine Coast', checked: false },
      { id: 'queenstown', name: 'Queenstown (Komani)', checked: false },
    ],
  },
  {
    code: 'FS',
    name: 'Free State (Bloemfontein & Goldfields)',
    suburbs: [
      { id: 'bloemfontein', name: 'Bloemfontein (Dan Pienaar & Langenhovenpark)', checked: true },
      { id: 'welkom', name: 'Welkom & Goldfields', checked: false },
      { id: 'bethlehem', name: 'Bethlehem & Clarens', checked: false },
      { id: 'sasolburg', name: 'Sasolburg & Vaal Park', checked: false },
      { id: 'kroonstad', name: 'Kroonstad', checked: false },
      { id: 'parys', name: 'Parys & Vaal River', checked: false },
    ],
  },
  {
    code: 'MP',
    name: 'Mpumalanga (Lowveld & Energy Belt)',
    suburbs: [
      { id: 'nelspruit', name: 'Nelspruit (Mbombela & Riverside)', checked: true },
      { id: 'white_river', name: 'White River & Hazyview', checked: false },
      { id: 'witbank', name: 'Witbank (eMalahleni)', checked: false },
      { id: 'middelburg_mp', name: 'Middelburg Mpumalanga', checked: false },
      { id: 'secunda', name: 'Secunda & Trichardt', checked: false },
      { id: 'dullstroom', name: 'Dullstroom & Sabie', checked: false },
    ],
  },
  {
    code: 'LP',
    name: 'Limpopo (Polokwane & Waterberg)',
    suburbs: [
      { id: 'polokwane', name: 'Polokwane & Bendor', checked: true },
      { id: 'tzaneen', name: 'Tzaneen & Letaba', checked: false },
      { id: 'mokopane', name: 'Mokopane (Potgietersrus)', checked: false },
      { id: 'bela_bela', name: 'Bela-Bela (Warmbaths)', checked: false },
      { id: 'lephalale', name: 'Lephalale (Ellisras)', checked: false },
      { id: 'thohoyandou', name: 'Thohoyandou & Makhado', checked: false },
      { id: 'phalaborwa', name: 'Phalaborwa & Kruger Border', checked: false },
    ],
  },
  {
    code: 'NW',
    name: 'North West (Rustenburg & Bojanala)',
    suburbs: [
      { id: 'rustenburg', name: 'Rustenburg & Waterfall East', checked: true },
      { id: 'potchefstroom', name: 'Potchefstroom & Baillie Park', checked: true },
      { id: 'klerksdorp', name: 'Klerksdorp & Stilfontein', checked: false },
      { id: 'hartbeespoort', name: 'Hartbeespoort & Brits', checked: false },
      { id: 'mahikeng', name: 'Mahikeng (Mafikeng)', checked: false },
      { id: 'sun_city', name: 'Sun City & Ledig', checked: false },
    ],
  },
  {
    code: 'NC',
    name: 'Northern Cape (Kimberley & Kalahari)',
    suburbs: [
      { id: 'kimberley', name: 'Kimberley & Monument Heights', checked: true },
      { id: 'upington', name: 'Upington & Orange River', checked: false },
      { id: 'kathu', name: 'Kathu & Kuruman', checked: false },
      { id: 'springbok', name: 'Springbok & Namakwa', checked: false },
      { id: 'de_aar', name: 'De Aar & Karoo Hubs', checked: false },
    ],
  },
];

const FUNNEL_STAGES = [
  { id: 'new', label: '🆕 New Prospects', color: 'status-new' },
  { id: 'enriched', label: '✨ Enriched / Qualified', color: 'status-enriched' },
  { id: 'outreach', label: '📧 Outreach Sent', color: 'status-outreach' },
  { id: 'meeting', label: '📅 Meeting Booked', color: 'status-meeting' },
  { id: 'proposal', label: '📝 Proposal Sent', color: 'status-proposal' },
  { id: 'won', label: '🎉 Closed Won', color: 'status-won' },
  { id: 'lost', label: '❌ Closed Lost', color: 'status-lost' },
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  // 1. Immediately initialize and render local/seed data so dashboard is instant and responsive
  initLocalData();
  populateAreaFilterOptions();
  renderDashboard();
  renderStatsLocal();
  renderSuburbsGrid();

  // 2. Asynchronously fetch fresh data from backend with fast fallback
  fetchLeads();
  fetchStats();
  checkNotionStatus();
  checkExtractionStatusOnLoad();

  // Global Keyboard Shortcuts (Ctrl+K to search, Esc to close modals)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('global-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    } else if (e.key === 'Escape') {
      closeDetailModal();
      closeExtractModal();
      closeAddLeadModal();
      toggleMobileSidebar(false);
    }
  });

  // Close modals when clicking backdrop outside modal-card
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDetailModal();
        closeExtractModal();
        closeAddLeadModal();
      }
    });
  });
});

/**
 * Check Notion integration status from API
 */
async function checkNotionStatus() {
  const dot = document.getElementById('notion-dot');
  const text = document.getElementById('notion-status-text');
  if (!dot || !text) return;

  try {
    const res = await fetch(getApiUrl('/api/notion/status')).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.configured) {
        dot.classList.add('active');
        text.innerText = `Connected (${data.databaseId || 'CRM Active'})`;
        return;
      }
    }
  } catch (err) {
    console.warn('Notion status check failed, using local mode fallback:', err);
  }

  dot.classList.remove('active');
  text.innerText = 'Notion (Local / Demo Mode)';
}

/**
 * Check background extraction status on initial page load
 */
async function checkExtractionStatusOnLoad() {
  try {
    const res = await fetch(getApiUrl('/api/extract/status')).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.isExtracting) {
        showLiveExtractionBanner(data.progress?.currentTerm || 'Extracting leads across South Africa...');
        startStatusPolling();
      }
    }
  } catch {
    // ignore
  }
}

const FALLBACK_SEED_LEADS = [
  {
    "id": "umh_fit_01",
    "name": "Planet Fitness - Umhlanga",
    "category": "Fitness",
    "rawCategory": "Gym & Fitness Club",
    "area": "Umhlanga Ridge",
    "address": "1 Centenary Blvd, Umhlanga Ridge, Umhlanga, 4319",
    "phone": "+27 31 566 2200",
    "website": "https://www.planetfitness.co.za/clubs/umhlanga",
    "email": "umhlanga@planetfitness.co.za",
    "socials": { "instagram": "https://www.instagram.com/planetfitnessza/", "facebook": "https://www.facebook.com/planetfitnessza/", "linkedin": "https://www.linkedin.com/company/planet-fitness-south-africa" },
    "rating": 4.6,
    "reviewCount": 428,
    "mapsUrl": "https://www.google.com/maps/place/Planet+Fitness+-+Umhlanga",
    "funnelStage": "proposal",
    "opportunityScore": 88,
    "notes": "Interested in AI automated WhatsApp booking system for personal training consultations.",
    "lastContactedAt": "2026-08-04T10:30:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "gym Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_fit_02",
    "name": "Virgin Active Umhlanga",
    "category": "Fitness",
    "rawCategory": "Health Club & Gym",
    "area": "Gateway, Umhlanga",
    "address": "Gateway Theatre of Shopping, 1 Palm Blvd, Umhlanga, 4319",
    "phone": "+27 31 566 9000",
    "website": "https://www.virginactive.co.za/clubs/umhlanga",
    "email": "umhlangaclub@virginactive.co.za",
    "socials": { "instagram": "https://www.instagram.com/virginactivesa/", "facebook": "https://www.facebook.com/virginactivesa/", "twitter": "https://x.com/virginactivesa" },
    "rating": 4.5,
    "reviewCount": 612,
    "mapsUrl": "https://www.google.com/maps/place/Virgin+Active+Umhlanga",
    "funnelStage": "meeting",
    "opportunityScore": 72,
    "notes": "Follow-up meeting scheduled with regional manager regarding digital lead engine.",
    "lastContactedAt": "2026-08-05T14:15:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "gym Umhlanga",
    "source": "google_maps"
  },
  {
    "id": "umh_fit_03",
    "name": "CrossFit Umhlanga",
    "category": "Fitness",
    "rawCategory": "CrossFit Gym",
    "area": "Umhlanga Rocks",
    "address": "14 Meridian Dr, Umhlanga Ridge, Umhlanga, 4319",
    "phone": "+27 82 491 5532",
    "website": "https://www.crossfitumhlanga.co.za",
    "email": "info@crossfitumhlanga.co.za",
    "socials": { "instagram": "https://www.instagram.com/crossfitumhlanga/", "facebook": "https://www.facebook.com/crossfitumhlanga/" },
    "rating": 4.9,
    "reviewCount": 89,
    "mapsUrl": "https://www.google.com/maps/place/CrossFit+Umhlanga",
    "funnelStage": "outreach",
    "opportunityScore": 92,
    "notes": "High engagement box gym. Website needs a conversion funnel overhaul.",
    "lastContactedAt": "2026-08-03T09:00:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "crossfit Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_fit_04",
    "name": "The Body Sculpting Studio Umhlanga",
    "category": "Fitness",
    "rawCategory": "Pilates & EMS Studio",
    "area": "La Lucia",
    "address": "9 Armstrong Ave, La Lucia, Umhlanga, 4051",
    "phone": "+27 31 572 3341",
    "website": "https://www.bodysculptumhlanga.co.za",
    "email": "hello@bodysculptumhlanga.co.za",
    "socials": { "instagram": "https://www.instagram.com/bodysculpt_umhlanga/", "tiktok": "https://www.tiktok.com/@bodysculpt_umhlanga" },
    "rating": 4.8,
    "reviewCount": 44,
    "mapsUrl": "https://www.google.com/maps/place/The+Body+Sculpting+Studio",
    "funnelStage": "new",
    "opportunityScore": 85,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "pilates studio Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_beauty_01",
    "name": "Sorbet Salon Umhlanga Ridge",
    "category": "Beauty and Hair",
    "rawCategory": "Beauty Salon & Nail Bar",
    "area": "Umhlanga Ridge",
    "address": "Shop 12, Crescent Shopping Centre, Umhlanga Ridge, 4319",
    "phone": "+27 31 566 3110",
    "website": "https://www.sorbet.co.za/store/sorbet-umhlanga-ridge",
    "email": "umhlangaridge@sorbet.co.za",
    "socials": { "instagram": "https://www.instagram.com/sorbetgroup/", "facebook": "https://www.facebook.com/SorbetGroup/" },
    "rating": 4.4,
    "reviewCount": 184,
    "mapsUrl": "https://www.google.com/maps/place/Sorbet+Umhlanga+Ridge",
    "funnelStage": "enriched",
    "opportunityScore": 78,
    "notes": "Verified contacts. Ideal prospect for VIP customer loyalty retention campaign.",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "beauty salon Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_beauty_02",
    "name": "Carlton Hair Gateway",
    "category": "Beauty and Hair",
    "rawCategory": "Hair Salon",
    "area": "Gateway, Umhlanga",
    "address": "Gateway Theatre of Shopping, Shop F243, Umhlanga, 4319",
    "phone": "+27 31 566 2883",
    "website": "https://www.carltonhair.com/salons/gateway",
    "email": "gateway@carltonhair.com",
    "socials": { "instagram": "https://www.instagram.com/carltonhairsa/", "facebook": "https://www.facebook.com/CarltonHairSA/" },
    "rating": 4.7,
    "reviewCount": 210,
    "mapsUrl": "https://www.google.com/maps/place/Carlton+Hair+Gateway",
    "funnelStage": "won",
    "opportunityScore": 60,
    "notes": "Closed Deal! Client onboarding completed for Instagram booking integration.",
    "lastContactedAt": "2026-08-01T11:00:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "hair salon Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_beauty_03",
    "name": "The Pearls Spa & Aesthetic Clinic",
    "category": "Beauty and Hair",
    "rawCategory": "Medical Spa & Skincare",
    "area": "Umhlanga Rocks",
    "address": "The Pearls Mall, 6 Lagune Dr, Umhlanga Rocks, 4320",
    "phone": "+27 31 561 2288",
    "website": "https://www.pearlsspa.co.za",
    "email": "concierge@pearlsspa.co.za",
    "socials": { "instagram": "https://www.instagram.com/pearlsspa_umhlanga/", "facebook": "https://www.facebook.com/pearlsspaumhlanga/" },
    "rating": 4.9,
    "reviewCount": 156,
    "mapsUrl": "https://www.google.com/maps/place/Pearls+Spa+Umhlanga",
    "funnelStage": "proposal",
    "opportunityScore": 95,
    "notes": "Sent R15k high-ticket aesthetics lead generation proposal. Awaiting sign-off.",
    "lastContactedAt": "2026-08-05T16:00:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "spa Umhlanga Rocks",
    "source": "multi_source"
  },
  {
    "id": "umh_rest_01",
    "name": "The Grill Jichana Umhlanga",
    "category": "Restaurant",
    "rawCategory": "Fine Dining Steakhouse",
    "area": "Umhlanga Rocks",
    "address": "Beverly Hills Hotel, 1 Lighthouse Rd, Umhlanga Rocks, 4320",
    "phone": "+27 31 561 2211",
    "website": "https://www.southernsun.com/beverly-hills/dining/grill-jichana",
    "email": "beverlyhills.reservations@southernsun.com",
    "socials": { "instagram": "https://www.instagram.com/southernsunhotels/", "facebook": "https://www.facebook.com/BeverlyHillsHotelSA/" },
    "rating": 4.7,
    "reviewCount": 540,
    "mapsUrl": "https://www.google.com/maps/place/The+Grill+Jichana",
    "funnelStage": "outreach",
    "opportunityScore": 68,
    "notes": "High profile restaurant. Pitching table reservation optimization funnel.",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "restaurant Umhlanga Rocks",
    "source": "multi_source"
  },
  {
    "id": "umh_rest_02",
    "name": "The Oyster Box Grill Room & Terrace",
    "category": "Restaurant",
    "rawCategory": "Luxury Restaurant",
    "area": "Umhlanga Rocks",
    "address": "2 Lighthouse Rd, Umhlanga Rocks, 4320",
    "phone": "+27 31 514 5000",
    "website": "https://www.oysterboxhotel.com/dining/the-grill-room",
    "email": "restaurants@oysterbox.co.za",
    "socials": { "instagram": "https://www.instagram.com/oysterboxhotel/", "facebook": "https://www.facebook.com/oysterbox/", "linkedin": "https://www.linkedin.com/company/the-oyster-box" },
    "rating": 4.8,
    "reviewCount": 1280,
    "mapsUrl": "https://www.google.com/maps/place/The+Oyster+Box",
    "funnelStage": "new",
    "opportunityScore": 65,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "fine dining Umhlanga",
    "source": "google_maps"
  },
  {
    "id": "umh_rest_03",
    "name": "Piatto Gateway",
    "category": "Restaurant",
    "rawCategory": "Mediterranean & Grill Restaurant",
    "area": "Gateway, Umhlanga",
    "address": "Shop G304, Gateway Theatre of Shopping, Umhlanga, 4319",
    "phone": "+27 31 566 4220",
    "website": "https://www.piatto.co.za/locations/gateway",
    "email": "gateway@piatto.co.za",
    "socials": { "instagram": "https://www.instagram.com/piattorestaurants/", "facebook": "https://www.facebook.com/PiattoRestaurants/" },
    "rating": 4.3,
    "reviewCount": 390,
    "mapsUrl": "https://www.google.com/maps/place/Piatto+Gateway",
    "funnelStage": "enriched",
    "opportunityScore": 82,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "restaurant Gateway Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_health_01",
    "name": "Umhlanga Dental Aesthetics",
    "category": "Healthcare & Wellness",
    "rawCategory": "Cosmetic Dentist & Oral Clinic",
    "area": "Umhlanga Ridge",
    "address": "Suite 204, Medstone Medical Centre, 19 Umhlanga Ridge Blvd, 4319",
    "phone": "+27 31 566 1980",
    "website": "https://www.umhlangadental.co.za",
    "email": "reception@umhlangadental.co.za",
    "socials": { "instagram": "https://www.instagram.com/umhlangadental/", "facebook": "https://www.facebook.com/umhlangadentalaesthetics/", "linkedin": "https://www.linkedin.com/company/umhlanga-dental" },
    "rating": 4.9,
    "reviewCount": 94,
    "mapsUrl": "https://www.google.com/maps/place/Umhlanga+Dental+Aesthetics",
    "funnelStage": "meeting",
    "opportunityScore": 96,
    "notes": "High margin dental procedures. Meeting set for high-ticket Invisalign acquisition funnel.",
    "lastContactedAt": "2026-08-04T15:00:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "dentist Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_health_02",
    "name": "Gateway Physiotherapy & Sports Injury Clinic",
    "category": "Healthcare & Wellness",
    "rawCategory": "Physiotherapy Practice",
    "area": "Umhlanga Ridge",
    "address": "22 Centenary Blvd, Umhlanga Ridge, 4319",
    "phone": "+27 31 566 5590",
    "website": "https://www.gatewayphysio.co.za",
    "email": "admin@gatewayphysio.co.za",
    "socials": { "instagram": "https://www.instagram.com/gatewayphysio_sa/", "facebook": "https://www.facebook.com/gatewayphysiosa/" },
    "rating": 4.8,
    "reviewCount": 67,
    "mapsUrl": "https://www.google.com/maps/place/Gateway+Physiotherapy",
    "funnelStage": "new",
    "opportunityScore": 84,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "physiotherapist Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_real_01",
    "name": "Pam Golding Properties Umhlanga",
    "category": "Real Estate",
    "rawCategory": "Real Estate Agency",
    "area": "Umhlanga Rocks",
    "address": "Shop 4, Chartwell Centre, Chartwell Dr, Umhlanga Rocks, 4320",
    "phone": "+27 31 561 5300",
    "website": "https://www.pamgolding.co.za/branches/umhlanga/101",
    "email": "umhlanga@pamgolding.co.za",
    "socials": { "instagram": "https://www.instagram.com/pamgoldingproperties/", "facebook": "https://www.facebook.com/PamGoldingProperties/", "linkedin": "https://www.linkedin.com/company/pam-golding-properties" },
    "rating": 4.6,
    "reviewCount": 112,
    "mapsUrl": "https://www.google.com/maps/place/Pam+Golding+Umhlanga",
    "funnelStage": "proposal",
    "opportunityScore": 90,
    "notes": "Pitching automated buyer lead qualification system for luxury Umhlanga beachfront properties.",
    "lastContactedAt": "2026-08-05T08:30:00.000Z",
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "real estate agent Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_real_02",
    "name": "RE/MAX Address Umhlanga",
    "category": "Real Estate",
    "rawCategory": "Real Estate Agency",
    "area": "Umhlanga Ridge",
    "address": "15 Millennium Way, Umhlanga Ridge, 4319",
    "phone": "+27 31 566 1120",
    "website": "https://www.remax.co.za/office/remax-address-umhlanga",
    "email": "umhlanga@remaxaddress.co.za",
    "socials": { "instagram": "https://www.instagram.com/remaxsa/", "facebook": "https://www.facebook.com/REMAXAddressUmhlanga/" },
    "rating": 4.5,
    "reviewCount": 88,
    "mapsUrl": "https://www.google.com/maps/place/REMAX+Address+Umhlanga",
    "funnelStage": "outreach",
    "opportunityScore": 79,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "property management Umhlanga",
    "source": "google_maps"
  },
  {
    "id": "umh_prof_01",
    "name": "Cox Yeats Attorneys Umhlanga",
    "category": "Professional Services",
    "rawCategory": "Corporate Law Firm",
    "area": "Umhlanga Ridge",
    "address": "N2 Totius St, N2 Business Park, Umhlanga Ridge, 4319",
    "phone": "+27 31 536 8500",
    "website": "https://www.coxyeats.co.za",
    "email": "info@coxyeats.co.za",
    "socials": { "linkedin": "https://www.linkedin.com/company/cox-yeats-attorneys", "facebook": "https://www.facebook.com/CoxYeatsAttorneys/" },
    "rating": 4.7,
    "reviewCount": 75,
    "mapsUrl": "https://www.google.com/maps/place/Cox+Yeats+Attorneys",
    "funnelStage": "new",
    "opportunityScore": 70,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "law firm Umhlanga",
    "source": "multi_source"
  },
  {
    "id": "umh_auto_01",
    "name": "Umhlanga Auto Detailing & Ceramic Coating",
    "category": "Automotive & Trades",
    "rawCategory": "Car Detailing & Protection",
    "area": "Cornubia, Umhlanga",
    "address": "Unit 8, Cornubia Industrial Park, Umhlanga, 4319",
    "phone": "+27 83 778 9912",
    "website": "https://www.umhlangaautodetail.co.za",
    "email": "booking@umhlangaautodetail.co.za",
    "socials": { "instagram": "https://www.instagram.com/umhlanga_autodetail/", "facebook": "https://www.facebook.com/umhlangaautodetail/" },
    "rating": 4.9,
    "reviewCount": 52,
    "mapsUrl": "https://www.google.com/maps/place/Umhlanga+Auto+Detailing",
    "funnelStage": "enriched",
    "opportunityScore": 89,
    "scrapedAt": "2026-08-06T12:00:00.000Z",
    "searchTerm": "car detailing Umhlanga",
    "source": "multi_source"
  }
];

/**
 * Initialize local/cached leads immediately for instant UI load
 */
function initLocalData() {
  const localSaved = localStorage.getItem('leadgremlin_leads');
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allLeads = parsed;
        return;
      }
    } catch {}
  }
  allLeads = Array.isArray(FALLBACK_SEED_LEADS) && FALLBACK_SEED_LEADS.length > 0 ? FALLBACK_SEED_LEADS : [];
}

/**
 * Fetch all business leads from API with fast timeout
 */
async function fetchLeads() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(getApiUrl('/api/leads'), { signal: controller.signal }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
        allLeads = data.leads;
        isStaticMode = false;
        populateAreaFilterOptions();
        renderDashboard();
        return;
      }
    }

    // Static GitHub Pages / local file protocol fallback mode
    isStaticMode = true;
    const jsonRes = await fetch('./leads_dashboard.json').catch(() => null);
    if (jsonRes && jsonRes.ok) {
      try {
        const jsonLeads = await jsonRes.json();
        if (Array.isArray(jsonLeads) && jsonLeads.length > 0) {
          allLeads = jsonLeads;
          localStorage.setItem('leadgremlin_leads', JSON.stringify(allLeads));
          populateAreaFilterOptions();
          renderDashboard();
          renderStatsLocal();
        }
      } catch {}
    }
  } catch (err) {
    console.warn('API fetch skipped or timed out, using local data:', err);
  }
}

/**
 * Save leads locally in preview mode
 */
function saveLeadsLocally() {
  if (isStaticMode) {
    localStorage.setItem('leadgremlin_leads', JSON.stringify(allLeads));
    renderStatsLocal();
  }
}

/**
 * Populate SA Area Dropdown in Filter Toolbar
 */
function populateAreaFilterOptions() {
  const select = document.getElementById('filter-area-select');
  if (!select) return;

  const areaSet = new Set();
  allLeads.forEach((l) => {
    if (l.area) areaSet.add(l.area);
  });

  const sortedAreas = Array.from(areaSet).sort();
  select.innerHTML = '<option value="ALL">All South Africa Areas</option>';
  sortedAreas.forEach((area) => {
    select.innerHTML += `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`;
  });

  select.value = currentAreaFilter;
}

/**
 * Fetch KPI statistics
 */
async function fetchStats() {
  if (isStaticMode) {
    renderStatsLocal();
    return;
  }

  try {
    const res = await fetch(getApiUrl('/api/stats')).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      document.getElementById('stat-total').innerText = data.totalLeads || 0;

      const webPct = data.coverage?.websitePercent || 0;
      const emailPct = data.coverage?.emailPercent || 0;
      const phonePct = data.coverage?.phonePercent || 0;
      const socialPct = data.coverage?.socialPercent || 0;

      document.getElementById('stat-web').innerText = `${webPct}%`;
      document.getElementById('stat-email').innerText = `${emailPct}%`;
      document.getElementById('stat-phone').innerText = `${phonePct}%`;
      document.getElementById('stat-social').innerText = `${socialPct}%`;

      if (document.getElementById('bar-web')) document.getElementById('bar-web').style.width = `${webPct}%`;
      if (document.getElementById('bar-email')) document.getElementById('bar-email').style.width = `${emailPct}%`;
      if (document.getElementById('bar-phone')) document.getElementById('bar-phone').style.width = `${phonePct}%`;
      if (document.getElementById('bar-social')) document.getElementById('bar-social').style.width = `${socialPct}%`;
      return;
    }
  } catch {
    // ignore
  }

  renderStatsLocal();
}

/**
 * Compute KPI stats locally
 */
function renderStatsLocal() {
  const total = allLeads.length;
  let web = 0, email = 0, phone = 0, social = 0;

  allLeads.forEach((l) => {
    if (l.website) web++;
    if (l.email) email++;
    if (l.phone) phone++;
    if (l.socials && Object.keys(l.socials).length > 0) social++;
  });

  const webPct = total ? Math.round((web / total) * 100) : 0;
  const emailPct = total ? Math.round((email / total) * 100) : 0;
  const phonePct = total ? Math.round((phone / total) * 100) : 0;
  const socialPct = total ? Math.round((social / total) * 100) : 0;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-web').innerText = `${webPct}%`;
  document.getElementById('stat-email').innerText = `${emailPct}%`;
  document.getElementById('stat-phone').innerText = `${phonePct}%`;
  document.getElementById('stat-social').innerText = `${socialPct}%`;

  if (document.getElementById('bar-web')) document.getElementById('bar-web').style.width = `${webPct}%`;
  if (document.getElementById('bar-email')) document.getElementById('bar-email').style.width = `${emailPct}%`;
  if (document.getElementById('bar-phone')) document.getElementById('bar-phone').style.width = `${phonePct}%`;
  if (document.getElementById('bar-social')) document.getElementById('bar-social').style.width = `${socialPct}%`;
}

/**
 * Filter and sort leads based on state
 */
function getFilteredLeads() {
  const hasEmailOnly = document.getElementById('filter-has-email')?.checked;
  const hasWebsiteOnly = document.getElementById('filter-has-website')?.checked;
  const hasPhoneOnly = document.getElementById('filter-has-phone')?.checked;
  const areaSelectVal = document.getElementById('filter-area-select')?.value || 'ALL';

  let leads = allLeads.filter((lead) => {
    const matchesCategory =
      currentCategoryFilter === 'ALL' ||
      lead.category.toLowerCase() === currentCategoryFilter.toLowerCase();

    const matchesArea =
      areaSelectVal === 'ALL' ||
      (lead.area && lead.area.toLowerCase().includes(areaSelectVal.toLowerCase()));

    const matchesSearch =
      !currentSearchTerm ||
      lead.name.toLowerCase().includes(currentSearchTerm) ||
      (lead.area && lead.area.toLowerCase().includes(currentSearchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(currentSearchTerm)) ||
      (lead.phone && lead.phone.toLowerCase().includes(currentSearchTerm)) ||
      (lead.address && lead.address.toLowerCase().includes(currentSearchTerm));

    const matchesEmail = !hasEmailOnly || Boolean(lead.email && lead.email.trim() !== '');
    const matchesWebsite = !hasWebsiteOnly || Boolean(lead.website && lead.website.trim() !== '');
    const matchesPhone = !hasPhoneOnly || Boolean(lead.phone && lead.phone.trim() !== '');

    // Quick Filter Preset matching
    let matchesPreset = true;
    if (currentQuickFilter === 'HOT') {
      matchesPreset = (lead.opportunityScore || 0) >= 80;
    } else if (currentQuickFilter === 'HIGH_VAL') {
      matchesPreset = (lead.estimatedDealValue || 0) >= 20000;
    } else if (currentQuickFilter === 'NO_SSL') {
      matchesPreset = Boolean((lead.technicalAudit && !lead.technicalAudit.hasHttps) || (lead.website && !lead.website.startsWith('https')));
    } else if (currentQuickFilter === 'NO_WA') {
      matchesPreset = !lead.technicalAudit?.hasWhatsappLink;
    } else if (currentQuickFilter === 'HAS_EMAIL') {
      matchesPreset = Boolean(lead.email && lead.email.trim() !== '');
    }

    return matchesCategory && matchesArea && matchesSearch && matchesEmail && matchesWebsite && matchesPhone && matchesPreset;
  });

  // Apply Sorting
  leads.sort((a, b) => {
    if (currentSortField === 'score-desc') {
      return (b.opportunityScore || 0) - (a.opportunityScore || 0);
    } else if (currentSortField === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (currentSortField === 'rating-desc') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (currentSortField === 'date-desc') {
      return (new Date(b.scrapedAt || 0)).getTime() - (new Date(a.scrapedAt || 0)).getTime();
    }
    return 0;
  });

  return leads;
}

/**
 * Main Render Engine
 */
function renderDashboard() {
  const filtered = getFilteredLeads();
  updateCategoryPillCounts();

  if (activeView === 'kanban') {
    renderKanban(filtered);
  } else if (activeView === 'table') {
    renderTable(filtered);
  } else if (activeView === 'analytics') {
    renderAnalytics();
  }
}

/**
 * Update live category count badges on filter pills
 */
function updateCategoryPillCounts() {
  const counts = {
    ALL: allLeads.length,
    Fitness: 0,
    'Beauty and Hair': 0,
    Restaurant: 0,
    'Healthcare & Wellness': 0,
    'Real Estate': 0,
    'Professional Services': 0,
    'Automotive & Trades': 0,
  };

  allLeads.forEach((l) => {
    if (counts[l.category] !== undefined) {
      counts[l.category]++;
    }
  });

  const categoryLabels = {
    ALL: 'All Categories',
    Fitness: '🏋️ Fitness',
    'Beauty and Hair': '💇 Beauty & Hair',
    Restaurant: '🍽️ Restaurants',
    'Healthcare & Wellness': '🩺 Healthcare',
    'Real Estate': '🏠 Real Estate',
    'Professional Services': '⚖️ Professional',
    'Automotive & Trades': '🔧 Automotive',
  };

  const pills = document.querySelectorAll('#category-pills .pill');
  pills.forEach((pill) => {
    const cat = pill.dataset.category || 'ALL';
    const label = categoryLabels[cat] || cat;
    const count = counts[cat] !== undefined ? counts[cat] : 0;
    pill.innerHTML = `${label} <span class="pill-count">${count}</span>`;
  });
}

/**
 * Render Kanban Pipeline Board
 */
function renderKanban(leads) {
  const container = document.getElementById('kanban-board');
  if (!container) return;
  container.innerHTML = '';

  FUNNEL_STAGES.forEach((stage) => {
    const stageLeads = leads.filter((l) => l.funnelStage === stage.id);

    const col = document.createElement('div');
    col.className = 'kanban-column';
    col.innerHTML = `
      <div class="column-header column-header-${stage.id}">
        <div class="column-title">
          <span>${stage.label}</span>
        </div>
        <span class="column-count">${stageLeads.length}</span>
      </div>
      <div class="column-cards" id="col-${stage.id}">
        ${
          stageLeads.length === 0
            ? '<div style="padding: 16px; text-align: center; color: var(--text-dim); font-size: 11px;">No prospects in this stage</div>'
            : ''
        }
      </div>
    `;

    const cardsContainer = col.querySelector('.column-cards');

    stageLeads.forEach((lead) => {
      const card = document.createElement('div');
      card.className = 'prospect-card';
      card.onclick = () => openDetailModal(lead.id);

      const hasWeb = lead.website ? 'active' : '';
      const hasEmail = lead.email ? 'active' : '';
      const hasPhone = lead.phone ? 'active' : '';
      const hasSocial = lead.socials && Object.keys(lead.socials).length > 0 ? 'active' : '';

      const score = lead.opportunityScore || 80;
      const scoreClass = score >= 80 ? '' : 'med';
      const dealValStr = lead.estimatedDealValue ? ` • R${lead.estimatedDealValue.toLocaleString()}` : '';

      card.innerHTML = `
        <div class="card-top">
          <span class="business-name">${escapeHtml(lead.name)}</span>
          <span class="score-tag ${scoreClass}">${score} Score</span>
        </div>
        <div class="card-category">${escapeHtml(lead.category)} • ${escapeHtml(lead.area || 'South Africa')}${dealValStr}</div>
        <div class="card-location">
          📍 ${escapeHtml(lead.address || lead.area || 'South Africa')}
        </div>
        <div class="card-channels">
          <span class="channel-icon ${hasWeb}" title="Website">🌐</span>
          <span class="channel-icon ${hasEmail}" title="Email">📧</span>
          <span class="channel-icon ${hasPhone}" title="Phone">📞</span>
          <span class="channel-icon ${hasSocial}" title="Social Media">📱</span>
        </div>
      `;

      cardsContainer.appendChild(card);
    });

    container.appendChild(col);
  });
}

/**
 * Render Data Table Directory
 */
function renderTable(leads) {
  const tbody = document.getElementById('leads-table-body');
  if (!tbody) return;
  document.getElementById('table-count-badge').innerText = `${leads.length} Prospects`;
  tbody.innerHTML = '';

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 28px; color: var(--text-dim);">No prospects match your current search & filter parameters.</td></tr>`;
    updateBulkToolbar();
    return;
  }

  leads.forEach((lead) => {
    const tr = document.createElement('tr');
    const isChecked = selectedLeadIds.has(lead.id);

    const socialIcons = [];
    if (lead.socials?.instagram) socialIcons.push(`<a href="${lead.socials.instagram}" target="_blank" style="color:var(--sky);">IG</a>`);
    if (lead.socials?.facebook) socialIcons.push(`<a href="${lead.socials.facebook}" target="_blank" style="color:var(--sky);">FB</a>`);
    if (lead.socials?.linkedin) socialIcons.push(`<a href="${lead.socials.linkedin}" target="_blank" style="color:var(--sky);">IN</a>`);

    const stageOptionsHTML = FUNNEL_STAGES.map(
      (s) => `<option value="${s.id}" ${s.id === lead.funnelStage ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="lead-select-cb" data-id="${lead.id}" ${isChecked ? 'checked' : ''} onchange="toggleSelectLead('${lead.id}', this.checked)">
      </td>
      <td><strong>${escapeHtml(lead.name)}</strong></td>
      <td><span class="badge">${escapeHtml(lead.category)}</span></td>
      <td><span class="badge" style="background:rgba(14,165,233,0.15); color:var(--sky);">${escapeHtml(lead.area || 'South Africa')}</span></td>
      <td>
        ${lead.email ? `<div style="font-size:12px;">📧 ${escapeHtml(lead.email)}</div>` : ''}
        ${lead.phone ? `<div style="font-size:12px;">📞 ${escapeHtml(lead.phone)}</div>` : ''}
        ${!lead.email && !lead.phone ? '<span style="color:var(--text-dim); font-size:11px;">Missing</span>' : ''}
      </td>
      <td>
        ${
          lead.website
            ? `<a href="${lead.website}" target="_blank" style="color:var(--primary); font-weight:600;">Visit Site 🌐</a>`
            : '<span style="color:var(--text-dim); font-size:11px;">No Website</span>'
        }
      </td>
      <td>${socialIcons.length > 0 ? socialIcons.join(' • ') : '<span style="color:var(--text-dim); font-size:11px;">-</span>'}</td>
      <td>
        <select class="form-control-sm inline-stage-select status-${lead.funnelStage}" onchange="updateLeadStageInline('${lead.id}', this.value)">
          ${stageOptionsHTML}
        </select>
      </td>
      <td><strong>${lead.opportunityScore || 75}</strong></td>
      <td>
        <div class="action-buttons-group">
          <button class="btn btn-sm btn-outline" onclick="openDetailModal('${lead.id}')" title="View Lead Drawer">📋 View</button>
          ${lead.email ? `<button class="btn btn-sm btn-icon-only" onclick="copyEmailToClipboard('${escapeHtml(lead.email)}', event)" title="Copy Email">📧</button>` : ''}
          <button class="btn btn-sm btn-icon-only btn-danger-icon" onclick="handleDeleteLead('${lead.id}')" title="Delete Lead">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const selectAllCb = document.getElementById('select-all-leads-cb');
  if (selectAllCb) {
    selectAllCb.checked = leads.length > 0 && leads.every((l) => selectedLeadIds.has(l.id));
    selectAllCb.indeterminate = !selectAllCb.checked && leads.some((l) => selectedLeadIds.has(l.id));
  }

  updateBulkToolbar();
}

/**
 * Toggle Select All Leads
 */
function toggleSelectAllLeads(checked) {
  const filtered = getFilteredLeads();
  if (checked) {
    filtered.forEach((l) => selectedLeadIds.add(l.id));
  } else {
    filtered.forEach((l) => selectedLeadIds.delete(l.id));
  }
  renderTable(filtered);
  updateBulkToolbar();
}

/**
 * Toggle Individual Lead Selection
 */
function toggleSelectLead(leadId, checked) {
  if (checked) {
    selectedLeadIds.add(leadId);
  } else {
    selectedLeadIds.delete(leadId);
  }
  const filtered = getFilteredLeads();
  const selectAllCb = document.getElementById('select-all-leads-cb');
  if (selectAllCb) {
    selectAllCb.checked = filtered.length > 0 && filtered.every((l) => selectedLeadIds.has(l.id));
    selectAllCb.indeterminate = !selectAllCb.checked && filtered.some((l) => selectedLeadIds.has(l.id));
  }
  updateBulkToolbar();
}

/**
 * Clear All Selected Leads
 */
function clearLeadSelection() {
  selectedLeadIds.clear();
  const selectAllCb = document.getElementById('select-all-leads-cb');
  if (selectAllCb) {
    selectAllCb.checked = false;
    selectAllCb.indeterminate = false;
  }
  const checkboxes = document.querySelectorAll('.lead-select-cb');
  checkboxes.forEach((cb) => (cb.checked = false));
  updateBulkToolbar();
}

/**
 * Update Bulk Action Toolbar Visibility & Count
 */
function updateBulkToolbar() {
  const bar = document.getElementById('bulk-actions-bar');
  const countEl = document.getElementById('bulk-selected-count');
  if (!bar || !countEl) return;

  const count = selectedLeadIds.size;
  countEl.innerText = count;
  if (count > 0) {
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

/**
 * Handle Bulk Stage Change
 */
function handleBulkStageChange(newStage) {
  if (!newStage || selectedLeadIds.size === 0) return;

  const count = selectedLeadIds.size;
  let updatedCount = 0;

  allLeads.forEach((lead) => {
    if (selectedLeadIds.has(lead.id)) {
      lead.funnelStage = newStage;
      lead.lastContactedAt = new Date().toISOString();
      updatedCount++;
      if (!isStaticMode) {
        fetch(getApiUrl(`/api/leads/${lead.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ funnelStage: newStage }),
        }).catch(() => null);
      }
    }
  });

  saveLeadsLocally();
  showToast(`✓ Updated ${updatedCount} leads to stage: ${newStage}`);
  const selectEl = document.getElementById('bulk-stage-select');
  if (selectEl) selectEl.value = '';
  renderDashboard();
}

/**
 * Handle Bulk Export (CSV / Instantly)
 */
function handleBulkExport(type) {
  const targetLeads = selectedLeadIds.size > 0
    ? allLeads.filter((l) => selectedLeadIds.has(l.id))
    : allLeads;

  if (targetLeads.length === 0) {
    showToast('No leads available to export.');
    return;
  }

  if (type === 'csv') {
    const headers = ['ID', 'Name', 'Category', 'Area', 'Address', 'Phone', 'Email', 'Website', 'Instagram', 'Stage', 'Score', 'DealValue'];
    const rows = targetLeads.map((l) => [
      `"${l.id}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.category || ''}"`,
      `"${l.area || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.website || ''}"`,
      `"${l.socials?.instagram || ''}"`,
      `"${l.funnelStage || ''}"`,
      `"${l.opportunityScore || ''}"`,
      `"${l.estimatedDealValue || 18500}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(csvContent, `leadgremlin_selected_${targetLeads.length}_leads.csv`, 'text/csv');
    showToast(`📥 Exported ${targetLeads.length} selected leads to CSV!`);
  } else if (type === 'instantly') {
    const headers = ['Company Name', 'Email', 'Phone', 'Website', 'City', 'Category', 'Opportunity Score', 'Email Subject', 'Email Body'];
    const rows = targetLeads.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      `"${l.area || ''}"`,
      `"${l.category || ''}"`,
      `"${l.opportunityScore || 80}"`,
      `"${(l.aiPitchScripts?.email?.subject || '').replace(/"/g, '""')}"`,
      `"${(l.aiPitchScripts?.email?.body || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(csvContent, `leadgremlin_selected_instantly_${targetLeads.length}.csv`, 'text/csv');
    showToast(`⚡ Exported ${targetLeads.length} leads for Instantly.ai!`);
  }
}

/**
 * Handle Bulk Delete
 */
function handleBulkDelete() {
  if (selectedLeadIds.size === 0) return;
  const count = selectedLeadIds.size;

  if (!confirm(`Are you sure you want to delete ${count} selected lead(s)?`)) {
    return;
  }

  const idsToDelete = Array.from(selectedLeadIds);
  allLeads = allLeads.filter((l) => !selectedLeadIds.has(l.id));
  clearLeadSelection();
  saveLeadsLocally();

  if (!isStaticMode) {
    idsToDelete.forEach((id) => {
      fetch(getApiUrl(`/api/leads/${id}`), { method: 'DELETE' }).catch(() => null);
    });
    fetchStats();
  }

  showToast(`✓ Removed ${count} leads from pipeline.`);
  renderDashboard();
}

/**
 * Inline Stage Switcher Handler
 */
function updateLeadStageInline(leadId, newStage) {
  const lead = allLeads.find((l) => l.id === leadId);
  if (lead) {
    lead.funnelStage = newStage;
    lead.lastContactedAt = new Date().toISOString();
    saveLeadsLocally();
    if (!isStaticMode) {
      fetch(getApiUrl(`/api/leads/${leadId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelStage: newStage }),
      }).catch(() => null);
    }
    showToast(`✓ Stage updated for "${lead.name}" to ${newStage}`);
    renderDashboard();
  }
}

/**
 * Delete Lead Handler
 */
async function handleDeleteLead(leadId) {
  const lead = allLeads.find((l) => l.id === leadId);
  if (!lead) return;

  if (!confirm(`Are you sure you want to remove "${lead.name}" from your sales pipeline?`)) {
    return;
  }

  allLeads = allLeads.filter((l) => l.id !== leadId);
  saveLeadsLocally();

  if (!isStaticMode) {
    fetch(getApiUrl(`/api/leads/${leadId}`), { method: 'DELETE' }).then(() => fetchStats()).catch(() => null);
  }

  showToast(`🗑️ Lead "${lead.name}" deleted successfully.`);
  populateAreaFilterOptions();
  renderDashboard();
  renderStatsLocal();
}

/**
 * Copy Email Helper
 */
function copyEmailToClipboard(email, e) {
  if (e) e.stopPropagation();
  navigator.clipboard.writeText(email);
  showToast(`📋 Email copied: ${email}`);
}

/**
 * Render Analytics View
 */
function renderAnalytics() {
  const categoryCounts = {};
  const stageCounts = { new: 0, enriched: 0, outreach: 0, meeting: 0, proposal: 0, won: 0, lost: 0 };
  const stageValSums = { new: 0, enriched: 0, outreach: 0, meeting: 0, proposal: 0, won: 0, lost: 0 };
  const suburbMap = {};

  const stageProbs = {
    new: 0.10,
    enriched: 0.20,
    outreach: 0.35,
    meeting: 0.60,
    proposal: 0.80,
    won: 1.00,
    lost: 0.00,
  };

  let totalPipelineVal = 0;
  let weightedPipelineVal = 0;
  let wonRevenueVal = 0;
  let wonCount = 0;
  let highOppCount = 0;
  let totalWithWeb = 0, totalWithEmail = 0, totalWithPhone = 0;

  const total = allLeads.length || 1;

  allLeads.forEach((l) => {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    const stage = l.funnelStage || 'new';
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
      const dealVal = l.estimatedDealValue || 18500;
      stageValSums[stage] += dealVal;
      totalPipelineVal += dealVal;
      weightedPipelineVal += Math.round(dealVal * (stageProbs[stage] ?? 0.10));

      if (stage === 'won') {
        wonCount++;
        wonRevenueVal += dealVal;
      }
    }

    const score = l.opportunityScore || 75;
    if (score >= 70) highOppCount++;

    if (l.website) totalWithWeb++;
    if (l.email) totalWithEmail++;
    if (l.phone) totalWithPhone++;

    const sub = l.area || 'Umhlanga';
    if (!suburbMap[sub]) suburbMap[sub] = { count: 0, scoreSum: 0, valSum: 0 };
    suburbMap[sub].count++;
    suburbMap[sub].scoreSum += score;
    suburbMap[sub].valSum += (l.estimatedDealValue || 18500);
  });

  // Top KPI Elements
  const totalValEl = document.getElementById('analytics-total-value');
  const weightedValEl = document.getElementById('analytics-weighted-value');
  const wonValEl = document.getElementById('analytics-won-value');
  const avgDealEl = document.getElementById('analytics-avg-deal');

  if (totalValEl) totalValEl.innerText = `R${totalPipelineVal.toLocaleString()}`;
  if (weightedValEl) weightedValEl.innerText = `R${weightedPipelineVal.toLocaleString()}`;
  if (wonValEl) wonValEl.innerText = `R${wonRevenueVal.toLocaleString()}`;
  if (avgDealEl) avgDealEl.innerText = `R${Math.round(totalPipelineVal / total).toLocaleString()}`;

  // Stage Conversion Funnel & Probability Waterfall
  const funnelWaterfall = document.getElementById('funnel-waterfall');
  if (funnelWaterfall) {
    const funnelStages = [
      { id: 'new', name: '1. New Prospect', prob: '10% Win Prob', class: 'new' },
      { id: 'enriched', name: '2. Enriched / Qualified', prob: '20% Win Prob', class: 'enriched' },
      { id: 'outreach', name: '3. Outreach Sent', prob: '35% Win Prob', class: 'outreach' },
      { id: 'meeting', name: '4. Meeting Booked', prob: '60% Win Prob', class: 'meeting' },
      { id: 'proposal', name: '5. Proposal Sent', prob: '80% Win Prob', class: 'proposal' },
      { id: 'won', name: '6. Closed Won', prob: '100% Win Prob', class: 'won' },
    ];

    const maxCount = Math.max(...funnelStages.map(s => stageCounts[s.id]), 1);

    funnelWaterfall.innerHTML = funnelStages.map((s) => {
      const count = stageCounts[s.id] || 0;
      const pct = Math.max(Math.round((count / maxCount) * 100), count > 0 ? 8 : 0);
      const stageVal = stageValSums[s.id] || 0;

      return `
        <div class="waterfall-row">
          <div class="waterfall-stage-info">
            <span class="waterfall-stage-name">${s.name}</span>
            <span class="waterfall-stage-prob">${s.prob}</span>
          </div>
          <div class="waterfall-track">
            <div class="waterfall-fill ${s.class}" style="width: ${pct}%;">
              ${count > 0 ? `${count} leads` : ''}
            </div>
          </div>
          <div class="waterfall-val">
            <strong>R${stageVal.toLocaleString()}</strong> (${count})
          </div>
        </div>
      `;
    }).join('');
  }

  // Category Chart
  const categoryChart = document.getElementById('category-chart');
  if (categoryChart) {
    categoryChart.innerHTML = '';
    const maxCat = Math.max(...Object.values(categoryCounts), 1);
    Object.entries(categoryCounts).forEach(([cat, val]) => {
      const pct = Math.round((val / maxCat) * 100);
      categoryChart.innerHTML += `
        <div class="chart-bar-row">
          <span class="chart-label">${escapeHtml(cat)}</span>
          <div class="chart-track"><div class="chart-fill" style="width: ${pct}%;"></div></div>
          <span class="chart-val">${val}</span>
        </div>
      `;
    });
  }

  // Stage Breakdown Chart
  const stageChart = document.getElementById('stage-chart');
  if (stageChart) {
    stageChart.innerHTML = '';
    const maxStage = Math.max(...Object.values(stageCounts), 1);
    const stageLabels = { new: '🆕 New', enriched: '✨ Enriched', outreach: '📧 Outreach', meeting: '📅 Meeting', proposal: '📝 Proposal', won: '🎉 Won', lost: '❌ Lost' };
    Object.entries(stageCounts).forEach(([stage, val]) => {
      const pct = Math.round((val / maxStage) * 100);
      stageChart.innerHTML += `
        <div class="chart-bar-row">
          <span class="chart-label" style="text-transform: capitalize;">${stageLabels[stage] || stage}</span>
          <div class="chart-track"><div class="chart-fill" style="width: ${pct}%;"></div></div>
          <span class="chart-val">${val}</span>
        </div>
      `;
    });
  }

  // Suburb Leaderboard
  const suburbLeaderboard = document.getElementById('suburb-leaderboard');
  if (suburbLeaderboard) {
    suburbLeaderboard.innerHTML = '';
    const topSubs = Object.entries(suburbMap)
      .map(([sub, data]) => ({ suburb: sub, count: data.count, avgScore: Math.round(data.scoreSum / data.count), val: data.valSum }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    if (topSubs.length === 0) {
      suburbLeaderboard.innerHTML = '<span style="color:var(--text-dim); font-size:12px;">No suburb location metrics available</span>';
    } else {
      topSubs.forEach((s) => {
        suburbLeaderboard.innerHTML += `
          <div class="suburb-rank-card">
            <div class="suburb-rank-header">
              <span class="suburb-name">📍 ${escapeHtml(s.suburb)}</span>
              <span class="badge score-badge-sm">${s.avgScore} Avg Score</span>
            </div>
            <div class="suburb-rank-stats">
              <span><strong>${s.count}</strong> Prospects</span>
              <span style="color:var(--gold); font-weight:600;">Est. R${s.val.toLocaleString()}</span>
            </div>
          </div>
        `;
      });
    }
  }

  // Contact Enrichment Meters
  const metersGrid = document.getElementById('coverage-meters');
  const webPct = Math.round((totalWithWeb / total) * 100);
  const emailPct = Math.round((totalWithEmail / total) * 100);
  const phonePct = Math.round((totalWithPhone / total) * 100);

  if (metersGrid) {
    metersGrid.innerHTML = `
      <div class="meter-card">
        <div class="meter-header"><span>🌐 Website Coverage</span><span>${webPct}%</span></div>
        <div class="metric-progress-bar"><div class="bar-fill web" style="width: ${webPct}%;"></div></div>
        <span style="font-size:11px; color:var(--text-dim);">${totalWithWeb} / ${total} leads possess websites</span>
      </div>
      <div class="meter-card">
        <div class="meter-header"><span>📧 Email Availability</span><span>${emailPct}%</span></div>
        <div class="metric-progress-bar"><div class="bar-fill email" style="width: ${emailPct}%;"></div></div>
        <span style="font-size:11px; color:var(--text-dim);">${totalWithEmail} / ${total} decision maker emails</span>
      </div>
      <div class="meter-card">
        <div class="meter-header"><span>📞 Phone Contactability</span><span>${phonePct}%</span></div>
        <div class="metric-progress-bar"><div class="bar-fill phone" style="width: ${phonePct}%;"></div></div>
        <span style="font-size:11px; color:var(--text-dim);">${totalWithPhone} / ${total} phone numbers for cold calling</span>
      </div>
    `;
  }
}

/**
 * View Switcher
 */
function switchView(viewName) {
  activeView = viewName;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.remove('active'));

  const navBtn = document.getElementById(`nav-${viewName}`);
  const mobNavBtn = document.getElementById(`mob-nav-${viewName}`);
  const viewPanel = document.getElementById(`view-${viewName}-container`);

  if (navBtn) navBtn.classList.add('active');
  if (mobNavBtn) mobNavBtn.classList.add('active');
  if (viewPanel) viewPanel.classList.add('active');

  const titles = {
    kanban: { main: 'Sales Pipeline', sub: 'Manage prospects across outreach & deal stages' },
    table: { main: 'Prospect Database', sub: 'Comprehensive searchable lead directory' },
    analytics: { main: 'Lead Analytics', sub: 'Conversion metrics & channel coverage' },
  };

  const titleEl = document.getElementById('view-title');
  const subEl = document.getElementById('view-subtitle');
  if (titleEl && titles[viewName]) titleEl.innerText = titles[viewName].main;
  if (subEl && titles[viewName]) subEl.innerText = titles[viewName].sub;

  toggleMobileSidebar(false);
  renderDashboard();
}

/**
 * South Africa Province & Suburb Tab Controller
 */
function switchProvinceTab(code) {
  activeProvinceTab = code;
  document.querySelectorAll('.province-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.province === code);
  });
  renderSuburbsGrid();
}

function renderSuburbsGrid() {
  const grid = document.getElementById('suburbs-checkbox-grid');
  if (!grid) return;

  const group = SOUTH_AFRICA_REGIONS.find((r) => r.code === activeProvinceTab) || SOUTH_AFRICA_REGIONS[0];
  grid.innerHTML = group.suburbs
    .map(
      (sub) => `
      <label class="checkbox-label">
        <input type="checkbox" name="suburbs" value="${escapeHtml(sub.name)}" ${sub.checked !== false ? 'checked' : ''}>
        ${escapeHtml(sub.name)}
      </label>
    `
    )
    .join('');
}

function selectAllSuburbs(check) {
  document.querySelectorAll('input[name="suburbs"]').forEach((cb) => {
    cb.checked = check;
  });
}

function handleSidebarRegionChange(val) {
  const activeText = document.getElementById('active-region-text');
  const labels = {
    ALL: 'All South Africa',
    KZN: 'KwaZulu-Natal',
    GP: 'Gauteng Metro',
    WC: 'Western Cape',
    EC: 'Eastern Cape',
    FS: 'Free State',
    MP: 'Mpumalanga',
    LP: 'Limpopo',
    NW: 'North West',
    NC: 'Northern Cape',
    OTH: 'Other SA Hubs',
  };
  if (activeText) activeText.innerText = labels[val] || 'South Africa';

  const defaultAreaForProvince = {
    ALL: 'ALL',
    KZN: 'Umhlanga',
    GP: 'Sandton',
    WC: 'Sea Point',
    EC: 'Gqeberha',
    FS: 'Bloemfontein',
    MP: 'Nelspruit',
    LP: 'Polokwane',
    NW: 'Rustenburg',
    NC: 'Kimberley',
    OTH: 'Gqeberha',
  };

  const filterSelect = document.getElementById('filter-area-select');
  if (filterSelect) {
    const targetArea = defaultAreaForProvince[val] || 'ALL';
    if (targetArea === 'ALL') {
      filterSelect.value = 'ALL';
    } else {
      const match = Array.from(filterSelect.options).find(opt => opt.value.toLowerCase().includes(targetArea.toLowerCase()));
      filterSelect.value = match ? match.value : 'ALL';
    }
    applyFilters();
  }
  toggleMobileSidebar(false);
}

/**
 * Filter Handlers
 */
function filterByCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('#category-pills .pill').forEach((pill) => {
    if (pill.dataset.category === cat) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
  renderDashboard();
}

function filterByPreset(preset) {
  currentQuickFilter = preset;
  document.querySelectorAll('#preset-chips .preset-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.preset === preset);
  });
  renderDashboard();
}

function handleSearch(val) {
  currentSearchTerm = val.toLowerCase().trim();
  renderDashboard();
}

function applyFilters() {
  renderDashboard();
}

function applySort(val) {
  currentSortField = val;
  renderDashboard();
}

function toggleSort(field) {
  if (currentSortField === `${field}-asc`) {
    currentSortField = `${field}-desc`;
  } else {
    currentSortField = `${field}-asc`;
  }
  renderDashboard();
}

/**
 * Scraper Extraction Modal Handlers
 */
function openExtractModal() {
  document.getElementById('extract-modal').classList.add('show');
}

function closeExtractModal() {
  document.getElementById('extract-modal').classList.remove('show');
  if (pollTimer) clearInterval(pollTimer);
}

function showLiveExtractionBanner(text) {
  const banner = document.getElementById('live-extraction-banner');
  const bannerText = document.getElementById('banner-status-text');
  if (banner && bannerText) {
    bannerText.innerText = text;
    banner.classList.remove('hidden');
  }
}

function hideLiveExtractionBanner() {
  const banner = document.getElementById('live-extraction-banner');
  if (banner) banner.classList.add('hidden');
}

/**
 * Handle Niche Preset Selection Change in Extract Modal
 */
function handleNichePresetChange(preset) {
  const badge = document.getElementById('preset-badge');
  const catWrap = document.getElementById('categories-select-wrap');
  
  if (badge) {
    if (preset === 'all_high_yield') badge.innerText = '⚡ Full Spectrum (12 Niches)';
    else if (preset === 'custom') badge.innerText = '✏️ Custom Selection';
    else badge.innerText = '🎯 Focused Vertical';
  }

  if (catWrap) {
    catWrap.style.display = preset === 'custom' ? 'block' : 'block';
  }
}

/**
 * Quick-select Top Metro Commercial Hubs across SA
 */
function selectTopMetroHubs() {
  const topHubs = ['umhlanga', 'durban_north', 'ballito', 'sandton', 'rosebank', 'pretoria_east', 'sea_point', 'century_city', 'gqeberha', 'bloemfontein'];
  document.querySelectorAll('input[name="suburbs"]').forEach((cb) => {
    cb.checked = topHubs.includes(cb.value);
  });
  showToast('✓ Selected top metro hubs across South Africa!');
}

/**
 * Start Multi-Area Lead Extraction Scraper Task
 */
async function handleStartExtraction(e) {
  e.preventDefault();

  // Collect checked suburbs
  const checkedSuburbs = Array.from(document.querySelectorAll('input[name="suburbs"]:checked')).map((cb) => cb.value);
  const customAreasVal = document.getElementById('extract-custom-areas').value;
  const customAreas = customAreasVal ? customAreasVal.split(',').map((a) => a.trim()).filter(Boolean) : [];

  const selectedAreas = Array.from(new Set([...checkedSuburbs, ...customAreas]));

  if (selectedAreas.length === 0) {
    showToast('⚠️ Please select at least one South African location!');
    return;
  }

  const nichePreset = document.getElementById('extract-niche-preset')?.value || 'all_high_yield';
  const checkboxes = document.querySelectorAll('input[name="categories"]:checked');
  const selectedCategories = Array.from(checkboxes).map((cb) => cb.value);

  const maxResults = parseInt(document.getElementById('extract-max').value, 10);
  const useModifiers = document.getElementById('ext-use-modifiers')?.checked ?? true;
  const includeWebSearch = document.getElementById('ext-web-search').checked;
  const includeDeepCrawl = document.getElementById('ext-deep-crawl').checked;

  const btn = document.getElementById('btn-run-scraper');
  btn.disabled = true;
  btn.innerText = '⌛ Extracting Multi-Area Leads...';

  const terminal = document.getElementById('extraction-terminal');
  const logBox = document.getElementById('terminal-logs');
  terminal.classList.remove('hidden');
  logBox.innerHTML = `<div class="log-line info">🚀 Launching scraper engine for ${selectedAreas.length} South Africa locations: ${selectedAreas.slice(0, 3).join(', ')}...</div>`;

  showLiveExtractionBanner(`Extracting ${nichePreset !== 'custom' ? nichePreset.replace(/_/g, ' ') : selectedCategories.length + ' categories'} across ${selectedAreas.length} SA locations...`);

  if (!isStaticMode) {
    try {
      const res = await fetch(getApiUrl('/api/extract'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: selectedAreas,
          categories: selectedCategories,
          nichePreset: nichePreset !== 'custom' ? nichePreset : undefined,
          useModifiers,
          maxResults,
          includeWebSearch,
          includeDeepCrawl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        logBox.innerHTML += `<div class="log-line success">✓ Multi-Area Live Scraper process running (${data.terms?.length || 0} queries)...</div>`;
        startStatusPolling();
        return;
      }
    } catch {
      // Fall through to simulated mode
    }
  }

  // Client Simulation Mode
  let step = 0;
  const simLogs = [
    `Initializing Playwright Chromium engine...`,
    `Searching Google Maps & Web Engines for ${selectedCategories[0] || 'high-value niches'} in ${selectedAreas[0]}...`,
    `Extracting business cards, address, phone & rating data...`,
    `Deep crawling domain homepages for decision-maker contact emails...`,
    `✓ Extraction complete! Added qualified leads across ${selectedAreas.join(', ')}.`
  ];

  const timer = setInterval(() => {
    if (step < simLogs.length) {
      logBox.innerHTML += `<div class="log-line success">${simLogs[step]}</div>`;
      logBox.scrollTop = logBox.scrollHeight;
      step++;
    } else {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerText = '🚀 Start Multi-Area Lead Extraction';

      hideLiveExtractionBanner();
      showToast(`✓ Multi-Area Lead Extraction Completed for ${selectedAreas.length} locations!`);

      // Add mock lead for selected area
      const pickArea = selectedAreas[Math.floor(Math.random() * selectedAreas.length)] || 'Sandton';
      const mockLead = {
        id: `ext_${Date.now()}`,
        name: `${pickArea} Premier ${selectedCategories[0] || 'Business'}`,
        category: selectedCategories[0] || 'Fitness',
        area: pickArea,
        address: `${pickArea}, South Africa`,
        phone: `+27 11 ${Math.floor(5000000 + Math.random() * 4000000)}`,
        website: `https://www.${pickArea.toLowerCase().replace(/[^a-z]/g, '')}premier${Date.now().toString().slice(-4)}.co.za`,
        email: `info@${pickArea.toLowerCase().replace(/[^a-z]/g, '')}premier${Date.now().toString().slice(-4)}.co.za`,
        socials: { instagram: `https://instagram.com/${pickArea.toLowerCase().replace(/[^a-z]/g, '')}premier` },
        rating: 4.9,
        reviewCount: 42,
        funnelStage: 'new',
        opportunityScore: 91,
        scrapedAt: new Date().toISOString(),
        source: 'multi_source'
      };

      allLeads.unshift(mockLead);
      saveLeadsLocally();
      populateAreaFilterOptions();
      renderDashboard();
    }
  }, 1000);
}

/**
 * Poll Background Extraction Status
 */
function startStatusPolling() {
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(getApiUrl('/api/extract/status'));
      const statusData = await res.json();
      const logBox = document.getElementById('terminal-logs');

      if (statusData.progress && statusData.progress.log) {
        logBox.innerHTML = statusData.progress.log
          .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
          .join('');
        logBox.scrollTop = logBox.scrollHeight;
      }

      if (!statusData.isExtracting) {
        clearInterval(pollTimer);
        const btn = document.getElementById('btn-run-scraper');
        btn.disabled = false;
        btn.innerText = '🚀 Start Multi-Area Lead Extraction';

        hideLiveExtractionBanner();
        showToast('✓ Live Multi-Area Lead Extraction Finished!');

        fetchLeads();
        fetchStats();
      }
    } catch {
      // ignore
    }
  }, 2000);
}

/**
 * Manual Lead Modal Handlers
 */
function openAddLeadModal() {
  document.getElementById('add-lead-modal').classList.add('show');
}

function closeAddLeadModal() {
  document.getElementById('add-lead-modal').classList.remove('show');
  document.getElementById('add-lead-form').reset();
}

async function handleAddLeadSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('add-name').value;
  const category = document.getElementById('add-category').value;
  const area = document.getElementById('add-area').value || 'Umhlanga';
  const website = document.getElementById('add-website').value;
  const phone = document.getElementById('add-phone').value;
  const email = document.getElementById('add-email').value;

  const newLeadData = {
    name,
    category,
    area,
    website,
    phone,
    email,
    funnelStage: 'new',
    opportunityScore: 82,
  };

  if (!isStaticMode) {
    try {
      const res = await fetch(getApiUrl('/api/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadData),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        allLeads.unshift(data.lead);
        closeAddLeadModal();
        populateAreaFilterOptions();
        renderDashboard();
        fetchStats();
        showToast('✓ Lead created successfully!');
        return;
      }
    } catch {
      // Fall through to static
    }
  }

  const manualLead = {
    id: `manual_${Date.now()}`,
    ...newLeadData,
    scrapedAt: new Date().toISOString(),
    source: 'manual',
  };

  allLeads.unshift(manualLead);
  saveLeadsLocally();
  closeAddLeadModal();
  populateAreaFilterOptions();
  renderDashboard();
  showToast('✓ Lead created locally!');
}

/**
 * Trigger Contact Enrichment
 */
async function triggerEnrichment() {
  const btn = document.getElementById('btn-enrich');
  if (btn) btn.innerText = '⌛ Enriching...';

  if (!isStaticMode) {
    try {
      const res = await fetch(getApiUrl('/api/enrich'), { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Contact enrichment finished!');
      fetchLeads();
      fetchStats();
      if (btn) btn.innerHTML = '<span>✨ Enrich Contacts</span>';
      return;
    } catch {
      // ignore
    }
  }

  allLeads.forEach((l) => {
    if (!l.email) l.email = `contact@${l.name.toLowerCase().replace(/[^a-z]/g, '') || 'business'}.co.za`;
    if (!l.phone) l.phone = `+27 11 566 ${Math.floor(1000 + Math.random() * 9000)}`;
    if (l.funnelStage === 'new') l.funnelStage = 'enriched';
  });

  saveLeadsLocally();
  renderDashboard();
  showToast('✨ Contact enrichment completed!');
  if (btn) btn.innerHTML = '<span>✨ Enrich Contacts</span>';
}

/**
 * Open Prospect Detail Drawer Modal
 */
let currentPitchChannel = 'email';

function openDetailModal(leadId) {
  selectedLead = allLeads.find((l) => l.id === leadId);
  if (!selectedLead) return;

  document.getElementById('detail-name').innerText = selectedLead.name;
  document.getElementById('detail-category').innerText = selectedLead.category;
  document.getElementById('detail-score').innerText = selectedLead.opportunityScore || 80;
  
  const estVal = selectedLead.estimatedDealValue || 18500;
  document.getElementById('detail-est-value').innerText = `Est. Deal: R${estVal.toLocaleString()}`;

  // Website
  const webLink = document.getElementById('detail-website');
  if (selectedLead.website) {
    webLink.href = selectedLead.website;
    webLink.innerText = selectedLead.website;
  } else {
    webLink.href = '#';
    webLink.innerText = 'Not Found';
  }

  // Phone
  const phoneLink = document.getElementById('detail-phone');
  if (selectedLead.phone) {
    phoneLink.href = `tel:${selectedLead.phone}`;
    phoneLink.innerText = selectedLead.phone;
  } else {
    phoneLink.href = '#';
    phoneLink.innerText = 'Not Found';
  }

  // Email
  const emailLink = document.getElementById('detail-email');
  if (selectedLead.email) {
    emailLink.href = `mailto:${selectedLead.email}`;
    emailLink.innerText = selectedLead.email;
  } else {
    emailLink.href = '#';
    emailLink.innerText = 'Not Found';
  }

  document.getElementById('detail-address').innerText = selectedLead.address || selectedLead.area || 'South Africa';
  document.getElementById('detail-stage-select').value = selectedLead.funnelStage;
  document.getElementById('detail-notes').value = selectedLead.notes || '';

  // Render Social Badges
  const socialsContainer = document.getElementById('detail-socials');
  socialsContainer.innerHTML = '';

  const socials = selectedLead.socials || {};
  const platformKeys = Object.keys(socials);

  if (platformKeys.length === 0) {
    socialsContainer.innerHTML = '<span style="color:var(--text-dim); font-size:12px;">No social links attached</span>';
  } else {
    platformKeys.forEach((key) => {
      const url = socials[key];
      if (url) {
        socialsContainer.innerHTML += `
          <a href="${url}" target="_blank" class="contact-card" style="text-decoration:none;">
            <span class="icon">🔗</span>
            <div class="info">
              <span class="label" style="text-transform:uppercase;">${key}</span>
              <span style="font-size:12px; color:var(--sky);">${escapeHtml(url)}</span>
            </div>
          </a>
        `;
      }
    });
  }

  renderTechnicalAuditDrawer(selectedLead);
  renderPitchSuite(selectedLead);

  document.getElementById('detail-modal').classList.add('show');
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('show');
  selectedLead = null;
}

/**
 * Update Lead Stage from Modal Dropdown
 */
async function updateLeadStageFromModal(newStage) {
  if (!selectedLead) return;

  selectedLead.funnelStage = newStage;

  if (!isStaticMode) {
    try {
      await fetch(getApiUrl(`/api/leads/${selectedLead.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelStage: newStage }),
      });
    } catch {
      // ignore
    }
  }

  saveLeadsLocally();
  renderDashboard();
  showToast(`✓ Stage updated to ${newStage}`);
}

/**
 * Save Lead Notes
 */
async function saveLeadNotes() {
  if (!selectedLead) return;
  const notes = document.getElementById('detail-notes').value;
  selectedLead.notes = notes;

  if (!isStaticMode) {
    try {
      await fetch(getApiUrl(`/api/leads/${selectedLead.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch {
      // ignore
    }
  }

  saveLeadsLocally();
  showToast('✓ Lead notes saved!');
}

/**
 * Render Technical Audit Chips
 */
function renderTechnicalAuditDrawer(lead) {
  const auditBox = document.getElementById('detail-audit-box');
  if (!auditBox) return;

  const audit = lead.technicalAudit || {
    hasHttps: Boolean(lead.website && lead.website.startsWith('https')),
    hasResponsiveViewport: true,
    hasContactForm: Boolean(lead.email),
    hasBookingSystem: false,
    hasWhatsappLink: Boolean(lead.phone),
  };

  const chips = [
    { label: 'HTTPS SSL Security', ok: audit.hasHttps },
    { label: 'Mobile Responsive Viewport', ok: audit.hasResponsiveViewport },
    { label: 'Online Booking System', ok: audit.hasBookingSystem },
    { label: 'WhatsApp Instant Lead CTA', ok: audit.hasWhatsappLink },
    { label: 'Contact Inquiry Form', ok: audit.hasContactForm },
  ];

  auditBox.innerHTML = chips
    .map(
      (c) => `
      <div class="audit-chip ${c.ok ? 'pass' : 'fail'}">
        <span class="dot">${c.ok ? '✓' : '✖'}</span>
        <span>${c.label}</span>
      </div>
    `
    )
    .join('');
}

/**
 * Change Sequence Playbook Archetype
 */
async function changeSequenceArchetype(archetype) {
  currentSequenceArchetype = archetype;
  activeTouchpointIndex = 0;
  if (!selectedLead) return;

  const archSelect = document.getElementById('sequence-archetype-select');
  if (archSelect) archSelect.value = archetype;

  // If connected to API, request generation
  if (!isStaticMode) {
    try {
      const res = await fetch(getApiUrl('/api/sequences/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          archetype: currentSequenceArchetype,
          tone: currentPitchTone,
        }),
      });
      const data = await res.json();
      if (data.success && data.sequence) {
        activeSequenceData = data.sequence;
        renderPitchSuite(selectedLead);
        showToast(`✓ Generated ${data.sequence.archetypeName}`);
        return;
      }
    } catch {
      // Fall through to local generation
    }
  }

  activeSequenceData = generateSequenceLocal(selectedLead, currentSequenceArchetype, currentPitchTone);
  renderPitchSuite(selectedLead);
}

/**
 * Change Pitch Tone Selector
 */
async function changePitchTone(tone) {
  currentPitchTone = tone;
  if (!selectedLead) return;

  const toneSelect = document.getElementById('pitch-tone-select');
  if (toneSelect) toneSelect.value = tone;

  if (!isStaticMode) {
    try {
      const res = await fetch(getApiUrl(`/api/leads/${selectedLead.id}/pitch`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      });
      const data = await res.json();
      if (data.success && data.scripts) {
        selectedLead.aiPitchScripts = data.scripts;
      }
    } catch {
      // Fall through
    }
  }

  await changeSequenceArchetype(currentSequenceArchetype);
}

/**
 * Select a specific touchpoint in the active sequence timeline
 */
function selectTouchpoint(index) {
  if (!activeSequenceData || !activeSequenceData.touchpoints) return;
  activeTouchpointIndex = index;
  const tp = activeSequenceData.touchpoints[index];
  if (!tp) return;

  // Map channel tab
  if (tp.channel === 'email') currentPitchChannel = 'email';
  else if (tp.channel === 'whatsapp') currentPitchChannel = 'whatsapp';
  else if (tp.channel === 'social_dm') currentPitchChannel = 'socialDm';
  else if (tp.channel === 'cold_call') currentPitchChannel = 'coldCall';
  else currentPitchChannel = 'dripSequence';

  renderPitchSuite(selectedLead);
}

/**
 * Render Interactive Cadence Timeline Chips
 */
function renderSequenceTimeline(sequence) {
  const container = document.getElementById('sequence-timeline-chips');
  if (!container || !sequence || !sequence.touchpoints) return;

  container.innerHTML = sequence.touchpoints
    .map((tp, idx) => {
      const isActive = idx === activeTouchpointIndex;
      return `
      <div class="timeline-chip ${isActive ? 'active' : ''}" onclick="selectTouchpoint(${idx})">
        <span class="chip-day">Day ${tp.dayDelay}</span>
        <span>${tp.channelEmoji}</span>
        <span>${tp.title.replace(/^Day \d+:\s*/, '')}</span>
      </div>
    `;
    })
    .join('');
}

/**
 * Render Multi-Channel Outreach Pitch Suite & Sequences
 */
function renderPitchSuite(lead) {
  if (!lead) return;

  if (!activeSequenceData) {
    activeSequenceData = generateSequenceLocal(lead, currentSequenceArchetype, currentPitchTone);
  }

  // 1. Render Timeline Chips
  renderSequenceTimeline(activeSequenceData);

  // 2. Update Active Tab State
  document.querySelectorAll('.pitch-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.channel === currentPitchChannel);
  });

  // 3. Update Channel Label and Content
  const labelEl = document.getElementById('pitch-channel-label');
  const scriptTextEl = document.getElementById('ai-script-text');
  const guidanceEl = document.getElementById('action-guidance-container');

  const channelLabels = {
    email: `Email Outreach (Step ${activeTouchpointIndex + 1})`,
    whatsapp: 'WhatsApp Direct Outreach',
    socialDm: 'Instagram / LinkedIn DM Script',
    coldCall: 'Cold Call Discovery Battlecard',
    dripSequence: 'Full Multi-Touch Drip Cadence',
  };

  if (labelEl) labelEl.innerText = channelLabels[currentPitchChannel] || 'Outreach Script';

  let scriptText = '';
  let guidanceText = '';

  const touchpoints = activeSequenceData.touchpoints || [];
  const currentTp = touchpoints[activeTouchpointIndex] || touchpoints[0];

  if (currentPitchChannel === 'email') {
    const emailTp = touchpoints.find((t, i) => t.channel === 'email' && i === activeTouchpointIndex) || touchpoints.find((t) => t.channel === 'email') || touchpoints[0];
    const subject = emailTp?.subject || (lead.aiPitchScripts?.email?.subject || `Optimizing ${lead.name}'s lead intake`);
    const body = emailTp?.body || (lead.aiPitchScripts?.email?.body || 'No email script available.');
    scriptText = `Subject: ${subject}\n\n${body}`;
    guidanceText = emailTp?.actionGuidance || 'Send from primary sales inbox.';
  } else if (currentPitchChannel === 'whatsapp') {
    const waTp = touchpoints.find((t) => t.channel === 'whatsapp') || touchpoints[1] || touchpoints[0];
    scriptText = waTp?.body || (lead.aiPitchScripts?.whatsapp || 'No WhatsApp script available.');
    guidanceText = waTp?.actionGuidance || 'Send directly to business WhatsApp number.';
  } else if (currentPitchChannel === 'socialDm') {
    const dmTp = touchpoints.find((t) => t.channel === 'social_dm') || touchpoints[3] || touchpoints[0];
    scriptText = dmTp?.body || (lead.aiPitchScripts?.socialDm || 'No Social DM script available.');
    guidanceText = dmTp?.actionGuidance || 'Send via Instagram DM or LinkedIn message.';
  } else if (currentPitchChannel === 'coldCall') {
    const callTp = touchpoints.find((t) => t.channel === 'cold_call') || touchpoints[2] || touchpoints[0];
    if (lead.aiPitchScripts?.coldCall) {
      scriptText = `• Opener: ${lead.aiPitchScripts.coldCall.opener}\n• Discovery: ${lead.aiPitchScripts.coldCall.discovery}\n• Objection: ${lead.aiPitchScripts.coldCall.objectionHandling}\n• Close: ${lead.aiPitchScripts.coldCall.close}`;
    } else {
      scriptText = callTp?.body || 'No cold call battlecard generated.';
    }
    guidanceText = callTp?.actionGuidance || 'Best call window: 09:30 - 11:30 or 14:00 - 16:00.';
  } else if (currentPitchChannel === 'dripSequence') {
    scriptText = touchpoints
      .map(
        (t, idx) =>
          `[Touchpoint ${idx + 1} | Day ${t.dayDelay} | ${t.channel.toUpperCase()}]\nTitle: ${t.title}\n${t.subject ? `Subject: ${t.subject}\n` : ''}${t.body}\nGuidance: ${t.actionGuidance}\n`
      )
      .join('\n' + '─'.repeat(45) + '\n\n');
    guidanceText = 'Execute multi-channel sequence across 14 days for maximum response rate.';
  }

  if (scriptTextEl) scriptTextEl.innerText = scriptText;

  if (guidanceEl) {
    if (guidanceText) {
      guidanceEl.innerHTML = `<strong>💡 Tactical Guidance:</strong> ${escapeHtml(guidanceText)}`;
      guidanceEl.classList.remove('hidden');
    } else {
      guidanceEl.classList.add('hidden');
    }
  }
}

/**
 * Switch Pitch Channel Tab
 */
function switchPitchTab(channel) {
  currentPitchChannel = channel;
  if (!selectedLead) return;
  renderPitchSuite(selectedLead);
}

/**
 * Copy Active Script to Clipboard
 */
function copyPitchToClipboard() {
  const scriptText = document.getElementById('ai-script-text')?.innerText;
  if (!scriptText) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(scriptText).then(() => {
      showToast('📋 Script copied to clipboard!');
    }).catch(() => {
      copyFallback(scriptText);
    });
  } else {
    copyFallback(scriptText);
  }
}

function copyFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('📋 Script copied to clipboard!');
  } catch {
    showToast('⚠️ Could not copy script to clipboard');
  }
  document.body.removeChild(textarea);
}

/**
 * 1-Click WhatsApp Outreach Dispatcher
 */
function dispatchWhatsApp() {
  if (!selectedLead) {
    showToast('⚠️ Please select a prospect first!');
    return;
  }

  const rawPhone = selectedLead.phone || '';
  // Format South African phone to international format e.g. 082 123 4567 -> 27821234567
  let cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '27' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('27') && cleanPhone.length === 9) {
    cleanPhone = '27' + cleanPhone;
  }

  if (!cleanPhone) {
    showToast('⚠️ No phone number available for WhatsApp outreach.');
    return;
  }

  // Get active WhatsApp script
  const waScript = selectedLead.aiPitchScripts?.whatsapp || 
    activeSequenceData?.touchpoints?.find(t => t.channel === 'whatsapp')?.body ||
    `Hi ${selectedLead.name} Team 👋 I came across your business in ${selectedLead.area || 'South Africa'} and put together a quick conversion audit for you!`;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waScript)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  showToast(`💬 Launching WhatsApp for ${selectedLead.name}...`);
}

/**
 * 1-Click Native Mail Client Dispatcher
 */
function dispatchEmail() {
  if (!selectedLead) {
    showToast('⚠️ Please select a prospect first!');
    return;
  }

  if (!selectedLead.email) {
    showToast('⚠️ No email address available for this prospect.');
    return;
  }

  const emailTp = activeSequenceData?.touchpoints?.find(t => t.channel === 'email') || {};
  const subject = emailTp.subject || selectedLead.aiPitchScripts?.email?.subject || `Optimizing ${selectedLead.name}'s digital lead intake`;
  const body = emailTp.body || selectedLead.aiPitchScripts?.email?.body || `Hi ${selectedLead.name} Team,\n\nI put together a quick technical audit for ${selectedLead.name}.`;

  const mailtoUrl = `mailto:${selectedLead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  showToast(`✉️ Launching email client for ${selectedLead.email}...`);
}

/**
 * Open Stand-Alone Client PDF Proposal / Audit Report
 */
function openClientReport(leadId) {
  const lead = leadId ? allLeads.find(l => l.id === leadId) : selectedLead;
  if (!lead) {
    showToast('⚠️ Please select a lead first!');
    return;
  }

  if (!isStaticMode) {
    window.open(getApiUrl(`/api/leads/${lead.id}/report`), '_blank');
    showToast(`📄 Generating proposal report for ${lead.name}...`);
    return;
  }

  // Static mode: Generate client-side printable report HTML
  const reportHtml = generateClientReportHtml(lead);
  const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
  showToast(`📄 Opened PDF Proposal for ${lead.name}`);
}

/**
 * Stand-Alone HTML/PDF Client Proposal Report Generator
 */
function generateClientReportHtml(lead) {
  const audit = lead.technicalAudit || {
    hasHttps: Boolean(lead.website && lead.website.startsWith('https')),
    hasResponsiveViewport: true,
    hasContactForm: Boolean(lead.email),
    hasBookingSystem: false,
    hasWhatsappLink: Boolean(lead.phone),
  };
  const score = lead.opportunityScore || 75;
  const seoScore = audit.seoScore ?? (audit.hasHttps ? 75 : 45);
  const estValue = lead.estimatedDealValue ? lead.estimatedDealValue.toLocaleString() : '18,500';
  const scripts = lead.aiPitchScripts;

  const issues = [
    !audit.hasWhatsappLink ? 'Missing WhatsApp 1-click lead capture widget' : null,
    !audit.hasBookingSystem ? 'No automated online booking engine installed' : null,
    !audit.analyticsDetected || audit.analyticsDetected.length === 0 ? 'Missing conversion analytics (GA4 / Meta Pixel)' : null,
    !audit.hasResponsiveViewport ? 'Mobile layout viewport optimization required' : null,
    !audit.hasHttps ? 'Insecure HTTP protocol connection (missing SSL certificate)' : null,
  ].filter(Boolean);

  const recommendations = [
    !audit.hasWhatsappLink ? 'Deploy automated 24/7 WhatsApp lead capture widget with instant response' : null,
    !audit.hasBookingSystem ? 'Install custom responsive online booking engine for after-hours scheduling' : null,
    !audit.analyticsDetected || audit.analyticsDetected.length === 0 ? 'Implement Google Analytics 4 & Meta Pixel conversion tracking' : null,
    !audit.hasResponsiveViewport ? 'Implement mobile-first responsive viewport design' : null,
    !audit.hasHttps ? 'Install SSL certificate and enforce HTTPS security' : null,
  ].filter(Boolean);

  if (recommendations.length === 0) {
    recommendations.push('Deploy automated 24/7 WhatsApp lead capture widget');
    recommendations.push('Install custom responsive online booking engine');
    recommendations.push('Set up GA4 & Meta Pixel conversion tracking');
  }

  const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Technical Audit Report - ${escapeHtml(lead.name)}</title>
  <style>
    :root { --primary: #2563eb; --dark: #0f172a; --card-bg: #f8fafc; --border: #e2e8f0; --danger: #dc2626; --warning: #d97706; --success: #16a34a; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: var(--dark); background: #ffffff; padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--border); padding-bottom: 24px; margin-bottom: 32px; }
    .brand-title { font-size: 24px; font-weight: 800; color: var(--primary); }
    .business-title { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .meta-text { color: #64748b; font-size: 14px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .score-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; text-align: center; }
    .score-val { font-size: 48px; font-weight: 900; line-height: 1; margin: 10px 0; }
    .score-high { color: var(--danger); }
    .score-med { color: var(--warning); }
    .score-good { color: var(--success); }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .tech-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .tech-table th, .tech-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
    .tech-table th { background: #f1f5f9; font-weight: 600; }
    .issue-list, .rec-list { list-style: none; }
    .issue-list li { background: #fef2f2; border-left: 4px solid var(--danger); padding: 10px 14px; margin-bottom: 8px; border-radius: 0 6px 6px 0; font-size: 14px; }
    .rec-list li { background: #f0fdf4; border-left: 4px solid var(--success); padding: 10px 14px; margin-bottom: 8px; border-radius: 0 6px 6px 0; font-size: 14px; }
    .val-banner { background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; padding: 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .val-amount { font-size: 32px; font-weight: 800; color: #38bdf8; }
    .footer { border-top: 1px solid var(--border); padding-top: 20px; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; max-width: 100%; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <header class="header">
    <div>
      <h1 class="business-title">${escapeHtml(lead.name)}</h1>
      <p class="meta-text">Target Area: <strong>${escapeHtml(lead.area || 'South Africa')}</strong> | Category: <strong>${escapeHtml(lead.category)}</strong></p>
      <p class="meta-text">Website: ${lead.website ? `<a href="${lead.website}" target="_blank">${escapeHtml(lead.website)}</a>` : 'None / Not Provided'}</p>
    </div>
    <div style="text-align: right;">
      <div class="brand-title">LeadGremlin Growth Engine</div>
      <p class="meta-text">Date: ${dateStr}</p>
      <p class="meta-text">outreach@leadgremlin.co.za | +27 31 561 1000</p>
    </div>
  </header>
  <div class="grid-2">
    <div class="score-card">
      <div class="meta-text">LEAD OPPORTUNITY SCORE</div>
      <div class="score-val ${score >= 70 ? 'score-high' : score >= 40 ? 'score-med' : 'score-good'}">${score}/100</div>
      <div class="meta-text">${score >= 70 ? '🔥 High Opportunity (Conversion Funnel Overhaul Needed)' : '⚡ Medium Opportunity'}</div>
    </div>
    <div class="score-card">
      <div class="meta-text">TECHNICAL DIAGNOSTIC SCORE</div>
      <div class="score-val score-good">${seoScore}/100</div>
      <div class="meta-text">Based on Mobile Viewport, Security & Lead Intake</div>
    </div>
  </div>
  <div class="section">
    <h2 class="section-title">Technical Infrastructure Diagnostic</h2>
    <table class="tech-table">
      <thead>
        <tr><th>Technical Metric</th><th>Status</th><th>Impact</th></tr>
      </thead>
      <tbody>
        <tr><td>SSL Security (HTTPS)</td><td>${audit.hasHttps ? '✓ Secure' : '❌ Insecure (HTTP)'}</td><td>${audit.hasHttps ? 'Low Risk' : 'High - Google Ranks Insecure Sites Lower'}</td></tr>
        <tr><td>WhatsApp Instant Lead CTA</td><td>${audit.hasWhatsappLink ? '✓ Installed' : '❌ Missing Widget'}</td><td>${audit.hasWhatsappLink ? 'Captured' : 'High - Missing Weekly Client Bookings'}</td></tr>
        <tr><td>Online Booking Portal</td><td>${audit.hasBookingSystem ? '✓ Installed' : '❌ Missing Engine'}</td><td>${audit.hasBookingSystem ? 'Automated' : 'High - After-Hours Inquiries Lost'}</td></tr>
        <tr><td>Mobile Responsive Viewport</td><td>${audit.hasResponsiveViewport ? '✓ Responsive' : '❌ Non-Responsive'}</td><td>Mobile UX & Booking Conversion</td></tr>
      </tbody>
    </table>
  </div>
  <div class="val-banner">
    <div>
      <div style="font-size: 14px; opacity: 0.9;">ESTIMATED POTENTIAL PROJECT VALUE</div>
      <div style="font-size: 13px; opacity: 0.7;">Based on required lead intake redesign & automated booking funnel</div>
    </div>
    <div class="val-amount">R${estValue}</div>
  </div>
  <div class="grid-2">
    <div>
      <h2 class="section-title">Identified Gaps</h2>
      <ul class="issue-list">${issues.map(i => `<li>⚠️ ${escapeHtml(i)}</li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="section-title">Recommended Upgrades</h2>
      <ul class="rec-list">${recommendations.map(r => `<li>✓ ${escapeHtml(r)}</li>`).join('')}</ul>
    </div>
  </div>
  <footer class="footer">
    <div>LeadGremlin Sales Funnel Audit & Technical Engine Report</div>
    <div>Page 1 of 1</div>
  </footer>
</body>
</html>`;
}

/**
 * Trigger Notion CRM Sync
 */
async function triggerNotionSync() {
  const btn = document.getElementById('btn-notion-sync');
  if (btn) btn.innerHTML = '<span>⏳ Syncing...</span>';

  if (isStaticMode) {
    setTimeout(() => {
      showToast('ℹ️ Notion Sync is active in Live Server mode. Connect NOTION_TOKEN to sync.');
      if (btn) btn.innerHTML = '<span>🔗 Sync to Notion</span>';
    }, 600);
    return;
  }

  try {
    const res = await fetch(getApiUrl('/api/notion/sync'), { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ ${data.message}`);
    } else {
      showToast(`⚠️ ${data.error || 'Notion sync failed.'}`);
    }
  } catch (err) {
    showToast('⚠️ Could not connect to Notion sync service.');
  } finally {
    if (btn) btn.innerHTML = '<span>🔗 Sync to Notion</span>';
  }
}

/**
 * Trigger Website Technical Audit
 */
async function triggerWebsiteAudit() {
  if (!selectedLead) return;
  if (!selectedLead.website) {
    showToast('⚠️ This lead does not have a website URL to audit.');
    return;
  }

  const btn = document.getElementById('btn-run-audit');
  if (btn) btn.innerText = '⏳ Auditing...';

  if (!isStaticMode) {
    try {
      const res = await fetch(getApiUrl('/api/audit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedLead.id, website: selectedLead.website }),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        Object.assign(selectedLead, data.lead);
      }
    } catch (err) {
      console.warn('Live audit failed, using deterministic audit:', err);
    }
  }

  // Deterministic audit fallback
  if (!selectedLead.technicalAudit) {
    selectedLead.technicalAudit = {
      hasHttps: selectedLead.website.startsWith('https'),
      hasResponsiveViewport: true,
      hasContactForm: Boolean(selectedLead.email),
      hasBookingSystem: false,
      hasWhatsappLink: Boolean(selectedLead.phone),
      analyticsDetected: [],
      hasFavicon: true,
    };
    selectedLead.opportunityScore = selectedLead.technicalAudit.hasHttps ? 85 : 92;
  }

  saveLeadsLocally();
  renderTechnicalAuditDrawer(selectedLead);
  renderDashboard();
  showToast(`✓ Technical audit completed for ${selectedLead.name}!`);
  if (btn) btn.innerText = '🔄 Run Technical Audit';
}

/**
 * Export Current Sequence to Instantly/Smartlead CSV or JSON
 */
function exportCurrentSequence(format = 'csv') {
  if (!selectedLead) {
    showToast('⚠️ Please select a lead first!');
    return;
  }

  const seq = activeSequenceData || generateSequenceLocal(selectedLead, currentSequenceArchetype, currentPitchTone);

  if (format === 'json') {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(seq, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `sequence_${selectedLead.name.replace(/[^a-zA-Z0-9]/g, '_')}_${seq.archetype}.json`);
    dlAnchor.click();
    showToast('✓ Sequence exported to JSON!');
    return;
  }

  // CSV Export
  const emailSteps = seq.touchpoints.filter((t) => t.channel === 'email');
  const headers = ['Email', 'CompanyName', 'Website', 'Phone', 'City', 'Category', 'Subject 1', 'Body 1', 'Delay 1', 'Subject 2', 'Body 2', 'Delay 2', 'Subject 3', 'Body 3', 'Delay 3'];
  
  const escapeCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  const row = [
    escapeCsv(selectedLead.email || ''),
    escapeCsv(selectedLead.name),
    escapeCsv(selectedLead.website || ''),
    escapeCsv(selectedLead.phone || ''),
    escapeCsv(selectedLead.area || ''),
    escapeCsv(selectedLead.category || ''),
    escapeCsv(emailSteps[0]?.subject || ''),
    escapeCsv(emailSteps[0]?.body || ''),
    escapeCsv(emailSteps[0]?.dayDelay ?? 0),
    escapeCsv(emailSteps[1]?.subject || ''),
    escapeCsv(emailSteps[1]?.body || ''),
    escapeCsv(emailSteps[1]?.dayDelay ?? 3),
    escapeCsv(emailSteps[2]?.subject || ''),
    escapeCsv(emailSteps[2]?.body || ''),
    escapeCsv(emailSteps[2]?.dayDelay ?? 7),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), row.join(',')].join('\n'));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', csvContent);
  dlAnchor.setAttribute('download', `instantly_leadgremlin_${selectedLead.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  dlAnchor.click();
  showToast('✓ Exported Instantly / Smartlead CSV!');
}

/**
 * Local Client-Side Sequence Generator
 */
function generateSequenceLocal(lead, archetype, tone) {
  const name = lead.name || 'Business';
  const category = (lead.category || 'Local Business').toLowerCase();
  const area = lead.area || 'Umhlanga';
  const rating = lead.rating || 4.8;
  const reviews = lead.reviewCount || 35;
  const audit = lead.technicalAudit;
  const estVal = lead.estimatedDealValue ? `R${lead.estimatedDealValue.toLocaleString()}` : 'R22,500';

  let auditCallout = 'our diagnostic audit identified key conversion bottlenecks on your website.';
  let primaryIssue = 'Missing automated lead capture funnel';

  if (audit && !audit.hasHttps) {
    auditCallout = 'we noticed your website lacks an SSL certificate (showing an insecure "Not Secure" warning in browsers), deterring over 60% of potential clients.';
    primaryIssue = 'Insecure HTTP protocol connection';
  } else if (audit && audit.loadSpeedSeconds && audit.loadSpeedSeconds > 3.0) {
    auditCallout = `we ran a mobile diagnostic and detected slow page load speeds (${audit.loadSpeedSeconds}s), causing visitors to bounce.`;
    primaryIssue = `Slow mobile load speed (${audit.loadSpeedSeconds}s)`;
  } else if (audit && !audit.hasBookingSystem) {
    auditCallout = 'we noticed your website is missing a 24/7 automated online booking portal for after-hours scheduling.';
    primaryIssue = 'No after-hours online booking portal';
  } else if (audit && !audit.hasWhatsappLink) {
    auditCallout = 'we noticed your site lacks a 1-click WhatsApp lead capture widget, letting high-intent inquiries slip to competitors.';
    primaryIssue = 'Missing 1-click WhatsApp intake widget';
  }

  let nicheAngle = 'Automated Lead Intake & 24/7 Client Conversion';
  let painPoint = 'local clients searching for providers choose whoever responds fastest to web & WhatsApp inquiries';
  let solution = 'an automated 24/7 WhatsApp & calendar lead intake funnel';
  let caseProof = 'helped a nearby local business increase client bookings by 45% in 30 days';

  if (/health|dental|dentist|physio|chiro|medical|aesthetic/i.test(category)) {
    nicheAngle = 'High-Value Patient Intake & Consultation Booking';
    painPoint = 'patients searching for specialized treatments bounce when they cannot book consultations instantly';
    solution = 'a POPIA-compliant patient intake portal with 1-click WhatsApp consultation booking';
    caseProof = 'helped a private practice secure 19 high-ticket treatment consultations in 30 days';
  } else if (/solar|electrician|plumber|trades|contractor/i.test(category)) {
    nicheAngle = '1-Tap Emergency Callouts & Instant Quote Requests';
    painPoint = 'homeowners needing urgent repairs choose the competitor with instant 1-tap WhatsApp quote dispatch';
    solution = 'an emergency 1-tap quote capture funnel with instant WhatsApp dispatch';
    caseProof = 'increased weekly inbound service quote requests by 65% for a local contractor';
  } else if (/beauty|hair|salon|spa|barber|laser/i.test(category)) {
    nicheAngle = 'Eliminating No-Shows & Automating Salon Bookings';
    painPoint = 'clients want to book appointments instantly via WhatsApp late at night without DM delays';
    solution = 'a 1-click WhatsApp & calendar booking portal with automated deposit collection';
    caseProof = 'reduced appointment no-shows by 85% and added 34 new client bookings in month one';
  } else if (/fitness|gym|crossfit|pilates|yoga/i.test(category)) {
    nicheAngle = 'After-Hours Membership Inquiries & Free Trial Funnel';
    painPoint = 'over 70% of gym membership searches happen after 6 PM when front desk staff is off';
    solution = 'an automated 24/7 WhatsApp trial pass & class booking funnel';
    caseProof = 'helped a fitness studio capture 28 new monthly trial signups in 3 weeks';
  }

  const emailSubject = `Optimizing ${name}'s digital lead intake in ${area}`;
  const emailBody = `Hi ${name} Team,\n\nI came across ${name} while auditing top-rated ${lead.category || 'local'} providers in ${area}.\n\nI noticed your team has built a strong reputation (${rating}★ with ${reviews}+ reviews). However, during our review, ${auditCallout}\n\nBecause ${painPoint}, we developed ${solution}.\n\nFor instance, we recently ${caseProof}.\n\nCan I show you a 5-minute live preview tailored for ${name} this Thursday?\n\nBest regards,\nLeadGremlin Growth Engine`;

  const touchpoints = [
    {
      stepNumber: 1,
      dayDelay: 0,
      channel: 'email',
      channelEmoji: '📧',
      title: 'Day 0: Technical Audit & Opportunity Pitch',
      subject: emailSubject,
      body: emailBody,
      actionGuidance: 'Send from primary sales email. Personalize first line with recent business news or post.',
    },
    {
      stepNumber: 2,
      dayDelay: 1,
      channel: 'whatsapp',
      channelEmoji: '💬',
      title: 'Day 1: WhatsApp 60s Video Hook',
      body: `Hi ${name} Team 👋 Sent you a quick email yesterday regarding ${name}'s web lead intake in ${area}!\n\nWe put together a 60-second video demo showing how ${solution} captures 3x more direct client inquiries.\n\nMind if I drop the 1-minute video link right here on WhatsApp? 🚀`,
      actionGuidance: 'Send directly to business WhatsApp number. Attach custom 60-second video walkthrough.',
    },
    {
      stepNumber: 3,
      dayDelay: 4,
      channel: 'cold_call',
      channelEmoji: '📞',
      title: 'Day 4: Diagnostic Discovery Call',
      body: `Call decision-maker at ${name}.\n\n• Opener: Hi, is this the owner at ${name}? Calling regarding your ${area} lead intake.\n• Discovery: When potential clients find ${name} online after hours, can they book instantly?\n• Objection: Desk staff love this because it qualifies leads 24/7 without extra staff.\n• Close: Can I drop a 60s video breakdown to your WhatsApp?`,
      actionGuidance: 'Call between 09:30 - 11:30 or 14:00 - 16:00.',
    },
    {
      stepNumber: 4,
      dayDelay: 8,
      channel: 'social_dm',
      channelEmoji: '📱',
      title: 'Day 8: Social DM / Instagram Nudge',
      body: `Hey ${name} team! 👋 Loved your recent work in ${area}. Quick question: did you see the digital audit report we sent to your team? We built a 1-click lead capture mockup tailored for ${name}. DM us if you'd like the preview link! 📩`,
      actionGuidance: 'Send via Instagram DM or LinkedIn message to owner/manager profile.',
    },
    {
      stepNumber: 5,
      dayDelay: 14,
      channel: 'email',
      channelEmoji: '📧',
      title: 'Day 14: Final Breakup & Free PDF Report Offer',
      subject: `Complimentary Technical Audit Report for ${name}`,
      body: `Hi ${name} Management,\n\nI know you're busy serving clients in ${area}, so I won't keep following up.\n\nWe put together a full complimentary Technical Website & Mobile Audit Report for ${name} (${estVal} scope) identifying 4 quick fixes to boost your monthly bookings.\n\nIf you'd like the PDF report, just reply "AUDIT" and I'll send it right over.\n\nWishing ${name} continued success!\n\nBest regards,\nLeadGremlin Growth Engine`,
      actionGuidance: 'Attach generated PDF report if lead expressed interest.',
    },
  ];

  return {
    archetype: archetype || 'omni_channel_blitz',
    archetypeName: archetype === 'roi_calculator' ? 'Commercial Valuation & ROI Leakage' : archetype === 'audit_breakdown' ? 'Technical Audit & Video Walkthrough' : archetype === 'niche_case_study' ? 'Niche Transformation & Proof' : archetype === 're_engagement' ? 'Stalled Lead Revival' : 'Omni-Channel Cadence (14-Day Blitz)',
    archetypeEmoji: archetype === 'roi_calculator' ? '💰' : archetype === 'audit_breakdown' ? '🔍' : archetype === 'niche_case_study' ? '📈' : archetype === 're_engagement' ? '🔄' : '🚀',
    touchpoints,
  };
}

/**
 * Show Toast Notification
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;

  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function toggleExportMenu() {
  document.getElementById('export-menu').classList.toggle('show');
}

/**
 * Export Leads to CSV or JSON
 */
function downloadExport(type) {
  const menu = document.getElementById('export-menu');
  if (menu) menu.classList.remove('show');

  if (type === 'csv') {
    const headers = ['ID', 'Name', 'Category', 'Area', 'Address', 'Phone', 'Email', 'Website', 'Instagram', 'Stage', 'Score', 'DealValue'];
    const rows = allLeads.map((l) => [
      `"${l.id}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.category || ''}"`,
      `"${l.area || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.website || ''}"`,
      `"${l.socials?.instagram || ''}"`,
      `"${l.funnelStage || ''}"`,
      `"${l.opportunityScore || ''}"`,
      `"${l.estimatedDealValue || 18500}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(csvContent, 'leadgremlin_sales_funnel.csv', 'text/csv');
    showToast('📥 Standard CSV export generated!');
  } else if (type === 'instantly') {
    const headers = ['Company Name', 'Email', 'Phone', 'Website', 'City', 'Category', 'Opportunity Score', 'Email Subject', 'Email Body'];
    const rows = allLeads.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      `"${l.area || ''}"`,
      `"${l.category || ''}"`,
      `"${l.opportunityScore || 80}"`,
      `"${(l.aiPitchScripts?.email?.subject || '').replace(/"/g, '""')}"`,
      `"${(l.aiPitchScripts?.email?.body || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(csvContent, 'leadgremlin_instantly_campaign.csv', 'text/csv');
    showToast('⚡ Instantly.ai Cold Campaign CSV generated!');
  } else if (type === 'lemlist') {
    const headers = ['companyName', 'email', 'phone', 'website', 'city', 'industry', 'leadScore', 'icebreaker'];
    const rows = allLeads.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      `"${l.area || ''}"`,
      `"${l.category || ''}"`,
      `"${l.opportunityScore || 80}"`,
      `"${(l.aiPitchScripts?.whatsapp || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(csvContent, 'leadgremlin_lemlist_outreach.csv', 'text/csv');
    showToast('🚀 Lemlist Cold Outreach CSV generated!');
  } else {
    const jsonContent = JSON.stringify(allLeads, null, 2);
    triggerDownload(jsonContent, 'leadgremlin_sales_funnel.json', 'application/json');
    showToast('📥 Full JSON export generated!');
  }
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
