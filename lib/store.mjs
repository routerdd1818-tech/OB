import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const initialState = () => ({ revision: 0, epoch: randomUUID(), round: 0, phase: 'waiting', deadline: null, remaining: null, participants: {}, hosts: {}, groups: Array.from({length:5}, (_,i) => ({id:i+1, cq:100, representative:null})), votes: [{},{},{},{}], results: [{},{},{},{}], attempts: {} });
const key = process.env.WORKSHOP_KEY || 'cq-dialogue-workshop';
const path = resolve(process.env.LOCAL_STATE_FILE || '.data/workshop.json');
const remote = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
let queue = Promise.resolve();
async function redis(command) {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL, {method:'POST', headers:{Authorization:`Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type':'application/json'}, body:JSON.stringify(command), signal:AbortSignal.timeout(8000)});
  if (!res.ok) throw new Error('資料服務暫時無法連線');
  const data = await res.json();
  if (data.error) throw new Error('資料服務回應錯誤');
  return data.result;
}
export async function readState() {
  if (remote) return JSON.parse(await redis(['GET', key]) || 'null') || initialState();
  if (process.env.VERCEL) {
    const tmpPath = resolve('/tmp/workshop.json');
    try { return JSON.parse(await readFile(tmpPath, 'utf8')); } catch(e) { return initialState(); }
  }
  try { return JSON.parse(await readFile(path,'utf8')); } catch(e) { if(e.code==='ENOENT') return initialState(); throw e; }
}
export function mutate(fn) {
  const run = async () => {
    for(let retry=0; retry<15; retry++) {
      const state = await readState();
      const oldRevision = state.revision;
      const result = fn(state);
      state.revision++;
      if (remote) {
        const script = "local current=redis.call('GET',KEYS[1]); if current then if cjson.decode(current).revision~=tonumber(ARGV[1]) then return 0 end elseif tonumber(ARGV[1])~=0 then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1";
        if (!await redis(['EVAL',script,1,key,String(oldRevision),JSON.stringify(state)])) continue;
      } else {
        const targetPath = process.env.VERCEL ? resolve('/tmp/workshop.json') : path;
        await mkdir(dirname(targetPath), {recursive:true});
        await writeFile(targetPath+'.tmp',JSON.stringify(state),'utf8');
        await rename(targetPath+'.tmp',targetPath);
      }
      return result;
    }
    throw new Error('同時操作較多，請重試');
  };
  const pending = queue.then(run,run);
  queue = pending.catch(()=>{});
  return pending;
}
