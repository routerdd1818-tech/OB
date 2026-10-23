import { $, esc, api, toast, status, scene, roundNav, tensionCard, dialogue, startClock, broadcastSync, listenSync, playRevealDrum, toggleSound, isSoundEnabled, setSyncRoundLock, resetSyncRoundLock } from './common.js';

const PRODUCTION_JOIN_URL = 'https://my00-rt-bf0f.vercel.app/';

// 手機無法連到 localhost / 127.0.0.1，本機預覽時改用正式線上網址產生 QR Code
function resolveJoinUrl() {
  const url = state?.joinUrl || '';
  return !url || /localhost|127\.0\.0\.1/.test(url) ? PRODUCTION_JOIN_URL : url;
}

function paintQr(target, url, cellSize = 4, margin = 8) {
  if (!target) return;
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    target.innerHTML = qr.createSvgTag({ cellSize, margin, scalable: true });
    const svg = target.querySelector('svg');
    svg?.setAttribute('aria-label', '學員加入 QR Code');
    svg?.setAttribute('role', 'img');
  } catch {
    target.textContent = 'QR Code 無法產生，請使用網址加入';
  }
}

// 去國籍化 · 四象限完全分散（右上 -> 右下 -> 左下 -> 左上）與真實答案靶心定義
const GEO_ROUNDS_DATA = [
  {
    // ROUND 1 -> 第一象限（右上：X=78, Y=82）
    location: '海外併購 · Alpha 精密研發中心',
    target: { x: 78, y: 82, zone: '第一象限（右上）：共識型決策 × 階層制' },
    title: '沉默的正式會議與消失的測試數據',
    context: '併購 Alpha 晶圓封裝廠的第三週，你在週一全體正式會議上提出「縮短高溫老練測試 20% 工時」的新方案。會議中你詢問有無異議，在場 12 位當地主管與資深技師全數低頭抄筆記，資深總工僅微笑點頭說：「我們會盡力研究。」然而到了週三早上，產線一動也沒動；同時你經過茶水間時，聽見資深總工正嚴厲斥責一位昨晚直接寫信給你提供修改建議的年輕工程師「不懂規矩、破壞團隊程序」。',
    prompt: '請根據組織行為線索判斷對方文化類型，並由組長在四象限中釘出最契合的領導座標。',
    verdict: '第一象限（右上）：高權力距離（階層制）× 高共識校準（Consensual）',
    analysis: '依據 HBR〈Being the Boss〉跨文化領導矩陣，此組織兼具「嚴明的職級尊卑（高 X）」與「全員共識決策（高 Y）」。資深總工斥責越級報告的年輕工程師，體現了對正式階層秩序的維護；而正式會議上全員沉默、會後卻未執行，則是因為在該文化中，正式會議僅是最終「蓋章確認」的儀式，真正的決策必須在會前依循職級序列，逐一與各部門幹部進行非正式的私下溝通與校準（即日本組織的「根回 Nemawashi」與「稟議制」）。',
    blindspot: '第一象限的關鍵管理原則：領導者必須尊重既有職級結構，先透過資深主管在會前由下而上凝聚各部門共識，待全員校準完成後再召開正式會議拍板，方能確保決策徹底落實。'
  },
  {
    // ROUND 2 -> 第四象限（右下：X=84, Y=18）
    location: '海外量產 · Beta 核心試產基地',
    target: { x: 84, y: 18, zone: '第四象限（右下）：由上而下速決 × 階層制' },
    title: '良率暴跌夜的群組風暴',
    context: 'Beta 廠夜班試產發生塗佈異常，良率瞬間掉到 48%。資深廠長主張立刻停線洗機，但試產組的幾位工程師在工作群組裡激烈爭辯，雙方在群組裡互相指責誰該為交貨延誤負全責。產線領班站在機台旁不知所措，私訊問你：「現在到底該聽誰的？請給我們一個明確的裁示，否則沒人敢動手！」',
    prompt: '面對倒數 4 小時的交貨危機與團隊對權責歸屬的焦慮，組長應將決策模式釘在哪個座標？',
    verdict: '第四象限（右下）：高權力距離（階層制）× 由上而下速決（Top-Down）',
    analysis: '依據 HBR 跨文化矩陣，此情境屬於典型的「第四象限（右下：階層制 × 由上而下）」。從團隊爭執「誰該負全責」以及領班請求「給出明確裁示，否則沒人敢動手」的線索可知，在高度階層化且強調由上而下指令的組織中，基層員工在危機時刻仰賴最高領導者展現權威、直接下達明確指令（Director 模式），並由領導者一肩扛起決策成敗的最終責任。',
    blindspot: '第四象限的關鍵管理原則：在高度權力距離與速決導向的環境中，最高主管應快速聽取關鍵資訊後果斷拍板、明確劃分執行步驟並親自承擔風險，才能迅速穩定軍心。'
  },
  {
    // ROUND 3 -> 第三象限（左下：X=22, Y=24）
    location: '新創研發 · Gamma 高速運算實驗室',
    target: { x: 22, y: 24, zone: '第三象限（左下）：由上而下速決 × 平等主義' },
    title: '被工程師直接推翻的封版時程',
    context: '距離雲端晶片韌體封版只剩 36 小時，Gamma 實驗室的一名年輕核心工程師在站立會議（Stand-up Meeting）上直接對你說：「你昨天定的架構太保守了，我昨晚自己寫了一個非正式的新演算法原型，雖然還有 15% 的邊界條件沒測完，但效能可以提升兩倍！我們現在就先推上線試跑，有問題明天再動態修補（Hotfix）！」在場其他成員紛紛附和說值得賭一把，但品保主管則看向你等待最終定奪。',
    prompt: '面對扁平直接、崇尚快速試錯的團隊文化，組長應將此刻的領導決策模式釘在哪個座標？',
    verdict: '第三象限（左下）：低權力距離（平等主義）× 由上而下敏捷速決（小 d Top-Down）',
    analysis: '依據 HBR 跨文化矩陣，此組織展現了「第三象限（左下：平等主義 × 由上而下速決）」的典型特徵（文獻原型如美國矽谷與英國團隊）。年輕工程師敢在會議上直接挑戰主管並自發開發原型，反映出極低的權力距離（低 X）；而團隊習慣「先快速拍板上線、事後再根據市場反應動態修正」，正是文獻中定義的「小 d（little-d）由上而下速決模式」（低 Y）。',
    blindspot: '第三象限的關鍵管理原則：在扁平且講究速度的文化中，領導者應鼓勵成員平等發言，但無須耗時追求全員 100% 共識；領導者或授權負責人應迅速做出「小 d」裁決並保留後續敏捷修正的彈性。'
  },
  {
    // ROUND 4 -> 第二象限（左上：X=18, Y=85）
    location: '全球首發 · Delta 戰略客戶攤牌現場',
    target: { x: 18, y: 85, zone: '第二象限（左上）：共識型決策 × 平等主義' },
    title: '首發登台前兩小時的極限攤牌',
    context: '全球發表會倒數兩小時，最大客戶端技術長帶著兩名年輕的基層測試員直接走進後台休息室，將一份剛測出的「極端低溫環境訊號衰減報告」放在桌上。客戶方的年輕基層測試員直接看著你說：「在我們的團隊裡，每一位技術人員都有權為安全把關。我們不在乎你的職銜高低或商業賠償金，這份數據如果不由雙方所有工程師坐下來公開透明共同審核並達成一致協議，我們不會簽署放行。」',
    prompt: '面對基層專業人員擁有同等發言權且堅持全員透明共審的團隊，組長應將領導落點釘在哪裡？',
    verdict: '第二象限（左上）：極低權力距離（平等主義）× 全員透明共識（Consensual）',
    analysis: '依據 HBR 跨文化矩陣，此情境屬於「第二象限（左上：平等主義 × 共識型決策）」（文獻原型為荷蘭 Polder Model 與北歐組織）。基層測試員能與技術長平起平坐並直接主導談判，證明職級頭銜在此文化中毫無特權（極低 X）；而堅持「所有相關人員公開透明共同審核並達成一致協議」，則體現了高度共識導向（極高 Y）。',
    blindspot: '第二象限的關鍵管理原則：面對高平等、高共識文化，威權命令或私下與高層妥協皆無效；領導者必須轉化為「促進者（Facilitator）」，讓各層級利害關係人平起平坐、公開透明地共同制定解決方案。'
  }
];

// 紀錄 5 組學員送來的精確座標 { "${roundIndex}_${groupId}": { x, y } }
const groupPins = {};

// 根據歐幾里得距離 d 計算得分（計分從 0 開始，越靠近分數越高，越遠分數越低，滿分 100 分）
function calcGeoScore(gx, gy, tx, ty) {
  const dist = Math.round(Math.hypot(gx - tx, gy - ty));
  const roundScore = Math.max(0, Math.round(100 - dist));
  let tier = '嚴重偏離';
  if (dist <= 15) {
    tier = '完美命中';
  } else if (dist <= 30) {
    tier = '精準落點';
  } else if (dist <= 50) {
    tier = '方向尚可';
  } else if (dist <= 75) {
    tier = '象限偏差';
  }
  return { dist, roundScore, cqDelta: roundScore, tier, accuracy: roundScore };
}

let state = null;
let lastSignature = '';
let selectedReview = 'B';
let busy = false;
let previousReveal = '';
let confirmResolve;

// 防回合倒退單調鎖
let highestEpoch = '';
let highestRoundIndex = 0;
let highestRevision = 0;

function ask(title, text, label = '確認') {
  const modal = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-text').textContent = text;
  $('#confirm-yes').textContent = label;
  modal.showModal();
  return new Promise(resolve => {
    confirmResolve = resolve;
  });
}

function closeConfirm(value) {
  $('#confirm-dialog').close();
  confirmResolve?.(value);
  confirmResolve = null;
}

$('#confirm-yes').addEventListener('click', () => closeConfirm(true));
$('#confirm-no').addEventListener('click', () => closeConfirm(false));
$('#confirm-dialog').addEventListener('cancel', e => {
  e.preventDefault();
  closeConfirm(false);
});

function render() {
  const r = state.round;
  const revealed = ['revealed', 'finished'].includes(state.phase);
  const revealKey = revealed ? `${state.epoch}:${state.roundIndex}` : '';
  const animate = revealed && previousReveal !== revealKey;
  previousReveal = revealKey;
  if (animate) playRevealDrum();

  document.body.classList.toggle('is-revealed', revealed);
  document.documentElement.style.setProperty('--accent', r.color);

  const sortedByScore = state.groups.slice().sort((a, b) => (b.cq ?? 0) - (a.cq ?? 0));
  const kingGid = (sortedByScore[0]?.cq ?? 0) > 0 ? sortedByScore[0]?.id : null;

  const cqStripHtml = state.groups.map(g => {
    const pts = g.cq ?? 0;
    if (revealed) {
      const res = state.results?.[g.id];
      const delta = res?.actualDelta ?? res?.roundScore ?? 0;
      const isKing = g.id === kingGid;
      const kingBadge = isKing ? '<span class="navigator-crown-pill" style="background:#fef3c7; color:#b45309; border:1px solid #f59e0b; font-weight:700;">文化王</span>' : '';
      const animClass = animate && delta > 0 ? 'cq-heal-glow' : '';
      return `<div class="cq-group card ${isKing ? 'is-navigator' : ''} ${animClass}">
        <div class="cq-group-head">
          <span class="group-label">第 ${g.id} 組 ${kingBadge}</span>
          <div class="cq-value">${pts}<small style="font-size:11px; margin-left:3px; color:#92400e; font-weight:700;">分</small></div>
        </div>
        <div class="health-track" role="progressbar" aria-label="第 ${g.id} 組文化積分" aria-valuenow="${pts}" aria-valuemin="0" aria-valuemax="400">
          <div class="health-fill" style="width:${Math.min(100, Math.round((pts / 400) * 100))}%; background:#d97706;"></div>
        </div>
        ${animate && delta !== undefined ? `<span class="cq-float">+${delta} 分</span>` : ''}
      </div>`;
    } else {
      const isDone = Boolean(g.submitted);
      return `<div class="cq-group card">
        <div class="cq-group-head">
          <span class="group-label">第 ${g.id} 組</span>
          <span class="status-pill ${isDone ? 'done' : 'pending'}" style="${isDone ? 'background:#ecfdf5; color:#065f46;' : 'background:#fef3c7; color:#92400e;'} font-size:11.5px; font-weight:700; padding:2px 8px; border-radius:6px;">
            ${isDone ? '已鎖定' : '討論中'}
          </span>
        </div>
        <div style="font-size:12px; color:#78716c; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
          <span>目前累計：<strong style="color:#d97706;">${pts} 分</strong></span>
          <strong style="color:#44403c;">${g.count || 0} 人在線</strong>
        </div>
      </div>`;
    }
  }).join('');

  $('#app').innerHTML = `
    <section class="cq-strip" aria-label="5 組文化積分即時榜">${cqStripHtml}</section>
    ${roundNav(state.roundIndex)}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成 · 帶著跨文化洞察力，回到下一場真實對話。</div>' : ''}
    ${revealed ? resultsMarkup() : scenarioMarkup()}
  `;

  // 繪製右欄常駐 mini QR Code
  paintQr($('#stage-qr-code'), resolveJoinUrl(), 3, 4);

  document.querySelector('.host-controls')?.remove();
  const controls = document.createElement('footer');
  controls.className = 'host-controls';
  controls.innerHTML = `
    <div class="timer-wrap">
      ${revealed ? `
        <span class="clock">${String(state.roundIndex + 1).padStart(2, '0')} / 04</span>
        <span class="timer-label">${state.phase === 'finished' ? '課堂已完成' : '本回合已揭曉'}</span>
      ` : `
        <span class="clock" data-clock>--:--</span>
        <div class="timer-label">
          <strong data-debate>小組討論時間</strong>
          ${state.deadline ? '倒數進行中' : state.remaining !== null ? '計時已暫停' : '準備好，就開始'}
        </div>
      `}
      ${state.phase === 'voting' ? `
        <button class="icon-button" data-host-action="timer" aria-label="${state.deadline ? '暫停' : '繼續'}計時">
          ${state.deadline ? 'Ⅱ' : '▷'}
        </button>
      ` : ''}
    </div>
    <div class="control-right">
      <span class="control-note">
        ${revealed ? '每一個決策，都是一次跨文化理解的練習。' : state.phase === 'voting' ? '各組於手機點擊四象限插旗，離真實文化靶心越近得分越高。' : '邀請學員掃碼加入，5 組皆為戰略決策組。'}
      </span>
      ${state.roundIndex < 3 && !revealed ? `
        <button class="button quiet" data-host-action="skip-next" type="button" title="直接跳轉至下一回合">跳下一回合 ⏭</button>
      ` : ''}
      ${state.phase === 'finished' ? `
        <button class="button secondary" id="finish-manage">課堂管理</button>
      ` : `
        <button class="button primary" data-host-action="${revealed ? 'next' : state.phase === 'voting' ? 'reveal' : 'start'}">
          ${revealed ? (state.roundIndex === 3 ? '完成本次課堂' : '進入下一回合') : state.phase === 'voting' ? '揭曉座標與計分' : '開始本回合討論'}
          <span aria-hidden="true">${state.phase === 'voting' ? '↗' : '→'}</span>
        </button>
      `}
    </div>
  `;
  document.body.append(controls);

  document.querySelectorAll('[data-host-action]').forEach(el => el.addEventListener('click', () => hostAction(el.dataset.hostAction)));
  document.querySelectorAll('[data-nav-step]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const target = Number(el.dataset.navStep);
      if (Number.isInteger(target) && target >= 0 && target <= 3 && target !== state.roundIndex) {
        hostAction('jump', { roundIndex: target });
      }
    });
  });
}

function scenarioMarkup() {
  const geoRound = GEO_ROUNDS_DATA[state.roundIndex] || GEO_ROUNDS_DATA[0];
  const totalStudents = state.groups.reduce((n, g) => n + (g.count || 0), 0);

  return `
    <div class="voting-stage-grid" style="grid-template-columns: 1.4fr 1fr; gap: 20px;">
      <!-- 左欄：大字聚焦題目與去國籍化真實情境 -->
      <div class="voting-left-col">
        <section class="card" style="padding:28px 32px; height:100%; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="topic-row" style="margin-bottom:14px; justify-content:space-between;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="topic-badge">ROUND 0${state.roundIndex + 1} / 04</span>
                <span class="topic-location" style="font-size:13px; font-weight:700; color:var(--ink);">${esc(geoRound.location)}</span>
              </div>
              <span class="pill" style="background:var(--oat); color:var(--muted);">小組討論與座標盲測</span>
            </div>

            <h1 style="font-size:clamp(26px, 2.5vw, 36px); line-height:1.3; font-weight:850; margin:0 0 16px; color:#1c1917;">
              ${esc(geoRound.title)}
            </h1>

            <div style="background:#faf8f5; border:1.5px solid var(--line); border-radius:16px; padding:22px 26px; margin-bottom:20px;">
              <div class="eyebrow" style="margin-bottom:8px;">CASE SCENARIO · 現場實況描述</div>
              <p style="font-size:clamp(17px, 1.45vw, 20.5px); line-height:1.8; color:#1c1917; font-weight:500; margin:0;">
                ${esc(geoRound.context)}
              </p>
            </div>
          </div>

          <div class="question-prompt" style="margin:0 !important; background:#fffbeb; border:1.5px solid #f59e0b; border-left:6px solid #d97706; padding:18px 22px; border-radius:14px;">
            <span class="prompt-badge" style="background:#d97706; color:#fff; font-size:12px; font-weight:800; padding:4px 8px; border-radius:6px; margin-right:8px;">決策課題</span>
            <span class="prompt-text" style="font-size:16.5px; font-weight:700; color:#451a03;">${esc(geoRound.prompt)}</span>
          </div>
        </section>
      </div>

      <!-- 右欄：四象限盲測雷達 ＋ 邊欄精簡插旗進度與 QR Code -->
      <div class="voting-right-col" style="display:flex; flex-direction:column; gap:14px; justify-content:space-between;">
        <section class="card" style="padding:18px 20px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div>
              <div class="eyebrow">CULTURAL GEOGUESSR RADAR</div>
              <h2 style="font-size:18px; font-weight:800; margin:2px 0 0;">四象限領導落點雷達</h2>
            </div>
            <div id="stage-qr-code" class="qr-mini-box" title="點擊放大 QR Code 掃碼入席" onclick="document.getElementById('qr-open')?.click()"></div>
          </div>

          <div class="quadrant-axis-header">▲ 共識型決策 Consensual (Y: 100)</div>
          <div class="quadrant-board" style="flex:1; min-height:210px; position:relative;">
            <div class="q-cell q-tl"><span class="q-zone-name">左上：共識 × 平等</span></div>
            <div class="q-cell q-tr"><span class="q-zone-name">右上：共識 × 階層</span></div>
            <div class="q-cell q-bl"><span class="q-zone-name">左下：由上而下 × 平等</span></div>
            <div class="q-cell q-br"><span class="q-zone-name">右下：由上而下 × 階層</span></div>
            <div class="q-axis-h"></div>
            <div class="q-axis-v"></div>
            <div style="position:absolute; inset:0; display:grid; place-items:center; pointer-events:none;">
              <div style="background:rgba(28,25,23,0.88); color:#fff; padding:10px 18px; border-radius:14px; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,0.2);">
                <strong style="font-size:14px; display:block; color:#facc15; margin-bottom:4px;">座標盲測進行中</strong>
                <span style="font-size:12px; color:#e7e5e4;">各組在手機象限圖插旗鎖定後，揭曉時公開真實靶心與誤差連線</span>
              </div>
            </div>
          </div>
          <div class="quadrant-axis-footer">
            <span>◀ 平等主義 Egalitarian (X: 0)</span>
            <span>▼ 由上而下 Top-Down (Y: 0)</span>
            <span>階層制 Hierarchical (X: 100) ▶</span>
          </div>
        </section>

        <!-- 整合在邊邊的 5 組插旗進度 -->
        <section class="progress-card card" style="padding:16px 20px; margin-top:0;">
          <div class="progress-intro" style="min-width:auto; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h2 style="font-size:14px; margin:0; font-weight:800;">各組插旗進度 <small style="font-weight:500; color:var(--muted);">(${totalStudents} 人在線)</small></h2>
              <div class="stat-number" style="font-size:20px; font-weight:800;">${state.completed} / 5 組</div>
            </div>
            <p style="font-size:11.5px; color:var(--muted); margin:4px 0 0;">
              ${state.completed >= 5 ? '5 組皆已鎖定落點！可按右下方揭曉靶心與計分' : '各組由代表於手機點擊四象限插旗鎖定…'}
            </p>
          </div>
          <div class="progress-chips-row" style="display:flex; gap:6px; flex-wrap:wrap;">
            ${state.groups.map(g => `
              <div class="progress-chip ${g.submitted ? 'is-done done' : g.count ? 'is-active' : ''}" style="flex:1; padding:6px 8px; font-size:11.5px; text-align:center;">
                <span class="chip-name" style="font-weight:700;">G${g.id}</span>
                <span class="chip-status" style="margin-left:4px;">${g.submitted ? '已鎖定' : g.count ? '討論中' : '未入席'}</span>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  `;
}

function resultsMarkup() {
  const geoRound = GEO_ROUNDS_DATA[state.roundIndex] || GEO_ROUNDS_DATA[0];
  const target = geoRound.target;
  const targetTop = 100 - target.y;

  // 整理 5 組的落點座標與距離計分
  const fallbackCoords = { A: { x: 25, y: 75 }, B: { x: 75, y: 75 }, C: { x: 25, y: 25 }, D: { x: 75, y: 25 }, X: { x: 50, y: 15 } };
  const groupEvaluations = state.groups.map(g => {
    const res = state.results?.[g.id];
    const customPin = groupPins[`${state.roundIndex}_${g.id}`];
    const pickedOpt = state.distribution?.find(o => o.id === res?.id);
    const optCoord = pickedOpt?.result?.quadrant || fallbackCoords[res?.id];
    const hasSubmitted = Boolean(customPin || res?.id);

    if (!hasSubmitted) {
      return { id: g.id, submitted: false, dist: null, roundScore: 0, cqDelta: 0, tier: '未提交', accuracy: 0, totalCq: g.cq ?? 0 };
    }

    const offset = (g.id - 3) * 3;
    const gx = customPin ? customPin.x : Math.max(8, Math.min(92, (optCoord?.x ?? 50) + offset));
    const gy = customPin ? customPin.y : Math.max(8, Math.min(92, (optCoord?.y ?? 50) - offset));
    const scoreInfo = calcGeoScore(gx, gy, target.x, target.y);

    return {
      id: g.id,
      submitted: true,
      x: gx,
      y: gy,
      top: 100 - gy,
      ...scoreInfo,
      totalCq: g.cq ?? 0
    };
  });

  // 繪製每組旗幟到真實靶心的虛線
  const svgLines = groupEvaluations.filter(g => g.submitted).map(n => `
    <line x1="${n.x}%" y1="${n.top}%" x2="${target.x}%" y2="${targetTop}%"
      stroke="${n.roundScore >= 80 ? '#16a34a' : n.roundScore >= 50 ? '#d97706' : '#dc2626'}"
      stroke-width="2.5" stroke-dasharray="5 4" opacity="0.85" />
  `).join('');

  // 繪製 5 組的插旗位置
  const flagsHtml = groupEvaluations.filter(g => g.submitted).map(n => `
    <div class="geo-group-flag" style="left:${n.x}%; top:${n.top}%; z-index:9;" title="第 ${n.id} 組 (${n.x}, ${n.y}) · 距離誤差 ${n.dist}">
      <span class="flag-badge" style="background:${n.roundScore >= 80 ? '#15803d' : n.roundScore >= 50 ? '#b45309' : '#b91c1c'}; color:#fff; border-color:#fff;">
        G${n.id} <small>(${n.x}, ${n.y})</small>
      </span>
    </div>
  `).join('');

  return `
    <!-- 頂部揭曉橫條 -->
    <div class="reveal-top-strip is-good" style="background:#fffbeb; border-color:#f59e0b; color:#78350f; padding:12px 20px;">
      <div class="reveal-strip-left">
        <span class="topic-badge" style="background:#d97706; color:#fff; padding:4px 8px;">ROUND 0${state.roundIndex + 1} 座標揭曉</span>
        <strong style="margin-left:10px;">真實最佳文化靶心：(${target.x}, ${target.y}) — ${esc(target.zone)}</strong>
      </div>
      <div class="reveal-strip-right">
        <span>計分從 0 開始 · 越靠近靶心分數越高（滿分 100 分）</span>
      </div>
    </div>

    <!-- 左右雙欄：左欄 (44% 雷達開獎地圖 + 5組距離計分榜) / 右欄 (56% 題目解釋與文獻盲點拆解) -->
    <div class="results-focus-grid" style="grid-template-columns: 44% 1fr; gap: 16px;">
      
      <!-- 左欄：四象限落點雷達圖 + 5 組距離同時計分榜 -->
      <div class="results-side-col">
        <section class="card side-matrix-card" style="padding:14px 16px !important;">
          <div class="section-heading" style="margin-bottom:6px;">
            <h2>各組落點 vs. 真實答案位置</h2>
            <span style="font-weight:700; color:#15803d;">靶心：(${target.x}, ${target.y})</span>
          </div>
          <div class="quadrant-axis-header">▲ 共識型決策 Consensual (100)</div>
          <div class="quadrant-board" style="height:clamp(200px, 26vh, 260px) !important; position:relative;">
            <div class="q-cell q-tl"><span class="q-zone-name">共識 × 平等區</span></div>
            <div class="q-cell q-tr"><span class="q-zone-name">共識 × 階層區</span></div>
            <div class="q-cell q-bl"><span class="q-zone-name">由上而下 × 平等區</span></div>
            <div class="q-cell q-br"><span class="q-zone-name">由上而下 × 階層區</span></div>
            <div class="q-axis-h"></div>
            <div class="q-axis-v"></div>

            <!-- 誤差連線 SVG -->
            <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:3;">
              ${svgLines}
            </svg>

            <!-- 真實答案黃金靶心 -->
            <div class="matrix-point is-best" style="left:${target.x}%; top:${targetTop}%; z-index:10; transform:translate(-50%,-50%) scale(1.1); border:2.5px solid #15803d; box-shadow:0 0 0 6px rgba(22,163,74,0.25);">
              <span class="matrix-node-letter" style="background:#15803d; color:#fff;">正</span>
              <span class="matrix-node-title" style="color:#14532d; font-weight:900;">(${target.x}, ${target.y})</span>
            </div>

            <!-- 5 組插旗位置 -->
            ${flagsHtml}
          </div>
          <div class="quadrant-axis-footer">
            <span>◀ 平等主義 (0)</span>
            <span>▼ 由上而下 (0)</span>
            <span>階層制 (100) ▶</span>
          </div>
        </section>

        <!-- 5 組距離與同時計分明細榜 -->
        <section class="card side-scoreboard-card" style="padding:14px 16px;">
          <div class="side-score-head" style="margin-bottom:8px;">
            <h2>5 組落點距離與得分榜</h2>
            <span>離靶心越近得分越高（滿分 100 分）</span>
          </div>
          <div class="compact-score-list">
            ${groupEvaluations
              .slice()
              .sort((a, b) => (b.roundScore ?? 0) - (a.roundScore ?? 0))
              .map((g, idx) => `
                <div class="compact-score-row ${idx === 0 && g.submitted ? 'is-nav' : ''}" style="padding:6px 10px;">
                  <div class="c-group">
                    <strong>第 ${g.id} 組</strong>
                    ${g.submitted ? `<small class="muted">(${g.x}, ${g.y}) · 累計 ${g.totalCq} 分</small>` : '<small class="muted">未插旗</small>'}
                  </div>
                  <div class="c-badges">
                    ${g.submitted ? `<span class="score-pill initial" style="font-size:11px;">誤差 ${g.dist}</span>` : ''}
                    <span class="score-pill ${g.roundScore >= 80 ? 'synergy' : g.roundScore >= 50 ? 'rescue' : 'negative'}" style="font-size:11px;">${g.tier}</span>
                  </div>
                  <div class="c-total">
                    <span class="c-delta positive-text" style="font-weight:800; font-size:13.5px;">
                      +${g.roundScore} 分
                    </span>
                  </div>
                </div>
              `).join('')}
          </div>
        </section>
      </div>

      <!-- 右欄：題目深度解釋與文獻盲點拆解 -->
      <section class="card results-main-review" style="padding:22px 26px !important;">
        <div class="review-main-header">
          <div>
            <div class="eyebrow">CASE DEBRIEF · 文獻理論與行為線索解析</div>
            <h2 style="font-size:20px; margin:4px 0 0;">為什麼真實座標落在「${esc(target.zone)}」？</h2>
          </div>
        </div>

        <div class="review-main-body" style="display:flex; flex-direction:column; gap:14px; margin-top:12px;">
          <div class="debrief-hero-box is-optimal" style="padding:16px 20px; border-radius:14px; background:#f0fdf4; border:1.5px solid #86efac;">
            <div class="debrief-meta-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span class="debrief-opt-tag" style="background:#15803d; color:#fff; font-size:12px; font-weight:800; padding:3px 8px; border-radius:6px;">正解座標：(${target.x}, ${target.y})</span>
              <span class="review-zone-badge" style="font-size:12px; font-weight:700; color:#166534;">${esc(target.zone)}</span>
            </div>
            <h3 class="debrief-verdict-title" style="font-size:16px; font-weight:800; color:#14532d; margin:0 0 6px;">${esc(geoRound.verdict)}</h3>
            <p class="debrief-analysis-text" style="font-size:14px; line-height:1.75; color:#166534; margin:0;">${esc(geoRound.analysis)}</p>
          </div>

          <div class="debrief-blindspot-card" style="padding:16px 20px; border-radius:14px; background:#fffbeb; border:1.5px solid #f59e0b;">
            <div class="eyebrow" style="font-size:11px; font-weight:800; color:#b45309; margin-bottom:6px;">該象限關鍵管理原則（文獻理論依據）</div>
            <p class="debrief-blindspot-text" style="font-size:14px; line-height:1.75; color:#78350f; font-weight:600; margin:0;">${esc(geoRound.blindspot)}</p>
          </div>
        </div>
      </section>

    </div>
  `;
}

async function hostAction(action, extra = {}) {
  if (busy) return;
  if (action === 'skip-next') {
    if (!await ask('跳至下一回合', '確定要直接跳轉至下一回合嗎？', '確認跳轉')) return;
    busy = true;
    document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = true);
    try {
      const target = Math.min(3, (state?.roundIndex ?? 0) + 1);
      highestRoundIndex = target;
      setSyncRoundLock(highestRoundIndex, highestEpoch);
      const res = await api('jump', { roundIndex: target, autoStart: true }, 'host');
      if (res && res.roundIndex !== undefined) {
        if (res.epoch) highestEpoch = res.epoch;
        res.clockOffset = (res.serverTime || Date.now()) - Date.now();
        state = res;
        lastSignature = JSON.stringify({ ...res, serverTime: 0, clockOffset: 0 });
        render();
      } else {
        lastSignature = '';
        await refresh();
      }
      broadcastSync('host_action', { action: 'jump', roundIndex: target });
      toast(`已切換至第 ${target + 1} 回合討論 ✓`);
    } catch (e) {
      toast(e.message);
      await refresh();
    } finally {
      busy = false;
      document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = false);
    }
    return;
  }
  if (action === 'jump') {
    if (!await ask('切換回合', `確定要直接切換至第 ${extra.roundIndex + 1} 回合嗎？`, '立即切換')) return;
    busy = true;
    document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = true);
    try {
      highestRoundIndex = extra.roundIndex;
      setSyncRoundLock(highestRoundIndex, highestEpoch);
      const res = await api('jump', { roundIndex: extra.roundIndex, autoStart: true }, 'host');
      if (res && res.roundIndex !== undefined) {
        if (res.epoch) highestEpoch = res.epoch;
        res.clockOffset = (res.serverTime || Date.now()) - Date.now();
        state = res;
        lastSignature = JSON.stringify({ ...res, serverTime: 0, clockOffset: 0 });
        render();
      } else {
        lastSignature = '';
        await refresh();
      }
      broadcastSync('host_action', { action: 'jump', roundIndex: extra.roundIndex });
      toast(`已切換至第 ${extra.roundIndex + 1} 回合討論 ✓`);
    } catch (e) {
      toast(e.message);
      await refresh();
    } finally {
      busy = false;
      document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = false);
    }
    return;
  }
  if (action === 'next') {
    busy = true;
    document.querySelectorAll('[data-host-action]').forEach(el => {
      el.disabled = true;
      if (el.dataset.hostAction === 'next') el.textContent = '正在切換下一回合…';
    });
    try {
      const targetRound = Math.min(3, (state?.roundIndex ?? 0) + 1);
      highestRoundIndex = targetRound;
      setSyncRoundLock(highestRoundIndex, highestEpoch);
      const latest = await api('next', { force: true, autoStart: true, ...extra }, 'host');
      if (latest && latest.roundIndex !== undefined) {
        if (latest.epoch) highestEpoch = latest.epoch;
        if (latest.roundIndex > highestRoundIndex) highestRoundIndex = latest.roundIndex;
        latest.clockOffset = (latest.serverTime || Date.now()) - Date.now();
        state = latest;
        lastSignature = JSON.stringify({ ...latest, serverTime: 0, clockOffset: 0 });
        render();
        broadcastSync('host_action', { action: 'next', roundIndex: latest.roundIndex });
        toast(latest.phase === 'finished' ? '四回合已全部完成！' : `已進入第 ${latest.roundIndex + 1} 回合討論 ✓`);
      } else {
        lastSignature = '';
        await refresh();
      }
    } catch (e) {
      toast(e.message);
      await refresh();
    } finally {
      busy = false;
      document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = false);
    }
    return;
  }
  if (action === 'reveal') {
    busy = true;
    try {
      const latest = await api('state', undefined, 'host');
      state = { ...latest, clockOffset: latest.serverTime - Date.now() };
    } catch (e) {
      toast(e.message);
      busy = false;
      return;
    }
    busy = false;
    if (state.completed < 5) {
      if (!await ask('仍有組別正在討論', `目前 ${state.completed} / 5 組已鎖定座標。現在揭曉會結束本回合插旗，確定要進行揭曉嗎？`, '結束並揭曉')) return;
      extra.confirmIncomplete = true;
    }
  }
  busy = true;
  document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = true);
  try {
    const res = await api(action, extra, 'host');
    if (action === 'reset' && res?.epoch) {
      highestEpoch = res.epoch;
      highestRoundIndex = 0;
      highestRevision = res.revision || 0;
      resetSyncRoundLock(res.epoch);
    }
    broadcastSync('host_action', { action, roundIndex: state?.roundIndex });
    if (res && res.roundIndex !== undefined) {
      res.clockOffset = (res.serverTime || Date.now()) - Date.now();
      state = res;
      lastSignature = JSON.stringify({ ...res, serverTime: 0, clockOffset: 0 });
      render();
    } else {
      lastSignature = '';
      await refresh();
    }
  } catch (e) {
    toast(e.message);
    await refresh();
  } finally {
    busy = false;
    document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = false);
  }
}

async function refresh() {
  try {
    const next = await api('state', undefined, 'host');
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

    // 收集服務端返回的 pins
    if (Array.isArray(next.pins)) {
      next.pins.forEach(p => {
        if (p.pinX !== null && p.pinY !== null && p.pinX !== undefined && p.pinY !== undefined) {
          groupPins[`${next.roundIndex}_${p.id}`] = { x: Number(p.pinX), y: Number(p.pinY) };
        }
      });
    }

    next.clockOffset = next.serverTime - Date.now();
    const signature = JSON.stringify({ ...next, serverTime: 0, clockOffset: 0 });
    state = next;
    status(true);
    if (signature !== lastSignature) {
      lastSignature = signature;
      render();
    }
  } catch (e) {
    status(false);
  }
}

document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => document.getElementById(el.dataset.close).close()));
$('#qr-open').addEventListener('click', () => {
  if (!state) return;
  const joinUrl = resolveJoinUrl();
  $('#qr-url').textContent = joinUrl;
  $('#qr-code').innerHTML = '';
  paintQr($('#qr-code'), joinUrl, 6, 24);
  $('#qr-note').textContent = joinUrl !== state.joinUrl
    ? '目前為本機預覽，QR Code 已改指向正式線上網址。'
    : '第 1～5 組皆為決策組。掃碼後填寫姓名加入。';
  $('#qr-dialog').showModal();
});

$('#copy-url').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resolveJoinUrl());
    toast('參與網址已複製');
  } catch {
    toast('請長按或選取網址複製');
  }
});

$('#sound-toggle')?.addEventListener('click', () => {
  const on = toggleSound();
  $('#sound-toggle').textContent = on ? '音效：開' : '音效：關';
  toast(on ? '倒數心跳與揭曉音效已開啟 ✓' : '大螢幕音效已靜音');
});

async function toggleCleanStage(forceState) {
  const next = typeof forceState === 'boolean' ? forceState : !document.body.classList.contains('clean-stage');
  document.body.classList.toggle('clean-stage', next);
  try {
    if (next && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    else if (!next && document.fullscreenElement) await document.exitFullscreen();
  } catch {}
  toast(next ? '已開啟 Clean Stage 沉浸投影模式' : '已退出沉浸投影模式');
}

$('#fullscreen')?.addEventListener('click', () => toggleCleanStage());
$('#exit-clean-stage')?.addEventListener('click', () => toggleCleanStage(false));

function openManage() {
  if (!state) return;
  $('#representatives').innerHTML = state.groups.map(g => `<div class="manage-row">
    <label for="rep-${g.id}">第 ${g.id} 組</label>
    <select id="rep-${g.id}" data-representative ${g.members.length ? '' : 'disabled'}>
      ${g.members.length ? g.members.map(m => `<option value="${m.id}" ${m.id === g.representative ? 'selected' : ''}>${esc(m.name)}</option>`).join('') : '<option>等待學員加入</option>'}
    </select>
  </div>`).join('');
  document.querySelectorAll('[data-representative]').forEach(select => select.addEventListener('change', async () => {
    select.disabled = true;
    try {
      await api('representative', { memberId: select.value }, 'host');
      toast('本組代表已更新');
      await refresh();
    } catch (e) {
      toast(e.message);
    } finally {
      select.disabled = false;
    }
  }));
  $('#manage-dialog').showModal();
}

$('#manage-open').addEventListener('click', openManage);
$('#reset').addEventListener('click', async () => {
  if (await ask('重新開始這堂課？', '將清除全部成員、投票、回合結果與 CQ，學員需要重新加入。此操作無法復原。', '清除並重新開始')) {
    $('#manage-dialog').close();
    highestEpoch = '';
    highestRoundIndex = 0;
    highestRevision = 0;
    resetSyncRoundLock();
    await hostAction('reset', { confirm: 'RESET' });
  }
});

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'group_vote') {
    const rIdx = packet.roundIndex ?? state.roundIndex;
    const gid = Number(packet.group);
    if (gid >= 1 && gid <= 5) {
      if (packet.pinX !== undefined && packet.pinY !== undefined) {
        groupPins[`${rIdx}_${gid}`] = { x: Number(packet.pinX), y: Number(packet.pinY) };
      }
      if (rIdx === state.roundIndex) {
        const g = state.groups?.find(grp => grp.id === gid);
        if (g) {
          g.submitted = true;
          state.completed = state.groups.filter(grp => grp.submitted).length;
          render();
        }
      }
    }
  } else if (packet.type === 'pitch_update') {
    state.pitch = packet.pitch;
  } else if (packet.type === 'host_action') {
    if (typeof packet.roundIndex === 'number' && packet.roundIndex > highestRoundIndex) {
      highestRoundIndex = packet.roundIndex;
      setSyncRoundLock(highestRoundIndex, highestEpoch);
    }
    refresh();
  }
});

async function poll() {
  await refresh();
  setTimeout(poll, document.hidden ? 5000 : 1500);
}

startClock(() => state, { enableAudio: true });
poll();
