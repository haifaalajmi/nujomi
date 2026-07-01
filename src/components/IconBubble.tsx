import { ICONS } from "@/lib/theme";
import { Sparkles } from "lucide-react";

export function IconBubble({
  iconKey,
  size = 22,
  color = "#fff",
  bg = "rgba(255,255,255,0.12)",
}: {
  iconKey: string;
  size?: number;
  color?: string;
  bg?: string;
}) {
  const Icon = ICONS[iconKey] ?? Sparkles;
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size + 16, height: size + 16, background: bg }}
    >
      <Icon size={size} color={color} strokeWidth={2.2} />
    </div>
  );
}
