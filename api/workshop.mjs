import { randomBytes, createHash, createHmac } from 'node:crypto';
import { readState, mutate, initialState } from '../lib/store.mjs';
import { rounds, publicRound, outcome, computeCascade } from '../lib/rounds.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
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

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .filter(x => x.includes('='))
      .map(x => {
        const i = x.indexOf('=');
        return [x.slice(0, i).trim(), x.slice(i + 1)];
      })
  );
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return cookies(req)['cq_member'];
}

function session(req, state, role) {
  if (role === 'host') return { host: true };
  const token = extractToken(req);
  if (!token) fail('請重新填寫姓名與組別', 401);

  const verified = verifyMemberToken(token);
  if (verified) {
    if (verified.epoch && verified.epoch !== state.epoch) {
      fail('課堂已重設，請重新填寫姓名與組別', 401);
    }
    const key = hash(token);
    const existing = state.participants[key] || Object.values(state.participants).find(p => p.id === verified.id && p.expires > Date.now());
    if (!existing) {
      state.participants[key] = verified;
      const target = state.groups[verified.group - 1];
      if (target && !target.representative) target.representative = verified.id;
      return verified;
    }
    return existing;
  }

  const found = state.participants[hash(token)];
  if (!found || found.expires < Date.now()) fail('請重新填寫姓名與組別', 401);
  return found;
}

function setCookie(res, role, token) {
  res.setHeader(
    'Set-Cookie',
    `cq_${role}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.VERCEL ? '; Secure' : ''}`
  );
}

export function computeNavigator(state, roundIdx = 0) {
  const roundPersuasion = state.persuasion?.[roundIdx] || {};
  const pointsMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const votersMap = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };

  let totalAllocated = 0;
  for (const [fromGidStr, alloc] of Object.entries(roundPersuasion)) {
    const fromGid = Number(fromGidStr);
    if (!alloc || typeof alloc !== 'object') continue;
    for (const [toGidStr, ptsRaw] of Object.entries(alloc)) {
      const toGid = Number(toGidStr);
      const pts = Number(ptsRaw) || 0;
      if (toGid >= 1 && toGid <= 5 && pts > 0) {
        pointsMap[toGid] = (pointsMap[toGid] || 0) + pts;
        votersMap[toGid].add(fromGid);
        totalAllocated += pts;
      }
    }
  }

  const candidates = [1, 2, 3, 4, 5].map(id => {
    const totalPoints = pointsMap[id] || 0;
    const voterCount = votersMap[id]?.size || 0;
    const votedAt = state.votes?.[roundIdx]?.[id]?.votedAt || Infinity;
    return { id, totalPoints, voterCount, votedAt };
  });

  candidates.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.voterCount !== a.voterCount) return b.voterCount - a.voterCount;
    if (a.votedAt !== b.votedAt) return a.votedAt - b.votedAt;
    return a.id - b.id;
  });

  const chiefNavigator = totalAllocated > 0 ? candidates[0].id : null;
  const persuasionBoard = candidates.map((item, idx) => ({
    id: item.id,
    totalPoints: item.totalPoints,
    voterCount: item.voterCount,
    rank: idx + 1,
    isNavigator: item.id === chiefNavigator
  }));

  return { chiefNavigator, persuasionBoard, totalAllocated };
}

export function calcRoundSeconds(state, roundIdx = 0) {
  let roundSeconds = rounds[roundIdx]?.seconds || (roundIdx === 3 ? 60 : 180);
  if (roundIdx === 1) {
    if (state.worldState?.r1 === 'bad') roundSeconds = Math.max(30, roundSeconds - 30);
  } else if (roundIdx === 2) {
    if (state.worldState?.r2 === 'bad') roundSeconds = Math.max(30, roundSeconds - 30);
  } else if (roundIdx === 3) {
    if (state.worldState?.r3 === 'bad') {
      roundSeconds = 45;
    } else if (state.worldState?.r3 === 'good') {
      const goodCount = [state.worldState?.r1, state.worldState?.r2, state.worldState?.r3].filter(s => s === 'good').length;
      roundSeconds = goodCount >= 2 ? 75 : 60;
    } else {
      roundSeconds = 60;
    }
  }
  return roundSeconds;
}

function shared(state, options) {
  return {
    epoch: state.epoch,
    revision: state.revision,
    roundIndex: state.round,
    phase: state.phase,
    deadline: state.deadline,
    remaining: state.remaining,
    serverTime: Date.now(),
    round: publicRound(state.round, options, state.worldState)
  };
}

function memberView(state, member) {
  const group = state.groups[member.group - 1];
  const revealed = ['revealed', 'finished'].includes(state.phase);
  const cqVal = group.cq ?? 0;
  const navInfo = computeNavigator(state, state.round);
  const chiefNavigator = navInfo.chiefNavigator;
  const cascade = state.round >= 1 ? computeCascade(state.round, state.worldState) : null;
  const isChief = member.group === chiefNavigator;

  const hiddenIntel = (isChief || revealed) ? rounds[state.round].hiddenIntel : null;
  const myPersuasion = state.persuasion?.[state.round]?.[member.group] || {};
  const finalDecision = (isChief || revealed) ? (state.finalDecisions?.[state.round] || null) : null;
  const hasFinalDecision = Boolean(state.finalDecisions?.[state.round]);

  const publicBoard = revealed ? state.groups.map(g => {
    const r = state.results[state.round]?.[g.id];
    return {
      id: g.id,
      cq: g.cq ?? 0,
      optionId: r?.id || null,
      optionTitle: r?.title || null,
      baseDelta: r?.baseDelta ?? 0,
      rescueBonus: r?.rescueBonus ?? 0,
      synergyBonus: r?.synergyBonus ?? 0,
      actualDelta: r?.actualDelta ?? 0,
      peerPersuasionPts: r?.peerPersuasionPts ?? 0,
      isLiteratureOptimal: r?.isLiteratureOptimal ?? false,
      isKingFailed: r?.isKingFailed ?? false,
      rank: r?.rank ?? 1,
      isCultureKing: r?.isCultureKing ?? false,
      isNavigator: g.id === chiefNavigator
    };
  }).sort((a, b) => (a.rank ?? 1) - (b.rank ?? 1)) : null;

  // 若組內尚無有效代表，自動將當前第一位讀取的組員設為代表（不需前端重連）
  const activeRep = Object.values(state.participants).find(p => p.id === group.representative && p.expires > Date.now());
  const isRep = activeRep ? group.representative === member.id : true;

  return {
    ...shared(state, true),
    member: {
      name: member.name,
      id: member.id,
      group: member.group,
      isRepresentative: isRep,
      isJury: false,
      isNavigator: isChief
    },
    group: {
      id: group.id,
      cq: cqVal,
      isJury: false,
      representativeName: activeRep?.name || member.name
    },
    vote: state.votes[state.round]?.[group.id] || null,
    cascade,
    worldState: state.worldState || { r1: 'idle', r2: 'idle', r3: 'idle', r4: 'idle' },
    chiefNavigator,
    persuasionBoard: navInfo.persuasionBoard,
    myPersuasion,
    hiddenIntel,
    hasFinalDecision,
    finalDecision,
    pitch: state.pitch || null,
    publicBoard,
    persuasionKingResult: state.persuasionKingResult || null,
    result: revealed ? (state.results[state.round]?.[group.id] || null) : null,
    ...(revealed ? { results: state.results[state.round] } : {})
  };
}

function hostView(state, req) {
  const revealed = ['revealed', 'finished'].includes(state.phase);
  const votes = state.votes[state.round] || {};
  const completed = Object.keys(votes).filter(id => Number(id) >= 1 && Number(id) <= 5).length;
  const navInfo = computeNavigator(state, state.round);
  const chiefNavigator = navInfo.chiefNavigator;
  const cascade = state.round >= 1 ? computeCascade(state.round, state.worldState) : null;
  const hasFinalDecision = Boolean(state.finalDecisions?.[state.round]);

  const groups = state.groups.map(g => {
    const gCq = g.cq ?? 0;
    return {
      ...g,
      cq: gCq,
      cascade: cascade ? { type: cascade.type, badge: cascade.badge, title: cascade.title } : null,
      count: Object.values(state.participants).filter(p => p.group === g.id && p.expires > Date.now()).length,
      submitted: Boolean(votes[g.id]),
      isNavigator: g.id === chiefNavigator,
      members: Object.values(state.participants).filter(p => p.group === g.id && p.expires > Date.now()).map(({ id, name }) => ({ id, name }))
    };
  });

  const result = {
    ...shared(state, false),
    completed,
    decisionTotal: 5,
    chiefNavigator,
    hasFinalDecision,
    persuasionBoard: navInfo.persuasionBoard,
    worldState: state.worldState || { r1: 'idle', r2: 'idle', r3: 'idle', r4: 'idle' },
    pitch: state.pitch || null,
    groups,
    persuasionKingResult: state.persuasionKingResult || null,
    joinUrl: process.env.PUBLIC_URL ? new URL('/', process.env.PUBLIC_URL).href : `${process.env.VERCEL ? 'https' : 'http'}://${req.headers.host}/`
  };

  if (revealed) {
    result.results = state.results[state.round];
    result.pins = state.groups.map(g => ({
      id: g.id,
      pinX: votes[g.id]?.pinX ?? null,
      pinY: votes[g.id]?.pinY ?? null
    }));
    result.finalDecision = state.finalDecisions?.[state.round] || null;
    result.hiddenIntel = rounds[state.round].hiddenIntel;
    result.distribution = [...rounds[state.round].options, ...(state.round === 3 ? [rounds[3].breakdown] : [])].map(o => ({
      id: o.id,
      title: o.title,
      count: Object.entries(votes).filter(([gid, v]) => Number(gid) <= 5 && v.choice === o.id).length,
      result: outcome(state.round, { choice: o.id })
    }));
  }

  return result;
}

async function bodyOf(req) {
  if (req.body) {
    const value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(value).length > 8000) fail('資料過大', 413);
    return value;
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8000) fail('資料過大', 413);
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    fail('資料格式錯誤');
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  try {
    if (!['GET', 'POST'].includes(req.method)) fail('不支援此操作', 405);
    if (req.method === 'POST') {
      if (!req.headers['content-type']?.includes('application/json')) fail('請使用 JSON', 415);
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail('來源不符', 403);
    }
    const url = new URL(req.url, 'http://localhost');
    const action = url.searchParams.get('action') || 'state';
    const role = url.searchParams.get('role') === 'host' ? 'host' : 'member';

    const syncRoundHeader = req.headers['x-sync-round'] || url.searchParams.get('syncRound');
    const syncEpochHeader = req.headers['x-sync-epoch'] || url.searchParams.get('syncEpoch');
    const clientSyncRound = Number(syncRoundHeader);

    if (req.method === 'GET') {
      let state = await readState();

      // 【Serverless 跨實例自動前向同步】若此冷啟動 Lambda 節點落後於客戶端已確認的世代或回合，自動對齊
      const needsEpochSync = Boolean(syncEpochHeader && syncEpochHeader !== state.epoch && state.epoch === 'cq-room-v1' && syncEpochHeader.startsWith('cq-reset-'));
      const needsRoundSync = Boolean(Number.isInteger(clientSyncRound) && clientSyncRound > state.round && clientSyncRound <= 3 && (!syncEpochHeader || syncEpochHeader === state.epoch));
      if (needsEpochSync || needsRoundSync) {
        await mutate(s => {
          if (needsEpochSync) {
            s.epoch = syncEpochHeader;
          }
          if (needsRoundSync) {
            s.round = clientSyncRound;
            if (s.phase === 'ready' || s.phase === 'waiting' || s.phase === 'revealed') {
              s.phase = 'voting';
              s.deadline = Date.now() + calcRoundSeconds(s, s.round) * 1000;
            }
          }
        });
        state = await readState();
      }

      let user = null;
      try {
        user = session(req, state, role);
      } catch (err) {
        if (role === 'member' && !extractToken(req)) {
          res.end(JSON.stringify({
            ...shared(state, false),
            member: null,
            group: null,
            chiefNavigator: null,
            pitch: state.pitch || null,
            worldState: state.worldState || { r1: 'idle', r2: 'idle', r3: 'idle', r4: 'idle' }
          }));
          return;
        }
        throw err;
      }
      res.end(JSON.stringify(role === 'host' ? hostView(state, req) : memberView(state, user)));
      return;
    }

    const body = await bodyOf(req);
    if (action === 'login') {
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (action === 'join') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const group = Number(body.group);
      if (!name || name.length > 30 || !Number.isInteger(group) || group < 1 || group > 5) {
        fail('請填寫 1–30 字姓名並選擇組別');
      }
      const old = extractToken(req);
      const verifiedOld = old ? verifyMemberToken(old) : null;
      const memberId = verifiedOld?.id || randomBytes(12).toString('hex');
      let member = { id: memberId, name, group, expires: Date.now() + 43200000 };
      let token = '';
      await mutate(state => {
        // 防回合倒退：若前端已知在更高回合，防止冷啟動節點的舊 round 覆蓋新回合
        if (typeof body.clientRound === 'number' && body.clientRound > state.round && body.clientRound <= 3) {
          state.round = body.clientRound;
        }
        const prior = (verifiedOld && verifiedOld.epoch === state.epoch) ? verifiedOld : (old && state.participants[hash(old)]);
        if (prior && prior.expires > Date.now() && (prior.group !== group || prior.name !== name)) {
          if (!body.allowSwitch) fail('已加入課堂，不能切換至其他組別', 409);
        }
        member.epoch = state.epoch;
        token = signMemberToken(member, state.epoch);
        state.participants[hash(token)] = member;
        const target = state.groups[group - 1];
        if (!Object.values(state.participants).some(p => p.id === target.representative && p.expires > Date.now())) {
          target.representative = member.id;
        }
      });
      setCookie(res, 'member', token);
      res.end(JSON.stringify({ ok: true, token, member }));
      return;
    }
    if (action === 'switch-group') {
      const group = Number(body.group);
      const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : '';
      if (!Number.isInteger(group) || group < 1 || group > 5) fail('請選擇 1–5 組');
      let member = null;
      let token = '';
      await mutate(state => {
        const user = session(req, state, role);
        const oldGroup = user.group;
        const oldId = user.id;
        user.group = group;
        if (name) user.name = name;
        const oldTarget = state.groups[oldGroup - 1];
        if (oldTarget && oldTarget.representative === oldId) {
          const nextRep = Object.values(state.participants).find(p => p.group === oldGroup && p.id !== oldId && p.expires > Date.now());
          oldTarget.representative = nextRep ? nextRep.id : null;
        }
        const newTarget = state.groups[group - 1];
        if (newTarget && !newTarget.representative) {
          newTarget.representative = oldId;
        }
        token = signMemberToken(user, state.epoch);
        state.participants[hash(token)] = user;
        member = user;
      });
      setCookie(res, 'member', token);
      res.end(JSON.stringify({ ok: true, token, member }));
      return;
    }

    let finalState = null;
    await mutate(state => {
      finalState = state;
      const user = session(req, state, role);

      // 【關鍵防護】若此 Serverless 實例的 state.round 落後於前端傳來的 roundIndex / syncRound，自動對齊最新回合，防止閃退回第一回合
      if (action !== 'reset') {
        if (syncEpochHeader && syncEpochHeader.startsWith('cq-reset-') && state.epoch === 'cq-room-v1') {
          state.epoch = syncEpochHeader;
        }
        const targetRound = typeof body.roundIndex === 'number' ? body.roundIndex : (Number.isInteger(clientSyncRound) ? clientSyncRound : null);
        if (targetRound !== null && targetRound > state.round && targetRound <= 3) {
          state.round = targetRound;
          if (state.phase === 'revealed' || state.phase === 'ready' || state.phase === 'waiting') {
            state.phase = 'voting';
            state.deadline = Date.now() + calcRoundSeconds(state, targetRound) * 1000;
          }
        }
      }

      if (role === 'member') {
        if (action === 'claim-rep') {
          state.groups[user.group - 1].representative = user.id;
          return;
        }
        if (action === 'persuade') {
          if (body.roundIndex !== state.round) fail('回合已更新，請重新整理', 409);
          if (!['voting', 'ready', 'waiting'].includes(state.phase)) fail('目前非說服配點階段', 409);
          const targetGroup = state.groups[user.group - 1];
          if (!targetGroup.representative) targetGroup.representative = user.id;
          if (targetGroup.representative !== user.id) fail('請由本組代表提交說服配點', 403);
          if (!body.points || typeof body.points !== 'object') fail('請提供說服點數分配', 400);

          let sum = 0;
          const clean = {};
          for (const [gidStr, ptsRaw] of Object.entries(body.points)) {
            const gid = Number(gidStr);
            const pts = Number(ptsRaw);
            if (!Number.isInteger(gid) || gid < 1 || gid > 5) fail('目標組別無效', 400);
            if (!Number.isInteger(pts) || pts < 0) fail('分配點數必須為大於等於 0 的整數', 400);
            if (pts === 0) continue;
            if (gid === user.group) fail('不可將說服點數分配給本組', 400);
            if (pts > 2) fail('單一組別最多只能分配 2 點（請至少分給兩組）', 400);
            clean[gid] = pts;
            sum += pts;
          }
          if (sum > 3 || sum < 1) fail('說服點數總和必須在 1 至 3 點之間', 400);
          if (!state.persuasion) state.persuasion = [{}, {}, {}, {}];
          state.persuasion[state.round][user.group] = clean;
          return;
        }
        if (action === 'final-decision') {
          if (body.roundIndex !== state.round) fail('回合已更新，請重新整理', 409);
          if (!['voting', 'ready', 'waiting'].includes(state.phase)) fail('目前非拍板階段', 409);
          const navId = computeNavigator(state, state.round).chiefNavigator;
          if (user.group !== navId) fail('只有本回合首席領航者或講師可拍板最終方案', 403);
          const targetGroup = state.groups[user.group - 1];
          if (targetGroup.representative && targetGroup.representative !== user.id) {
            fail('請由領航組的本組代表按下拍板按鈕', 403);
          }
          if (!['A', 'B', 'C', 'D'].includes(body.choice)) fail('請選擇方案', 400);
          if (!state.finalDecisions) state.finalDecisions = [null, null, null, null];
          state.finalDecisions[state.round] = body.choice;
          return;
        }
        if (action === 'jury-rank') {
          if (!state.juryRankings) state.juryRankings = [{}, {}, {}, {}];
          if (!state.jurySubmitted) state.jurySubmitted = [false, false, false, false];
          state.juryRankings[state.round] = body.rankings || {};
          state.jurySubmitted[state.round] = true;
          return;
        }
        if (action !== 'vote') fail('無權執行此操作', 403);
        if (!['voting', 'ready', 'waiting'].includes(state.phase)) fail('目前未開放投票', 409);
        if (body.roundIndex !== state.round) fail('回合已更新，請重新整理', 409);
        const targetGroup = state.groups[user.group - 1];
        if (!targetGroup.representative) targetGroup.representative = user.id;
        if (targetGroup.representative !== user.id) fail('請由本組代表提交決策', 403);
        if (!['A', 'B', 'C', 'D'].includes(body.choice)) fail('請選擇方案');
        let choice = body.choice;
        if (state.round === 3) {
          if (!Array.isArray(body.consensus) || body.consensus.length !== 3 || body.consensus.some(v => typeof v !== 'boolean')) {
            fail('請完成三方表態');
          }
          if (body.consensus.includes(false)) choice = 'X';
        }
        state.votes[state.round][user.group] = {
          choice,
          proposal: body.choice,
          submittedBy: user.id,
          votedAt: Date.now(),
          ...(typeof body.pinX === 'number' && typeof body.pinY === 'number' ? { pinX: body.pinX, pinY: body.pinY } : {}),
          ...(state.round === 3 ? { consensus: body.consensus } : {})
        };

        const activeGroupIds = [...new Set(Object.values(state.participants).filter(p => p.expires > Date.now()).map(p => p.group))];
        const allSubmitted = (activeGroupIds.length >= 1 && activeGroupIds.every(id => Boolean(state.votes[state.round]?.[id]))) || [1, 2, 3, 4, 5].every(id => Boolean(state.votes[state.round]?.[id]));
        if (allSubmitted && !state.pitch) {
          state.pitch = {
            group: 'all',
            deadline: Date.now() + 60000,
            seconds: 60,
            startedAt: Date.now()
          };
        }
        return;
      }

      if (action === 'start') {
        if (!['waiting', 'ready', 'voting'].includes(state.phase)) fail('本回合已揭曉或已結束', 409);
        const roundSeconds = calcRoundSeconds(state, state.round);
        state.phase = 'voting';
        state.deadline = Date.now() + roundSeconds * 1000;
        state.remaining = null;
        state.pitch = null;
      } else if (action === 'timer') {
        if (state.phase !== 'voting') fail('目前不是研討階段', 409);
        if (state.deadline) {
          state.remaining = Math.max(0, state.deadline - Date.now());
          state.deadline = null;
        } else {
          const fallbackSec = (rounds[state.round].seconds ?? (state.round === 3 ? 60 : 180)) * 1000;
          state.deadline = Date.now() + (state.remaining ?? fallbackSec);
          state.remaining = null;
        }
      } else if (action === 'pitch') {
        if (body.group === 'stop') {
          state.pitch = null;
        } else {
          const sec = Number(body.seconds) || 60;
          state.pitch = {
            group: body.group || 'all',
            deadline: Date.now() + sec * 1000,
            seconds: sec,
            startedAt: Date.now()
          };
        }
      } else if (action === 'final-decision') {
        if (body.roundIndex !== state.round) fail('回合已更新，請重新整理', 409);
        if (!['voting', 'ready', 'waiting'].includes(state.phase)) fail('目前非拍板階段', 409);
        if (!['A', 'B', 'C', 'D'].includes(body.choice)) fail('請選擇方案', 400);
        if (!state.finalDecisions) state.finalDecisions = [null, null, null, null];
        state.finalDecisions[state.round] = body.choice;
      } else if (action === 'reveal') {
        if (state.phase !== 'voting') fail('本回合尚未開始或已揭曉', 409);
        state.pitch = null;
        const completedCount = Object.keys(state.votes[state.round] || {}).filter(id => Number(id) >= 1 && Number(id) <= 5).length;
        if (completedCount < 5 && body.confirmIncomplete !== true) {
          fail('仍有決策組別未提交初投，請確認後再揭曉', 409);
        }

        const navInfo = computeNavigator(state, state.round);
        const navId = navInfo.chiefNavigator;
        let finalChoice = state.finalDecisions?.[state.round];
        if (!finalChoice && navId) {
          finalChoice = state.votes[state.round]?.[navId]?.choice;
        }
        if (!finalChoice) {
          const counts = {};
          for (const gid of [1, 2, 3, 4, 5]) {
            const c = state.votes[state.round]?.[gid]?.choice;
            if (c && c !== 'X') counts[c] = (counts[c] || 0) + 1;
          }
          const topChoice = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
          finalChoice = topChoice || 'B';
        }
        if (!state.finalDecisions) state.finalDecisions = [null, null, null, null];
        state.finalDecisions[state.round] = finalChoice;

        const finalOutcome = outcome(state.round, { choice: finalChoice });
        const isBestFinal = (finalOutcome?.cq ?? 0) > 0;

        // 說服王初選判定
        const kingVote = state.votes[state.round]?.[navId];
        const kingOutcome = kingVote ? outcome(state.round, kingVote) : null;
        const isKingOptimal = kingOutcome ? ((kingOutcome.cq ?? 0) > 0) : false;
        const hasKing = Boolean(navId && kingVote);
        // 若說服王選到錯的答案，則增加全班負面效果
        const isKingFailed = hasKing ? !isKingOptimal : !isBestFinal;

        const rKey = 'r' + (state.round + 1);
        if (!state.worldState) state.worldState = { r1: 'idle', r2: 'idle', r3: 'idle', r4: 'idle' };
        state.worldState[rKey] = isKingFailed ? 'bad' : 'good';

        state.persuasionKingResult = {
          kingId: navId,
          hasKing,
          isKingOptimal,
          isKingFailed,
          isBestFinal,
          message: isKingFailed
            ? (hasKing
                ? `⚠️ 說服王（第 ${navId} 組）初選踩雷！帶偏全班決策，觸發全班負面連鎖（下一回合研討時間縮減 30 秒）！`
                : `⚠️ 全班最終決策踩雷！觸發全班連鎖負面衝擊（下一回合研討時間縮減 30 秒）！`)
            : (hasKing
                ? `🎉 說服王（第 ${navId} 組）初選精準命中文獻最佳實踐！引領全班邁向跨文化共贏！`
                : `🎉 全班最終決策命中最佳實踐！達成跨文化深度共識！`)
        };

        // 統計各組收到的說服點數
        const persuasionPointsMap = {};
        for (const item of navInfo.persuasionBoard) {
          persuasionPointsMap[item.id] = item.totalPoints || 0;
        }

        const TARGETS = [
          { x: 78, y: 82 },
          { x: 84, y: 18 },
          { x: 22, y: 24 },
          { x: 18, y: 85 }
        ];
        const FALLBACK_COORDS = {
          A: { x: 25, y: 75 },
          B: { x: 75, y: 75 },
          C: { x: 25, y: 25 },
          D: { x: 75, y: 25 }
        };
        const target = TARGETS[state.round] || { x: 50, y: 50 };

        for (const group of state.groups) {
          const vote = state.votes[state.round]?.[group.id];
          if (!vote) continue;
          const result = outcome(state.round, vote);
          if (result) {
            const before = group.cq ?? 0;
            const gx = typeof vote.pinX === 'number' ? vote.pinX : (FALLBACK_COORDS[vote.choice]?.x ?? 50);
            const gy = typeof vote.pinY === 'number' ? vote.pinY : (FALLBACK_COORDS[vote.choice]?.y ?? 50);
            const dist = Math.round(Math.hypot(gx - target.x, gy - target.y));
            // 計分從 0 開始，越靠近分數越高，越遠分數越低（滿分 100，每差 1 單位距離扣 1 分，最低 0 分）
            const roundScore = Math.max(0, Math.round(100 - dist));
            const peerPts = persuasionPointsMap[group.id] || 0;
            const persuasionScore = peerPts * 5;
            const totalDelta = roundScore;
            const after = before + totalDelta;
            group.cq = after;

            state.results[state.round][group.id] = {
              ...result,
              cqBefore: before,
              cqAfter: after,
              dist,
              pinX: gx,
              pinY: gy,
              roundScore,
              baseDelta: roundScore,
              rescueBonus: 0,
              synergyBonus: persuasionScore,
              actualDelta: totalDelta,
              peerPersuasionPts: peerPts,
              isLiteratureOptimal: roundScore >= 80,
              finalChoice,
              isBestFinal,
              isNavigator: group.id === navId,
              isKingFailed
            };
          }
        }

        // 依累計文化總分由高至低嚴格排序，產生「誰是文化王排行榜」
        const ranking = state.groups.slice().sort((a, b) => (b.cq ?? 0) - (a.cq ?? 0));
        for (let idx = 0; idx < ranking.length; idx++) {
          const gid = ranking[idx].id;
          if (state.results[state.round]?.[gid]) {
            state.results[state.round][gid].rank = idx + 1;
            state.results[state.round][gid].isCultureKing = (idx === 0);
          }
        }
        state.phase = 'revealed';
        state.deadline = null;
        state.remaining = null;
      } else if (action === 'next') {
        if (state.phase !== 'revealed' && !body?.force) fail('請先揭曉本回合', 409);
        state.pitch = null;
        if (state.round === 3) state.phase = 'finished';
        else {
          state.round++;
          if (body?.autoStart) {
            const roundSeconds = calcRoundSeconds(state, state.round);
            state.phase = 'voting';
            state.deadline = Date.now() + roundSeconds * 1000;
            state.remaining = null;
          } else {
            state.phase = 'ready';
          }
        }
      } else if (action === 'jump') {
        const target = Number(body.roundIndex);
        if (!Number.isInteger(target) || target < 0 || target > 3) fail('無效的回合', 400);
        state.round = target;
        state.pitch = null;
        state.remaining = null;
        if (body?.autoStart) {
          const roundSeconds = calcRoundSeconds(state, target);
          state.phase = 'voting';
          state.deadline = Date.now() + roundSeconds * 1000;
        } else {
          state.phase = 'ready';
          state.deadline = null;
        }
      } else if (action === 'representative') {
        const member = Object.values(state.participants).find(p => p.id === body.memberId && p.expires > Date.now());
        if (!member) fail('找不到此成員');
        state.groups[member.group - 1].representative = member.id;
      } else if (action === 'reset') {
        if (body.confirm !== 'RESET') fail('請確認重設');
        const fresh = initialState('cq-reset-' + Date.now());
        fresh.hosts = state.hosts;
        fresh.revision = state.revision;
        Object.assign(state, fresh);
      } else fail('未知操作', 404);
    });
    res.end(JSON.stringify({ ok: true, epoch: finalState?.epoch, revision: finalState?.revision, ...(role === 'host' && finalState ? hostView(finalState, req) : {}) }));
  } catch (error) {
    res.statusCode = error.status || 503;
    res.end(
      JSON.stringify({
        error: error.status ? error.message : '連線暫時中斷，請稍後重試；若持續發生，請檢查伺服器設定。'
      })
    );
    if (!error.status) console.error(error.message);
  }
}
