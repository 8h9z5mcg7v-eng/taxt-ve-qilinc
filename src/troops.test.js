import test from 'node:test';
import assert from 'node:assert/strict';
import { createArmy, armySize } from './troops.js';

test('createArmy fills every troop type and clamps invalid values', () => {
  assert.deepEqual(createArmy({ infantry: 12.8, archer: -5, cavalry: 'bad' }), {
    infantry: 12, spearman: 0, archer: 0, cavalry: 0, knight: 0
  });
});

test('createArmy caps a troop class at 9999', () => {
  assert.equal(createArmy({ knight: 1e20 }).knight, 9999);
});

test('armySize counts only supported troop classes', () => {
  assert.equal(armySize({ infantry: 10, archer: 5, dragon: 900 }), 15);
});
