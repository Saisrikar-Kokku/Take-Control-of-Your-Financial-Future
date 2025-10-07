import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

export type Mood = 'ok' | 'watch' | 'overspend'

export function computeMood({ spent, budget }: { spent: number; budget: number }): { mood: Mood; progress: number; reason: string } {
  const progress = budget > 0 ? spent / budget : 0
  if (budget <= 0) {
    return { mood: 'ok', progress: 0, reason: 'No monthly budget set' }
  }
  if (progress >= 1.0) return { mood: 'overspend', progress, reason: 'You exceeded your monthly budget' }
  if (progress >= 0.8) return { mood: 'watch', progress, reason: 'You are nearing your monthly budget' }
  return { mood: 'ok', progress, reason: 'You are within your monthly budget' }
}

// Hysteresis: avoid flipping around thresholds by requiring buffer
export function stabilizeMood(prev: Mood, next: Mood, progress: number): Mood {
  if (prev === next) return prev
  // If moving to a more severe state, switch immediately
  const severity = { ok: 0, watch: 1, overspend: 2 }
  if (severity[next] > severity[prev]) return next
  // If moving to a less severe state, require progress buffer
  if (prev === 'overspend' && next === 'watch' && progress >= 0.95) return 'overspend'
  if (prev === 'watch' && next === 'ok' && progress >= 0.75) return 'watch'
  return next
}
