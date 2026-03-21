import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ContentType,
  ProductType,
  ObjectiveType,
  DayKey,
  RuleAction,
  PlatformName,
  UploadedAsset,
  TimeRule,
  WeeklySchedule,
  MediaLimits,
  PlatformCopyDraft,
  WooCampaignProduct,
  WooPublishScope,
  CampaignRow,
} from './types';
import {
  DAY_KEYS,
  PLATFORM_MEDIA_LIMITS,
  SMART_AUDIENCE_BY_CONTENT,
  SMART_AUDIENCE_BY_PRODUCT,
  SMART_AUDIENCE_BY_OBJECTIVE,
  createEmptyDaySchedule,
  stripHtmlToText,
} from './types';
import type { Connection } from '../../contexts/ConnectionsContext';
import { fetchWooCommerceProducts } from '../../services/woocommerceService';

export interface UseCampaignBuilderProps {
  connections: Connection[];
  connectedAdPlatforms: string[];
  isHebrew: boolean;
  language: string;
  isWooConnected: boolean;
  wooConnection: Connection | undefined;
}

export function useCampaignBuilder({
  connections,
  connectedAdPlatforms,
  isHebrew,
  language,
  isWooConnected,
  wooConnection,
}: UseCampaignBuilderProps) {
  // ── Form fields ──────────────────────────────────────────────────
  const [campaignNameInput, setCampaignNameInput] = useState('');
  const [shortTitleInput, setShortTitleInput] = useState('');
  const [objective, setObjective] = useState<ObjectiveType>('sales');
  const [contentType, setContentType] = useState<ContentType>('product');
  const [productType, setProductType] = useState<ProductType>('other');
  const [serviceTypeInput, setServiceTypeInput] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [customAudience, setCustomAudience] = useState('');
  const [builderMessage, setBuilderMessage] = useState<string | null>(null);

  // ── Platform copy & preview ──────────────────────────────────────
  const [platformCopyDrafts, setPlatformCopyDrafts] = useState<Partial<Record<PlatformName, PlatformCopyDraft>>>({});
  const [selectedCopyPlatform, setSelectedCopyPlatform] = useState<PlatformName>('Google');
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState<PlatformName>('Google');
  const [oneClickOpen, setOneClickOpen] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────
  const builderSectionRef = useRef<HTMLElement | null>(null);
  const shortTitleInputRef = useRef<HTMLInputElement | null>(null);

  // ── Audience suggestions ─────────────────────────────────────────
  const audienceSuggestions = useMemo(() => {
    const combined = [
      ...SMART_AUDIENCE_BY_CONTENT[contentType],
      ...SMART_AUDIENCE_BY_PRODUCT[productType],
      ...SMART_AUDIENCE_BY_OBJECTIVE[objective],
    ];
    return [...new Set(combined)];
  }, [contentType, productType, objective]);

  // Sync selected platforms with connected platforms
  useEffect(() => {
    if (connectedAdPlatforms.length === 0) {
      setSelectedPlatforms([]);
      return;
    }
    setSelectedPlatforms((prev) => {
      const filtered = prev.filter((p) => connectedAdPlatforms.includes(p));
      return filtered.length ? filtered : [...connectedAdPlatforms];
    });
  }, [connectedAdPlatforms]);

  // Auto-select copy/preview platform when drafts change
  const draftPlatforms = useMemo(
    () =>
      (['Google', 'Meta', 'TikTok'] as const).filter((platform) =>
        Boolean(platformCopyDrafts[platform])
      ) as PlatformName[],
    [platformCopyDrafts]
  );

  const previewPlatforms = useMemo(() => {
    const base = (selectedPlatforms.length > 0 ? selectedPlatforms : connectedAdPlatforms).filter(
      (platform): platform is PlatformName =>
        platform === 'Google' || platform === 'Meta' || platform === 'TikTok'
    );
    return base.length > 0 ? base : (['Google'] as PlatformName[]);
  }, [connectedAdPlatforms, selectedPlatforms]);

  useEffect(() => {
    if (!draftPlatforms.length) return;
    if (!draftPlatforms.includes(selectedCopyPlatform)) {
      setSelectedCopyPlatform(draftPlatforms[0]);
    }
  }, [draftPlatforms, selectedCopyPlatform]);

  useEffect(() => {
    if (!previewPlatforms.length) return;
    if (!previewPlatforms.includes(selectedPreviewPlatform)) {
      setSelectedPreviewPlatform(previewPlatforms[0]);
    }
  }, [previewPlatforms, selectedPreviewPlatform]);

  const togglePlatformSelection = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const toggleAudienceSelection = (audience: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(audience) ? prev.filter((a) => a !== audience) : [...prev, audience]
    );
  };

  const addCustomAudience = () => {
    const value = customAudience.trim();
    if (!value) return;
    if (!selectedAudiences.includes(value)) {
      setSelectedAudiences((prev) => [...prev, value]);
    }
    setCustomAudience('');
  };

  const scrollToBuilderSection = () => {
    builderSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Media limits (computed from selected platforms) ──────────────
  const effectiveMediaLimits = useMemo((): MediaLimits => {
    const activePlatforms = selectedPlatforms.filter((p): p is PlatformName =>
      p === 'Google' || p === 'Meta' || p === 'TikTok'
    );
    if (!activePlatforms.length) return PLATFORM_MEDIA_LIMITS.Google;
    return activePlatforms.reduce<MediaLimits>((acc, platform) => {
      const current = PLATFORM_MEDIA_LIMITS[platform];
      return {
        imageMaxMb: Math.min(acc.imageMaxMb, current.imageMaxMb),
        videoMaxMb: Math.min(acc.videoMaxMb, current.videoMaxMb),
        maxImageWidth: Math.min(acc.maxImageWidth, current.maxImageWidth),
        maxImageHeight: Math.min(acc.maxImageHeight, current.maxImageHeight),
      };
    }, PLATFORM_MEDIA_LIMITS[activePlatforms[0]]);
  }, [selectedPlatforms]);

  // ── WooCommerce state ────────────────────────────────────────────
  const wooAutoBriefRef = useRef('');
  const [wooProducts, setWooProducts] = useState<WooCampaignProduct[]>([]);
  const [wooLoading, setWooLoading] = useState(false);
  const [useWooProductData, setUseWooProductData] = useState(false);
  const [wooPublishScope, setWooPublishScope] = useState<WooPublishScope>('category');
  const [selectedWooCategory, setSelectedWooCategory] = useState('');
  const [selectedWooProductId, setSelectedWooProductId] = useState<string>('');

  const wooCategoryOptions = useMemo(() => {
    const names = wooProducts.flatMap((product) => product.categories);
    return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [wooProducts]);

  const wooProductsFiltered = useMemo(() => {
    if (wooPublishScope !== 'category') return wooProducts;
    if (!selectedWooCategory) return wooProducts;
    return wooProducts.filter((product) => product.categories.includes(selectedWooCategory));
  }, [wooProducts, wooPublishScope, selectedWooCategory]);

  const selectedWooProduct = useMemo(() => {
    if (!selectedWooProductId) return null;
    return wooProducts.find((product) => String(product.id) === String(selectedWooProductId)) || null;
  }, [wooProducts, selectedWooProductId]);

  const inferredWooTitle = useMemo(() => {
    if (!useWooProductData || !isWooConnected) return '';
    if (wooPublishScope === 'product' && selectedWooProduct?.name) return selectedWooProduct.name;
    if (wooPublishScope === 'category' && selectedWooCategory) return `${selectedWooCategory} Campaign`;
    return '';
  }, [useWooProductData, isWooConnected, wooPublishScope, selectedWooProduct?.name, selectedWooCategory]);

  // Load Woo products when wooConnection changes
  useEffect(() => {
    if (!wooConnection?.settings) {
      setWooProducts([]);
      setSelectedWooCategory('');
      setSelectedWooProductId('');
      return;
    }
    const { storeUrl, wooKey, wooSecret } = (wooConnection.settings || {}) as Record<string, string>;
    if (!storeUrl || !wooKey || !wooSecret) {
      setWooProducts([]);
      return;
    }
    let cancelled = false;
    setWooLoading(true);
    fetchWooCommerceProducts(storeUrl, wooKey, wooSecret, { fallbackToMock: false })
      .then((list) => {
        if (cancelled) return;
        const mapped = (Array.isArray(list) ? list : [])
          .map((item: Record<string, unknown>) => ({
            id: Number(item?.id || 0),
            name: stripHtmlToText(String(item?.name || '')),
            categories: Array.isArray(item?.categories)
              ? (item.categories as Record<string, unknown>[])
                  .map((category) => stripHtmlToText(String(category?.name || '')))
                  .filter(Boolean)
              : [],
            price: item?.price != null ? String(item.price) : '',
            shortDescription: stripHtmlToText(item?.short_description || ''),
            description: stripHtmlToText(item?.description || ''),
            sku: stripHtmlToText(item?.sku || ''),
            stockQuantity:
              typeof item?.stock_quantity === 'number' && Number.isFinite(item.stock_quantity)
                ? item.stock_quantity
                : null,
          }))
          .filter((item: WooCampaignProduct) => item.id > 0 && item.name);
        setWooProducts(mapped);
      })
      .catch(() => {
        if (!cancelled) setWooProducts([]);
      })
      .finally(() => {
        if (!cancelled) setWooLoading(false);
      });
    return () => { cancelled = true; };
  }, [wooConnection?.settings]);

  // Auto-select woo category
  useEffect(() => {
    if (!useWooProductData) return;
    if (wooPublishScope === 'product') return;
    if (!selectedWooCategory && wooCategoryOptions.length > 0) {
      setSelectedWooCategory(wooCategoryOptions[0]);
    }
  }, [useWooProductData, wooPublishScope, wooCategoryOptions, selectedWooCategory]);

  // Auto-select woo product
  useEffect(() => {
    if (!useWooProductData) return;
    if (wooPublishScope !== 'product') return;
    if (!selectedWooProductId && wooProductsFiltered.length > 0) {
      setSelectedWooProductId(String(wooProductsFiltered[0].id));
    }
  }, [useWooProductData, wooPublishScope, selectedWooProductId, wooProductsFiltered]);

  // Keep selected product valid when filtered list changes
  useEffect(() => {
    if (!useWooProductData) return;
    if (wooPublishScope !== 'product') return;
    if (!selectedWooProductId) return;
    const exists = wooProductsFiltered.some(
      (product) => String(product.id) === String(selectedWooProductId)
    );
    if (!exists) {
      setSelectedWooProductId(wooProductsFiltered.length > 0 ? String(wooProductsFiltered[0].id) : '');
    }
  }, [useWooProductData, wooPublishScope, selectedWooProductId, wooProductsFiltered]);

  // Auto-fill title from woo
  useEffect(() => {
    if (!useWooProductData) return;
    if (!inferredWooTitle) return;
    setShortTitleInput((prev) => (prev.trim() ? prev : inferredWooTitle));
    setCampaignNameInput((prev) => (prev.trim() ? prev : inferredWooTitle));
  }, [useWooProductData, inferredWooTitle]);

  const buildWooProductBrief = (product: WooCampaignProduct): string => {
    const longDescription =
      (product.shortDescription && product.shortDescription.trim()) ||
      (product.description && product.description.trim()) ||
      '';
    const compactDescription =
      longDescription.length > 420 ? `${longDescription.slice(0, 417).trim()}...` : longDescription;
    const categoryLabel =
      product.categories.length > 0
        ? `${isHebrew ? 'קטגוריות' : 'Categories'}: ${product.categories.join(', ')}`
        : '';
    const priceLabel = product.price ? `${isHebrew ? 'מחיר' : 'Price'}: ${product.price}` : '';
    const skuLabel = product.sku ? `SKU: ${product.sku}` : '';
    const stockLabel =
      typeof product.stockQuantity === 'number'
        ? `${isHebrew ? 'מלאי' : 'Stock'}: ${product.stockQuantity}`
        : '';
    return [
      `${isHebrew ? 'מוצר' : 'Product'}: ${product.name}`,
      categoryLabel,
      priceLabel,
      skuLabel,
      stockLabel,
      compactDescription,
    ]
      .filter((item) => item && item.trim().length > 0)
      .join('\n');
  };

  const importWooProductToBuilder = (
    product: WooCampaignProduct,
    options?: { overwriteExisting?: boolean; notify?: boolean }
  ) => {
    const overwriteExisting = options?.overwriteExisting ?? true;
    const notify = options?.notify ?? false;
    const productBrief = buildWooProductBrief(product);
    if (!productBrief.trim()) {
      if (notify)
        setBuilderMessage(
          isHebrew ? 'למוצר הנבחר אין מספיק פרטים לייבוא.' : 'Selected product has insufficient data for import.'
        );
      return;
    }
    const priceStr = product.price ? ` – ₪${product.price}` : '';
    const titleWithPrice = `${product.name}${priceStr}`.slice(0, 90);
    setContentType('product');
    setShortTitleInput((prev) => (overwriteExisting || !prev.trim() ? titleWithPrice : prev));
    setCampaignNameInput((prev) => (overwriteExisting || !prev.trim() ? product.name : prev));
    setServiceTypeInput((prev) => {
      const nextCategory = product.categories[0] || '';
      if (!nextCategory) return prev;
      return overwriteExisting || !prev.trim() ? nextCategory : prev;
    });
    setCampaignBrief((prev) =>
      overwriteExisting || !prev.trim() || prev.trim() === wooAutoBriefRef.current.trim()
        ? productBrief
        : prev
    );
    wooAutoBriefRef.current = productBrief;
    if (notify)
      setBuilderMessage(
        isHebrew ? 'פרטי המוצר יובאו בהצלחה מ-WooCommerce.' : 'Product details imported successfully from WooCommerce.'
      );
  };

  const disableWooImportMode = () => {
    setUseWooProductData(false);
    setBuilderMessage(isHebrew ? 'מצב עריכה ידני' : 'Manual editing mode');
    window.setTimeout(() => shortTitleInputRef.current?.focus(), 0);
  };

  // Auto-import product when selected woo product changes
  useEffect(() => {
    if (!useWooProductData) return;
    if (wooPublishScope !== 'product' || !selectedWooProduct) return;
    importWooProductToBuilder(selectedWooProduct, { overwriteExisting: false, notify: false });
  }, [useWooProductData, wooPublishScope, selectedWooProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI processing brief ──────────────────────────────────────────
  const aiProcessingBrief = useMemo(() => {
    const baseBrief = campaignBrief.trim();
    const productBrief =
      useWooProductData && wooPublishScope === 'product' && selectedWooProduct
        ? buildWooProductBrief(selectedWooProduct)
        : '';
    if (!productBrief) return baseBrief;
    if (!baseBrief) return productBrief;
    if (baseBrief.includes(productBrief)) return baseBrief;
    return `${baseBrief}\n\n${isHebrew ? 'נתוני מוצר מ-WooCommerce:' : 'WooCommerce product data:'}\n${productBrief}`;
  }, [campaignBrief, useWooProductData, wooPublishScope, selectedWooProduct, isHebrew]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // form fields
    campaignNameInput, setCampaignNameInput,
    shortTitleInput, setShortTitleInput,
    objective, setObjective,
    contentType, setContentType,
    productType, setProductType,
    serviceTypeInput, setServiceTypeInput,
    campaignBrief, setCampaignBrief,
    selectedPlatforms, setSelectedPlatforms,
    selectedAudiences, setSelectedAudiences,
    customAudience, setCustomAudience,
    builderMessage, setBuilderMessage,
    // copy / preview
    platformCopyDrafts, setPlatformCopyDrafts,
    selectedCopyPlatform, setSelectedCopyPlatform,
    selectedPreviewPlatform, setSelectedPreviewPlatform,
    draftPlatforms,
    previewPlatforms,
    oneClickOpen, setOneClickOpen,
    // refs
    builderSectionRef,
    shortTitleInputRef,
    // computed
    audienceSuggestions,
    effectiveMediaLimits,
    aiProcessingBrief,
    // handlers
    togglePlatformSelection,
    toggleAudienceSelection,
    addCustomAudience,
    scrollToBuilderSection,
    // woo
    wooProducts,
    wooLoading,
    useWooProductData, setUseWooProductData,
    wooPublishScope, setWooPublishScope,
    selectedWooCategory, setSelectedWooCategory,
    selectedWooProductId, setSelectedWooProductId,
    wooCategoryOptions,
    wooProductsFiltered,
    selectedWooProduct,
    inferredWooTitle,
    buildWooProductBrief,
    importWooProductToBuilder,
    disableWooImportMode,
  };
}
