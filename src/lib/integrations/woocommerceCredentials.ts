type GenericSettings = Record<string, unknown> | undefined | null;

const STORE_URL_KEYS = [
  'storeUrl',
  'wooStoreUrl',
  'woocommerceUrl',
  'shopUrl',
  'url',
  'websiteUrl',
] as const;

const WOO_KEY_KEYS = [
  'wooKey',
  'consumerKey',
  'wooConsumerKey',
  'consumer_key',
  'wcKey',
  'key',
] as const;

const WOO_SECRET_KEYS = [
  'wooSecret',
  'consumerSecret',
  'wooConsumerSecret',
  'consumer_secret',
  'wcSecret',
  'secret',
] as const;

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const isMaskedWooCredential = (value: string): boolean => {
  const compact = value.replace(/\s+/g, '');
  if (!compact) return false;
  if (/^\[?REDACTED\]?$/i.test(compact)) return true;
  if (/^[•*#]+$/.test(compact)) return true;
  if (/^x{6,}$/i.test(compact)) return true;
  return false;
};

const pickFirstValid = (
  settings: GenericSettings,
  keys: readonly string[],
  options?: { allowMasked?: boolean }
): string => {
  if (!settings) return '';
  const allowMasked = options?.allowMasked ?? false;
  for (const key of keys) {
    const value = normalizeText(settings[key]);
    if (!value) continue;
    if (!allowMasked && isMaskedWooCredential(value)) continue;
    return value;
  }
  return '';
};

export type WooCredentials = {
  storeUrl: string;
  wooKey: string;
  wooSecret: string;
};

export const resolveWooCredentials = (settings: GenericSettings): WooCredentials => ({
  storeUrl: pickFirstValid(settings, STORE_URL_KEYS, { allowMasked: true }),
  wooKey: pickFirstValid(settings, WOO_KEY_KEYS),
  wooSecret: pickFirstValid(settings, WOO_SECRET_KEYS),
});

export const hasWooCredentials = (settings: GenericSettings): boolean => {
  const creds = resolveWooCredentials(settings);
  return Boolean(creds.storeUrl && creds.wooKey && creds.wooSecret);
};

