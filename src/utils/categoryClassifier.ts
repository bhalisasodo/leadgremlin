/**
 * Category Classifier for LeadGremlin
 * Categorizes businesses into primary prospect groups for sales funnels
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

    // 1. Fitness
    if (
      /gym|fitness|crossfit|pilates|yoga|workout|personal trainer|training center|athletic|sports club|boxing|mma|bodybuilding/i.test(
        text
      )
    ) {
      return 'Fitness';
    }

    // 2. Beauty and Hair
    if (
      /hair|salon|beauty|spa|barber|aesthetic|nail|skin|massage|brows|lashes|waxing|hairstylist|dermatolog/i.test(
        text
      )
    ) {
      return 'Beauty and Hair';
    }

    // 3. Restaurant & Hospitality
    if (
      /restaurant|cafe|coffee|bistro|bar|grill|dining|bakery|diner|eatery|food|kitchen|pub|pizzeria|sushi|steakhouse|hotel|lounge/i.test(
        text
      )
    ) {
      return 'Restaurant';
    }

    // 4. Healthcare & Wellness
    if (
      /dentist|dental|physio|physiotherapy|doctor|clinic|medical|health|optometrist|eyecare|chiro|chiropractor|pharmacy|wellness|mental health|psycholog/i.test(
        text
      )
    ) {
      return 'Healthcare & Wellness';
    }

    // 5. Real Estate & Property
    if (
      /real estate|property|realty|estate agent|interior design|architect|property management|homes|constructions|developer/i.test(
        text
      )
    ) {
      return 'Real Estate';
    }

    // 6. Professional Services
    if (
      /law|attorney|legal|accountant|accounting|audit|tax|marketing|digital agency|consultant|consulting|financial|recruitment|software|it services/i.test(
        text
      )
    ) {
      return 'Professional Services';
    }

    // 7. Automotive & Trades
    if (
      /auto|car|mechanic|detailing|workshop|panelbeater|tyres|tires|electrician|plumber|contractor|garage|repair/i.test(
        text
      )
    ) {
      return 'Automotive & Trades';
    }

    // 8. Retail & Shopping
    if (/boutique|store|shop|fashion|jewel|apparel|clothing|gift/i.test(text)) {
      return 'Retail & Shopping';
    }

    return 'Other Business';
  }
}
