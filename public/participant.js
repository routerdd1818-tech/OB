import { $, esc, api, toast, status, startClock, broadcastSync, listenSync } from './common.js';

let state = null, lastSignature = '', selection = null, consensus = [null, null, null], roundKey = '', busy = false, online = false;
let pointsAllocated = {};
let recoveringSession = false;

const gate = $('#onboarding');
gate.addEventListener('cancel', e => { if (!state?.member) e.preventDefault(); });

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
    }
  });

  document.querySelectorAll('[data-consensus]').forEach(el => {
    el.setAttribute('aria-pressed', String(consensus[Number(el.dataset.consensus)] === (el.dataset.value === 'true')));
    if (hasVoted) el.disabled = true;
  });

  const submit = $('#submit-vote');
  if (submit) {
    submit.disabled = hasVoted || busy || !online || !isRep || !selection || (state?.roundIndex === 3 && consensus.some(x => x === null));
  }

  // 更新階段二：說服點數分配 UI
  const remaining = getRemainingPoints();
  const counterEl = $('#remaining-pts-count');
  if (counterEl) counterEl.textContent = `${remaining} / 5 點`;

  document.querySelectorAll('[data-alloc-group]').forEach(row => {
    const gid = Number(row.dataset.allocGroup);
    const pts = Number(pointsAllocated[gid]) || 0;
    const valEl = row.querySelector('.alloc-value');
    if (valEl) valEl.textContent = String(pts);
    const plusBtn = row.querySelector('.alloc-btn.plus');
    if (plusBtn) plusBtn.disabled = busy || remaining <= 0 || pts >= 3;
    const minusBtn = row.querySelector('.alloc-btn.minus');
    if (minusBtn) minusBtn.disabled = busy || pts <= 0;
  });

  const submitPersuasion = $('#submit-persuasion');
  if (submitPersuasion) {
    const totalUsed = 5 - remaining;
    submitPersuasion.disabled = busy || !online || totalUsed < 1 || totalUsed > 5;
  }
}

function render() {
  const r = state.round;
  const member = state.member;
  if (!r || !member) return;

  const revealed = ['revealed', 'finished'].includes(state.phase);
  const key = `${state.epoch}:${state.roundIndex}`;

  if (key !== roundKey) {
    selection = state.vote?.proposal || null;
    consensus = state.vote?.consensus || [null, null, null];
    pointsAllocated = { ...(state.myPersuasion || {}) };
    roundKey = key;
  } else if (!selection && state.vote?.proposal) {
    selection = state.vote.proposal;
    consensus = state.vote.consensus || [null, null, null];
  }

  if (state.myPersuasion && Object.keys(pointsAllocated).length === 0) {
    pointsAllocated = { ...state.myPersuasion };
  }

  document.documentElement.style.setProperty('--accent', r.color);

  const cq = state.group?.cq ?? 100;
  const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
  const isNav = state.chiefNavigator === member.group;
  const navBadge = isNav ? '<span class="navigator-crown-pill" style="margin-left:6px;">👑 首席領航者</span>' : '';

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

  // 單純顯示本回決策題目（已刪除情境背景與 JRPG 立繪舞台）
  const cleanQuestionBox = `
    <section class="card" style="padding:16px 18px; margin-bottom:12px; border:2px solid #f59e0b; border-left:6px solid #d97706; background:#fffbeb;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="topic-badge" style="background:#d97706; color:#fff;">ROUND 0${state.roundIndex + 1} · 決策題目</span>
        <span style="font-size:12px; color:#92400e; font-weight:600;">${esc(r.dimension || '')}</span>
      </div>
      <h1 style="font-size:18px; line-height:1.55; font-weight:800; color:#1c1917; margin:0;">
        ${esc(r.prompt || r.title || '')}
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
    buttonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">${state.phase === 'finished' ? '本次課堂已完成 · 感謝參與' : '本回合已揭曉 · 請看大螢幕'}</div>`;
  } else if (hasVoted) {
    const choiceLabel = state.vote.choice === 'X' ? '未達成協議' : `方案 ${state.vote.choice}`;
    buttonHtml = `<button id="submit-vote" class="button secondary wide locked-btn" type="button" disabled>✓ 本組初投已鎖定：${choiceLabel}</button>`;
  } else if (!isRep) {
    buttonHtml = `<button id="submit-vote" class="button secondary wide" type="button" disabled>👑 由本組代表負責鎖定初投（你可點擊預覽方案）</button>`;
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
      // 更新底部按鈕文字
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
  const isNav = state.chiefNavigator === myGroup;
  const remaining = getRemainingPoints();
  const otherGroups = [1, 2, 3, 4, 5].filter(g => g !== myGroup);

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
        <p class="cascade-effect">${esc(c.effectText)}</p>${c.hint ? `<div class="cascade-intel-box">${esc(c.hint)}</div>` : ''}
      </div>
    ` : ''}

    <!-- 階段一：各組初投（完成後自動折疊成單行狀態，讓畫面保持極簡） -->
    ${!hasVoted ? `
      <section class="card" style="padding:16px; margin-bottom:14px;">
        <div class="eyebrow">STEP 1 · INITIAL VOTE</div>
        <h2 style="font-size:16px; margin:2px 0 6px;">階段一：選擇本組初投方案</h2>
        <p style="font-size:12.5px; color:var(--muted); margin-bottom:12px;">
          ${state.member.isRepresentative
            ? '👑 你是本組代表，請與組員討論後點選方案並按下方按鈕鎖定。'
            : '請與同組夥伴討論，並由「本組代表」按下鎖定送出。'}
        </p>

        <div class="options-list" role="radiogroup" aria-label="本組初投方案">
          ${state.round.options.map(o => `
            <button type="button" class="option-card" role="radio" aria-checked="${selection === o.id}" data-choice="${o.id}">
              <span class="letter">${o.id}</span>
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
        <span class="pill positive">方案 ${state.vote.choice}</span>
      </div>
    `}

    <!-- 階段二：5 點說服點數分配 -->
    <section class="point-allocator-card card" style="margin-bottom: 14px;">
      <div class="eyebrow">STEP 2 · PERSUASION POINTS</div>
      <h2 style="font-size:16px; margin:2px 0 4px;">階段二：分配 5 點說服點數</h2>
      <p style="font-size:12.5px; color:var(--muted); margin-bottom:10px;">
        聆聽各組辯論，將 5 點分配給最令人信服的其他組別（禁投本組，單組上限 3 點）。
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
                <button type="button" class="alloc-btn minus" data-alloc-btn="minus" data-group="${gid}" ${pts <= 0 ? 'disabled' : ''}>−</button>
                <span class="alloc-value">${pts}</span>
                <button type="button" class="alloc-btn plus" data-alloc-btn="plus" data-group="${gid}" ${remaining <= 0 || pts >= 3 ? 'disabled' : ''}>+</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <button type="button" id="submit-persuasion" class="button primary submit-persuasion-btn" ${5 - remaining < 1 || 5 - remaining > 5 ? 'disabled' : ''}>
        ${state.myPersuasion ? '更新本組說服點數 ↗' : '送出說服點數分配 ↗'}
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
                ✓ 貴組已拍板全班最終策略：方案 ${state.finalDecision}
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
          ? `🎉 首席領航者拍板成功！全員共贏（本組 +15 CQ）`
          : `⚠️ 首席領航者拍板踩雷！全班共業警報啟動`
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
          <span>初投方案 ${res.id || '—'} 基礎分</span>
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
            ${res.actualDelta >= 0 ? '+' : ''}${res.actualDelta ?? 0} CQ ｜ <strong style="color:var(--accent);">${state.group.cq} CQ</strong>
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
              <small style="color:var(--muted); margin-left:6px;">初投 ${g.optionId || '—'}</small>
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
  if (busy) return;
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
  if (!choice || busy) return;
  if (!window.confirm(`【首席領航者最終拍板】\n\n確定代表全班拍板「方案 ${choice}」嗎？\n此決定將影響全班 5 組的命運與 CQ 結算！`)) return;
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
    next.clockOffset = next.serverTime - Date.now();

    // 防跳回選組別保護機制：若瞬斷未回傳 member，自動從 localStorage 恢復身份
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
          .catch(() => { recoveringSession = false; });
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
    if (e.status === 401) {
      let savedJoin = null;
      try {
        savedJoin = JSON.parse(localStorage.getItem('cq_last_join') || 'null');
      } catch {}
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
            online = false;
            status(false);
          });
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
      res = await api('join', { name, group, allowSwitch: true });
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
      const res = await api('join', { name, group, allowSwitch: true });
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
