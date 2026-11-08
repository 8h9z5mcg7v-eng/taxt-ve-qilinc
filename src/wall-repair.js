export function normalizeWallRepair(damage, repairStartedAt, repairEndsAt, repairInitialDamage, now = Date.now()) {
  const safeDamage = Math.max(0, Math.min(100, Math.floor(Number(damage) || 0)));
  let start = Math.max(0, Number(repairStartedAt) || 0);
  const end = Math.max(0, Number(repairEndsAt) || 0);
  let initial = Math.max(0, Math.min(100, Math.floor(Number(repairInitialDamage) || 0)));
  if (end > 0 && end <= now) return { damage: 0, repairStartedAt: 0, repairEndsAt: 0, repairInitialDamage: 0, progress: 1 };
  if (!end) return { damage: safeDamage, repairStartedAt: 0, repairEndsAt: 0, repairInitialDamage: 0, progress: 0 };
  if (!start || start >= end) { start = now; initial = safeDamage; }
  if (!initial) initial = safeDamage;
  const progress = Math.max(0, Math.min(1, (now - start) / (end - start)));
  return { damage: Math.max(0, Math.ceil(initial * (1 - progress))), repairStartedAt: start, repairEndsAt: end, repairInitialDamage: initial, progress };
}
export function getWallRepairQuote(damage) {
  const points = Math.max(0, Math.min(100, Math.floor(Number(damage) || 0)));
  return { damage: points, cost: { wood: points * 8, stone: points * 12, gold: points * 2 }, durationMs: points * 15000 };
}
export function getWallRepairSpeedupQuote(repairEndsAt, now = Date.now()) {
  const remaining = Math.max(0, Number(repairEndsAt) - now || 0);
  return { remainingMs: remaining, cost: remaining > 0 ? Math.max(1, Math.ceil(remaining / 60000) * 3) : 0 };
}
export function applyWallRepairSpeedup(repairEndsAt, now = Date.now(), goldAvailable = 0) {
  const quote = getWallRepairSpeedupQuote(repairEndsAt, now);
  if (!quote.remainingMs || goldAvailable < quote.cost) return { applied: false, cost: quote.cost, repairEndsAt: Math.max(now, Number(repairEndsAt) || 0) };
  return { applied: true, cost: quote.cost, repairEndsAt: now + Math.max(1000, Math.ceil(quote.remainingMs * 0.75)) };
}

export function getWallDamageVisuals(damage, crenelCount = 15) {
  const points = Math.max(0, Math.min(100, Number(damage) || 0));
  const count = Math.max(1, Math.floor(Number(crenelCount) || 15));
  return { crackCount: Math.ceil(points / 20), rubbleCount: Math.floor(points / 13), fallenCrenels: Math.floor((points / 100) * Math.min(10, count)), breachVisible: points >= 85 };
}
