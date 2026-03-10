import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Users as UsersIcon, Shield, UserPlus, MoreVertical, Search, Edit2, Trash2, Building, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'agency_manager' | 'site_owner' | 'editor' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  stores: string[];
  lastActive: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'Asher', email: 'asher205@gmail.com', role: 'creator', status: 'active', stores: ['All Stores'], lastActive: 'Just now' },
  { id: '2', name: 'Yossi Cohen', email: 'yossi@shoes.co.il', role: 'site_owner', status: 'active', stores: ['Yossi Shoes'], lastActive: '2 hours ago' },
  { id: '3', name: 'Dana Levi', email: 'dana@shoes.co.il', role: 'editor', status: 'active', stores: ['Yossi Shoes'], lastActive: '1 day ago' },
  { id: '4', name: 'Digital Agency Ltd', email: 'hello@agency.com', role: 'agency_manager', status: 'active', stores: ['Yossi Shoes', 'Tech Gadgets', 'Beauty Shop'], lastActive: '5 hours ago' },
  { id: '5', name: 'Ron Viewer', email: 'ron@investor.com', role: 'viewer', status: 'invited', stores: ['Tech Gadgets'], lastActive: 'Never' },
];

const roleLabels: Record<User['role'], { label: string, icon: React.ElementType, color: string, bg: string }> = {
  creator: { label: 'יוצר ממשק', icon: Shield, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  agency_manager: { label: 'מנהל סוכנות', icon: UsersIcon, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  site_owner: { label: 'בעל האתר', icon: Building, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  editor: { label: 'עורך', icon: Edit2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  viewer: { label: 'צופה', icon: Search, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
};

export function Users() {
  const { t, dir } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.users')}</h1>
          <p className="text-sm text-gray-500 mt-1">ניהול הרשאות, משתמשים וסוכנויות במערכת.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
          <UserPlus className="w-4 h-4" />
          הוסף משתמש חדש
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">סה"כ משתמשים</p>
            <p className="text-2xl font-bold text-gray-900">24</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">משתמשים פעילים</p>
            <p className="text-2xl font-bold text-gray-900">18</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">הזמנות ממתינות</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">מנהלי מערכת</p>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", dir === 'rtl' ? "right-3" : "left-3")} />
            <input 
              type="text" 
              placeholder="חיפוש משתמשים..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full border border-gray-200 bg-gray-50 rounded-lg py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all",
                dir === 'rtl' ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button 
              onClick={() => setSelectedRole('all')}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors", selectedRole === 'all' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              הכל
            </button>
            {Object.entries(roleLabels).map(([key, role]) => (
              <button 
                key={key}
                onClick={() => setSelectedRole(key)}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors", selectedRole === key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">משתמש</th>
                <th className="px-6 py-4 font-medium">תפקיד</th>
                <th className="px-6 py-4 font-medium">חנויות מנוהלות</th>
                <th className="px-6 py-4 font-medium">סטטוס</th>
                <th className="px-6 py-4 font-medium">פעילות אחרונה</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const roleInfo = roleLabels[user.role];
                const RoleIcon = roleInfo.icon;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200/50">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border", roleInfo.bg, roleInfo.color)}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.stores.slice(0, 2).map((store, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border border-gray-200/50">
                            {store}
                          </span>
                        ))}
                        {user.stores.length > 2 && (
                          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-medium border border-gray-200/50">
                            +{user.stores.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold",
                        user.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        user.status === 'invited' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {user.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {user.status === 'invited' && <Mail className="w-3.5 h-3.5" />}
                        {user.status === 'disabled' && <XCircle className="w-3.5 h-3.5" />}
                        {user.status === 'active' ? 'פעיל' : user.status === 'invited' ? 'הוזמן' : 'מושעה'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">לא נמצאו תוצאות</h3>
              <p className="text-gray-500 text-sm">לא נמצאו משתמשים התואמים לחיפוש או לסינון הנוכחי.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
