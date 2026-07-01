"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useFamilyData } from "@/app/parent/family-data-context";
import { Avatar } from "@/components/Avatar";
import { KID_MODE_KEY } from "@/lib/kid-mode";

export default function KidPickerPage() {
  const { kids, loading } = useFamilyData();
  const router = useRouter();

  const goToParent = () => {
    sessionStorage.setItem(KID_MODE_KEY, "1");
    router.push("/parent");
  };

  if (loading) return <div className="p-8 text-[var(--color-ink)] text-sm">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8">
      <button
        onClick={goToParent}
        className="self-start flex items-center gap-1.5 border border-[var(--color-ink)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
      >
        <Lock size={13} /> Parent dashboard
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl md:text-3xl text-[var(--color-ink)] mb-8 text-center" style={{ fontFamily: "var(--font-display)" }}>
          Who&apos;s doing chores today?
        </h1>
        <div className="flex flex-wrap gap-8 justify-center">
          {kids.map((kid) => (
            <button
              key={kid.id}
              onClick={() => router.push(`/kid/${kid.id}`)}
              className="flex flex-col items-center gap-3"
            >
              <Avatar name={kid.name} avatar={kid.avatar} size={90} />
              <span className="text-lg text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                {kid.name}
              </span>
            </button>
          ))}
          {kids.length === 0 && (
            <p className="text-[var(--color-ink)]/70 text-sm">No kids added yet. Ask a parent to add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
