import { ShieldAlert } from "lucide-react";

interface SandboxBannerProps {
  isSandbox?: boolean;
}

export function SandboxBanner({ isSandbox }: SandboxBannerProps) {
  if (!isSandbox) return null;

  return (
    <div className="relative py-2.5 px-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[10px] text-xs font-semibold flex items-center gap-3 backdrop-blur-md animate-pulse shadow-sm">
      <ShieldAlert size={16} className="text-amber-500 flex-shrink-0" />
      <span className="flex-1">
        <strong>Demo režim aktivan:</strong> Podaci su privremeno preusmereni kroz bezbedan peskovnik (Sandbox) usled tehničkog održavanja Firestore baze podataka.
      </span>
    </div>
  );
}
