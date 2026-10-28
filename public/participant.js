import { $, esc, api, toast, status, startClock, broadcastSync, listenSync, setSyncRoundLock, forceSyncRound } from './common.js';

// 對應四個不同象限的手機端精簡關鍵題目與情境對白
const MOBILE_QUESTIONS = [
  {
    code: '案例一 · 精密研發中心',
    lead: '你剛接管精密研發中心，提議縮短高溫測試工時，會議上無人反對，事後卻完全無人執行。',
    prompt: '面對會議全員沉默抄筆記、會後產線完全不動的局面，你的領導決策座標落點在哪裡？',
    dialogues: [
      { tag: '週一全體大會', text: '你提議縮短高溫測試工時兩成，詢問有無異議；全場低頭抄筆記，一片沉默。' },
      { tag: '技術主管態度', text: '技術主管微笑回應：「我們會盡力研究。」' },
      { tag: '週三產線現場', text: '來到產線發現測試工時完全沒改，依舊按照原案跑，產線完全沒動！' },
      { tag: '茶水間外衝突', text: '技術主管嚴厲斥責昨晚私信向你提建議的年輕工程師：「不懂規矩，破壞團隊程序！」' }
    ],
    bullets: {
      feat: '兼具嚴明的職級尊卑與全員深度共識，重視循序漸進的組織倫理與事前校準。',
      blindspot: '誤以為大會能直接討論拍板；在該文化中大會僅為用印儀式，未經會前私下摸底強推必遭消極抗命。',
      action: '尊重既有職級序列，會前透過資深幹部由下而上私下溝通、全員完成確認後再開會拍板。'
    }
  },
  {
    code: '案例二 · 核心試產基地',
    lead: '交貨只剩四小時，半夜產線突然發生重大良率異常，基層工程師慌亂甩鍋不敢決定。',
    prompt: '距離交貨剩四小時，面對團隊恐懼責任且無人敢動手，你的領導決策座標落點在哪裡？',
    dialogues: [
      { tag: '夜班兩點十分', text: '塗佈機良率暴跌至百分之四十八！產線領班大驚失色。' },
      { tag: '現場緊急下令', text: '資深廠長：「立刻停線，把機台洗乾淨！」機台強制按下停機。' },
      { tag: '工程群組爭吵', text: '工程師在群組內激烈甩鍋：「是塗佈液的問題！」「延誤你們扛！」' },
      { tag: '領班私訊求救', text: '領班私訊：「現在到底該聽誰的？請給我們明確裁示，否則沒人敢動手！」' }
    ],
    bullets: {
      feat: '導演式指揮模式，高度重視階級秩序，危機時刻基層仰賴最高主管明確指令。',
      blindspot: '在危機時刻若尋求民主討論凝聚共識，會被基層視為軟弱、無能且推卸責任。',
      action: '主管迅速聽取關鍵資訊後果斷拍板，下達清晰執行步驟，並由最高主管親自扛起成敗責任。'
    }
  },
  {
    code: '案例三 · 高速運算實驗室',
    lead: '新產品發表在即，年輕工程師在全員站立會議上直接挑戰你的保守決策，提出激進改動。',
    prompt: '面對成員大膽挑戰既有架構並要求立即上線，你的領導決策座標落點在哪裡？',
    dialogues: [
      { tag: '封版倒數時刻', text: '站立會議上，年輕核心工程師直接對你說：「你昨天定的架構太保守了！」' },
      { tag: '提出激進架構', text: '他拿出私下寫的新演算法原型：「效能提升兩倍！現在就推上線，有問題明天再修！」' },
      { tag: '團隊全員附和', text: '團隊成員紛紛附和起鬨：「值得賭一把！」「直接上了再說！」' },
      { tag: '品保主管沉默', text: '品保主管面色凝重，沉默看向你等待定奪。' }
    ],
    bullets: {
      feat: '敏捷試錯模式，組織極度扁平，決策採小速決快速推進與動態修補。',
      blindspot: '若開馬拉松會議追求完美共識，會被視為官僚、保守且缺乏魄力與市場速度。',
      action: '肯定創新熱情並迅速拍板小規模試跑，保留後續動態修補彈性。'
    }
  },
  {
    code: '案例四 · 戰略客戶攤牌現場',
    lead: '全球發表會前夕，戰略客戶直接帶著基層測試人員闖進後台，要求公開透明審查瑕疵。',
    prompt: '發表會倒數兩小時，面對客戶技術員在後台強硬阻擋放行，你的領導決策座標落點在哪裡？',
    dialogues: [
      { tag: '客戶後台突發', text: '全球發表會倒數兩小時，戰略客戶技術長帶著兩名年輕測試員突然走進後台。' },
      { tag: '攤牌數據報告', text: '測試員將「極端低溫環境訊號衰減報告」拍在桌上！' },
      { tag: '基層堅持把關', text: '年輕測試員：「在我們團隊裡，每位技術員都有權為安全把關，我們不在乎職銜。」' },
      { tag: '堅持全體共審', text: '「若非雙方工程師公開透明共同審核並達成一致協議，我們絕不簽署放行同意書！」' }
    ],
    bullets: {
      feat: '低地協商模式，基層工程師擁有一票否決權，追求刻在石碑上的神聖大承諾。',
      blindspot: '試圖透過職級施壓或私下利益妥協，會被視為踐踏專業誠信與違背團隊共識。',
      action: '主管轉化為中立協調促進者，召集雙方技術人員公開數據、透明共審，凝聚神聖共識。'
    }
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

  const scenarioDialogueBox = revealed ? '' : `
    <section class="card" style="padding:14px 16px; margin-bottom:12px; background:#ffffff; border:1.5px solid var(--line);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="topic-badge" style="background:#1e3a8a; color:#fff;">現場情境背景</span>
        <span style="font-size:11.5px; color:#475569; font-weight:700;">${esc(qData.code)}</span>
      </div>
      ${qData.lead ? `
        <div style="font-size:13.5px; font-weight:700; color:#1e293b; line-height:1.55; margin-bottom:10px; padding:9px 12px; background:#f1f5f9; border-left:4px solid #3b82f6; border-radius:8px;">
          ${esc(qData.lead)}
        </div>
      ` : ''}
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${(qData.dialogues || []).map(d => `
          <div style="background:#faf8f5; border-left:3.5px solid #d97706; border-radius:8px; padding:7px 10px;">
            <span style="font-size:11px; font-weight:800; color:#b45309; display:block; margin-bottom:2px;">${esc(d.tag)}</span>
            <div style="font-size:13.5px; font-weight:600; line-height:1.45; color:#1c1917;">${esc(d.text)}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  const keyQuestionBox = `
    <section class="card" style="padding:14px 16px; margin-bottom:12px; border:2px solid #f59e0b; border-left:6px solid #d97706; background:#fffbeb;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="topic-badge" style="background:#d97706; color:#fff;">第 0${state.roundIndex + 1} 回合 · 決策課題</span>
        <span style="font-size:11.5px; color:#92400e; font-weight:700;">${esc(qData.code)}</span>
      </div>
      <h1 style="font-size:15px; line-height:1.5; font-weight:800; color:#1c1917; margin:0;">
        🎯 ${esc(qData.prompt)}
      </h1>
    </section>
  `;

  $('#app').innerHTML = `
    ${identityBar}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成！感謝參與！</div>' : ''}
    ${revealed ? resultMarkup() : `${scenarioDialogueBox}${keyQuestionBox}${quadrantSelectMarkup()}`}
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
      <div class="eyebrow">文化類型判斷</div>
      <h2 style="font-size:16px; margin:2px 0 4px;">
        ${isLeader ? '👑 你是組長：請點擊你們決定的象限座標' : '請先判斷對方文化類型，由組長點擊象限插旗'}
      </h2>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">
        橫軸：平等主義 (0) ↔ 階層制 (100) ｜ 縱軸：由上而下 (0) ↔ 共識決策 (100)
      </p>

      <div class="quadrant-axis-header">▲ 共識型決策 (縱軸: 100)</div>
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
        <span>◀ 平等主義 (0)</span>
        <span>▼ 由上而下 (0)</span>
        <span>階層制 (100) ▶</span>
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
  const qData = MOBILE_QUESTIONS[state.roundIndex] || MOBILE_QUESTIONS[0];

  return `
    <section class="card" style="padding:20px 18px; margin-bottom:14px; text-align:center;">
      <div class="eyebrow">第 0${state.roundIndex + 1} 回合 · 座標揭曉</div>
      <h2 style="font-size:19px; margin:6px 0 8px;">第 ${myGroup} 組結果已公布</h2>
      <div style="margin:14px 0; display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
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
      <p style="font-size:13px; color:var(--muted); margin:0;">
        請抬頭看大螢幕，檢視各組旗幟與真實答案靶心距離。
      </p>
    </section>

    <!-- 列點式原因呈現 -->
    <section class="card" style="padding:16px 18px; margin-bottom:20px; text-align:left; background:#ffffff; border:1.5px solid var(--line);">
      <div class="eyebrow" style="margin-bottom:10px; color:#15803d; font-weight:800;">答案解析 · 列點式原因拆解</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #1e3a8a; border-radius:10px; padding:10px 12px;">
          <span style="display:inline-block; font-size:11.5px; font-weight:800; color:#1e3a8a; margin-bottom:3px;">文化特徵</span>
          <div style="font-size:13px; line-height:1.5; color:#334155; font-weight:600;">${esc(qData.bullets.feat)}</div>
        </div>
        <div style="background:#fffbeb; border:1px solid #fef3c7; border-left:4px solid #d97706; border-radius:10px; padding:10px 12px;">
          <span style="display:inline-block; font-size:11.5px; font-weight:800; color:#d97706; margin-bottom:3px;">管理盲點</span>
          <div style="font-size:13px; line-height:1.5; color:#78350f; font-weight:600;">${esc(qData.bullets.blindspot)}</div>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; border-radius:10px; padding:10px 12px;">
          <span style="display:inline-block; font-size:11.5px; font-weight:800; color:#16a34a; margin-bottom:3px;">正確對策</span>
          <div style="font-size:13px; line-height:1.5; color:#14532d; font-weight:600;">${esc(qData.bullets.action)}</div>
        </div>
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
