import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type TaskInput = {
  name: string;
  icon: string;
  points: number;
  recurrence: "daily" | "weekdays" | "once";
  kidIds: string[];
};

export async function createTask(supabase: Client, familyId: string, userId: string, input: TaskInput) {
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      family_id: familyId,
      created_by: userId,
      name: input.name,
      icon: input.icon,
      points: input.points,
      recurrence: input.recurrence,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.kidIds.length > 0) {
    const { error: assignError } = await supabase
      .from("task_kids")
      .insert(input.kidIds.map((kid_id) => ({ task_id: task.id, kid_id })));
    if (assignError) throw assignError;
  }
  return task;
}

export async function updateTask(supabase: Client, taskId: string, input: TaskInput) {
  const { error } = await supabase
    .from("tasks")
    .update({ name: input.name, icon: input.icon, points: input.points, recurrence: input.recurrence })
    .eq("id", taskId);
  if (error) throw error;

  const { error: delError } = await supabase.from("task_kids").delete().eq("task_id", taskId);
  if (delError) throw delError;

  if (input.kidIds.length > 0) {
    const { error: assignError } = await supabase
      .from("task_kids")
      .insert(input.kidIds.map((kid_id) => ({ task_id: taskId, kid_id })));
    if (assignError) throw assignError;
  }
}

export async function deleteTask(supabase: Client, taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function createReward(supabase: Client, familyId: string, name: string, pointsCost: number) {
  const { error } = await supabase.from("rewards").insert({ family_id: familyId, name, points_cost: pointsCost, icon: "gift" });
  if (error) throw error;
}

export async function deleteReward(supabase: Client, rewardId: string) {
  const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
  if (error) throw error;
}

export async function pushReminder(supabase: Client, familyId: string, message: string, kidId?: string) {
  const channel = supabase.channel(`family-events-${familyId}`);
  await channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.send({
        type: "broadcast",
        event: "reminder",
        payload: { message, kidId: kidId ?? null, at: Date.now() },
      });
      setTimeout(() => supabase.removeChannel(channel), 500);
    }
  });
}
