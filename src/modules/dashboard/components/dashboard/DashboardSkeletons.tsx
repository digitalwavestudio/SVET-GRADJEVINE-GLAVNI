import { Skeleton } from "@/src/components/ui/Skeleton";

export function HeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[140px] w-full">
      <div className="flex items-center gap-6">
        <Skeleton className="w-28 h-28 md:w-32 md:h-32 rounded-[10px] shrink-0" />
        <div className="space-y-3">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-96 h-3" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <Skeleton className="w-44 h-12 rounded-[10px]" />
        <div className="flex gap-2">
          <Skeleton className="w-24 h-12 rounded-[10px]" />
          <Skeleton className="w-32 h-12 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

export function AiPredictiveActionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-44 h-3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] flex flex-col justify-between min-h-[168px]">
            <div className="flex gap-4 mb-6">
              <Skeleton className="w-12 h-12 rounded-[10px] shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-1/2 h-2 mt-2" />
              </div>
            </div>
            <Skeleton className="w-full h-[40px] rounded-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiAssistantSkeleton() {
  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden flex flex-col h-[500px]">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-[10px] shrink-0" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-24 h-2" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-2 h-2 mt-2 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-5/6 h-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <Skeleton className="w-full h-12 rounded-[10px]" />
      </div>
    </div>
  );
}

