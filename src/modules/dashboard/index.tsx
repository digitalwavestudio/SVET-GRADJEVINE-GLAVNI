import React, { useMemo } from 'react';
import { Button, Card, Badge } from '@svet-gradjevine/ui';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, Briefcase, CreditCard, Clock, Plus, Tag } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useJobs } from '@/src/modules/jobs';
import { useMarketplaceList } from '@/src/modules/marketplace';
import { Link } from 'react-router-dom';

const data = [
  { name: 'Pon', views: 400 },
  { name: 'Uto', views: 300 },
  { name: 'Sre', views: 200 },
  { name: 'Čet', views: 278 },
  { name: 'Pet', views: 189 },
  { name: 'Sub', views: 239 },
  { name: 'Ned', views: 349 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: jobsData } = useJobs({ authorId: user?.id });
  const userJobs = jobsData?.pages.flatMap(page => page?.items || []) || [];
  const { data: marketplaceData } = useMarketplaceList({ authorId: user?.id });
  const userMarketplaceItems = marketplaceData?.pages.flatMap(page => page?.items || []) || [];

  const stats = [
    { label: 'Ukupro Pregleda', value: (userJobs.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0) + userMarketplaceItems.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0)).toString(), icon: TrendingUp, trend: '+0%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Prijave', value: '0', icon: Users, trend: '0%', color: 'text-blue-600', bg: 'bg-blue-50' }, // This would need application count
    { label: 'Aktivni Oglasi', value: (userJobs.length + userMarketplaceItems.length).toString(), icon: Briefcase, trend: '0%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Preostali Krediti', value: user?.freeAdsCount?.toString() || '0', icon: CreditCard, trend: '0%', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const recentItems = useMemo(() => {
    const getTimestamp = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (val instanceof Date) return val.getTime();
      if (typeof val === 'string') return new Date(val).getTime();
      if (typeof val === 'object' && '_seconds' in val) return val._seconds * 1000;
      if (typeof val === 'object' && 'toMillis' in val) return val.toMillis();
      if (typeof val === 'object' && 'toDate' in val) return val.toDate().getTime();
      return 0;
    };

    const combined = [
      ...userJobs.map(j => ({ ...j, dashboardType: 'job' as const })),
      ...userMarketplaceItems.map(m => ({ ...m, dashboardType: 'market' as const }))
    ].sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
    return combined.slice(0, 5);
  }, [userJobs, userMarketplaceItems]);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Zdravo, {user?.firstName}!</h1>
          <p className="text-slate-500 mt-1">Evo pregleda tvojih aktivnosti na platformi.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/moj-profil/oglasi">
            <Button variant="outline" size="md">
              <Clock className="w-4 h-4 mr-2" />
              Moji Oglasi
            </Button>
          </Link>
          <Link to="/postavi-oglas">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Novi Oglas
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-[10px] ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <Badge variant={stat.trend.startsWith('+') ? 'success' : stat.trend === '0%' ? 'secondary' : 'warning'}>
                {stat.trend}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">Analitika Poseta</h2>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-[10px] focus:ring-0">
              <option>Poslednjih 7 dana</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Moji Nedavni Oglasi</h2>
          <div className="space-y-6">
            {recentItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">Još uvek nemaš objavljenih oglasa.</p>
              </div>
            ) : recentItems.map((val: unknown) => {
              const item = val as { id: string; dashboardType?: string; title?: string; status?: string; viewsCount?: number };
              return (
              <div key={item.id} className="flex gap-4">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.dashboardType === 'job' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {item.dashboardType === 'job' ? <Briefcase className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.title || 'Oglas'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate uppercase tracking-wider font-semibold">
                    {item.dashboardType === 'job' ? 'Posao' : 'Marketplace'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                      {item.status === 'active' ? 'Aktivan' : 'Na čekanju'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {item.viewsCount || 0} pregleda
                    </span>
                  </div>
                </div>
              </div>
            )
            })}
          </div>
          <Link to="/moj-profil/oglasi">
            <Button variant="outline" size="sm" className="w-full mt-8">
              Upravljaj oglasima
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
