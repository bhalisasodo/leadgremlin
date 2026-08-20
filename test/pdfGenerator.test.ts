import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PdfReportGenerator } from '../src/utils/pdfGenerator.js';
import { Business } from '../src/types/business.js';

describe('PdfReportGenerator', () => {
  const sampleLead: Business = {
    id: 'lead_test_1',
    name: 'Ballito Aesthetics Clinic',
    category: 'Beauty and Hair',
    area: 'Ballito',
    phone: '+27 32 946 1122',
    email: 'info@ballitoaesthetics.co.za',
    website: 'http://ballitoaesthetics.co.za',
    funnelStage: 'meeting',
    opportunityScore: 88,
    estimatedDealValue: 24000,
    technicalAudit: {
      hasHttps: false,
      hasResponsiveViewport: true,
      hasContactForm: true,
      hasBookingSystem: false,
      hasWhatsappLink: false,
      analyticsDetected: [],
      hasFavicon: true,
    },
    aiPitchScripts: {
      nicheAngle: 'Eliminating No-Shows & Automating Bookings',
      email: {
        subject: 'Optimizing Ballito Aesthetics Clinic lead intake',
        body: 'Hi Team,\n\nWe put together a technical audit report.',
      },
      whatsapp: 'Hi Team, quick 60s video breakdown for you!',
    },
  };

  it('generates a complete stand-alone printable HTML audit proposal', () => {
    const html = PdfReportGenerator.generateHtmlReport(sampleLead);

    assert.ok(html.includes('Ballito Aesthetics Clinic'), 'Should include business name');
    assert.ok(html.includes('Ballito'), 'Should include area');
    assert.ok(html.includes('88/100'), 'Should include opportunity score');
    assert.ok(html.includes('24,000') || html.includes('24 000'), 'Should include estimated project value');
    assert.ok(html.includes('Technical Infrastructure Diagnostic'), 'Should include tech table');
    assert.ok(html.includes('window.print()'), 'Should include print trigger');
  });
});
