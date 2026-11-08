export function normalizeWallRepair(damage, repairEndsAt, now = Date.now()) {
  const safeDamage = Math.max(0, Math.min(100, Math.floor(Number(damage) || 0)));
  const safeEnd = Math.max(0, Number(repairEndsAt) || 0);
  if (safeEnd > 0 && safeEnd <= now) return { damage: 0, repairEndsAt: 0 };
  return { damage: safeDamage, repairEndsAt: safeEnd };
}
export function getWallRepairQuote(damage) {
  const points = Math.max(0, Math.min(100, Math.floor(Number(damage) || 0)));
  return { damage: points, cost: { wood: points * 8, stone: points * 12, gold: points * 2 }, durationMs: points * 15000 };
}
