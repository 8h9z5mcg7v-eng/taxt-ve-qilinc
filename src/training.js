const TROOP_TYPES=Object.freeze(['infantry','spearman','archer','cavalry','knight']);
const MAX_QUEUE=8;
const MAX_JOB_COUNT=500;
const TRAINING_MS_PER_UNIT=3000;

export function trainingDurationMs(count,barracksLevel=1){
 const units=Math.max(1,Math.min(MAX_JOB_COUNT,Math.floor(Number(count)||1)));
 const level=Math.max(1,Math.min(10,Math.floor(Number(barracksLevel)||1)));
 const speedFactor=1-(level-1)*0.05;
 return Math.max(units*1000,Math.round(units*TRAINING_MS_PER_UNIT*speedFactor));
}

export function normalizeTrainingQueue(value){
 if(!Array.isArray(value))return [];
 const seen=new Set(),queue=[];
 for(const raw of value){
  if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!raw.id.trim()||seen.has(raw.id))continue;
  if(!TROOP_TYPES.includes(raw.type))continue;
  const rawCount=Number(raw.count);
  const count=Math.floor(rawCount);
  const startedAt=Number(raw.startedAt),endsAt=Number(raw.endsAt);
  if(!Number.isInteger(rawCount)||!Number.isFinite(count)||count<1||count>MAX_JOB_COUNT||!Number.isFinite(startedAt)||!Number.isFinite(endsAt)||endsAt<=startedAt)continue;
  seen.add(raw.id);
  queue.push({id:raw.id,type:raw.type,count,startedAt,endsAt,duration:endsAt-startedAt});
  if(queue.length>=MAX_QUEUE)break;
 }
 return queue;
}

export function createTrainingJob({queue=[],type,count,now=Date.now(),id,barracksLevel=1}={}){
 const safeQueue=normalizeTrainingQueue(queue);
 const safeCount=Math.floor(Number(count));
 const start=Number(now);
 if(safeQueue.length>=MAX_QUEUE||!TROOP_TYPES.includes(type)||!Number.isFinite(safeCount)||safeCount<1||safeCount>MAX_JOB_COUNT||!Number.isFinite(start)||typeof id!=='string'||!id.trim())return null;
 if(safeQueue.some(job=>job.id===id))return null;
 const startedAt=Math.max(start,Number(safeQueue.at(-1)?.endsAt)||start);
 const duration=trainingDurationMs(safeCount,barracksLevel);
 return {id,type,count:safeCount,startedAt,endsAt:startedAt+duration,duration};
}

export function completeTrainingQueue(queue,army={},now=Date.now()){
 const pending=normalizeTrainingQueue(queue);
 const nextArmy={};
 for(const type of TROOP_TYPES)nextArmy[type]=Math.max(0,Math.floor(Number(army?.[type])||0));
 const completed=[];
 const time=Number(now);
 if(!Number.isFinite(time))return {queue:pending,army:nextArmy,completed};
 while(pending.length&&Number(pending[0].endsAt)<=time){
  const job=pending.shift();
  nextArmy[job.type]+=job.count;
  completed.push(job);
 }
 return {queue:pending,army:nextArmy,completed};
}
