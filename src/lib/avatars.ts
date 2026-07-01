/**
 * Avatar art via DiceBear's hosted HTTP API (avataaars style) — no package
 * install needed, colors and expression are set explicitly per preset so
 * they render consistently everywhere (unlike emoji, which are drawn by
 * the viewer's OS font and can't be recolored or controlled).
 */
type AvatarPreset = {
  top: string;
  hairColor: string;
  skinColor: string;
  clothing: string;
  clothesColor: string;
};

const PRESETS: Record<string, AvatarPreset> = {
  "boy-1": { top: "shortFlat", hairColor: "2c1b18", skinColor: "edb98a", clothing: "shirtCrewNeck", clothesColor: "4ea8de" },
  "boy-2": { top: "shortWaved", hairColor: "4a312c", skinColor: "ffdbb4", clothing: "hoodie", clothesColor: "3ebd73" },
  "boy-3": { top: "theCaesar", hairColor: "2c1b18", skinColor: "edb98a", clothing: "shirtVNeck", clothesColor: "ff7a45" },
  "girl-1": { top: "straight02", hairColor: "2c1b18", skinColor: "ffdbb4", clothing: "shirtScoopNeck", clothesColor: "ff6fa5" },
  "girl-2": { top: "bun", hairColor: "4a312c", skinColor: "edb98a", clothing: "blazerAndSweater", clothesColor: "8b5cf6" },
  "girl-3": { top: "bigHair", hairColor: "2c1b18", skinColor: "ffdbb4", clothing: "overall", clothesColor: "2dd4bf" },
};

export function avatarUrl(key: string): string {
  const preset = PRESETS[key] ?? PRESETS["boy-1"];
  const params = new URLSearchParams({
    seed: key,
    top: preset.top,
    topProbability: "100",
    hairColor: preset.hairColor,
    accessoriesProbability: "0",
    facialHairProbability: "0",
    skinColor: preset.skinColor,
    clothing: preset.clothing,
    clothesColor: preset.clothesColor,
    mouth: "smile",
    eyes: "default",
    eyebrows: "default",
    backgroundColor: "transparent",
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}
