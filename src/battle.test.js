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


test('fortress defence tower and matching buildings strengthen defending troops', () => {
 const base={attacker:{infantry:40,archer:20,cavalry:15},defender:{infantry:20,archer:20,cavalry:20},terrain:'fortress',seed:77};
 const plain=resolveBattle(base);
 const tower=resolveBattle({...base,defenderBuildings:{tower:8}});
 const barracks=resolveBattle({...base,defenderBuildings:{barracks:8}});
 const archery=resolveBattle({...base,defenderBuildings:{archery:8}});
 const stable=resolveBattle({...base,defenderBuildings:{stable:8}});
 assert.ok(tower.power.defender>plain.power.defender);
 assert.ok(barracks.power.defender>plain.power.defender);
 assert.ok(archery.power.defender>plain.power.defender);
 assert.ok(stable.power.defender>plain.power.defender);
});

test('defender building bonuses do not affect attackers or open-field battles', () => {
 const input={attacker:{infantry:20},defender:{infantry:20},terrain:'plains',seed:91};
 const plain=resolveBattle(input);
 const fortified=resolveBattle({...input,defenderBuildings:{tower:10,barracks:10,archery:10,stable:10}});
 assert.equal(fortified.power.defender,plain.power.defender);
 assert.equal(fortified.power.attacker,plain.power.attacker);
});


test('battle log explains troop-building bonuses and fortress-only defence upgrades', () => {
 const attack=resolveBattle({attacker:{infantry:10,archer:10,cavalry:10},defender:{infantry:10},attackerBuildings:{barracks:3,archery:4,stable:2},seed:111});
 assert.ok(attack.log.some(line=>line.includes('Kazarma +5%')&&line.includes('Oxçuluq +9%')&&line.includes('Tövlə +3%')));
 assert.ok(!attack.log.some(line=>line.includes('Qala müdafiə tikililəri')));
 const defence=resolveBattle({attacker:{infantry:10},defender:{infantry:10},terrain:'fortress',defenderBuildings:{tower:2,barracks:3,archery:2,stable:4},seed:112});
 assert.ok(defence.log.some(line=>line.includes('Qüllə +2.5%')&&line.includes('Kazarma +4%')&&line.includes('Oxçuluq +2.5%')&&line.includes('Tövlə +6%')));
});


test('fortress siege damage accumulates and reports only new damage per battle', () => {
 const base={attacker:{infantry:20},defender:{infantry:20},terrain:'fortress',seed:121,siege:{ram:1}};
 const first=resolveBattle(base);
 assert.equal(first.siege.wallDamageBefore,0);
 assert.equal(first.siege.wallDamageThisBattle,18);
 assert.equal(first.siege.wallDamage,18);
 const second=resolveBattle({...base,priorWallDamage:first.siege.wallDamage});
 assert.equal(second.siege.wallDamageBefore,18);
 assert.equal(second.siege.wallDamageThisBattle,18);
 assert.equal(second.siege.wallDamage,36);
 assert.ok(second.log.some(line=>line.includes('əvvəlki zədə: 18/100')&&line.includes('bu döyüşdə əlavə zədə: +18')));
});

test('higher fortress wall levels reduce incoming siege damage', () => {
 const base={attacker:{infantry:20},defender:{infantry:20},terrain:'fortress',siege:{catapult:2},seed:122};
 const levelOne=resolveBattle({...base,wallLevel:1});
 const levelTen=resolveBattle({...base,wallLevel:10});
 assert.ok(levelTen.siege.wallDamageThisBattle<levelOne.siege.wallDamageThisBattle);
});

test('fortress wall damage progressively weakens defenders and a breach removes the intact-wall advantage', () => {
 const base={attacker:{infantry:35},defender:{infantry:30},terrain:'fortress',seed:312};
 const intact=resolveBattle({...base,priorWallDamage:0});
 const half=resolveBattle({...base,priorWallDamage:50});
 const breached=resolveBattle({...base,priorWallDamage:100});
 assert.ok(intact.power.defender>half.power.defender);
 assert.ok(half.power.defender>breached.power.defender);
 assert.ok(intact.log.some(line=>line.includes('müdafiə bütövlüyü: 100%')));
 assert.ok(breached.log.some(line=>line.includes('müdafiə bütövlüyü: 60%')));
});
