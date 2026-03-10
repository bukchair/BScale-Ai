import React, { useState, useEffect } from 'react';
import { getOptimizationRecommendations } from '../lib/gemini';
import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const mockCampaignData = [
  { id: 1, name: 'מבצע קיץ - נעליים', platform: 'Google', status: 'Active', spend: '₪1,200', roas: '2.5', cpa: '₪45' },
  { id: 2, name: 'ריטרגטינג - עגלה נטושה', platform: 'Meta', status: 'Active', spend: '₪800', roas: '4.2', cpa: '₪22' },
  { id: 3, name: 'קולקציה חדשה - וידאו', platform: 'TikTok', status: 'Paused', spend: '₪400', roas: '1.1', cpa: '₪85' },
  { id: 4, name: 'חיפוש מותג', platform: 'Google', status: 'Active', spend: '₪300', roas: '8.5', cpa: '₪12' },
];

export function Campaigns() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedRecs, setAppliedRecs] = useState<number[]>([]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const dataStr = JSON.stringify(mockCampaignData);
      const res = await getOptimizationRecommendations(dataStr);
      if (res.recommendations) {
        setRecommendations(res.recommendations);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = (index: number) => {
    setAppliedRecs([...appliedRecs, index]);
    // Here you would typically make an API call to apply the changes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ניהול קמפיינים ואופטימיזציה</h1>
        <button 
          onClick={fetchRecommendations}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Zap className="w-4 h-4 ml-2" />}
          רענן המלצות AI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">קמפיינים פעילים</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם קמפיין</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פלטפורמה</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הוצאה</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CPA</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockCampaignData.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        campaign.platform === 'Google' ? "bg-blue-100 text-blue-800" :
                        campaign.platform === 'Meta' ? "bg-indigo-100 text-indigo-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {campaign.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        campaign.status === 'Active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      )}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.spend}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.roas}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.cpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-indigo-50">
            <h3 className="text-lg leading-6 font-medium text-indigo-900 flex items-center">
              <Zap className="w-5 h-5 ml-2 text-indigo-600" />
              המלצות אופטימיזציה (AI)
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : recommendations.length > 0 ? (
              <ul className="space-y-4">
                {recommendations.map((rec, index) => (
                  <li key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2",
                            rec.impact === 'High' ? "bg-red-100 text-red-800" :
                            rec.impact === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-800"
                          )}>
                            השפעה: {rec.impact}
                          </span>
                          <span className="text-xs text-gray-500">{rec.platform}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-2">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => handleApply(index)}
                        disabled={appliedRecs.includes(index)}
                        className={cn(
                          "w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                          appliedRecs.includes(index)
                            ? "bg-green-50 text-green-700 border-green-200 cursor-not-allowed"
                            : "text-white bg-indigo-600 hover:bg-indigo-700"
                        )}
                      >
                        {appliedRecs.includes(index) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            יושם בהצלחה
                          </>
                        ) : (
                          'יישם אוטומטית'
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p>אין המלצות כרגע. לחץ על רענן כדי לנתח נתונים.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
