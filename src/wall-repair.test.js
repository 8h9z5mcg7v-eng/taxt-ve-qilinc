import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWallRepair, getWallRepairQuote, getWallRepairSpeedupQuote, applyWallRepairSpeedup, getWallDamageVisuals } from './wall-repair.js';
test('repair costs and duration scale with wall damage',()=>{assert.deepEqual(getWallRepairQuote(25),{damage:25,cost:{wood:200,stone:300,gold:50},durationMs:375000})});
test('repair quote clamps invalid damage',()=>{assert.equal(getWallRepairQuote(-5).damage,0);assert.equal(getWallRepairQuote(150).damage,100);assert.equal(getWallRepairQuote('bad').durationMs,0)});
test('repair restores wall integrity gradually over its duration',()=>{const s=normalizeWallRepair(100,1000,11000,100,6000);assert.equal(s.progress,0.5);assert.equal(s.damage,50)});
test('unfinished repair keeps progressing after reload',()=>{const s=normalizeWallRepair(80,1000,11000,100,4000);assert.equal(s.damage,70);assert.equal(s.repairStartedAt,1000)});
test('completed repair clears damage and repair metadata',()=>{assert.deepEqual(normalizeWallRepair(40,1000,5000,40,5000),{damage:0,repairStartedAt:0,repairEndsAt:0,repairInitialDamage:0,progress:1})});
test('legacy active repair without start time resumes safely',()=>{const s=normalizeWallRepair(40,0,5000,0,2000);assert.equal(s.damage,40);assert.equal(s.repairStartedAt,2000)});
test('speed-up costs gold and reduces remaining repair time by 25 percent',()=>{assert.equal(getWallRepairSpeedupQuote(61000,1000).cost,3);assert.deepEqual(applyWallRepairSpeedup(61000,1000,3),{applied:true,cost:3,repairEndsAt:46000})});
test('speed-up is rejected when gold is insufficient or repair is complete',()=>{assert.equal(applyWallRepairSpeedup(61000,1000,2).applied,false);assert.equal(applyWallRepairSpeedup(1000,1000,100).applied,false)});

test('wall damage visuals progress from hairline cracks to a breached opening',()=>{
 assert.deepEqual(getWallDamageVisuals(0,15),{crackCount:0,rubbleCount:0,fallenCrenels:0,breachVisible:false});
 assert.deepEqual(getWallDamageVisuals(50,15),{crackCount:3,rubbleCount:3,fallenCrenels:5,breachVisible:false});
 assert.deepEqual(getWallDamageVisuals(100,15),{crackCount:5,rubbleCount:7,fallenCrenels:10,breachVisible:true});
});
test('wall damage visuals clamp damage and support vertical wall lengths',()=>{
 assert.equal(getWallDamageVisuals(85,14).breachVisible,true);
 assert.equal(getWallDamageVisuals(-20,14).fallenCrenels,0);
 assert.equal(getWallDamageVisuals(140,14).fallenCrenels,10);
});
