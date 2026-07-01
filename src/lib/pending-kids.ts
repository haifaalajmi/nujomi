import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

export type PendingKid = { name: string; age: number; gender: "boy" | "girl" };

/** Matches the free-plan kid_limit enforced by the `kids_enforce_limit` DB trigger. */
export const MAX_SIGNUP_KIDS = 3;

export function defaultAvatarFor(gender: "boy" | "girl") {
  return gender === "girl" ? "girl-1" : "boy-1";
}

export async function insertPendingKids(
  supabase: SupabaseClient<Database>,
  familyId: string,
  kids: PendingKid[]
) {
  const rows = kids
    .filter((k) => k.name.trim().length > 0)
    .slice(0, MAX_SIGNUP_KIDS)
    .map((k) => ({
      family_id: familyId,
      name: k.name.trim(),
      age: k.age,
      avatar: defaultAvatarFor(k.gender),
    }));
  if (rows.length === 0) return;
  await supabase.from("kids").insert(rows);
}
