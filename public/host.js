import { $, esc, api, toast, status, scene, roundNav, tensionCard, dialogue, startClock, broadcastSync, listenSync, playRevealDrum, toggleSound, isSoundEnabled } from './common.js';
import { renderRpgScene, renderCharacterBust, renderRpgDialogueBox, renderWorldStateHud } from './rpg-assets.js';

let state = null, lastSignature = '', selectedReview = 'B', busy = false, previousReveal = '', confirmResolve;

function ask(title, text, label = '確認') {
  const modal = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-text').textContent = text;
  $('#confirm-yes').textContent = label;
  modal.showModal();
  return new Promise(resolve => confirmResolve = resolve);
}

function closeConfirm(value) {
  $('#confirm-dialog').close();
  confirmResolve?.(value);
  confirmResolve = null;
}

$('#confirm-yes').addEventListener('click', () => closeConfirm(true));
$('#confirm-no').addEventListener('click', () => closeConfirm(false));
$('#confirm-dialog').addEventListener('cancel', e => { e.preventDefault(); closeConfirm(false); });

function render() {
  const r = state.round;
  const revealed = ['revealed', 'finished'].includes(state.phase);
  const revealKey = revealed ? `${state.epoch}:${state.roundIndex}` : '';
  const animate = revealed && previousReveal !== revealKey;
  previousReveal = revealKey;
  if (animate) playRevealDrum();

  document.body.classList.toggle('is-revealed', revealed);
  document.documentElement.style.setProperty('--accent', r.color);

  const hudHtml = renderWorldStateHud(state.worldState || {});

  const cqStripHtml = state.groups.map(g => {
    const cq = g.cq ?? 100;
    const res = state.results?.[g.id];
    const delta = res?.actualDelta;
    const isNav = state.chiefNavigator === g.id;
    const navBadge = isNav ? '<span class="navigator-crown-pill">👑 首席領航者</span>' : '';
    const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
    const animClass = animate && delta !== undefined ? (delta < 0 ? 'cq-damage-shake' : delta > 0 ? 'cq-heal-glow' : '') : '';
    const cascadePill = !revealed && g.cascade ? `<span class="host-cascade-pill ${g.cascade.type === 'buff' ? 'is-buff' : 'is-penalty'}">${esc(g.cascade.badge)}</span>` : '';
    return `<div class="cq-group card ${isNav ? 'is-navigator' : ''} ${animClass}">
      <div class="cq-group-head">
        <span class="group-label">第 ${g.id} 組 ${navBadge}${cascadePill}</span>
        <div class="cq-value">${cq}<small>CQ</small></div>
      </div>
      <div class="health-track" role="progressbar" aria-label="第 ${g.id} 組 CQ 韌性值" aria-valuenow="${cq}" aria-valuemin="0" aria-valuemax="150">
        <div class="health-fill ${cqClass}" style="width:${Math.min(100, Math.round((cq / 150) * 100))}%"></div>
      </div>
      ${animate && delta !== undefined ? `<span class="cq-float ${delta < 0 ? 'loss' : ''}">${delta > 0 ? '+' : ''}${delta} CQ</span>` : ''}
    </div>`;
  }).join('');

  $('#app').innerHTML = `
    ${hudHtml}
    <section class="cq-strip" aria-label="5 組 CQ 韌性值即時監控">${cqStripHtml}</section>
    ${roundNav(state.roundIndex)}
    ${state.phase === 'finished' ? '<div class="finished-banner">四回合探索完成 · 帶著理解，回到下一場真實對話。</div>' : ''}
    ${revealed ? resultsMarkup() : scenarioMarkup()}
  `;

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
          <strong data-debate>${state.roundIndex === 3 ? '三方終極協商' : '小組研討時間'}</strong>
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
        ${revealed ? '每一個決策，都是一次跨文化理解的練習。' : state.phase === 'voting' ? '第 1～5 組研討初投、60 秒辯論配點、首席領航者拍板最終答案！' : '邀請學員掃碼加入，5 組皆為戰略決策組。'}
      </span>
      ${state.phase === 'finished' ? `
        <button class="button secondary" id="finish-manage">課堂管理</button>
      ` : `
        <button class="button primary" data-host-action="${revealed ? 'next' : state.phase === 'voting' ? 'reveal' : 'start'}">
          ${revealed ? (state.roundIndex === 3 ? '完成本次課堂' : '進入下一回合') : state.phase === 'voting' ? '揭曉決策與 CQ 韌性' : '開始本回合研討'}
          <span aria-hidden="true">${state.phase === 'voting' ? '↗' : '→'}</span>
        </button>
      `}
    </div>
  `;
  document.body.append(controls);

  document.querySelectorAll('[data-host-action]').forEach(el => el.addEventListener('click', () => hostAction(el.dataset.hostAction)));
  $('#finish-manage')?.addEventListener('click', openManage);
  document.querySelectorAll('[data-review]').forEach(el => el.addEventListener('click', () => { selectedReview = el.dataset.review; renderReview(); }));
  document.querySelectorAll('[data-pitch-group]').forEach(btn => btn.addEventListener('click', async () => {
    const group = btn.dataset.pitchGroup;
    try {
      await api('pitch', { group, seconds: 60 }, 'host');
      broadcastSync('host_action', { action: 'pitch', group, roundIndex: state.roundIndex });
      await refresh();
      toast(group === 'stop' ? '已停止辯論倒數' : group === 'all' ? '已啟動全班 60 秒跨立場辯論！' : `已啟動第 ${group} 組 60 秒申辯！`);
    } catch (e) {
      toast(e.message);
    }
  }));

  if (revealed) renderReview();
}

function scenarioMarkup() {
  const r = state.round;
  const prevWorld = state.worldState ? (state.roundIndex === 1 ? state.worldState.r1 : state.roundIndex === 2 ? state.worldState.r2 : state.roundIndex === 3 ? state.worldState.r3 : 'idle') : 'idle';
  const mood = prevWorld === 'good' ? 'ally' : prevWorld === 'bad' ? 'angry' : 'normal';

  const leftStageHtml = renderRpgDialogueBox({
    roundIndex: state.roundIndex,
    speaker: r.speaker,
    text: r.dialogue?.[1]?.text || r.context,
    prompt: r.prompt,
    mood,
    worldState: state.worldState,
    groups: state.groups,
    chiefNavId: state.chiefNavigator
  });

  const allVoted = state.completed >= 5;
  const now = Date.now() + (state.clockOffset || 0);
  const isPitchActive = Boolean(state.pitch && state.pitch.deadline && state.pitch.deadline > now);

  const persuasionRows = (state.persuasionBoard || []).map(item => {
    const maxPts = 12;
    const pct = Math.min(100, Math.round((item.totalPoints / maxPts) * 100));
    return `
      <div class="persuasion-row ${item.isNavigator ? 'is-leading' : ''}">
        <div class="persuasion-row-head">
          <span>${item.isNavigator ? '<span class="lead-crown">👑</span>' : ''}第 ${item.id} 組 (${item.voterCount} 組認同)</span>
          <strong>${item.totalPoints} <small>點</small></strong>
        </div>
        <div class="mana-progress-track">
          <div class="mana-progress-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="voting-stage-grid">
      <!-- Left Column: JRPG Stage Dialogue Box & Bust -->
      <div class="voting-left-col">
        ${leftStageHtml}
      </div>

      <!-- Right Column: Interactive 3-Act Control Panel -->
      <div class="voting-right-col">
        <!-- 1. Real-time Initial Vote Progress -->
        <section class="progress-card card" aria-label="全班初投進度">
          <div class="progress-intro">
            <div>
              <h2>初投定錨進度（全班 5 組）</h2>
              <p>${state.phase === 'voting' ? (allVoted ? '5 組已全數鎖定初投 · 進入跨立場辯論' : '各組研討初投提交中…') : '學員加入後即可開始'}</p>
            </div>
            <div class="stat-number">${state.completed}<small>/ 5 組</small></div>
          </div>
          <div class="progress-chips-row">
            ${state.groups.map(g => `
              <div class="progress-chip ${g.submitted ? 'is-done done' : g.count ? 'is-active' : ''}">
                <span class="chip-dot" aria-hidden="true"></span>
                <span class="chip-name">第 ${g.id} 組</span>
                <span class="chip-status">${g.submitted ? '已鎖定' : g.count ? '研討中' : '未加入'}</span>
                ${g.cascade ? `<small class="cascade-mini">(${esc(g.cascade.badge)})</small>` : ''}
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 2. Persuasion Live Board & 60s Debate Timer -->
        <div class="card pitch-timer-card ${isPitchActive ? 'is-active' : ''}">
          <div class="pitch-timer-head">
            <div>
              <span class="eyebrow">PERSUASION & 60s DEBATE</span>
              <h2>5 點說服點數即時戰況榜</h2>
              <span class="pitch-status-note ${isPitchActive ? 'active-note' : ''}">
                ${state.chiefNavigator ? `當前首席領航者：👑 第 ${state.chiefNavigator} 組` : '跨立場辯論中 · 每組分配 5 點（單組上限 3 點）'}
              </span>
            </div>
            <div class="pitch-clock-display">
              <span class="pitch-clock mono" data-pitch-clock>01:00</span>
            </div>
          </div>
          <div class="persuasion-live-board">
            ${persuasionRows || '<div class="muted" style="padding:10px; font-size:12px;">尚無組別送出說服點數</div>'}
          </div>
          <div class="pitch-actions-grid" style="margin-top:10px;">
            ${[1, 2, 3, 4, 5].map(gid => `<button type="button" class="pitch-btn ${state.pitch?.group === gid || state.pitch?.group === String(gid) ? 'active' : ''}" data-pitch-group="${gid}">第 ${gid} 組 60s</button>`).join('')}
            <button type="button" class="pitch-btn pitch-all-btn ${state.pitch?.group === 'all' ? 'active' : ''}" data-pitch-group="all">全班 60s 辯論</button>
            <button type="button" class="pitch-btn pitch-stop-btn" data-pitch-group="stop">結束辯論</button>
          </div>
        </div>

        <!-- 3. Chief Navigator Final Decision Status Panel -->
        <div class="card navigator-final-panel" style="margin-top:10px;">
          <div class="eyebrow">CHIEF NAVIGATOR'S CALL</div>
          <div style="margin-top:6px;">
            ${state.chiefNavigator ? (
              state.hasFinalDecision ? `
                <div style="background:#fefce8; border:1.5px solid #eab308; border-radius:10px; padding:12px 14px; color:#78350f;">
                  <strong>👑 第 ${state.chiefNavigator} 組（首席領航者）已拍板全班最終策略 ✓</strong>
                  <p style="margin:4px 0 0; font-size:12px; color:#92400e;">揭曉時將公開方案與領航救援成果</p>
                </div>
              ` : `
                <div style="background:#fffbeb; border:1.5px dashed #f59e0b; border-radius:10px; padding:12px 14px; color:#92400e;">
                  <strong>👑 第 ${state.chiefNavigator} 組（首席領航者）正在研讀【極密情報】並代表全班拍板…</strong>
                  <p style="margin:4px 0 0; font-size:12px; color:#b45309;">該組手機端已解鎖內幕檔案，請口頭向全班說明後直接拍板！</p>
                </div>
              `
            ) : `
              <div style="background:#f8fafc; border:1px dashed var(--line); border-radius:10px; padding:12px 14px; color:var(--muted); font-size:13px;">
                等待說服點數選出首席領航者 · 隨後解鎖極密情報並拍板全班答案
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

function quadrantMatrixMarkup() {
  const pointsHtml = state.distribution.map(o => {
    const q = o.result?.quadrant || { x: 50, y: 50, zone: '' };
    const pickedGroups = [1, 2, 3, 4, 5].filter(gid => state.results?.[gid]?.id === o.id);
    const isBest = (o.result?.cq ?? 0) > 0;
    const topPct = 100 - q.y;
    const short = o.result?.shortTitle || o.title.slice(0, 4);
    return `<button type="button" class="matrix-point ${isBest ? 'is-best' : 'is-risk'} ${pickedGroups.length ? 'has-groups' : ''}" data-review="${o.id}" style="left:${q.x}%; top:${topPct}%;" title="點擊檢視方案 ${o.id}：${esc(o.title)}">
      <span class="matrix-node-letter">${o.id === 'X' ? '✕' : o.id}</span>
      <span class="matrix-node-title">${esc(short)}</span>
      ${pickedGroups.length ? `<span class="matrix-group-badges">${pickedGroups.map(gid => `<b class="matrix-g-pill">第${gid}組</b>`).join('')}</span>` : ''}
    </button>`;
  }).join('');

  return `<div class="quadrant-matrix-wrap">
    <div class="section-heading" style="margin-bottom:4px;">
      <h2>2×2 跨文化領導決策象限（HBR Being the Boss）</h2>
      <span>點擊座標點切換右側解析</span>
    </div>
    <div class="quadrant-axis-header">
      <span>▲ 共識型決策 Consensual（大 D 承諾 · 全員校準）</span>
    </div>
    <div class="quadrant-board" role="region" aria-label="2x2 跨文化領導決策象限圖">
      <div class="q-cell q-tl"><span class="q-zone-name">共識 × 平等區</span><small>北歐 / 荷蘭 · 促進者模式</small></div>
      <div class="q-cell q-tr"><span class="q-zone-name">共識 × 階層區</span><small>日本 / 德國 · 根回稟議大 D</small></div>
      <div class="q-cell q-bl"><span class="q-zone-name">由上而下 × 平等區</span><small>美國 / 英國 · 小 d 靈活速決</small></div>
      <div class="q-cell q-br"><span class="q-zone-name">由上而下 × 階層區</span><small>中國 / 法印 · 導演明確指令</small></div>
      <div class="q-axis-h"></div>
      <div class="q-axis-v"></div>
      ${pointsHtml}
    </div>
    <div class="quadrant-axis-footer">
      <span>◀ 平等主義 Egalitarian</span>
      <span>▼ 由上而下 Top-Down（小 d 速決 · 敏捷試錯）</span>
      <span>階層制 Hierarchical ▶</span>
    </div>
  </div>`;
}

function resultsMarkup() {
  const r = state.round;
  const values = Object.values(state.results || {});
  const current = values.length ? Math.round(values.reduce((sum, r) => sum + r.tension, 0) / values.length * 10) / 10 : null;
  const reduction = current === null ? 0 : Math.round((state.round.baseline - current) * 10) / 10;
  const isGoodOutcome = state.worldState?.['r' + (state.roundIndex + 1)] === 'good';

  return `
    <!-- Top Result Banner -->
    <div class="card" style="border:2px solid ${isGoodOutcome ? '#16a34a' : '#dc2626'}; background:${isGoodOutcome ? '#f0fdf4' : '#fef2f2'}; margin-bottom:12px; padding:12px 18px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong style="color:${isGoodOutcome ? '#15803d' : '#b91c1c'}; font-size:16px;">
          ${isGoodOutcome
            ? `🎉 首席領航者（第 ${state.chiefNavigator || '—'} 組）拍板成功！全員協同大共贏（每組 +15 CQ）`
            : `⚠️ 首席領航者（第 ${state.chiefNavigator || '—'} 組）拍板踩雷！觸發【全班共業警報】`
          }
        </strong>
        <p style="margin:2px 0 0; font-size:12.5px; color:${isGoodOutcome ? '#166534' : '#991b1b'};">
          ${isGoodOutcome
            ? '初投失誤組別負面扣分減免 60%，全班 5 組加分，下回合解鎖正面盟友支援！'
            : '初投失誤組別承受全額扣分，下回合全班 5 組共同承受負面組織困境（研討時間縮短 30 秒）！'
          }
        </p>
      </div>
      <span class="pill ${isGoodOutcome ? 'positive' : 'negative'}" style="font-size:13.5px; font-weight:700;">
        世界狀態：${isGoodOutcome ? '正面連鎖 🟢' : '深層共業 🔴'}
      </span>
    </div>

    <div class="compact-reveal-header">
      <div class="reveal-header-title">
        <span class="topic-badge">ROUND ${String(state.roundIndex + 1).padStart(2, '0')} · ${r.dimension}</span>
        <span class="reveal-location">${esc(r.location)}</span>
      </div>
      <div class="reveal-header-tension">
        <span>基準張力 <strong>${r.baseline}%</strong></span>
        <i>→</i>
        <span>平均決策張力 <strong class="${reduction > 0 ? 'positive-text' : 'negative-text'}">${current ?? r.baseline}%</strong></span>
        <span class="pill ${reduction > 0 ? 'positive' : 'negative'}">${reduction > 0 ? `↓ 張力降 ${reduction} 點` : reduction < 0 ? `↑ 張力升 ${Math.abs(reduction)} 點` : '張力持平'}</span>
      </div>
    </div>

    <div class="results-bento-grid">
      <!-- Col 1: Matrix & Distribution -->
      <section class="card bento-col bento-col-matrix">
        ${quadrantMatrixMarkup()}
        <div class="bento-dist-bar">
          ${state.distribution.map(o => `
            <span class="dist-mini-chip ${o.id === selectedReview ? 'active' : ''}" data-review="${o.id}">
              <b>${o.id === 'X' ? '✕' : o.id}</b> ${esc(o.result?.shortTitle || o.title.slice(0, 4))} <small>(${o.count}組)</small>
            </span>
          `).join('')}
        </div>
      </section>

      <!-- Col 2: Central 5-Group Score Breakdown & Rescue Showcase -->
      <section class="card bento-col bento-col-leaderboard">
        <div class="leaderboard-head">
          <div class="eyebrow">RESCUE & SCORE BREAKDOWN</div>
          <h2>5 組初投與領航救援明細榜</h2>
          <div class="host-jury-role-strip">
            <span>全班最終方案：<strong>方案 ${state.finalDecision || '—'}</strong></span>
            <span class="jury-status-pill">${isGoodOutcome ? '雙層救援生效' : '全額扣分結算'}</span>
          </div>
        </div>

        <div class="host-jury-board-list" style="display:flex; flex-direction:column; gap:8px;">
          ${state.groups.map(g => {
            const res = state.results?.[g.id];
            const isNav = g.id === state.chiefNavigator;
            return `
              <div class="score-breakdown-card ${isNav ? 'is-winner' : ''}">
                <div class="breakdown-header">
                  <span>第 ${g.id} 組 ${isNav ? '<span class="navigator-crown-pill">👑 領航組</span>' : ''}</span>
                  <strong style="font-size: 15px;">${g.cq} <small>CQ</small></strong>
                </div>
                <div class="breakdown-pills">
                  <span class="score-pill initial">初投 ${res?.id || '—'} (${res?.baseDelta >= 0 ? '+' : ''}${res?.baseDelta ?? 0})</span>
                  ${res?.rescueBonus > 0 ? `<span class="score-pill rescue">領航救援 +${res.rescueBonus}</span>` : ''}
                  ${res?.synergyBonus > 0 ? `<span class="score-pill synergy">全員共贏 +${res.synergyBonus}</span>` : ''}
                </div>
                <div class="breakdown-net">
                  <span>本輪淨變動：</span>
                  <strong class="${res?.actualDelta > 0 ? 'positive-text' : res?.actualDelta < 0 ? 'negative-text' : ''}">
                    ${res?.actualDelta >= 0 ? '+' : ''}${res?.actualDelta ?? 0} CQ
                  </strong>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Col 3: Review Deep Dive & Classified Intel Decryption -->
      <section class="card bento-col bento-col-review">
        <div class="review-head-banner">
          <div class="eyebrow">CULTURAL BLINDSPOT ANALYSIS</div>
          <h2>看見文化盲點（情境解密）</h2>
        </div>
        <div class="review-tabs" role="tablist" aria-label="方案覆盤">
          ${state.distribution.map(o => `
            <button class="review-tab" role="tab" data-review="${o.id}" aria-selected="${selectedReview === o.id}" aria-controls="review-content">
              ${o.id === 'X' ? '破局' : '方案 ' + o.id} · ${esc(o.result?.shortTitle || o.title.slice(0, 4))}
            </button>
          `).join('')}
        </div>
        <div id="review-content" role="tabpanel" aria-live="polite"></div>

        ${state.hiddenIntel ? `
          <div class="classified-intel-box" style="margin-top: 14px;">
            <div class="classified-stamp">已公開解密</div>
            <div class="classified-header">
              <h4 class="classified-title">${esc(state.hiddenIntel.title)}</h4>
              <p class="classified-subtitle">首度向全班公開之內部機密關鍵情報</p>
            </div>
            <div class="classified-body">${esc(state.hiddenIntel.text)}</div>
          </div>
        ` : ''}
      </section>
    </div>
  `;
}

function renderReview() {
  const entry = state.distribution?.find(o => o.id === selectedReview) || state.distribution?.[0];
  if (!entry) return;
  selectedReview = entry.id;
  const r = entry.result;
  document.querySelectorAll('[data-review]').forEach(el => {
    el.setAttribute('aria-selected', String(el.dataset.review === selectedReview));
    el.classList.toggle('is-active-point', el.dataset.review === selectedReview);
    el.classList.toggle('active', el.dataset.review === selectedReview);
  });
  const q = r.quadrant;
  const contentEl = $('#review-content');
  if (!contentEl) return;
  contentEl.innerHTML = `
    <div class="review-badge-row">
      ${q ? `<span class="review-zone-badge">象限落點：${esc(q.zone)}</span>` : ''}
      <span class="pill ${r.reduction > 0 ? 'positive' : 'negative'}">${r.reduction > 0 ? '↓ 張力降 ' + r.reduction + ' 點' : r.reduction < 0 ? '↑ 張力升 ' + Math.abs(r.reduction) + ' 點' : '張力持平'}</span>
      <span class="pill ${r.cq > 0 ? 'positive' : 'negative'}">方案基礎 ${r.cq > 0 ? '+' + r.cq : r.cq} CQ</span>
    </div>
    <h3 class="review-verdict">${esc(r.verdict)}</h3>
    <p class="review-copy">${esc(r.analysis)}</p>
    <div class="review-insight">
      <div class="eyebrow">BEYOND THE WORDS · 深層文化盲點</div>
      <p class="review-copy">${esc(r.blindspot)}</p>
    </div>
  `;
}

async function hostAction(action, extra = {}) {
  if (busy) return;
  if (action === 'next') {
    busy = true;
    document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = true);
    try {
      await api('next', extra, 'host');
      const latest = await api('state', undefined, 'host');
      if (latest.roundIndex <= 3 && latest.phase !== 'finished') {
        try { await api('start', {}, 'host'); } catch (err) {}
      }
      broadcastSync('host_action', { action: 'next', roundIndex: latest.roundIndex });
      lastSignature = '';
      await refresh();
      toast(latest.phase === 'finished' ? '四回合已全部完成！' : `已進入第 ${latest.roundIndex + 1} 回合研討 ✓`);
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
      if (!await ask('仍有組別正在討論', `目前 ${state.completed} / 5 組已提交初投。現在揭曉會結束本回合初投與說服，確定要進行揭曉嗎？`, '結束並揭曉')) return;
      extra.confirmIncomplete = true;
    }
  }
  busy = true;
  document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = true);
  try {
    await api(action, extra, 'host');
    broadcastSync('host_action', { action, roundIndex: state?.roundIndex });
    lastSignature = '';
    await refresh();
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
  $('#qr-url').textContent = state.joinUrl;
  $('#qr-code').innerHTML = '';
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(state.joinUrl);
    qr.make();
    $('#qr-code').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
    $('#qr-code svg').setAttribute('aria-label', '學員加入 QR Code');
    $('#qr-code svg').setAttribute('role', 'img');
  } catch {
    $('#qr-code').textContent = 'QR Code 無法產生，請使用下方網址';
  }
  $('#qr-note').textContent = /localhost|127\.0\.0\.1/.test(state.joinUrl)
    ? '目前為本機預覽。手機加入請使用同一 Wi-Fi 的電腦區網網址，或部署後的正式網址。'
    : '第 1～5 組皆為決策組。掃碼後填寫姓名加入。';
  $('#qr-dialog').showModal();
});

$('#copy-url').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(state.joinUrl);
    toast('參與網址已複製');
  } catch {
    toast('請長按或選取網址複製');
  }
});

$('#sound-toggle')?.addEventListener('click', () => {
  const on = toggleSound();
  $('#sound-toggle').textContent = on ? '🔊 音效' : '🔇 靜音';
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
    await hostAction('reset', { confirm: 'RESET' });
  }
});

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'group_vote') {
    if (packet.roundIndex === state.roundIndex) {
      const gid = Number(packet.group);
      if (gid >= 1 && gid <= 5) {
        const g = state.groups?.find(grp => grp.id === gid);
        if (g) {
          g.submitted = true;
          state.completed = state.groups.filter(grp => grp.submitted).length;
          render();
        }
      }
    }
  } else if (packet.type === 'host_action') {
    refresh();
  }
});

async function poll() {
  await refresh();
  setTimeout(poll, document.hidden ? 5000 : 1500);
}

window.addEventListener('pitch-ended', () => { render(); });
startClock(() => state, { enableAudio: true });
poll();
