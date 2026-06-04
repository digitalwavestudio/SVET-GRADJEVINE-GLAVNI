import React from 'react';

export default function ChartSkeleton() {
  return (
    <div id="chart-pulse-skeleton" className="w-full h-[300px] bg-white/[0.01] border border-white/5 rounded-[10px] p-6 flex flex-col justify-between animate-pulse relative overflow-hidden">
      {/* Chart Title / Legend Skeletons */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-2.5 w-24 bg-white/10 rounded-full"></div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-secondary/30"></div>
            <div className="h-2 w-12 bg-white/5 rounded-full"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500/30"></div>
            <div className="h-2 w-12 bg-white/5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* SVG Grid and Curve representation */}
      <div className="flex-1 w-full relative min-h-[180px] flex items-end">
        {/* Y Axis Gridlines */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-6">
          <div className="h-px w-full bg-white/[0.03]"></div>
          <div className="h-px w-full bg-white/[0.03]"></div>
          <div className="h-px w-full bg-white/[0.03]"></div>
          <div className="h-px w-full bg-white/[0.03]"></div>
        </div>

        {/* Abstract Area Wave */}
        <svg className="w-full h-full absolute inset-0 pointer-events-none animate-pulse" viewBox="0 0 500 150" preserveAspectRatio="none">
          <defs>
            <linearGradient id="skeletonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(254, 191, 13, 0.08)" />
              <stop offset="100%" stopColor="rgba(254, 191, 13, 0)" />
            </linearGradient>
            <linearGradient id="skeletonGradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.08)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
          </defs>
          {/* Wave 1 */}
          <path 
            d="M 0,130 Q 80,60 160,110 T 320,40 T 500,80 L 500,150 L 0,150 Z" 
            fill="url(#skeletonGrad)" 
            opacity="0.7"
          />
          <path 
            d="M 0,130 Q 80,60 160,110 T 320,40 T 500,80" 
            fill="none" 
            stroke="rgba(254, 191, 13, 0.15)" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Wave 2 */}
          <path 
            d="M 0,140 Q 100,90 200,130 T 400,60 T 500,100 L 500,150 L 0,150 Z" 
            fill="url(#skeletonGradBlue)" 
            opacity="0.5"
          />
          <path 
            d="M 0,140 Q 100,90 200,130 T 400,60 T 500,100" 
            fill="none" 
            stroke="rgba(59, 130, 246, 0.15)" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* X Axis Labels Skeletons */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/[0.03]">
        <div className="h-2 w-8 bg-white/5 rounded-full"></div>
        <div className="h-2 w-8 bg-white/5 rounded-full"></div>
        <div className="h-2 w-8 bg-white/5 rounded-full"></div>
        <div className="h-2 w-8 bg-white/5 rounded-full"></div>
        <div className="h-2 w-8 bg-white/5 rounded-full"></div>
      </div>
    </div>
  );
}
