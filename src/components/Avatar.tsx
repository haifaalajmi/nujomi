import { avatarColor } from "@/lib/theme";
import { avatarUrl } from "@/lib/avatars";
import { isPhotoUrl } from "@/lib/avatar-upload";

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

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote image (DiceBear API or Supabase Storage), not a local/optimizable asset
      <img
        src={isPhotoUrl(avatar) ? avatar : avatarUrl(avatar)}
        alt={name}
        width={size}
        height={size}
        className="rounded-full shrink-0 bg-white/70 object-cover"
        style={{
          width: size,
          height: size,
          boxShadow: ring ? `0 0 0 3px #fff, 0 0 0 6px ${color}` : "none",
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontFamily: "var(--font-display)",
        fontSize: size * 0.42,
        boxShadow: ring ? `0 0 0 3px #fff, 0 0 0 6px ${color}` : "none",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
