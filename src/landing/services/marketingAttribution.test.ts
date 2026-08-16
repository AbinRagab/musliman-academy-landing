import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MARKETING_ATTRIBUTION_STORAGE_KEY,
  captureMarketingAttribution,
  getMarketingAttribution,
} from './marketingAttribution';

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

function setLocationSearch(search: string) {
  window.history.pushState({}, '', `/${search}`);
}

function setReferrer(referrer: string) {
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: referrer,
  });
}

describe('marketing attribution', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLocationSearch('');
    setReferrer('https://referrer.example/source');
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }

    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('reads UTM parameters correctly', () => {
    setLocationSearch('?utm_source=facebook&utm_medium=paid&utm_campaign=summer&utm_content=video&utm_term=quran');

    expect(captureMarketingAttribution()).toMatchObject({
      utm_source: 'facebook',
      utm_medium: 'paid',
      utm_campaign: 'summer',
      utm_content: 'video',
      utm_term: 'quran',
      landing_page: window.location.href,
      referrer: 'https://referrer.example/source',
    });
  });

  it('reads campaign and ad IDs and names correctly', () => {
    setLocationSearch('?campaign_id=cmp-1&adset_id=set-1&ad_id=ad-1&campaign_name=Main&adset_name=Parents&ad_name=Trial');

    expect(captureMarketingAttribution()).toMatchObject({
      campaign_id: 'cmp-1',
      adset_id: 'set-1',
      ad_id: 'ad-1',
      campaign_name: 'Main',
      adset_name: 'Parents',
      ad_name: 'Trial',
    });
  });

  it('captures fbclid', () => {
    setLocationSearch('?fbclid=fb-click-id');

    expect(captureMarketingAttribution()).toMatchObject({
      fbclid: 'fb-click-id',
    });
  });

  it('ignores unrelated parameters and empty values', () => {
    setLocationSearch('?utm_source=&utm_medium=%20paid%20&unknown=value');

    expect(captureMarketingAttribution()).toEqual({
      utm_medium: 'paid',
      landing_page: window.location.href,
      referrer: 'https://referrer.example/source',
    });
  });

  it('persists attribution', () => {
    setLocationSearch('?utm_source=facebook&utm_campaign=trial');
    captureMarketingAttribution();

    expect(JSON.parse(window.localStorage.getItem(MARKETING_ATTRIBUTION_STORAGE_KEY) || '{}')).toMatchObject({
      utm_source: 'facebook',
      utm_campaign: 'trial',
    });
    expect(getMarketingAttribution()).toMatchObject({
      utm_source: 'facebook',
      utm_campaign: 'trial',
    });
  });

  it('does not erase stored attribution when the URL has no attribution', () => {
    setLocationSearch('?utm_source=facebook&utm_campaign=trial');
    captureMarketingAttribution();

    setLocationSearch('?page=pricing');

    expect(captureMarketingAttribution()).toMatchObject({
      utm_source: 'facebook',
      utm_campaign: 'trial',
    });
  });

  it('updates stored attribution when a later campaign URL is captured', () => {
    setLocationSearch('?utm_source=facebook&utm_campaign=trial');
    captureMarketingAttribution();

    setLocationSearch('?utm_campaign=summer&ad_id=ad-2');

    expect(captureMarketingAttribution()).toMatchObject({
      utm_source: 'facebook',
      utm_campaign: 'summer',
      ad_id: 'ad-2',
      landing_page: window.location.href,
    });
  });

  it('does not throw when localStorage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage unavailable');
      },
    });
    setLocationSearch('?utm_source=facebook');

    expect(() => captureMarketingAttribution()).not.toThrow();
    expect(() => getMarketingAttribution()).not.toThrow();
  });

  it('does not throw when the browser environment is unavailable', () => {
    vi.stubGlobal('window', undefined);

    expect(() => captureMarketingAttribution()).not.toThrow();
    expect(() => getMarketingAttribution()).not.toThrow();
  });
});
