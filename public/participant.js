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
    ? `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 5 組 · 裁判組</div><span class="rep-tag jury-tag">跨文化裁判席</span></div><div class="mobile-health"><span class="health-label">評定席</span><div class="health-track"><div class="health-fill" style="width:100%; background:var(--accent,#7c3aed);"></div></div><span class="cq-value">JURY<small> 裁判公正席</small></span></div></div>`
    : `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 ${member.group} 組</div><span class="rep-tag">${member.isRepresentative?'本組決策代表':'與夥伴一起思考'}</span></div><div class="mobile-health"><span class="health-label">溝通怒氣值</span><div class="health-track" role="progressbar" aria-label="本組溝通怒氣值" aria-valuenow="${anger}" aria-valuemin="0" aria-valuemax="100"><div class="health-fill ${angerClass}" style="width:${anger}%"></div></div><span class="cq-value">${anger}<small>/ 100 怒氣</small></span></div></div>`;

  $('#app').innerHTML=`${identityBar}${roundNav(state.roundIndex)}${state.phase==='finished'?'<div class="finished-banner">四回合探索完成，謝謝你為對話留出空間。</div>':''}<section class="mobile-scenario">${scene}<div class="topic-row"><span class="topic-badge">ROUND ${String(state.roundIndex+1).padStart(2,'0')} · ${r.dimension}</span><span class="topic-location">${esc(r.location)}</span></div><h1>${esc(r.title)}</h1><p class="scenario-context">${esc(r.context)}</p></section>${revealed?tensionCard(state.result||state.results?.[1],true):''}${dialogue(r)}<div class="question-prompt">${esc(r.prompt)}</div>
  ${['waiting','ready'].includes(state.phase)?`<section class="card waiting-card"><span class="waiting-orbit" aria-hidden="true"></span><h2>先聽聽彼此的想法。</h2><p>等待簡報者開放本回合研討。<br>${member.isJury?'你是第 5 組裁判代表，稍後請為第 1~4 組進行體感衝突排序。':member.isRepresentative?'你是本組代表，稍後請提交共同決策。':`本組代表：${esc(state.group.representativeName)}`}</p></section>`:state.phase==='voting'?(member.isJury?juryVotingMarkup():votingMarkup()):(member.isJury?juryResultMarkup():resultMarkup())}
  <p class="simulation-note">${revealed?'張力數值為課堂情境模型；變化以百分點計算。<br>文化脈絡用於理解情境，不代表所有個人的行為。':member.isJury?'裁判提示：支援並列同名次，請依各組申辯與文化代價進行排序。':'聆聽不同觀點，再一起作出決策。'}</p>`;

  document.querySelector('.mobile-action')?.remove();
  const footer=document.createElement('footer');footer.className='mobile-action';

  if(member.isJury) {
    footer.innerHTML=`<div class="mobile-action-inner">${state.phase==='voting'?`<p class="action-hint">${state.jurySubmitted?'裁決已送出，可隨時修改更新':'聆聽各組 30 秒申辯，評定衝突指數'}</p><button id="submit-jury" class="button primary" type="button">${state.jurySubmitted?'更新裁判裁決':'提交裁判裁決'} <span aria-hidden="true">↗</span></button>`:`<div class="button secondary wide">${state.phase==='finished'?'本次課堂已完成':revealed?'裁決已揭曉 · 等待下一回合':'等待簡報者開放研討'}<span aria-hidden="true">${revealed?'✓':'◷'}</span></div>`}</div>`;
  } else {
    footer.innerHTML=`<div class="mobile-action-inner">${state.phase==='voting'?(member.isRepresentative?`<p class="action-hint">${state.vote?'已提交，可在揭曉前更新共同決策':'與組員達成共識後，由你提交'}</p><button id="submit-vote" class="button primary" type="button">${state.vote?'更新本組決策':'提交本組決策'} <span aria-hidden="true">↗</span></button>`:`<p class="action-hint">決策代表：${esc(state.group.representativeName)}</p><div class="button secondary wide">${state.vote?'本組已提交 · 等待揭曉':'請與組員討論，由本組代表提交'}</div>`):`<div class="button secondary wide">${state.phase==='finished'?'本次課堂已完成':revealed?'本組結果已揭曉 · 等待下一回合':'等待簡報者開放研討'}<span aria-hidden="true">${revealed?'✓':'◷'}</span></div>`}</div>`;
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
  return `<div class="mobile-timer"><span class="timer-label" data-debate>${state.roundIndex===3?'三方結構化辯論':'小組研討時間'}</span><span class="clock" data-clock>--:--</span></div>${state.vote?`<div class="submitted-banner">✓ 本組已提交${state.vote.choice==='X'?'三方未達成共識':`方案 ${state.vote.choice}`}。${state.member.isRepresentative?'揭曉前仍可更新。':'請等待全班揭曉。'}</div>`:''}<div class="options-list" role="radiogroup" aria-label="本組決策方案">${state.round.options.map(o=>`<button type="button" class="option-card" role="radio" aria-checked="${selection===o.id}" data-choice="${o.id}" ${!state.member.isRepresentative?'disabled':''}><span class="letter">${o.id}</span><span><strong>${esc(o.title)}</strong><p>${esc(o.text)}</p></span></button>`).join('')}</div>${state.roundIndex===3?`<section class="card debate-card"><div class="eyebrow">20s + 20s + 20s</div><h2>給三方各一次發言的機會。</h2><p class="muted">組內分配角色；可由一人兼任。代表記錄三方實際表態，任一方拒絕即為未達成協議。</p><div class="role-guide"><strong>總部</strong>：考量市場回應、時程與組織責任。<br><strong>東京</strong>：考量技術事實、專業尊嚴與品質。<br><strong>客戶</strong>：考量交付可信度、驗證與營運風險。</div>${['總部代表','東京代表','客戶代表'].map((name,i)=>`<div class="consensus-row"><span>${name}</span><div class="consensus-options"><button type="button" data-consensus="${i}" data-value="true" aria-pressed="${consensus[i]===true}" ${!state.member.isRepresentative?'disabled':''}>同意</button><button type="button" class="refuse" data-consensus="${i}" data-value="false" aria-pressed="${consensus[i]===false}" ${!state.member.isRepresentative?'disabled':''}>拒絕</button></div></div>`).join('')}</section>`:''}`;
}

function juryVotingMarkup(){
  const isRound4 = (state.roundIndex===3);
  return `<div class="mobile-timer"><span class="timer-label">裁判組監控與評定席</span><span class="clock" data-clock>--:--</span></div>
  <section class="card jury-monitor-summary">
    <div class="eyebrow">JURY LIVE MONITOR</div>
    <h2>第 1~4 決策組提交動態</h2>
    <div class="jury-progress-chips">
      ${state.decisionGroups.map(g=>`<span class="jury-chip ${g.submitted?'done':'wait'}">第 ${g.id} 組：${g.submitted?'已提交 ('+g.choice+')':'研討中…'}</span>`).join('')}
    </div>
  </section>

  <section class="card jury-intel-card">
    <div class="eyebrow">EXCLUSIVE DOSSIER · 裁判專屬情報</div>
    <h2>本回合方案暗藏文化代價解析</h2>
    <div class="jury-options-intel">
      ${state.optionsWithIntel.map(o=>`<div class="intel-item"><div class="intel-head"><span class="letter">${o.id}</span><strong>${esc(o.title)}</strong></div><p class="intel-text">${esc(o.text)}</p><div class="intel-blindspot"><strong>【暗藏文化代價】：</strong>${esc(o.blindspot)}</div></div>`).join('')}
    </div>
  </section>

  <section class="jury-eval-section">
    <div class="section-title"><h3>各組方案評定（支援並列同名次）</h3><span class="section-tip">聆聽申辯後評定體感衝突指數</span></div>
    <div class="jury-cards-list">
      ${state.decisionGroups.map(g=>{
        const opt = g.choice ? state.optionsWithIntel.find(o=>o.id===g.choice) : null;
        const currentRank = juryRankings[g.id];
        return `<div class="card jury-group-eval-card">
          <div class="eval-head"><strong>第 ${g.id} 組</strong><span class="pill ${g.submitted?'positive':'muted'}">${g.submitted?'已選方案 '+g.choice:'等待提交中'}</span></div>
          ${opt?`<div class="eval-body"><strong>${esc(opt.title)}</strong><p>${esc(opt.text)}</p><div class="eval-blindspot-box"><strong>文化盲點：</strong>${esc(opt.blindspot)}</div></div>`:'<p class="muted">該組正在組內激烈研商中…</p>'}
          <div class="eval-controls">
            <span class="control-label">${isRound4?'協商階層評定（可同階層）：':'體感衝突排序（可並列名次）：'}</span>
            ${isRound4?`<div class="tier-buttons-group">
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier1" aria-pressed="${currentRank==='tier1'}">卓越雙贏 (Tier 1)</button>
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier2" aria-pressed="${currentRank==='tier2'}">局部妥協 (Tier 2)</button>
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier3" aria-pressed="${currentRank==='tier3'}">嚴重破局 (Tier 3)</button>
            </div>`:`<div class="rank-buttons-group">
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="1" aria-pressed="${currentRank===1||currentRank==='1'}">第 1 名<small>衝突最低</small></button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="2" aria-pressed="${currentRank===2||currentRank==='2'}">第 2 名</button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="3" aria-pressed="${currentRank===3||currentRank==='3'}">第 3 名</button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="4" aria-pressed="${currentRank===4||currentRank==='4'}">第 4 名<small>衝突最高</small></button>
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
  const juryRank=state.juryRank;
  let rankText='';
  if(juryRank){
    if(state.roundIndex===3){
      rankText=juryRank==='tier1'?'卓越雙贏階層 (Tier 1)':juryRank==='tier2'?'局部妥協階層 (Tier 2)':'嚴重破局階層 (Tier 3)';
    }else{
      rankText=`並列第 ${juryRank} 名（體感衝突評定）`;
    }
  }
  const angerBefore = result.angerBefore ?? result.cqBefore ?? 25;
  const angerAfter = result.angerAfter ?? result.cqAfter ?? 25;
  const delta = result.actualDelta ?? 0;
  return `<section class="card mobile-review">
    <div class="eyebrow">GROUP ${state.member.group} · YOUR DECISION</div>
    <h2>${result.id==='X'?'三方未達成協議':`方案 ${result.id} · ${esc(result.title)}`}</h2>
    ${rankText?`<div class="jury-verdict-pill">第 5 組裁判評定：<strong>${rankText}</strong></div>`:''}
    <span class="pill ${delta<=0?'positive':'negative'}">${esc(result.verdict)}</span>
    <div class="review-insight"><div class="eyebrow">文化盲點 · 重新看見</div><p>${esc(result.blindspot)}</p></div>
    <div class="cq-summary"><span>溝通怒氣值 ${angerBefore} → ${angerAfter}<br><small>${delta>0?'踩中文化地雷，怒氣急遽飆升':delta<0?'化解文化盲點，成功平息對方怒氣':'怒氣維持原值'}</small></span><strong class="${delta>0?'negative-text':'positive-text'}">${delta>0?'+':''}${delta} 怒氣</strong></div>
  </section>`;
}

function juryResultMarkup(){
  return `<section class="card mobile-review">
    <div class="eyebrow">JURY DEBRIEF · 裁判裁決成果揭曉</div>
    <h2>全班體感衝突與決策覆盤</h2>
    <div class="jury-results-summary">
      ${state.decisionGroups.map(g=>{
        const res=state.results?.[g.id];
        const rk=state.juryRankings?.[g.id];
        return `<div class="jury-summary-row">
          <div><strong>第 ${g.id} 組</strong> · 方案 ${res?.id||'—'}（${res?.title||''}）</div>
          <span class="pill positive">${rk?(state.roundIndex===3?rk:`並列第 ${rk} 名`):'已評定'}</span>
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
