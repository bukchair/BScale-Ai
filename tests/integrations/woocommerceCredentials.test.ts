import { describe, expect, it } from 'vitest';
import {
  hasWooCredentials,
  resolveWooCredentials,
} from '../../src/lib/integrations/woocommerceCredentials';

describe('resolveWooCredentials', () => {
  it('reads canonical woo settings keys', () => {
    const creds = resolveWooCredentials({
      storeUrl: 'https://shop.example.com',
      wooKey: 'ck_live_123',
      wooSecret: 'cs_live_456',
    });

    expect(creds).toEqual({
      storeUrl: 'https://shop.example.com',
      wooKey: 'ck_live_123',
      wooSecret: 'cs_live_456',
    });
  });

  it('supports legacy consumer key aliases', () => {
    const creds = resolveWooCredentials({
      url: 'https://legacy-shop.example.com',
      consumerKey: 'ck_legacy',
      consumerSecret: 'cs_legacy',
    });

    expect(creds.storeUrl).toBe('https://legacy-shop.example.com');
    expect(creds.wooKey).toBe('ck_legacy');
    expect(creds.wooSecret).toBe('cs_legacy');
  });

  it('ignores masked credentials', () => {
    const creds = resolveWooCredentials({
      storeUrl: 'https://shop.example.com',
      wooKey: '********',
      wooSecret: '••••••••••••',
      consumerKey: '',
      consumerSecret: '',
    });

    expect(creds.wooKey).toBe('');
    expect(creds.wooSecret).toBe('');
    expect(hasWooCredentials(creds)).toBe(false);
  });
});

