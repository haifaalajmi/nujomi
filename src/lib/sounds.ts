"use client";

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", peakGain = 0.18) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audio.destination);
  const t = audio.currentTime + start;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peakGain, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Cheerful two-note ding for a brand new task arriving. */
export function playNewTaskSound() {
  tone(660, 0, 0.18, "triangle");
  tone(880, 0.1, 0.22, "triangle");
}

/** Satisfying pop/check for marking a task done. */
export function playTaskDoneSound() {
  tone(523.25, 0, 0.12, "sine", 0.22);
  tone(783.99, 0.08, 0.18, "sine", 0.22);
}

/** Bigger fanfare for finishing every task / unlocking a reward. */
export function playAchievementSound() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.28, "triangle", 0.2));
}

/** Gentle chime for a reminder notification. */
export function playReminderSound() {
  tone(440, 0, 0.16, "sine", 0.15);
  tone(440, 0.22, 0.16, "sine", 0.15);
}
