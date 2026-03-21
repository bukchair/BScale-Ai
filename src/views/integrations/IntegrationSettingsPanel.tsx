"use client";

import React from 'react';
import { motion } from 'motion/react';
import {
  Settings2, X, CheckCircle2, Sparkles, Loader2, Megaphone, RotateCcw,
  Facebook, Video, LinkIcon, Trash2, Plug, Key, HelpCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Connection } from '../../contexts/ConnectionsContext';
import type { MetaAssetsPayload } from './integrationUtils';
import {
  parseManagedGoogleAdsAccounts,
  formatGoogleAdsAccountId,
  normalizeMetaAccountId,
} from './integrationUtils';

export type Toast = { message: string; type: 'success' | 'error' };

export interface IntegrationSettingsPanelProps {
  integration: Connection;

  // display flags
  isDemo: boolean;
  isAdmin: boolean;
  isHebrew: boolean;
  language: string;
  dir: string;

  // form & async state
  formValues: Record<string, string>;
  testingId: string | null;
  reinstallingManagedPlatform: 'google' | 'meta' | 'tiktok' | null;
  reinstallingGoogleAndMeta: boolean;
  metaAssets: MetaAssetsPayload | null;
  metaAssetsLoading: boolean;
  metaAssetsError: string | null;
  tiktokAccounts: Array<{ externalAccountId: string; name?: string }>;
  tiktokAccountsLoading: boolean;
  tiktokAccountsError: string | null;

  // actions
  onClose: () => void;
  onInputChange: (key: string, value: string) => void;
  onSave: (id: string) => void;
  onTest: (id: string) => void;
  onHardReset: (id: string) => void;
  onMigrateAi: () => void;
  onGoogleConnect: () => void;
  onMetaConnect: () => void;
  onTikTokConnect: () => void;
  onReinstallPlatform: (platform: 'google' | 'meta' | 'tiktok') => void;
  onLoadMetaAssets: (values?: Record<string, string>) => void;
  onLoadTikTokAccounts: (values?: Record<string, string>) => void;
  onClearConnectionSettings: (id: string) => Promise<void>;
  onSetFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSetToast: (toast: Toast | null) => void;

  t: (key: string) => string;
}

export function IntegrationSettingsPanel({
  integration,
  isDemo,
  isAdmin,
  isHebrew,
  language,
  dir,
  formValues,
  testingId,
  reinstallingManagedPlatform,
  reinstallingGoogleAndMeta,
  metaAssets,
  metaAssetsLoading,
  metaAssetsError,
  tiktokAccounts,
  tiktokAccountsLoading,
  tiktokAccountsError,
  onClose,
  onInputChange,
  onSave,
  onTest,
  onHardReset,
  onMigrateAi,
  onGoogleConnect,
  onMetaConnect,
  onTikTokConnect,
  onReinstallPlatform,
  onLoadMetaAssets,
  onLoadTikTokAccounts,
  onClearConnectionSettings,
  onSetFormValues,
  onSetToast,
  t,
}: IntegrationSettingsPanelProps) {
  const isConnected = integration.status === 'connected';
  const isConnecting = integration.status === 'connecting';
  const isAiReadOnly = integration.category === 'AI Engine' && !isAdmin;

  // — Demo mode —
  if (isDemo) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-300 p-4 text-sm text-gray-700">
            <p className="font-bold mb-1">{language === 'he' ? 'מצב דמו פעיל' : 'Demo mode is active'}</p>
            <p className="text-xs text-gray-500">
              {language === 'he'
                ? 'בחשבון דמו לא ניתן לחבר פלטפורמות אמיתיות. כל הנתונים במסכים השונים מוצגים כנתוני דוגמה בלבד כדי שתוכל לראות איך המערכת נראית. להצטרפות לחבילה פעילה וחיבור פלטפורמות — עבור למסך המנויים.'
                : 'In demo accounts, real platform connections are disabled. Data shown across the app is sample data so you can explore the system. To connect real platforms, upgrade your subscription.'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // — AI read-only (non-admin) —
  if (isAiReadOnly) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              {t('integrations.connectionSettings')} — {t(integration.name)}
            </h4>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="rounded-2xl bg-gray-50 border-2 border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {isConnected ? (
                <span className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> {t('integrations.connected')}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-gray-500">{t('integrations.disconnected')}</span>
              )}
            </p>
            <p className="text-xs text-gray-500">{t('integrations.aiAdminOnly')}</p>
            {isAdmin ? (
              <button
                onClick={onMigrateAi}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {t('integrations.aiSharedWithAll')}
              </button>
            ) : (
              <p className="text-xs text-indigo-600 mt-1">{t('integrations.aiSharedWithAll')}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // — Main settings panel —
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-5 pt-5 border-t border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            {t('integrations.connectionSettings')} — {t(integration.name)}
          </h4>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Fields column — filled in next steps */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* platform fields — step 2ג–2ו */}
            </div>
            {/* action buttons — step 2ז */}
          </div>

          {/* Quick guide column — step 2ח */}
          <div className="w-full lg:w-56 shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
