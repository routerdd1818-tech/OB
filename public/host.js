import { $, esc, api, toast, status, scene, roundNav, tensionCard, dialogue, startClock, broadcastSync, listenSync, playRevealDrum, toggleSound, isSoundEnabled } from './common.js';
import { renderRpgScene, renderCharacterBust, renderRpgDialogueBox, renderWorldStateHud, renderQrJoinDock } from './rpg-assets.js';

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
      ${state.roundIndex < 3 && !revealed ? `
        <button class="button quiet" data-host-action="skip-next" type="button" title="直接跳轉至下一回合">跳下一回合 ⏭</button>
      ` : ''}
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
  document.querySelectorAll('[data-nav-step]').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = () => {
      const target = Number(el.dataset.navStep);
      if (target === state.roundIndex) return;
      hostAction('jump', { roundIndex: target });
    };
  });
  $('#finish-manage')?.addEventListener('click', openManage);
  document.querySelectorAll('[data-review]').forEach(el => el.addEventListener('click', () => { selectedReview = el.dataset.review; renderReview(); }));
  document.querySelectorAll('[data-pitch-group]').forEach(btn => btn.addEventListener('click', async () => {
    const group = btn.dataset.pitchGroup;
    try {
      const pitchObj = group === 'stop' ? null : {
        group,
        deadline: Date.now() + 60 * 1000,
        seconds: 60,
        startedAt: Date.now()
      };
      state.pitch = pitchObj;
      render();
      await api('pitch', { group, seconds: 60 }, 'host');
      broadcastSync('pitch_update', { pitch: pitchObj });
      toast(group === 'stop' ? '已停止辯論倒數' : group === 'all' ? '已啟動全班 60 秒跨立場辯論！' : `已啟動第 ${group} 組 60 秒申辯！`);
    } catch (e) {
      toast(e.message);
    }
  }));

  if (revealed) renderReview();
  paintQr(document.getElementById('stage-qr-code'), resolveJoinUrl());

  const qrDock = document.querySelector('.qr-join-dock');
  if (qrDock) {
    qrDock.style.cursor = 'pointer';
    qrDock.setAttribute('title', '點擊放大投影 QR Code');
    qrDock.onclick = () => $('#qr-open')?.click();
  }
  const qrUrlEl = document.querySelector('.qr-dock-url');
  if (qrUrlEl) {
    qrUrlEl.style.cursor = 'pointer';
    qrUrlEl.onclick = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(resolveJoinUrl());
        toast('參與網址已複製到剪貼簿 ✓');
      } catch {
        $('#qr-open')?.click();
      }
    };
  }
}

function scenarioMarkup() {
  const r = state.round;
  const prevWorld = state.worldState ? (state.roundIndex === 1 ? state.worldState.r1 : state.roundIndex === 2 ? state.worldState.r2 : state.roundIndex === 3 ? state.worldState.r3 : 'idle') : 'idle';
  const mood = prevWorld === 'good' ? 'ally' : prevWorld === 'bad' ? 'angry' : 'normal';

  const stageHtml = renderRpgDialogueBox({
    roundIndex: state.roundIndex,
    speaker: r.speaker,
    text: r.dialogue?.[1]?.text || r.context,
    prompt: r.prompt,
    mood,
    worldState: state.worldState,
    groups: state.groups,
    chiefNavId: state.chiefNavigator
  });

  const now = Date.now() + (state.clockOffset || 0);
  const isPitchActive = Boolean(state.pitch && state.pitch.deadline && state.pitch.deadline > now);
  const onlineGroups = state.groups.filter(g => g.count).length;
  const totalStudents = state.groups.reduce((n, g) => n + (g.count || 0), 0);

  const persuasionRows = (state.persuasionBoard || []).map(item => {
    const pct = Math.min(100, Math.round((item.totalPoints / 12) * 100));
    return `
      <div class="persuasion-row ${item.isNavigator ? 'is-leading' : ''}">
        <div class="persuasion-row-head">
          <span>${item.isNavigator ? '<span class="lead-crown">👑</span>' : ''}第 ${item.id} 組 <small>(${item.voterCount}組認同)</small></span>
          <strong>${item.totalPoints} <small>點</small></strong>
        </div>
        <div class="mana-progress-track">
          <div class="mana-progress-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="unified-stage-container">
      <!-- 完整滿版 JRPG 舞台（含圍坐桌旁的小人、立繪與底部對話框） -->
      ${stageHtml}

      <!-- 整合在畫面左上角的淺色毛玻璃戰術 HUD 狀態欄 -->
      <aside class="integrated-hud-overlay" aria-label="課堂即時戰況與控制面板">
        <!-- 1. 緊湊型掃碼與初投進度列 -->
        <div class="hud-glass-card">
          <div class="hud-row-between">
            <div>
              <span class="eyebrow">STEP 1 · 初投定錨進度</span>
              <div style="font-size:13px; font-weight:800; color:#1c1917;">
                已鎖定 ${state.completed} / 5 組 <small style="font-weight:500; color:#57534e;">(${totalStudents}人入席)</small>
              </div>
            </div>
            <div id="stage-qr-code" class="qr-mini-box" title="點擊放大 QR Code" onclick="document.getElementById('qr-open')?.click()"></div>
          </div>
          <div class="progress-chips-row" style="margin-top:8px;">
            ${state.groups.map(g => `
              <div class="progress-chip ${g.submitted ? 'is-done done' : g.count ? 'is-active' : ''}">
                <span class="chip-dot"></span>
                <span class="chip-name">G${g.id}</span>
                <span class="chip-status">${g.submitted ? '✓' : g.count ? '…' : '-'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. 60秒辯論計時與說服點數榜 -->
        <div class="hud-glass-card ${isPitchActive ? 'is-active-pitch' : ''}">
          <div class="hud-row-between" style="margin-bottom:6px;">
            <div>
              <span class="eyebrow">STEP 2 · 60s 辯論與說服榜</span>
              <div style="font-size:13.5px; font-weight:800; color:#1c1917;">說服點數即時戰況</div>
            </div>
            <span class="pitch-clock mono" data-pitch-clock style="font-size:22px; font-weight:800; color:#1c1917;">01:00</span>
          </div>

          <div class="persuasion-live-board">
            ${persuasionRows || '<div style="padding:6px 0; font-size:12px; color:#57534e;">尚無組別送出說服點數</div>'}
          </div>

          <div class="pitch-actions-grid" style="margin-top:8px; grid-template-columns: repeat(4, 1fr); gap:5px;">
            ${[1, 2, 3, 4, 5].map(gid => `
              <button type="button" class="pitch-btn ${String(state.pitch?.group) === String(gid) ? 'active' : ''}" data-pitch-group="${gid}">G${gid} 申辯</button>
            `).join('')}
            <button type="button" class="pitch-btn pitch-all-btn ${state.pitch?.group === 'all' ? 'active' : ''}" data-pitch-group="all" style="grid-column: span 2;">🔥 全班 60s 激辯</button>
            <button type="button" class="pitch-btn pitch-stop-btn" data-pitch-group="stop">■ 停止</button>
          </div>
        </div>

        <!-- 3. 首席領航者最終拍板狀態 -->
        <div class="hud-glass-card">
          <span class="eyebrow">STEP 3 · 首席領航者拍板</span>
          <div style="margin-top:4px; font-size:12.5px; font-weight:700; color:#1c1917;">
            ${state.chiefNavigator ? (
              state.hasFinalDecision
                ? `<span style="color:#15803d;">👑 第 ${state.chiefNavigator} 組已拍板全班最終策略 ✓</span>`
                : `<span style="color:#b45309;">👑 第 ${state.chiefNavigator} 組正在研讀【極密情報】並拍板…</span>`
            ) : '<span style="color:#57534e; font-weight:500;">等待說服點數最高組別解鎖【極密情報】</span>'}
          </div>
        </div>
      </aside>
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
    <!-- 頂部極簡揭曉橫幅（合併世界狀態與張力變化，省下垂直高度） -->
    <div class="reveal-top-strip ${isGoodOutcome ? 'is-good' : 'is-bad'}">
      <div class="reveal-strip-left">
        <span class="topic-badge">ROUND ${String(state.roundIndex + 1).padStart(2, '0')} · ${r.dimension}</span>
        <strong>
          ${isGoodOutcome
            ? `🎉 首席領航者（第 ${state.chiefNavigator || '—'} 組）拍板成功！全員共贏 +15 CQ（失誤扣分減免 60%）`
            : `⚠️ 首席領航者（第 ${state.chiefNavigator || '—'} 組）拍板踩雷！觸發全班共業警報（下輪研討 -30s）`
          }
        </strong>
      </div>
      <div class="reveal-strip-right">
        <span>張力 <strong>${r.baseline}% → ${current ?? r.baseline}%</strong></span>
        <span class="pill ${reduction > 0 ? 'positive' : 'negative'}">
          ${reduction > 0 ? `↓ 降 ${reduction}%` : reduction < 0 ? `↑ 升 ${Math.abs(reduction)}%` : '持平'}
        </span>
      </div>
    </div>

    <!-- 主體雙欄佈局：左窄 (36% 象限與5組戰況) / 右寬 (64% 題目解釋與文化盲點主舞台) -->
    <div class="results-focus-grid">
      
      <!-- 左欄：2x2 象限圖 + 5 組單行極簡戰況表 -->
      <div class="results-side-col">
        <section class="card side-matrix-card">
          ${quadrantMatrixMarkup()}
        </section>

        <section class="card side-scoreboard-card">
          <div class="side-score-head">
            <h2>5 組決策與救援結算</h2>
            <span>全班拍板：<strong>方案 ${state.finalDecision || '—'}</strong></span>
          </div>
          <div class="compact-score-list">
            ${state.groups.map(g => {
              const res = state.results?.[g.id];
              const isNav = g.id === state.chiefNavigator;
              const delta = res?.actualDelta ?? 0;
              return `
                <div class="compact-score-row ${isNav ? 'is-nav' : ''}">
                  <div class="c-group">
                    <strong>第 ${g.id} 組</strong>
                    ${isNav ? '<span class="navigator-crown-pill">👑 領航</span>' : ''}
                  </div>
                  <div class="c-badges">
                    <span class="score-pill initial">初投 ${res?.id || '—'} (${res?.baseDelta >= 0 ? '+' : ''}${res?.baseDelta ?? 0})</span>
                    ${res?.rescueBonus > 0 ? `<span class="score-pill rescue">救援 +${res.rescueBonus}</span>` : ''}
                    ${res?.synergyBonus > 0 ? `<span class="score-pill synergy">共贏 +${res.synergyBonus}</span>` : ''}
                  </div>
                  <div class="c-total">
                    <span class="c-delta ${delta > 0 ? 'positive-text' : delta < 0 ? 'negative-text' : ''}">
                      ${delta >= 0 ? '+' : ''}${delta}
                    </span>
                    <strong class="c-cq">${g.cq} <small>CQ</small></strong>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      </div>

      <!-- 右欄（64% 主視覺焦點）：看見文化盲點 ＆ 題目深度解釋 -->
      <section class="card results-main-review">
        <div class="review-main-header">
          <div>
            <div class="eyebrow">CULTURAL BLINDSPOT & CASE DEBRIEF</div>
            <h2>看見文化盲點（題目深度解析）</h2>
          </div>
          <span class="review-hint-text">點擊下方方案切換解析</span>
        </div>

        <!-- 單行緊湊型方案切換 Tabs -->
        <div class="review-tabs-compact" role="tablist" aria-label="方案覆盤">
          ${state.distribution.map(o => {
            const isFinal = state.finalDecision === o.id;
            const isBest = (o.result?.cq ?? 0) > 0;
            return `
              <button class="review-tab-btn ${selectedReview === o.id ? 'active' : ''} ${isBest ? 'is-best-tab' : ''}" role="tab" data-review="${o.id}" aria-selected="${selectedReview === o.id}">
                <span class="tab-letter">${o.id === 'X' ? '破局' : '方案 ' + o.id}</span>
                <span class="tab-title">${esc(o.result?.shortTitle || o.title.slice(0, 6))}</span>
                <span class="tab-count">${o.count}組</span>
                ${isFinal ? '<span class="tab-final-crown" title="全班最終拍板方案">👑</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- 題目解釋與深層盲點主要內容區 -->
        <div id="review-content" class="review-main-body" role="tabpanel" aria-live="polite"></div>
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
    const isSelected = el.dataset.review === selectedReview;
    el.setAttribute('aria-selected', String(isSelected));
    el.classList.toggle('is-active-point', isSelected);
    el.classList.toggle('active', isSelected);
  });

  const q = r.quadrant;
  const contentEl = $('#review-content');
  if (!contentEl) return;

  const pickedGroups = [1, 2, 3, 4, 5].filter(gid => state.results?.[gid]?.id === entry.id);

  contentEl.innerHTML = `
    <!-- 1. 方案標題與決策成效指標列 -->
    <div class="debrief-hero-box ${(r.cq ?? 0) > 0 ? 'is-optimal' : 'is-risk'}">
      <div class="debrief-meta-row">
        <div class="debrief-badges">
          <span class="debrief-opt-tag">${entry.id === 'X' ? '談判破局' : '方案 ' + entry.id + '：' + esc(entry.title)}</span>
          ${q ? `<span class="review-zone-badge">📍 象限落點：${esc(q.zone)}</span>` : ''}
          ${pickedGroups.length ? `<span class="picked-groups-tag">初投選擇：第 ${pickedGroups.join('、')} 組</span>` : '<span class="picked-groups-tag muted">無組別初投此項</span>'}
        </div>
        <div class="debrief-metrics">
          <span class="pill ${r.reduction > 0 ? 'positive' : 'negative'}">
            ${r.reduction > 0 ? '↓ 張力降 ' + r.reduction + ' 點' : r.reduction < 0 ? '↑ 張力升 ' + Math.abs(r.reduction) + ' 點' : '張力持平'}
          </span>
          <span class="pill ${r.cq > 0 ? 'positive' : 'negative'}">
            方案基礎 ${r.cq > 0 ? '+' + r.cq : r.cq} CQ
          </span>
        </div>
      </div>

      <!-- 2. 核心診斷結論與題目情境解釋（字體放大、行距寬鬆） -->
      <h3 class="debrief-verdict-title">${esc(r.verdict)}</h3>
      <p class="debrief-analysis-text">${esc(r.analysis)}</p>
    </div>

    <!-- 3. 下半部雙欄並排：深層文化盲點 ＋ 內部極密情報解密 -->
    <div class="debrief-bottom-grid ${state.hiddenIntel ? 'has-intel' : ''}">
      <div class="debrief-blindspot-card">
        <div class="eyebrow">💡 BEYOND THE WORDS · 深層文化盲點與管理啟示</div>
        <p class="debrief-blindspot-text">${esc(r.blindspot)}</p>
      </div>

      ${state.hiddenIntel ? `
        <div class="debrief-intel-card">
          <div class="debrief-intel-head">
            <span class="eyebrow">📂 CLASSIFIED INTEL · 關鍵內幕解密</span>
            <span class="intel-mini-stamp">已解密公開</span>
          </div>
          <h4>${esc(state.hiddenIntel.title)}</h4>
          <p>${esc(state.hiddenIntel.text)}</p>
        </div>
      ` : ''}
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
      const target = Math.min(3, state.roundIndex + 1);
      await api('jump', { roundIndex: target }, 'host');
      await api('start', {}, 'host').catch(() => {});
      broadcastSync('host_action', { action: 'jump', roundIndex: target });
      lastSignature = '';
      await refresh();
      toast(`已切換至第 ${target + 1} 回合研討 ✓`);
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
      await api('jump', { roundIndex: extra.roundIndex }, 'host');
      await api('start', {}, 'host').catch(() => {});
      broadcastSync('host_action', { action: 'jump', roundIndex: extra.roundIndex });
      lastSignature = '';
      await refresh();
      toast(`已切換至第 ${extra.roundIndex + 1} 回合研討 ✓`);
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
      let latest = await api('next', { force: true, ...extra }, 'host');
      if (latest && latest.roundIndex !== undefined) {
        if (latest.roundIndex <= 3 && latest.phase !== 'finished') {
          try {
            const started = await api('start', {}, 'host');
            if (started && started.roundIndex !== undefined) latest = started;
          } catch (err) {}
        }
        latest.clockOffset = (latest.serverTime || Date.now()) - Date.now();
        state = latest;
        lastSignature = JSON.stringify({ ...latest, serverTime: 0, clockOffset: 0 });
        render();
        broadcastSync('host_action', { action: 'next', roundIndex: latest.roundIndex });
        toast(latest.phase === 'finished' ? '四回合已全部完成！' : `已進入第 ${latest.roundIndex + 1} 回合研討 ✓`);
      } else {
        const polled = await api('state', undefined, 'host');
        if (polled.roundIndex <= 3 && polled.phase !== 'finished') {
          try { await api('start', {}, 'host'); } catch (err) {}
        }
        broadcastSync('host_action', { action: 'next', roundIndex: polled.roundIndex });
        lastSignature = '';
        await refresh();
        toast(polled.phase === 'finished' ? '四回合已全部完成！' : `已進入第 ${polled.roundIndex + 1} 回合研討 ✓`);
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
      if (!await ask('仍有組別正在討論', `目前 ${state.completed} / 5 組已提交初投。現在揭曉會結束本回合初投與說服，確定要進行揭曉嗎？`, '結束並揭曉')) return;
      extra.confirmIncomplete = true;
    }
  }
  busy = true;
  document.querySelectorAll('[data-host-action]').forEach(el => el.disabled = true);
  try {
    const res = await api(action, extra, 'host');
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
  } else if (packet.type === 'pitch_update') {
    state.pitch = packet.pitch;
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
