import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTrainingQueue, createTrainingJob, completeTrainingQueue } from './training.js';

test('training queue rejects malformed, duplicate and unsupported jobs',()=>{
 const queue=normalizeTrainingQueue([
  {id:'a',type:'infantry',count:10,startedAt:0,endsAt:30000},
  {id:'a',type:'archer',count:5,startedAt:30000,endsAt:45000},
  {id:'bad',type:'dragon',count:5,startedAt:0,endsAt:1000},
  {id:'fraction',type:'knight',count:1.8,startedAt:0,endsAt:1000},
  {id:'time',type:'cavalry',count:2,startedAt:1000,endsAt:1000}
 ]);
 assert.deepEqual(queue,[{id:'a',type:'infantry',count:10,startedAt:0,endsAt:30000,duration:30000}]);
});

test('training queue is capped at eight valid jobs',()=>{
 const jobs=Array.from({length:10},(_,i)=>({id:'job-'+i,type:'archer',count:1,startedAt:i*3000,endsAt:(i+1)*3000}));
 assert.equal(normalizeTrainingQueue(jobs).length,8);
});

test('new troop training starts after the previous job and uses fixed duration',()=>{
 const queue=[{id:'first',type:'infantry',count:10,startedAt:1000,endsAt:31000}];
 assert.deepEqual(createTrainingJob({queue,type:'knight',count:4,now:5000,id:'second'}),{
  id:'second',type:'knight',count:4,startedAt:31000,endsAt:43000,duration:12000
 });
});

test('training order is FIFO and completed jobs are credited once when removed',()=>{
 const queue=[
  {id:'first',type:'infantry',count:10,startedAt:0,endsAt:3000},
  {id:'second',type:'archer',count:5,startedAt:3000,endsAt:18000}
 ];
 const result=completeTrainingQueue(queue,{infantry:2},5000);
 assert.deepEqual(result.completed.map(job=>job.id),['first']);
 assert.equal(result.army.infantry,12);
 assert.equal(result.army.archer,0);
 assert.deepEqual(result.queue.map(job=>job.id),['second']);
 const next=completeTrainingQueue(result.queue,result.army,20000);
 assert.equal(next.army.archer,5);
 assert.equal(next.queue.length,0);
});

test('new training jobs reject unsupported troops, invalid counts and duplicate IDs',()=>{
 assert.equal(createTrainingJob({type:'dragon',count:2,now:0,id:'x'}),null);
 assert.equal(createTrainingJob({type:'infantry',count:501,now:0,id:'x'}),null);
 assert.equal(createTrainingJob({type:'infantry',count:1,now:0,id:'x',queue:[{id:'x',type:'archer',count:1,startedAt:0,endsAt:3000}]}),null);
});
