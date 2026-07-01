import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { FamilyDataProvider } from "./family-data-context";
import { ParentGuard } from "./ParentGuard";
import { ParentShell } from "./ParentShell";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let profile = await supabase
    .from("profiles")
    .select("family_id, is_admin")
    .eq("id", user.id)
    .maybeSingle()
    .then((r) => r.data);

  if (!profile) {
    profile = await ensureProfile(supabase, user);
  }

  if (profile?.is_admin) redirect("/admin");

  if (!profile?.family_id) {
    // Don't redirect to /login here: middleware bounces authenticated users
    // straight back to /parent, which would loop. Render inline instead.
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-sm bg-[var(--color-panel)] rounded-3xl p-8 shadow-xl text-center">
          <h1 className="text-white text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Couldn&apos;t finish setting up your account
          </h1>
          <p className="text-[var(--color-slate)] text-sm">
            Please try signing out and back in. If this keeps happening, contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FamilyDataProvider>
      <ParentGuard>
        <ParentShell>{children}</ParentShell>
      </ParentGuard>
    </FamilyDataProvider>
  );
}
