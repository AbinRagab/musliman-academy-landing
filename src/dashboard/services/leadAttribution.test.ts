import { describe, expect, it } from 'vitest';
import {
  getLeadAcquisition,
  getMarketingAttributionDisplayItems,
  hasMarketingAttribution,
  leadMatchesAttributionSearch,
  marketingAttributionFieldKeys,
} from './leadAttribution';
import type { LeadRecord } from './leadsService';

function lead(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    id: 'lead-1',
    full_name: 'Test Parent',
    whatsapp: '+201000000000',
    country: 'Egypt',
    student_age: null,
    program_id: null,
    program_name: null,
    preferred_time: null,
    message: null,
    source: 'website',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    campaign_id: null,
    adset_id: null,
    ad_id: null,
    campaign_name: null,
    adset_name: null,
    ad_name: null,
    landing_page: null,
    referrer: null,
    fbclid: null,
    form_type: null,
    lead_type: 'student',
    status: 'new',
    assigned_to: null,
    assigned_teacher_id: null,
    last_contact_at: null,
    next_follow_up_at: null,
    notes: null,
    lead_priority: null,
    lost_reason: null,
    converted_student_id: null,
    created_at: '2026-08-16T00:00:00.000Z',
    updated_at: '2026-08-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('lead attribution dashboard helpers', () => {
  it('lists every stored attribution field for CSV export', () => {
    expect(marketingAttributionFieldKeys).toEqual([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'campaign_id',
      'adset_id',
      'ad_id',
      'campaign_name',
      'adset_name',
      'ad_name',
      'landing_page',
      'referrer',
      'fbclid',
    ]);
  });

  it('falls back to the existing source when no UTM source exists', () => {
    expect(getLeadAcquisition(lead({ source: 'dashboard' }))).toEqual({
      primary: 'dashboard',
      secondary: null,
      tertiary: null,
    });
  });

  it('uses marketing attribution for acquisition when available', () => {
    expect(getLeadAcquisition(lead({
      source: 'website',
      utm_source: 'facebook',
      utm_campaign: 'trial-utm',
      campaign_name: 'Ramadan Trial',
      ad_name: 'Parent Video',
    }))).toEqual({
      primary: 'facebook',
      secondary: 'Ramadan Trial',
      tertiary: 'Parent Video',
    });
  });

  it('only reports attribution as present when a stored field has a value', () => {
    expect(hasMarketingAttribution(lead())).toBe(false);
    expect(hasMarketingAttribution(lead({ utm_medium: 'paid-social' }))).toBe(true);
  });

  it('builds drawer display rows with readable labels and campaign fallback', () => {
    expect(getMarketingAttributionDisplayItems(lead({
      utm_campaign: 'trial-utm',
      adset_name: 'Parents',
      fbclid: 'fb-click-id',
    }))).toEqual([
      { label: 'Campaign', value: 'trial-utm' },
      { label: 'Ad Set', value: 'Parents' },
      { label: 'UTM Campaign', value: 'trial-utm' },
      { label: 'Facebook Click ID', value: 'fb-click-id' },
    ]);
  });

  it('matches campaign-aware search fields', () => {
    const attributedLead = lead({
      utm_source: 'facebook',
      campaign_name: 'Summer Quran',
      adset_name: 'Mothers',
      ad_name: 'Trial Ad',
    });

    expect(leadMatchesAttributionSearch(attributedLead, 'summer')).toBe(true);
    expect(leadMatchesAttributionSearch(attributedLead, 'mothers')).toBe(true);
    expect(leadMatchesAttributionSearch(attributedLead, 'missing')).toBe(false);
  });
});
