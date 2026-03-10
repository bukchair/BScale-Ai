import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Wallet, TrendingUp, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Settings2, Zap, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

const platforms = [
  { id: 'google', name: 'Google Ads', currentSpend: 4500, allocatedBudget: 5000, roas: 3.2, status: 'optimal' },
  { id: 'meta', name: 'Meta Ads', currentSpend: 3200, allocatedBudget: 3000, roas: 2.8, status: 'overspending' },
  { id: 'tiktok', name: 'TikTok Ads', currentSpend: 2300, allocatedBudget: 4000, roas: 2.1, status: 'underperforming' },
];

export function Budget() {
  const { t, dir } = useLanguage();
  const [totalBudget, setTotalBudget] = useState(12000);
  const totalSpend = platforms.reduce((acc, p) => acc + p.currentSpend, 0);
  const remainingBudget = totalBudget - totalSpend;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.budget') || 'ניהול תקציב'}</h1>
          <p className="text-sm text-gray-500 mt-1">ניהול תקציבים חוצה פלטפורמות והחלת אופטימיזציות AI.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold shadow-sm">
          <Settings2 className="w-4 h-4" />
          הגדרות תקציב
        </button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">תקציב כולל</h3>
          </div>
          <p className="text-3xl font-black text-gray-900" dir="ltr">₪{totalBudget.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">הקצאה חודשית</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">הוצאה נוכחית</h3>
          </div>
          <p className="text-3xl font-black text-gray-900" dir="ltr">₪{totalSpend.toLocaleString()}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3" dir="ltr">
            <div 
              className={cn("h-1.5 rounded-full", (totalSpend / totalBudget) > 0.9 ? "bg-red-500" : "bg-indigo-600")} 
              style={{ width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">נותר</h3>
          </div>
          <p className="text-3xl font-black text-gray-900" dir="ltr">₪{remainingBudget.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">זמין להקצאה</p>
        </div>
      </div>

      {/* AI Budget Recommendations */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-indigo-900">אופטימיזציית תקציב AI</h2>
            <p className="text-sm text-indigo-700 mt-1">
              בהתבסס על ביצועי 7 הימים האחרונים, הקצאה מחדש של התקציב יכולה להגדיל את ה-ROAS הכולל בכ-12%.
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">הפחתת TikTok Ads</span>
                <span className="text-red-600 font-bold" dir="ltr">-₪500</span>
              </div>
              <p className="text-xs text-gray-500">ה-ROAS הנוכחי הוא 2.1x, מתחת לממוצע החשבון.</p>
            </div>
            {dir === 'rtl' ? (
              <ArrowLeft className="w-6 h-6 text-gray-400 hidden md:block" />
            ) : (
              <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
            )}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">הגדלת Google Ads</span>
                <span className="text-emerald-600 font-bold" dir="ltr">+₪500</span>
              </div>
              <p className="text-xs text-gray-500">קמפיינים ברשת החיפוש מניבים ROAS של 3.2x עם נתח חשיפות פנוי.</p>
            </div>
            <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
              <button className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm">
                החל העברה
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">הקצאה לפי פלטפורמה</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">פלטפורמה</th>
                <th className="px-6 py-4 font-semibold">תקציב מוקצה</th>
                <th className="px-6 py-4 font-semibold">הוצאה נוכחית</th>
                <th className="px-6 py-4 font-semibold">ROAS</th>
                <th className="px-6 py-4 font-semibold">סטטוס</th>
                <th className="px-6 py-4 font-semibold text-left">פעולה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platforms.map((platform) => (
                <tr key={platform.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{platform.name}</td>
                  <td className="px-6 py-4" dir="ltr">₪{platform.allocatedBudget.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span dir="ltr">₪{platform.currentSpend.toLocaleString()}</span>
                      <span className="text-xs text-gray-500" dir="ltr">
                        ({Math.round((platform.currentSpend / platform.allocatedBudget) * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600" dir="ltr">{platform.roas}x</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit",
                      platform.status === 'optimal' ? "bg-emerald-100 text-emerald-700" :
                      platform.status === 'overspending' ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {platform.status === 'optimal' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {platform.status === 'overspending' && <AlertCircle className="w-3.5 h-3.5" />}
                      {platform.status === 'underperforming' && <TrendingDown className="w-3.5 h-3.5" />}
                      {platform.status === 'optimal' ? 'אופטימלי' : platform.status === 'overspending' ? 'חריגה מהתקציב' : 'ביצועים חלשים'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button className="text-indigo-600 hover:text-indigo-900 font-bold text-sm">
                      ערוך תקציב
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
