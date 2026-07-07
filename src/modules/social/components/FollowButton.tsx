import { useIsFollowing, useFollow, useFollowers } from "../hooks/useFollow";
import { useAuth } from "@/src/context/AuthContext";

interface FollowButtonProps {
  targetId: string;
  className?: string;
}

export function FollowButton({ targetId, className = "" }: FollowButtonProps) {
  const { user } = useAuth();
  const { data: isFollowing, isLoading: checking } = useIsFollowing(targetId);
  const { data: followersData } = useFollowers(targetId);
  const { follow, unfollow, isFollowingLoading } = useFollow();

  if (!user) return null;

  const handleClick = async () => {
    if (isFollowing) {
      await unfollow(targetId);
    } else {
      await follow(targetId);
    }
  };

  const count = followersData?.count ?? 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleClick}
        disabled={checking || isFollowingLoading}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 select-none ${
          isFollowing
            ? "bg-white/5 border border-white/10 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
            : "bg-secondary text-black hover:bg-yellow-400 shadow-gold-glow-subtle"
        }`}
      >
        {isFollowingLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isFollowing ? (
          <>
            <span className="material-symbols-outlined text-sm">check</span>
            Otprati
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">person_add</span>
            Zaprati
          </>
        )}
      </button>
      {count > 0 && (
        <span className="text-xs text-on-surface-variant">
          {count} {count === 1 ? "pratilac" : "pratilaca"}
        </span>
      )}
    </div>
  );
}
