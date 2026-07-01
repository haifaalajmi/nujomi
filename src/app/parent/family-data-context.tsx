"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type Kid = Tables<"kids">;
export type Reward = Tables<"rewards">;
export type TaskRow = Tables<"tasks">;
export type Task = TaskRow & { kidIds: string[] };
export type ParentProfile = Tables<"profiles">;

type FamilyDataValue = {
  loading: boolean;
  family: Tables<"families"> | null;
  profile: ParentProfile | null;
  parents: ParentProfile[];
  kids: Kid[];
  tasks: Task[];
  rewards: Reward[];
  refresh: () => Promise<void>;
};

const FamilyDataContext = createContext<FamilyDataValue | null>(null);

export function FamilyDataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Tables<"families"> | null>(null);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profileRow?.family_id) {
      setLoading(false);
      return;
    }

    const [familyRes, parentsRes, kidsRes, tasksRes, taskKidsRes, rewardsRes] = await Promise.all([
      supabase.from("families").select("*").eq("id", profileRow.family_id).single(),
      supabase.from("profiles").select("*").eq("family_id", profileRow.family_id),
      supabase.from("kids").select("*").eq("family_id", profileRow.family_id).order("created_at"),
      supabase
        .from("tasks")
        .select("*")
        .eq("family_id", profileRow.family_id)
        .order("created_at", { ascending: false }),
      supabase.from("task_kids").select("*"),
      supabase.from("rewards").select("*").eq("family_id", profileRow.family_id).order("created_at"),
    ]);

    const kidsByTask = new Map<string, string[]>();
    (taskKidsRes.data ?? []).forEach((tk) => {
      const arr = kidsByTask.get(tk.task_id) ?? [];
      arr.push(tk.kid_id);
      kidsByTask.set(tk.task_id, arr);
    });

    setProfile(profileRow);
    setFamily(familyRes.data ?? null);
    setParents(parentsRes.data ?? []);
    setKids(kidsRes.data ?? []);
    setTasks((tasksRes.data ?? []).map((t) => ({ ...t, kidIds: kidsByTask.get(t.id) ?? [] })));
    setRewards(rewardsRes.data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!profile?.family_id) return;
    const familyId = profile.family_id;

    const channel = supabase
      .channel(`family-data-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "kids", filter: `family_id=eq.${familyId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `family_id=eq.${familyId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_kids" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "rewards", filter: `family_id=eq.${familyId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "families", filter: `id=eq.${familyId}` }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.family_id, supabase, load]);

  return (
    <FamilyDataContext.Provider
      value={{ loading, family, profile, parents, kids, tasks, rewards, refresh: load }}
    >
      {children}
    </FamilyDataContext.Provider>
  );
}

export function useFamilyData() {
  const ctx = useContext(FamilyDataContext);
  if (!ctx) throw new Error("useFamilyData must be used within FamilyDataProvider");
  return ctx;
}
