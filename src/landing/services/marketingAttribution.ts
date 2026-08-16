export const MARKETING_ATTRIBUTION_STORAGE_KEY = 'musliman_marketing_attribution';

const MAX_ATTRIBUTION_VALUE_LENGTH = 1000;
const attributionFields = [
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
  'fbclid',
] as const;
const storedAttributionFields = [
  ...attributionFields,
  'landing_page',
  'referrer',
] as const;

export type MarketingAttribution = Partial<Record<(typeof storedAttributionFields)[number], string>>;

function sanitizeAttributionValue(value: string | null) {
  const trimmed = (value || '').trim();

  return trimmed ? trimmed.slice(0, MAX_ATTRIBUTION_VALUE_LENGTH) : undefined;
}

function getStorage() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readStoredAttribution(): MarketingAttribution {
  const storage = getStorage();

  if (!storage) {
    return {};
  }

  try {
    const parsed = JSON.parse(storage.getItem(MARKETING_ATTRIBUTION_STORAGE_KEY) || '{}') as Record<string, unknown>;

    return storedAttributionFields.reduce<MarketingAttribution>((attribution, field) => {
      if (typeof parsed[field] === 'string') {
        const value = sanitizeAttributionValue(parsed[field]);

        if (value) {
          attribution[field] = value;
        }
      }

      return attribution;
    }, {});
  } catch {
    return {};
  }
}

function writeStoredAttribution(attribution: MarketingAttribution) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(MARKETING_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution is best-effort and must not affect form behavior.
  }
}

export function getMarketingAttribution(): MarketingAttribution {
  return readStoredAttribution();
}

export function captureMarketingAttribution(): MarketingAttribution {
  if (typeof window === 'undefined') {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search);
  const currentTouch = attributionFields.reduce<MarketingAttribution>((attribution, field) => {
    const value = sanitizeAttributionValue(searchParams.get(field));

    if (value) {
      attribution[field] = value;
    }

    return attribution;
  }, {});

  if (Object.keys(currentTouch).length === 0) {
    return getMarketingAttribution();
  }

  const landingPage = sanitizeAttributionValue(window.location.href);
  const referrer = typeof document !== 'undefined' ? sanitizeAttributionValue(document.referrer) : undefined;
  const nextAttribution: MarketingAttribution = {
    ...getMarketingAttribution(),
    ...currentTouch,
  };

  if (landingPage) {
    nextAttribution.landing_page = landingPage;
  }

  if (referrer) {
    nextAttribution.referrer = referrer;
  }

  writeStoredAttribution(nextAttribution);

  return nextAttribution;
}
