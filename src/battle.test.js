import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBattle } from './battle.js';

test('battle output is deterministic for the same seed and armies', () => {
  const input = { attacker: { infantry: 20, archer: 10 }, defender: { spearman: 12, cavalry: 5 }, seed: 42 };
  assert.deepEqual(resolveBattle(input), resolveBattle(input));
});

test('counter units increase attack power against the unit they counter', () => {
  const attacker = { archer: 10 };
  const againstInfantry = resolveBattle({ attacker, defender: { infantry: 10 } });
  const againstCavalry = resolveBattle({ attacker, defender: { cavalry: 10 } });
  assert.ok(againstInfantry.power.attacker > againstCavalry.power.attacker);
});

test('line formation increases infantry and spearman attack power', () => {
  const base = resolveBattle({ attacker: { infantry: 10 }, defender: { knight: 10 }, tactic: 'balanced' });
  const line = resolveBattle({ attacker: { infantry: 10 }, defender: { knight: 10 }, tactic: 'line' });
  assert.ok(line.power.attacker > base.power.attacker);
});

test('invalid direction and tactic fall back to safe defaults', () => {
  const result = resolveBattle({ attacker: { infantry: 5 }, defender: { infantry: 5 }, direction: 'up', tactic: 'magic' });
  assert.equal(result.direction, 'south');
  assert.equal(result.tactic, 'balanced');
});

test('empty armies return a readable result without invalid losses', () => {
  const result = resolveBattle({ attacker: {}, defender: { infantry: 5 } });
  assert.equal(result.winner, 'defender');
  assert.ok(result.log[0].includes('qoşun'));
});
