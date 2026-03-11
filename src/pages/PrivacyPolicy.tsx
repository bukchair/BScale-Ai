import React from 'react';
import { ShieldCheck, Database, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white transition-colors duration-300" dir={dir}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('privacy.backToHome')}
        </button>

        <div className="mt-6 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-black mb-3">{t('privacy.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('privacy.lastUpdated')}</p>
          <p className="text-gray-700 dark:text-gray-300 leading-7 mb-8">{t('privacy.intro')}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
              <h3 className="font-bold mb-1">{t('privacy.cards.secureUseTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('privacy.cards.secureUseDesc')}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
              <h3 className="font-bold mb-1">{t('privacy.cards.dataMinimizationTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('privacy.cards.dataMinimizationDesc')}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
              <h3 className="font-bold mb-1">{t('privacy.cards.controlTitle')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('privacy.cards.controlDesc')}</p>
            </div>
          </div>

          <div className="space-y-8 leading-7">
            <section>
              <h2 className="text-xl font-black mb-2">{t('privacy.whatWeDoTitle')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('privacy.whatWeDoDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-black mb-2">{t('privacy.dataCollectedTitle')}</h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t('privacy.dataCollectedItems.account')}</li>
                <li>{t('privacy.dataCollectedItems.integrations')}</li>
                <li>{t('privacy.dataCollectedItems.metrics')}</li>
                <li>{t('privacy.dataCollectedItems.content')}</li>
                <li>{t('privacy.dataCollectedItems.logs')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black mb-2">{t('privacy.usageTitle')}</h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t('privacy.usageItems.dashboard')}</li>
                <li>{t('privacy.usageItems.recommendations')}</li>
                <li>{t('privacy.usageItems.automations')}</li>
                <li>{t('privacy.usageItems.support')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black mb-2">{t('privacy.sharingTitle')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('privacy.sharingDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-black mb-2">{t('privacy.rightsTitle')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('privacy.rightsDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-black mb-2">{t('privacy.contactTitle')}</h2>
              <p className="text-gray-700 dark:text-gray-300">{t('privacy.contactDesc')}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
