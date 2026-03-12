import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { BadgeCheck, Clock3, PhoneCall, UserRoundCheck, XCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

type LeadStatus = 'new' | 'contacted' | 'closed';

interface SalesLeadRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  sourcePath?: string;
  status: LeadStatus;
  createdAt: string;
}

export function Leads() {
  const { dir } = useLanguage();
  const [leads, setLeads] = useState<SalesLeadRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'salesLeads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        })) as SalesLeadRow[];
        setLeads(items);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load sales leads:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredLeads = useMemo(
    () => (statusFilter === 'all' ? leads : leads.filter((lead) => lead.status === statusFilter)),
    [leads, statusFilter]
  );

  const stats = useMemo(() => {
    const total = leads.length;
    const fresh = leads.filter((lead) => lead.status === 'new').length;
    const contacted = leads.filter((lead) => lead.status === 'contacted').length;
    const closed = leads.filter((lead) => lead.status === 'closed').length;
    return { total, fresh, contacted, closed };
  }, [leads]);

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await updateDoc(doc(db, 'salesLeads', leadId), { status });
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לידים מהאתר</h1>
        <p className="text-sm text-gray-500 mt-1">כל ליד חדש מהבוט נשמר כאן בזמן אמת עם פרטי קשר.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">סה"כ לידים</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">חדשים</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.fresh}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">בתהליך</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.contacted}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">נסגרו</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.closed}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-gray-900">ניהול סטטוס לידים</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700')}
            >
              הכל
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', statusFilter === 'new' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700')}
            >
              חדשים
            </button>
            <button
              onClick={() => setStatusFilter('contacted')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', statusFilter === 'contacted' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700')}
            >
              בתהליך
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold', statusFilter === 'closed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700')}
            >
              נסגרו
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">טוען לידים...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">אין לידים להצגה במסנן הנוכחי.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={cn('w-full text-sm', dir === 'rtl' ? 'text-right' : 'text-left')}>
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">שם</th>
                  <th className="px-4 py-3 font-semibold">יצירת קשר</th>
                  <th className="px-4 py-3 font-semibold">אתר</th>
                  <th className="px-4 py-3 font-semibold">מקור</th>
                  <th className="px-4 py-3 font-semibold">נוצר ב</th>
                  <th className="px-4 py-3 font-semibold">סטטוס</th>
                  <th className="px-4 py-3 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-700 space-y-0.5">
                        <p>{lead.email || '-'}</p>
                        <p>{lead.phone || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{lead.website || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.sourcePath || '/'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleString('he-IL') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold',
                          lead.status === 'new'
                            ? 'bg-indigo-50 text-indigo-700'
                            : lead.status === 'contacted'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {lead.status === 'new' && <Clock3 className="w-3.5 h-3.5" />}
                        {lead.status === 'contacted' && <PhoneCall className="w-3.5 h-3.5" />}
                        {lead.status === 'closed' && <BadgeCheck className="w-3.5 h-3.5" />}
                        {lead.status === 'new' ? 'חדש' : lead.status === 'contacted' ? 'בתהליך' : 'נסגר'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateLeadStatus(lead.id, 'contacted')}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          בתהליך
                        </button>
                        <button
                          onClick={() => updateLeadStatus(lead.id, 'closed')}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          נסגר
                        </button>
                        {lead.status !== 'new' && (
                          <button
                            onClick={() => updateLeadStatus(lead.id, 'new')}
                            className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            איפוס
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
