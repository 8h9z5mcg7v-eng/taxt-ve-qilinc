import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWallRepair, getWallRepairQuote } from './wall-repair.js';
test('repair costs and duration scale with wall damage',()=>{assert.deepEqual(getWallRepairQuote(25),{damage:25,cost:{wood:200,stone:300,gold:50},durationMs:375000})});
test('repair quote clamps invalid damage',()=>{assert.equal(getWallRepairQuote(-5).damage,0);assert.equal(getWallRepairQuote(150).damage,100);assert.equal(getWallRepairQuote('bad').durationMs,0)});
test('unfinished repair preserves wall damage',()=>{assert.deepEqual(normalizeWallRepair(40,5000,4999),{damage:40,repairEndsAt:5000})});
test('finished repair restores full wall condition',()=>{assert.deepEqual(normalizeWallRepair(40,5000,5000),{damage:0,repairEndsAt:0})});
test('damage without repair remains in place and is bounded',()=>{assert.deepEqual(normalizeWallRepair(120,0,5000),{damage:100,repairEndsAt:0})});
