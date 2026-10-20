import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rounds, outcome } from '../lib/rounds.mjs';

let server, directory, hostCookie, memberCookies=[], observerCookie;
const base='http://127.0.0.1:3107';

async function request(action='state',body,cookie='',role='member') {
  const res=await fetch(`${base}/api/workshop?action=${action}&role=${role}`,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
const host=(action,body)=>request(action,body,hostCookie,'host');

before(async()=>{
  directory=await mkdtemp(join(tmpdir(),'cq-lab-test-'));
  server=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:'3107',HOST_PASSWORD:'test-password',LOCAL_STATE_FILE:join(directory,'state.json'),UPSTASH_REDIS_REST_URL:'',UPSTASH_REDIS_REST_TOKEN:'',VERCEL:''},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.once('data',resolve);});
  hostCookie=(await request('login',{password:'test-password'},'','host')).cookie;
});

after(async()=>{server?.kill();await new Promise(resolve=>server?.exitCode!==null?resolve():server.once('exit',resolve));await rm(directory,{recursive:true,force:true});});

test('host allows direct access without password',async()=>{
  assert.equal((await request('state',undefined,'','host')).status,200);
  assert.equal((await request('login',{},'','host')).status,200);
});

test('five groups join independently; groups 1-4 decision and group 5 jury',async()=>{
  const joined=await Promise.all(Array.from({length:5},(_,i)=>request('join',{name:`代表${i+1}`,group:i+1})));
  memberCookies=joined.map(r=>r.cookie);assert.ok(joined.every(r=>r.status===200));
  observerCookie=(await request('join',{name:'同組成員',group:1})).cookie;
  for(let i=0;i<4;i++){
    const {data}=await request('state',undefined,memberCookies[i]);
    assert.equal(data.member.group,i+1);
    assert.equal(data.member.isRepresentative,true);
    assert.equal(data.member.isJury,false);
    assert.equal(data.group.anger,25);
    assert.equal(data.group.cq,25);
    assert.equal('groups' in data,false);
    assert.equal('count' in data.group,false);
    assert.equal('cq' in data.round.options[0],false);
    assert.equal('tension' in data.round.options[0],false);
  }
  // Group 5 is Jury
  const {data:juryData}=await request('state',undefined,memberCookies[4]);
  assert.equal(juryData.member.group,5);
  assert.equal(juryData.member.isJury,true);
  assert.ok(Array.isArray(juryData.decisionGroups));
  assert.equal(juryData.decisionGroups.length,4);
  assert.equal((await request('join',{name:'切換',group:2},memberCookies[0])).status,409);
});

test('representatives only; participant role cannot trigger host actions',async()=>{
  assert.equal((await request('reveal',{},memberCookies[0])).status,403);
  assert.equal((await host('start',{})).status,200);
  const {data}=await request('state',undefined,observerCookie);
  assert.equal(data.member.isRepresentative,false);
  assert.equal((await request('vote',{choice:'A',epoch:data.epoch,roundIndex:0},observerCookie)).status,403);
});

test('concurrent group votes stay isolated; jury can rank and cannot vote',async()=>{
  const current=(await host()).data;
  // Groups 1 to 4 submit votes
  const responses=await Promise.all([0,1,2,3].map(i=>request('vote',{choice:['A','B','C','D'][i],epoch:current.epoch,roundIndex:0},memberCookies[i])));
  assert.ok(responses.every(r=>r.status===200));
  // Group 5 (Jury) cannot vote
  const juryVote=await request('vote',{choice:'A',epoch:current.epoch,roundIndex:0},memberCookies[4]);
  assert.equal(juryVote.status,403);

  // Group 5 submits jury rankings (e.g. rank 1, rank 2, rank 3, rank 4)
  const juryRankRes=await request('jury-rank',{rankings:{1:1,2:2,3:3,4:4},epoch:current.epoch,roundIndex:0},memberCookies[4]);
  assert.equal(juryRankRes.status,200);

  for(let i=0;i<4;i++){
    const {data}=await request('state',undefined,memberCookies[i]);
    assert.equal(data.vote.choice,['A','B','C','D'][i]);
    assert.equal(data.result,null);
    assert.equal('results' in data,false);
    assert.equal('distribution' in data,false);
  }
  const {data}=await host();
  assert.equal(data.completed,4);
  assert.equal(data.decisionTotal,4);
  assert.equal(data.jurySubmitted,true);
  assert.equal('options' in data.round,false);
  assert.equal('results' in data,false);
  assert.equal('votes' in data,false);
  assert.equal(JSON.stringify(data).includes('"choice"'),false);
});

test('votes can be updated before reveal, reveal is applied once, and stale votes are rejected',async()=>{
  const before=(await host()).data;
  // Update group 1 vote to B (optimal answer in round 1)
  assert.equal((await request('vote',{choice:'B',epoch:before.epoch,roundIndex:0},memberCookies[0])).status,200);
  assert.equal((await host('reveal',{})).status,200);
  const afterReveal=(await host()).data;
  assert.equal(afterReveal.results[1].tension,35);
  assert.equal(afterReveal.groups[0].anger,10);
  assert.equal(afterReveal.results[1].actualDelta,-15);
  assert.equal(afterReveal.results[4].tension,92);
  assert.equal(afterReveal.groups[3].anger,70);
  assert.equal((await host('reveal',{})).status,409);
  assert.equal((await request('vote',{choice:'D',epoch:before.epoch,roundIndex:0},memberCookies[0])).status,409);
  assert.equal((await request('state',undefined,memberCookies[0])).data.result.tension,35);
  assert.equal((await host('next',{})).status,200);
  assert.equal((await host('start',{})).status,200);
  assert.equal((await request('vote',{choice:'D',epoch:before.epoch,roundIndex:0},memberCookies[0])).status,409);
});

test('pause/resume uses shared server deadlines and incomplete reveal needs explicit confirmation',async()=>{
  await host('timer',{});let state=(await host()).data;assert.equal(state.deadline,null);assert.ok(state.remaining>0);
  await host('timer',{});state=(await host()).data;assert.ok(state.deadline>Date.now());assert.equal(state.remaining,null);
  assert.equal((await host('reveal',{})).status,409);
  // Round 2 choice and jury ranking
  await request('vote',{choice:'C',epoch:state.epoch,roundIndex:1},memberCookies[0]);
  await request('jury-rank',{rankings:{1:1},epoch:state.epoch,roundIndex:1},memberCookies[4]);
  assert.equal((await host('reveal',{confirmIncomplete:true})).status,200);
  state=(await host()).data;assert.equal(state.groups[0].anger,0);
  await host('next',{});await host('start',{});await host('reveal',{confirmIncomplete:true});await host('next',{});
});

test('fourth round starts with 60 seconds and requires three actual decisions',async()=>{
  await host('start',{});const state=(await host()).data;assert.equal(state.roundIndex,3);assert.ok(state.deadline-Date.now()<=60000);assert.ok(state.deadline-Date.now()>58000);
  // Round 4 optimal is B
  assert.equal((await request('vote',{choice:'B',epoch:state.epoch,roundIndex:3,consensus:[true,true]},memberCookies[0])).status,400);
  assert.equal((await request('vote',{choice:'B',epoch:state.epoch,roundIndex:3,consensus:[true,true,false]},memberCookies[0])).status,200);
  assert.equal((await request('vote',{choice:'B',epoch:state.epoch,roundIndex:3,consensus:[true,true,true]},memberCookies[1])).status,200);
  await host('reveal',{confirmIncomplete:true});const result=(await host()).data;
  assert.equal(result.results[1].id,'X');assert.equal(result.results[1].tension,100);
  assert.equal(result.results[2].tension,33);assert.equal(result.results[2].reduction,65);
  await host('next',{});assert.equal((await host()).data.phase,'finished');
});

test('representative transfer and reset preserve only host access',async()=>{
  const observer=(await request('state',undefined,observerCookie)).data;
  assert.equal((await host('representative',{memberId:observer.member.id})).status,200);
  assert.equal((await request('state',undefined,observerCookie)).data.member.isRepresentative,true);
  assert.equal((await request('state',undefined,memberCookies[0])).data.member.isRepresentative,false);
  assert.equal((await host('reset',{confirm:'RESET'})).status,200);
  assert.equal((await request('state',undefined,memberCookies[0])).status,401);
  const state=(await host()).data;assert.equal(state.phase,'waiting');assert.ok(state.groups.every(g=>g.anger===25&&g.count===0));
});

test('all tension values match the requested matrix; answers are not in static client code',async()=>{
  // New tension matrix with distributed answers: Round 1 (B:35), Round 2 (C:30), Round 3 (A:40), Round 4 (B:33)
  const expected=[[90,35,75,92],[95,75,30,100],[40,95,85,98],[78,33,73,83]];
  rounds.forEach((round,i)=>round.options.forEach((option,j)=>{assert.equal(outcome(i,{choice:option.id}).tension,expected[i][j]);assert.equal(outcome(i,{choice:option.id}).reduction,round.baseline-expected[i][j]);}));
  const client=await readFile('public/participant.js','utf8');assert.equal(client.includes('Nemawashi'),false);
  assert.equal((await fetch(base+'/lib/rounds.mjs')).status,404);
  assert.equal((await fetch(base+'/host')).status,200);
});

test('cross-origin writes are rejected',async()=>{
  const response=await fetch(base+'/api/workshop?action=join',{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:JSON.stringify({name:'x',group:1})});assert.equal(response.status,403);
});

test('juryRole dynamically changes each round to match the background perspective', async () => {
  const roundRoles = [
    { title: '【公司方】東京研發團隊代表席', short: '公司方 · 東京團隊' },
    { title: '【總部方】矽谷高層決策席', short: '總部方 · 矽谷高層' },
    { title: '【公司方】東京第一線研發工程團隊', short: '公司方 · 東京工程師' },
    { title: '【關鍵方】全球客戶與獨立董事審查席', short: '關鍵方 · 客戶與董事' }
  ];
  const { publicRound } = await import('../lib/rounds.mjs');
  for (let i = 0; i < 4; i++) {
    const pr = publicRound(i);
    assert.ok(pr.juryRole, `Round ${i+1} must have juryRole`);
    assert.equal(pr.juryRole.title, roundRoles[i].title);
    assert.equal(pr.juryRole.short, roundRoles[i].short);
    assert.ok(pr.juryRole.counterpart);
    assert.ok(pr.juryRole.stance);
    assert.ok(pr.juryRole.pitchTarget);
  }
});

