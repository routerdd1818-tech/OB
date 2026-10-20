import { $,esc,api,toast,status,scene,roundNav,tensionCard,dialogue,startClock } from './common.js';
let state=null,lastSignature='',selection=null,consensus=[null,null,null],juryRankings={},roundKey='',busy=false,online=false;
const gate=$('#onboarding');
gate.addEventListener('cancel',e=>e.preventDefault());

function updateChoiceUI(){
  if(state?.member?.isJury) {
    document.querySelectorAll('[data-jury-team]').forEach(btn=>{
      const tid=Number(btn.dataset.juryTeam);const rank=btn.dataset.rank;
      btn.setAttribute('aria-pressed',String(juryRankings[tid]===rank||juryRankings[tid]===Number(rank)));
    });
    const submit=$('#submit-jury');
    if(submit) submit.disabled=busy||!online||Object.keys(juryRankings).length===0;
    return;
  }
  document.querySelectorAll('[data-choice]').forEach(el=>el.setAttribute('aria-checked',String(el.dataset.choice===selection)));
  document.querySelectorAll('[data-consensus]').forEach(el=>el.setAttribute('aria-pressed',String(consensus[Number(el.dataset.consensus)]===(el.dataset.value==='true'))));
  const submit=$('#submit-vote');if(submit)submit.disabled=busy||!online||!selection||(state.roundIndex===3&&consensus.some(x=>x===null));
}

function render(){
  const r=state.round;const member=state.member;const revealed=['revealed','finished'].includes(state.phase);const key=state.epoch+':'+state.roundIndex;
  if(key!==roundKey){
    selection=state.vote?.proposal || null;
    consensus=state.vote?.consensus || [null,null,null];
    juryRankings={...(state.juryRankings||{})};
    roundKey=key;
  }
  if(!member.isRepresentative && !member.isJury){
    selection=state.vote?.proposal||null;
    consensus=state.vote?.consensus||[null,null,null];
  }
  document.documentElement.style.setProperty('--accent',r.color);

  const anger = state.group.anger ?? state.group.cq ?? 25;
  const angerClass = anger > 55 ? 'critical' : anger > 25 ? 'low' : '';
  const identityBar = member.isJury
    ? `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 5 組 · ${esc(r.juryRole?.short || '裁判席')}</div><span class="rep-tag jury-tag">${esc(r.juryRole?.title || '跨文化角色席')}</span></div><div class="mobile-health"><span class="health-label">評定席</span><div class="health-track"><div class="health-fill" style="width:100%; background:var(--accent,#7c3aed);"></div></div><span class="cq-value">JURY<small> 角色評判席</small></span></div></div>`
    : `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 ${member.group} 組 (${esc(r.juryRole?.counterpart || '決策組')})</div><span class="rep-tag">${member.isRepresentative?'本組決策代表':'與夥伴一起思考'}</span></div><div class="mobile-health"><span class="health-label">溝通怒氣值</span><div class="health-track" role="progressbar" aria-label="本組溝通怒氣值" aria-valuenow="${anger}" aria-valuemin="0" aria-valuemax="100"><div class="health-fill ${angerClass}" style="width:${anger}%"></div></div><span class="cq-value">${anger}<small>/ 100 怒氣</small></span></div></div>`;

  $('#app').innerHTML=`${identityBar}${roundNav(state.roundIndex)}${state.phase==='finished'?'<div class="finished-banner">四回合探索完成，謝謝你為對話留出空間。</div>':''}<section class="mobile-scenario">${scene}<div class="topic-row"><span class="topic-badge">ROUND ${String(state.roundIndex+1).padStart(2,'0')} · ${r.dimension}</span><span class="topic-location">${esc(r.location)}</span></div><h1>${esc(r.title)}</h1><p class="scenario-context">${esc(r.context)}</p></section>${revealed?tensionCard(state.result||state.results?.[1],true):''}${dialogue(r)}<div class="question-prompt">${esc(r.prompt)}</div>
  ${['waiting','ready'].includes(state.phase)?`<section class="card waiting-card"><span class="waiting-orbit" aria-hidden="true"></span><h2>先聽聽彼此的想法。</h2><p>等待簡報者開放本回合研討。<br>${member.isJury?`你是第 5 組代表，本回合扮演【${esc(r.juryRole?.title || '裁判席')}】，手握怒氣裁決大權，稍後將依各組 30 秒申辯評定名次。`:member.isRepresentative?`你是本組代表，本回合扮演【${esc(r.juryRole?.counterpart || '決策代表')}】，稍後請提交決策，並準備${esc(r.juryRole?.pitchTarget || '向第 5 組申辯')}。`:`本組代表：${esc(state.group.representativeName)}`}</p></section>`:state.phase==='voting'?(member.isJury?juryVotingMarkup():votingMarkup()):(member.isJury?juryResultMarkup():resultMarkup())}
  <p class="simulation-note">${revealed?'張力數值為課堂情境模型；怒氣由第 5 組裁決決定。<br>文化脈絡用於理解情境，不代表所有個人的行為。':member.isJury?`裁判提示：你們扮演【${esc(r.juryRole?.short || '評判席')}】，怒氣值增減完全由你們判定（支援並列）！請依各組申辯說服力評定。`:`重要提醒：本回合怒氣值完全由第 5 組【${esc(r.juryRole?.short || '對手方')}】判定！提交後請派代表準備 30 秒申辯說服對方。`}</p>`;

  document.querySelector('.mobile-action')?.remove();
  const footer=document.createElement('footer');footer.className='mobile-action';

  if(member.isJury) {
    footer.innerHTML=`<div class="mobile-action-inner">${state.phase==='voting'?`<p class="action-hint">${state.jurySubmitted?'裁決已送出，可隨時修改更新':'聆聽各組 30 秒申辯，評定名次直接決定怒氣'}</p><button id="submit-jury" class="button primary" type="button">${state.jurySubmitted?'更新裁判裁決':'提交裁判裁決'} <span aria-hidden="true">↗</span></button>`:`<div class="button secondary wide">${state.phase==='finished'?'本次課堂已完成':revealed?'裁決已揭曉 · 等待下一回合':'等待簡報者開放研討'}<span aria-hidden="true">${revealed?'✓':'◷'}</span></div>`}</div>`;
  } else {
    footer.innerHTML=`<div class="mobile-action-inner">${state.phase==='voting'?(member.isRepresentative?`<p class="action-hint">${state.vote?`已提交，請準備${esc(r.juryRole?.pitchTarget || '向第 5 組申辯說服')}`:'與組員達成共識後，由你提交'}</p><button id="submit-vote" class="button primary" type="button">${state.vote?'更新本組決策':'提交本組決策'} <span aria-hidden="true">↗</span></button>`:`<p class="action-hint">決策代表：${esc(state.group.representativeName)}</p><div class="button secondary wide">${state.vote?'本組已提交 · 請派代表準備申辯':'請與組員討論，由本組代表提交'}</div>`):`<div class="button secondary wide">${state.phase==='finished'?'本次課堂已完成':revealed?'本組結果已揭曉 · 等待下一回合':'等待簡報者開放研討'}<span aria-hidden="true">${revealed?'✓':'◷'}</span></div>`}</div>`;
  }

  document.body.append(footer);

  if(member.isJury) {
    document.querySelectorAll('[data-jury-team]').forEach(btn=>btn.addEventListener('click',()=>{
      const tid=Number(btn.dataset.juryTeam);const rank=btn.dataset.rank;
      juryRankings[tid]=rank;
      updateChoiceUI();
    }));
    $('#submit-jury')?.addEventListener('click',submitJuryVerdict);
  } else {
    document.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('click',()=>{selection=el.dataset.choice;updateChoiceUI();}));
    document.querySelectorAll('[data-consensus]').forEach(el=>el.addEventListener('click',()=>{consensus[Number(el.dataset.consensus)]=el.dataset.value==='true';updateChoiceUI();}));
    $('#submit-vote')?.addEventListener('click',submitVote);
  }
  updateChoiceUI();
}

function votingMarkup(){
  return `<div class="mobile-timer"><span class="timer-label" data-debate>${state.roundIndex===3?'三方結構化辯論':'小組研討時間'}</span><span class="clock" data-clock>--:--</span></div>

  <div class="debate-tip-box">
    📢 <strong>本回合角色對決</strong>：第 1~4 組扮演<strong>【${esc(state.round.juryRole?.counterpart || '決策小組')}】</strong>，溝通怒氣值<strong>完全由第 5 組【${esc(state.round.juryRole?.title || '評判席')}】評定</strong>！請在送出決策後，由代表準備 <strong>30 秒申辯</strong> 說服第 5 組。只要能說清楚如何化解對方的文化風險與面子顧慮，即使選了高風險方案也能獲得第 1 名平息怒氣（-15）！
  </div>

  ${state.vote?`<div class="submitted-banner pitch-ready-banner">
    <div class="pitch-badge">✓ 本組已提交${state.vote.choice==='X'?'三方未達成共識':`方案 ${state.vote.choice}`}</div>
    <strong style="display:block; margin-top:8px; font-size:14px;">🎤 請派代表準備 30 秒申辯說服【${esc(state.round.juryRole?.short || '第 5 組')}】！</strong>
    <p>說明重點：為何選此方案？如何照顧【${esc(state.round.juryRole?.short || '對方')}】的面子與文化立場？爭取第 5 組評定為第 1 名！</p>
  </div>`:''}

  <div class="options-list" role="radiogroup" aria-label="本組決策方案">${state.round.options.map(o=>`<button type="button" class="option-card" role="radio" aria-checked="${selection===o.id}" data-choice="${o.id}" ${!state.member.isRepresentative?'disabled':''}><span class="letter">${o.id}</span><span><strong>${esc(o.title)}</strong><p>${esc(o.text)}</p></span></button>`).join('')}</div>

  ${state.roundIndex===3?`<section class="card debate-card"><div class="eyebrow">20s + 20s + 20s</div><h2>給三方各一次發言的機會。</h2><p class="muted">組內分配角色；可由一人兼任。代表記錄三方實際表態，任一方拒絕即為未達成協議。</p><div class="role-guide"><strong>總部</strong>：考量市場回應、時程與組織責任。<br><strong>東京</strong>：考量技術事實、專業尊嚴與品質。<br><strong>客戶</strong>：考量交付可信度、驗證與營運風險。</div>${['總部代表','東京代表','客戶代表'].map((name,i)=>`<div class="consensus-row"><span>${name}</span><div class="consensus-options"><button type="button" data-consensus="${i}" data-value="true" aria-pressed="${consensus[i]===true}" ${!state.member.isRepresentative?'disabled':''}>同意</button><button type="button" class="refuse" data-consensus="${i}" data-value="false" aria-pressed="${consensus[i]===false}" ${!state.member.isRepresentative?'disabled':''}>拒絕</button></div></div>`).join('')}</section>`:''}`;
}

function juryVotingMarkup(){
  const isRound4 = (state.roundIndex===3);
  return `<div class="mobile-timer"><span class="timer-label">裁判組監控與評定席</span><span class="clock" data-clock>--:--</span></div>

  <section class="card jury-mission-card">
    <div class="eyebrow">ROLEPLAY & ARBITRATION · 跨文化角色評判席</div>
    <h2>⚖️ 本回合角色：${esc(state.round.juryRole?.title || '跨文化仲裁庭')}</h2>
    <p class="jury-mission-text">
      <strong>【你們的立場與在乎點】：</strong>${esc(state.round.juryRole?.stance || '聆聽各組申辯，評定其跨文化說服力。')}<br><br>
      <strong>本回合各組怒氣值完全由你們判定！</strong>各組選完方案後，將進行 <strong>30 秒申辯</strong> 說服你們。請對照下方暗藏文化代價情報，評定其說服力與同理心：
    </p>
    <div class="jury-rules-legend">
      ${isRound4 ? `
        <div class="legend-item"><span class="pill positive">卓越雙贏 (Tier 1)</span><strong>-20 怒氣</strong> 說服極佳 · 全面雙贏</div>
        <div class="legend-item"><span class="pill muted">局部妥協 (Tier 2)</span><strong>+10 怒氣</strong> 勉強妥協但留隱憂</div>
        <div class="legend-item"><span class="pill negative">嚴重破局 (Tier 3)</span><strong>+40 怒氣</strong> 激化矛盾導致破裂</div>
      ` : `
        <div class="legend-item"><span class="pill positive">第 1 名</span><strong>-15 怒氣</strong> 說服極佳 · 成功平息</div>
        <div class="legend-item"><span class="pill muted">第 2 名</span><strong>+5 怒氣</strong> 輕微摩擦 · 大致過關</div>
        <div class="legend-item"><span class="pill warning">第 3 名</span><strong>+25 怒氣</strong> 說服不足 · 防衛升溫</div>
        <div class="legend-item"><span class="pill negative">第 4 名</span><strong>+45 怒氣</strong> 嚴重觸雷 · 衝突激化</div>
      `}
    </div>
    <div class="jury-rules-subnote">💡 支援同名次並列！例如若兩組申辯都很精彩，可同時給予第 1 名。</div>
  </section>

  <section class="card jury-monitor-summary">
    <div class="eyebrow">JURY LIVE MONITOR</div>
    <h2>第 1~4 決策組提交動態</h2>
    <div class="jury-progress-chips">
      ${state.decisionGroups.map(g=>`<span class="jury-chip ${g.submitted?'done':'wait'}">第 ${g.id} 組：${g.submitted?'已提交 ('+g.choice+')':'研討中…'}</span>`).join('')}
    </div>
  </section>

  <section class="card jury-intel-card">
    <div class="eyebrow">EXCLUSIVE DOSSIER · 裁判專屬情報</div>
    <h2>本回合方案暗藏文化代價（秘密情報）</h2>
    <div class="jury-options-intel">
      ${state.optionsWithIntel.map(o=>`<div class="intel-item"><div class="intel-head"><span class="letter">${o.id}</span><strong>${esc(o.title)}</strong></div><p class="intel-text">${esc(o.text)}</p><div class="intel-blindspot"><strong>【暗藏文化代價】：</strong>${esc(o.blindspot)}</div></div>`).join('')}
    </div>
  </section>

  <section class="jury-eval-section">
    <div class="section-title"><h3>各組申辯評定（支援同名次並列）</h3><span class="section-tip">聽完各組向你們的 30 秒申辯後點選評定</span></div>
    <div class="jury-cards-list">
      ${state.decisionGroups.map(g=>{
        const opt = g.choice ? state.optionsWithIntel.find(o=>o.id===g.choice) : null;
        const currentRank = juryRankings[g.id];
        return `<div class="card jury-group-eval-card">
          <div class="eval-head"><strong>第 ${g.id} 組</strong><span class="pill ${g.submitted?'positive':'muted'}">${g.submitted?'已選方案 '+g.choice:'等待提交中'}</span></div>
          ${opt?`<div class="eval-body"><strong>${esc(opt.title)}</strong><p>${esc(opt.text)}</p><div class="eval-blindspot-box"><strong>審查要點（暗藏代價）：</strong>${esc(opt.blindspot)}</div></div>`:'<p class="muted">該組正在組內激烈研商中…</p>'}
          <div class="eval-controls">
            <span class="control-label">${isRound4?'協商階層評定（直接決定怒氣增減）：':'說服力名次評定（直接決定怒氣增減）：'}</span>
            ${isRound4?`<div class="tier-buttons-group">
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier1" aria-pressed="${currentRank==='tier1'}">卓越雙贏 Tier 1<small>怒氣 -20 · 說服極佳</small></button>
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier2" aria-pressed="${currentRank==='tier2'}">局部妥協 Tier 2<small>怒氣 +10 · 勉強過關</small></button>
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier3" aria-pressed="${currentRank==='tier3'}">嚴重破局 Tier 3<small>怒氣 +40 · 協商失敗</small></button>
            </div>`:`<div class="rank-buttons-group">
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="1" aria-pressed="${currentRank===1||currentRank==='1'}">第 1 名<small>-15 怒氣</small></button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="2" aria-pressed="${currentRank===2||currentRank==='2'}">第 2 名<small>+5 怒氣</small></button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="3" aria-pressed="${currentRank===3||currentRank==='3'}">第 3 名<small>+25 怒氣</small></button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="4" aria-pressed="${currentRank===4||currentRank==='4'}">第 4 名<small>+45 怒氣</small></button>
            </div>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

function resultMarkup(){
  const result=state.result;
  if(!result)return '<section class="card waiting-card"><h2>本組本回合未提交決策</h2><p>溝通怒氣值維持原值，請跟隨簡報者一起覆盤。</p></section>';
  const juryRank=result.juryRank || state.juryRank;
  let rankText='';
  if(juryRank){
    if(state.roundIndex===3){
      rankText=juryRank==='tier1'?'卓越雙贏 (Tier 1)':juryRank==='tier2'?'局部妥協 (Tier 2)':'嚴重破局 (Tier 3)';
    }else{
      rankText=`並列第 ${juryRank} 名`;
    }
  }
  const angerBefore = result.angerBefore ?? result.cqBefore ?? 25;
  const angerAfter = result.angerAfter ?? result.cqAfter ?? 25;
  const delta = result.actualDelta ?? 0;
  return `<section class="card mobile-review">
    <div class="eyebrow">GROUP ${state.member.group} · YOUR DECISION & JURY VERDICT</div>
    <h2>${result.id==='X'?'三方未達成協議':`方案 ${result.id} · ${esc(result.title)}`}</h2>
    <div class="jury-verdict-pill">⚖️ 第 5 組【${esc(state.round.juryRole?.short || '裁判席')}】評定：<strong>${esc(result.juryVerdict || (rankText ? rankText + ' 評定完成' : '評定完成'))}</strong></div>
    <div class="cq-summary"><span>溝通怒氣值 ${angerBefore} → ${angerAfter}<br><small>${delta<=0?'經 30 秒申辯成功說服第 5 組，成功平息對方怒氣！':delta<=10?'溝通說服大致過關，怒氣微幅受控。':'第 5 組評定說服不足或防衛升溫，怒氣上升。'}</small></span><strong class="${delta>0?'negative-text':'positive-text'}">${delta>0?'+':''}${delta} 怒氣</strong></div>
    <div class="review-insight"><div class="eyebrow">文化盲點 · 重新看見</div><p>${esc(result.blindspot)}</p></div>
  </section>`;
}

function juryResultMarkup(){
  return `<section class="card mobile-review">
    <div class="eyebrow">ROLEPLAY DEBRIEF · 【${esc(state.round.juryRole?.short || '裁判組')}】裁決成果揭曉</div>
    <h2>全班體感衝突與申辯裁決總結</h2>
    <div class="jury-results-summary">
      ${state.decisionGroups.map(g=>{
        const res=state.results?.[g.id];
        const rk=state.juryRankings?.[g.id];
        const delta=res?.actualDelta;
        return `<div class="jury-summary-row">
          <div>
            <strong>第 ${g.id} 組</strong> · 方案 ${res?.id||'—'}
            <div style="font-size:11px; color:var(--muted); margin-top:3px;">${res?.juryVerdict||(rk?`並列第 ${rk} 名`:'已評定')}</div>
          </div>
          <span class="pill ${delta<=0?'positive':'negative'}">${delta!==undefined?(delta>0?'+':'')+delta+' 怒氣':'—'}</span>
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

async function submitVote(){
  busy=true;updateChoiceUI();
  try{
    await api('vote',{choice:selection,consensus,roundIndex:state.roundIndex,epoch:state.epoch});
    toast('本組代表決策已提交');
    lastSignature='';
    await refresh();
  }catch(e){toast(e.message);await refresh();}
  finally{busy=false;updateChoiceUI();}
}

async function submitJuryVerdict(){
  busy=true;updateChoiceUI();
  try{
    await api('jury-rank',{rankings:juryRankings,roundIndex:state.roundIndex,epoch:state.epoch});
    toast('裁判評定裁決已送出！大螢幕即時同步');
    lastSignature='';
    await refresh();
  }catch(e){toast(e.message);await refresh();}
  finally{busy=false;updateChoiceUI();}
}

async function refresh(){
  try{
    const next=await api();
    next.clockOffset=next.serverTime-Date.now();
    const signature=JSON.stringify({...next,serverTime:0,clockOffset:0});
    state=next;online=true;status(true);
    if(gate.open)gate.close();
    if(signature!==lastSignature){lastSignature=signature;render();}
    updateChoiceUI();
  }catch(e){
    if(e.status===401){
      state=null;lastSignature='';roundKey='';
      document.querySelector('.mobile-action')?.remove();
      $('#app').innerHTML='<div class="loading">歡迎加入今天的對話。</div>';
      if(!gate.open)gate.showModal();
      status(true);
    }else{
      online=false;status(false);updateChoiceUI();
    }
  }
}

$('#join-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.currentTarget.querySelector('button');
  button.disabled=true;$('#join-error').textContent='';
  const form=new FormData(e.currentTarget);
  try{
    await api('join',{name:form.get('name'),group:Number(form.get('group'))});
    gate.close();
    await refresh();
  }catch(error){$('#join-error').textContent=error.message;}
  finally{button.disabled=false;}
});

async function poll(){await refresh();setTimeout(poll,document.hidden?5000:1500);}
startClock(()=>state);poll();
