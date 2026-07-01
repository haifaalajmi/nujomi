"use client";

import { useMemo, useState } from "react";
import { Bell, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData, type Task } from "./family-data-context";
import { Avatar } from "@/components/Avatar";
import { IconBubble } from "@/components/IconBubble";
import { ICON_KEYS, RECURRENCE_OPTIONS, TILE_COLORS } from "@/lib/theme";
import { createReward, createTask, deleteReward, deleteTask, pushReminder, updateTask, type TaskInput } from "./actions";

const emptyForm: TaskInput = { name: "", icon: "sparkles", points: 5, recurrence: "daily", kidIds: [] };

export default function ParentHomePage() {
  const { profile, kids, tasks, rewards, loading } = useFamilyData();
  const supabase = useMemo(() => createClient(), []);
  const [activeKidId, setActiveKidId] = useState<string | null>(null);
  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [form, setForm] = useState<TaskInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: "", cost: 20 });

  const visibleTasks = useMemo(
    () => tasks.filter((t) => !activeKidId || t.kidIds.includes(activeKidId)),
    [tasks, activeKidId]
  );

  if (loading) return <div className="text-[var(--color-slate)] text-sm">Loading…</div>;

  const openNewTask = () => {
    setEditingTask(null);
    setTaskFormError(null);
    setForm({ ...emptyForm, kidIds: activeKidId ? [activeKidId] : [] });
    setShowTaskForm(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task.id);
    setTaskFormError(null);
    setForm({ name: task.name, icon: task.icon, points: task.points, recurrence: task.recurrence as TaskInput["recurrence"], kidIds: task.kidIds });
    setShowTaskForm(true);
  };

  const saveTask = async () => {
    if (!form.name.trim() || !profile?.family_id) return;
    if (form.kidIds.length === 0) {
      setTaskFormError("Select at least one kid for this task.");
      return;
    }
    setTaskFormError(null);
    setSaving(true);
    try {
      if (editingTask) {
        await updateTask(supabase, editingTask, form);
      } else {
        await createTask(supabase, profile.family_id, profile.id, form);
      }
      setShowTaskForm(false);
    } finally {
      setSaving(false);
    }
  };

  const saveReward = async () => {
    if (!rewardForm.name.trim() || !profile?.family_id) return;
    await createReward(supabase, profile.family_id, rewardForm.name, Number(rewardForm.cost));
    setRewardForm({ name: "", cost: 20 });
    setShowRewardForm(false);
  };

  const toggleKidOnForm = (kidId: string) => {
    setForm((f) => ({
      ...f,
      kidIds: f.kidIds.includes(kidId) ? f.kidIds.filter((id) => id !== kidId) : [...f.kidIds, kidId],
    }));
  };

  const remind = async (task: Task) => {
    if (!profile?.family_id) return;
    await pushReminder(supabase, profile.family_id, `Don't forget: ${task.name}!`);
  };

  return (
    <div>
      <h1 className="text-white text-2xl mb-1" style={{ fontFamily: "var(--font-display)" }}>
        {activeKidId ? `${kids.find((k) => k.id === activeKidId)?.name}'s routine` : "Family routine"}
      </h1>
      <p className="text-[var(--color-slate)] text-sm mb-5">Manage tasks and rewards for your family.</p>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveKidId(null)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
            activeKidId === null ? "bg-white text-[var(--color-ink)]" : "bg-white/10 text-white"
          }`}
        >
          Everyone
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

      <div className="flex gap-1 mb-5 bg-white/10 p-1 rounded-xl w-fit">
        {(["tasks", "rewards"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-xs font-bold capitalize ${
              tab === t ? "bg-white text-[var(--color-ink)]" : "text-[var(--color-slate)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "tasks" && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={openNewTask}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-purple)] text-white text-xs font-bold"
            >
              <Plus size={14} /> New task
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {visibleTasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-3 bg-[var(--color-panel-light)] border border-white/10 rounded-2xl px-4 py-3">
                <IconBubble iconKey={task.icon} bg={TILE_COLORS[i % TILE_COLORS.length]} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{task.name}</div>
                  <div className="text-xs text-[var(--color-slate)] mt-0.5 capitalize">
                    {task.recurrence} &middot; {task.points} stars
                  </div>
                </div>
                <div className="flex">
                  {task.kidIds.map((kidId) => {
                    const k = kids.find((kk) => kk.id === kidId);
                    return k ? (
                      <div key={kidId} className="-ml-2 first:ml-0">
                        <Avatar name={k.name} avatar={k.avatar} size={26} />
                      </div>
                    ) : null;
                  })}
                </div>
                <button onClick={() => remind(task)} title="Send reminder" className="text-[var(--color-slate)] hover:text-white p-1.5">
                  <Bell size={16} />
                </button>
                <button onClick={() => openEditTask(task)} className="text-[var(--color-slate)] hover:text-white p-1.5">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteTask(supabase, task.id)} className="text-[var(--color-coral)] p-1.5">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {visibleTasks.length === 0 && (
              <div className="text-center py-10 text-[var(--color-slate)] text-sm">No tasks yet. Add one to get started.</div>
            )}
          </div>
        </div>
      )}

      {tab === "rewards" && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowRewardForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-purple)] text-white text-xs font-bold"
            >
              <Plus size={14} /> New reward
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {rewards.map((reward, i) => (
              <div key={reward.id} className="relative bg-[var(--color-panel-light)] border border-white/10 rounded-2xl p-4">
                <button onClick={() => deleteReward(supabase, reward.id)} className="absolute top-2.5 right-2.5 text-[var(--color-slate)]">
                  <X size={14} />
                </button>
                <IconBubble iconKey="gift" bg={TILE_COLORS[i % TILE_COLORS.length]} />
                <div className="font-bold text-sm text-white mt-2">{reward.name}</div>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--color-slate)] font-bold">
                  <Star size={12} fill="var(--color-sun)" color="var(--color-sun)" /> {reward.points_cost} stars
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
              <div className="col-span-full text-center py-10 text-[var(--color-slate)] text-sm">No rewards yet.</div>
            )}
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                {editingTask ? "Edit task" : "New task"}
              </h3>
              <button onClick={() => setShowTaskForm(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <label className="text-xs font-bold text-slate-400">Task name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Feed the fish"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 mb-3 text-sm"
            />

            <label className="text-xs font-bold text-slate-400">Icon</label>
            <div className="flex gap-1.5 mt-1.5 mb-3 flex-wrap">
              {ICON_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, icon: key })}
                  className={`rounded-lg p-1.5 border ${form.icon === key ? "border-[var(--color-purple)] bg-purple-50" : "border-slate-200"}`}
                >
                  <IconBubble iconKey={key} size={16} color="var(--color-ink)" bg="transparent" />
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400">Stars</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-400">Repeats</label>
                <select
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value as TaskInput["recurrence"] })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 text-sm"
                >
                  {RECURRENCE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="text-xs font-bold text-slate-400">
              Assign to <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mt-1.5 mb-2 flex-wrap">
              <button
                onClick={() => setForm((f) => ({ ...f, kidIds: f.kidIds.length === kids.length ? [] : kids.map((k) => k.id) }))}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-[var(--color-ink)]"
              >
                {form.kidIds.length === kids.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="flex gap-2 mb-2 flex-wrap">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => toggleKidOnForm(kid.id)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full border"
                  style={{ borderColor: form.kidIds.includes(kid.id) ? "var(--color-purple)" : "#E6E1F2", borderWidth: form.kidIds.includes(kid.id) ? 2 : 1 }}
                >
                  <Avatar name={kid.name} avatar={kid.avatar} size={22} />
                  <span className="text-xs font-semibold text-[var(--color-ink)]">{kid.name}</span>
                </button>
              ))}
              {kids.length === 0 && <p className="text-slate-400 text-xs">Add a kid first before creating tasks.</p>}
            </div>

            {taskFormError && <p className="text-red-500 text-xs font-semibold mb-3">{taskFormError}</p>}

            <button
              onClick={saveTask}
              disabled={saving || form.kidIds.length === 0}
              className="w-full py-3 mt-3 rounded-xl bg-[var(--color-purple)] text-white font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : editingTask ? "Save changes" : "Add task"}
            </button>
          </div>
        </div>
      )}

      {showRewardForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                New reward
              </h3>
              <button onClick={() => setShowRewardForm(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <label className="text-xs font-bold text-slate-400">Reward name</label>
            <input
              value={rewardForm.name}
              onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              placeholder="e.g. Trip to the park"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 mb-3 text-sm"
            />
            <label className="text-xs font-bold text-slate-400">Cost in stars</label>
            <input
              type="number"
              min={1}
              value={rewardForm.cost}
              onChange={(e) => setRewardForm({ ...rewardForm, cost: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 mb-5 text-sm"
            />
            <button onClick={saveReward} className="w-full py-3 rounded-xl bg-[var(--color-purple)] text-white font-bold text-sm">
              Add reward
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
