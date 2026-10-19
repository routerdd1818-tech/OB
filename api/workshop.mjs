import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readState, mutate, initialState } from '../lib/store.mjs';
import { rounds, publicRound, outcome } from '../lib/rounds.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (message, status=400) => { throw Object.assign(new Error(message),{status}); };
function cookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),x.slice(i+1)];})); }
function session(req,state,role) {
  const token = cookies(req)[role==='host'?'cq_host':'cq_member'];
  const found = token && (role==='host'?state.hosts:state.participants)[hash(token)];
  if (!found || found.expires < Date.now()) fail(role==='host'?'請先登入簡報者主控台':'請重新填寫姓名與組別',401);
  return found;
}
function setCookie(res,role,token) { res.setHeader('Set-Cookie',`cq_${role}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.VERCEL?'; Secure':''}`); }
function shared(state,options) { return { epoch:state.epoch, revision:state.revision, roundIndex:state.round, phase:state.phase, deadline:state.deadline, remaining:state.remaining, serverTime:Date.now(), round:publicRound(state.round,options) }; }
function memberView(state,member) {
  const group=state.groups[member.group-1];
  const isJury=(member.group===5);
  const revealed=['revealed','finished'].includes(state.phase);
  const angerVal = group.anger ?? group.cq ?? 25;
  if(isJury) {
    const decisionGroups=state.groups.slice(0,4).map(g=>{
      const vote=state.votes[state.round][g.id];
      const opt=vote?rounds[state.round].options.find(o=>o.id===vote.choice):null;
      const gAnger = g.anger ?? g.cq ?? 25;
      return { id:g.id, anger:gAnger, cq:gAnger, submitted:Boolean(vote), choice:vote?vote.choice:null, proposal:vote?vote.proposal:null, title:opt?opt.title:null, text:opt?opt.text:null, blindspot:opt?opt.blindspot:null, consensus:vote?vote.consensus:null };
    });
    return { ...shared(state,true), member:{name:member.name,id:member.id,group:member.group,isRepresentative:true,isJury:true}, group:{id:5,anger:25,cq:25,isJury:true,representativeName:member.name}, decisionGroups, juryRankings:state.juryRankings?(state.juryRankings[state.round]||{}):{}, jurySubmitted:state.jurySubmitted?Boolean(state.jurySubmitted[state.round]):false, optionsWithIntel:rounds[state.round].options, results:revealed?state.results[state.round]:null };
  }
  return { ...shared(state,true), member:{name:member.name,id:member.id,group:member.group,isRepresentative:group.representative===member.id,isJury:false}, group:{id:group.id,anger:angerVal,cq:angerVal,isJury:false,representativeName:Object.values(state.participants).find(p=>p.id===group.representative)?.name || '尚未指定'}, vote:state.votes[state.round][group.id] || null, juryRank:(revealed&&state.juryRankings)?(state.juryRankings[state.round]?.[group.id]||null):null, result:revealed?state.results[state.round][group.id] || null:null };
}
function hostView(state,req) {
  const revealed=['revealed','finished'].includes(state.phase);
  const votes=state.votes[state.round];
  const decisionVotes=Object.keys(votes).filter(id=>Number(id)<=4);
  const jurySubmitted=state.jurySubmitted?Boolean(state.jurySubmitted[state.round]):false;
  const juryRankings=state.juryRankings?state.juryRankings[state.round]:{};
  const result= { ...shared(state,false), completed:decisionVotes.length, decisionTotal:4, jurySubmitted, juryRankings, groups:state.groups.map(g=>{
    const gAnger = g.anger ?? g.cq ?? 25;
    return { ...g, anger:gAnger, cq:gAnger, count:Object.values(state.participants).filter(p=>p.group===g.id && p.expires>Date.now()).length, submitted:g.id===5?jurySubmitted:Boolean(votes[g.id]), members:Object.values(state.participants).filter(p=>p.group===g.id && p.expires>Date.now()).map(({id,name})=>({id,name}))};
  }), joinUrl:process.env.PUBLIC_URL ? new URL('/',process.env.PUBLIC_URL).href : `${process.env.VERCEL?'https':'http'}://${req.headers.host}/`};
  if (revealed) { result.results=state.results[state.round]; result.distribution=[...rounds[state.round].options,...(state.round===3?[rounds[3].breakdown]:[])].map(o=>({id:o.id,title:o.title,count:Object.entries(votes).filter(([gid,v])=>Number(gid)<=4&&v.choice===o.id).length, result:outcome(state.round,{choice:o.id})})); }
  return result;
}
async function bodyOf(req) {
  if(req.body) { const value= typeof req.body==='string'?JSON.parse(req.body):req.body; if(JSON.stringify(value).length>8000) fail('資料過大',413); return value; }
  let body=''; for await(const chunk of req){ body+=chunk; if(body.length>8000) fail('資料過大',413); }
  try{return JSON.parse(body || '{}');}catch{fail('資料格式錯誤');}
}
export default async function handler(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  try {
    if(!['GET','POST'].includes(req.method)) fail('不支援此操作',405);
    if(req.method==='POST') {
      if(!req.headers['content-type']?.includes('application/json')) fail('請使用 JSON',415);
      if(req.headers.origin && new URL(req.headers.origin).host!==req.headers.host) fail('來源不符',403);
    }
    const url=new URL(req.url,'http://localhost');
    const action=url.searchParams.get('action') || 'state';
    const role=url.searchParams.get('role')==='host'?'host':'member';
    if(req.method==='GET') { const state=await readState();const user=session(req,state,role);res.end(JSON.stringify(role==='host'?hostView(state,req):memberView(state,user)));return; }
    const body=await bodyOf(req);
    if(action==='login') {
      const password=process.env.HOST_PASSWORD || 'classroom-demo';
      if(!password) fail('尚未設定簡報者密碼',503);
      const ip=hash(String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'));
      const token=randomBytes(32).toString('hex');
      const answer=await mutate(state=>{
        const now=Date.now();const tries=state.attempts[ip];
        if(tries && tries.until>now && tries.count>=8) return {error:'嘗試次數過多，請在 15 分鐘後再試',status:429};
        if(typeof body.password!=='string'||!timingSafeEqual(Buffer.from(hash(password)),Buffer.from(hash(body.password)))) {
          state.attempts[ip]={count:tries?.until>now?tries.count+1:1,until:now+900000};return {error:'密碼不正確',status:401};
        }
        delete state.attempts[ip];state.hosts[hash(token)]={expires:now+43200000};return {ok:true};
      });
      if(answer.error) fail(answer.error,answer.status);setCookie(res,'host',token);res.end(JSON.stringify(answer));return;
    }
    if(action==='join') {
      const name=typeof body.name==='string'?body.name.trim():'';const group=Number(body.group);
      if(!name||name.length>30||!Number.isInteger(group)||group<1||group>5) fail('請填寫 1–30 字姓名並選擇組別');
      const token=randomBytes(32).toString('hex');
      await mutate(state=>{
        const old=cookies(req).cq_member;const prior=old && state.participants[hash(old)];
        if(prior && prior.expires>Date.now()) fail('已加入課堂，不能切換至其他組別',409);
        const member={id:randomBytes(12).toString('hex'),name,group,expires:Date.now()+43200000};
        state.participants[hash(token)]=member;
        const target=state.groups[group-1];
        if(!Object.values(state.participants).some(p=>p.id===target.representative&&p.expires>Date.now())) target.representative=member.id;
      });setCookie(res,'member',token);res.end(JSON.stringify({ok:true}));return;
    }
    await mutate(state=>{
      const user=session(req,state,role);
      if(role==='member') {
        if(action==='jury-rank') {
          if(user.group!==5) fail('只有第 5 組（裁判組）可進行評定裁決',403);
          if(state.phase!=='voting') fail('目前非評定階段',409);
          if(body.epoch!==state.epoch||body.roundIndex!==state.round) fail('回合已更新，請重新整理',409);
          if(!body.rankings||typeof body.rankings!=='object') fail('請提供評定名次');
          if(!state.juryRankings) state.juryRankings=[{},{},{},{}];
          if(!state.jurySubmitted) state.jurySubmitted=[false,false,false,false];
          state.juryRankings[state.round]=body.rankings;
          state.jurySubmitted[state.round]=true;
          return;
        }
        if(action!=='vote') fail('無權執行此操作',403);
        if(user.group===5) fail('第 5 組為裁判組，不參與決策投票',403);
        if(state.phase!=='voting') fail('目前未開放投票',409);
        if(body.epoch!==state.epoch||body.roundIndex!==state.round) fail('回合已更新，請重新整理',409);
        if(state.groups[user.group-1].representative!==user.id) fail('請由本組代表提交決策',403);
        if(!['A','B','C','D'].includes(body.choice)) fail('請選擇方案');
        let choice=body.choice;
        if(state.round===3) {
          if(!Array.isArray(body.consensus)||body.consensus.length!==3||body.consensus.some(v=>typeof v!=='boolean')) fail('請完成三方表態');
          if(body.consensus.includes(false)) choice='X';
        }
        state.votes[state.round][user.group]={choice,proposal:body.choice,submittedBy:user.id,...(state.round===3?{consensus:body.consensus}:{})};return;
      }
      if(action==='start') {
        if(!['waiting','ready'].includes(state.phase)) fail('本回合已開始',409);
        state.phase='voting';state.deadline=Date.now()+rounds[state.round].seconds*1000;state.remaining=null;
      } else if(action==='timer') {
        if(state.phase!=='voting') fail('目前不是研討階段',409);
        if(state.deadline){state.remaining=Math.max(0,state.deadline-Date.now());state.deadline=null;}
        else{state.deadline=Date.now()+(state.remaining??rounds[state.round].seconds*1000);state.remaining=null;}
      } else if(action==='reveal') {
        if(state.phase!=='voting') fail('本回合尚未開始或已揭曉',409);
        const decisionSubmitted=Object.keys(state.votes[state.round]).filter(id=>Number(id)<=4).length;
        if(decisionSubmitted<4 && body.confirmIncomplete!==true) fail('仍有決策組別未提交，請確認後再揭曉',409);
        for(const group of state.groups){
          if(group.id===5) continue;
          const vote=state.votes[state.round][group.id];
          const result=outcome(state.round,vote);
          if(result){
            const before=group.anger ?? group.cq ?? 25;
            const delta=result.angerDelta ?? (result.cq ? -result.cq : 25);
            const after=Math.min(100,Math.max(0,before+delta));
            group.anger=after;
            group.cq=after;
            state.results[state.round][group.id]={...result,angerBefore:before,angerAfter:after,actualDelta:after-before,cqBefore:before,cqAfter:after,juryRank:state.juryRankings?.[state.round]?.[group.id]||null};
          }
        }
        state.phase='revealed';state.deadline=null;state.remaining=null;
      } else if(action==='next') {
        if(state.phase!=='revealed') fail('請先揭曉本回合',409);
        if(state.round===3) state.phase='finished';else{state.round++;state.phase='ready';}
      } else if(action==='representative') {
        const member=Object.values(state.participants).find(p=>p.id===body.memberId&&p.expires>Date.now());
        if(!member) fail('找不到此成員');state.groups[member.group-1].representative=member.id;
      } else if(action==='reset') {
        if(body.confirm!=='RESET') fail('請確認重設');
        const fresh=initialState();fresh.hosts=state.hosts;fresh.revision=state.revision;Object.assign(state,fresh);
      } else fail('未知操作',404);
    });
    res.end(JSON.stringify({ok:true}));
  } catch(error) { res.statusCode=error.status || 503;res.end(JSON.stringify({error:error.status?error.message:'連線暫時中斷，請稍後重試；若持續發生，請檢查伺服器設定。'}));if(!error.status) console.error(error.message); }
}
