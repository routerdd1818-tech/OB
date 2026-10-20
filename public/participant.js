import { $,esc,api,toast,status,scene,roundNav,tensionCard,dialogue,startClock,broadcastSync,listenSync } from './common.js';
let state=null,lastSignature='',selection=null,consensus=[null,null,null],juryRankings={},juryOrders={},roundKey='',busy=false,online=false,participantBoardSort='cq',currentJuryStage=1,juryPitchSkipped=false;
const gate=$('#onboarding');
gate.addEventListener('cancel',e=>{ if(!state?.member) e.preventDefault(); });

function updateChoiceUI(){
  if(state?.member?.isJury) {
    const juryLocked = Boolean(state.jurySubmitted);
    const canInteract = !juryLocked && currentJuryStage === 3;
    const vals = Object.values(juryRankings);
    const empUsed = vals.filter(v => v === 'empathy').length;
    const vetoUsed = vals.filter(v => v === 'veto').length;
    const empEl = $('#quota-empathy');
    if (empEl) empEl.textContent = `${Math.max(0, 2 - empUsed)} / 2 張`;
    const vetoEl = $('#quota-veto');
    if (vetoEl) vetoEl.textContent = `${Math.max(0, 1 - vetoUsed)} / 1 張`;

    document.querySelectorAll('[data-jury-team]').forEach(btn=>{
      const tid=Number(btn.dataset.juryTeam);const rank=btn.dataset.rank;
      btn.setAttribute('aria-pressed',String(juryRankings[tid]===rank||juryRankings[tid]===Number(rank)));
      if(!canInteract) btn.disabled=true;
    });
    document.querySelectorAll('[data-jury-order-team]').forEach(btn=>{
      const tid=Number(btn.dataset.juryOrderTeam);const ord=Number(btn.dataset.order);
      const isAct = juryOrders[tid]===ord;
      btn.setAttribute('aria-pressed',String(isAct));
      btn.classList.toggle('active', isAct);
      if(!canInteract) btn.disabled=true;
    });
    const submit=$('#submit-jury');
    if(submit) submit.disabled=!canInteract||busy||!online||Object.keys(juryRankings).length===0;
    return;
  }
  const hasVoted = Boolean(state?.vote?.choice);
  document.querySelectorAll('[data-choice]').forEach(el=>{
    el.setAttribute('aria-checked',String(el.dataset.choice===selection));
    if(hasVoted) {
      el.classList.add('locked');
      el.disabled=true;
    }
  });
  document.querySelectorAll('[data-consensus]').forEach(el=>{
    el.setAttribute('aria-pressed',String(consensus[Number(el.dataset.consensus)]===(el.dataset.value==='true')));
    if(hasVoted) el.disabled=true;
  });
  const submit=$('#submit-vote');if(submit)submit.disabled=hasVoted||busy||!online||!selection||(state?.roundIndex===3&&consensus.some(x=>x===null));
}

function render(){
  const r=state.round;const member=state.member;const revealed=['revealed','finished'].includes(state.phase);const key=state.epoch+':'+state.roundIndex;
  if(key!==roundKey){
    selection=state.vote?.proposal || null;
    consensus=state.vote?.consensus || [null,null,null];
    juryRankings={...(state.juryRankings||{})};
    juryOrders={...(state.juryOrders||{})};
    juryPitchSkipped=false;
    roundKey=key;
  } else if(!selection && state.vote?.proposal){
    selection=state.vote.proposal;
    consensus=state.vote.consensus || [null,null,null];
  }
  if (state.juryOrders && Object.keys(juryOrders).length === 0 && Object.keys(state.juryOrders).length > 0) {
    juryOrders = { ...state.juryOrders };
  }
  document.documentElement.style.setProperty('--accent',r.color);

  const completedCount = state.decisionGroups ? state.decisionGroups.filter(g => g.submitted).length : 0;
  const allFourSubmitted = completedCount >= 4;
  const now = Date.now() + (state.clockOffset || 0);
  const isPitchRunning = Boolean(state.pitch?.deadline && state.pitch.deadline > now && !juryPitchSkipped);
  const isPitchFinished = Boolean(
    juryPitchSkipped ||
    (state.pitch?.deadline && state.pitch.deadline <= now) ||
    (allFourSubmitted && !state.pitch)
  );

  currentJuryStage = (allFourSubmitted && isPitchFinished)
    ? 3
    : (isPitchRunning || (allFourSubmitted && Boolean(state.pitch)))
      ? 2
      : 1;

  const cq = state.group.cq ?? 100;
  const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
  const identityBar = member.isJury
    ? `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 5 組 · ${esc(r.juryRole?.short || '角色席')}</div><button type="button" class="switch-group-btn" id="open-switch-group" aria-label="更換組別">換組</button><span class="rep-tag jury-tag">${esc(r.juryRole?.title || '跨文化角色席')}</span></div><div class="mobile-health"><span class="health-label">角色席</span><div class="health-track"><div class="health-fill" style="width:100%; background:var(--accent,#7c3aed);"></div></div><span class="cq-value">JURY<small> 角色對手席</small></span></div></div>`
    : `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 ${member.group} 組 (${esc(r.juryRole?.counterpart || '決策組')})</div><button type="button" class="switch-group-btn" id="open-switch-group" aria-label="更換組別">換組</button><span class="rep-tag">${member.isRepresentative?'本組決策代表':'與夥伴一起思考'}</span></div><div class="mobile-health"><span class="health-label">團隊 CQ 韌性值</span><div class="health-track" role="progressbar" aria-label="本組 CQ 韌性值" aria-valuenow="${cq}" aria-valuemin="0" aria-valuemax="100"><div class="health-fill ${cqClass}" style="width:${cq}%"></div></div><span class="cq-value">${cq}<small>/ 100 CQ</small></span></div></div>`;

  $('#app').innerHTML=`${identityBar}${roundNav(state.roundIndex)}${state.phase==='finished'?'<div class="finished-banner">四回合探索完成！</div>':''}<section class="mobile-scenario"><div class="topic-row"><span class="topic-badge">ROUND ${String(state.roundIndex+1).padStart(2,'0')} · ${r.dimension}</span><span class="topic-location">${esc(r.location)}</span></div><p class="scenario-context">${esc(r.context)}</p></section>${revealed?tensionCard(state.result||state.results?.[1],true):''}${dialogue(r)}<div class="question-prompt"><span class="prompt-badge">決策焦點</span><div class="prompt-title">${esc(r.prompt)}</div></div>
  ${revealed ? (member.isJury?juryResultMarkup():resultMarkup()) : (member.isJury?juryVotingMarkup():votingMarkup())}`;

  document.querySelector('.mobile-action')?.remove();
  const footer=document.createElement('footer');footer.className='mobile-action';

  if(member.isJury) {
    const juryLocked = Boolean(state.jurySubmitted);
    let juryButtonHtml = '';
    if (state.phase === 'voting') {
      if (juryLocked) {
        juryButtonHtml = `<button id="submit-jury" class="button secondary wide locked-btn" type="button" disabled>✓ 裁判評定裁決已送出（已鎖定）</button>`;
      } else if (currentJuryStage !== 3) {
        juryButtonHtml = `<button id="submit-jury" class="button secondary wide" type="button" disabled>${currentJuryStage === 2 ? '⏳ 30 秒申辯進行中 · 倒數結束後開放送出' : '⏳ 等待各組提交完成與 30 秒論述'}</button>`;
      } else {
        juryButtonHtml = `<button id="submit-jury" class="button primary" type="button">送出裁決回饋 <span aria-hidden="true">↗</span></button>`;
      }
    } else {
      juryButtonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">${state.phase==='finished'?'本次課堂已完成 · 感謝參與':revealed?'回饋已揭曉 · 等待大螢幕進入下一題':'等待講師開放研討'}</div>`;
    }
    footer.innerHTML=`<div class="mobile-action-inner">${juryButtonHtml}</div>`;
  } else {
    const isWaiting = ['waiting','ready'].includes(state.phase);
    const hasVoted = Boolean(state.vote?.choice);
    let buttonHtml = '';
    if (revealed) {
      buttonHtml = `<div class="button secondary wide revealed-status-pill" id="revealed-status-pill">${state.phase==='finished'?'本次課堂已完成 · 感謝參與':'本回合已揭曉 · 等待大螢幕進入下一題'}</div>`;
    } else if (hasVoted) {
      const choiceLabel = state.vote.choice === 'X' ? '未達成協議' : `方案 ${state.vote.choice}`;
      buttonHtml = `<button id="submit-vote" class="button secondary wide locked-btn" type="button" disabled>✓ 本組已提交${choiceLabel}（已鎖定）</button>`;
    } else {
      let buttonText = '提交本組決策 ↗';
      if (isWaiting) {
        buttonText = selection ? `已預選方案 ${selection}（可隨時送出 ↗）` : '預選方案（可隨時送出 ↗）';
      } else if (selection) {
        buttonText = `提交方案 ${selection} ↗`;
      }
      buttonHtml = `<button id="submit-vote" class="button primary" type="button" ${!selection?'disabled':''}>${buttonText}</button>`;
    }
    footer.innerHTML=`<div class="mobile-action-inner">${buttonHtml}</div>`;
  }

  document.body.append(footer);

  if(member.isJury) {
    const juryLocked = Boolean(state.jurySubmitted);
    document.querySelectorAll('[data-jury-team]').forEach(btn=>btn.addEventListener('click',()=>{
      if(juryLocked || currentJuryStage !== 3) return;
      const tid=Number(btn.dataset.juryTeam);const rank=btn.dataset.rank;
      if(juryRankings[tid]===rank) {
        delete juryRankings[tid];
        updateChoiceUI();
        return;
      }
      const otherVals = Object.entries(juryRankings).filter(([k])=>Number(k)!==tid).map(([,v])=>v);
      if(rank==='empathy' && otherVals.filter(v=>v==='empathy').length >= 2) {
        toast('「同理心加成卡 (+10 CQ)」每回合最多發放 2 張！');
        return;
      }
      if(rank==='veto' && otherVals.filter(v=>v==='veto').length >= 1) {
        toast('「文化踩雷否決卡 (-15 CQ)」每回合限用 1 張！');
        return;
      }
      juryRankings[tid]=rank;
      updateChoiceUI();
    }));
    document.querySelectorAll('[data-jury-order-team]').forEach(btn=>btn.addEventListener('click',()=>{
      if(juryLocked || currentJuryStage !== 3) return;
      const tid=Number(btn.dataset.juryOrderTeam);const ord=Number(btn.dataset.order);
      if(juryOrders[tid]===ord) {
        delete juryOrders[tid];
      } else {
        const oldOwner = Object.keys(juryOrders).find(k=>Number(juryOrders[k])===ord);
        if(oldOwner && Number(oldOwner)!==tid) {
          if(juryOrders[tid]) {
            juryOrders[oldOwner] = juryOrders[tid];
          } else {
            delete juryOrders[oldOwner];
          }
        }
        juryOrders[tid]=ord;
      }
      updateChoiceUI();
    }));
    $('#submit-jury')?.addEventListener('click',submitJuryVerdict);
  } else {
    const hasVoted = Boolean(state.vote?.choice);
    document.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('click',()=>{
      if(hasVoted) return;
      selection=el.dataset.choice;updateChoiceUI();
    }));
    document.querySelectorAll('[data-consensus]').forEach(el=>el.addEventListener('click',()=>{
      if(hasVoted) return;
      consensus[Number(el.dataset.consensus)]=el.dataset.value==='true';updateChoiceUI();
    }));
    $('#submit-vote')?.addEventListener('click',submitVote);
  }
  updateChoiceUI();
}

function votingMarkup(){
  const hasVoted = Boolean(state.vote?.choice);
  const c = state.cascade;
  const juryAlert = state.jurySubmitted ? `<div class="jury-status-banner">
    <div class="jury-status-banner-head">
      <span class="jury-status-tag">角色席動態</span>
      <strong>第 5 組【角色席】已完成全班道具配發</strong>
    </div>
    <p>發出 ${state.jurySummary?.empathyCount||0} 張同理心加成卡、${state.jurySummary?.vetoCount||0} 張文化踩雷否決卡，揭曉時公開對象！</p>
  </div>` : '';

  const pitch = state.pitch;
  const now = Date.now() + (state.clockOffset || 0);
  const isPitchActive = Boolean(pitch && pitch.deadline && pitch.deadline > now);
  const isPitchExpired = Boolean(pitch && pitch.deadline && pitch.deadline <= now);

  let pitchBanner = '';
  if (isPitchActive) {
    const isMyTurn = pitch.group === 'all' || pitch.group === state.member?.group;
    pitchBanner = `<div class="pitch-notice-banner ${isMyTurn ? 'is-my-turn' : ''}">
      <div class="pitch-notice-head">
        <span class="pitch-tag">${pitch.group === 'all' ? '全班已提交！30 秒申辯論述' : `第 ${pitch.group} 組 30 秒申辯`}</span>
        <strong class="pitch-clock-text">申辯倒數 <span class="pitch-clock-number mono" data-pitch-clock>00:30</span></strong>
      </div>
      <p>${pitch.group === 'all' ? '全班各組皆已提交！請各組代表把握 30 秒向第 5 組角色席精準說明決策初衷。' : isMyTurn ? '輪到本組申辯！請派代表起立，以 30 秒向第 5 組角色席精準陳述跨文化考量！' : `第 ${pitch.group} 組正在進行 30 秒申辯論述中…`}</p>
    </div>`;
  } else if (hasVoted) {
    if (isPitchExpired) {
      pitchBanner = `<div class="pitch-ready-hint is-done">
        <span class="pitch-ready-tag" style="background:#16a34a;">申辯結束</span>
        <p>30 秒申辯論述已結束，第 5 組角色席正在進行最終名次排序與道具裁決！</p>
      </div>`;
    } else {
      pitchBanner = `<div class="pitch-ready-hint">
        <span class="pitch-ready-tag">決策已鎖定</span>
        <p>本組方案已鎖定，等待其他組別提交後開始 30 秒申辯論述。</p>
      </div>`;
    }
  }

  return `<div class="mobile-timer"><span class="timer-label" data-debate>${state.roundIndex===3?'三方協商辯論':'小組研討時間'}</span><span class="clock" data-clock>--:--</span></div>

  ${pitchBanner}
  ${juryAlert}

  ${c?`<div class="cascade-banner ${c.type==='buff'?'is-buff':'is-penalty'}">
    <div class="cascade-head"><span class="cascade-badge">${esc(c.badge)}</span><strong>${esc(c.title)}</strong></div>
    <p class="cascade-effect">${esc(c.effectText)}</p>
    ${c.hint?`<div class="cascade-intel-box">${esc(c.hint)}</div>`:''}
  </div>`:''}

  ${hasVoted?`<div class="submitted-banner is-locked">
    <strong>✓ 本組已提交${state.vote.choice==='X'?'未達成協議':`方案 ${state.vote.choice}`} · 決策已鎖定</strong>
    <p>${isPitchActive ? `正在進行 30 秒申辯論述 · 請派代表向【${esc(state.round.juryRole?.short || '第 5 組')}】說明` : '本組方案已鎖定，等待其他組別提交後開始 30 秒申辯論述'}</p>
  </div>`:''}

  <div class="options-list" role="radiogroup" aria-label="本組決策方案">${state.round.options.map(o=>`<button type="button" class="option-card ${hasVoted?'locked':''}" role="radio" aria-checked="${selection===o.id}" data-choice="${o.id}" ${hasVoted?'disabled':''}><span class="letter">${o.id}</span><span><strong>${esc(o.title)}</strong><p>${esc(o.text)}</p></span></button>`).join('')}</div>

  ${state.roundIndex===3?`<section class="card debate-card"><div class="eyebrow">三方協商</div><h2>三方表態確認</h2><p class="muted">${hasVoted?'本組三方協商表態已確認鎖定。':'任一方拒絕即為未達成協議。'}</p>${['總部代表','東京代表','客戶代表'].map((name,i)=>`<div class="consensus-row"><span>${name}</span><div class="consensus-options"><button type="button" data-consensus="${i}" data-value="true" aria-pressed="${consensus[i]===true}" ${hasVoted?'disabled':''}>同意</button><button type="button" class="refuse" data-consensus="${i}" data-value="false" aria-pressed="${consensus[i]===false}" ${hasVoted?'disabled':''}>拒絕</button></div></div>`).join('')}</section>`:''}`;
}

function juryVotingMarkup(){
  const juryLocked = Boolean(state.jurySubmitted);
  const vals = Object.values(juryRankings);
  const empUsed = vals.filter(v => v === 'empathy').length;
  const vetoUsed = vals.filter(v => v === 'veto').length;
  const completedCount = state.decisionGroups ? state.decisionGroups.filter(g => g.submitted).length : 0;

  let stageBannerHtml = '';
  if (juryLocked) {
    stageBannerHtml = `<div class="submitted-banner is-locked">
      <strong>✓ 裁判評定裁決已送出 · 評定已鎖定</strong>
      <p>大螢幕即時同步中 · 等待講師宣布揭曉</p>
    </div>`;
  } else if (currentJuryStage === 1) {
    stageBannerHtml = `<div class="jury-stage-banner stage-waiting">
      <div class="stage-banner-head">
        <span class="stage-tag">階段一 · 等待各組提交</span>
        <span class="stage-progress-tag">${completedCount} / 4 組已提交</span>
      </div>
      <strong>等待第 1～4 組全數提交並完成 30 秒論述後，開放最終排序與道具裁決</strong>
      <p>您可先點閱下方各方案文化情報，掌握各決策可能代價與盲點。</p>
    </div>`;
  } else if (currentJuryStage === 2) {
    stageBannerHtml = `<div class="jury-stage-banner stage-pitching">
      <div class="stage-banner-head">
        <span class="stage-tag active">階段二 · 30 秒申辯進行中</span>
        <strong class="pitch-clock-text mono" data-pitch-clock>00:30</strong>
      </div>
      <strong>30 秒申辯論述進行中 — 請聆聽各組代表論述，倒數結束後立即開放排序！</strong>
      <div>
        <button type="button" class="skip-pitch-btn" id="skip-jury-pitch">提前結束論述，開始排序 ↗</button>
      </div>
    </div>`;
  } else {
    stageBannerHtml = `<div class="jury-stage-banner stage-unlocked">
      <div class="stage-banner-head">
        <span class="stage-tag done">階段三 · 裁決與排序</span>
        <span class="stage-unlocked-status">已解鎖</span>
      </div>
      <strong>論述結束！請為第 1～4 組進行最終名次排序（第 1～4 名）與道具卡配發</strong>
      <p>審視各組 30 秒申辯表現，指定 1～4 名說服名次並發放同理心加成卡或文化踩雷否決卡。</p>
    </div>`;
  }

  return `<div class="mobile-timer"><span class="timer-label">第 5 組角色席</span><span class="clock" data-clock>--:--</span></div>

  ${stageBannerHtml}

  <section class="card jury-mission-card">
    <div class="eyebrow">跨文化角色席</div>
    <h2>角色：${esc(state.round.juryRole?.title || '角色席')}</h2>
    <p class="jury-mission-text">
      <strong>【立場與顧慮】：</strong>${esc(state.round.juryRole?.stance || '聆聽各組申辯，從本方文化審視。')}
    </p>
  </section>

  <section class="card jury-monitor-summary">
    <div class="eyebrow">各組進度</div>
    <div class="jury-progress-chips">
      ${state.decisionGroups.map(g=>`<span class="jury-chip ${g.submitted?'done':'wait'}">第 ${g.id} 組：${g.submitted?'已選 '+g.choice:'討論中…'}${g.cascade?` (${esc(g.cascade.badge)})`:''}</span>`).join('')}
    </div>
  </section>

  <section class="card jury-intel-card">
    <div class="eyebrow">情報解密</div>
    <h2>方案暗藏文化代價</h2>
    <div class="jury-options-intel">
      ${state.optionsWithIntel.map(o=>`<div class="intel-item"><div class="intel-head"><span class="letter">${o.id}</span><strong>${esc(o.title)}</strong></div><p class="intel-text">${esc(o.text)}</p><div class="intel-blindspot"><strong>【代價】：</strong>${esc(o.blindspot)}</div></div>`).join('')}
    </div>
  </section>

  <section class="jury-eval-section ${currentJuryStage !== 3 ? 'is-locked-stage' : ''}">
    <div class="section-title">
      <h3>實質籌碼賦權 · 申辯裁決卡 ＆ 說服名次</h3>
      <p class="muted" style="margin:4px 0 10px; font-size:13px;">${currentJuryStage === 3 ? '聆聽第 1～4 組 30 秒申辯後，分派道具卡與評定說服名次（第 1～4 名）：' : '（論述倒數結束後開放點選）'}</p>
      <div class="jury-quota-bar">
        <span class="quota-pill empathy-pill">同理心加成 (+10 CQ)：剩餘 <strong id="quota-empathy">${Math.max(0, 2 - empUsed)} / 2 張</strong></span>
        <span class="quota-pill veto-pill">文化踩雷否決 (-15 CQ)：剩餘 <strong id="quota-veto">${Math.max(0, 1 - vetoUsed)} / 1 張</strong></span>
      </div>
    </div>
    <div class="jury-cards-list">
      ${state.decisionGroups.map(g=>{
        const opt = g.choice ? state.optionsWithIntel.find(o=>o.id===g.choice) : null;
        const currentRank = juryRankings[g.id];
        const currentOrder = juryOrders[g.id];
        return `<div class="card jury-group-eval-card ${currentJuryStage !== 3 ? 'card-locked' : ''}">
          <div class="eval-head"><strong>第 ${g.id} 組</strong><span class="pill ${g.submitted?'positive':'muted'}">${g.submitted?'方案 '+g.choice:'等待提交'}</span></div>
          ${opt?`<div class="eval-body"><strong>${esc(opt.title)}</strong><p>${esc(opt.text)}</p></div>`:''}
          <div class="eval-controls">
            <div class="chip-buttons-group">
              <button type="button" class="chip-btn empathy-btn" data-jury-team="${g.id}" data-rank="empathy" aria-pressed="${currentRank==='empathy'}" ${juryLocked||currentJuryStage!==3?'disabled':''}>同理心加成 (+10 CQ)</button>
              <button type="button" class="chip-btn neutral-btn" data-jury-team="${g.id}" data-rank="neutral" aria-pressed="${currentRank==='neutral'}" ${juryLocked||currentJuryStage!==3?'disabled':''}>中立觀察 (0 CQ)</button>
              <button type="button" class="chip-btn veto-btn" data-jury-team="${g.id}" data-rank="veto" aria-pressed="${currentRank==='veto'}" ${juryLocked||currentJuryStage!==3?'disabled':''}>文化踩雷否決 (-15 CQ)</button>
            </div>
            <div class="order-controls">
              <span class="order-label">說服名次：</span>
              <div class="order-buttons-group">
                ${[1, 2, 3, 4].map(ord => {
                  const isAct = currentOrder === ord;
                  return `<button type="button" class="order-btn ${isAct ? 'active' : ''}" data-jury-order-team="${g.id}" data-order="${ord}" aria-pressed="${isAct}" ${juryLocked||currentJuryStage!==3?'disabled':''}>第 ${ord} 名</button>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

function renderPublicBoard() {
  if (!state.publicBoard) return '';
  let sortedBoard = [...state.publicBoard];
  if (participantBoardSort === 'cq') {
    sortedBoard.sort((a,b) => (b.cq ?? 100) - (a.cq ?? 100) || a.id - b.id);
  } else if (participantBoardSort === 'delta') {
    sortedBoard.sort((a,b) => (b.actualDelta ?? 0) - (a.actualDelta ?? 0) || a.id - b.id);
  } else if (participantBoardSort === 'jury') {
    const rankScore = (g) => {
      if (g.juryOrder) return 100 - g.juryOrder;
      if (g.juryRank === 'empathy' || (g.juryBonus ?? 0) > 0) return 50;
      if (g.juryRank === 'neutral' || (g.juryBonus ?? 0) === 0) return 20;
      if (g.juryRank === 'veto' || (g.juryBonus ?? 0) < 0) return 0;
      return 10;
    };
    sortedBoard.sort((a,b) => rankScore(b) - rankScore(a) || a.id - b.id);
  } else if (participantBoardSort === 'id') {
    sortedBoard.sort((a,b) => a.id - b.id);
  }

  return `<section class="card public-jury-board">
    <div class="eyebrow">PUBLIC SHOWCASE · 全班決策 ＆ 第 5 組道具配發公開榜</div>
    <h2>全班各組決策 ＆ 第 5 組裁決榜</h2>
    <div class="board-sort-tabs" role="tablist" aria-label="排行榜排序切換">
      <button type="button" class="sort-tab ${participantBoardSort==='cq'?'active':''}" data-part-sort="cq">依總 CQ 排名</button>
      <button type="button" class="sort-tab ${participantBoardSort==='delta'?'active':''}" data-part-sort="delta">依本輪得分</button>
      <button type="button" class="sort-tab ${participantBoardSort==='jury'?'active':''}" data-part-sort="jury">依裁判評定</button>
      <button type="button" class="sort-tab ${participantBoardSort==='id'?'active':''}" data-part-sort="id">依組別編號</button>
    </div>
    <div class="public-board-list">
      ${sortedBoard.map((g, idx) => {
        const isMe = g.id === state.member?.group;
        const bonus = g.juryBonus ?? 0;
        let verdictTag = '';
        if (g.juryRank === 'empathy' || bonus > 0) verdictTag = '<span class="jury-tag-pill is-buff">同理心加成 (+10 CQ)</span>';
        else if (g.juryRank === 'veto' || bonus < 0) verdictTag = '<span class="jury-tag-pill is-veto">文化踩雷否決 (-15 CQ)</span>';
        else if (g.juryRank === 'neutral') verdictTag = '<span class="jury-tag-pill is-neutral">中立觀察 (0 CQ)</span>';
        else if (g.juryVerdict) verdictTag = `<span class="jury-tag-pill">${esc(g.juryVerdict)}</span>`;
        const orderTag = g.juryOrder ? `<span class="jury-tag-pill is-order">說服第 ${g.juryOrder} 名</span>` : '';
        const rankBadge = participantBoardSort !== 'id' ? `<span class="board-rank-badge rank-${idx+1}">第 ${idx+1} 名</span>` : '';
        return `<div class="public-board-item ${isMe ? 'is-me' : ''}">
          <div class="board-item-header">
            <div class="board-group-title">
              ${rankBadge}<strong>第 ${g.id} 組</strong>${isMe ? ' <span class="me-pill">本組</span>' : ''}
            </div>
            <div class="board-cq-stats">
              <span class="board-cq-delta ${g.actualDelta > 0 ? 'positive-text' : g.actualDelta < 0 ? 'negative-text' : ''}">
                ${g.actualDelta > 0 ? '+' : ''}${g.actualDelta} CQ
              </span>
              <span class="board-cq-total">總計 ${g.cq ?? 100} CQ</span>
            </div>
          </div>
          <div class="board-item-details">
            <span class="board-option">方案 ${g.optionId === 'X' ? '破局' : g.optionId || '—'} · ${esc(g.optionTitle || '未提交')}</span>
            <span class="board-score-calc">(基礎 ${g.baseDelta > 0 ? '+' : ''}${g.baseDelta} / 道具 ${g.juryBonus > 0 ? '+' : ''}${g.juryBonus})</span>
          </div>
          ${(verdictTag || orderTag) ? `<div class="board-verdict-row">${verdictTag}${orderTag}</div>` : ''}
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

function resultMarkup(){
  const result=state.result;
  if(!result)return '<section class="card waiting-card"><h2>本組本回合未提交決策</h2><p>團隊 CQ 韌性值維持原值，請跟隨簡報者一起覆盤。</p></section>';
  const cqBefore = result.cqBefore ?? 100;
  const cqAfter = result.cqAfter ?? 100;
  const baseDelta = result.baseDelta ?? result.cq ?? 0;
  const juryBonus = result.juryBonus ?? 0;
  const delta = result.actualDelta ?? 0;
  return `<section class="card mobile-review">
    <div class="eyebrow">GROUP ${state.member.group} · YOUR DECISION & CQ IMPACT</div>
    <h2>${result.id==='X'?'三方未達成協議':`方案 ${result.id} · ${esc(result.title)}`}</h2>
    ${result.juryVerdict?`<div class="jury-verdict-pill ${juryBonus>0?'is-buff':juryBonus<0?'is-veto':''}">${esc(result.juryVerdict)}</div>`:''}
    <div class="score-breakdown-row">
      <span>方案基礎：<strong>${baseDelta>0?'+':''}${baseDelta} CQ</strong></span>
      <span>｜</span>
      <span>裁判籌碼：<strong class="${juryBonus>0?'positive-text':juryBonus<0?'negative-text':''}">${juryBonus>0?'+':''}${juryBonus} CQ</strong></span>
    </div>
    <div class="cq-summary"><span>團隊 CQ 韌性值 ${cqBefore} → ${cqAfter}<br><small>${delta>0?'決策與說服展現高度文化同理心，有效守護跨國信任！':delta===0?'CQ 韌性維持持平。':'決策觸碰深層文化盲點，團隊信任受損。'}</small></span><strong class="${delta>=0?'positive-text':'negative-text'}">${delta>0?'+':''}${delta} CQ</strong></div>
    <div class="review-insight"><div class="eyebrow">文化盲點 · 重新看見</div><p>${esc(result.blindspot)}</p></div>
  </section>

  ${renderPublicBoard()}`;
}

function juryResultMarkup(){
  return `<section class="card mobile-review">
    <div class="eyebrow">ROLEPLAY DEBRIEF · 【${esc(state.round.juryRole?.short || '角色席')}】對話總結</div>
    <h2>全班跨文化決策與 CQ 韌性總結</h2>
    <div class="jury-results-summary">
      ${state.decisionGroups.map(g=>{
        const res=state.results?.[g.id];
        const rk=state.juryRankings?.[g.id];
        const jOrd=state.juryOrders?.[g.id];
        const delta=res?.actualDelta;
        const baseDelta=res?.baseDelta ?? res?.cq;
        const juryBonus=res?.juryBonus ?? 0;
        let rkLabel = res?.juryVerdict || (rk==='empathy'?'同理心加成 (+10 CQ)':rk==='veto'?'文化踩雷否決 (-15 CQ)':rk==='neutral'?'中立觀察 (0 CQ)':rk?`說服回饋：第 ${rk} 名`:'未評定');
        if (jOrd) rkLabel += ` ｜ 說服名次 #${jOrd}`;
        return `<div class="jury-summary-row">
          <div>
            <strong>第 ${g.id} 組</strong> · 方案 ${res?.id||'—'} ${baseDelta!==undefined?`<small class="muted">(方案 ${baseDelta>0?'+':''}${baseDelta}${juryBonus?` / 裁判 ${juryBonus>0?'+':''}${juryBonus}`:''})</small>`:''}
            <div style="font-size:12px; color:var(--muted); margin-top:3px;">${esc(rkLabel)}</div>
          </div>
          <span class="pill ${delta>=0?'positive':'negative'}">${delta!==undefined?(delta>0?'+':'')+delta+' CQ':'—'}</span>
        </div>`;
      }).join('')}
    </div>
  </section>
  ${renderPublicBoard()}`;
}

async function submitVote(){
  if(!selection) return;
  busy=true;updateChoiceUI();
  if(!state.vote) state.vote={};
  state.vote.choice=selection;
  state.vote.proposal=selection;
  state.vote.consensus=[...consensus];
  render();

  broadcastSync('group_vote',{
    group: state.member.group,
    choice: selection,
    proposal: selection,
    consensus,
    roundIndex: state.roundIndex,
    name: state.member.name
  });

  try{
    if(!state.member.isRepresentative) {
      try { await api('claim-rep',{},'member'); } catch(e){}
    }
    await api('vote',{choice:selection,consensus,roundIndex:state.roundIndex,epoch:state.epoch});
    toast('本組代表決策已提交 ✓');
  }catch(e){
    if(e.status===401){
      const last=JSON.parse(localStorage.getItem('cq_last_join')||'{}');
      if(last.name && last.group){
        try{
          const joinRes=await api('join',{name:last.name,group:last.group,allowSwitch:true});
          if(joinRes.token) localStorage.setItem('cq_member_token',joinRes.token);
          const next=await api();
          next.clockOffset=next.serverTime-Date.now();
          state=next;
          try { await api('claim-rep',{},'member'); } catch(err){}
          await api('vote',{choice:selection,consensus,roundIndex:state.roundIndex,epoch:state.epoch});
          toast('本組代表決策已提交 ✓');
          render();
          busy=false;updateChoiceUI();
          return;
        }catch(retryErr){
          toast(retryErr.message || '課堂已更新，請重新整理');
          busy=false;updateChoiceUI();
          return;
        }
      }
    }
    toast(e.message || '已送出');
  }finally{
    busy=false;updateChoiceUI();
  }
}

async function submitJuryVerdict(){
  busy=true;updateChoiceUI();
  state.jurySubmitted=true;
  state.juryRankings={...juryRankings};
  state.juryOrders={...juryOrders};
  render();

  broadcastSync('jury_verdict',{
    rankings: juryRankings,
    orders: juryOrders,
    roundIndex: state.roundIndex
  });

  try{
    await api('jury-rank',{rankings:juryRankings,orders:juryOrders,roundIndex:state.roundIndex,epoch:state.epoch});
    toast('裁判評定裁決已送出！大螢幕即時同步 ✓');
  }catch(e){
    if(e.status===401){
      const last=JSON.parse(localStorage.getItem('cq_last_join')||'{}');
      if(last.name && last.group){
        try{
          const joinRes=await api('join',{name:last.name,group:last.group,allowSwitch:true});
          if(joinRes.token) localStorage.setItem('cq_member_token',joinRes.token);
          const next=await api();
          next.clockOffset=next.serverTime-Date.now();
          state=next;
          await api('jury-rank',{rankings:juryRankings,orders:juryOrders,roundIndex:state.roundIndex,epoch:state.epoch});
          toast('裁判評定裁決已送出！大螢幕即時同步 ✓');
          render();
          busy=false;updateChoiceUI();
          return;
        }catch(retryErr){}
      }
    }
    toast(e.message || '裁決已送出');
  }finally{
    busy=false;updateChoiceUI();
  }
}

let consecutive401=0;
let isRejoining=false;
async function refresh(){
  try{
    const next=await api();
    next.clockOffset=next.serverTime-Date.now();
    const signature=JSON.stringify({...next,serverTime:0,clockOffset:0});
    state=next;online=true;status(true);consecutive401=0;
    if(gate.open)gate.close();
    if(signature!==lastSignature){lastSignature=signature;render();}
    updateChoiceUI();
  }catch(e){
    if(e.status===401){
      consecutive401++;
      const last=JSON.parse(localStorage.getItem('cq_last_join')||'{}');
      if(last.name && last.group && !isRejoining){
        isRejoining=true;
        try{
          const res=await api('join',{name:last.name,group:last.group,allowSwitch:true});
          if(res.token) localStorage.setItem('cq_member_token',res.token);
          consecutive401=0;
          isRejoining=false;
          return refresh();
        }catch(err){
          isRejoining=false;
        }
      }
      if(consecutive401>=4 && !last.name){
        state=null;lastSignature='';roundKey='';
        document.querySelector('.mobile-action')?.remove();
        $('#app').innerHTML='<div class="loading">歡迎加入今天的對話。</div>';
        if(!gate.open)gate.showModal();
        status(true);
      }
    }else{
      online=false;status(false);updateChoiceUI();
    }
  }
}

try{
  const last=JSON.parse(localStorage.getItem('cq_last_join')||'{}');
  if(last.name) $('#name').value=last.name;
  if(last.group){
    const r=document.querySelector(`input[name="group"][value="${last.group}"]`);
    if(r) r.checked=true;
  }
}catch{}

$('#app').addEventListener('click', e => {
  if (e.target.closest('#skip-jury-pitch')) {
    juryPitchSkipped = true;
    currentJuryStage = 3;
    render();
    return;
  }
  const sortBtn = e.target.closest('[data-part-sort]');
  if (sortBtn) {
    participantBoardSort = sortBtn.dataset.partSort;
    render();
    return;
  }
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
});

$('#close-onboarding')?.addEventListener('click', () => {
  gate.close();
});

document.body.addEventListener('click', e => {
  if (e.target.closest('#revealed-status-pill')) {
    toast(state?.phase === 'finished' ? '四個回合已全部完成！' : '本回合已揭曉！請看大螢幕，由講師進入下一回合。');
  }
});

$('#join-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.currentTarget.querySelector('button[type="submit"]') || e.currentTarget.querySelector('button');
  button.disabled=true;$('#join-error').textContent='';
  const form=new FormData(e.currentTarget);
  const name=form.get('name');
  const group=Number(form.get('group'));
  try{
    let res;
    if(state?.member) {
      res=await api('switch-group',{name,group});
      toast(`已更換至第 ${group} 組 ✓`);
    } else {
      res=await api('join',{name,group,allowSwitch:true});
    }
    if(res.token){
      try{
        localStorage.setItem('cq_member_token',res.token);
        localStorage.setItem('cq_last_join',JSON.stringify({name,group}));
      }catch{}
    }
    consecutive401=0;
    gate.close();
    await refresh();
  }catch(error){
    try {
      const res=await api('join',{name,group,allowSwitch:true});
      if(res.token){
        localStorage.setItem('cq_member_token',res.token);
        localStorage.setItem('cq_last_join',JSON.stringify({name,group}));
      }
      consecutive401=0;
      toast(`已更換至第 ${group} 組 ✓`);
      gate.close();
      await refresh();
      return;
    } catch(err2) {
      $('#join-error').textContent=err2.message || error.message;
    }
  }
  finally{button.disabled=false;}
});

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'host_action') {
    refresh();
  } else if (packet.type === 'group_vote') {
    if (state.member?.isJury) {
      if (packet.roundIndex === state.roundIndex && state.decisionGroups) {
        const target = state.decisionGroups.find(g => g.id === packet.group);
        if (target) {
          target.submitted = true;
          target.choice = packet.choice;
          target.proposal = packet.proposal;
          render();
        }
      }
    } else if (packet.group === state.member?.group) {
      if (packet.roundIndex === state.roundIndex) {
        if (!state.vote) state.vote = {};
        state.vote.choice = packet.choice;
        state.vote.proposal = packet.proposal;
        state.vote.consensus = packet.consensus;
        selection = packet.proposal;
        consensus = packet.consensus || [null,null,null];
        render();
      }
    }
  } else if (packet.type === 'jury_verdict') {
    if (state.member?.isJury && packet.roundIndex === state.roundIndex) {
      state.jurySubmitted = true;
      state.juryRankings = packet.rankings;
      juryRankings = { ...packet.rankings };
      if (packet.orders) {
        state.juryOrders = packet.orders;
        juryOrders = { ...packet.orders };
      }
      render();
    }
  }
});

async function poll(){await refresh();setTimeout(poll,document.hidden?5000:1500);}
window.addEventListener('pitch-ended', () => { render(); });
startClock(()=>state);poll();
