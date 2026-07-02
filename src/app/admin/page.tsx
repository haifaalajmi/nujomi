"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pause, Play, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { Logo } from "@/components/Logo";

type FamilyRow = Tables<"families"> & { parentCount: number; kidCount: number };

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [familiesRes, profilesRes, kidsRes] = await Promise.all([
      supabase.from("families").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("family_id"),
      supabase.from("kids").select("family_id"),
    ]);

    const parentCounts = new Map<string, number>();
    (profilesRes.data ?? []).forEach((p) => {
      if (!p.family_id) return;
      parentCounts.set(p.family_id, (parentCounts.get(p.family_id) ?? 0) + 1);
    });
    const kidCounts = new Map<string, number>();
    (kidsRes.data ?? []).forEach((k) => {
      kidCounts.set(k.family_id, (kidCounts.get(k.family_id) ?? 0) + 1);
    });

    setFamilies(
      (familiesRes.data ?? []).map((f) => ({
        ...f,
        parentCount: parentCounts.get(f.id) ?? 0,
        kidCount: kidCounts.get(f.id) ?? 0,
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (family: FamilyRow) => {
    setBusyId(family.id);
    await supabase
      .from("families")
      .update({ status: family.status === "active" ? "suspended" : "active" })
      .eq("id", family.id);
    await load();
    setBusyId(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Logo size={36} />
          <span className="text-white text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Nujomi Admin
          </span>
        </div>
        <button onClick={signOut} className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold">
          <LogOut size={15} /> Sign out
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Families" value={families.length} />
        <StatCard label="Parents" value={families.reduce((s, f) => s + f.parentCount, 0)} />
        <StatCard label="Kids" value={families.reduce((s, f) => s + f.kidCount, 0)} />
      </div>

      <div className="bg-[var(--color-panel)] rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center gap-2">
          <Users size={16} color="#fff" />
          <h2 className="text-white font-bold text-sm">All families</h2>
        </div>
        <div className="divide-y divide-white/5">
          {loading && <div className="p-5 text-[var(--color-slate)] text-sm">Loading…</div>}
          {!loading && families.length === 0 && (
            <div className="p-5 text-[var(--color-slate)] text-sm">No families yet.</div>
          )}
          {families.map((family) => (
            <div key={family.id} className="p-5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <div className="text-white font-bold text-sm">{family.name}</div>
                <div className="text-xs text-[var(--color-slate)] mt-0.5">
                  Joined {new Date(family.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-xs text-[var(--color-slate)] w-24">{family.parentCount} parent(s)</div>
              <div className="text-xs text-[var(--color-slate)] w-20">{family.kidCount} kid(s)</div>
              <div className="text-xs font-bold text-[var(--color-ink)] bg-[var(--color-sun)] px-2.5 py-1 rounded-full capitalize w-20 text-center">
                {family.plan}
              </div>
              <div
                className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize w-24 text-center ${
                  family.status === "active" ? "bg-[var(--color-meadow)] text-white" : "bg-[var(--color-coral)] text-white"
                }`}
              >
                {family.status}
              </div>
              <button
                onClick={() => toggleStatus(family)}
                disabled={busyId === family.id}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                {family.status === "active" ? (
                  <>
                    <Pause size={13} /> Suspend
                  </>
                ) : (
                  <>
                    <Play size={13} /> Reactivate
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--color-panel)] rounded-2xl p-5">
      <div className="text-3xl text-white" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </div>
      <div className="text-xs text-[var(--color-slate)] mt-1">{label}</div>
    </div>
  );
}
