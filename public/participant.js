import { $, esc, api, toast, status, startClock, broadcastSync, listenSync } from './common.js';

let state = null;
let lastSignature = '';
let selection = null;
let consensus = [null, null, null];
let roundKey = '';
let busy = false;
let online = false;
let pointsAllocated = {};
let recoveringSession = false;
let pendingNavChoice = null;
let pendingNavTimer = null;

// 防回合倒退鎖：記錄當前 epoch、最高 revision 與最高 roundIndex，徹底杜絕「第二回合閃退回第一回合」
let highestEpoch = '';
let highestRevision = -1;
let highestRoundIndex = -1;

// 針對四回合主題（「權威與共識」、「賦權與指導」、「大D與小d」、「四象限調適」）設計的極簡情境導讀
const ROUND_SCENARIOS = [
  {
    tag: 'ROUND 01 · 權威與共識',
    sceneTitle: '📍 斯德哥爾摩 × 東京：全球綠能物流啟動會議的「微笑沉默」',
    brief: '瑞典總部（強調平等與共識導向）的空降主管在東京分公司召開淨零物流啟動會，要求全體員工直接提出創新減碳方案。然而東京團隊全程鞠躬微笑、不發一語，會後卻遲遲不肯簽署時程確認書。',
    guide: '💡 核心決策：面對日方「階級森嚴卻追求共識（大 D）」的文化特徵，瑞典總部該採取何種決策破冰？'
  },
  {
    tag: 'ROUND 02 · 領導盲區（授權 vs 指揮）',
    sceneTitle: '📍 美國總部 × 北京合資廠：自主授權的「缺乏主動性」衝突',
    brief: '美國物流巨擘將總部的扁平化與自主授權帶入北京合資廠，抱怨中方員工「缺乏主動性」；中方員工則痛批主管開會前毫無腹案與明確指示是無能推諉。',
    guide: '💡 核心決策：面對「由上而下 ＋ 階級主義」的北京團隊，領導風格該如何精準轉型為指揮官模式？'
  },
  {
    tag: 'ROUND 03 · 決策哲學（石碑承諾 vs 動態速度）',
    sceneTitle: '📍 紐約總部 × 法蘭克福：石碑大 D 與小 d 動態的認知撕裂',
    brief: '美德聯合物流團隊開會拍板後，德國團隊花了三天三夜落實；幾天後美國老闆拿到新數據隨興要求換方向，德國團隊憤怒痛批美方雙面不誠實、摧毀承諾。',
    guide: '💡 核心決策：面對美德雙方對「大寫 D（承諾）」與「小寫 d（速度）」的哲學衝突，該建立何種雙軌協定？'
  },
  {
    tag: 'ROUND 04 · 四象限調適（全球淨零決戰）',
    sceneTitle: '📍 波士頓 × 東京 × 巴黎 × 北京：四方紅線終極交鋒',
    brief: '全球綠能快遞面臨最終淨零碳排上線關頭！波士頓要速度、東京要稟議、巴黎拒絕加班、北京要中央作戰清單。四方陷入終極死鎖，任一方拒絕即全面破局！',
    guide: '💡 核心決策：面對橫跨四大領導象限的四方衝突，如何動態切換領導座標以達成四方共贏？'
  }
];

const gate = $('#onboarding');
gate.addEventListener('cancel', e => {
  if (!state?.member) e.preventDefault();
});

function getRemainingPoints() {
  if (!state?.member) return 5;
  const myGroup = state.member.group;
  const used = Object.entries(pointsAllocated)
    .filter(([k]) => Number(k) !== myGroup)
    .reduce((sum, [, pts]) => sum + (Number(pts) || 0), 0);
  return Math.max(0, 5 - used);
}

function updateChoiceUI() {
  const hasVoted = Boolean(state?.vote?.choice);
  const isRep = Boolean(state?.member?.isRepresentative);

  document.querySelectorAll('[data-choice]').forEach(el => {
    el.setAttribute('aria-checked', String(el.dataset.choice === selection));
    if (hasVoted) {
      el.classList.add('locked');
      el.disabled = true;
    } else {
      el.classList.remove('locked');
      el.disabled = false;
    }
  });

  document.querySelectorAll('[data-consensus]').forEach(el => {
    el.setAttribute('aria-pressed', String(consensus[Number(el.dataset.consensus)] === (el.dataset.value === 'true')));
    el.disabled = hasVoted;
  });

  const submit = $('#submit-vote');
  if (submit) {
    submit.disabled = hasVoted || busy || !online || !isRep || !selection || (state?.roundIndex === 3 && consensus.some(x => x === null));
  }

  // 更新階段二：說服點數分配 UI
  const remaining = getRemainingPoints();
  const totalUsed = 5 - remaining;
  const counterEl = $('#remaining-pts-count');
  if (counterEl) counterEl.textContent = `${remaining} / 5 點`;

  document.querySelectorAll('[data-alloc-group]').forEach(row => {
    const gid = Number(row.dataset.allocGroup);
    const pts = Number(pointsAllocated[gid]) || 0;
    const valEl = row.querySelector('.alloc-value');
    if (valEl) valEl.textContent = String(pts);
    const plusBtn = row.querySelector('.alloc-btn.plus');
    if (plusBtn) plusBtn.disabled = busy || !isRep || remaining <= 0 || pts >= 3;
    const minusBtn = row.querySelector('.alloc-btn.minus');
    if (minusBtn) minusBtn.disabled = busy || !isRep || pts <= 0;
  });

  const submitPersuasion = $('#submit-persuasion');
  if (submitPersuasion) {
    submitPersuasion.disabled = busy || !online || !isRep || totalUsed < 1 || totalUsed > 5;
  }
}

function render() {
  const r = state?.round;
  const member = state?.member;
  if (!r || !member) return;

  const revealed = ['revealed', 'finished'].includes(state.phase);
  const key = `${state.epoch}:${state.roundIndex}`;

  // 當進入新回合時，徹底重置上一回合的選擇與配點狀態
  if (key !== roundKey) {
    selection = state.vote?.proposal || state.vote?.choice || null;
    consensus = Array.isArray(state.vote?.consensus) ? [...state.vote.consensus] : [null, null, null];
    pointsAllocated = { ...(state.myPersuasion || {}) };
    pendingNavChoice = null;
    roundKey = key;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (!selection && (state.vote?.proposal || state.vote?.choice)) {
    selection = state.vote.proposal || state.vote.choice;
    consensus = Array.isArray(state.vote?.consensus) ? [...state.vote.consensus] : [null, null, null];
  }

  if (state.myPersuasion && Object.keys(pointsAllocated).length === 0) {
    pointsAllocated = { ...state.myPersuasion };
  }

  document.documentElement.style.setProperty('--accent', r.color || '#d97706');

  const cq = state.group?.cq ?? 100;
  const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
  const isNav = state.chiefNavigator === member.group;
  const navBadge = isNav ? '<span class="navigator-crown-pill" style="margin-left:6px;">👑 首席領航者</span>' : '';

  const scenario = ROUND_SCENARIOS[state.roundIndex] || ROUND_SCENARIOS[0];
  const contextBrief = r.context || r.story || r.situation || scenario.brief;
  const hasDialogue = Array.isArray(r.dialogue) && r.dialogue.length > 0;

  // 頂部精簡組別與身份列
  const identityBar = `
    <div class="mobile-identity">
      <div class="identity-bar">
        <div class="identity-pill">
          <span class="identity-name">${esc(member.name)}</span>
          <span aria-hidden="true">｜</span>
          第 ${member.group} 組 ${navBadge}
        </div>
        <button type="button" class="switch-group-btn" id="open-switch-group" aria-label="更換組別">換組</button>
        <span class="rep-tag" style="${member.isRepresentative ? 'background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:99px; font-weight:700;' : ''}">
          ${member.isRepresentative ? '👑 本組代表' : '共同決策員'}
        </span>
      </div>
      <div class="mobile-health">
        <span class="health-label">本組 CQ 韌性</span>
        <div class="health-track" role="progressbar" aria-label="本組 CQ 韌性值" aria-valuenow="${cq}" aria-valuemin="0" aria-valuemax="150">
          <div class="health-fill ${cqClass}" style="width:${Math.min(100, Math.round((cq / 150) * 100))}%"></div>
        </div>
        <span class="cq-value">${cq}<small> CQ</small></span>
      </div>
    </div>
  `;

  // 極簡情境與衝突對話卡（不畫 JRPG 圖片與地圖，但保留關鍵現場對話與情境導讀，幫助學員一秒理解題目）
  const cleanQuestionBox = `
    <section class="card" style="padding:15px 16px; margin-bottom:12px; border:2px solid #f59e0b; border-left:6px solid #d97706; background:#fffbeb;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="topic-badge" style="background:#d97706; color:#fff; padding:2px 8px; border-radius:6px; font-size:12px; font-weight:700;">
          ${esc(scenario.tag)}
        </span>
        <span style="font-size:12px; color:#92400e; font-weight:700;">${esc(r.dimension || r.subtitle || '')}</span>
      </div>

      <!-- 輕量情境導讀 -->
      <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:10px 12px; margin-bottom:10px;">
        <div style="font-size:13px; font-weight:800; color:#92400e; margin-bottom:4px;">
          ${esc(r.title ? `📍 ${r.title}` : scenario.sceneTitle)}
        </div>
        <p style="font-size:12.5px; line-height:1.55; color:#451a03; margin:0;">
          ${esc(contextBrief)}
        </p>

        ${hasDialogue ? `
          <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #fcd34d; display:flex; flex-direction:column; gap:6px;">
            ${r.dialogue.map(line => `
              <div style="font-size:12.5px; line-height:1.45; color:#1c1917; background:rgba(255,255,255,0.75); padding:6px 9px; border-radius:6px;">
                <strong style="color:#b45309;">${esc(line.who)}：</strong>「${esc(line.text)}」
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="font-size:12px; color:#b45309; margin-top:6px; padding-top:6px; border-top:1px dashed #fcd34d; font-weight:600;">
          ${esc(scenario.guide)}
        </div>
      </div>

      <h1 style="font-size:16.5px; line-height:1.5; font-weight:800; color:#1c1917; margin:0;">
        ⚔️ 本回決策問題：${esc(r.prompt || r.question || r.title || '')}
      </h1>
    </section>
  `;

  $('#app').innerHTML = `
    ${identityBar}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成！感謝參與！</div>' : ''}
    ${cleanQuestionBox}
    ${revealed ? resultMarkup() : votingMarkup()}
  `;

  // 底部固定操作列（嚴格區分「本組代表」與「一般組員」）
  document.querySelector('.mobile-action')?.remove();
  const footer = document.createElement('footer');
  footer.className = 'mobile-action';

  const hasVoted = Boolean(state.vote?.choice);
  const isRep = Boolean(member.isRepresentative);
  let buttonHtml = '';

  if (revealed) {
    buttonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">${state.phase === 'finished' ? '本次課堂已完成 · 感謝參與' : '本回合已揭曉 · 請看大螢幕等待講師進入下一回'}</div>`;
  } else if (hasVoted) {
    const choiceLabel = state.vote.choice === 'X' ? '未達成協議' : `方案 ${state.vote.choice}`;
    buttonHtml = `<button id="submit-vote" class="button secondary wide locked-btn" type="button" disabled>✓ 本組初投已鎖定：${choiceLabel}</button>`;
  } else if (!isRep) {
    buttonHtml = `<button id="submit-vote" class="button secondary wide" type="button" disabled>👑 等待本組代表提交決策…（你可點擊預覽方案）</button>`;
  } else {
    const buttonText = selection ? `👑 代表本組鎖定：方案 ${selection} ↗` : '請選擇本組初投方案';
    buttonHtml = `<button id="submit-vote" class="button primary" type="button" ${!selection ? 'disabled' : ''}>${buttonText}</button>`;
  }

  footer.innerHTML = `<div class="mobile-action-inner">${buttonHtml}</div>`;
  document.body.append(footer);

  // 綁定階段一選項事件
  if (!hasVoted) {
    document.querySelectorAll('[data-choice]').forEach(el => el.addEventListener('click', () => {
      selection = el.dataset.choice;
      updateChoiceUI();
      const subBtn = $('#submit-vote');
      if (subBtn && isRep) subBtn.textContent = `👑 代表本組鎖定：方案 ${selection} ↗`;
    }));
    document.querySelectorAll('[data-consensus]').forEach(el => el.addEventListener('click', () => {
      consensus[Number(el.dataset.consensus)] = el.dataset.value === 'true';
      updateChoiceUI();
    }));
    $('#submit-vote')?.addEventListener('click', submitVote);
  }

  // 綁定階段二：說服點數加減按鈕
  document.querySelectorAll('[data-alloc-btn]').forEach(btn => btn.addEventListener('click', () => {
    if (!isRep) {
      toast('👑 由本組代表統一操作配點！');
      return;
    }
    const action = btn.dataset.allocBtn;
    const gid = Number(btn.dataset.group);
    const cur = Number(pointsAllocated[gid]) || 0;
    const remaining = getRemainingPoints();

    if (action === 'plus' && remaining > 0 && cur < 3) {
      pointsAllocated[gid] = cur + 1;
      updateChoiceUI();
    } else if (action === 'minus' && cur > 0) {
      pointsAllocated[gid] = cur - 1;
      if (pointsAllocated[gid] === 0) delete pointsAllocated[gid];
      updateChoiceUI();
    }
  }));

  $('#submit-persuasion')?.addEventListener('click', submitPersuasion);

  // 綁定階段三：首席領航者最終拍板按鈕
  document.querySelectorAll('[data-nav-choice]').forEach(btn => btn.addEventListener('click', () => {
    const choice = btn.dataset.navChoice;
    submitFinalDecision(choice);
  }));

  updateChoiceUI();
}

function votingMarkup() {
  const hasVoted = Boolean(state.vote?.choice);
  const c = state.cascade;
  const myGroup = state.member.group;
  const isRep = Boolean(state.member.isRepresentative);
  const isNav = state.chiefNavigator === myGroup;
  const remaining = getRemainingPoints();
  const totalUsed = 5 - remaining;
  const otherGroups = [1, 2, 3, 4, 5].filter(g => g !== myGroup);
  const hasSubmittedPersuasion = state.myPersuasion && Object.keys(state.myPersuasion).length > 0;

  return `
    <div class="mobile-timer" style="margin: 10px 0 12px;">
      <span class="timer-label" data-debate>${state.roundIndex === 3 ? '三方終極協商' : '小組研討時間'}</span>
      <span class="clock" data-clock>--:--</span>
    </div>

    ${c ? `
      <div class="cascade-banner ${c.type === 'buff' ? 'is-buff' : 'is-penalty'}">
        <div class="cascade-head">
          <span class="cascade-badge">${esc(c.badge)}</span>
          <strong>${esc(c.title)}</strong>
        </div>
        <p class="cascade-effect">${esc(c.effectText)}</p>
        ${c.hint ? `<div class="cascade-intel-box">${esc(c.hint)}</div>` : ''}
      </div>
    ` : ''}

    <!-- 階段一：各組初投（完成後自動折疊成單行狀態，讓畫面保持極簡） -->
    ${!hasVoted ? `
      <section class="card" style="padding:16px; margin-bottom:14px;">
        <div class="eyebrow">STEP 1 · INITIAL VOTE</div>
        <h2 style="font-size:16px; margin:2px 0 6px;">階段一：選擇本組初投方案</h2>
        <p style="font-size:12.5px; color:var(--muted); margin-bottom:12px;">
          ${isRep
            ? '👑 你是本組代表，請與組員討論後點選方案並按下方按鈕鎖定。'
            : '請與同組夥伴討論，並由「本組代表」按下鎖定送出。'}
        </p>

        <div class="options-list" role="radiogroup" aria-label="本組初投方案">
          ${(state.round.options || []).map(o => `
            <button type="button" class="option-card" role="radio" aria-checked="${selection === o.id}" data-choice="${o.id}">
              <span class="letter">${esc(o.id)}</span>
              <span>
                <strong>${esc(o.title)}</strong>
                <p>${esc(o.text)}</p>
              </span>
            </button>
          `).join('')}
        </div>

        ${state.roundIndex === 3 ? `
          <div class="debate-card" style="margin-top:12px; padding:12px; background:#f8fafc; border-radius:10px; border:1px solid var(--line);">
            <div class="eyebrow">三方協商表態（任一方拒絕即為破局）</div>
            ${['總部代表', '東京代表', '客戶代表'].map((name, i) => `
              <div class="consensus-row">
                <span>${name}</span>
                <div class="consensus-options">
                  <button type="button" data-consensus="${i}" data-value="true" aria-pressed="${consensus[i] === true}">同意</button>
                  <button type="button" class="refuse" data-consensus="${i}" data-value="false" aria-pressed="${consensus[i] === false}">拒絕</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </section>
    ` : `
      <div class="card" style="padding:12px 16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; border:1.5px solid #86efac;">
        <strong style="color:#166534; font-size:13.5px;">✓ 階段一：本組初投已定錨</strong>
        <span class="pill positive">方案 ${esc(state.vote.choice)}</span>
      </div>
    `}

    <!-- 階段二：5 點說服點數分配 -->
    <section class="point-allocator-card card" style="margin-bottom: 14px; ${!hasVoted ? 'opacity:0.65; pointer-events:none;' : ''}">
      <div class="eyebrow">STEP 2 · PERSUASION POINTS</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 style="font-size:16px; margin:2px 0 4px;">階段二：分配 5 點說服點數</h2>
        ${hasSubmittedPersuasion ? '<span class="pill positive" style="font-size:11px;">✓ 已送出配點</span>' : ''}
      </div>
      <p style="font-size:12.5px; color:var(--muted); margin-bottom:10px;">
        ${!hasVoted
          ? '🔒 請先完成「階段一：本組初投」，即可解鎖說服點數分配。'
          : '聆聽各組辯論，將 5 點分配給最令人信服的其他組別（禁投本組，單組上限 3 點）。'}
      </p>

      <div class="points-counter">
        <span>剩餘可分配點數</span>
        <span class="counter-number" id="remaining-pts-count">${remaining} / 5 點</span>
      </div>

      <div class="alloc-groups-list">
        ${otherGroups.map(gid => {
          const pts = Number(pointsAllocated[gid]) || 0;
          return `
            <div class="alloc-group-row" data-alloc-group="${gid}">
              <div class="alloc-group-label">
                <span class="alloc-group-name">第 ${gid} 組</span>
                <span class="alloc-group-choice">戰略決策組</span>
              </div>
              <div class="alloc-controls">
                <button type="button" class="alloc-btn minus" data-alloc-btn="minus" data-group="${gid}" ${!isRep || pts <= 0 ? 'disabled' : ''}>−</button>
                <span class="alloc-value">${pts}</span>
                <button type="button" class="alloc-btn plus" data-alloc-btn="plus" data-group="${gid}" ${!isRep || remaining <= 0 || pts >= 3 ? 'disabled' : ''}>+</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <button type="button" id="submit-persuasion" class="button primary submit-persuasion-btn" ${!isRep || totalUsed < 1 || totalUsed > 5 ? 'disabled' : ''}>
        ${!isRep
          ? '👑 等待本組代表送出配點…'
          : hasSubmittedPersuasion
            ? '✓ 已送出（點此可更新本組配點 ↗）'
            : '👑 代表本組送出說服點數分配 ↗'}
      </button>
    </section>

    <!-- 階段三：首席領航者 ＆ 極密內幕情報 -->
    <section class="navigator-intel-card card" style="margin-bottom: 24px;">
      <div class="eyebrow">STEP 3 · CHIEF NAVIGATOR</div>
      <h2 style="font-size:16px; margin:2px 0 8px;">階段三：首席領航者拍板</h2>

      ${isNav ? `
        <div class="classified-intel-box">
          <div class="classified-stamp">TOP SECRET</div>
          <div class="classified-header">
            <h3 class="classified-title">👑 首席領航專屬情報</h3>
            <p class="classified-subtitle">
              貴組獲得最高說服點數！請向全班口頭說明以下內幕，並代表全班拍板最終策略：
            </p>
          </div>
          <div class="classified-body">
            <strong>${esc(state.hiddenIntel?.title || '《極密情報檔案》')}</strong>
            <p style="margin:6px 0 0; line-height:1.7;">${esc(state.hiddenIntel?.text || '正在載入極密檔案…')}</p>
          </div>

          <div style="margin-top: 14px;">
            <strong style="color:#78350f; font-size:13.5px;">👑 請選擇全班最終拍板方案：</strong>
            ${state.hasFinalDecision ? `
              <div style="margin-top:8px; background:#dcfce7; border:1.5px solid #86efac; border-radius:10px; padding:12px; color:#15803d; font-weight:700; text-align:center;">
                ✓ 貴組已拍板全班最終策略：方案 ${esc(state.finalDecision)}
              </div>
            ` : !isRep ? `
              <div style="margin-top:8px; background:#fef3c7; border:1px solid #fde68a; border-radius:10px; padding:10px; color:#92400e; font-weight:600; text-align:center;">
                👑 請與組員討論後，由貴組的「本組代表」按下最終拍板按鈕！
              </div>
            ` : `
              <div class="navigator-decision-grid">
                ${['A', 'B', 'C', 'D'].map(choice => `
                  <button type="button" class="navigator-choice-btn" data-nav-choice="${choice}">
                    <span class="choice-letter">${choice}</span>
                    <span>拍板方案 ${choice}</span>
                  </button>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      ` : `
        <div style="background:#f8fafc; border:1.5px dashed var(--line); border-radius:14px; padding:14px; text-align:center;">
          <strong style="color:var(--ink); font-size:14px;">
            ${state.chiefNavigator ? `👑 本輪首席領航者：第 ${state.chiefNavigator} 組` : '等待說服點數統計出【首席領航者】…'}
          </strong>
          <p style="font-size:12px; color:var(--muted); margin:4px 0 0;">
            ${state.chiefNavigator
              ? `第 ${state.chiefNavigator} 組已解鎖《極密情報》，請等待其代表全班拍板最終答案！`
              : '完成階段二配點後，最高分組別將解鎖極密情報並代表全班拍板！'}
          </p>
        </div>
      `}
    </section>
  `;
}

function resultMarkup() {
  const res = state.result || {};
  const isGood = state.worldState?.['r' + (state.roundIndex + 1)] === 'good';
  const myGroup = state.member.group;
  const isNav = myGroup === state.chiefNavigator;

  return `
    <div class="card" style="border:2px solid ${isGood ? '#16a34a' : '#dc2626'}; background:${isGood ? '#f0fdf4' : '#fef2f2'}; margin-bottom:14px; padding:14px 16px;">
      <strong style="color:${isGood ? '#15803d' : '#b91c1c'}; font-size:15px;">
        ${isGood
          ? '🎉 首席領航者拍板成功！全員共贏（本組 +15 CQ）'
          : '⚠️ 首席領航者拍板踩雷！全班共業警報啟動'
        }
      </strong>
      <p style="margin:4px 0 0; font-size:12.5px; color:${isGood ? '#166534' : '#991b1b'}; line-height:1.5;">
        ${isGood
          ? '初投失誤組別負面扣分減免 60%，全班同享共贏加成！'
          : '初投失誤組別承受全額扣分，下回合全班研討時間縮短 30 秒！'
        }
      </p>
    </div>

    <section class="card" style="margin-bottom:14px; padding:16px; border:1.5px solid var(--line);">
      <div class="eyebrow">YOUR GROUP RESULT</div>
      <h2 style="font-size:16px; margin:2px 0 10px;">
        第 ${myGroup} 組本輪結算明細 ${isNav ? '<span class="navigator-crown-pill">👑 領航組</span>' : ''}
      </h2>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; font-size:13.5px; padding:6px 0; border-bottom:1px solid var(--line);">
          <span>初投方案 ${esc(res.id || '—')} 基礎分</span>
          <strong class="${res.baseDelta > 0 ? 'positive-text' : res.baseDelta < 0 ? 'negative-text' : ''}">
            ${res.baseDelta >= 0 ? '+' : ''}${res.baseDelta ?? 0} CQ
          </strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13.5px; padding:6px 0; border-bottom:1px solid var(--line);">
          <span>領航救援減免</span>
          <strong class="${res.rescueBonus > 0 ? 'positive-text' : ''}">
            ${res.rescueBonus > 0 ? `+${res.rescueBonus} CQ` : '0 CQ'}
          </strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13.5px; padding:6px 0; border-bottom:1px solid var(--line);">
          <span>全員協同共贏加成</span>
          <strong class="${res.synergyBonus > 0 ? 'positive-text' : ''}">
            ${res.synergyBonus > 0 ? `+${res.synergyBonus} CQ` : '0 CQ'}
          </strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:14.5px; font-weight:800; padding:8px 0 0;">
          <span>本輪淨變動 / 總 CQ</span>
          <span>
            ${res.actualDelta >= 0 ? '+' : ''}${res.actualDelta ?? 0} CQ ｜ <strong style="color:var(--accent);">${state.group?.cq ?? 100} CQ</strong>
          </span>
        </div>
      </div>
    </section>

    <section class="card" style="padding:16px; margin-bottom:20px;">
      <div class="eyebrow">CLASS LEADERBOARD</div>
      <h2 style="font-size:16px; margin:2px 0 10px;">全班 5 組排行榜</h2>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${(state.publicBoard || []).map(g => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#f8fafc; border-radius:10px; border:1px solid var(--line);">
            <div>
              <strong>第 ${g.id} 組</strong>
              ${g.isNavigator ? '<span class="navigator-crown-pill" style="margin-left:4px;">👑 領航</span>' : ''}
              <small style="color:var(--muted); margin-left:6px;">初投 ${esc(g.optionId || '—')}</small>
            </div>
            <div>
              <strong>${g.cq} CQ</strong>
              <small class="${g.actualDelta >= 0 ? 'positive-text' : 'negative-text'}" style="margin-left:6px;">
                (${g.actualDelta >= 0 ? '+' : ''}${g.actualDelta})
              </small>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

async function submitVote() {
  if (!selection || busy || !state?.member?.isRepresentative) return;
  busy = true;
  const btn = $('#submit-vote');
  if (btn) btn.disabled = true;
  try {
    await api('vote', {
      choice: selection,
      roundIndex: state.roundIndex,
      ...(state.roundIndex === 3 ? { consensus } : {})
    });
    toast(`第 ${state.member.group} 組初投已鎖定：方案 ${selection} ✓`);
    broadcastSync('group_vote', {
      group: state.member.group,
      choice: selection,
      proposal: selection,
      consensus,
      roundIndex: state.roundIndex
    });
    await refresh();
  } catch (e) {
    toast(e.message);
  } finally {
    busy = false;
    updateChoiceUI();
  }
}

async function submitPersuasion() {
  if (busy || !state?.member?.isRepresentative) return;
  const remaining = getRemainingPoints();
  const used = 5 - remaining;
  if (used < 1 || used > 5) {
    toast('說服點數總和必須在 1 至 5 點之間！');
    return;
  }
  busy = true;
  const btn = $('#submit-persuasion');
  if (btn) btn.disabled = true;
  try {
    const cleanPoints = {};
    for (const [gid, pts] of Object.entries(pointsAllocated)) {
      if (Number(pts) > 0) cleanPoints[gid] = Number(pts);
    }
    await api('persuade', {
      points: cleanPoints,
      roundIndex: state.roundIndex
    });
    toast(`已送出說服點數分配（共分配 ${used} 點）✓`);
    await refresh();
  } catch (e) {
    toast(e.message);
  } finally {
    busy = false;
    updateChoiceUI();
  }
}

async function submitFinalDecision(choice) {
  if (!choice || busy || !state?.member?.isRepresentative) return;

  // 兩段式點擊防呆（不依賴 window.confirm，完美支援 LINE 內建瀏覽器與嚴格 CSP）
  if (pendingNavChoice !== choice) {
    pendingNavChoice = choice;
    if (pendingNavTimer) clearTimeout(pendingNavTimer);
    document.querySelectorAll('[data-nav-choice]').forEach(btn => {
      if (btn.dataset.navChoice === choice) {
        btn.style.background = '#dc2626';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#b91c1c';
        btn.innerHTML = `<span class="choice-letter">${choice}</span><span>⚠️ 再按一次確認拍板 ${choice}</span>`;
      } else {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.innerHTML = `<span class="choice-letter">${btn.dataset.navChoice}</span><span>拍板方案 ${btn.dataset.navChoice}</span>`;
      }
    });
    toast(`請再點擊一次「方案 ${choice}」以確認代表全班拍板！`);
    pendingNavTimer = setTimeout(() => {
      pendingNavChoice = null;
      render();
    }, 4000);
    return;
  }

  pendingNavChoice = null;
  if (pendingNavTimer) clearTimeout(pendingNavTimer);
  busy = true;
  try {
    await api('final-decision', {
      choice,
      roundIndex: state.roundIndex
    });
    toast(`👑 首席領航者已拍板全班方案：方案 ${choice} ✓`);
    await refresh();
  } catch (e) {
    toast(e.message);
  } finally {
    busy = false;
  }
}

async function refresh() {
  try {
    const next = await api('state');
    if (!next || typeof next !== 'object') return;

    // 【核心防護】檢查 epoch（課堂世代）、revision 與 roundIndex：
    // 只要不是主持人按了 RESET（產生新 epoch），任何因為 Serverless 節點冷啟動而落後的舊回合 / 舊 revision 一律丟棄！
    if (next.epoch && next.epoch !== highestEpoch) {
      highestEpoch = next.epoch;
      highestRevision = typeof next.revision === 'number' ? next.revision : 0;
      highestRoundIndex = typeof next.roundIndex === 'number' ? next.roundIndex : 0;
    } else if (next.epoch === highestEpoch) {
      if (typeof next.roundIndex === 'number' && next.roundIndex < highestRoundIndex) {
        // 攔截到舊回合封包，直接忽略，絕不閃退回第一回合！
        return;
      }
      if (typeof next.revision === 'number' && next.revision < highestRevision && next.roundIndex === highestRoundIndex) {
        return;
      }
      if (typeof next.roundIndex === 'number' && next.roundIndex > highestRoundIndex) {
        highestRoundIndex = next.roundIndex;
      }
      if (typeof next.revision === 'number' && next.revision > highestRevision) {
        highestRevision = next.revision;
      }
    }

    next.clockOffset = (next.serverTime || Date.now()) - Date.now();

    // 防跳回選組別保護機制
    if (!next.member) {
      let savedJoin = null;
      try {
        savedJoin = JSON.parse(localStorage.getItem('cq_last_join') || 'null');
      } catch {}

      if (state?.member) {
        next.member = state.member;
        next.group = next.group || state.group;
        if (next.roundIndex === state.roundIndex) {
          next.vote = next.vote || state.vote;
          next.myPersuasion = next.myPersuasion || state.myPersuasion;
        }
      }

      // 只有在連 localStorage 的 token 都沒有或完全失效時，才發送 join（並帶上 clientRound 防止舊節點覆蓋）
      if (savedJoin?.name && savedJoin?.group && !recoveringSession && !localStorage.getItem('cq_member_token')) {
        recoveringSession = true;
        api('join', {
          name: savedJoin.name,
          group: Number(savedJoin.group),
          allowSwitch: true,
          clientRound: highestRoundIndex >= 0 ? highestRoundIndex : 0
        })
          .then(res => {
            if (res?.token) localStorage.setItem('cq_member_token', res.token);
            recoveringSession = false;
          })
          .catch(() => {
            recoveringSession = false;
          });
      }

      if (!savedJoin && !state?.member) {
        state = next;
        online = true;
        status(true);
        if (!gate.open) gate.showModal();
        $('#app').innerHTML = '<div class="loading">請先填寫姓名與組別入席…</div>';
        return;
      }
    } else {
      if (gate.open && !gate.dataset.manualSwitch) {
        gate.close();
      }
    }

    // 排除單純計時器 (pitch / remaining) 變動觸發整頁重繪，避免打斷學員點選操作
    const signatureObj = {
      ...next,
      serverTime: 0,
      clockOffset: 0,
      remaining: 0,
      deadline: next.deadline ? 1 : 0,
      pitch: null
    };
    const signature = JSON.stringify(signatureObj);

    state = next;
    online = true;
    status(true);

    if (signature !== lastSignature) {
      lastSignature = signature;
      render();
    } else {
      updateChoiceUI();
    }
  } catch (e) {
    // 若課堂已被主持人重設 (401)，清除過期 token 並引導重新入席
    if (e.status === 401) {
      localStorage.removeItem('cq_member_token');
      highestEpoch = '';
      highestRevision = -1;
      highestRoundIndex = -1;
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
    const subBtn = $('#join-form button[type="submit"]');
    if (subBtn) subBtn.innerHTML = '確認更換組別 <span aria-hidden="true">↗</span>';
    gate.showModal();
  }
  if (e.target.closest('#close-onboarding')) {
    delete gate.dataset.manualSwitch;
    gate.close();
  }
  if (e.target.closest('#revealed-status-pill')) {
    toast(state?.phase === 'finished' ? '四個回合已全部完成！' : '本回合已揭曉！請看大螢幕，由講師進入下一回合。');
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
    let res;
    if (state?.member) {
      res = await api('switch-group', { name, group });
      toast(`已更換至第 ${group} 組 ✓`);
    } else {
      res = await api('join', {
        name,
        group,
        allowSwitch: true,
        clientRound: highestRoundIndex >= 0 ? highestRoundIndex : 0
      });
    }
    if (res.token) {
      try {
        localStorage.setItem('cq_member_token', res.token);
        localStorage.setItem('cq_last_join', JSON.stringify({ name, group }));
      } catch {}
    }
    delete gate.dataset.manualSwitch;
    gate.close();
    await refresh();
  } catch (error) {
    try {
      const res = await api('join', {
        name,
        group,
        allowSwitch: true,
        clientRound: highestRoundIndex >= 0 ? highestRoundIndex : 0
      });
      if (res.token) {
        localStorage.setItem('cq_member_token', res.token);
        localStorage.setItem('cq_last_join', JSON.stringify({ name, group }));
      }
      toast(`已加入第 ${group} 組 ✓`);
      delete gate.dataset.manualSwitch;
      gate.close();
      await refresh();
    } catch (err2) {
      $('#join-error').textContent = err2.message || error.message;
    }
  } finally {
    button.disabled = false;
  }
});

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'host_action') {
    // 若主持人廣播了最新的 roundIndex，立即更新最高回合鎖
    if (typeof packet.roundIndex === 'number' && packet.roundIndex > highestRoundIndex) {
      highestRoundIndex = packet.roundIndex;
    }
    refresh();
  } else if (packet.type === 'pitch_update') {
    state.pitch = packet.pitch;
  } else if (packet.type === 'group_vote') {
    if (packet.group === state.member?.group && packet.roundIndex === state.roundIndex) {
      if (!state.vote) state.vote = {};
      state.vote.choice = packet.choice;
      state.vote.proposal = packet.proposal;
      state.vote.consensus = packet.consensus;
      selection = packet.proposal;
      consensus = packet.consensus || [null, null, null];
      render();
    }
  }
});

async function poll() {
  await refresh();
  setTimeout(poll, document.hidden ? 5000 : 1500);
}

window.addEventListener('pitch-ended', () => { render(); });
startClock(() => state);
poll();
