import React from 'react';
import { motion } from 'motion/react';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import DashboardGuard from '@/src/modules/dashboard/components/dashboard/DashboardGuard';

const COLORS = ['#FEBF0D', '#3b82f6', '#22c55e', '#ef4444', '#7c3aed', '#ec4899'];

interface AdminChartsProps {
  dynamicRegistrationData: any[];
  dynamicSectorData: any[];
}

const chartVariants: any = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 } }
};

export function AdminCharts({ dynamicRegistrationData, dynamicSectorData }: AdminChartsProps) {
  // Sanitizing data to prevent rendering crashes due to invalid/missing properties
  const safeRegistrationData = React.useMemo(() => {
    return (dynamicRegistrationData || []).map((item) => ({
      name: String(item?.name || ''),
      oglasi: typeof item?.oglasi === 'number' && !isNaN(item.oglasi) ? item.oglasi : 0,
      korisnici: typeof item?.korisnici === 'number' && !isNaN(item.korisnici) ? item.korisnici : 0,
    }));
  }, [dynamicRegistrationData]);

  const safeSectorData = React.useMemo(() => {
    return (dynamicSectorData || []).map((item) => ({
      name: String(item?.name || 'Ostalo'),
      value: typeof item?.value === 'number' && !isNaN(item.value) ? item.value : 0,
    }));
  }, [dynamicSectorData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Registration Chart */}
      <motion.div 
        variants={chartVariants}
        initial="hidden"
        animate="show"
        className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 h-[450px] flex flex-col relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none"></div>
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-10">RAST PLATFORME (Zadnjih 14 dana)</h3>
        <div className="flex-1 -ml-4">
          <DashboardGuard variant="inline" title="Greška pri učitavanju grafikona registracija">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeRegistrationData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <defs>
                  <linearGradient id="colorKorisnici" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FEBF0D" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FEBF0D" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOglasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#ffffff', opacity: 0.3, fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#ffffff', opacity: 0.3, fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0A0F14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', fontWeight: 800}}
                  itemStyle={{color: '#fff', fontWeight: 'black', textTransform: 'uppercase'}}
                />
                <Area type="monotone" dataKey="oglasi" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOglasi)" name="NOVI OGLASI" isAnimationActive={true} animationDuration={1500} />
                <Area type="monotone" dataKey="korisnici" stroke="#FEBF0D" strokeWidth={3} fillOpacity={1} fill="url(#colorKorisnici)" name="NOVI KORISNICI" isAnimationActive={true} animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </DashboardGuard>
        </div>
      </motion.div>

      {/* Sector Chart */}
      <motion.div 
        variants={chartVariants}
        initial="hidden"
        animate="show"
        className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 h-[450px] flex flex-col"
      >
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-10">SEKTORI RADA</h3>
        <div className="flex-1">
          <DashboardGuard variant="inline" title="Greška pri učitavanju grafikona sektora">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeSectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={10}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1500}
                >
                  {safeSectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </DashboardGuard>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
           {safeSectorData.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                 <span className="text-[9px] font-black text-white/40 uppercase truncate">{s.name}</span>
              </div>
           ))}
        </div>
      </motion.div>
    </div>
  );
}
