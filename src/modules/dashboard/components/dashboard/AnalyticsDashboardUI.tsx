import { useMemo, useCallback } from 'react';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { apiClient } from '@/src/lib/apiClient';
import AnalyticsSkeleton from '@/src/modules/dashboard/components/dashboard/AnalyticsSkeleton';
import { queryKeys } from "@/src/lib/queryKeysFactory";
import { useDebouncedDimensions } from '../../hooks/useDebouncedDimensions';

interface AnalyticsDashboardUIProps {
  userId: string;
}

export interface AnalyticsMetricType {
  date: string | number;
  views_internal?: number;
  clicks_internal?: number;
  views_external?: number;
  clicks_external?: number;
  views_direct?: number;
  clicks_direct?: number;
  clicks?: number;
  views?: number;
}

export default function AnalyticsDashboardUI({ userId }: AnalyticsDashboardUIProps) {
  const { ref: viewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const { containerRef: mainChartRef, dimensions: mainChartDim } = useDebouncedDimensions(250);
  const { containerRef: pieChartRef, dimensions: pieChartDim } = useDebouncedDimensions(250);

  const { data: trendData = [], isLoading } = useQuery({
    queryKey: queryKeys.analytics.detailed(userId),
    queryFn: async () => {
      return await apiClient.get<AnalyticsMetricType[]>(`/metrics/user/${userId}?days=14`);
    },
    enabled: inView
  });

  // Memoize mapped trend items
  const chartData = useMemo(() => {
    return trendData.map(item => ({
      name: new Date(item.date).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' }),
      internal: (item.views_internal || 0) + (item.clicks_internal || 0),
      external: (item.views_external || 0) + (item.clicks_external || 0) + (item.views_direct || 0) + (item.clicks_direct || 0),
      clicks: item.clicks || 0,
      views: item.views || 0
    }));
  }, [trendData]);

  // Memoize statistical calculations
  const totals = useMemo(() => {
    const totalInternal = trendData.reduce((acc, curr) => acc + (curr.views_internal || 0) + (curr.clicks_internal || 0), 0);
    const totalExternal = trendData.reduce((acc, curr) => acc + (curr.views_external || 0) + (curr.clicks_external || 0), 0);
    const totalDirect = trendData.reduce((acc, curr) => acc + (curr.views_direct || 0) + (curr.clicks_direct || 0), 0);
    const totalClicks = trendData.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const totalViews = trendData.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

    return { totalInternal, totalExternal, totalDirect, totalClicks, totalViews, ctr };
  }, [trendData]);

  // Memoize PieChart datasets
  const pieData = useMemo(() => {
    const { totalInternal, totalExternal, totalDirect } = totals;
    return [
      { name: 'Pretraga na sajtu', value: totalInternal, color: '#3b82f6' },
      { name: 'Google pretraga', value: totalExternal, color: '#10b981' },
      { name: 'Direktne posete', value: totalDirect, color: '#facc15' }
    ].filter(d => d.value > 0);
  }, [totals]);

  // Memoized styling objects to prevent reference-dependent re-renders
  const xAxisStyle = useMemo(() => ({
    fontSize: mainChartDim.width < 500 ? 9 : 11,
    fill: '#64748b'
  }), [mainChartDim.width]);

  const yAxisStyle = useMemo(() => ({
    fontSize: mainChartDim.width < 500 ? 9 : 11,
    fill: '#64748b'
  }), [mainChartDim.width]);

  const tooltipContentStyle = useMemo(() => ({ 
    borderRadius: '8px', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    backgroundColor: '#0A0F14',
    color: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
  }), []);
  
  const legendWrapperStyle = useMemo(() => ({ 
    paddingBottom: '20px', 
    fontSize: '10px', 
    fontWeight: 'black', 
    textTransform: 'uppercase' as const,
    color: '#94a3b8'
  }), []);
  
  const tooltipCursorStyle = useMemo(() => ({ fill: 'rgba(255, 255, 255, 0.02)' }), []);
  
  const xAxisPadding = useMemo(() => ({ 
    left: mainChartDim.width < 500 ? 10 : 20, 
    right: mainChartDim.width < 500 ? 10 : 20 
  }), [mainChartDim.width]);
  
  const yAxisPadding = useMemo(() => ({ 
    top: mainChartDim.width < 500 ? 10 : 20, 
    bottom: mainChartDim.width < 500 ? 10 : 20 
  }), [mainChartDim.width]);

  const formatXAxis = useCallback((value: string) => (mainChartDim.width < 500 ? value.split('.')[0] : value), [mainChartDim.width]);
  
  const formatYAxis = useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return Math.floor(value).toString();
  }, []);

  const barRadius = useMemo<[number, number, number, number]>(() => [4, 4, 0, 0], []);

  if (!inView || isLoading) return <div ref={viewRef}><AnalyticsSkeleton /></div>;

  const { totalInternal, totalExternal, totalDirect, totalClicks, totalViews, ctr } = totals;

  return (
    <div ref={viewRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Attribution Chart */}
      <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 relative z-10">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Analitika izvora saobraćaja</h3>
            <p className="text-xs text-white/40 uppercase font-black tracking-wider mt-1">Prikaz koliko vas ljudi pronalazi direktno na sajtu ili sa Google pretrage</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-2xl font-black text-secondary">{ctr}%</div>
            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">STOPA KLIKOVA (CTR)</div>
          </div>
        </div>

        <div ref={mainChartRef} className="h-[350px] w-full relative z-10">
          {mainChartDim.width > 0 && (
            <BarChart width={mainChartDim.width} height={mainChartDim.height || 350} data={chartData}>
              <CartesianGrid strokeDasharray={mainChartDim.width < 500 ? "2 2" : "3 3"} vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={xAxisStyle} 
                dy={mainChartDim.width < 500 ? 5 : 10}
                angle={mainChartDim.width < 500 ? -45 : 0}
                textAnchor={mainChartDim.width < 500 ? "end" : "middle"}
                interval={mainChartDim.width < 500 ? 1 : 0}
                padding={xAxisPadding}
                tickFormatter={formatXAxis}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={yAxisStyle} 
                width={mainChartDim.width < 500 ? 25 : 40}
                padding={yAxisPadding}
                tickFormatter={formatYAxis}
              />
              <Tooltip 
                cursor={tooltipCursorStyle}
                contentStyle={tooltipContentStyle}
                isAnimationActive={false} // Disable heavy tooltip animations for performance boost
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                wrapperStyle={legendWrapperStyle} 
              />
              <Bar 
                dataKey="internal" 
                name="Pretraga na sajtu" 
                fill="#3b82f6" 
                radius={barRadius} 
                barSize={mainChartDim.width < 500 ? 10 : 20} 
                isAnimationActive={false} // Avoid layout calculation lag on re-renders
              />
              <Bar 
                dataKey="external" 
                name="Google pretraga" 
                fill="#10b981" 
                radius={barRadius} 
                barSize={mainChartDim.width < 500 ? 10 : 20} 
                isAnimationActive={false} 
              />
            </BarChart>
          )}
        </div>
      </div>

      {/* Traffic Share Pie */}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden group flex flex-col items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.01] blur-2xl -mr-16 -mt-16"></div>
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 self-start relative z-10">Kroz koje mreže vas nalaze</h3>
        <div ref={pieChartRef} className="h-[250px] w-full mb-6 relative z-10 flex justify-center">
          {pieChartDim.width > 0 && (
            <PieChart width={pieChartDim.width} height={pieChartDim.height || 250}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={false} // Avoid recalculating arc coordinates on resize or hover entry
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip isAnimationActive={false} contentStyle={tooltipContentStyle} />
            </PieChart>
          )}
        </div>
        <div className="w-full space-y-4 relative z-10">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-white/40">{item.name}</span>
              </div>
              <span className="text-white">{((item.value / (totalInternal + totalExternal + totalDirect)) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">UKUPNO PREGLEDA</div>
          <div className="text-3xl font-black text-white">{totalViews.toLocaleString()}</div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl"></div>
        </div>
        <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">UKUPNO KLIKOVA</div>
          <div className="text-3xl font-black text-secondary">{totalClicks.toLocaleString()}</div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 blur-xl"></div>
        </div>
        <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">PREGLEDI NA PLATFORMI</div>
          <div className="text-3xl font-black text-blue-400">{totalInternal.toLocaleString()}</div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400/5 blur-xl"></div>
        </div>
        <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] relative overflow-hidden group">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">PREGLEDI SA GOOGLE-A</div>
          <div className="text-3xl font-black text-emerald-400">{totalExternal.toLocaleString()}</div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/5 blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
