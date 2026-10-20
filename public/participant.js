import { $,esc,api,toast,status,scene,roundNav,tensionCard,dialogue,startClock,broadcastSync,listenSync } from './common.js';
let state=null,lastSignature='',selection=null,consensus=[null,null,null],juryRankings={},roundKey='',busy=false,online=false;
const gate=$('#onboarding');
gate.addEventListener('cancel',e=>{ if(!state?.member) e.preventDefault(); });

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
  } else if(!selection && state.vote?.proposal){
    selection=state.vote.proposal;
    consensus=state.vote.consensus || [null,null,null];
  }
  document.documentElement.style.setProperty('--accent',r.color);

  const cq = state.group.cq ?? 100;
  const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
  const identityBar = member.isJury
    ? `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 5 組 · ${esc(r.juryRole?.short || '角色席')}</div><button type="button" class="switch-group-btn" id="open-switch-group" aria-label="更換組別">換組</button><span class="rep-tag jury-tag">${esc(r.juryRole?.title || '跨文化角色席')}</span></div><div class="mobile-health"><span class="health-label">角色席</span><div class="health-track"><div class="health-fill" style="width:100%; background:var(--accent,#7c3aed);"></div></div><span class="cq-value">JURY<small> 角色對手席</small></span></div></div>`
    : `<div class="mobile-identity"><div class="identity-bar"><div class="identity-pill"><span class="identity-name">${esc(member.name)}</span> <span aria-hidden="true">｜</span> 第 ${member.group} 組 (${esc(r.juryRole?.counterpart || '決策組')})</div><button type="button" class="switch-group-btn" id="open-switch-group" aria-label="更換組別">換組</button><span class="rep-tag">${member.isRepresentative?'本組決策代表':'與夥伴一起思考'}</span></div><div class="mobile-health"><span class="health-label">團隊 CQ 韌性值</span><div class="health-track" role="progressbar" aria-label="本組 CQ 韌性值" aria-valuenow="${cq}" aria-valuemin="0" aria-valuemax="100"><div class="health-fill ${cqClass}" style="width:${cq}%"></div></div><span class="cq-value">${cq}<small>/ 100 CQ</small></span></div></div>`;

  $('#app').innerHTML=`${identityBar}${roundNav(state.roundIndex)}${state.phase==='finished'?'<div class="finished-banner">四回合探索完成！</div>':''}<section class="mobile-scenario"><div class="topic-row"><span class="topic-badge">ROUND ${String(state.roundIndex+1).padStart(2,'0')} · ${r.dimension}</span><span class="topic-location">${esc(r.location)}</span></div><h1>${esc(r.title)}</h1><p class="scenario-context">${esc(r.context)}</p></section>${revealed?tensionCard(state.result||state.results?.[1],true):''}${dialogue(r)}<div class="question-prompt"><span class="prompt-badge">🎯 本題決策焦點</span><div class="prompt-title">${esc(r.prompt)}</div></div>
  ${revealed ? (member.isJury?juryResultMarkup():resultMarkup()) : (member.isJury?juryVotingMarkup():votingMarkup())}`;

  document.querySelector('.mobile-action')?.remove();
  const footer=document.createElement('footer');footer.className='mobile-action';

  if(member.isJury) {
    footer.innerHTML=`<div class="mobile-action-inner">${state.phase==='voting'?`<button id="submit-jury" class="button primary" type="button">${state.jurySubmitted?'更新裁決回饋':'送出裁決回饋'} <span aria-hidden="true">↗</span></button>`:`<div class="button secondary wide">${state.phase==='finished'?'本次課堂已完成':revealed?'回饋已揭曉 · 等待下一回合':'等待簡報者開放研討'}</div>`}</div>`;
  } else {
    const isWaiting = ['waiting','ready'].includes(state.phase);
    const hasVoted = Boolean(state.vote?.choice);
    const isChanged = hasVoted && selection && selection !== state.vote.choice;
    let buttonText = '提交本組決策';
    if (isWaiting) {
      buttonText = selection ? `已預選方案 ${selection}（等待開始）` : '預選方案（等待開始）';
    } else if (isChanged) {
      buttonText = `改選方案 ${selection} 並重新送出 ↗`;
    } else if (hasVoted) {
      buttonText = `已提交方案 ${state.vote.choice}（可點選改選）`;
    } else if (selection) {
      buttonText = `提交方案 ${selection} ↗`;
    }
    footer.innerHTML=`<div class="mobile-action-inner">${revealed?`<div class="button secondary wide">${state.phase==='finished'?'本次課堂已完成':'本組結果已揭曉 · 等待下一回合'}<span aria-hidden="true">✓</span></div>`:`<button id="submit-vote" class="button primary" type="button" ${!selection?'disabled':''}>${buttonText}</button>`}</div>`;
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
  return `<div class="mobile-timer"><span class="timer-label" data-debate>${state.roundIndex===3?'三方協商辯論':'小組研討時間'}</span><span class="clock" data-clock>--:--</span></div>

  ${state.vote?`<div class="submitted-banner">
    <strong>✓ 本組已提交${state.vote.choice==='X'?'未達成協議':`方案 ${state.vote.choice}`}</strong>
    <p>隨時點選其他選項可改選 · 請派代表準備向【${esc(state.round.juryRole?.short || '第 5 組')}】說明</p>
  </div>`:''}

  <div class="options-list" role="radiogroup" aria-label="本組決策方案">${state.round.options.map(o=>`<button type="button" class="option-card" role="radio" aria-checked="${selection===o.id}" data-choice="${o.id}"><span class="letter">${o.id}</span><span><strong>${esc(o.title)}</strong><p>${esc(o.text)}</p></span></button>`).join('')}</div>

  ${state.roundIndex===3?`<section class="card debate-card"><div class="eyebrow">三方協商</div><h2>三方表態確認</h2><p class="muted">任一方拒絕即為未達成協議。</p>${['總部代表','東京代表','客戶代表'].map((name,i)=>`<div class="consensus-row"><span>${name}</span><div class="consensus-options"><button type="button" data-consensus="${i}" data-value="true" aria-pressed="${consensus[i]===true}">同意</button><button type="button" class="refuse" data-consensus="${i}" data-value="false" aria-pressed="${consensus[i]===false}">拒絕</button></div></div>`).join('')}</section>`:''}`;
}

function juryVotingMarkup(){
  const isRound4 = (state.roundIndex===3);
  return `<div class="mobile-timer"><span class="timer-label">第 5 組角色席</span><span class="clock" data-clock>--:--</span></div>

  <section class="card jury-mission-card">
    <div class="eyebrow">跨文化角色席</div>
    <h2>🎭 角色：${esc(state.round.juryRole?.title || '角色席')}</h2>
    <p class="jury-mission-text">
      <strong>【立場與顧慮】：</strong>${esc(state.round.juryRole?.stance || '聆聽各組申辯，從本方文化審視。')}
    </p>
  </section>

  <section class="card jury-monitor-summary">
    <div class="eyebrow">各組進度</div>
    <div class="jury-progress-chips">
      ${state.decisionGroups.map(g=>`<span class="jury-chip ${g.submitted?'done':'wait'}">第 ${g.id} 組：${g.submitted?'已選 '+g.choice:'討論中…'}</span>`).join('')}
    </div>
  </section>

  <section class="card jury-intel-card">
    <div class="eyebrow">情報解密</div>
    <h2>方案暗藏文化代價</h2>
    <div class="jury-options-intel">
      ${state.optionsWithIntel.map(o=>`<div class="intel-item"><div class="intel-head"><span class="letter">${o.id}</span><strong>${esc(o.title)}</strong></div><p class="intel-text">${esc(o.text)}</p><div class="intel-blindspot"><strong>【代價】：</strong>${esc(o.blindspot)}</div></div>`).join('')}
    </div>
  </section>

  <section class="jury-eval-section">
    <div class="section-title"><h3>各組申辯回饋評定（可並列）</h3></div>
    <div class="jury-cards-list">
      ${state.decisionGroups.map(g=>{
        const opt = g.choice ? state.optionsWithIntel.find(o=>o.id===g.choice) : null;
        const currentRank = juryRankings[g.id];
        return `<div class="card jury-group-eval-card">
          <div class="eval-head"><strong>第 ${g.id} 組</strong><span class="pill ${g.submitted?'positive':'muted'}">${g.submitted?'方案 '+g.choice:'等待提交'}</span></div>
          ${opt?`<div class="eval-body"><strong>${esc(opt.title)}</strong><p>${esc(opt.text)}</p></div>`:''}
          <div class="eval-controls">
            ${isRound4?`<div class="tier-buttons-group">
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier1" aria-pressed="${currentRank==='tier1'}">卓越雙贏 Tier 1</button>
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier2" aria-pressed="${currentRank==='tier2'}">局部妥協 Tier 2</button>
              <button type="button" class="tier-btn" data-jury-team="${g.id}" data-rank="tier3" aria-pressed="${currentRank==='tier3'}">嚴重破局 Tier 3</button>
            </div>`:`<div class="rank-buttons-group">
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="1" aria-pressed="${currentRank===1||currentRank==='1'}">第 1 名</button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="2" aria-pressed="${currentRank===2||currentRank==='2'}">第 2 名</button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="3" aria-pressed="${currentRank===3||currentRank==='3'}">第 3 名</button>
              <button type="button" class="rank-btn" data-jury-team="${g.id}" data-rank="4" aria-pressed="${currentRank===4||currentRank==='4'}">第 4 名</button>
            </div>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

function resultMarkup(){
  const result=state.result;
  if(!result)return '<section class="card waiting-card"><h2>本組本回合未提交決策</h2><p>團隊 CQ 韌性值維持原值，請跟隨簡報者一起覆盤。</p></section>';
  const juryRank=result.juryRank || state.juryRank;
  let rankText='';
  if(juryRank){
    if(state.roundIndex===3){
      rankText=juryRank==='tier1'?'卓越雙贏 (Tier 1)':juryRank==='tier2'?'局部妥協 (Tier 2)':'嚴重破局 (Tier 3)';
    }else{
      rankText=`並列第 ${juryRank} 名`;
    }
  }
  const cqBefore = result.cqBefore ?? 100;
  const cqAfter = result.cqAfter ?? 100;
  const delta = result.actualDelta ?? 0;
  return `<section class="card mobile-review">
    <div class="eyebrow">GROUP ${state.member.group} · YOUR DECISION & CQ IMPACT</div>
    <h2>${result.id==='X'?'三方未達成協議':`方案 ${result.id} · ${esc(result.title)}`}</h2>
    ${result.juryVerdict?`<div class="jury-verdict-pill">🎭 ${esc(result.juryVerdict)}</div>`:''}
    <div class="cq-summary"><span>團隊 CQ 韌性值 ${cqBefore} → ${cqAfter}<br><small>${delta>0?'決策展現高度文化同理心，有效守護跨國信任！':delta===0?'CQ 韌性維持持平。':'決策觸碰深層文化盲點，團隊信任受損。'}</small></span><strong class="${delta>=0?'positive-text':'negative-text'}">${delta>0?'+':''}${delta} CQ</strong></div>
    <div class="review-insight"><div class="eyebrow">文化盲點 · 重新看見</div><p>${esc(result.blindspot)}</p></div>
  </section>`;
}

function juryResultMarkup(){
  return `<section class="card mobile-review">
    <div class="eyebrow">ROLEPLAY DEBRIEF · 【${esc(state.round.juryRole?.short || '角色席')}】對話總結</div>
    <h2>全班跨文化決策與 CQ 韌性總結</h2>
    <div class="jury-results-summary">
      ${state.decisionGroups.map(g=>{
        const res=state.results?.[g.id];
        const rk=state.juryRankings?.[g.id];
        const delta=res?.actualDelta;
        return `<div class="jury-summary-row">
          <div>
            <strong>第 ${g.id} 組</strong> · 方案 ${res?.id||'—'}
            <div style="font-size:11px; color:var(--muted); margin-top:3px;">${res?.juryVerdict||(rk?`說服回饋：並列第 ${rk} 名`:'已評定')}</div>
          </div>
          <span class="pill ${delta>=0?'positive':'negative'}">${delta!==undefined?(delta>0?'+':'')+delta+' CQ':'—'}</span>
        </div>`;
      }).join('')}
    </div>
  </section>`;
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
  render();

  broadcastSync('jury_verdict',{
    rankings: juryRankings,
    roundIndex: state.roundIndex
  });

  try{
    await api('jury-rank',{rankings:juryRankings,roundIndex:state.roundIndex,epoch:state.epoch});
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
          await api('jury-rank',{rankings:juryRankings,roundIndex:state.roundIndex,epoch:state.epoch});
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
  }
});

async function poll(){await refresh();setTimeout(poll,document.hidden?5000:1500);}
startClock(()=>state);poll();
