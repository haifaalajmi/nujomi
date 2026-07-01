import { Star } from "lucide-react";

export function StarJar({ points, goal }: { points: number; goal: number }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? points / goal : 0));
  const fillHeight = 6 + pct * 70;
  return (
    <div className="flex items-center gap-3.5">
      <svg width="52" height="66" viewBox="0 0 52 66">
        <path
          d="M10 14 L10 58 Q10 64 16 64 L36 64 Q42 64 42 58 L42 14 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="#fff"
          strokeWidth="2.5"
        />
        <rect x="14" y="4" width="24" height="12" rx="3" fill="rgba(255,255,255,0.06)" stroke="#fff" strokeWidth="2.5" />
        <clipPath id="jarclip">
          <path d="M10 14 L10 58 Q10 64 16 64 L36 64 Q42 64 42 58 L42 14 Z" />
        </clipPath>
        <g clipPath="url(#jarclip)">
          <rect x="8" y={64 - fillHeight} width="36" height={fillHeight} fill="var(--color-sun)" />
        </g>
      </svg>
      <div>
        <div className="flex items-center gap-1 text-2xl text-white" style={{ fontFamily: "var(--font-display)" }}>
          {points} <Star size={18} fill="var(--color-sun)" color="var(--color-sun)" />
        </div>
        <div className="text-xs text-[var(--color-slate)] mt-0.5">{Math.max(goal - points, 0)} to next reward</div>
      </div>
    </div>
  );
}
