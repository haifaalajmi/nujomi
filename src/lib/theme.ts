import {
  Bed,
  BookOpen,
  Shirt,
  Dog,
  Droplet,
  Backpack,
  Sparkles,
  Gift,
  type LucideIcon,
} from "lucide-react";

export const COLORS = {
  bg: "#FFB443",
  panel: "#3D1660",
  panelLight: "#4C1D95",
  ink: "#2E1152",
  meadow: "#3EBD73",
  sun: "#FFC940",
  coral: "#FF7A45",
  pink: "#FF6FA5",
  teal: "#2DD4BF",
  blue: "#4EA8DE",
  purple: "#8B5CF6",
  slate: "#B9A9D9",
} as const;

export const ICONS: Record<string, LucideIcon> = {
  bed: Bed,
  book: BookOpen,
  shirt: Shirt,
  dog: Dog,
  droplet: Droplet,
  backpack: Backpack,
  sparkles: Sparkles,
  gift: Gift,
};
export const ICON_KEYS = Object.keys(ICONS);

export const TILE_COLORS = [
  COLORS.sun,
  COLORS.meadow,
  COLORS.blue,
  COLORS.pink,
  COLORS.teal,
  COLORS.coral,
];

export const AVATARS = [
  { key: "boy-1", label: "Boy 1", gender: "boy" },
  { key: "boy-2", label: "Boy 2", gender: "boy" },
  { key: "boy-3", label: "Boy 3", gender: "boy" },
  { key: "girl-1", label: "Girl 1", gender: "girl" },
  { key: "girl-2", label: "Girl 2", gender: "girl" },
  { key: "girl-3", label: "Girl 3", gender: "girl" },
] as const;

export const AVATAR_COLORS = [
  COLORS.pink,
  COLORS.teal,
  COLORS.sun,
  COLORS.purple,
  COLORS.meadow,
  COLORS.blue,
];

export const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "once", label: "Once" },
] as const;

export function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
