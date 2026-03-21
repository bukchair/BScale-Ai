"use client";

import React, { useState } from 'react';
import { Plug, ShoppingCart, Store, CheckCircle2, Megaphone, Video, Facebook, AlertCircle, Loader2, X, HelpCircle, ChevronDown, ChevronUp, Sparkles, Settings2, Key, Link as LinkIcon, Plus, Zap, BrainCircuit, RotateCcw, Grid3X3, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useConnections, Connection } from '../contexts/ConnectionsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIntegrationsLogic } from './integrations/useIntegrationsLogic';
import { OverviewTab } from './integrations/OverviewTab';
import { GoogleTab } from './integrations/GoogleTab';
import { MetaTab } from './integrations/MetaTab';
import { TikTokTab } from './integrations/TikTokTab';
import { EcommerceTab } from './integrations/EcommerceTab';
import { ConnectionWizard } from './integrations/ConnectionWizard';
import { IntegrationSettingsPanel } from './integrations/IntegrationSettingsPanel';
import {
  parseManagedGoogleAdsAccounts,
  formatGoogleAdsAccountId,
} from './integrations/integrationUtils';
import {
  type WizardPlatform,
  WIZARD_FIELDS,
} from './integrations/wizardTypes';


const getActiveAccountSummary = (integration: Connection): string | null => {
  const settings = integration.settings || {};

  if (integration.id === 'google') {
    const managedAccounts = parseManagedGoogleAdsAccounts(settings.googleAdsAccounts);
    const selected = managedAccounts.find((account) => account.isSelected) || managedAccounts[0];
    if (selected?.externalAccountId) {
      const formatted = formatGoogleAdsAccountId(selected.externalAccountId);
      return selected.name ? `${selected.name} (${formatted})` : formatted;
    }
    if (settings.googleAdsId) {
      return formatGoogleAdsAccountId(settings.googleAdsId);
    }
    return null;
  }

  if (integration.id === 'meta') {
    const id = String(settings.metaAdsId || '').trim();
    return id || null;
  }

  if (integration.id === 'tiktok') {
    const id = String(settings.tiktokAdvertiserId || '').trim();
    return id || null;
  }

  if (integration.id === 'woocommerce' || integration.id === 'shopify') {
    const storeUrl = String(settings.storeUrl || '').trim();
    return storeUrl || null;
  }

  return null;
};

const iconMap: Record<string, React.ElementType> = {
  'gemini': Sparkles,
  'openai': Zap,
  'claude': BrainCircuit,
  'google': Megaphone,
  'meta': Facebook,
  'tiktok': Video,
  'woocommerce': ShoppingCart,
  'shopify': Store,
};

const brandStyles: Record<string, { bg: string, text: string, border: string, lightBg: string }> = {
  'gemini': { bg: 'bg-gradient-to-br from-purple-500 to-blue-500', text: 'text-white', border: 'border-purple-200', lightBg: 'bg-purple-50' },
  'openai': { bg: 'bg-gradient-to-br from-emerald-600 to-teal-600', text: 'text-white', border: 'border-emerald-200', lightBg: 'bg-emerald-50' },
  'claude': { bg: 'bg-gradient-to-br from-amber-600 to-orange-600', text: 'text-white', border: 'border-amber-200', lightBg: 'bg-amber-50' },
  'google': { bg: 'bg-gradient-to-br from-blue-500 to-red-400', text: 'text-white', border: 'border-blue-200', lightBg: 'bg-blue-50' },
  'meta': { bg: 'bg-gradient-to-br from-blue-600 to-blue-700', text: 'text-white', border: 'border-blue-200', lightBg: 'bg-blue-50' },
  'tiktok': { bg: 'bg-gradient-to-br from-gray-800 to-black', text: 'text-white', border: 'border-gray-300', lightBg: 'bg-gray-100' },
  'woocommerce': { bg: 'bg-gradient-to-br from-purple-600 to-purple-800', text: 'text-white', border: 'border-purple-200', lightBg: 'bg-purple-50' },
  'shopify': { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-white', border: 'border-emerald-200', lightBg: 'bg-emerald-50' },
};

export function Integrations({ userProfile }: { userProfile?: { role?: string; subscriptionStatus?: string } | null }) {
  const isAdmin = userProfile?.role === 'admin';
  const isDemo = userProfile?.subscriptionStatus === 'demo';
  const { t, dir, language } = useLanguage();
  const {
    connections,
    dataOwnerUid,
    updateConnectionSettings,
    clearConnectionSettings,
    resetAllConnections,
    testConnection,
    migrateAiConnectionsFromUser,
    isWorkspaceReadOnly,
  } = useConnections();
  const isHebrew = language === 'he';
  type TabId = 'overview' | 'google' | 'meta' | 'tiktok' | 'whatsapp' | 'more';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const {
    error, setError,
    expandedId, setExpandedId,
    formValues, setFormValues,
    testingId,
    success, setSuccess,
    toast, setToast,
    metaAssets, metaAssetsLoading, metaAssetsError,
    tiktokAccounts, tiktokAccountsLoading, tiktokAccountsError,
    reinstallingManagedPlatform,
    reinstallingGoogleAndMeta,
    isWizardOpen, setIsWizardOpen,
    wizardStep,
    wizardPlatform,
    wizardSaving,
    wizardValues, setWizardValues,
    wizardResumeAvailable,
    wizardLastSavedAt,
    wizardPlatforms,
    completedWizardPlatforms,
    wizardCompletedCount,
    wizardTotalCount,
    wizardHasPendingPlatforms,
    wizardProgressPercent,
    wizardLastSavedLabel,
    openConnectionWizard,
    handleWizardInput,
    handleWizardNext,
    handleWizardBack,
    handleWizardSubmit,
    runOAuthForWizard,
    clearWizardDraft,
    pauseWizardForLater,
    resumeWizard,
    loadManagedMetaAssets,
    loadManagedTikTokAccounts,
    handleGoogleConnect,
    handleMetaConnect,
    handleTikTokConnect,
    handleReinstallManagedConnection,
    handleReinstallGoogleAndMeta,
    handleMigrateAi,
    handleSave,
    handleTest,
    handleHardResetConnection,
    handleExpand,
    handleInputChange,
    blockIfReadOnly,
    languageSafeText,
    setWizardPlatform,
    isWizardPlatformDone,
    getConnectionSettingsById,
  } = useIntegrationsLogic({
    connections,
    dataOwnerUid,
    isWorkspaceReadOnly,
    isHebrew,
    language,
    t,
    updateConnectionSettings,
    clearConnectionSettings,
    testConnection,
    migrateAiConnectionsFromUser,
  });


  const renderIntegrationSettings = (integration: Connection) => (
    <IntegrationSettingsPanel
      integration={integration}
      isDemo={isDemo}
      isAdmin={isAdmin}
      isHebrew={isHebrew}
      language={language}
      dir={dir}
      formValues={formValues}
      testingId={testingId}
      reinstallingManagedPlatform={reinstallingManagedPlatform}
      reinstallingGoogleAndMeta={reinstallingGoogleAndMeta}
      metaAssets={metaAssets}
      metaAssetsLoading={metaAssetsLoading}
      metaAssetsError={metaAssetsError}
      tiktokAccounts={tiktokAccounts}
      tiktokAccountsLoading={tiktokAccountsLoading}
      tiktokAccountsError={tiktokAccountsError}
      onClose={() => setExpandedId(null)}
      onInputChange={handleInputChange}
      onSave={handleSave}
      onTest={handleTest}
      onHardReset={handleHardResetConnection}
      onMigrateAi={handleMigrateAi}
      onGoogleConnect={handleGoogleConnect}
      onMetaConnect={handleMetaConnect}
      onTikTokConnect={handleTikTokConnect}
      onReinstallPlatform={handleReinstallManagedConnection}
      onLoadMetaAssets={loadManagedMetaAssets}
      onLoadTikTokAccounts={loadManagedTikTokAccounts}
      onClearConnectionSettings={clearConnectionSettings}
      onSetFormValues={setFormValues}
      onSetToast={setToast}
      t={t}
    />
  );

  const renderConnectionCard = (integration: Connection) => {
    const isConnected = integration.status === 'connected';
    const isConnecting = integration.status === 'connecting';
    const hasError = integration.status === 'error';
    const Icon = iconMap[integration.id] || Plug;
    const isExpanded = expandedId === integration.id;
    const supportsWizard = Object.prototype.hasOwnProperty.call(WIZARD_FIELDS, integration.id);
    const brand = brandStyles[integration.id] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-200', lightBg: 'bg-gray-50' };
    const activeAccountSummary = getActiveAccountSummary(integration);
    
    return (
      <motion.div 
        layout
        key={integration.id} 
        className={cn(
          "bg-white rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden group relative shadow-sm hover:shadow-xl",
          isConnected ? "border-emerald-200 shadow-emerald-100/50" : 
          hasError ? "border-red-200 shadow-red-100/50" : "border-gray-200/80 hover:border-indigo-200",
          isExpanded && "ring-2 ring-indigo-400 ring-offset-2 border-indigo-300 shadow-xl md:col-span-2"
        )}
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105",
                brand.bg, brand.text
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">{t(integration.name)}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t(integration.description)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('integrations.connected')}
                    </span>
                  ) : isConnecting ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('integrations.connecting')}
                    </span>
                  ) : hasError ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5" /> {t('integrations.errorStatus')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">{t('integrations.disconnected')}</span>
                  )}
                </div>
                {isConnected && activeAccountSummary ? (
                  <p className="mt-1 text-[11px] text-gray-600 truncate">
                    <span className="font-semibold text-gray-700">
                      {isHebrew ? 'חשבון פעיל:' : 'Active account:'}
                    </span>{' '}
                    <span className="font-medium">{activeAccountSummary}</span>
                  </p>
                ) : null}
              </div>
            </div>

            {!isExpanded && !(integration.category === 'AI Engine' && !isAdmin) && (
              <div className="shrink-0 flex items-center gap-2">
                {supportsWizard && (
                  <button
                    onClick={() => openConnectionWizard(integration.id as WizardPlatform)}
                    disabled={isConnecting}
                    title={isHebrew ? 'פתח שאלון נכסים' : 'Open assets questionnaire'}
                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-50 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleExpand(integration)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 font-bold text-sm",
                    isConnected
                      ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                      : hasError
                      ? "text-red-600 bg-red-50 hover:bg-red-100"
                      : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                  )}
                >
                  {isConnecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isConnected ? (
                    <Settings2 className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {isConnected && integration.score != null && !isExpanded && (
            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${integration.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  "h-full rounded-full",
                  integration.score >= 90 ? "bg-emerald-500" :
                  integration.score >= 70 ? "bg-amber-500" :
                  "bg-red-500"
                )}
              />
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t(integration.description)}</p>
                  {renderIntegrationSettings(integration)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const aiConnections = connections.filter(c => c.category === 'AI Engine');
  const googleConnections = connections.filter(c => c.category === 'Google');
  const socialConnections = connections.filter(c => c.category === 'Social');
  const metaConnections = socialConnections.filter(c => c.id === 'meta');
  const tiktokConnections = socialConnections.filter(c => c.id === 'tiktok');
  const ecommerceConnections = connections.filter(c => c.category === 'E-commerce');
  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const aiConnectedCount = aiConnections.filter((connection) => connection.status === 'connected').length;
  const expandedAiConnection = aiConnections.find((connection) => connection.id === expandedId) || null;
  const wizardFields = WIZARD_FIELDS[wizardPlatform];
  const wizardConnection = connections.find((c) => c.id === wizardPlatform);
  const oauthTokenKey: Record<WizardPlatform, string | null> = {
    google: 'googleAccessToken',
    meta: 'metaToken',
    tiktok: null, // Token is stored server-side via OAuth, not in client settings.
    woocommerce: null,
    shopify: null,
  };
  const oauthSupportedPlatforms: WizardPlatform[] = ['google', 'meta', 'tiktok'];
  const oauthSupported = oauthSupportedPlatforms.includes(wizardPlatform);
  const activeOauthTokenKey = oauthTokenKey[wizardPlatform];
  const hasOauthToken = activeOauthTokenKey
    ? Boolean(wizardValues[activeOauthTokenKey] || wizardConnection?.settings?.[activeOauthTokenKey])
    : true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-xl mx-auto max-w-7xl mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Plug className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('integrations.title')}</h1>
                <p className="text-indigo-100 text-sm sm:text-base mt-1 font-medium max-w-xl">{t('integrations.subtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20">
                <span className="text-2xl font-black">{connectedCount}</span>
                <span className="text-indigo-100 text-sm font-medium">
                  / {connections.length} {language === 'he' ? 'מחוברים' : 'connected'}
                </span>
              </div>
              <button
                onClick={() => {
                  if (wizardResumeAvailable) {
                    resumeWizard();
                    return;
                  }
                  openConnectionWizard('google');
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-sm hover:bg-white/30 transition-all"
              >
                <Settings2 className="w-4 h-4" />
                {wizardResumeAvailable
                  ? (isHebrew ? 'חזרה מהירה לאשף' : 'Quick return to wizard')
                  : (isHebrew ? 'שאלון התחברות לנכסים' : 'Assets connection wizard')}
              </button>
              <button
                onClick={() => {
                  const connected = connections.filter(c => c.status === 'connected');
                  connected.forEach(c => handleTest(c.id));
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('integrations.testAll')}
              </button>
              <button
                onClick={async () => {
                  if (window.confirm(t('integrations.resetAllConfirm'))) {
                    try {
                      await resetAllConnections();
                      setExpandedId(null);
                      setFormValues({});
                      setToast({ message: t('integrations.resetAllDone'), type: 'success' });
                      setTimeout(() => setToast(null), 3000);
                    } catch (err) {
                      setToast({
                        message:
                          err instanceof Error && err.message
                            ? err.message
                            : isHebrew
                            ? 'איפוס כולל נכשל. נסה שוב.'
                            : 'Failed to reset all connections. Please retry.',
                        type: 'error',
                      });
                      setTimeout(() => setToast(null), 3500);
                    }
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white font-bold text-sm hover:bg-white/30 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t('integrations.resetAll')}
              </button>
              <button
                onClick={() => {
                  void handleReinstallGoogleAndMeta();
                }}
                disabled={reinstallingGoogleAndMeta || reinstallingManagedPlatform !== null}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-sm hover:bg-amber-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reinstallingGoogleAndMeta ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {isHebrew ? 'התקנה מחדש Google + Meta' : 'Re-install Google + Meta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto" dir="ltr">
            {(
              [
                { id: 'overview' as const, label: t('integrations.tabs.overview'), icon: <Grid3X3 className="w-4 h-4" /> },
                { id: 'google' as const, label: 'Google', icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )},
                { id: 'meta' as const, label: 'Meta', icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="#0866FF">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )},
                { id: 'tiktok' as const, label: 'TikTok', icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.42a8.16 8.16 0 0 0 4.77 1.52V7.49a4.85 4.85 0 0 1-1-.8z"/>
                  </svg>
                )},
                { id: 'whatsapp' as const, label: 'WhatsApp', icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                )},
                { id: 'more' as const, label: t('integrations.tabs.more'), icon: <MoreHorizontal className="w-4 h-4" /> },
              ] as Array<{ id: TabId; label: string; icon: React.ReactNode }>
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex-shrink-0',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-700 bg-indigo-50/60'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={cn(
              "fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-1.5rem)] max-w-md sm:w-auto sm:min-w-[320px] px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2",
              toast.type === 'success' ? "bg-emerald-600 border-emerald-400 text-white" : "bg-red-600 border-red-400 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-bold break-words">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {(wizardResumeAvailable || (wizardCompletedCount > 0 && wizardHasPendingPlatforms)) && !isWizardOpen && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/70 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black text-indigo-900">
                {isHebrew ? 'אשף החיבורים מוכן להמשך' : 'Connections wizard ready to continue'}
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                {isHebrew
                  ? `הושלמו ${wizardCompletedCount} מתוך ${wizardTotalCount} חיבורים. אפשר לחזור בכל רגע ולהמשיך מאותה נקודה.`
                  : `${wizardCompletedCount} of ${wizardTotalCount} connections completed. Return anytime and continue from the same point.`}
              </p>
              {wizardLastSavedLabel && (
                <p className="text-[11px] text-indigo-600 mt-1">
                  {isHebrew ? `עודכן לאחרונה: ${wizardLastSavedLabel}` : `Last updated: ${wizardLastSavedLabel}`}
                </p>
              )}
              <div className="mt-3 h-2 w-full max-w-md rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, wizardProgressPercent))}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={resumeWizard}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                {isHebrew ? 'המשך הגדרות אשף' : 'Continue wizard setup'}
              </button>
              <button
                onClick={clearWizardDraft}
                className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 bg-white text-xs sm:text-sm font-semibold hover:bg-indigo-50 transition-colors"
              >
                {isHebrew ? 'איפוס זיכרון אשף' : 'Reset wizard memory'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConnectionWizard
        isWizardOpen={isWizardOpen}
        wizardStep={wizardStep}
        wizardPlatform={wizardPlatform}
        wizardSaving={wizardSaving}
        wizardValues={wizardValues}
        wizardFields={wizardFields}
        wizardConnection={wizardConnection}
        oauthSupported={oauthSupported}
        hasOauthToken={hasOauthToken}
        isHebrew={isHebrew}
        connections={connections}
        isWizardPlatformDone={isWizardPlatformDone}
        getConnectionSettingsById={getConnectionSettingsById}
        setWizardPlatform={setWizardPlatform}
        setWizardValues={setWizardValues}
        setIsWizardOpen={setIsWizardOpen}
        handleWizardInput={handleWizardInput}
        handleWizardNext={handleWizardNext}
        handleWizardBack={handleWizardBack}
        handleWizardSubmit={handleWizardSubmit}
        pauseWizardForLater={pauseWizardForLater}
        runOAuthForWizard={runOAuthForWizard}
      />

      {/* Success / Error inline */}
      {success && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <p className="text-sm font-bold text-emerald-800">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-emerald-100 rounded-xl transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-start justify-between shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-800">
                  {(() => {
                    const connectionName = connections.find((i) => i.id === error.id)?.name || '';
                    const errorTemplate = t('integrations.error');
                    return errorTemplate.includes('{{name}}')
                      ? errorTemplate.replace('{{name}}', connectionName)
                      : `${errorTemplate} ${connectionName}`.trim();
                  })()}
                </h3>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
                {error.id === 'google' && (
                  <p className="text-sm text-amber-700 mt-2 font-medium">{t('integrations.googleReconnectHint')}</p>
                )}
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-xl transition-colors shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        {isWorkspaceReadOnly && (
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-sm font-bold text-amber-800">
            {t('integrations.readOnlyWorkspace')}
          </div>
        )}

        {/* ── OVERVIEW TAB ─────────────────────────────── */}
        {activeTab === 'overview' && (
          <OverviewTab
            googleConnections={googleConnections}
            metaConnections={metaConnections}
            tiktokConnections={tiktokConnections}
            ecommerceConnections={ecommerceConnections}
            aiConnections={aiConnections}
            aiConnectedCount={aiConnectedCount}
            isAdmin={isAdmin}
            language={language}
            expandedAiConnection={expandedAiConnection}
            t={t}
            setActiveTab={setActiveTab}
            handleExpand={handleExpand}
            handleMigrateAi={handleMigrateAi}
            renderIntegrationSettings={renderIntegrationSettings}
          />
        )}

        {/* ── GOOGLE TAB ───────────────────────────────── */}
        {activeTab === 'google' && (
          <GoogleTab
            googleConnections={googleConnections}
            t={t}
            renderConnectionCard={renderConnectionCard}
          />
        )}

        {/* ── META TAB ─────────────────────────────────── */}
        {activeTab === 'meta' && (
          <MetaTab
            metaConnections={metaConnections}
            renderConnectionCard={renderConnectionCard}
          />
        )}

        {/* ── TIKTOK TAB ───────────────────────────────── */}
        {activeTab === 'tiktok' && (
          <TikTokTab
            tiktokConnections={tiktokConnections}
            renderConnectionCard={renderConnectionCard}
          />
        )}

        {/* ── WHATSAPP TAB ─────────────────────────────── */}
        {activeTab === 'whatsapp' && (
          <section className="rounded-3xl border border-gray-200/80 bg-white/80 p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-9 h-9" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">WhatsApp</h2>
              <p className="text-gray-500 text-sm mt-1">{t('integrations.whatsappComingSoon')}</p>
            </div>
          </section>
        )}

        {/* ── MORE TAB ─────────────────────────────────── */}
        {activeTab === 'more' && (
          <EcommerceTab
            ecommerceConnections={ecommerceConnections}
            t={t}
            renderConnectionCard={renderConnectionCard}
          />
        )}
      </div>
    </div>
  );
}
