import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CategoryClassifier } from '../src/utils/categoryClassifier.js';

describe('CategoryClassifier', () => {
  it('classifies fitness and gym businesses', () => {
    assert.equal(CategoryClassifier.classify('Virgin Active Durban North', 'gym', 'fitness'), 'Fitness');
    assert.equal(CategoryClassifier.classify('CrossFit Umhlanga', '', 'crossfit'), 'Fitness');
    assert.equal(CategoryClassifier.classify('Ballito Pilates & Yoga Studio', '', ''), 'Fitness');
  });

  it('classifies beauty, hair, and aesthetics', () => {
    assert.equal(CategoryClassifier.classify('Sorbet Salon Gateway', 'beauty salon', ''), 'Beauty and Hair');
    assert.equal(CategoryClassifier.classify('Umhlanga Laser & Aesthetic Clinic', '', ''), 'Beauty and Hair');
    assert.equal(CategoryClassifier.classify('Durban North Barber Co', 'barbershop', ''), 'Beauty and Hair');
  });

  it('classifies healthcare, dental, and medical', () => {
    assert.equal(CategoryClassifier.classify('Dr Smith Dental Studio', 'dentist', ''), 'Healthcare & Wellness');
    assert.equal(CategoryClassifier.classify('Gateway Physiotherapy Clinic', 'physiotherapist', ''), 'Healthcare & Wellness');
    assert.equal(CategoryClassifier.classify('Ballito Chiropractor & Wellness', '', ''), 'Healthcare & Wellness');
  });

  it('classifies restaurants and dining', () => {
    assert.equal(CategoryClassifier.classify('The Ocean Terrace Cafe', 'restaurant', ''), 'Restaurant');
    assert.equal(CategoryClassifier.classify('Umhlanga Grill & Bar', '', 'steakhouse'), 'Restaurant');
    assert.equal(CategoryClassifier.classify('Durban Coffee Works', 'coffee shop', ''), 'Restaurant');
  });

  it('classifies professional services and trades', () => {
    assert.equal(CategoryClassifier.classify('Cox & Partners Attorneys', 'law firm', ''), 'Professional Services');
    assert.equal(CategoryClassifier.classify('Umhlanga Solar & Electrical', 'electrician', 'solar power'), 'Automotive & Trades');
    assert.equal(CategoryClassifier.classify('Ballito Panelbeaters & Auto Repair', 'auto body shop', ''), 'Automotive & Trades');
  });
});
