import { $, esc, api, toast, status, startClock, broadcastSync, listenSync, setSyncRoundLock, forceSyncRound } from './common.js';

// 對應四個不同象限的手機端精簡關鍵題目
const MOBILE_QUESTIONS = [
  {
    code: 'CASE 01 · Alpha 精密研發中心',
    prompt: '週一正式會議上無人反對新方案，資深總工卻在會後嚴懲越級寫信給你的年輕工程師，且產線至今毫無動靜。請判斷對方文化類型，並在四象限中釘出你的領導座標。'
  },
  {
    code: 'CASE 02 · Beta 核心試產基地',
    prompt: '夜班良率暴跌至 48%，群組內爭執誰該為延誤負全責，領班私訊請求你「給出明確裁示，否則沒人敢動手」。距離交貨剩 4 小時，你的決策模式應落在哪個座標？'
  },
  {
    code: 'CASE 03 · Gamma 高速運算實驗室',
    prompt: '封版前 36 小時，年輕工程師在會議上直接挑戰你的架構，提議先推他昨晚寫的新原型上線、有問題明天再動態修補。面對扁平且崇尚速度的團隊，你的領導落點為何？'
  },
  {
    code: 'CASE 04 · Delta 戰略客戶攤牌現場',
    prompt: '發表會前兩小時，客戶技術長與基層測試員拿著異常報告要求公開透明共審，基層測試員更直言「不在乎你的職銜或賠償金，全員達成共識才放行」。你的領導落點為何？'
  }
];

let state = null, lastSignature = '', roundKey = '', busy = false, online = false;
let recoveringSession = false;
let pin = null;
let selection = null;
let localVotedRoundKey = '';
let lastKnownRevision = 0, lastKnownEpoch = '';

const gate = $('#onboarding');
// 防止按 Esc 關閉（除非已存有本地身份）
gate.addEventListener('cancel', e => {
  if (!getSavedJoin() && !state?.member) e.preventDefault();
});

function getSavedJoin() {
  try {
    const raw = localStorage.getItem('cq_last_join');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name && parsed.group) {
      return { name: String(parsed.name), group: Number(parsed.group), isRepresentative: parsed.isRepresentative ?? true };
    }
  } catch {}
  return null;
}

function saveJoinData(name, group, isRep = true) {
  try {
    localStorage.setItem('cq_last_join', JSON.stringify({ name, group: Number(group), isRepresentative: Boolean(isRep) }));
  } catch {}
}

// 數學標準四象限映射：
// 第一象限 (右上: X>=50, Y>=50) -> B
// 第二象限 (左上: X<50,  Y>=50) -> A
// 第三象限 (左下: X<50,  Y<50)  -> C
// 第四象限 (右下: X>=50, Y<50)  -> D
function mapPinToChoice(x, y) {
  if (x >= 50 && y >= 50) return 'B'; // 第一象限（右上）
  if (x < 50 && y >= 50) return 'A';  // 第二象限（左上）
  if (x < 50 && y < 50) return 'C';   // 第三象限（左下）
  return 'D';                         // 第四象限（右下）
}

function getZoneLabel(x, y) {
  if (x >= 50 && y >= 50) return '【第一象限（右上）】共識型決策 × 階層制';
  if (x < 50 && y >= 50) return '【第二象限（左上）】共識型決策 × 平等主義';
  if (x < 50 && y < 50) return '【第三象限（左下）】由上而下速決 × 平等主義';
  return '【第四象限（右下）】由上而下速決 × 階層制';
}

function updatePinUI() {
  const key = state ? `${state.epoch}:${state.roundIndex}` : '';
  const hasVoted = Boolean(state?.vote?.choice) || (key && localVotedRoundKey === key);
  const isLeader = Boolean(state?.member?.isRepresentative);
  const marker = $('#my-pin-marker');
  const coordText = $('#pin-coord-readout');
  const submit = $('#submit-vote');

  if (pin && marker) {
    marker.style.display = 'flex';
    marker.style.left = `${pin.x}%`;
    marker.style.top = `${100 - pin.y}%`;
    if (coordText) {
      coordText.innerHTML = `🚩 已選落點：<strong>(${pin.x}, ${pin.y})</strong><br><span style="color:#b45309; font-weight:700;">${getZoneLabel(pin.x, pin.y)}</span>`;
    }
  } else if (marker) {
    marker.style.display = 'none';
  }

  if (submit) {
    if (hasVoted) {
      submit.disabled = true;
      submit.className = 'button secondary wide locked-btn';
      submit.textContent = `✓ 組長已鎖定本組象限座標 ${pin ? `(${pin.x}, ${pin.y})` : ''}`;
    } else {
      submit.disabled = busy || !online || !isLeader || !pin;
      if (isLeader && pin) {
        submit.textContent = `👑 組長確認鎖定座標 (${pin.x}, ${pin.y}) ↗`;
      }
    }
  }
}

function render() {
  const r = state?.round;
  const member = state?.member;
  if (!r || !member) return;

  const revealed = ['revealed', 'finished'].includes(state.phase);
  const key = `${state.epoch}:${state.roundIndex}`;
  const isLeader = Boolean(member.isRepresentative);

  // 當切換到新回合時，清空上一回合的插旗狀態
  if (key !== roundKey) {
    pin = null;
    selection = null;
    try {
      const savedPin = JSON.parse(localStorage.getItem(`cq_pin_${key}_g${member.group}`) || 'null');
      if (savedPin) {
        pin = savedPin;
        selection = mapPinToChoice(pin.x, pin.y);
      }
    } catch {}
    roundKey = key;
  }

  const hasVoted = Boolean(state.vote?.choice) || localVotedRoundKey === key;

  document.documentElement.style.setProperty('--accent', r.color);
  const cq = state.group?.cq ?? 0;
  const qData = MOBILE_QUESTIONS[state.roundIndex] || MOBILE_QUESTIONS[0];

  const identityBar = `
    <div class="mobile-identity">
      <div class="identity-bar">
        <div class="identity-pill">
          <span class="identity-name">${esc(member.name)}</span>
          <span aria-hidden="true">｜</span>
          第 ${member.group} 組
        </div>
        <button type="button" class="switch-group-btn" id="open-switch-group">換組</button>
        <span class="rep-tag" style="${isLeader ? 'background:#fef3c7; color:#b45309; border:1px solid #f59e0b; padding:3px 9px; border-radius:99px; font-weight:800;' : ''}">
          ${isLeader ? '👑 本組組長（負責插旗）' : '組員（參與討論）'}
        </span>
      </div>
      <div class="mobile-health">
        <span class="health-label">文化積分</span>
        <div class="health-track"><div class="health-fill" style="width:${Math.min(100, Math.round((cq / 400) * 100))}%; background:#d97706;"></div></div>
        <span class="cq-value">${cq}<small> 分</small></span>
      </div>
    </div>
  `;

  const keyQuestionBox = `
    <section class="card" style="padding:16px 18px; margin-bottom:12px; border:2px solid #f59e0b; border-left:6px solid #d97706; background:#fffbeb;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="topic-badge" style="background:#d97706; color:#fff;">ROUND 0${state.roundIndex + 1} · 關鍵決策題目</span>
        <span style="font-size:11.5px; color:#92400e; font-weight:700;">${esc(qData.code)}</span>
      </div>
      <h1 style="font-size:16.5px; line-height:1.6; font-weight:800; color:#1c1917; margin:0;">
        🎯 ${esc(qData.prompt)}
      </h1>
    </section>
  `;

  $('#app').innerHTML = `
    ${identityBar}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成！感謝參與！</div>' : ''}
    ${keyQuestionBox}
    ${revealed ? resultMarkup() : quadrantSelectMarkup()}
  `;

  document.querySelector('.mobile-action')?.remove();
  const footer = document.createElement('footer');
  footer.className = 'mobile-action';

  let buttonHtml = '';
  if (revealed) {
    buttonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">本回合已揭曉 · 請看大螢幕正解座標與得分</div>`;
  } else if (hasVoted) {
    buttonHtml = `<button id="submit-vote" class="button secondary wide locked-btn" type="button" disabled>✓ 組長已鎖定本組象限座標 ${pin ? `(${pin.x}, ${pin.y})` : ''}</button>`;
  } else if (!isLeader) {
    buttonHtml = `<button id="submit-vote" class="button secondary wide" type="button" disabled>🔒 請與組員討論，由【本組組長】點擊象限並鎖定</button>`;
  } else {
    buttonHtml = `<button id="submit-vote" class="button primary" type="button" disabled>👑 請組長先在上方四象限點擊落點位置</button>`;
  }

  footer.innerHTML = `<div class="mobile-action-inner">${buttonHtml}</div>`;
  document.body.append(footer);

  if (!hasVoted && !revealed) {
    const board = $('#geo-pin-board');
    if (board) {
      const handlePointer = (e) => {
        if (!isLeader) {
          toast('💡 請與組長討論，由組長手機統一插旗送出！');
        }
        const rect = board.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        const rawX = Math.round(((clientX - rect.left) / rect.width) * 100);
        const rawY = Math.round(100 - ((clientY - rect.top) / rect.height) * 100);
        pin = {
          x: Math.max(5, Math.min(95, rawX)),
          y: Math.max(5, Math.min(95, rawY))
        };
        selection = mapPinToChoice(pin.x, pin.y);
        updatePinUI();
      };
      board.addEventListener('pointerdown', handlePointer);
    }
    $('#submit-vote')?.addEventListener('click', submitVote);
  }

  updatePinUI();
}

function quadrantSelectMarkup() {
  const isLeader = Boolean(state.member?.isRepresentative);
  return `
    <div class="mobile-timer" style="margin: 10px 0 12px; background:#fef3c7; border:1.5px solid #f59e0b;">
      <span class="timer-label" data-debate style="font-weight:700; color:#92400e;">⏱️ 小組討論與象限判斷時間</span>
      <span class="clock" data-clock style="color:#78350f; font-weight:800;">--:--</span>
    </div>

    <section class="card" style="padding:16px; margin-bottom:24px;">
      <div class="eyebrow">QUADRANT PIN-DROP · 文化類型判斷</div>
      <h2 style="font-size:16px; margin:2px 0 4px;">
        ${isLeader ? '👑 你是組長：請點擊你們決定的象限座標' : '請先判斷對方文化類型，由組長點擊象限插旗'}
      </h2>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">
        橫軸（X）：平等主義 (0) ↔ 階層制 (100) ｜ 縱軸（Y）：由上而下 (0) ↔ 共識決策 (100)
      </p>

      <div class="quadrant-axis-header">▲ 共識型決策 Consensual (Y: 100)</div>
      <div id="geo-pin-board" class="quadrant-board geo-interactive-board" style="height:285px; cursor:crosshair; position:relative; user-select:none;">
        <div class="q-cell q-tl">
          <span class="q-zone-name">第二象限（左上）</span>
          <small>共識決策 × 平等主義</small>
        </div>
        <div class="q-cell q-tr">
          <span class="q-zone-name">第一象限（右上）</span>
          <small>共識決策 × 階層制</small>
        </div>
        <div class="q-cell q-bl">
          <span class="q-zone-name">第三象限（左下）</span>
          <small>由上而下 × 平等主義</small>
        </div>
        <div class="q-cell q-br">
          <span class="q-zone-name">第四象限（右下）</span>
          <small>由上而下 × 階層制</small>
        </div>
        <div class="q-axis-h" style="position:absolute; left:0; right:0; top:50%; border-top:1.5px dashed rgba(60,50,40,0.3);"></div>
        <div class="q-axis-v" style="position:absolute; top:0; bottom:0; left:50%; border-left:1.5px dashed rgba(60,50,40,0.3);"></div>

        <div id="my-pin-marker" class="geo-pin-marker" style="display:none;">
          <span class="pin-flag">🚩 G${state.member.group}</span>
        </div>
      </div>
      <div class="quadrant-axis-footer">
        <span>◀ 平等主義 Egalitarian (0)</span>
        <span>▼ 由上而下 Top-Down (0)</span>
        <span>階層制 Hierarchical (100) ▶</span>
      </div>

      <div id="pin-coord-readout" style="margin-top:12px; padding:10px 12px; background:#f8fafc; border:1px solid var(--line); border-radius:10px; font-size:13px; text-align:center;">
        👆 點擊上方四象限任意位置以放置本組旗幟
      </div>
    </section>
  `;
}

function resultMarkup() {
  const myGroup = state.member.group;
  const res = state.result || {};
  const myScore = state.group?.cq ?? 0;
  const roundGain = res?.actualDelta ?? res?.roundScore ?? 0;
  const dist = res?.dist !== undefined ? res.dist : null;
  return `
    <section class="card" style="padding:22px 18px; margin-bottom:20px; text-align:center;">
      <div class="eyebrow">ROUND REVEALED · 座標揭曉</div>
      <h2 style="font-size:19px; margin:6px 0 8px;">第 ${myGroup} 組結果已公布</h2>
      <div style="margin:16px 0; display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
        ${dist !== null ? `<div style="padding:10px 14px; background:#faf8f5; border:1px solid var(--line); border-radius:12px;">
          <div style="font-size:11px; color:var(--muted); font-weight:700;">落點誤差</div>
          <div style="font-size:20px; font-weight:900; color:#451a03;">${dist} 格</div>
        </div>` : ''}
        <div style="padding:10px 14px; background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px;">
          <div style="font-size:11px; color:#15803d; font-weight:700;">本輪獲得</div>
          <div style="font-size:20px; font-weight:900; color:#15803d;">+${roundGain} 分</div>
        </div>
        <div style="padding:10px 14px; background:#fffbeb; border:1.5px solid #f59e0b; border-radius:12px;">
          <div style="font-size:11px; color:#92400e; font-weight:700;">目前累計</div>
          <div style="font-size:20px; font-weight:900; color:#b45309;">${myScore} 分</div>
        </div>
      </div>
      <p style="font-size:13.5px; color:var(--muted); margin:0;">
        請抬頭看大螢幕，檢視各組旗幟與真實答案靶心的距離及象限理論解析。
      </p>
    </section>
  `;
}

async function submitVote() {
  if (!pin || busy || !state?.member?.isRepresentative) return;
  busy = true;
  const btn = $('#submit-vote');
  if (btn) btn.disabled = true;
  const choice = mapPinToChoice(pin.x, pin.y);
  const key = `${state.epoch}:${state.roundIndex}`;

  try {
    localStorage.setItem(`cq_pin_${key}_g${state.member.group}`, JSON.stringify(pin));
    localVotedRoundKey = key;

    // 確保在無狀態 Serverless 環境下，若 session 遺失先自動重連再送出投票
    try {
      await api('vote', {
        choice,
        pinX: pin.x,
        pinY: pin.y,
        roundIndex: state.roundIndex,
        ...(state.roundIndex === 3 ? { consensus: [true, true, true] } : {})
      });
    } catch (voteErr) {
      const saved = getSavedJoin();
      if (saved) {
        const jRes = await api('join', { name: saved.name, group: saved.group, allowSwitch: true });
        if (jRes?.token) localStorage.setItem('cq_member_token', jRes.token);
        await api('vote', {
          choice,
          pinX: pin.x,
          pinY: pin.y,
          roundIndex: state.roundIndex,
          ...(state.roundIndex === 3 ? { consensus: [true, true, true] } : {})
        });
      } else {
        throw voteErr;
      }
    }

    broadcastSync('group_vote', {
      group: state.member.group,
      choice,
      proposal: choice,
      pinX: pin.x,
      pinY: pin.y,
      roundIndex: state.roundIndex
    });

    toast(`👑 組長已鎖定本組座標 (${pin.x}, ${pin.y}) ✓`);
    await refresh();
  } catch (e) {
    localVotedRoundKey = '';
    toast(e.message);
  } finally {
    busy = false;
    updatePinUI();
  }
}

async function refresh() {
  try {
    const next = await api('state');
    next.clockOffset = next.serverTime - Date.now();
    const savedJoin = getSavedJoin();

    if (next.epoch && (next.epoch !== lastKnownEpoch || (typeof next.revision === 'number' && next.revision >= lastKnownRevision))) {
      lastKnownEpoch = next.epoch;
      if (typeof next.revision === 'number') lastKnownRevision = next.revision;
      if (typeof next.roundIndex === 'number') {
        forceSyncRound(next.roundIndex, next.epoch);
      }
    } else if (typeof next.roundIndex === 'number' && next.epoch) {
      setSyncRoundLock(next.roundIndex, next.epoch);
    }

    // 【終極防跳回保護】：只要 localStorage 有 savedJoin，永遠直接使用本地組別身份渲染，絕不彈出選組別視窗！
    if (next.member) {
      saveJoinData(next.member.name, next.member.group, next.member.isRepresentative);
      if (gate.open && !gate.dataset.manualSwitch) gate.close();
    } else if (savedJoin) {
      // 立即用本地儲存的身份補齊 next.member，讓換回合時畫面 100% 穩定不跳出
      next.member = state?.member || {
        name: savedJoin.name,
        group: savedJoin.group,
        isRepresentative: savedJoin.isRepresentative ?? true
      };
      next.group = next.group || state?.group || { id: savedJoin.group, cq: 0 };
      if (gate.open && !gate.dataset.manualSwitch) gate.close();

      // 背景靜默補登 Token
      if (!recoveringSession) {
        recoveringSession = true;
        api('join', { name: savedJoin.name, group: savedJoin.group, allowSwitch: true })
          .then(res => {
            if (res?.token) localStorage.setItem('cq_member_token', res.token);
            if (res?.member) {
              saveJoinData(res.member.name, res.member.group, res.member.isRepresentative);
              if (state) state.member = res.member;
            }
            recoveringSession = false;
          })
          .catch(err => {
            recoveringSession = false;
            if (err?.status === 401 || err?.status === 409) {
              localStorage.removeItem('cq_last_join');
              localStorage.removeItem('cq_member_token');
              if (!gate.open) gate.showModal();
            }
          });
      }
    } else {
      // 只有真正從未填過組別的全新設備，才開啟報名視窗
      state = next;
      online = true;
      status(true);
      if (!gate.open) gate.showModal();
      $('#app').innerHTML = '<div class="loading">請先填寫姓名與組別入席…</div>';
      return;
    }

    const signatureObj = {
      roundIndex: next.roundIndex,
      phase: next.phase,
      epoch: next.epoch,
      memberGroup: next.member?.group,
      isRep: next.member?.isRepresentative,
      voteChoice: next.vote?.choice,
      groupCq: next.group?.cq
    };
    const signature = JSON.stringify(signatureObj);

    state = next;
    online = true;
    status(true);

    if (signature !== lastSignature) {
      lastSignature = signature;
      render();
    } else {
      updatePinUI();
    }
  } catch (e) {
    if (e.status === 401) {
      localStorage.removeItem('cq_member_token');
      const savedJoin = getSavedJoin();
      if (savedJoin && !recoveringSession) {
        recoveringSession = true;
        api('join', { name: savedJoin.name, group: savedJoin.group, allowSwitch: true })
          .then(res => {
            if (res?.token) localStorage.setItem('cq_member_token', res.token);
            if (res?.member) saveJoinData(res.member.name, res.member.group, res.member.isRepresentative);
            recoveringSession = false;
            refresh();
          })
          .catch(() => {
            recoveringSession = false;
            if (!gate.open) gate.showModal();
          });
        return;
      } else {
        if (!gate.open) gate.showModal();
        return;
      }
    }
    online = false;
    status(false);
  }
}

document.body.addEventListener('click', e => {
  if (e.target.closest('#open-switch-group')) {
    if (!state?.member) return;
    gate.dataset.manualSwitch = 'true';
    $('#join-title').innerHTML = '更換組別 / 姓名';
    $('#name').value = state.member.name;
    const r = document.querySelector(`input[name="group"][value="${state.member.group}"]`);
    if (r) r.checked = true;
    const closeBtn = $('#close-onboarding');
    if (closeBtn) closeBtn.style.display = 'grid';
    gate.showModal();
  }
  if (e.target.closest('#close-onboarding')) {
    delete gate.dataset.manualSwitch;
    gate.close();
  }
});

$('#join-form').addEventListener('submit', async e => {
  e.preventDefault();
  const button = e.currentTarget.querySelector('button[type="submit"]') || e.currentTarget.querySelector('button');
  button.disabled = true;
  $('#join-error').textContent = '';
  const form = new FormData(e.currentTarget);
  const name = String(form.get('name') || '').trim();
  const group = Number(form.get('group'));

  // 先寫入本地端永久保存，確保之後任何情況都不會跳回選組別
  saveJoinData(name, group, true);

  try {
    const res = await api(state?.member ? 'switch-group' : 'join', { name, group, allowSwitch: true });
    if (res.token) localStorage.setItem('cq_member_token', res.token);
    if (res.member) saveJoinData(res.member.name, res.member.group, res.member.isRepresentative);
    delete gate.dataset.manualSwitch;
    gate.close();
    lastSignature = '';
    await refresh();
  } catch (err) {
    // 即使 API 瞬斷，也允許關閉彈窗進入預覽，背景會自動重連
    delete gate.dataset.manualSwitch;
    gate.close();
    lastSignature = '';
    await refresh();
  } finally {
    button.disabled = false;
  }
});

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'host_action') {
    if (typeof packet.roundIndex === 'number') {
      forceSyncRound(packet.roundIndex, packet.epoch || state?.epoch || '');
    }
    refresh();
  } else if (packet.type === 'group_vote' && Number(packet.group) === Number(state.member?.group) && packet.roundIndex === state.roundIndex) {
    if (packet.pinX !== undefined && packet.pinY !== undefined) {
      pin = { x: Number(packet.pinX), y: Number(packet.pinY) };
      const key = `${state.epoch}:${state.roundIndex}`;
      localVotedRoundKey = key;
      try { localStorage.setItem(`cq_pin_${key}_g${state.member.group}`, JSON.stringify(pin)); } catch {}
    }
    updatePinUI();
  }
});

async function poll() {
  await refresh();
  setTimeout(poll, document.hidden ? 5000 : 1500);
}
startClock(() => state);
poll();
