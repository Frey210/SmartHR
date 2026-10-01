const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

// ponytail: penyimpanan per proses cocok untuk satu container; pindahkan ke Redis saat aplikasi direplikasi.
export function loginRetryAfter(key: string, now = Date.now()) {
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now) {
    if (entry) failures.delete(key);
    return 0;
  }
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.resetAt - now) / 1000) : 0;
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const entry = failures.get(key);
  failures.set(key, !entry || entry.resetAt <= now ? { count: 1, resetAt: now + WINDOW_MS } : { ...entry, count: entry.count + 1 });
}

export function clearLoginFailures(key: string) {
  failures.delete(key);
}
