import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useDebouncedDimensions } from '../hooks/useDebouncedDimensions';
import ChartSkeleton from './dashboard/ChartSkeleton';

interface AuthStat {
    name: string;
    prijave: number;
    pregledi: number;
}

const fallbackData = [
  { name: '01.05.', prijave: 0, pregledi: 0 },
  { name: '02.05.', prijave: 0, pregledi: 0 },
];

export default function DashboardCharts({ data }: { data?: AuthStat[] }) {
  const { containerRef, dimensions } = useDebouncedDimensions(250);

  const chartData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    return safeData.length > 0 ? safeData : fallbackData;
  }, [data]);

  // Memoize styling of elements to prevent re-renders
  const xTickStyle = useMemo(() => ({ fill: '#ffffff20', fontSize: 9, fontWeight: 900 }), []);
  const yTickStyle = useMemo(() => ({ fill: '#ffffff20', fontSize: 9 }), []);
  const tooltipContentStyle = useMemo(() => ({ 
    backgroundColor: '#0A0F14', 
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    color: '#fff'
  }), []);
  const tooltipItemStyle = useMemo(() => ({ padding: '2px 0' }), []);
  const tooltipCursor = useMemo(() => ({ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }), []);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[300px] relative">
      {dimensions.width > 0 ? (
        <AreaChart 
          width={dimensions.width} 
          height={dimensions.height || 300} 
          data={chartData} 
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPregledi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FEBF0D" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FEBF0D" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPrijave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={xTickStyle}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={yTickStyle}
          />
          <Tooltip 
            contentStyle={tooltipContentStyle}
            itemStyle={tooltipItemStyle}
            cursor={tooltipCursor}
            isAnimationActive={false} // Disable heavy animations for high performance on mouse move
          />
          <Area 
            name="PREGLEDI"
            type="monotone" 
            dataKey="pregledi" 
            stroke="#FEBF0D" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPregledi)" 
            animationDuration={500} // Speed up animation from 1500 to 500
          />
          <Area 
            name="PRIJAVE"
            type="monotone" 
            dataKey="prijave" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrijave)" 
            animationDuration={500} // Speed up animation
          />
        </AreaChart>
      ) : (
        <ChartSkeleton />
      )}
    </div>
  );
}
