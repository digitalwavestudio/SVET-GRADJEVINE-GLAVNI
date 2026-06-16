import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartSkeleton } from "./AnalyticsSkeleton";
import { useDebouncedDimensions } from "../../hooks/useDebouncedDimensions";

interface StandardTrendChartProps {
  trendLoading: boolean;
  trendData: unknown[];
}

export default function StandardTrendChart({ trendLoading, trendData }: StandardTrendChartProps) {
  const { containerRef, dimensions } = useDebouncedDimensions(250);

  // Memoize and normalize data to prevent recalculation and fill missing days in 30-day view
  const memoizedData = useMemo(() => {
    const rawData = trendData || [];
    const dataMap = new Map<string, any>();
    
    rawData.forEach((val) => {
      const item = val as Record<string, unknown>;
      if (!item) return;
      const key = item.name || item.date || "";
      if (typeof key === "string" && key.trim()) {
        const trimmedKey = key.trim();
        dataMap.set(trimmedKey, item);
        // Map alternative format endings with or without trailing dots
        if (trimmedKey.endsWith(".")) {
          dataMap.set(trimmedKey.slice(0, -1), item);
        } else {
          dataMap.set(trimmedKey + ".", item);
        }
      }
    });

    const normalized: unknown[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const tempDate = new Date(now);
      tempDate.setDate(now.getDate() - i);
      
      const labelWithDot = tempDate.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
      }) + ".";
      const labelWithoutDot = tempDate.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
      });

      const matched = dataMap.get(labelWithDot) || dataMap.get(labelWithoutDot);

      if (matched) {
        normalized.push({
          ...matched,
          name: labelWithDot,
          pregledi: Number(matched.pregledi || matched.views || 0),
          prijave: Number(matched.prijave || matched.applications || 0),
          prihodi: Number(matched.prihodi || matched.revenue || 0),
        });
      } else {
        normalized.push({
          name: labelWithDot,
          pregledi: 0,
          prijave: 0,
          prihodi: 0,
        });
      }
    }

    return normalized;
  }, [trendData]);

  // Use memoized chart configs to optimize heavy coordinates evaluations
  const xAxisTick = useMemo(() => ({
    fontSize: dimensions.width < 500 ? 9 : 12,
    fill: "#64748b"
  }), [dimensions.width]);

  const yAxisTick = useMemo(() => ({
    fontSize: dimensions.width < 500 ? 9 : 12,
    fill: "#64748b"
  }), [dimensions.width]);

  const tooltipContentStyle = useMemo(() => ({
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0A0F14",
    color: "#ffffff",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
    padding: "12px",
  }), []);

  const hasData = memoizedData.length > 0;

  return (
    <div className="bg-[#0A0F14] rounded-[10px] border border-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            Analitika Pregleda
          </h3>
          <p className="text-xs text-white/40 uppercase font-black tracking-wider mt-1">
            Ukupan broj pregleda vaših oglasa u zadnjih 30 dana
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-semibold border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Uživo
        </div>
      </div>

      <div ref={containerRef} className="h-[300px] w-full relative">
        {trendLoading ? (
          <ChartSkeleton type="area" height={300} />
        ) : hasData ? (
          dimensions.width > 0 && (
            <AreaChart 
              width={dimensions.width} 
              height={dimensions.height || 300} 
              data={memoizedData}
            >
              <defs>
                <linearGradient
                  id="colorViews"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#febf0d"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor="#febf0d"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray={dimensions.width < 500 ? "2 2" : "3 3"}
                vertical={false}
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={xAxisTick}
                dy={dimensions.width < 500 ? 5 : 10}
                angle={dimensions.width < 500 ? -45 : 0}
                textAnchor={dimensions.width < 500 ? "end" : "middle"}
                interval={dimensions.width < 500 ? 5 : 4}
                padding={{ left: dimensions.width < 500 ? 10 : 20, right: dimensions.width < 500 ? 10 : 20 }}
                tickFormatter={(value) => (dimensions.width < 500 ? value.split('.')[0] : value)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={yAxisTick}
                width={dimensions.width < 500 ? 25 : 40}
                padding={{ top: dimensions.width < 500 ? 10 : 20, bottom: dimensions.width < 500 ? 10 : 20 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return Math.floor(value).toString();
                }}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                isAnimationActive={false} // Prevents costly animation updates on mouse moves
              />
              <Area
                type="monotone"
                dataKey="pregledi"
                stroke="#febf0d"
                strokeWidth={dimensions.width < 640 ? 1.5 : 3}
                fillOpacity={1}
                fill="url(#colorViews)"
                animationDuration={500} // Fast and optimized transition
              />
            </AreaChart>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.01] rounded-[10px] border border-white/5">
            <span className="text-white/20 text-xs font-black uppercase tracking-widest">
              Još nema podataka za grafikone
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
