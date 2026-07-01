import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { insertPendingKids, type PendingKid } from "@/lib/pending-kids";

type SignupMetadata = {
  full_name?: string;
  mode?: "create" | "join";
  family_name?: string;
  invite_code?: string;
  pending_kids?: PendingKid[];
};

/**
 * Creates the family + profile row for a confirmed user if it's missing.
 *
 * This can't rely solely on the /auth/callback route: email link-scanners
 * (Gmail, corporate security proxies) often prefetch confirmation links,
 * burning the one-time token before the user ever clicks it. When that
 * happens the callback never runs, so we retry this bootstrap on every
 * authenticated page load instead of just the callback.
 */
export async function ensureProfile(supabase: SupabaseClient<Database>, user: User) {
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing) return existing;

  const meta = user.user_metadata as SignupMetadata;

  try {
    if (meta.mode === "join" && meta.invite_code) {
      await supabase.rpc("join_family_with_code", {
        p_invite_code: meta.invite_code,
        p_full_name: meta.full_name ?? "",
      });
    } else {
      const { data: familyId } = await supabase.rpc("create_family_and_join", {
        p_family_name: meta.family_name ?? "Our Family",
        p_full_name: meta.full_name ?? "",
      });
      if (familyId && meta.pending_kids?.length) {
        await insertPendingKids(supabase, familyId, meta.pending_kids);
      }
    }
  } catch {
    return null;
  }

  const { data: created } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return created;
}
