import { $, esc, api, toast, status, scene, roundNav, tensionCard, dialogue, startClock, broadcastSync, listenSync } from './common.js';
import { renderRpgDialogueBox, renderWorldStateHud } from './rpg-assets.js';

let state = null, lastSignature = '', selection = null, consensus = [null, null, null], roundKey = '', busy = false, online = false;
let pointsAllocated = {};

const gate = $('#onboarding');
gate.addEventListener('cancel', e => { if (!state?.member) e.preventDefault(); });
try {
  if (!localStorage.getItem('cq_member_token')) {
    if (!gate.open) gate.showModal();
  }
} catch {}

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
    submit.disabled = hasVoted || busy || !online || !selection || (state?.roundIndex === 3 && consensus.some(x => x === null));
  }

  // Update persuasion points allocation UI
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
  if (!state?.member) {
    if (!gate.open) gate.showModal();
    $('#app').innerHTML = '<div class="loading">請先填寫姓名與組別入席…</div>';
    return;
  }
  const r = state.round;
  const member = state.member;
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

  const cq = state.group.cq ?? 100;
  const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
  const isNav = state.chiefNavigator === member.group;
  const navBadge = isNav ? '<span class="navigator-crown-pill" style="margin-left:6px;">👑 首席領航者</span>' : '';

  const hudHtml = renderWorldStateHud(state.worldState || {});

  const identityBar = `
    <div class="mobile-identity">
      <div class="identity-bar">
        <div class="identity-pill">
          <span class="identity-name">${esc(member.name)}</span>
          <span aria-hidden="true">｜</span>
          第 ${member.group} 組 · 決策組 ${navBadge}
        </div>
        <button type="button" class="switch-group-btn" id="open-switch-group" aria-label="更換組別">換組</button>
        <span class="rep-tag">${member.isRepresentative ? '本組代表' : '共同決策員'}</span>
      </div>
      <div class="mobile-health">
        <span class="health-label">團隊 CQ 韌性值</span>
        <div class="health-track" role="progressbar" aria-label="本組 CQ 韌性值" aria-valuenow="${cq}" aria-valuemin="0" aria-valuemax="150">
          <div class="health-fill ${cqClass}" style="width:${Math.min(100, Math.round((cq / 150) * 100))}%"></div>
        </div>
        <span class="cq-value">${cq}<small>/ 150 CQ</small></span>
      </div>
    </div>
  `;

  const prevWorld = state.worldState ? (state.roundIndex === 1 ? state.worldState.r1 : state.roundIndex === 2 ? state.worldState.r2 : state.roundIndex === 3 ? state.worldState.r3 : 'idle') : 'idle';
  const mood = prevWorld === 'good' ? 'ally' : prevWorld === 'bad' ? 'angry' : 'normal';

  const dialogueBoxHtml = renderRpgDialogueBox({
    roundIndex: state.roundIndex,
    speaker: r.speaker,
    text: r.dialogue?.[1]?.text || r.context,
    prompt: r.prompt,
    mood,
    worldState: state.worldState,
    groups: [],
    chiefNavId: state.chiefNavigator
  });

  $('#app').innerHTML = `
    ${hudHtml}
    ${identityBar}
    ${roundNav(state.roundIndex)}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成！感謝參與！</div>' : ''}
    
    <!-- JRPG Dialogue Stage -->
    <div style="margin-bottom: 12px;">
      ${dialogueBoxHtml}
    </div>

    ${revealed ? resultMarkup() : votingMarkup()}
  `;

  document.querySelector('.mobile-action')?.remove();
  const footer = document.createElement('footer');
  footer.className = 'mobile-action';

  const isWaiting = ['waiting', 'ready'].includes(state.phase);
  const hasVoted = Boolean(state.vote?.choice);
  let buttonHtml = '';

  if (revealed) {
    buttonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">${state.phase === 'finished' ? '本次課堂已完成 · 感謝參與' : '本回合已揭曉 · 請看大螢幕'}</div>`;
  } else if (hasVoted) {
    const choiceLabel = state.vote.choice === 'X' ? '未達成協議' : `方案 ${state.vote.choice}`;
    buttonHtml = `<button id="submit-vote" class="button secondary wide locked-btn" type="button" disabled>✓ 本組初投已鎖定${choiceLabel}</button>`;
  } else {
    let buttonText = '鎖定本組初投 ↗';
    if (isWaiting) {
      buttonText = selection ? `已預選方案 ${selection}（可隨時送出 ↗）` : '預選初投方案（可隨時送出 ↗）';
    } else if (selection) {
      buttonText = `鎖定初投方案 ${selection} ↗`;
    }
    buttonHtml = `<button id="submit-vote" class="button primary" type="button" ${!selection ? 'disabled' : ''}>${buttonText}</button>`;
  }

  footer.innerHTML = `<div class="mobile-action-inner">${buttonHtml}</div>`;
  document.body.append(footer);

  // Setup choice selection listeners
  if (!hasVoted) {
    document.querySelectorAll('[data-choice]').forEach(el => el.addEventListener('click', () => {
      selection = el.dataset.choice;
      updateChoiceUI();
    }));
    document.querySelectorAll('[data-consensus]').forEach(el => el.addEventListener('click', () => {
      consensus[Number(el.dataset.consensus)] = el.dataset.value === 'true';
      updateChoiceUI();
    }));
    $('#submit-vote')?.addEventListener('click', submitVote);
  }

  // Persuasion points allocation buttons
  document.querySelectorAll('[data-alloc-btn]').forEach(btn => btn.addEventListener('click', () => {
    const action = btn.dataset.allocBtn; // 'plus' or 'minus'
    const gid = Number(btn.dataset.group);
    const cur = Number(pointsAllocated[gid]) || 0;
    const remaining = getRemainingPoints();

    if (action === 'plus') {
      if (remaining > 0 && cur < 3) {
        pointsAllocated[gid] = cur + 1;
        updateChoiceUI();
      }
    } else if (action === 'minus') {
      if (cur > 0) {
        pointsAllocated[gid] = cur - 1;
        if (pointsAllocated[gid] === 0) delete pointsAllocated[gid];
        updateChoiceUI();
      }
    }
  }));

  $('#submit-persuasion')?.addEventListener('click', submitPersuasion);

  // Navigator choice buttons
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
    <div class="mobile-timer">
      <span class="timer-label" data-debate="${state.roundIndex === 3 ? '⚔️ 三方終極協商' : '⏱️ 小組戰術研討'}"></span>
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

    <!-- 階段一：完成初投後自動折疊為緊湊狀態列，不再佔用手機螢幕 -->
    ${!hasVoted ? `
      <section class="card" style="margin-bottom: 14px; padding: 18px;">
        <div class="eyebrow">MISSION STEP 1 · ANCHORING</div>
        <h2 style="font-size:17px; margin:4px 0 6px;">階段一：選擇本組初投方案</h2>
        <p class="muted" style="font-size:12.5px; margin-bottom:14px;">
          請與同組夥伴討論，鎖定你們的初步決策立場。
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
          <div class="debate-card" style="margin-top:14px; padding:12px; border:1px solid var(--line); border-radius:12px;">
            <div class="eyebrow">三方協商表態（任一方拒絕即破局）</div>
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

      <div class="card" style="padding:14px 16px; text-align:center; opacity:0.65; border-style:dashed;">
        <small>🔒 鎖定本組初投後，將自動解鎖【階段二：跨組說服配點】與【階段三：極密情報】</small>
      </div>
    ` : `
      <!-- 已完成初投：濃縮成一行徽章，把畫面讓給階段二與階段三 -->
      <div class="card" style="padding:12px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid #10b981 !important;">
        <span style="font-size:13px; font-weight:700;">✓ 階段一初投已定錨</span>
        <span class="pill positive">方案 ${state.vote.choice}</span>
      </div>

      <!-- 階段二：5 點說服點數分配 -->
      <section class="point-allocator-card card" style="margin-bottom: 14px;">
        <div class="eyebrow">MISSION STEP 2 · PERSUASION</div>
        <h2 style="font-size:16px; margin:2px 0 4px;">階段二：分配 5 點說服點數</h2>
        <p class="muted" style="font-size:12.5px; margin-bottom:10px;">
          聆聽各組 60 秒申辯，將點數投給最令人信服的他組（單組上限 3 點）。
        </p>

        <div class="points-counter">
          <span>可用說服點數</span>
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

        <button type="button" id="submit-persuasion" class="button primary submit-persuasion-btn" ${5 - remaining < 1 ? 'disabled' : ''}>
          送出說服點數分配 ↗
        </button>
      </section>

      <!-- 階段三：首席領航者極密情報與拍板 -->
      <section class="navigator-intel-card card" style="margin-bottom: 24px;">
        <div class="eyebrow">MISSION STEP 3 · FINAL CALL</div>
        <h2 style="font-size:16px; margin:2px 0 8px;">階段三：首席領航者 ＆ 極密檔案</h2>
        ${isNav ? `
          <div class="classified-intel-box">
            <div class="classified-stamp">TOP SECRET</div>
            <div class="classified-header">
              <h3 class="classified-title">👑 首席領航專屬極密情報</h3>
              <p class="classified-subtitle">貴組獲得最高說服認同！請向全班口頭分享此內幕，並拍板全班最終決策：</p>
            </div>
            <div class="classified-body">
              <strong>${esc(state.hiddenIntel?.title || '《極密情報檔案》')}</strong>
              <p style="margin:6px 0 0;">${esc(state.hiddenIntel?.text || '正在解密檔案…')}</p>
            </div>
            ${state.hasFinalDecision ? `
              <div style="background:#dcfce7; border:1.5px solid #86efac; border-radius:10px; padding:12px; color:#15803d; font-weight:700; text-align:center;">
                ✓ 已拍板全班最終策略：方案 ${state.finalDecision}
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
        ` : `
          <div style="border:1px dashed var(--line); border-radius:12px; padding:14px; text-align:center;">
            <strong>${state.chiefNavigator ? `👑 本輪首席領航者：第 ${state.chiefNavigator} 組` : '等待說服點數選出【👑 首席領航者】…'}</strong>
            <p class="muted" style="font-size:12px; margin:4px 0 0;">
              ${state.chiefNavigator ? `請聆聽第 ${state.chiefNavigator} 組分享獨家解鎖的《極密內幕情報》並拍板最終決策！` : '送出階段二點數後，最高分組別將解鎖極密情報！'}
            </p>
          </div>
        `}
      </section>
    `}
  `;
}

function resultMarkup() {
  const res = state.result || {};
  const isGood = state.worldState?.['r' + (state.roundIndex + 1)] === 'good';
  const myGroup = state.member.group;
  const isNav = myGroup === state.chiefNavigator;

  return `
    <!-- Result Banner -->
    <div class="card" style="border:2px solid ${isGood ? '#16a34a' : '#dc2626'}; background:${isGood ? '#f0fdf4' : '#fef2f2'}; margin-bottom:14px; padding:14px 16px;">
      <strong style="color:${isGood ? '#15803d' : '#b91c1c'}; font-size:15px;">
        ${isGood
          ? `🎉 首席領航者拍板成功！全員協同大共贏（本組 +15 CQ）`
          : `⚠️ 首席領航者拍板踩雷！全班共業警報啟動`
        }
      </strong>
      <p style="margin:4px 0 0; font-size:12.5px; color:${isGood ? '#166534' : '#991b1b'}; line-height:1.5;">
        ${isGood
          ? '初投失誤組別負面扣分減免 60%，全班同享共贏加成，下回合解鎖正面盟友支援！'
          : '初投失誤組別承受全額扣分，下回合全班 5 組共同承受負面組織困境！'
        }
      </p>
    </div>

    <!-- Personal Group Breakdown Card -->
    <section class="card" style="margin-bottom:14px; border:1.5px solid var(--line);">
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
          <span>領航救援減免（初投失誤減免 60%）</span>
          <strong class="${res.rescueBonus > 0 ? 'positive-text' : ''}">
            ${res.rescueBonus > 0 ? `+${res.rescueBonus} CQ` : '0 CQ'}
          </strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13.5px; padding:6px 0; border-bottom:1px solid var(--line);">
          <span>全員協同共贏加成 ${isNav ? '(含領航榮譽 +5)' : ''}</span>
          <strong class="${res.synergyBonus > 0 ? 'positive-text' : ''}">
            ${res.synergyBonus > 0 ? `+${res.synergyBonus} CQ` : '0 CQ'}
          </strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:14.5px; font-weight:800; padding:8px 0 0;">
          <span>本輪淨變動 / 總 CQ</span>
          <span style="color:#0f172a;">
            ${res.actualDelta >= 0 ? '+' : ''}${res.actualDelta ?? 0} CQ ｜ <strong style="color:var(--accent);">${state.group.cq} CQ</strong>
          </span>
        </div>
      </div>
    </section>

    <!-- Public Leaderboard -->
    <section class="card" style="margin-bottom:20px;">
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
              <strong style="color:#0f172a;">${g.cq} CQ</strong>
              <small class="${g.actualDelta >= 0 ? 'positive-text' : 'negative-text'}" style="margin-left:6px;">
                (${g.actualDelta >= 0 ? '+' : ''}${g.actualDelta})
              </small>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Unlocked Classified Intel -->
    ${state.hiddenIntel ? `
      <div class="classified-intel-box" style="margin-bottom:24px;">
        <div class="classified-stamp">公開解密</div>
        <div class="classified-header">
          <h3 class="classified-title">${esc(state.hiddenIntel.title)}</h3>
          <p class="classified-subtitle">全班覆盤內幕檔案</p>
        </div>
        <div class="classified-body">${esc(state.hiddenIntel.text)}</div>
      </div>
    ` : ''}
  `;
}

async function submitVote() {
  if (!selection || busy) return;
  busy = true;
  $('#submit-vote').disabled = true;
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
    $('#submit-vote').disabled = false;
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
  $('#submit-persuasion').disabled = true;
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
    $('#submit-persuasion').disabled = false;
  }
}

async function submitFinalDecision(choice) {
  if (!choice || busy) return;
  busy = true;
  try {
    await api('final-decision', {
      choice,
      roundIndex: state.roundIndex
    });
    toast(`首席領航者已拍板全班方案：方案 ${choice} ✓`);
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
    const signature = JSON.stringify({ ...next, serverTime: 0, clockOffset: 0 });
    state = next;
    online = true;
    status(true);
    if (!state.member) {
      if (!gate.open) gate.showModal();
      $('#app').innerHTML = '<div class="loading">請先填寫姓名與組別入席…</div>';
      return;
    }
    if (signature !== lastSignature) {
      lastSignature = signature;
      render();
    }
  } catch (e) {
    if (e.status === 401) {
      online = true;
      status(true);
      state = null;
      try {
        localStorage.removeItem('cq_member_token');
      } catch {}
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
    gate.close();
    await refresh();
  } catch (error) {
    try {
      const res = await api('join', { name, group, allowSwitch: true });
      if (res.token) {
        localStorage.setItem('cq_member_token', res.token);
        localStorage.setItem('cq_last_join', JSON.stringify({ name, group }));
      }
      toast(`已更換至第 ${group} 組 ✓`);
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
