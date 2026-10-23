import { $, esc, api, toast, status, startClock, broadcastSync, listenSync, setSyncRoundLock, resetSyncRoundLock } from './common.js';

// 去國籍化關鍵決策題目（手機端聚焦關鍵決策與行為線索推理）
const MOBILE_QUESTIONS = [
  {
    code: 'CASE 01 · Alpha 精密研發中心',
    prompt: '週一正式會議上無人反對你的新方案，資深總工卻在會後嚴懲越級寫信給你的年輕工程師，且產線至今毫無動靜。面對週五審查，你應採取哪個象限的領導模式來推動變革？'
  },
  {
    code: 'CASE 02 · Beta 核心試產基地',
    prompt: '夜班良率暴跌至 48%，廠長與年輕工程師在群組激烈互嗆並爭執誰該背鍋，領班私訊問你要不要開民主協調會投票。距離交貨剩 4 小時，你的決策模式應落在哪個座標？'
  },
  {
    code: 'CASE 03 · Gamma 系統架構中心',
    prompt: '你在週會提出臨時修補方案，卻被首席架構師當著 20 人面前直接打斷痛批「邏輯不成立、絕不簽字」。面對公開頂撞你的技術團隊，你應採取哪個座標的領導模式推進整合？'
  },
  {
    code: 'CASE 04 · Delta 關鍵戰略客戶端',
    prompt: '發表會倒數兩小時，客戶技術長帶著基層測試員闖入後台摔出異常報告，基層測試員更直接嗆明「不在乎你的頭銜與賠償金，不公開透明就退場」。此刻你的領導落點為何？'
  }
];

let state = null;
let lastSignature = '';
let roundKey = '';
let busy = false;
let online = false;
let recoveringSession = false;

// GeoGuessr 座標狀態 (0~100)
let pin = null; // { x: number, y: number }
let selection = null;

// 防回合倒退單調鎖
let highestEpoch = '';
let highestRevision = -1;
let highestRoundIndex = -1;

const gate = $('#onboarding');
gate.addEventListener('cancel', e => {
  if (!state?.member) e.preventDefault();
});

// 自動將點擊的 (x, y) 座標映射為 A/B/C/D 選項以兼容後端
function mapPinToChoice(x, y) {
  if (y >= 50 && x < 50) return 'A'; // 左上：共識 × 平等
  if (y >= 50 && x >= 50) return 'B'; // 右上：共識 × 階層
  if (y < 50 && x < 50) return 'C';  // 左下：由上而下 × 平等
  return 'D';                        // 右下：由上而下 × 階層
}

function getZoneLabel(x, y) {
  if (y >= 50 && x < 50) return '左上象限：共識型決策 × 平等主義';
  if (y >= 50 && x >= 50) return '右上象限：共識型決策 × 階層制';
  if (y < 50 && x < 50) return '左下象限：由上而下速決 × 平等主義';
  return '右下象限：由上而下速決 × 階層制';
}

function updatePinUI() {
  const hasVoted = Boolean(state?.vote?.choice);
  const isLeader = Boolean(state?.member?.isRepresentative);
  const marker = $('#my-pin-marker');
  const coordText = $('#pin-coord-readout');
  const submit = $('#submit-vote');

  if (pin && marker) {
    marker.style.display = 'flex';
    marker.style.left = `${pin.x}%`;
    marker.style.top = `${100 - pin.y}%`;
    if (coordText) {
      coordText.innerHTML = `已選落點：<strong>(${pin.x}, ${pin.y})</strong><br><span style="color:#b45309; font-weight:700;">${getZoneLabel(pin.x, pin.y)}</span>`;
    }
  } else if (marker) {
    marker.style.display = 'none';
  }

  if (submit) {
    submit.disabled = hasVoted || busy || !online || !isLeader || !pin;
    if (!hasVoted && isLeader && pin) {
      submit.textContent = `組長確認鎖定座標 (${pin.x}, ${pin.y}) ↗`;
    }
  }
}

function render() {
  const r = state.round;
  const member = state.member;
  if (!r || !member) return;

  const revealed = ['revealed', 'finished'].includes(state.phase);
  const key = `${state.epoch}:${state.roundIndex}`;
  const isLeader = Boolean(member.isRepresentative);

  if (key !== roundKey) {
    pin = null;
    selection = state.vote?.proposal || null;
    try {
      const savedPin = JSON.parse(localStorage.getItem(`cq_pin_${key}_g${member.group}`) || 'null');
      if (savedPin) {
        pin = savedPin;
        selection = mapPinToChoice(pin.x, pin.y);
      }
    } catch {}
    roundKey = key;
  }

  document.documentElement.style.setProperty('--accent', r.color);
  const cq = state.group?.cq ?? 100;
  const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
  const qData = MOBILE_QUESTIONS[state.roundIndex] || MOBILE_QUESTIONS[0];

  // 頂部組別與組長身份列
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
          ${isLeader ? '本組組長（負責插旗）' : '組員（參與討論）'}
        </span>
      </div>
      <div class="mobile-health">
        <span class="health-label">團隊 CQ 韌性</span>
        <div class="health-track"><div class="health-fill ${cqClass}" style="width:${Math.min(100, Math.round((cq / 150) * 100))}%"></div></div>
        <span class="cq-value">${cq}<small> CQ</small></span>
      </div>
    </div>
  `;

  // 手機端：精簡聚焦題目盒
  const keyQuestionBox = `
    <section class="card" style="padding:16px 18px; margin-bottom:12px; border:2px solid #f59e0b; border-left:6px solid #d97706; background:#fffbeb;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="topic-badge" style="background:#d97706; color:#fff;">ROUND 0${state.roundIndex + 1}</span>
        <span style="font-size:11.5px; color:#92400e; font-weight:700;">${esc(qData.code)}</span>
      </div>
      <h1 style="font-size:16.5px; line-height:1.6; font-weight:800; color:#1c1917; margin:0;">
        ${esc(qData.prompt)}
      </h1>
    </section>
  `;

  $('#app').innerHTML = `
    ${identityBar}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成！感謝參與！</div>' : ''}
    ${keyQuestionBox}
    ${revealed ? resultMarkup() : quadrantSelectMarkup()}
  `;

  // 底部固定操作按鈕（嚴格組長權限）
  document.querySelector('.mobile-action')?.remove();
  const footer = document.createElement('footer');
  footer.className = 'mobile-action';
  const hasVoted = Boolean(state.vote?.choice);

  let buttonHtml = '';
  if (revealed) {
    buttonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">本回合已揭曉 · 請看大螢幕正解座標與距離計分</div>`;
  } else if (hasVoted) {
    buttonHtml = `<button id="submit-vote" class="button secondary wide locked-btn" type="button" disabled>本組座標已鎖定 ${pin ? `(${pin.x}, ${pin.y})` : ''}</button>`;
  } else if (!isLeader) {
    buttonHtml = `<button id="submit-vote" class="button secondary wide" type="button" disabled>請與組員討論，由【本組組長】在象限插旗並鎖定</button>`;
  } else {
    buttonHtml = `<button id="submit-vote" class="button primary" type="button" disabled>請組長先在上方四象限點擊落點位置</button>`;
  }

  footer.innerHTML = `<div class="mobile-action-inner">${buttonHtml}</div>`;
  document.body.append(footer);

  // 綁定四象限觸控與點擊插旗事件
  if (!hasVoted && !revealed) {
    const board = $('#geo-pin-board');
    if (board) {
      const handlePointer = e => {
        if (!isLeader) {
          toast('請與組長討論，由組長手機統一插旗送出');
        }
        const rect = board.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rawX = Math.round(((clientX - rect.left) / rect.width) * 100);
        const rawY = Math.round(100 - ((clientY - rect.top) / rect.height) * 100);
        pin = {
          x: Math.max(5, Math.min(95, rawX)),
          y: Math.max(5, Math.min(95, rawY))
        };
        selection = mapPinToChoice(pin.x, pin.y);
        updatePinUI();
      };

      board.addEventListener('click', handlePointer);
      board.addEventListener('touchstart', handlePointer, { passive: true });
    }
    $('#submit-vote')?.addEventListener('click', submitVote);
  }

  updatePinUI();
}

function quadrantSelectMarkup() {
  const isLeader = Boolean(state.member?.isRepresentative);
  return `
    <div class="mobile-timer" style="margin: 10px 0 12px; background:#fef3c7; border:1.5px solid #f59e0b;">
      <span class="timer-label" data-debate style="font-weight:700; color:#92400e;">小組討論與象限判斷時間</span>
      <span class="clock" data-clock style="color:#78350f; font-weight:800;">--:--</span>
    </div>

    <!-- 去國籍化之四象限雷達插旗板 -->
    <section class="card" style="padding:16px; margin-bottom:24px;">
      <div class="eyebrow">QUADRANT PIN-DROP · 文化類型判斷</div>
      <h2 style="font-size:16px; margin:2px 0 4px;">
        ${isLeader ? '你是組長：請點擊你們決定的象限座標' : '請先判斷對方文化類型，由組長點擊象限插旗'}
      </h2>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">
        橫軸（X）：平等主義 (0) ↔ 階層制 (100) ｜ 縱軸（Y）：由上而下 (0) ↔ 共識決策 (100)
      </p>

      <div class="quadrant-axis-header">▲ 共識型決策 Consensual (Y: 100)</div>
      <div id="geo-pin-board" class="quadrant-board geo-interactive-board" style="height:285px; position:relative; user-select:none;">
        <div class="q-cell q-tl">
          <span class="q-zone-name">左上象限</span>
          <small>共識決策 × 平等主義</small>
        </div>
        <div class="q-cell q-tr">
          <span class="q-zone-name">右上象限</span>
          <small>共識決策 × 階層制</small>
        </div>
        <div class="q-cell q-bl">
          <span class="q-zone-name">左下象限</span>
          <small>由上而下 × 平等主義</small>
        </div>
        <div class="q-cell q-br">
          <span class="q-zone-name">右下象限</span>
          <small>由上而下 × 階層制</small>
        </div>
        <div class="q-axis-h" style="position:absolute; left:0; right:0; top:50%; border-top:1.5px dashed rgba(60,50,40,0.3);"></div>
        <div class="q-axis-v" style="position:absolute; top:0; bottom:0; left:50%; border-left:1.5px dashed rgba(60,50,40,0.3);"></div>

        <!-- 插旗標記 -->
        <div id="my-pin-marker" class="geo-pin-marker" style="display:none;">
          <span class="pin-flag">G${state.member.group}</span>
        </div>
      </div>
      <div class="quadrant-axis-footer">
        <span>◀ 平等主義 Egalitarian (0)</span>
        <span>▼ 由上而下 Top-Down (0)</span>
        <span>階層制 Hierarchical (100) ▶</span>
      </div>

      <div id="pin-coord-readout" style="margin-top:12px; padding:10px 12px; background:#f8fafc; border:1px solid var(--line); border-radius:10px; font-size:13px; text-align:center;">
        點擊上方四象限任意位置放置本組旗幟
      </div>
    </section>
  `;
}

function resultMarkup() {
  const myGroup = state.member.group;
  const res = state.result || {};
  return `
    <section class="card" style="padding:20px; margin-bottom:20px; text-align:center;">
      <div class="eyebrow">ROUND REVEALED</div>
      <h2 style="font-size:18px; margin:6px 0 8px;">第 ${myGroup} 組結果已公布於大螢幕</h2>
      <p style="font-size:13.5px; color:var(--muted); line-height:1.7; margin:0 0 14px;">
        請抬頭觀看投影幕上的「四象限落點雷達圖」，檢視各組旗幟與真實靶心的距離、歐幾里得距離計分及文獻深度覆盤。
      </p>
      <div style="display:inline-flex; align-items:center; gap:8px; padding:8px 16px; background:#faf8f5; border:1px solid var(--line); border-radius:10px; font-weight:700;">
        <span>本組累積 CQ：</span>
        <strong style="font-size:17px; color:var(--accent);">${state.group?.cq ?? 100} CQ</strong>
      </div>
    </section>
  `;
}

async function submitVote() {
  if (!pin || busy || !state?.member?.isRepresentative) return;
  busy = true;
  const btn = $('#submit-vote');
  if (btn) btn.disabled = true;
  const choice = mapPinToChoice(pin.x, pin.y);

  try {
    const key = `${state.epoch}:${state.roundIndex}`;
    localStorage.setItem(`cq_pin_${key}_g${state.member.group}`, JSON.stringify(pin));

    await api('vote', {
      choice,
      pinX: pin.x,
      pinY: pin.y,
      roundIndex: state.roundIndex,
      ...(state.roundIndex === 3 ? { consensus: [true, true, true] } : {})
    });

    broadcastSync('group_vote', {
      group: state.member.group,
      choice,
      proposal: choice,
      pinX: pin.x,
      pinY: pin.y,
      roundIndex: state.roundIndex
    });

    toast(`組長已鎖定本組座標 (${pin.x}, ${pin.y}) ✓`);
    await refresh();
  } catch (e) {
    toast(e.message);
  } finally {
    busy = false;
    updatePinUI();
  }
}

async function refresh() {
  try {
    const next = await api('state');
    if (!next || typeof next !== 'object') return;

    // 單調防回合倒退鎖
    if (next.epoch && next.epoch !== highestEpoch) {
      if (highestEpoch.startsWith('cq-reset-') && next.epoch === 'cq-room-v1') {
        return;
      }
      highestEpoch = next.epoch;
      highestRevision = typeof next.revision === 'number' ? next.revision : 0;
      highestRoundIndex = typeof next.roundIndex === 'number' ? next.roundIndex : 0;
      setSyncRoundLock(highestRoundIndex, highestEpoch);
    } else if (next.epoch === highestEpoch) {
      if (typeof next.roundIndex === 'number' && next.roundIndex < highestRoundIndex) {
        return;
      }
      if (typeof next.roundIndex === 'number' && next.roundIndex > highestRoundIndex) {
        highestRoundIndex = next.roundIndex;
        setSyncRoundLock(highestRoundIndex, highestEpoch);
      }
      if (typeof next.revision === 'number' && next.revision > highestRevision) {
        highestRevision = next.revision;
      }
    }

    next.clockOffset = (next.serverTime || Date.now()) - Date.now();

    if (!next.member) {
      let savedJoin = null;
      try {
        savedJoin = JSON.parse(localStorage.getItem('cq_last_join') || 'null');
      } catch {}

      if (state?.member) {
        next.member = state.member;
        next.group = next.group || state.group;
        next.vote = next.vote || state.vote;
      }

      if (savedJoin?.name && savedJoin?.group && !recoveringSession) {
        recoveringSession = true;
        api('join', { name: savedJoin.name, group: Number(savedJoin.group), allowSwitch: true })
          .then(res => {
            if (res?.token) localStorage.setItem('cq_member_token', res.token);
            recoveringSession = false;
            refresh();
          })
          .catch(() => {
            recoveringSession = false;
          });
        if (state?.member) return;
      }

      if (!savedJoin) {
        state = next;
        online = true;
        status(true);
        if (!gate.open) gate.showModal();
        $('#app').innerHTML = '<div class="loading">請先填寫姓名與組別入席…</div>';
        return;
      }
    } else if (gate.open && !gate.dataset.manualSwitch) {
      gate.close();
    }

    const signatureObj = { ...next, serverTime: 0, clockOffset: 0, remaining: 0, deadline: next.deadline ? 1 : 0, pitch: null };
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
      highestEpoch = '';
      highestRevision = -1;
      highestRoundIndex = -1;
      resetSyncRoundLock();
      if (!gate.open) gate.showModal();
      $('#app').innerHTML = '<div class="loading">請先填寫姓名與組別入席…</div>';
      return;
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
  const name = form.get('name');
  const group = Number(form.get('group'));
  try {
    const res = await api(state?.member ? 'switch-group' : 'join', { name, group, allowSwitch: true });
    if (res.token) {
      localStorage.setItem('cq_member_token', res.token);
      localStorage.setItem('cq_last_join', JSON.stringify({ name, group }));
    }
    delete gate.dataset.manualSwitch;
    gate.close();
    await refresh();
  } catch (err) {
    $('#join-error').textContent = err.message;
  } finally {
    button.disabled = false;
  }
});

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'host_action') {
    if (typeof packet.roundIndex === 'number' && packet.roundIndex > highestRoundIndex) {
      highestRoundIndex = packet.roundIndex;
      setSyncRoundLock(highestRoundIndex, highestEpoch);
    }
    refresh();
  } else if (packet.type === 'group_vote' && packet.group === state.member?.group && packet.roundIndex === state.roundIndex) {
    if (packet.pinX !== undefined && packet.pinY !== undefined) {
      pin = { x: Number(packet.pinX), y: Number(packet.pinY) };
      const key = `${state.epoch}:${state.roundIndex}`;
      try {
        localStorage.setItem(`cq_pin_${key}_g${state.member.group}`, JSON.stringify(pin));
      } catch {}
      updatePinUI();
    }
  }
});

async function poll() {
  await refresh();
  setTimeout(poll, document.hidden ? 5000 : 1500);
}
startClock(() => state);
poll();
