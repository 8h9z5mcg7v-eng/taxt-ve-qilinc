import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFortressWallRepair, getFortressWallRepairQuote } from './fortress-repair.js';

test('fortress repair cost and time scale with wall damage', () => {
  assert.deepEqual(getFortressWallRepairQuote(25), { damage: 25, cost: { wood: 200, stone: 300, gold: 50 }, durationMs: 375000 });
});
test('fortress repair quote clamps invalid damage', () => {
  assert.equal(getFortressWallRepairQuote(150).damage, 100);
  assert.equal(getFortressWallRepairQuote(-1).durationMs, 0);
});
test('fortress wall integrity recovers gradually', () => {
  const state = normalizeFortressWallRepair({ wallDamage: 80, wallRepairStartedAt: 1000, wallRepairEndsAt: 9000, wallRepairInitialDamage: 80 }, 5000);
  assert.equal(state.damage, 40);
  assert.equal(state.progress, 0.5);
});
test('fortress repair completion clears its timer metadata', () => {
  assert.deepEqual(normalizeFortressWallRepair({ wallDamage: 40, wallRepairStartedAt: 1000, wallRepairEndsAt: 5000, wallRepairInitialDamage: 40 }, 5000), { damage: 0, repairStartedAt: 0, repairEndsAt: 0, repairInitialDamage: 0, progress: 1 });
});
test('fortress repair without an active timer preserves wall damage', () => {
  assert.equal(normalizeFortressWallRepair({ wallDamage: 35 }, 5000).damage, 35);
});
