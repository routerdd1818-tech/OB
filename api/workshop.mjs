import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readState, mutate, initialState } from '../lib/store.mjs';
import { rounds, publicRound, outcome, computeCascade } from '../lib/rounds.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (message, status=400) => { throw Object.assign(new Error(message),{status}); };
const SECRET = process.env.SESSION_SECRET || 'cq-dialogue-lab-secret-key-2026';

function signMemberToken(member, epoch) {
  const payload = JSON.stringify({ id: member.id, name: member.name, group: member.group, expires: member.expires, epoch: epoch || member.epoch });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyMemberToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(b64).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (!data.id || !data.name || !data.group || !data.expires) return null;
    if (data.expires < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function cookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),x.slice(i+1)];})); }

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return cookies(req)['cq_member'];
}

function session(req,state,role) {
  if(role==='host') return { host:true };
  const token = extractToken(req);
  if (!token) fail('請重新填寫姓名與組別',401);

  // 1. Verify signed HMAC token (survives cold starts & serverless container switching)
  const verified = verifyMemberToken(token);
  if (verified) {
    if (verified.epoch && verified.epoch !== state.epoch) {
      fail('課堂已重設，請重新填寫姓名與組別',401);
    }
    const key = hash(token);
    const existing = state.participants[key] || Object.values(state.participants).find(p => p.id === verified.id && p.expires > Date.now());
    if (!existing) {
      // Auto-heal session in state
      state.participants[key] = verified;
      const target = state.groups[verified.group - 1];
      if (target && !target.representative) target.representative = verified.id;
      return verified;
    }
    return existing;
  }

  // 2. Fallback to hash lookup
  const found = state.participants[hash(token)];
  if (!found || found.expires < Date.now()) fail('請重新填寫姓名與組別',401);
  return found;
}
function setCookie(res,role,token) { res.setHeader('Set-Cookie',`cq_${role}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.VERCEL?'; Secure':''}`); }
function shared(state,options) { return { epoch:state.epoch, revision:state.revision, roundIndex:state.round, phase:state.phase, deadline:state.deadline, remaining:state.remaining, serverTime:Date.now(), round:publicRound(state.round,options) }; }
function memberView(state,member) {
  const group=state.groups[member.group-1];
  const isJury=(member.group===5);
  const revealed=['revealed','finished'].includes(state.phase);
  const cqVal = group.cq ?? 100;
  const jurySubmitted = state.jurySubmitted ? Boolean(state.jurySubmitted[state.round]) : false;
  const rk = state.juryRankings ? (state.juryRankings[state.round] || {}) : {};
  const jOrders = state.juryOrders ? (state.juryOrders[state.round] || {}) : {};
  const jurySummary = jurySubmitted ? {
    empathyCount: Object.values(rk).filter(v => v === 'empathy').length,
    vetoCount: Object.values(rk).filter(v => v === 'veto').length
  } : null;
  const publicBoard = revealed ? state.groups.slice(0, 4).map(g => {
    const r = state.results[state.round]?.[g.id];
    const rkVal = state.juryRankings?.[state.round]?.[g.id] || null;
    const jOrder = state.juryOrders?.[state.round]?.[g.id] || null;
    return {
      id: g.id,
      cq: g.cq ?? 100,
      optionId: r?.id || null,
      optionTitle: r?.title || null,
      baseDelta: r?.baseDelta ?? r?.cq ?? 0,
      juryBonus: r?.juryBonus ?? 0,
      actualDelta: r?.actualDelta ?? 0,
      juryRank: rkVal,
      juryOrder: jOrder,
      juryVerdict: r?.juryVerdict || ''
    };
  }) : null;

  if(isJury) {
    const decisionGroups=state.groups.slice(0,4).map(g=>{
      const vote=state.votes[state.round][g.id];
      const opt=vote?rounds[state.round].options.find(o=>o.id===vote.choice):null;
      const gCq = g.cq ?? 100;
      const cascade = state.round >= 1 ? computeCascade(state.round, state.votes[state.round-1]?.[g.id]) : null;
      return { id:g.id, cq:gCq, submitted:Boolean(vote), choice:vote?vote.choice:null, proposal:vote?vote.proposal:null, title:opt?opt.title:null, text:opt?opt.text:null, blindspot:opt?opt.blindspot:null, consensus:vote?vote.consensus:null, cascade: cascade ? { type: cascade.type, badge: cascade.badge } : null };
    });
    return { ...shared(state,true), member:{name:member.name,id:member.id,group:member.group,isRepresentative:true,isJury:true}, group:{id:5,cq:100,isJury:true,representativeName:member.name}, decisionGroups, juryRankings:state.juryRankings?(state.juryRankings[state.round]||{}):{}, juryOrders:jOrders, jurySubmitted, jurySummary, pitch:state.pitch||null, publicBoard, optionsWithIntel:rounds[state.round].options, results:revealed?state.results[state.round]:null };
  }
  const cascade = state.round >= 1 ? computeCascade(state.round, state.votes[state.round-1]?.[group.id]) : null;
  return { ...shared(state,true), member:{name:member.name,id:member.id,group:member.group,isRepresentative:group.representative===member.id,isJury:false}, group:{id:group.id,cq:cqVal,isJury:false,representativeName:Object.values(state.participants).find(p=>p.id===group.representative)?.name || '尚未指定'}, vote:state.votes[state.round][group.id] || null, cascade, jurySubmitted, jurySummary, pitch:state.pitch||null, juryOrders:jOrders, publicBoard, juryRank:(revealed&&state.juryRankings)?(state.juryRankings[state.round]?.[group.id]||null):null, result:revealed?state.results[state.round][group.id] || null:null };
}
function hostView(state,req) {
  const revealed=['revealed','finished'].includes(state.phase);
  const votes=state.votes[state.round];
  const decisionVotes=Object.keys(votes).filter(id=>Number(id)<=4);
  const jurySubmitted=state.jurySubmitted?Boolean(state.jurySubmitted[state.round]):false;
  const juryRankings=state.juryRankings?state.juryRankings[state.round]:{};
  const jurySummary=jurySubmitted ? {
    empathyCount: Object.values(juryRankings).filter(v => v === 'empathy').length,
    vetoCount: Object.values(juryRankings).filter(v => v === 'veto').length
  } : null;
  const result= { ...shared(state,false), completed:decisionVotes.length, decisionTotal:4, jurySubmitted, jurySummary, juryRankings, juryOrders:state.juryOrders?(state.juryOrders[state.round]||{}):{}, pitch:state.pitch||null, groups:state.groups.map(g=>{
    const gCq = g.cq ?? 100;
    const cascade = (g.id<=4 && state.round>=1) ? computeCascade(state.round, state.votes[state.round-1]?.[g.id]) : null;
    return { ...g, cq:gCq, cascade: cascade ? { type: cascade.type, badge: cascade.badge, title: cascade.title } : null, count:Object.values(state.participants).filter(p=>p.group===g.id && p.expires>Date.now()).length, submitted:g.id===5?jurySubmitted:Boolean(votes[g.id]), members:Object.values(state.participants).filter(p=>p.group===g.id && p.expires>Date.now()).map(({id,name})=>({id,name}))};
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
      res.end(JSON.stringify({ok:true}));return;
    }
    if(action==='join') {
      const name=typeof body.name==='string'?body.name.trim():'';const group=Number(body.group);
      if(!name||name.length>30||!Number.isInteger(group)||group<1||group>5) fail('請填寫 1–30 字姓名並選擇組別');
      const memberId=randomBytes(12).toString('hex');
      let member={id:memberId,name,group,expires:Date.now()+43200000};
      let token='';
      await mutate(state=>{
        const old=extractToken(req);
        const prior=old && (verifyMemberToken(old) || state.participants[hash(old)]);
        if(prior && prior.expires>Date.now() && (prior.group!==group || prior.name!==name)) {
          if(!body.allowSwitch) fail('已加入課堂，不能切換至其他組別',409);
        }
        member.epoch=state.epoch;
        token=signMemberToken(member,state.epoch);
        state.participants[hash(token)]=member;
        const target=state.groups[group-1];
        if(!Object.values(state.participants).some(p=>p.id===target.representative&&p.expires>Date.now())) target.representative=member.id;
      });setCookie(res,'member',token);res.end(JSON.stringify({ok:true,token,member}));return;
    }
    if(action==='switch-group') {
      const group=Number(body.group);
      const name=typeof body.name==='string'&&body.name.trim()?body.name.trim():'';
      if(!Number.isInteger(group)||group<1||group>5) fail('請選擇 1–5 組');
      let member=null;
      let token='';
      await mutate(state=>{
        const user=session(req,state,role);
        const oldGroup=user.group;
        const oldId=user.id;
        user.group=group;
        if(name) user.name=name;
        const oldTarget=state.groups[oldGroup-1];
        if(oldTarget && oldTarget.representative===oldId){
          const nextRep=Object.values(state.participants).find(p=>p.group===oldGroup&&p.id!==oldId&&p.expires>Date.now());
          oldTarget.representative=nextRep?nextRep.id:null;
        }
        const newTarget=state.groups[group-1];
        if(newTarget && !newTarget.representative){
          newTarget.representative=oldId;
        }
        token=signMemberToken(user,state.epoch);
        state.participants[hash(token)]=user;
        member=user;
      });
      setCookie(res,'member',token);
      res.end(JSON.stringify({ok:true,token,member}));
      return;
    }
    await mutate(state=>{
      const user=session(req,state,role);
      if(role==='member') {
        if(action==='claim-rep') {
          state.groups[user.group-1].representative=user.id;
          return;
        }
        if(action==='jury-rank') {
          if(user.group!==5) fail('只有第 5 組（裁判組）可進行評定裁決',403);
          if(!['voting','ready','waiting'].includes(state.phase)) fail('目前非評定階段',409);
          if(body.roundIndex!==state.round) fail('回合已更新，請重新整理',409);
          if(!body.rankings||typeof body.rankings!=='object') fail('請提供評定名次');
          const vals = Object.values(body.rankings);
          if(vals.filter(v=>v==='empathy').length > 2) fail('「同理心加成卡 (+10 CQ)」每回合最多只能發放 2 張');
          if(vals.filter(v=>v==='veto').length > 1) fail('「文化踩雷否決卡 (-15 CQ)」每回合最多只能發放 1 張');
          if(!state.juryRankings) state.juryRankings=[{},{},{},{}];
          if(!state.jurySubmitted) state.jurySubmitted=[false,false,false,false];
          state.juryRankings[state.round]=body.rankings;
          if(body.orders && typeof body.orders==='object') {
            if(!state.juryOrders) state.juryOrders=[{},{},{},{}];
            state.juryOrders[state.round]=body.orders;
          }
          state.jurySubmitted[state.round]=true;
          return;
        }
        if(action!=='vote') fail('無權執行此操作',403);
        if(user.group===5) fail('第 5 組為裁判組，不參與決策投票',403);
        if(!['voting','ready','waiting'].includes(state.phase)) fail('目前未開放投票',409);
        if(body.roundIndex!==state.round) fail('回合已更新，請重新整理',409);
        const targetGroup = state.groups[user.group-1];
        if(!targetGroup.representative) targetGroup.representative = user.id;
        if(targetGroup.representative!==user.id) fail('請由本組代表提交決策',403);
        if(!['A','B','C','D'].includes(body.choice)) fail('請選擇方案');
        let choice=body.choice;
        if(state.round===3) {
          if(!Array.isArray(body.consensus)||body.consensus.length!==3||body.consensus.some(v=>typeof v!=='boolean')) fail('請完成三方表態');
          if(body.consensus.includes(false)) choice='X';
        }
        state.votes[state.round][user.group]={choice,proposal:body.choice,submittedBy:user.id,...(state.round===3?{consensus:body.consensus}:{})};
        const allFourSubmitted = [1, 2, 3, 4].every(id => Boolean(state.votes[state.round]?.[id]));
        if (allFourSubmitted) {
          state.pitch = {
            group: 'all',
            deadline: Date.now() + 30000,
            seconds: 30,
            startedAt: Date.now()
          };
        }
        return;
      }
      if(action==='start') {
        if(!['waiting','ready','voting'].includes(state.phase)) fail('本回合已揭曉或已結束',409);
        state.phase='voting';state.deadline=Date.now()+rounds[state.round].seconds*1000;state.remaining=null;
        state.pitch = null;
      } else if(action==='timer') {
        if(state.phase!=='voting') fail('目前不是研討階段',409);
        if(state.deadline){state.remaining=Math.max(0,state.deadline-Date.now());state.deadline=null;}
        else{state.deadline=Date.now()+(state.remaining??rounds[state.round].seconds*1000);state.remaining=null;}
      } else if(action==='pitch') {
        if(body.group === 'stop') {
          state.pitch = null;
        } else {
          const sec = Number(body.seconds) || 30;
          state.pitch = {
            group: body.group || 'all',
            deadline: Date.now() + sec * 1000,
            seconds: sec,
            startedAt: Date.now()
          };
        }
      } else if(action==='reveal') {
        if(state.phase!=='voting') fail('本回合尚未開始或已揭曉',409);
        state.pitch = null;
        const decisionSubmitted=Object.keys(state.votes[state.round]).filter(id=>Number(id)<=4).length;
        if(decisionSubmitted<4 && body.confirmIncomplete!==true) fail('仍有決策組別未提交，請確認後再揭曉',409);
        for(const group of state.groups){
          if(group.id===5) continue;
          const vote=state.votes[state.round][group.id];
          const result=outcome(state.round,vote);
          if(result){
            const before=group.cq ?? 100;
            const rank=state.juryRankings?.[state.round]?.[group.id];
            const baseDelta=result.cq ?? 0;
            let juryBonus=0;
            let juryVerdict='';
            if(rank==='empathy') {
              juryBonus=10;
              juryVerdict='裁判頒發：同理心加成卡 (+10 CQ)';
            } else if(rank==='veto') {
              juryBonus=-15;
              juryVerdict='裁判舉牌：文化踩雷否決卡 (-15 CQ)';
            } else if(rank==='neutral') {
              juryBonus=0;
              juryVerdict='裁判評定：中立觀察 (0 CQ)';
            } else if(rank!==undefined && rank!==null && rank!=='') {
              if(state.round===3) {
                juryVerdict = rank==='tier1'?'卓越雙贏 (Tier 1)':rank==='tier2'?'局部妥協 (Tier 2)':'嚴重破局 (Tier 3)';
              } else {
                juryVerdict = `第 5 組回饋：並列第 ${rank} 名`;
              }
            }
            const totalDelta=baseDelta+juryBonus;
            const after=Math.min(100,Math.max(0,before+totalDelta));
            group.cq=after;

            state.results[state.round][group.id]={
              ...result,
              cqBefore:before,
              cqAfter:after,
              baseDelta,
              juryBonus,
              actualDelta:after-before,
              juryRank:rank||null,
              juryVerdict
            };
          }
        }
        state.phase='revealed';state.deadline=null;state.remaining=null;
      } else if(action==='next') {
        if(state.phase!=='revealed') fail('請先揭曉本回合',409);
        state.pitch = null;
        if(state.round===3) state.phase='finished';else{state.round++;state.phase='ready';}
      } else if(action==='representative') {
        const member=Object.values(state.participants).find(p=>p.id===body.memberId&&p.expires>Date.now());
        if(!member) fail('找不到此成員');state.groups[member.group-1].representative=member.id;
      } else if(action==='reset') {
        if(body.confirm!=='RESET') fail('請確認重設');
        const fresh=initialState('cq-reset-'+Date.now());fresh.hosts=state.hosts;fresh.revision=state.revision;Object.assign(state,fresh);
      } else fail('未知操作',404);
    });
    res.end(JSON.stringify({ok:true}));
  } catch(error) { res.statusCode=error.status || 503;res.end(JSON.stringify({error:error.status?error.message:'連線暫時中斷，請稍後重試；若持續發生，請檢查伺服器設定。'}));if(!error.status) console.error(error.message); }
}
