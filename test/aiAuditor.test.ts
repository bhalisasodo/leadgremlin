import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIAuditor } from '../src/scoring/aiAuditor.js';

describe('AIAuditor', () => {
  it('generates comprehensive deterministic audit and pitch scripts without API keys', async () => {
    const auditor = new AIAuditor();

    const output = await auditor.generateAudit({
      businessName: 'Prime Umhlanga Crossfit',
      websiteUrl: 'http://primecrossfit.co.za',
      category: 'Fitness',
      area: 'Umhlanga',
      rating: 4.9,
      reviewCount: 42,
      technicalAudit: {
        hasHttps: false,
        hasContactForm: true,
        hasBookingSystem: false,
        hasWhatsappLink: false,
        socialLinks: { instagram: 'https://instagram.com/primecrossfit' },
        analyticsDetected: [],
        hasFavicon: true,
        hasResponsiveViewport: true,
      },
    });

    assert.ok(output.issues.length > 0, 'Should detect issues like missing HTTPS or booking system');
    assert.ok(output.recommendations.length > 0, 'Should provide recommendations');
    assert.ok(output.estimatedProjectValueZAR > 0, 'Should estimate project value in ZAR');
    assert.ok(output.multiChannelScripts, 'Should generate multiChannelScripts');

    if (output.multiChannelScripts) {
      assert.ok(output.multiChannelScripts.email.subject.length > 0);
      assert.ok(output.multiChannelScripts.email.body.includes('Prime Umhlanga Crossfit') || output.multiChannelScripts.email.body.includes('Umhlanga'));
      assert.ok(output.multiChannelScripts.whatsapp.length > 0);
      assert.ok(output.multiChannelScripts.coldCall.opener.length > 0);
    }
  });
});
