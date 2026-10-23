import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rounds, outcome, publicRound } from '../lib/rounds.mjs';

let server, directory, hostCookie, memberCookies = [], observerCookie;
const base = 'http://127.0.0.1:3107';

async function request(action = 'state', body, cookie = '', role = 'member') {
  const res = await fetch(`${base}/api/workshop?action=${action}&role=${role}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return {
    status: res.status,
    data: await res.json(),
    cookie: res.headers.get('set-cookie')?.split(';')[0]
  };
}
const host = (action, body) => request(action, body, hostCookie, 'host');

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cq-lab-test-'));
  server = spawn(process.execPath, ['server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: '3107',
      HOST_PASSWORD: 'test-password',
      LOCAL_STATE_FILE: join(directory, 'state.json'),
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
      VERCEL: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.stdout.once('data', resolve);
  });
  hostCookie = (await request('login', { password: 'test-password' }, '', 'host')).cookie;
});

after(async () => {
  server?.kill();
  await new Promise(resolve => server?.exitCode !== null ? resolve() : server.once('exit', resolve));
  await rm(directory, { recursive: true, force: true });
});

test('host allows direct access without password', async () => {
  assert.equal((await request('state', undefined, '', 'host')).status, 200);
  assert.equal((await request('login', {}, '', 'host')).status, 200);
});

test('anonymous participant gets public state with member: null', async () => {
  const { status, data } = await request('state', undefined, '');
  assert.equal(status, 200);
  assert.equal(data.member, null);
  assert.equal(data.group, null);
  assert.equal(data.roundIndex, 0);
  assert.ok(data.round);
});

test('five groups join independently; all 5 groups are decision groups', async () => {
  const joined = await Promise.all(
    Array.from({ length: 5 }, (_, i) => request('join', { name: `代表${i + 1}`, group: i + 1 }))
  );
  memberCookies = joined.map(r => r.cookie);
  assert.ok(joined.every(r => r.status === 200));

  observerCookie = (await request('join', { name: '同組成員', group: 1 })).cookie;

  for (let i = 0; i < 5; i++) {
    const { data } = await request('state', undefined, memberCookies[i]);
    assert.equal(data.member.group, i + 1);
    assert.equal(data.member.isRepresentative, true);
    assert.equal(data.member.isJury, false);
    assert.equal(data.group.cq, 0);
    assert.equal('groups' in data, false);
    assert.equal('count' in data.group, false);
    assert.equal('cq' in data.round.options[0], false);
    assert.equal('tension' in data.round.options[0], false);
    assert.equal(data.hiddenIntel, null); // Unrevealed & not navigator yet -> null
  }
  assert.equal((await request('join', { name: '切換', group: 2 }, memberCookies[0])).status, 409);
});

test('representatives only; participant role cannot trigger host actions', async () => {
  assert.equal((await request('reveal', {}, memberCookies[0])).status, 403);
  assert.equal((await host('start', {})).status, 200);
  const { data } = await request('state', undefined, observerCookie);
  assert.equal(data.member.isRepresentative, false);
  assert.equal((await request('vote', { choice: 'A', epoch: data.epoch, roundIndex: 0 }, observerCookie)).status, 403);
});

test('concurrent group votes stay isolated; all 5 groups can vote independently', async () => {
  const current = (await host()).data;
  // All 5 groups submit initial votes: G1:A, G2:B, G3:C, G4:D, G5:A
  const responses = await Promise.all(
    [0, 1, 2, 3, 4].map(i =>
      request('vote', { choice: ['A', 'B', 'C', 'D', 'A'][i], epoch: current.epoch, roundIndex: 0 }, memberCookies[i])
    )
  );
  assert.ok(responses.every(r => r.status === 200));

  for (let i = 0; i < 5; i++) {
    const { data } = await request('state', undefined, memberCookies[i]);
    assert.equal(data.vote.choice, ['A', 'B', 'C', 'D', 'A'][i]);
    assert.equal(data.result, null);
    assert.equal('results' in data, false);
    assert.equal('distribution' in data, false);
  }

  const { data: hData } = await host();
  assert.equal(hData.completed, 5);
  assert.equal(hData.decisionTotal, 5);
  assert.equal('options' in hData.round, false);
  assert.equal('results' in hData, false);
  assert.equal('votes' in hData, false);
  assert.equal(JSON.stringify(hData).includes('"choice"'), false);
});

test('persuasion points allocation validation, chief navigator computation, and hidden intel unlock', async () => {
  const current = (await host()).data;

  // 1. Cannot vote for self
  const selfVote = await request('persuade', { points: { 1: 2, 2: 1 }, roundIndex: 0 }, memberCookies[0]);
  assert.equal(selfVote.status, 400);

  // 2. Single target > 2 points forbidden
  const excessTarget = await request('persuade', { points: { 2: 3 }, roundIndex: 0 }, memberCookies[0]);
  assert.equal(excessTarget.status, 400);

  // 3. Total sum > 3 points forbidden
  const excessSum = await request('persuade', { points: { 2: 2, 3: 2 }, roundIndex: 0 }, memberCookies[0]);
  assert.equal(excessSum.status, 400);

  // 4. Valid allocations: make Group 2 chief navigator (2 points each from 4 groups = 8 points)
  // Group 1 votes for G2: 2, G3: 1
  assert.equal((await request('persuade', { points: { 2: 2, 3: 1 }, roundIndex: 0 }, memberCookies[0])).status, 200);
  // Group 3 votes for G2: 2, G4: 1
  assert.equal((await request('persuade', { points: { 2: 2, 4: 1 }, roundIndex: 0 }, memberCookies[2])).status, 200);
  // Group 4 votes for G2: 2, G5: 1
  assert.equal((await request('persuade', { points: { 2: 2, 5: 1 }, roundIndex: 0 }, memberCookies[3])).status, 200);
  // Group 5 votes for G2: 2, G1: 1
  assert.equal((await request('persuade', { points: { 2: 2, 1: 1 }, roundIndex: 0 }, memberCookies[4])).status, 200);

  // Group 2 receives 2 + 2 + 2 + 2 = 8 points
  const g2State = (await request('state', undefined, memberCookies[1])).data;
  assert.equal(g2State.chiefNavigator, 2);
  assert.equal(g2State.member.isNavigator, true);
  assert.ok(g2State.hiddenIntel, 'Group 2 must unlock hidden intel');
  assert.equal(g2State.hiddenIntel.title, '《第一回合極密情報：大 D 的力量》');

  // Other groups should NOT see hidden intel before reveal
  const g1State = (await request('state', undefined, memberCookies[0])).data;
  assert.equal(g1State.chiefNavigator, 2);
  assert.equal(g1State.member.isNavigator, false);
  assert.equal(g1State.hiddenIntel, null);

  // 5. Only Chief Navigator (Group 2) or Host can make final decision
  const nonNavFinal = await request('final-decision', { choice: 'B', roundIndex: 0 }, memberCookies[0]);
  assert.equal(nonNavFinal.status, 403);

  const navFinal = await request('final-decision', { choice: 'B', roundIndex: 0 }, memberCookies[1]);
  assert.equal(navFinal.status, 200);

  const g2Decided = (await request('state', undefined, memberCookies[1])).data;
  assert.equal(g2Decided.hasFinalDecision, true);
  assert.equal(g2Decided.finalDecision, 'B');
});

test('reveal settlement: optimal final decision triggers literature optimal, distance-based scoring from 0, and sets worldState to good', async () => {
  assert.equal((await host('reveal', {})).status, 200);
  const afterReveal = (await host()).data;

  // Round 1 initial votes distance scoring (starts from 0, closer = higher score):
  // Target: (78, 82)
  // G1: A -> fallback (25, 75). dist = 53. roundScore = 47. (cq: 0 + 47 = 47)
  assert.equal(afterReveal.results[1].baseDelta, 47);
  assert.equal(afterReveal.results[1].actualDelta, 47);
  assert.equal(afterReveal.groups[0].cq, 47);

  // G2: B -> fallback (75, 75). dist = 8. roundScore = 92. Chief Navigator / Culture King! (cq: 0 + 92 = 92)
  assert.equal(afterReveal.results[2].baseDelta, 92);
  assert.equal(afterReveal.results[2].actualDelta, 92);
  assert.equal(afterReveal.groups[1].cq, 92);
  assert.equal(afterReveal.results[2].rank, 1);
  assert.equal(afterReveal.results[2].isCultureKing, true);

  // G3: C -> fallback (25, 25). dist = 78. roundScore = 22. (cq: 0 + 22 = 22)
  assert.equal(afterReveal.results[3].baseDelta, 22);
  assert.equal(afterReveal.results[3].actualDelta, 22);
  assert.equal(afterReveal.groups[2].cq, 22);

  // G4: D -> fallback (75, 25). dist = 57. roundScore = 43. (cq: 0 + 43 = 43)
  assert.equal(afterReveal.results[4].baseDelta, 43);
  assert.equal(afterReveal.results[4].actualDelta, 43);
  assert.equal(afterReveal.groups[3].cq, 43);

  // World state after R1 optimal outcome
  assert.equal(afterReveal.worldState.r1, 'good');

  // Member views in revealed state should now see hiddenIntel unlocked for classroom debrief
  const g1Revealed = (await request('state', undefined, memberCookies[0])).data;
  assert.ok(g1Revealed.hiddenIntel, 'Hidden intel revealed to all after reveal');
  assert.equal(g1Revealed.hiddenIntel.title, '《第一回合極密情報：大 D 的力量》');
});

test('pause/resume uses shared server deadlines and incomplete reveal needs explicit confirmation', async () => {
  await host('next', {});
  await host('start', {});
  await host('timer', {});
  let state = (await host()).data;
  assert.equal(state.deadline, null);
  assert.ok(state.remaining > 0);
  await host('timer', {});
  state = (await host()).data;
  assert.ok(state.deadline > Date.now());
  assert.equal(state.remaining, null);

  // Only Group 1 votes, others not yet -> reveal requires confirmation
  await request('vote', { choice: 'C', epoch: state.epoch, roundIndex: 1 }, memberCookies[0]);
  assert.equal((await host('reveal', {})).status, 409);
  assert.equal((await host('reveal', { confirmIncomplete: true })).status, 200);

  state = (await host()).data;
  assert.equal(state.phase, 'revealed');
  await host('next', {});
});

test('bad outcome in round 2 causes full penalty, no rescue, and shared consequence time reduction (-30s)', async () => {
  await host('start', {});
  let state = (await host()).data;
  assert.equal(state.roundIndex, 2); // Round 3 (0-indexed 2)

  // Groups vote in Round 3 (optimal is B, bad is A: -25 CQ)
  for (let i = 0; i < 5; i++) {
    await request('vote', { choice: 'A', epoch: state.epoch, roundIndex: 2 }, memberCookies[i]);
  }
  // Allocate points to G1 as navigator (G5 votes G1: 2, G2: 1)
  await request('persuade', { points: { 1: 2, 2: 1 }, roundIndex: 2 }, memberCookies[4]);
  // G1 picks A (bad choice)
  await request('final-decision', { choice: 'A', roundIndex: 2 }, memberCookies[0]);

  // Reveal
  await host('reveal', {});
  const revealed = (await host()).data;
  assert.equal(revealed.worldState.r3, 'bad');
  // G1 chose A -> fallback (25, 75). dist = 51, roundScore = 49
  assert.equal(revealed.results[1].baseDelta, 49);
  assert.equal(revealed.results[1].actualDelta, 49);
  assert.equal(revealed.results[3].baseDelta, 49);
  assert.equal(revealed.results[3].actualDelta, 49);

  // Next round (Round 4, index 3) starts with penalty!
  await host('next', {});
  await host('start', {});
  const r4State = (await host()).data;
  assert.equal(r4State.roundIndex, 3);
  // All rounds have 180 seconds (3 minutes) discussion time!
  assert.ok(r4State.deadline - Date.now() <= 180000);
  assert.ok(r4State.deadline - Date.now() > 170000);
});

test('fourth round requires three actual decisions for consensus', async () => {
  const state = (await host()).data;
  // Round 4 optimal is B
  assert.equal((await request('vote', { choice: 'B', epoch: state.epoch, roundIndex: 3, consensus: [true, true] }, memberCookies[0])).status, 400);
  assert.equal((await request('vote', { choice: 'B', epoch: state.epoch, roundIndex: 3, consensus: [true, true, false] }, memberCookies[0])).status, 200);
  assert.equal((await request('vote', { choice: 'B', epoch: state.epoch, roundIndex: 3, consensus: [true, true, true] }, memberCookies[1])).status, 200);

  await host('reveal', { confirmIncomplete: true });
  const result = (await host()).data;
  assert.equal(result.results[1].id, 'X');
  assert.equal(result.results[1].tension, 100);
  assert.equal(result.results[2].tension, 32);
  assert.equal(result.results[2].reduction, 30);

  await host('next', {});
  assert.equal((await host()).data.phase, 'finished');
});

test('representative transfer and reset preserve only host access', async () => {
  const observer = (await request('state', undefined, observerCookie)).data;
  assert.equal((await host('representative', { memberId: observer.member.id })).status, 200);
  assert.equal((await request('state', undefined, observerCookie)).data.member.isRepresentative, true);
  assert.equal((await request('state', undefined, memberCookies[0])).data.member.isRepresentative, false);

  assert.equal((await host('reset', { confirm: 'RESET' })).status, 200);
  assert.equal((await request('state', undefined, memberCookies[0])).status, 401);
  const state = (await host()).data;
  assert.equal(state.phase, 'waiting');
  assert.ok(state.groups.every(g => g.cq === 0 && g.count === 0));
});

test('all tension values match the requested matrix; answers are not in static client code', async () => {
  // Tension matrix for 《全球綠能快遞》:
  // Round 1: baseline 78, [83, 60, 76, 80]
  // Round 2: baseline 72, [75, 50, 80, 87]
  // Round 3: baseline 68, [78, 43, 73, 86]
  // Round 4: baseline 62, [67, 32, 77, 82]
  const expected = [
    [83, 60, 76, 80],
    [75, 50, 80, 87],
    [78, 43, 73, 86],
    [67, 32, 77, 82]
  ];
  rounds.forEach((round, i) =>
    round.options.forEach((option, j) => {
      assert.equal(outcome(i, { choice: option.id }).tension, expected[i][j]);
      assert.equal(outcome(i, { choice: option.id }).reduction, round.baseline - expected[i][j]);
    })
  );
  const client = await readFile('public/participant.js', 'utf8');
  assert.equal(client.includes('Nemawashi'), false);
  assert.equal((await fetch(base + '/lib/rounds.mjs')).status, 404);
  assert.equal((await fetch(base + '/host')).status, 200);
});

test('cross-origin writes are rejected', async () => {
  const response = await fetch(base + '/api/workshop?action=join', {
    method: 'POST',
    headers: { origin: 'https://other.example', 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'x', group: 1 })
  });
  assert.equal(response.status, 403);
});

test('participants can switch groups freely via switch-group action', async () => {
  const user = await request('join', { name: '換組測試員', group: 1, allowSwitch: true });
  assert.equal(user.status, 200);
  assert.equal(user.data.member.group, 1);

  const switchRes = await request('switch-group', { name: '換組測試員', group: 4 }, user.cookie);
  assert.equal(switchRes.status, 200);
  assert.equal(switchRes.data.member.group, 4);

  const view = await request('state', undefined, switchRes.cookie || user.cookie);
  assert.equal(view.status, 200);
  assert.equal(view.data.member.group, 4);
});

test('branchingContext dynamically switches in publicRound based on worldState', async () => {
  for (let idx = 1; idx <= 3; idx++) {
    const wsGood = { r1: 'good', r2: 'good', r3: 'good' };
    const prGood = publicRound(idx, false, wsGood);
    assert.equal(prGood.context, rounds[idx].branchingContext.good);

    const wsBad = { r1: 'bad', r2: 'bad', r3: 'bad' };
    const prBad = publicRound(idx, false, wsBad);
    assert.equal(prBad.context, rounds[idx].branchingContext.bad);

    // Make sure hiddenIntel is not in publicRound
    assert.equal('hiddenIntel' in prGood, false);
    assert.ok(prGood.miniLabel);
    assert.ok(prGood.speaker);
  }
});

test('host can jump directly to any round and force next without reveal', async () => {
  const jumpRes = await host('jump', { roundIndex: 2 });
  assert.equal(jumpRes.status, 200);
  let state = (await host()).data;
  assert.equal(state.roundIndex, 2);
  assert.equal(state.phase, 'ready');

  // Can force next even when unrevealed
  const forceRes = await host('next', { force: true });
  assert.equal(forceRes.status, 200);
  state = (await host()).data;
  assert.equal(state.roundIndex, 3);

  // Jump back to 0
  await host('jump', { roundIndex: 0 });
  state = (await host()).data;
  assert.equal(state.roundIndex, 0);
});

test('atomic next with autoStart advances round and phase in single request; sync headers forward-sync state', async () => {
  // Reset first
  await host('reset', { confirm: 'RESET' });
  let state = (await host()).data;
  assert.equal(state.roundIndex, 0);

  // Jump to 1 with autoStart
  const jumpRes = await host('jump', { roundIndex: 1, autoStart: true });
  assert.equal(jumpRes.status, 200);
  state = (await host()).data;
  assert.equal(state.roundIndex, 1);
  assert.equal(state.phase, 'voting');
  assert.ok(state.deadline > Date.now());

  // Atomic next with autoStart
  const nextRes = await host('next', { force: true, autoStart: true });
  assert.equal(nextRes.status, 200);
  state = (await host()).data;
  assert.equal(state.roundIndex, 2);
  assert.equal(state.phase, 'voting');
  assert.ok(state.deadline > Date.now());

  // GET is idempotent and read-only: client headers MUST NOT mutate round
  const syncGet = await fetch(`${base}/api/workshop?action=state&role=host`, {
    headers: { 'x-sync-round': '3' }
  });
  const syncData = await syncGet.json();
  assert.equal(syncData.roundIndex, 2);

  // Calling next advances strictly to round 3
  const nextRes3 = await host('next', { force: true, autoStart: true });
  assert.equal(nextRes3.status, 200);
  state = (await host()).data;
  assert.equal(state.roundIndex, 3);
  assert.equal(state.phase, 'voting');

  // Host jumps back to Round 0
  const jumpBackRes = await host('jump', { roundIndex: 0, autoStart: true });
  assert.equal(jumpBackRes.status, 200);
  state = (await host()).data;
  assert.equal(state.roundIndex, 0);

  // Participant sending stale x-sync-round: 3 MUST NOT drag the server back to round 3
  const memberGet = await fetch(`${base}/api/workshop?action=state&role=member`, {
    headers: { 'x-sync-round': '3' }
  });
  const memberData = await memberGet.json();
  assert.equal(memberData.roundIndex, 0);

  // Server state remains on round 0
  state = (await host()).data;
  assert.equal(state.roundIndex, 0);

  // Calling next from Round 0 advances strictly to Round 1 (never skipping to 2 or 3)
  const nextFromZero = await host('next', { force: true, autoStart: true });
  assert.equal(nextFromZero.status, 200);
  state = (await host()).data;
  assert.equal(state.roundIndex, 1);
});
