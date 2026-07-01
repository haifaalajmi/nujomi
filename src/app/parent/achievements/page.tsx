"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { RotateCcw, Star, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "../family-data-context";
import { Avatar } from "@/components/Avatar";

type Completion = {
  id: string;
  task_id: string;
  kid_id: string;
  occurrence_date: string;
  status: string;
  points_awarded: number;
  completed_at: string;
  tasks: { name: string } | null;
};

export default function AchievementsPage() {
  const { kids, loading } = useFamilyData();
  const supabase = useMemo(() => createClient(), []);
  const [activeKidId, setActiveKidId] = useState<string | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const kidIds = useMemo(() => kids.map((k) => k.id), [kids]);

  const loadCompletions = useCallback(async () => {
    if (kidIds.length === 0) return;
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const { data } = await supabase
      .from("task_completions")
      .select("id, task_id, kid_id, occurrence_date, status, points_awarded, completed_at, tasks(name)")
      .in("kid_id", kidIds)
      .gte("occurrence_date", since.toISOString().slice(0, 10))
      .order("completed_at", { ascending: false });
    setCompletions((data as unknown as Completion[]) ?? []);
  }, [supabase, kidIds]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  useEffect(() => {
    if (kidIds.length === 0) return;
    const channel = supabase
      .channel("achievements-completions")
      .on("postgres_changes", { event: "*", schema: "public", table: "task_completions" }, loadCompletions)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, kidIds, loadCompletions]);

  if (loading) return <div className="text-[var(--color-slate)] text-sm">Loading…</div>;

  const today = new Date().toISOString().slice(0, 10);
  const visible = completions.filter((c) => !activeKidId || c.kid_id === activeKidId);
  const todayCompletions = visible.filter((c) => c.occurrence_date === today);

  const returnTask = async (id: string) => {
    setBusyId(id);
    await supabase.rpc("return_task_completion", { p_completion_id: id });
    setBusyId(null);
  };

  const kidStats = kids
    .filter((k) => !activeKidId || k.id === activeKidId)
    .map((kid) => {
      const kidCompletions = completions.filter((c) => c.kid_id === kid.id && c.status === "done");
      return {
        kid,
        tasksThisWeek: kidCompletions.length,
        pointsThisWeek: kidCompletions.reduce((sum, c) => sum + c.points_awarded, 0),
      };
    });

  return (
    <div>
      <h1 className="text-white text-2xl mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Achievements
      </h1>
      <p className="text-[var(--color-slate)] text-sm mb-5">See how everyone&apos;s doing this week.</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveKidId(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
            activeKidId === null ? "bg-white text-[var(--color-ink)]" : "bg-white/10 text-white"
          }`}
        >
          All kids
        </button>
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => setActiveKidId(kid.id)}
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              activeKidId === kid.id ? "bg-white text-[var(--color-ink)]" : "bg-white/10 text-white"
            }`}
          >
            <Avatar name={kid.name} avatar={kid.avatar} size={22} />
            {kid.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-8">
        {kidStats.map(({ kid, tasksThisWeek, pointsThisWeek }) => (
          <div key={kid.id} className="bg-[var(--color-panel-light)] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar name={kid.name} avatar={kid.avatar} size={36} />
              <div className="font-bold text-white text-sm">{kid.name}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xl text-white" style={{ fontFamily: "var(--font-display)" }}>
              {kid.points} <Star size={16} fill="var(--color-sun)" color="var(--color-sun)" />
            </div>
            <div className="text-xs text-[var(--color-slate)] mt-1">
              {tasksThisWeek} tasks &middot; {pointsThisWeek} stars this week
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} color="var(--color-sun)" />
        <h2 className="text-sm font-bold text-white">Today</h2>
      </div>
      <div className="flex flex-col gap-2">
        {todayCompletions.map((c) => {
          const kid = kids.find((k) => k.id === c.kid_id);
          return (
            <div key={c.id} className="flex items-center gap-3 bg-[var(--color-panel-light)] border border-white/10 rounded-xl px-4 py-2.5">
              {kid && <Avatar name={kid.name} avatar={kid.avatar} size={28} />}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${c.status === "returned" ? "text-[var(--color-slate)] line-through" : "text-white"}`}>
                  {c.tasks?.name ?? "Task"}
                </div>
                <div className="text-xs text-[var(--color-slate)]">
                  {c.status === "returned" ? "Returned" : `+${c.points_awarded} stars`}
                </div>
              </div>
              {c.status === "done" && (
                <button
                  onClick={() => returnTask(c.id)}
                  disabled={busyId === c.id}
                  title="Return this task (removes points)"
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-coral)] px-2.5 py-1.5 rounded-lg border border-[var(--color-coral)]/40 disabled:opacity-50"
                >
                  <RotateCcw size={13} /> Return
                </button>
              )}
            </div>
          );
        })}
        {todayCompletions.length === 0 && (
          <div className="text-center py-8 text-[var(--color-slate)] text-sm">No tasks completed yet today.</div>
        )}
      </div>
    </div>
  );
}
