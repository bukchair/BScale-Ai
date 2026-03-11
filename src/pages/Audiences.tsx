import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Target, TrendingUp, Zap, Plus, ArrowLeft, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';

const initialAudiences = [
  { id: 1, name: 'נוטשי עגלה (30 ימים)', size: 4500, matchRate: 85, roas: 4.2, platform: 'Meta', status: 'פעיל' },
  { id: 2, name: 'לקוחות עם ערך חיי לקוח (LTV) גבוה', size: 1200, matchRate: 92, roas: 6.8, platform: 'Google', status: 'פעיל' },
  { id: 3, name: 'רוכשים אחרונים (7 ימים)', size: 850, matchRate: 88, roas: 2.1, platform: 'Meta', status: 'פעיל' },
  { id: 4, name: 'קהל דומה (Lookalike) 1% - LTV גבוה', size: 250000, matchRate: 100, roas: 3.5, platform: 'Meta', status: 'למידה' },
  { id: 5, name: 'מבקרי אתר (90 ימים)', size: 45000, matchRate: 75, roas: 1.8, platform: 'Google', status: 'פעיל' },
];

const recommendations = [
  {
    title: 'צור סגמנט "קונים מתמידים"',
    description: 'משתמשים שרכשו 3+ פעמים ב-6 החודשים האחרונים. סבירות גבוהה לרכישה חוזרת.',
    estimatedSize: '2,400',
    potentialRoas: '5.5x',
    platform: 'חוצה פלטפורמות'
  },
  {
    title: 'החרג "רוכשים אחרונים" מקמפיינים של רכישה',
    description: 'אתה מציג כרגע מודעות רכישה לאנשים שקנו ב-14 הימים האחרונים. החרג אותם כדי לחסוך בתקציב.',
    estimatedSize: '3,200',
    potentialRoas: '+15% יעילות',
    platform: 'Meta & Google'
  },
  {
    title: 'קהל דומה של "נוטשי עגלה"',
    description: 'צור קהל דומה של 1% ממשתמשים שהוסיפו לעגלה אך לא רכשו. טוב למיקוד באמצע המשפך.',
    estimatedSize: '300,000',
    potentialRoas: '2.8x',
    platform: 'Meta'
  }
];

export function Audiences() {
  const { t, dir } = useLanguage();
  const [audiences, setAudiences] = React.useState(initialAudiences);

  const handleCreateAudience = () => {
    const name = window.prompt('שם הקהל החדש');
    if (!name) return;
    setAudiences((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        size: 0,
        matchRate: 0,
        roas: 0,
        platform: 'Meta',
        status: 'למידה',
      },
    ]);
  };

  const handleApplyRecommendation = (rec: any) => {
    setAudiences((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: rec.title,
        size: Number(String(rec.estimatedSize).replace(/[^\d]/g, '')) || 0,
        matchRate: 80,
        roas: Number(String(rec.potentialRoas).replace(/[^\d.]/g, '')) || 2.5,
        platform: rec.platform.includes('Meta') ? 'Meta' : 'Google',
        status: 'למידה',
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.audiences')}</h1>
          <p className="text-sm text-gray-500 mt-1">נהל את קהלי היעד שלך וגלה סגמנטים מבוססי בינה מלאכותית.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateAudience}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            צור קהל
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">סה"כ קהל פוטנציאלי</h3>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">345K</p>
          <p className="text-sm text-emerald-600 flex items-center mt-2 font-medium">
            <TrendingUp className={cn("w-4 h-4", dir === 'rtl' ? "ml-1" : "mr-1")} /> +12% לעומת חודש שעבר
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">סגמנטים פעילים</h3>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">14</p>
          <p className="text-sm text-gray-500 mt-2 font-medium">בכל הפלטפורמות</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">שיעור התאמה ממוצע</h3>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">84%</p>
          <p className="text-sm text-emerald-600 flex items-center mt-2 font-medium">
            <TrendingUp className={cn("w-4 h-4", dir === 'rtl' ? "ml-1" : "mr-1")} /> +2.4% לעומת חודש שעבר
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Audiences Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">קהלים פעילים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">שם קהל</th>
                  <th className="px-6 py-4 font-semibold">גודל</th>
                  <th className="px-6 py-4 font-semibold">שיעור התאמה</th>
                  <th className="px-6 py-4 font-semibold">החזר השקעה (ROAS)</th>
                  <th className="px-6 py-4 font-semibold">פלטפורמה</th>
                  <th className="px-6 py-4 font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {audiences.map((aud) => (
                  <tr key={aud.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{aud.name}</td>
                    <td className="px-6 py-4">{aud.size.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${aud.matchRate}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-600">{aud.matchRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">{aud.roas}x</td>
                    <td className="px-6 py-4 text-gray-600" dir="ltr">{aud.platform}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        aud.status === 'פעיל' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {aud.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-2xl shadow-lg p-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 relative z-10 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-400/20 rounded-lg flex items-center justify-center text-amber-300">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">סגמנטים חכמים</h2>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyRecommendation(rec)}
                  className="w-full text-start bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
                >
                  <h3 className="text-sm font-bold text-white mb-1">{rec.title}</h3>
                  <p className="text-xs text-indigo-200 mb-3 leading-relaxed">{rec.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium bg-white/10 px-2 py-1 rounded">
                        גודל: {rec.estimatedSize}
                      </span>
                      <span className="text-emerald-400 font-medium" dir="ltr">
                        {rec.potentialRoas}
                      </span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
