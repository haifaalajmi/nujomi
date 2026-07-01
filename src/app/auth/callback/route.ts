import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) await ensureProfile(supabase, user);

      return NextResponse.redirect(`${origin}/parent`);
    }
  }

  // The one-time code may already be spent (e.g. an email link-scanner
  // prefetched it). That's fine — signing in normally will retry the
  // profile bootstrap in /parent's layout.
  return NextResponse.redirect(`${origin}/login`);
}
