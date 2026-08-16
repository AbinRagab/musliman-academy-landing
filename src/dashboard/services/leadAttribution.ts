import type { LeadRecord } from './leadsService';

export const marketingAttributionFieldKeys = [
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
] as const;

export const marketingAttributionSearchKeys = [
  'utm_source',
  'utm_campaign',
  'campaign_name',
  'adset_name',
  'ad_name',
] as const;

type AttributionFieldKey = (typeof marketingAttributionFieldKeys)[number];
type AttributionSearchKey = (typeof marketingAttributionSearchKeys)[number];
type AttributionDisplayItem = { label: string; value: string };

function cleanValue(value?: string | null) {
  return value?.trim() || null;
}

function getFieldValue(lead: LeadRecord, key: AttributionFieldKey | AttributionSearchKey) {
  return cleanValue(lead[key]);
}

export function hasMarketingAttribution(lead: LeadRecord) {
  return marketingAttributionFieldKeys.some((key) => Boolean(getFieldValue(lead, key)));
}

export function getLeadAcquisition(lead: LeadRecord) {
  return {
    primary: getFieldValue(lead, 'utm_source') || cleanValue(lead.source) || 'website',
    secondary: getFieldValue(lead, 'campaign_name') || getFieldValue(lead, 'utm_campaign'),
    tertiary: getFieldValue(lead, 'ad_name'),
  };
}

export function leadMatchesAttributionSearch(lead: LeadRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return marketingAttributionSearchKeys.some((key) => (getFieldValue(lead, key) || '').toLowerCase().includes(normalizedQuery));
}

export function getMarketingAttributionDisplayItems(lead: LeadRecord): AttributionDisplayItem[] {
  const items: Array<{ label: string; value?: string | null }> = [
    { label: 'Source', value: getFieldValue(lead, 'utm_source') },
    { label: 'Medium', value: getFieldValue(lead, 'utm_medium') },
    { label: 'Campaign', value: getFieldValue(lead, 'campaign_name') || getFieldValue(lead, 'utm_campaign') },
    { label: 'Ad Set', value: getFieldValue(lead, 'adset_name') },
    { label: 'Ad', value: getFieldValue(lead, 'ad_name') },
    { label: 'Campaign ID', value: getFieldValue(lead, 'campaign_id') },
    { label: 'Ad Set ID', value: getFieldValue(lead, 'adset_id') },
    { label: 'Ad ID', value: getFieldValue(lead, 'ad_id') },
    { label: 'UTM Campaign', value: getFieldValue(lead, 'utm_campaign') },
    { label: 'UTM Content', value: getFieldValue(lead, 'utm_content') },
    { label: 'UTM Term', value: getFieldValue(lead, 'utm_term') },
    { label: 'Landing Page', value: getFieldValue(lead, 'landing_page') },
    { label: 'Referrer', value: getFieldValue(lead, 'referrer') },
    { label: 'Facebook Click ID', value: getFieldValue(lead, 'fbclid') },
  ];

  return items.reduce<AttributionDisplayItem[]>((visibleItems, item) => {
    if (item.value) {
      visibleItems.push({ label: item.label, value: item.value });
    }

    return visibleItems;
  }, []);
}
