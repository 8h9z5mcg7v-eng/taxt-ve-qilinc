export function normalizeFortressWallRepair(state = {}, now = Date.now()) {
  const damage = Math.max(0, Math.min(100, Math.floor(Number(state.wallDamage) || 0)));
  let startedAt = Math.max(0, Number(state.wallRepairStartedAt) || 0);
  const endsAt = Math.max(0, Number(state.wallRepairEndsAt) || 0);
  let initialDamage = Math.max(0, Math.min(100, Math.floor(Number(state.wallRepairInitialDamage) || 0)));
  if (endsAt > 0 && endsAt <= now) return { damage: 0, repairStartedAt: 0, repairEndsAt: 0, repairInitialDamage: 0, progress: 1 };
  if (!endsAt) return { damage, repairStartedAt: 0, repairEndsAt: 0, repairInitialDamage: 0, progress: 0 };
  if (!startedAt || startedAt >= endsAt) { startedAt = now; initialDamage = damage; }
  if (!initialDamage) initialDamage = damage;
  const progress = Math.max(0, Math.min(1, (now - startedAt) / (endsAt - startedAt)));
  return { damage: Math.max(0, Math.ceil(initialDamage * (1 - progress))), repairStartedAt: startedAt, repairEndsAt: endsAt, repairInitialDamage: initialDamage, progress };
}

export function getFortressWallRepairQuote(damage) {
  const points = Math.max(0, Math.min(100, Math.floor(Number(damage) || 0)));
  return { damage: points, cost: { wood: points * 8, stone: points * 12, gold: points * 2 }, durationMs: points * 15000 };
}
