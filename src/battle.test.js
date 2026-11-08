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

test('fortress terrain strengthens defender power over open plains', () => {
  const input = { attacker: { infantry: 20 }, defender: { infantry: 20 }, seed: 8 };
  const plains = resolveBattle({ ...input, terrain: 'plains' });
  const fortress = resolveBattle({ ...input, terrain: 'fortress' });
  assert.ok(fortress.power.defender > plains.power.defender);
});

test('forest terrain reduces cavalry attack effectiveness', () => {
  const input = { attacker: { cavalry: 20 }, defender: { infantry: 10 }, seed: 8 };
  const plains = resolveBattle({ ...input, terrain: 'plains' });
  const forest = resolveBattle({ ...input, terrain: 'forest' });
  assert.ok(forest.power.attacker < plains.power.attacker);
});

test('hill terrain gives the attacker a modest height advantage', () => {
  const input = { attacker: { infantry: 20 }, defender: { infantry: 20 }, seed: 8 };
  const plains = resolveBattle({ ...input, terrain: 'plains' });
  const hill = resolveBattle({ ...input, terrain: 'hill' });
  assert.ok(hill.power.attacker > plains.power.attacker);
});


test('ram and catapults damage fortress walls and can breach them', () => {
  const base = { attacker: { infantry: 30 }, defender: { infantry: 20 }, terrain: 'fortress', seed: 8 };
  const noSiege = resolveBattle({ ...base, siege: {} });
  const siege = resolveBattle({ ...base, siege: { ram: 2, catapult: 3 } });
  assert.equal(noSiege.siege.wallDamage, 0);
  assert.equal(siege.siege.wallDamage, 100);
  assert.equal(siege.siege.wallBreached, true);
  assert.ok(siege.power.attacker > noSiege.power.attacker);
});

test('siege engines do not apply wall damage on open terrain', () => {
  const result = resolveBattle({
    attacker: { infantry: 10 }, defender: { infantry: 10 },
    terrain: 'plains', siege: { ram: 5, catapult: 5 }, seed: 8
  });
  assert.equal(result.siege.wallMax, 0);
  assert.equal(result.siege.wallDamage, 0);
});


test('siege engine counts are clamped to the supported 0–20 range', () => {
  const base = { attacker: { infantry: 20 }, defender: { infantry: 10 }, terrain: 'fortress', seed: 4 };
  const result = resolveBattle({ ...base, siege: { ram: 999, catapult: -5 } });
  assert.equal(result.siege.ram, 20);
  assert.equal(result.siege.catapult, 0);
  assert.equal(result.siege.wallDamage, 100);
});

test('fortress wall damage is capped and cannot become negative', () => {
  const base = { attacker: { infantry: 10 }, defender: { infantry: 10 }, terrain: 'fortress', seed: 4 };
  const result = resolveBattle({ ...base, siege: { ram: 20, catapult: 20 } });
  assert.equal(result.siege.wallDamage, 100);
  assert.equal(result.siege.wallRemaining, 0);
  assert.equal(result.siege.wallBreached, true);
});

test('losses never exceed the number of units in each troop class', () => {
  const attacker = { infantry: 1, archer: 2, cavalry: 1 };
  const defender = { infantry: 1, spearman: 1, knight: 1 };
  const result = resolveBattle({ attacker, defender, seed: 999 });
  for (const [type, count] of Object.entries(attacker)) {
    assert.ok(result.losses.attacker[type] <= count);
    assert.ok(result.remaining.attacker[type] >= 0);
  }
  for (const [type, count] of Object.entries(defender)) {
    assert.ok(result.losses.defender[type] <= count);
    assert.ok(result.remaining.defender[type] >= 0);
  }
});


test('siege engines give no artificial attack bonus outside fortress terrain', () => {
  const base = { attacker: { infantry: 10 }, defender: { infantry: 10 }, terrain: 'plains', seed: 12 };
  const plain = resolveBattle({ ...base, siege: {} });
  const withSiege = resolveBattle({ ...base, siege: { ram: 20, catapult: 20 } });
  assert.equal(withSiege.power.attacker, plain.power.attacker);
  assert.equal(withSiege.siege.attackBonus, 0);
});

test('intact fortress wall gives exactly the intended 32 percent defence bonus', () => {
  const base = { attacker: { infantry: 10 }, defender: { infantry: 10 }, seed: 15 };
  const open = resolveBattle({ ...base, terrain: 'plains' });
  const fortress = resolveBattle({ ...base, terrain: 'fortress' });
  assert.ok(Math.abs(fortress.power.defender - open.power.defender * 1.32) <= 1);
});


test('general bonuses improve only the selected troop speciality', () => {
  const base = resolveBattle({ attacker: { cavalry: 10 }, defender: { infantry: 10 }, seed: 17 });
  const alp = resolveBattle({ attacker: { cavalry: 10 }, defender: { infantry: 10 }, commander: { id: 'alp', xp: 0 }, seed: 17 });
  const tomris = resolveBattle({ attacker: { cavalry: 10 }, defender: { infantry: 10 }, commander: { id: 'tomris', xp: 0 }, seed: 17 });
  assert.ok(alp.power.attacker > base.power.attacker);
  assert.ok(tomris.power.attacker > base.power.attacker);
  assert.ok(alp.power.attacker > tomris.power.attacker);
});

test('general experience increases the specialist bonus without changing defence', () => {
  const input = { attacker: { archer: 20 }, defender: { infantry: 10 }, commander: { id: 'tomris', xp: 0 }, seed: 21 };
  const novice = resolveBattle(input);
  const veteran = resolveBattle({ ...input, commander: { id: 'tomris', xp: 500 } });
  assert.ok(veteran.power.attacker > novice.power.attacker);
  assert.equal(veteran.power.defender, novice.power.defender);
});


test('building upgrades boost matching attacker troops only', () => {
 const base={defender:{infantry:100},seed:31};
 for (const [type,key] of [['infantry','barracks'],['archer','archery'],['cavalry','stable']]) {
  const plain=resolveBattle({...base,attacker:{[type]:20}});
  const upgraded=resolveBattle({...base,attacker:{[type]:20},attackerBuildings:{[key]:5}});
  assert.ok(upgraded.power.attacker>plain.power.attacker);
  assert.equal(upgraded.power.defender,plain.power.defender);
 }
});

test('building level modifiers are safely clamped', () => {
 const r=resolveBattle({attacker:{infantry:20},defender:{infantry:20},attackerBuildings:{barracks:99,archery:-5,stable:3},seed:32});
 assert.equal(r.modifiers.attackerBuildings.barracks,10);
 assert.equal(r.modifiers.attackerBuildings.archery,1);
});
