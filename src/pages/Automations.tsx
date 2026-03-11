import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Zap, Settings, Play, Pause, AlertTriangle, ListTodo, Search, Filter, Download, User } from 'lucide-react';
import { cn } from '../lib/utils';

const initialPendingApprovals = [
  { id: 1, type: 'הקצאת תקציב מחדש', description: 'העבר ₪500 מ-"חיפוש מותג" ל-"Performance Max" עקב ROAS גבוה יותר.', platform: 'Google Ads', impact: 'גבוה', time: 'לפני שעתיים' },
  { id: 2, type: 'עדכון קופירייטינג', description: 'עדכן את טקסט המודעה ב-Meta כך שיכלול "משלוח חינם" על סמך ניתוח מתחרים.', platform: 'Meta', impact: 'בינוני', time: 'לפני 5 שעות' },
  { id: 3, type: 'החרגת מילות מפתח', description: 'הוסף "חינם" ו-"זול" כמילות מפתח שליליות כדי להפחית הוצאות מבוזבזות.', platform: 'Google Ads', impact: 'גבוה', time: 'לפני יום' },
];

const initialAutomations = [
  { id: 1, name: 'השהיה אוטומטית של ביצועים נמוכים', description: 'השהה מודעות עם ROAS < 1.0 לאחר 3 ימים והוצאה של ₪100.', status: 'פעיל', platform: 'כל הפלטפורמות' },
  { id: 2, name: 'הגדלת תקציב', description: 'הגדל תקציב ב-10% עבור קמפיינים ששומרים על ROAS > 3.0 במשך 7 ימים.', status: 'מושהה', platform: 'Meta' },
  { id: 3, name: 'התאמות הצעות מחיר', description: 'הגדל הצעות מחיר ב-15% בשעות שיא של המרות (18:00 - 22:00).', status: 'פעיל', platform: 'Google Ads' },
];

const initialActivities = [
  { id: 1, user: 'Asher B.', action: 'אישר המלצת AI', details: 'הקצאת תקציב מחדש: הועברו ₪500 ל-Performance Max', time: 'לפני 10 דקות', type: 'approval', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 2, user: 'System AI', action: 'יצר קופירייטינג חדש', details: 'נוצרו 3 וריאציות לקמפיין "מבצע קיץ"', time: 'לפני שעה', type: 'ai', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 3, user: 'Asher B.', action: 'עדכן הגדרות', target: 'חיוב', details: 'שונה אמצעי תשלום ראשי', time: 'לפני 3 שעות', type: 'settings', icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' },
  { id: 4, user: 'System', action: 'שגיאת חיבור', target: 'Shopify', details: 'נכשל סנכרון נתוני מלאי. מנסה שוב...', time: 'לפני 5 שעות', type: 'error', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 5, user: 'Asher B.', action: 'יצר קהל', target: 'Meta', details: 'Lookalike 1% - לקוחות LTV גבוה', time: 'לפני יום', type: 'action', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 6, user: 'System AI', action: 'השהה קמפיין', target: 'Google Ads', details: 'כלל אוטומטי: "השהיית ביצועים נמוכים אוטומטית" הופעל עבור "רשת המדיה - ריטרגטינג"', time: 'לפני יום', type: 'automation', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
];

export function Automations() {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'approvals' | 'rules' | 'log'>('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState(initialPendingApprovals);
  const [automations, setAutomations] = useState(initialAutomations);
  const [activities, setActivities] = useState(initialActivities);

  const addActivity = (action: string, details: string, type: any = 'action') => {
    const iconMap: Record<string, any> = {
      approval: CheckCircle2,
      ai: Zap,
      settings: Settings,
      error: AlertTriangle,
      action: User,
      automation: Zap,
    };
    const colorMap: Record<string, string> = {
      approval: 'text-emerald-500',
      ai: 'text-indigo-500',
      settings: 'text-gray-500',
      error: 'text-red-500',
      action: 'text-blue-500',
      automation: 'text-amber-500',
    };
    const bgMap: Record<string, string> = {
      approval: 'bg-emerald-50',
      ai: 'bg-indigo-50',
      settings: 'bg-gray-50',
      error: 'bg-red-50',
      action: 'bg-blue-50',
      automation: 'bg-amber-50',
    };

    setActivities((prev) => [
      {
        id: Date.now(),
        user: 'You',
        action,
        details,
        time: 'עכשיו',
        type,
        icon: iconMap[type] || User,
        color: colorMap[type] || 'text-blue-500',
        bg: bgMap[type] || 'bg-blue-50',
      },
      ...prev,
    ]);
  };

  const handleCreateRule = () => {
    const name = window.prompt('שם החוק החדש');
    if (!name) return;
    setAutomations((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        description: 'חוק חדש נוצר ידנית.',
        status: 'פעיל',
        platform: 'כל הפלטפורמות',
      },
    ]);
    addActivity('יצר חוק אוטומציה', `נוצר חוק חדש: ${name}`, 'automation');
    setActiveTab('rules');
  };

  const handleApproval = (id: number, approved: boolean) => {
    const item = pendingApprovals.find((a) => a.id === id);
    setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
    if (item) {
      addActivity(
        approved ? 'אישר המלצה' : 'דחה המלצה',
        `${item.type}: ${item.description}`,
        approved ? 'approval' : 'action'
      );
    }
  };

  const handleToggleRule = (id: number) => {
    setAutomations((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, status: rule.status === 'פעיל' ? 'מושהה' : 'פעיל' } : rule
      )
    );
    const current = automations.find((r) => r.id === id);
    if (current) {
      addActivity(
        current.status === 'פעיל' ? 'השהה חוק אוטומציה' : 'הפעיל חוק אוטומציה',
        current.name,
        'automation'
      );
    }
  };

  const handleEditRule = (id: number) => {
    const current = automations.find((r) => r.id === id);
    if (!current) return;
    const name = window.prompt('עדכן שם חוק', current.name);
    if (!name || name === current.name) return;
    setAutomations((prev) => prev.map((rule) => (rule.id === id ? { ...rule, name } : rule)));
    addActivity('עדכן חוק אוטומציה', `${current.name} -> ${name}`, 'settings');
  };

  const handleExportActivities = () => {
    const rows = activities.map((a) => ({
      user: a.user,
      action: a.action,
      details: a.details,
      time: a.time,
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => (row as any)[h]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automations-activity-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.approvalsAutomations') || 'אישורים / אוטומציות'}</h1>
          <p className="text-sm text-gray-500 mt-1">סקור המלצות AI ונהל חוקים אוטומטיים.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateRule}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold shadow-sm"
          >
            <Zap className="w-4 h-4" />
            צור חוק חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('approvals')}
              className={cn("flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-md transition-colors", activeTab === 'approvals' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              <ShieldAlert className="w-4 h-4" />
              אישורים ממתינים
              <span className={cn("bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs", dir === 'rtl' ? "mr-1" : "ml-1")}>3</span>
            </button>
            <button 
              onClick={() => setActiveTab('rules')}
              className={cn("flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-md transition-colors", activeTab === 'rules' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              <Settings className="w-4 h-4" />
              חוקים אוטומטיים
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={cn("flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-md transition-colors", activeTab === 'log' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              <ListTodo className="w-4 h-4" />
              יומן פעילות
            </button>
          </div>
          
          {activeTab === 'log' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", dir === 'rtl' ? "right-3" : "left-3")} />
                <input 
                  type="text" 
                  placeholder="חיפוש פעילויות..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "w-full py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs",
                    dir === 'rtl' ? "pr-9 pl-3" : "pl-9 pr-3"
                  )}
                />
              </div>
              <button
                onClick={handleExportActivities}
                className="p-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">{approval.type}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {approval.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{approval.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-600">פלטפורמה: <span className="font-bold text-gray-900" dir="ltr">{approval.platform}</span></span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> השפעה: {approval.impact}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleApproval(approval.id, false)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold"
                    >
                      <XCircle className="w-4 h-4" /> דחה
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" /> אשר
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              {automations.map((rule) => (
                <div key={rule.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900">{rule.name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        rule.status === 'פעיל' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {rule.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" dir="ltr">פלטפורמה: {rule.platform}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {rule.status === 'פעיל' ? (
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors text-sm font-bold"
                      >
                        <Pause className="w-4 h-4" /> השהה
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-bold"
                      >
                        <Play className="w-4 h-4" /> הפעל
                      </button>
                    )}
                    <button
                      onClick={() => handleEditRule(rule.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold"
                    >
                      <Settings className="w-4 h-4" /> ערוך
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'log' && (
            <div className={cn("relative border-gray-200 space-y-8 py-4", dir === 'rtl' ? "border-r mr-3" : "border-l ml-3")}>
              {activities.filter(a => a.action.toLowerCase().includes(searchTerm.toLowerCase()) || a.details.toLowerCase().includes(searchTerm.toLowerCase())).map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className={cn("relative", dir === 'rtl' ? "pr-8" : "pl-8")}>
                    <div className={cn("absolute top-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white", activity.bg, dir === 'rtl' ? "-right-4" : "-left-4")}>
                      <Icon className={cn("w-4 h-4", activity.color)} />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{activity.user}</span>
                          <span className="text-gray-500 text-sm">{activity.action}</span>
                          {activity.target && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{activity.target}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
