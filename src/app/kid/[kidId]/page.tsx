"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Gift, Settings, Sparkles, Star, Trophy, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamilyData } from "@/app/parent/family-data-context";
import { Avatar } from "@/components/Avatar";
import { StarJar } from "@/components/StarJar";
import { FlipTaskCard } from "@/components/FlipTaskCard";
import { TILE_COLORS, AVATARS } from "@/lib/theme";
import { KID_MODE_KEY } from "@/lib/kid-mode";
import { isPhotoUrl, uploadAvatarPhoto } from "@/lib/avatar-upload";
import { playAchievementSound, playNewTaskSound, playReminderSound, playTaskDoneSound } from "@/lib/sounds";

const ONCE_SENTINEL_DATE = "2000-01-01";

type Completion = {
  id: string;
  task_id: string;
  status: string;
  points_awarded: number;
  completed_at: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isDueToday(recurrence: string) {
  if (recurrence === "weekdays") {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
  }
  return true;
}

export default function KidDetailPage() {
  const params = useParams<{ kidId: string }>();
  const router = useRouter();
  const { family, kids, tasks, rewards, loading } = useFamilyData();
  const supabase = useMemo(() => createClient(), []);

  const kid = kids.find((k) => k.id === params.kidId);
  const kidTasks = useMemo(() => tasks.filter((t) => t.kidIds.includes(params.kidId)), [tasks, params.kidId]);

  const [completions, setCompletions] = useState<Completion[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [unlockedReward, setUnlockedReward] = useState<{ name: string; points_cost: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reminder, setReminder] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const seenTaskIds = useRef<Set<string> | null>(null);

  const loadCompletions = useCallback(async () => {
    const { data } = await supabase
      .from("task_completions")
      .select("id, task_id, status, points_awarded, completed_at")
      .eq("kid_id", params.kidId);
    setCompletions((data as Completion[]) ?? []);
  }, [supabase, params.kidId]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  useEffect(() => {
    const channel = supabase
      .channel(`kid-completions-${params.kidId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_completions", filter: `kid_id=eq.${params.kidId}` },
        loadCompletions
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, params.kidId, loadCompletions]);

  // Toast + sound when a brand-new task is assigned to this kid.
  useEffect(() => {
    const ids = new Set(kidTasks.map((t) => t.id));
    if (seenTaskIds.current) {
      const newTask = kidTasks.find((t) => !seenTaskIds.current!.has(t.id));
      if (newTask) {
        playNewTaskSound();
        setToast(`New task: ${newTask.name}!`);
        setTimeout(() => setToast(null), 3500);
      }
    }
    seenTaskIds.current = ids;
  }, [kidTasks]);

  // Reminder broadcasts pushed by a parent.
  useEffect(() => {
    if (!family?.id) return;
    const channel = supabase
      .channel(`family-events-${family.id}`)
      .on("broadcast", { event: "reminder" }, ({ payload }) => {
        if (payload.kidId && payload.kidId !== params.kidId) return;
        playReminderSound();
        setReminder(payload.message ?? "Don't forget your tasks!");
        setTimeout(() => setReminder(null), 5000);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, family?.id, params.kidId]);

  if (loading) return <div className="p-8 text-white text-sm">Loading…</div>;
  if (!kid) return <div className="p-8 text-white text-sm">Kid not found.</div>;

  const doneTaskIds = new Set(
    completions.filter((c) => c.status === "done").map((c) => c.task_id)
  );
  const today = todayISO();
  const doneTodayIds = new Set(
    completions.filter((c) => c.status === "done" && c.completed_at.slice(0, 10) === today).map((c) => c.task_id)
  );

  const pendingTasks = kidTasks.filter((t) => {
    if (t.recurrence === "once") return !doneTaskIds.has(t.id);
    if (!isDueToday(t.recurrence)) return false;
    return !doneTodayIds.has(t.id);
  });
  const completedToday = kidTasks.filter((t) => doneTodayIds.has(t.id) || (t.recurrence === "once" && doneTaskIds.has(t.id)));

  const nextGoal = rewards
    .map((r) => r.points_cost)
    .filter((cost) => cost > kid.points)
    .sort((a, b) => a - b)[0];
  const goal = nextGoal ?? Math.max(kid.points, 50);

  const completeTask = async (taskId: string, points: number, recurrence: string) => {
    playTaskDoneSound();

    const newlyUnlocked = rewards.find((r) => r.points_cost > kid.points && r.points_cost <= kid.points + points);
    if (newlyUnlocked) setUnlockedReward(newlyUnlocked);

    const remainingAfter = pendingTasks.filter((t) => t.id !== taskId);
    if (remainingAfter.length === 0) {
      setTimeout(() => {
        playAchievementSound();
        setShowCelebration(true);
      }, 350);
    }

    await supabase.rpc("complete_task", {
      p_task_id: taskId,
      p_kid_id: params.kidId,
      p_occurrence_date: recurrence === "once" ? ONCE_SENTINEL_DATE : today,
    });
  };

  const undoTask = async (taskId: string) => {
    const completion = completions.find((c) => c.task_id === taskId && c.status === "done");
    if (!completion) return;
    await supabase.rpc("return_task_completion", { p_completion_id: completion.id });
  };

  const redeem = async (rewardId: string) => {
    await supabase.rpc("redeem_reward", { p_kid_id: params.kidId, p_reward_id: rewardId });
  };

  const goToParent = () => {
    sessionStorage.setItem(KID_MODE_KEY, "1");
    router.push("/parent");
  };

  const openAvatarPicker = () => {
    setSelectedAvatar(kid.avatar);
    setAvatarError(null);
    setShowAvatarPicker(true);
  };

  const onUploadAvatarPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !family?.id) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const url = await uploadAvatarPhoto(supabase, family.id, kid.id, file);
      setSelectedAvatar(url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveAvatar = async () => {
    setSavingAvatar(true);
    await supabase.from("kids").update({ avatar: selectedAvatar }).eq("id", kid.id);
    setSavingAvatar(false);
    setShowAvatarPicker(false);
  };

  return (
    <div className="p-4 md:p-5">
      <div className="rounded-3xl bg-[var(--color-panel)] p-5 md:p-7 min-h-[600px]">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push("/kid")}
            className="flex items-center gap-1.5 bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-[var(--color-ink)]"
          >
            <ArrowLeft size={14} /> Switch
          </button>
          <button onClick={goToParent} aria-label="Parent dashboard" className="bg-white/10 text-white p-2 rounded-lg">
            <Settings size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button onClick={openAvatarPicker}>
            <Avatar name={kid.name} avatar={kid.avatar} size={56} ring />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl" style={{ fontFamily: "var(--font-display)" }}>
              Hi {kid.name}!
            </h1>
            <p className="text-[var(--color-slate)] text-sm mt-0.5">{pendingTasks.length} to go today</p>
          </div>
          <StarJar points={kid.points} goal={goal} />
        </div>

        {pendingTasks.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5 mb-6">
            {pendingTasks.map((task, i) => (
              <div key={task.id} style={{ ["--tile-color" as string]: TILE_COLORS[i % TILE_COLORS.length] }}>
                <FlipTaskCard
                  name={task.name}
                  icon={task.icon}
                  points={task.points}
                  onComplete={() => completeTask(task.id, task.points, task.recurrence)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 mb-5">
            <Trophy size={36} color="var(--color-sun)" className="mx-auto" />
            <div className="text-white text-lg mt-2" style={{ fontFamily: "var(--font-display)" }}>
              All done for today!
            </div>
          </div>
        )}

        {completedToday.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-2.5">Done today</div>
            <div className="flex flex-wrap gap-2">
              {completedToday.map((task) => (
                <button
                  key={task.id}
                  onClick={() => undoTask(task.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-[var(--color-panel-light)] opacity-85"
                >
                  <Check size={13} color="var(--color-meadow)" />
                  <span className="text-white text-xs line-through">{task.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-2.5">Rewards</div>
        <div className="flex gap-3 overflow-x-auto pb-1.5">
          {rewards.map((reward, i) => {
            const affordable = kid.points >= reward.points_cost;
            return (
              <div
                key={reward.id}
                className="min-w-[150px] rounded-2xl p-3.5 shrink-0 bg-[var(--color-panel-light)]"
                style={{ border: `2px solid ${affordable ? "var(--color-sun)" : "rgba(255,255,255,0.1)"}` }}
              >
                <Gift size={20} color={TILE_COLORS[i % TILE_COLORS.length]} />
                <div className="font-bold text-[13.5px] text-white mt-2">{reward.name}</div>
                <div className="flex items-center gap-1 mt-1.5 mb-2.5 text-xs text-[var(--color-slate)] font-bold">
                  <Star size={12} fill="var(--color-sun)" color="var(--color-sun)" /> {reward.points_cost}
                </div>
                <button
                  disabled={!affordable}
                  onClick={() => redeem(reward.id)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold ${
                    affordable ? "bg-[var(--color-purple)] text-white" : "bg-white/10 text-[var(--color-slate)] cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            );
          })}
          {rewards.length === 0 && <p className="text-[var(--color-slate)] text-sm">No rewards yet.</p>}
        </div>
      </div>

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white text-[var(--color-ink)] font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2">
          <Sparkles size={16} color="var(--color-purple)" /> {toast}
        </div>
      )}

      {reminder && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[var(--color-sun)] text-[var(--color-ink)] font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg z-50">
          🔔 {reminder}
        </div>
      )}

      {unlockedReward && (
        <button
          onClick={() => {
            setUnlockedReward(null);
            router.push(`/kid/${kid.id}#rewards`);
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl px-5 py-4 z-50 flex items-center gap-3 max-w-xs text-left"
        >
          <Gift size={26} color="var(--color-purple)" />
          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--color-ink)]">New reward unlocked!</div>
            <div className="text-xs text-slate-500">
              {unlockedReward.name} &middot; {unlockedReward.points_cost} stars
            </div>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setUnlockedReward(null);
            }}
            className="text-slate-400"
          >
            <X size={16} />
          </span>
        </button>
      )}

      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCelebration(false)}>
          <div className="bg-white rounded-3xl p-8 text-center max-w-xs">
            <Trophy size={48} color="var(--color-sun)" className="mx-auto mb-3" />
            <h2 className="text-xl text-[var(--color-ink)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Amazing job, {kid.name}!
            </h2>
            <p className="text-sm text-slate-500">You finished every task today. Keep it up!</p>
          </div>
        </div>
      )}

      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                Choose your look
              </h3>
              <button onClick={() => setShowAvatarPicker(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setSelectedAvatar(a.key)}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 border"
                  style={{ borderColor: selectedAvatar === a.key ? "var(--color-purple)" : "#E6E1F2", borderWidth: selectedAvatar === a.key ? 2 : 1 }}
                >
                  <Avatar name={kid.name} avatar={a.key} size={48} />
                </button>
              ))}
              <button
                onClick={() => avatarFileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-2 border disabled:opacity-60"
                style={{
                  borderColor: isPhotoUrl(selectedAvatar) ? "var(--color-purple)" : "#E6E1F2",
                  borderWidth: isPhotoUrl(selectedAvatar) ? 2 : 1,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Upload size={18} color="var(--color-ink)" />
                </div>
                {isPhotoUrl(selectedAvatar) && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full overflow-hidden ring-2 ring-white">
                    <Avatar name={kid.name} avatar={selectedAvatar} size={24} />
                  </div>
                )}
              </button>
              <input ref={avatarFileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadAvatarPhoto} />
            </div>
            {uploadingAvatar && <p className="text-slate-400 text-xs mt-3">Uploading photo…</p>}
            {avatarError && <p className="text-red-500 text-xs font-semibold mt-3">{avatarError}</p>}

            <button
              onClick={saveAvatar}
              disabled={savingAvatar || uploadingAvatar || !selectedAvatar}
              className="w-full py-3 mt-4 rounded-xl bg-[var(--color-purple)] text-white font-bold text-sm disabled:opacity-60"
            >
              {savingAvatar ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
