import { useEffect, useMemo, useState } from 'react';
import { generateDashboardData } from '../../lib/dataUtils';
import { fetchGA4Report, fetchGA4Realtime, fetchGSCData, fetchGoogleCampaigns } from '../../services/googleService';
import { fetchMetaCampaigns, isMetaRateLimitMessage } from '../../services/metaService';
import { fetchTikTokCampaigns } from '../../services/tiktokService';
import {
  fetchWooCommerceLatestOrders,
  fetchWooCommerceSalesByRange,
  type WooCommerceOrder,
} from '../../services/woocommerceService';
import {
  COPY,
  type CampaignSnapshot,
  type CampaignSummary,
  type PlatformRevenueSummary,
  type Ga4TopPage,
} from './types';
import type { Connection } from '../../contexts/ConnectionsContext';
import type { DateRangeType } from '../../contexts/DateRangeContext';

// ── Demo constants ────────────────────────────────────────────────────────────

export const DEMO_GA4_STATS = { activeNow: 42, totalUsers: 1247 };
export const DEMO_GA4_TOP_PAGES: Ga4TopPage[] = [
  { title: 'דף הבית', path: '/', views: 18 },
  { title: 'מוצרים', path: '/products', views: 11 },
  { title: 'צור קשר', path: '/contact', views: 6 },
];
export const DEMO_GSC_STATS = { clicks: 3842, impressions: 48200, avgPosition: 14.3, ctr: 7.97 };

export const DEMO_RECENT_ORDERS: WooCommerceOrder[] = [
  {
    id: 801, number: '801', status: 'processing', currency: 'ILS', total: 529, total_tax: 0,
    shipping_total: 25, payment_method: 'card', payment_method_title: 'Credit Card',
    date_created: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    date_modified: new Date(Date.now() - 1000 * 60 * 30).toISOString(), date_completed: null,
    customer_note: '',
    billing: { first_name: 'רועי', last_name: 'לוי', email: 'roy@example.com', phone: '+972501112233' },
    shipping: { first_name: 'רועי', last_name: 'לוי' }, line_items: [], meta_data: [],
  },
  {
    id: 802, number: '802', status: 'completed', currency: 'ILS', total: 249, total_tax: 0,
    shipping_total: 0, payment_method: 'paypal', payment_method_title: 'PayPal',
    date_created: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    date_modified: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    date_completed: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    customer_note: 'נא להשאיר ליד הדלת',
    billing: { first_name: 'נועה', last_name: 'כהן', email: 'noa@example.com', phone: '+972507778899' },
    shipping: { first_name: 'נועה', last_name: 'כהן' }, line_items: [], meta_data: [],
  },
  {
    id: 803, number: '803', status: 'pending', currency: 'ILS', total: 1090, total_tax: 0,
    shipping_total: 35, payment_method: 'card', payment_method_title: 'Credit Card',
    date_created: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    date_modified: new Date(Date.now() - 1000 * 60 * 138).toISOString(), date_completed: null,
    customer_note: '',
    billing: { first_name: 'אור', last_name: 'שחר', email: 'or@example.com', phone: '+972505556677' },
    shipping: { first_name: 'אור', last_name: 'שחר' }, line_items: [], meta_data: [],
  },
  {
    id: 804, number: '804', status: 'completed', currency: 'ILS', total: 339, total_tax: 0,
    shipping_total: 20, payment_method: 'card', payment_method_title: 'Credit Card',
    date_created: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    date_modified: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    date_completed: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    customer_note: '',
    billing: { first_name: 'מיכל', last_name: 'אדרי', email: 'michal@example.com', phone: '+972503339944' },
    shipping: { first_name: 'מיכל', last_name: 'אדרי' }, line_items: [], meta_data: [],
  },
  {
    id: 805, number: '805', status: 'on-hold', currency: 'ILS', total: 799, total_tax: 0,
    shipping_total: 0, payment_method: 'bank', payment_method_title: 'Bank Transfer',
    date_created: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    date_modified: new Date(Date.now() - 1000 * 60 * 309).toISOString(), date_completed: null,
    customer_note: '',
    billing: { first_name: 'דן', last_name: 'מור', email: 'dan@example.com', phone: '+972501234111' },
    shipping: { first_name: 'דן', last_name: 'מור' }, line_items: [], meta_data: [],
  },
];

export const DEMO_CAMPAIGN_SUMMARY: CampaignSummary = {
  totalCampaigns: 9, activeCampaigns: 6, totalSpend: 8420, avgRoas: 2.8,
  platformBreakdown: [
    { platform: 'Google', count: 4 }, { platform: 'Meta', count: 3 }, { platform: 'TikTok', count: 2 },
  ],
};

const EMPTY_CAMPAIGN_SUMMARY: CampaignSummary = {
  totalCampaigns: 0, activeCampaigns: 0, totalSpend: 0, avgRoas: 0, platformBreakdown: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const moneyFromUnknown = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseDashboardProps {
  connections: Connection[];
  language: string;
  dateRange: DateRangeType;
  startDate: Date;
  endDate: Date;
}

export function useDashboard({ connections, language, dateRange, startDate, endDate }: UseDashboardProps) {
  const text = COPY[language as keyof typeof COPY] || COPY.en;
  const connectedPlatforms = connections.filter((c) => c.status === 'connected');
  const isWooConnected = connections.find((c) => c.id === 'woocommerce')?.status === 'connected';
  const isShopifyConnected = connections.find((c) => c.id === 'shopify')?.status === 'connected';
  const isStoreConnected = isWooConnected || isShopifyConnected;
  const isMetaConnected = connections.some((c) => c.id === 'meta' && c.status === 'connected');

  const fallbackData = useMemo(() => {
    const seedStr =
      connectedPlatforms.map((c) => Object.values(c.settings || {}).join('')).join('') || 'default';
    const data = generateDashboardData(seedStr, dateRange);
    if (!isStoreConnected) {
      return { ...data, totalRevenue: 0, roas: '0.00', netProfit: -data.totalSpend };
    }
    return data;
  }, [connectedPlatforms, dateRange, isStoreConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(fallbackData.totalRevenue);
  const [totalSpend, setTotalSpend] = useState(fallbackData.totalSpend);
  const [netProfit, setNetProfit] = useState(fallbackData.netProfit);
  const [roas, setRoas] = useState(fallbackData.roas);
  const [ga4Stats, setGa4Stats] = useState(DEMO_GA4_STATS);
  const [ga4Users24h, setGa4Users24h] = useState<number | null>(null);
  const [ga4TopPages, setGa4TopPages] = useState<Ga4TopPage[]>(DEMO_GA4_TOP_PAGES);
  const [isGa4TopPagesDemo, setIsGa4TopPagesDemo] = useState(true);
  const [gscStats, setGscStats] = useState(DEMO_GSC_STATS);
  const [recentOrders, setRecentOrders] = useState<WooCommerceOrder[]>(DEMO_RECENT_ORDERS);
  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary>(DEMO_CAMPAIGN_SUMMARY);
  const [platformRevenue, setPlatformRevenue] = useState<PlatformRevenueSummary>({
    meta: { spend: 0, attributedRevenue: 0 },
    google: { spend: 0, attributedRevenue: 0 },
    tiktok: { spend: 0, attributedRevenue: 0 },
  });
  const [financialAvailability, setFinancialAvailability] = useState({
    revenue: false, spend: false, netProfit: false, roas: false,
    metaSpend: false, metaRevenue: false,
  });
  const [isGa4UsingDemo, setIsGa4UsingDemo] = useState(true);
  const [hasGa4LiveSnapshot, setHasGa4LiveSnapshot] = useState(false);
  const [isOrdersUsingDemo, setIsOrdersUsingDemo] = useState(true);
  const [isCampaignsUsingDemo, setIsCampaignsUsingDemo] = useState(true);
  const [isGscUsingDemo, setIsGscUsingDemo] = useState(true);

  // ── Main data-fetch effect ─────────────────────────────────────────────────
  useEffect(() => {
    setFinancialAvailability({
      revenue: false, spend: false, netProfit: false, roas: false,
      metaSpend: false, metaRevenue: false,
    });

    let cancelled = false;

    const buildCampaignSummary = (campaigns: CampaignSnapshot[]): CampaignSummary => {
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter((c) => c.status === 'Active').length;
      const totalSpendLive = campaigns.reduce((sum, c) => sum + c.spend, 0);
      const roasRows = campaigns.filter((c) => c.roas > 0);
      const avgRoas = roasRows.length > 0 ? roasRows.reduce((sum, c) => sum + c.roas, 0) / roasRows.length : 0;
      const platformBreakdown = (['Google', 'Meta', 'TikTok'] as const)
        .map((platform) => ({ platform, count: campaigns.filter((c) => c.platform === platform).length }))
        .filter((row) => row.count > 0);
      return { totalCampaigns, activeCampaigns, totalSpend: totalSpendLive, avgRoas, platformBreakdown };
    };

    async function loadOverview() {
      setIsLoadingOverview(true);

      const woo = connections.find((c) => c.id === 'woocommerce' && c.status === 'connected');
      const google = connections.find((c) => c.id === 'google' && c.status === 'connected');
      const meta = connections.find((c) => c.id === 'meta' && c.status === 'connected');
      const tiktok = connections.find((c) => c.id === 'tiktok' && c.status === 'connected');
      const isMetaConnectedLocal = Boolean(meta);

      let liveRevenue = 0, liveSpend = 0;
      let metaSpend = 0, metaAttributedRevenue = 0;
      let googleSpend = 0, googleAttributedRevenue = 0;
      let tiktokSpend = 0, tiktokAttributedRevenue = 0;
      let hasGa4Live = false, hasGscLive = false, hasOrdersLive = false;
      let hasCampaignsLive = false, hasRevenueLive = false, hasSpendLive = false;
      let hasMetaSpendLive = false, hasMetaRevenueLive = false;
      let ga4Live = DEMO_GA4_STATS;
      let ga4SnapshotLoaded = false;
      let gscLive = DEMO_GSC_STATS;
      let latestOrdersLive: WooCommerceOrder[] = [];
      const campaignRows: CampaignSnapshot[] = [];

      const endIso = endDate.toISOString();
      const startIsoDateOnly = startDate.toISOString().slice(0, 10);
      const endIsoDateOnly = endDate.toISOString().slice(0, 10);

      if (woo?.settings?.storeUrl && woo.settings.wooKey && woo.settings.wooSecret) {
        try {
          const salesRows = await fetchWooCommerceSalesByRange(
            woo.settings.storeUrl, woo.settings.wooKey, woo.settings.wooSecret,
            startIsoDateOnly, endIsoDateOnly
          );
          liveRevenue = salesRows.reduce((sum, row) => sum + toNumber(row.netSales || row.totalSales, 0), 0);
          hasRevenueLive = true;
        } catch (error) {
          console.warn('Failed to load WooCommerce sales range', error);
        }

        try {
          const orders = await fetchWooCommerceLatestOrders(
            woo.settings.storeUrl, woo.settings.wooKey, woo.settings.wooSecret, 5
          );
          if (orders.length > 0) {
            latestOrdersLive = [...orders]
              .sort((a, b) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime())
              .slice(0, 5);
            hasOrdersLive = true;
            if (!hasRevenueLive && liveRevenue <= 0) {
              hasRevenueLive = true;
              liveRevenue = orders.reduce((sum, order) => sum + toNumber(order.total, 0), 0);
            }
          }
        } catch (error) {
          console.warn('Failed to load latest WooCommerce orders', error);
        }
      }

      if (google?.status === 'connected') {
        const token = google.settings?.googleAccessToken || 'server-managed';
        try {
          const report = await fetchGA4Report(
            token, google.settings?.ga4Id || undefined, startIsoDateOnly, endIsoDateOnly
          );
          const rows = Array.isArray(report.rows) ? report.rows : [];
          const metricHeaders = Array.isArray(report.metricHeaders) ? report.metricHeaders : [];
          const metricIndexByName = metricHeaders.reduce<Record<string, number>>((acc, header, index) => {
            const name = String(header?.name || '').trim();
            if (name) acc[name] = index;
            return acc;
          }, {});
          const metricValueByName = (
            row: { metricValues?: { value?: string }[]; metrics?: { value?: string }[] },
            metricName: string,
            fallbackIndex: number
          ) => {
            const metrics = row?.metricValues || row?.metrics || [];
            const namedIndex = metricIndexByName[metricName];
            const index = typeof namedIndex === 'number' && Number.isInteger(namedIndex) ? namedIndex : fallbackIndex;
            return metrics?.[index]?.value;
          };
          let totalUsers = 0, activeNow = 0;
          const realtimeActiveUsers = Number(report?.realtime?.activeUsers ?? NaN);
          const usersLast24hRaw = Number(report?.realtime?.usersLast24h ?? NaN);
          rows.forEach((row) => { totalUsers += moneyFromUnknown(metricValueByName(row, 'totalUsers', 0)); });
          if (Number.isFinite(realtimeActiveUsers)) {
            activeNow = realtimeActiveUsers;
          } else if (rows.length) {
            activeNow = moneyFromUnknown(metricValueByName(rows[rows.length - 1], 'activeUsers', 0));
          }
          const totalsRow = Array.isArray(report.totals) ? report.totals[0] : undefined;
          if (totalsRow) totalUsers = moneyFromUnknown(metricValueByName(totalsRow, 'totalUsers', 0));
          if (Number.isFinite(usersLast24hRaw)) totalUsers = usersLast24hRaw;
          const topPagesRaw = Array.isArray(report?.topPages) ? report.topPages : [];
          const topPagesMapped: Ga4TopPage[] = (topPagesRaw ?? [])
            .map((row) => ({ path: String(row?.path || '').trim(), title: String(row?.title || '').trim(), views: toNumber(row?.views, 0) }))
            .filter((row: Ga4TopPage) => Boolean(row.path || row.title))
            .slice(0, 7);
          ga4Live = {
            activeNow: toNumber(activeNow, DEMO_GA4_STATS.activeNow),
            totalUsers: toNumber(totalUsers, DEMO_GA4_STATS.totalUsers),
          };
          setGa4TopPages(topPagesMapped);
          hasGa4Live = true;
          ga4SnapshotLoaded = true;
        } catch (error) {
          console.warn('Failed to load GA4 stats', error);
        }

        try {
          const realtime = await fetchGA4Realtime(token, google.settings?.ga4Id || undefined);
          if (realtime.users24h > 0 || realtime.topPages.length > 0) {
            if (realtime.users24h > 0) setGa4Users24h(realtime.users24h);
            if (realtime.topPages.length > 0) setGa4TopPages(realtime.topPages.slice(0, 7));
            setIsGa4TopPagesDemo(false);
          }
        } catch (error) {
          console.warn('Failed to load GA4 realtime data', error);
        }

        try {
          const gsc = await fetchGSCData(
            token, google.settings?.siteUrl || google.settings?.gscSiteUrl || undefined,
            startIsoDateOnly, endIsoDateOnly
          );
          const gscRows = Array.isArray(gsc.rows) ? gsc.rows : [];
          let clicks = 0, impressions = 0, positionSum = 0;
          gscRows.forEach((row) => {
            clicks += toNumber(row.clicks, 0);
            impressions += toNumber(row.impressions, 0);
            positionSum += toNumber(row.position, 0);
          });
          const avgPosition = gscRows.length ? positionSum / gscRows.length : 0;
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          gscLive = {
            clicks: toNumber(clicks, DEMO_GSC_STATS.clicks),
            impressions: toNumber(impressions, DEMO_GSC_STATS.impressions),
            avgPosition: toNumber(avgPosition, DEMO_GSC_STATS.avgPosition),
            ctr: toNumber(ctr, DEMO_GSC_STATS.ctr),
          };
          hasGscLive = gscLive.clicks > 0 || gscLive.impressions > 0;
        } catch (error) {
          console.warn('Failed to load GSC stats', error);
        }

        const googleCustomerId =
          google.settings?.googleAdsId || google.settings?.customerId || google.settings?.googleCustomerId;
        try {
          const googleCampaigns = await fetchGoogleCampaigns(
            token, googleCustomerId || undefined, google.settings?.loginCustomerId
          );
          googleCampaigns.forEach((campaign) => {
            const spend = moneyFromUnknown(campaign.spend);
            const conversionValue = moneyFromUnknown(campaign.conversionValue);
            const roasValue = moneyFromUnknown(campaign.roas);
            campaignRows.push({
              id: String(campaign.id || ''), name: String(campaign.name || 'Google Campaign'),
              platform: 'Google', status: campaign.status === 'Active' ? 'Active' : 'Paused',
              spend, roas: roasValue,
            });
            liveSpend += spend;
            googleSpend += spend;
            googleAttributedRevenue += conversionValue;
          });
          if (googleCampaigns.length > 0) { hasSpendLive = true; hasCampaignsLive = true; }
        } catch (error) {
          console.warn('Failed to load Google campaigns', error);
        }
      }

      const metaToken = meta?.status === 'connected' ? meta.settings?.metaToken || 'server-managed' : undefined;
      const metaAdsId = meta?.settings?.metaAdsId || meta?.settings?.adAccountId || meta?.settings?.metaAdAccountId;
      if (metaToken) {
        try {
          const metaCampaigns = await fetchMetaCampaigns(metaToken, metaAdsId || undefined, startIsoDateOnly, endIsoDateOnly);
          metaCampaigns.forEach((campaign) => {
            const spend = moneyFromUnknown(campaign.spend);
            const conversionValue = moneyFromUnknown(campaign.conversionValue);
            const roasValue = moneyFromUnknown(campaign.roas);
            campaignRows.push({
              id: String(campaign.id || ''), name: String(campaign.name || 'Meta Campaign'),
              platform: 'Meta', status: String(campaign.status || '') === 'Active' ? 'Active' : 'Paused',
              spend, roas: roasValue,
            });
            liveSpend += spend;
            metaSpend += spend;
            metaAttributedRevenue += conversionValue;
          });
          hasMetaSpendLive = true;
          hasMetaRevenueLive = true;
          if (metaCampaigns.length > 0) { hasSpendLive = true; hasCampaignsLive = true; }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!isMetaRateLimitMessage(message)) console.warn('Failed to load Meta campaigns', error);
        }
      }

      const tiktokToken = tiktok?.settings?.tiktokToken || tiktok?.settings?.tiktokAccessToken;
      const tiktokAdvertiserId = tiktok?.settings?.tiktokAdvertiserId || tiktok?.settings?.advertiserId;
      if (tiktokToken && tiktokAdvertiserId) {
        try {
          const tiktokCampaigns = await fetchTikTokCampaigns(tiktokToken, tiktokAdvertiserId);
          (Array.isArray(tiktokCampaigns) ? tiktokCampaigns : []).forEach((campaign) => {
            const spend = moneyFromUnknown(campaign.spend);
            const conversionValue = moneyFromUnknown(campaign.conversionValue);
            const roasValue = moneyFromUnknown(campaign.roas);
            campaignRows.push({
              id: String(campaign.id || ''), name: String(campaign.name || 'TikTok Campaign'),
              platform: 'TikTok', status: campaign.status === 'Active' ? 'Active' : 'Paused',
              spend, roas: roasValue,
            });
            liveSpend += spend;
            tiktokSpend += spend;
            tiktokAttributedRevenue += conversionValue;
          });
          if ((Array.isArray(tiktokCampaigns) ? tiktokCampaigns.length : 0) > 0) { hasSpendLive = true; hasCampaignsLive = true; }
        } catch (error) {
          console.warn('Failed to load TikTok campaigns', error);
        }
      }

      if (cancelled) return;

      const finalRevenue = hasRevenueLive ? liveRevenue : 0;
      const finalSpend = hasSpendLive ? liveSpend : 0;
      const finalRoas = hasRevenueLive && hasSpendLive && finalSpend > 0 ? (finalRevenue / finalSpend).toFixed(2) : '0.00';
      const finalNetProfit = finalRevenue - finalSpend;

      setTotalRevenue(finalRevenue);
      setTotalSpend(finalSpend);
      setRoas(finalRoas);
      setNetProfit(finalNetProfit);
      setFinancialAvailability({
        revenue: hasRevenueLive, spend: hasSpendLive,
        netProfit: hasRevenueLive && hasSpendLive,
        roas: hasRevenueLive && hasSpendLive && finalSpend > 0,
        metaSpend: isMetaConnectedLocal ? hasMetaSpendLive : false,
        metaRevenue: isMetaConnectedLocal ? hasMetaRevenueLive : false,
      });
      setPlatformRevenue({
        meta: { spend: metaSpend, attributedRevenue: metaAttributedRevenue },
        google: { spend: googleSpend, attributedRevenue: googleAttributedRevenue },
        tiktok: { spend: tiktokSpend, attributedRevenue: tiktokAttributedRevenue },
      });

      const hasAnyLiveData = hasRevenueLive || hasSpendLive || hasGa4Live || hasGscLive || hasOrdersLive || hasCampaignsLive;
      const useDemoFallback = !hasAnyLiveData;

      if (hasGa4Live) {
        setGa4Stats(ga4Live); setIsGa4UsingDemo(false); setHasGa4LiveSnapshot(ga4SnapshotLoaded);
      } else if (useDemoFallback) {
        setGa4Stats(DEMO_GA4_STATS); setIsGa4UsingDemo(true); setHasGa4LiveSnapshot(false);
        setGa4TopPages((prev) => prev.length > 0 ? prev : DEMO_GA4_TOP_PAGES);
      } else {
        setGa4Stats({ activeNow: 0, totalUsers: 0 }); setIsGa4UsingDemo(false); setHasGa4LiveSnapshot(false);
      }

      if (hasGscLive) {
        setGscStats(gscLive); setIsGscUsingDemo(false);
      } else if (useDemoFallback) {
        setGscStats(DEMO_GSC_STATS); setIsGscUsingDemo(true);
      } else {
        setGscStats({ clicks: 0, impressions: 0, avgPosition: 0, ctr: 0 }); setIsGscUsingDemo(false);
      }

      if (hasOrdersLive) {
        setRecentOrders(latestOrdersLive); setIsOrdersUsingDemo(false);
      } else if (useDemoFallback) {
        setRecentOrders(DEMO_RECENT_ORDERS); setIsOrdersUsingDemo(true);
      } else {
        setRecentOrders([]); setIsOrdersUsingDemo(false);
      }

      if (hasCampaignsLive) {
        setCampaignSummary(buildCampaignSummary(campaignRows)); setIsCampaignsUsingDemo(false);
      } else if (useDemoFallback) {
        setCampaignSummary(DEMO_CAMPAIGN_SUMMARY); setIsCampaignsUsingDemo(true);
      } else {
        setCampaignSummary(EMPTY_CAMPAIGN_SUMMARY); setIsCampaignsUsingDemo(false);
      }
      setIsLoadingOverview(false);
    }

    loadOverview().catch((err) => {
      if (!cancelled) { setIsLoadingOverview(false); console.error('[Dashboard] loadOverview failed:', err); }
    });

    return () => { cancelled = true; };
  }, [
    endDate, startDate, connections,
    fallbackData.netProfit, fallbackData.roas, fallbackData.totalRevenue, fallbackData.totalSpend,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed values ────────────────────────────────────────────────────────
  const safeTotalRevenue = toNumber(totalRevenue, 0);
  const safeTotalSpend = toNumber(totalSpend, 0);
  const safeNetProfit = toNumber(netProfit, 0);
  const safeRoas = (() => {
    const parsed = Number(roas);
    if (Number.isFinite(parsed)) return parsed.toFixed(2);
    if (safeTotalSpend > 0) return (safeTotalRevenue / safeTotalSpend).toFixed(2);
    return '0.00';
  })();
  const safeGa4Stats = {
    activeNow: toNumber(ga4Stats.activeNow, DEMO_GA4_STATS.activeNow),
    totalUsers: toNumber(ga4Stats.totalUsers, DEMO_GA4_STATS.totalUsers),
  };
  const safeGscStats = {
    clicks: toNumber(gscStats.clicks, DEMO_GSC_STATS.clicks),
    impressions: toNumber(gscStats.impressions, DEMO_GSC_STATS.impressions),
    avgPosition: toNumber(gscStats.avgPosition, DEMO_GSC_STATS.avgPosition),
    ctr: toNumber(gscStats.ctr, DEMO_GSC_STATS.ctr),
  };
  const hasGa4Data = isGa4UsingDemo || hasGa4LiveSnapshot;
  const hasGscData = isGscUsingDemo || safeGscStats.clicks > 0 || safeGscStats.impressions > 0;
  const hasOrdersData = isOrdersUsingDemo || recentOrders.length > 0;
  const hasCampaignData = isCampaignsUsingDemo || campaignSummary.totalCampaigns > 0;

  const ga4Availability = {
    activeNow: isGa4UsingDemo || hasGa4LiveSnapshot,
    totalUsers: isGa4UsingDemo || hasGa4LiveSnapshot,
  };
  const campaignAvailability = {
    totalCampaigns: hasCampaignData, activeCampaigns: hasCampaignData,
    spend: isCampaignsUsingDemo || financialAvailability.spend,
    roas: isCampaignsUsingDemo || campaignSummary.avgRoas > 0,
  };
  const seoAvailability = {
    siteScore: hasGa4Data || hasGscData, searchConsoleScore: hasGscData,
    clicks: hasGscData, impressions: hasGscData, ctr: hasGscData, avgPosition: hasGscData,
  };
  const ga4LiveAvailability = {
    activeNow: !isGa4UsingDemo && hasGa4LiveSnapshot,
    totalUsers: !isGa4UsingDemo && hasGa4LiveSnapshot,
  };
  const campaignLiveAvailability = {
    totalCampaigns: !isCampaignsUsingDemo && campaignAvailability.totalCampaigns,
    activeCampaigns: !isCampaignsUsingDemo && campaignAvailability.activeCampaigns,
    spend: !isCampaignsUsingDemo && campaignAvailability.spend,
    roas: !isCampaignsUsingDemo && campaignAvailability.roas,
  };
  const seoLiveAvailability = {
    siteScore: !isGa4UsingDemo && seoAvailability.siteScore,
    searchConsoleScore: !isGscUsingDemo && seoAvailability.searchConsoleScore,
    clicks: !isGscUsingDemo && seoAvailability.clicks,
    impressions: !isGscUsingDemo && seoAvailability.impressions,
    ctr: !isGscUsingDemo && seoAvailability.ctr,
    avgPosition: !isGscUsingDemo && seoAvailability.avgPosition,
  };

  const siteSeoScore = useMemo(() => {
    const ctrScore = Math.min(30, safeGscStats.ctr * 3);
    const positionScore = Math.max(0, 35 - safeGscStats.avgPosition * 1.2);
    const trafficScore = Math.min(35, Math.log10(safeGa4Stats.totalUsers + 1) * 9);
    return Math.round(ctrScore + positionScore + trafficScore);
  }, [safeGa4Stats.totalUsers, safeGscStats.avgPosition, safeGscStats.ctr]);

  const searchConsoleSeoScore = useMemo(() => {
    const clickScore = Math.min(40, Math.log10(safeGscStats.clicks + 1) * 10);
    const impressionScore = Math.min(25, Math.log10(safeGscStats.impressions + 1) * 5.5);
    const positionScore = Math.max(0, 35 - safeGscStats.avgPosition * 1.4);
    return Math.round(clickScore + impressionScore + positionScore);
  }, [safeGscStats.avgPosition, safeGscStats.clicks, safeGscStats.impressions]);

  const optimizationRecommendations = useMemo(() => {
    const recommendations: string[] = [];
    if (financialAvailability.roas && Number(safeRoas) < 2) recommendations.push(text.recLowRoas);
    if (hasGscData && safeGscStats.avgPosition > 12) recommendations.push(text.recSeoStructure);
    if (hasGscData && safeGscStats.ctr < 2.5) recommendations.push(text.recMetaCtr);
    if (hasGa4Data && hasOrdersData && safeGa4Stats.activeNow > 0 && recentOrders.length < 3) {
      recommendations.push(text.recFunnel);
    }
    if (hasCampaignData && campaignSummary.activeCampaigns < campaignSummary.totalCampaigns) {
      recommendations.push(text.recPausedCampaigns);
    }
    return recommendations.slice(0, 5);
  }, [
    campaignSummary.activeCampaigns, campaignSummary.totalCampaigns,
    financialAvailability.roas, hasCampaignData, hasGa4Data, hasGscData, hasOrdersData,
    recentOrders.length, safeGa4Stats.activeNow, safeGscStats.avgPosition, safeGscStats.ctr,
    safeRoas, text,
  ]);

  const hasAnyOptimizationInput =
    financialAvailability.revenue || financialAvailability.spend ||
    hasGa4Data || hasGscData || hasOrdersData || hasCampaignData;

  const goToPath = (path: string) => {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', path);
    try { window.dispatchEvent(new PopStateEvent('popstate')); }
    catch { window.dispatchEvent(new Event('popstate')); }
  };

  return {
    // loading
    isLoadingOverview,
    // financials
    safeTotalRevenue, safeTotalSpend, safeNetProfit, safeRoas,
    financialAvailability,
    platformRevenue,
    // GA4
    safeGa4Stats, ga4Users24h, ga4TopPages, isGa4TopPagesDemo,
    hasGa4Data, ga4Availability, ga4LiveAvailability, isGa4UsingDemo,
    // GSC
    safeGscStats, hasGscData, seoAvailability, seoLiveAvailability,
    siteSeoScore, searchConsoleSeoScore, isGscUsingDemo,
    // Orders
    recentOrders, hasOrdersData, isOrdersUsingDemo,
    // Campaigns
    campaignSummary, hasCampaignData, campaignAvailability, campaignLiveAvailability, isCampaignsUsingDemo,
    // Recommendations
    optimizationRecommendations, hasAnyOptimizationInput,
    // Connection state
    isMetaConnected, isWooConnected, isShopifyConnected, isStoreConnected,
    // Text
    text,
    // Nav
    goToPath,
  };
}
