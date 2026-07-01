import { avatarColor } from "@/lib/theme";

const EMOJI: Record<string, string> = {
  "boy-1": "🧒",
  "boy-2": "👦",
  "boy-3": "🦸‍♂️",
  "girl-1": "👧",
  "girl-2": "🧑‍🦱",
  "girl-3": "🦸‍♀️",
};

export function Avatar({
  name,
  avatar,
  size = 40,
  ring = false,
}: {
  name: string;
  avatar?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const color = avatarColor(name || "kid");
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontFamily: "var(--font-display)",
        fontSize: size * (avatar ? 0.55 : 0.42),
        boxShadow: ring ? `0 0 0 3px #fff, 0 0 0 6px ${color}` : "none",
      }}
    >
      {avatar && EMOJI[avatar] ? EMOJI[avatar] : name.charAt(0).toUpperCase()}
    </div>
  );
}
