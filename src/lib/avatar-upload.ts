import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

export const MAX_AVATAR_PHOTO_BYTES = 5 * 1024 * 1024;

export function isPhotoUrl(avatar: string) {
  return avatar.startsWith("http://") || avatar.startsWith("https://");
}

export async function uploadAvatarPhoto(
  supabase: SupabaseClient<Database>,
  familyId: string,
  kidId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_AVATAR_PHOTO_BYTES) {
    throw new Error("Photo is too large (max 5MB).");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${familyId}/${kidId}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so a re-uploaded photo at the same path shows immediately.
  return `${data.publicUrl}?t=${Date.now()}`;
}
