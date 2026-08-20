/**
 * Category Classifier for LeadGremlin
 * Categorizes businesses into primary prospect groups and specialized niches for sales funnels
 */

export type ProspectCategory =
  | 'Fitness'
  | 'Beauty and Hair'
  | 'Restaurant'
  | 'Healthcare & Wellness'
  | 'Real Estate'
  | 'Professional Services'
  | 'Automotive & Trades'
  | 'Retail & Shopping'
  | 'Other Business';

export class CategoryClassifier {
  /**
   * Classifies a business based on name, raw category, or search term
   */
  public static classify(name: string = '', rawCategory: string = '', searchTerm: string = ''): ProspectCategory {
    const text = `${name} ${rawCategory} ${searchTerm}`.toLowerCase();

    // 1. Fitness & Athletics
    if (
      /gym|fitness|crossfit|pilates|yoga|workout|personal trainer|training center|athletic|sports club|boxing|mma|bodybuilding|ems fitness|martial arts|jiu jitsu|swimming school/i.test(
        text
      )
    ) {
      return 'Fitness';
    }

    // 2. Beauty, Hair & Aesthetics
    if (
      /hair|salon|beauty|spa|barber|aesthetic|nail|skin|massage|brows|lashes|waxing|hairstylist|dermatolog|med spa|laser clinic|cosmetolog|microblading/i.test(
        text
      )
    ) {
      return 'Beauty and Hair';
    }

    // 3. Healthcare & Wellness
    if (
      /dentist|dental|orthodont|physio|physiotherapy|doctor|clinic|medical|health|optometrist|eyecare|chiro|chiropractor|pharmacy|wellness|mental health|psycholog|pediatrician|audiolog|biokineticist/i.test(
        text
      )
    ) {
      return 'Healthcare & Wellness';
    }

    // 4. Restaurant & Hospitality
    if (
      /restaurant|cafe|coffee|bistro|bar|grill|dining|bakery|diner|eatery|food|kitchen|pub|pizzeria|sushi|steakhouse|hotel|lounge|catering|venue|brewery|cocktail/i.test(
        text
      )
    ) {
      return 'Restaurant';
    }

    // 5. Real Estate & Property
    if (
      /real estate|property|realty|estate agent|interior design|architect|property management|homes|constructions|developer|remax|pam golding|seeff|villa rental/i.test(
        text
      )
    ) {
      return 'Real Estate';
    }

    // 6. Professional & Corporate Services
    if (
      /law|attorney|legal|advocate|conveyanc|accountant|accounting|audit|tax|marketing|digital agency|consultant|consulting|financial|recruitment|software|it services|commercial cleaning|security company/i.test(
        text
      )
    ) {
      return 'Professional Services';
    }

    // 7. Automotive & Trades (Solar, Electrical, Plumbing, HVAC)
    if (
      /auto|car|mechanic|detailing|workshop|panelbeater|tyres|tires|electrician|plumber|contractor|garage|repair|solar|roofing|hvac|air conditioning|renovation|pest control|towing|locksmith|pool service/i.test(
        text
      )
    ) {
      return 'Automotive & Trades';
    }

    // 8. Retail & Shopping
    if (/boutique|store|shop|fashion|jewel|apparel|clothing|gift|florist|furniture/i.test(text)) {
      return 'Retail & Shopping';
    }

    return 'Other Business';
  }

  /**
   * Detects a specific high-value subcategory niche tag for hyper-personalized messaging
   */
  public static detectSubcategory(name: string = '', rawCategory: string = '', searchTerm: string = ''): string {
    const text = `${name} ${rawCategory} ${searchTerm}`.toLowerCase();

    if (/dentist|dental|orthodont/i.test(text)) return 'Cosmetic Dentist & Oral Clinic';
    if (/physio|chiropractor|biokinetic/i.test(text)) return 'Physiotherapy & Sports Injury';
    if (/solar|photovoltaic/i.test(text)) return 'Solar & Renewable Energy';
    if (/electrician/i.test(text)) return 'Electrical Contracting';
    if (/plumber/i.test(text)) return 'Plumbing & Gas Services';
    if (/crossfit/i.test(text)) return 'CrossFit Box';
    if (/pilates|yoga/i.test(text)) return 'Pilates & Yoga Studio';
    if (/med spa|aesthetic|dermatolog/i.test(text)) return 'Medical Spa & Aesthetics';
    if (/barber/i.test(text)) return 'Barber Shop & Grooming';
    if (/law|attorney|legal/i.test(text)) return 'Law Firm & Legal Practice';
    if (/accountant|accounting|tax/i.test(text)) return 'Chartered Accounting & Tax';
    if (/real estate|estate agent|property/i.test(text)) return 'Real Estate Agency';
    if (/detailing|ceramic coating/i.test(text)) return 'Auto Detailing & Protection';
    if (/restaurant|fine dining|steakhouse/i.test(text)) return 'Restaurant & Dining';

    return 'Local Business';
  }
}
