import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { DollarSign, TrendingUp, TrendingDown, Activity, Download, Filter, Zap, BarChart3, PieChart, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Legend } from 'recharts';
import { cn } from '../lib/utils';

const financialData = [
  { name: 'ינואר', revenue: 12000, spend: 4000, profit: 8000 },
  { name: 'פברואר', revenue: 19000, spend: 6000, profit: 13000 },
  { name: 'מרץ', revenue: 15000, spend: 5000, profit: 10000 },
  { name: 'אפריל', revenue: 22000, spend: 8000, profit: 14000 },
  { name: 'מאי', revenue: 28000, spend: 9000, profit: 19000 },
  { name: 'יוני', revenue: 24000, spend: 7000, profit: 17000 },
  { name: 'יולי', revenue: 31000, spend: 10000, profit: 21000 },
];

const platformData = [
  { name: 'Google Ads', spend: 4500, roas: 3.2 },
  { name: 'Meta Ads', spend: 3200, roas: 2.8 },
  { name: 'TikTok Ads', spend: 2300, roas: 2.1 },
];

export function Profitability() {
  const { t, dir } = useLanguage();
  const { dateRange } = useDateRange();
  const [reportType, setReportType] = useState<'period' | 'campaigns' | 'platforms'>('period');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.profitability') || 'רווחיות / דוחות כספיים'}</h1>
          <p className="text-sm text-gray-500 mt-1">ניתוח פיננסי מקיף, דוחות כספיים ותובנות AI לעסק שלך.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            {t('common.filter') || 'סינון'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            {t('common.export') || 'ייצוא דוח'}
          </button>
        </div>
      </div>

      {/* Top KPIs - Synced with Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full" dir="ltr">
              <TrendingUp className="w-3 h-3" /> +12.5%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">הכנסות (WooCommerce)</p>
          <p className="text-3xl font-black text-gray-900">₪151,000</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full" dir="ltr">
              <TrendingDown className="w-3 h-3" /> -4.2%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">הוצאות פרסום (Ads)</p>
          <p className="text-3xl font-black text-gray-900">₪49,000</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full" dir="ltr">
              <TrendingUp className="w-3 h-3" /> +18.7%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">רווח נקי</p>
          <p className="text-3xl font-black text-gray-900">₪102,000</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full" dir="ltr">
              <TrendingUp className="w-3 h-3" /> +0.4
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">ROAS ממוצע</p>
          <p className="text-3xl font-black text-gray-900" dir="ltr">3.08x</p>
        </div>
      </div>

      {/* AI Financial Analysis */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">ניתוח AI והמלצות פיננסיות</h2>
              <p className="text-sm text-gray-500">תובנות חכמות לשיפור הרווחיות וייעול התקציב</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">סיכום ביצועים</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                הרווח הנקי שלך במגמת עלייה עקבית. ניתוח הנתונים מראה כי קמפייני החיפוש ב-Google Ads מניבים את ההחזר הגבוה ביותר (ROAS 4.2x), בעוד שקמפייני הוידאו ב-TikTok דורשים אופטימיזציה של עלויות (CPA גבוה ב-20% מהממוצע).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">הזדמנות צמיחה</p>
                  <p className="text-xs text-emerald-700">הגדלת תקציב ב-15% לקמפיין "Best Sellers" עשויה להניב תוספת רווח של ₪8,500.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">התראת יעילות</p>
                  <p className="text-xs text-amber-700">3 קמפיינים ב-Meta Ads פועלים מתחת ליעד ה-ROAS. מומלץ לעדכן קריאייטיב.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-xl p-6 text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">פוטנציאל שיפור רווח</p>
              <p className="text-4xl font-black" dir="ltr">+₪12,500</p>
              <p className="text-indigo-200 text-xs mt-2">על בסיס יישום כל המלצות ה-AI</p>
            </div>
            <button className="mt-6 w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
              החל המלצות עכשיו
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Financial Reports */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">פירוט דוחות כספיים</h2>
            <p className="text-sm text-gray-500">פילוח נתונים לפי תקופה, פלטפורמה וקמפיין</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setReportType('period')}
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", reportType === 'period' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              תקופה
            </button>
            <button 
              onClick={() => setReportType('platforms')}
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", reportType === 'platforms' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              פלטפורמות
            </button>
            <button 
              onClick={() => setReportType('campaigns')}
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", reportType === 'campaigns' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              קמפיינים
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {reportType === 'period' && (
            <div className="space-y-6">
              <div className="h-80" dir="ltr">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSpnd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="הכנסות (₪)" />
                    <Area type="monotone" dataKey="spend" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSpnd)" name="הוצאות (₪)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="pb-4 font-medium">חודש</th>
                      <th className="pb-4 font-medium">הכנסות</th>
                      <th className="pb-4 font-medium">הוצאות פרסום</th>
                      <th className="pb-4 font-medium">רווח גולמי</th>
                      <th className="pb-4 font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {financialData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-bold text-gray-900">{row.name}</td>
                        <td className="py-4 text-emerald-600 font-bold">₪{row.revenue.toLocaleString()}</td>
                        <td className="py-4 text-red-500">₪{row.spend.toLocaleString()}</td>
                        <td className="py-4 text-indigo-600 font-bold">₪{row.profit.toLocaleString()}</td>
                        <td className="py-4 font-medium" dir="ltr">{(row.revenue / row.spend).toFixed(2)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'platforms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-80" dir="ltr">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RechartsBarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="spend" fill="#6366F1" radius={[6, 6, 0, 0]} name="הוצאות (₪)" maxBarSize={40} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">ביצועים לפי פלטפורמה</h3>
                {platformData.map((platform, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-500">
                        {platform.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{platform.name}</p>
                        <p className="text-xs text-gray-500">הוצאה: ₪{platform.spend.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-600" dir="ltr">{platform.roas}x ROAS</p>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${(platform.roas / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'campaigns' && (
            <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-gray-900">נתוני קמפיינים בטעינה</p>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  אנחנו מסנכרנים את נתוני הקמפיינים מכל הפלטפורמות המחוברות. זה עשוי לקחת מספר רגעים.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
