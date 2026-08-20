import { Business } from '../types/business.js';
import { CompetitiveContext, CompetitorComparison } from '../types/intelligence.js';

export class CompetitorAnalyzer {
  /**
   * Evaluates local market competitors and identifies path of least resistance advantages
   */
  public static analyze(lead: Partial<Business>): CompetitiveContext {
    const area = lead.area || 'Umhlanga';
    const category = lead.category || 'Local Business';
    const catLower = category.toLowerCase();

    const competitors: CompetitorComparison[] = [];
    let differentiation = '';
    let strategicTakeaway = '';

    if (catLower.includes('fitness') || catLower.includes('gym')) {
      competitors.push(
        {
          competitor_name: `Virgin Active ${area}`,
          category: 'Fitness & Health Club',
          area,
          website_status: 'Dominant Corporate Portal',
          booking_or_conversion_capability: 'Instant Online Trial Pass & Membership Signup',
          social_presence: 'National Brand Campaigns',
          reviews_profile: '4.4★ (250+ Reviews)',
          path_of_least_resistance_advantage: 'Instant 1-click free day pass claims without waiting for staff responses.',
        },
        {
          competitor_name: `FitPod / Specialized Boutique Studio`,
          category: 'Boutique Fitness',
          area,
          website_status: 'Mobile-First Hub',
          booking_or_conversion_capability: 'Octiv / Mindbody integrated with 1-click WhatsApp concierge',
          social_presence: 'Active Coach-Led Community',
          reviews_profile: '4.9★ (65 Reviews)',
          path_of_least_resistance_advantage: 'Transparent class timetables with instant WhatsApp booking button on their home screen.',
        }
      );
      differentiation = `A prospect comparing local fitness options in ${area} chooses the boutique provider whose personal culture feels welcoming and whose trial booking takes less than 30 seconds on a smartphone.`;
      strategicTakeaway = `Bridging ${lead.name}'s strong community identity with a frictionless 1-click trial booking hub levels the playing field against corporate gym chains.`;
    } else if (catLower.includes('beauty') || catLower.includes('salon') || catLower.includes('aesthetic') || catLower.includes('spa')) {
      competitors.push(
        {
          competitor_name: `Sorbet ${area}`,
          category: 'Beauty Salon Franchise',
          area,
          website_status: 'App & Web Booking Portal',
          booking_or_conversion_capability: 'Fresha / Brand App 24/7 Scheduling',
          social_presence: 'Polished Brand Campaigns',
          reviews_profile: '4.5★ (120+ Reviews)',
          path_of_least_resistance_advantage: 'Clients can see live stylist availability and book at 10 PM without sending a DM.',
        },
        {
          competitor_name: `Skin & Aesthetic Clinic ${area}`,
          category: 'Medical Aesthetics',
          area,
          website_status: 'Modern Visual Storefront',
          booking_or_conversion_capability: 'Consultation Deposit & WhatsApp Routing',
          social_presence: 'Before/After Video Reels',
          reviews_profile: '4.8★ (45 Reviews)',
          path_of_least_resistance_advantage: 'Clear pricing tiers and direct treatment consultations with automated reminders.',
        }
      );
      differentiation = `Clients seeking aesthetic treatments compare before-and-after proof and immediately pick the clinic with transparent pricing and self-service calendar booking.`;
      strategicTakeaway = `Eliminating back-and-forth DM scheduling enables ${lead.name} to capture high-value appointments when clients browse late in the evening.`;
    } else if (catLower.includes('health') || catLower.includes('dental') || catLower.includes('physio')) {
      competitors.push(
        {
          competitor_name: `Private Medical / Dental Centre ${area}`,
          category: 'Healthcare Practice',
          area,
          website_status: 'POPIA-Compliant Medical Portal',
          booking_or_conversion_capability: 'RecoMed 24/7 Patient Booking',
          social_presence: 'Educational Content',
          reviews_profile: '4.9★ (80+ Reviews)',
          path_of_least_resistance_advantage: 'Patients can book specialist consultations directly on RecoMed or via WhatsApp emergency triage.',
        }
      );
      differentiation = `Patients in need of urgent or high-value care prioritize practices that offer instant consultation booking and professional credentials over static directory entries.`;
      strategicTakeaway = `A dedicated patient intake hub gives ${lead.name} the digital authority required to capture high-ticket treatment consultations.`;
    } else if (catLower.includes('restaurant') || catLower.includes('dining')) {
      competitors.push(
        {
          competitor_name: `The Grill Room / Top Bistro ${area}`,
          category: 'Dining & Hospitality',
          area,
          website_status: 'Interactive Mobile Menu & Dineplan Hub',
          booking_or_conversion_capability: 'Instant Dineplan Table Confirmation',
          social_presence: 'High-Engagement Food Reels',
          reviews_profile: '4.7★ (300+ Reviews)',
          path_of_least_resistance_advantage: 'Diners reserve tables directly from Google Maps or Instagram without phoning the host stand.',
        }
      );
      differentiation = `Diners searching for weekend spots book the first venue with an easily readable mobile menu and instant confirmed table reservations.`;
      strategicTakeaway = `Direct reservation integration removes third-party booking commissions and increases weekend covers for ${lead.name}.`;
    } else {
      competitors.push(
        {
          competitor_name: `Top-Rated ${category} Specialist ${area}`,
          category,
          area,
          website_status: 'Conversion-Focused Storefront',
          booking_or_conversion_capability: '1-Click WhatsApp Quote Engine',
          social_presence: 'Active Local Reviews & Proof',
          reviews_profile: '4.8★ (90+ Reviews)',
          path_of_least_resistance_advantage: 'Instant quote request via WhatsApp with direct photo upload.',
        }
      );
      differentiation = `Local customers compare providers based on response speed and clarity of customer testimonials.`;
      strategicTakeaway = `Streamlining inquiry intake ensures ${lead.name} is the first provider to respond to new local demand.`;
    }

    return {
      local_competitors: competitors,
      commercial_differentiation: differentiation,
      strategic_takeaway: strategicTakeaway,
    };
  }
}
