import { $,esc,api,toast,status,scene,roundNav,tensionCard,dialogue,startClock } from './common.js';
let state=null,lastSignature='',selectedReview='B',busy=false,previousReveal='',confirmResolve;
const gate=$('#login');gate.addEventListener('cancel',e=>e.preventDefault());
function ask(title,text,label='確認'){const modal=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-text').textContent=text;$('#confirm-yes').textContent=label;modal.showModal();return new Promise(resolve=>confirmResolve=resolve);}
function closeConfirm(value){$('#confirm-dialog').close();confirmResolve?.(value);confirmResolve=null;}
$('#confirm-yes').addEventListener('click',()=>closeConfirm(true));$('#confirm-no').addEventListener('click',()=>closeConfirm(false));$('#confirm-dialog').addEventListener('cancel',e=>{e.preventDefault();closeConfirm(false);});

function render(){
  const r=state.round;const revealed=['revealed','finished'].includes(state.phase);const revealKey=revealed?`${state.epoch}:${state.roundIndex}`:'';const animate=revealed&&previousReveal!==revealKey;previousReveal=revealKey;
  document.body.classList.toggle('is-revealed',revealed);
  document.documentElement.style.setProperty('--accent',r.color);
  
  const cqStripHtml = state.groups.map(g=>{
    if(g.id===5) {
      return `<div class="cq-group card jury-cq-group"><div class="cq-group-head"><span class="group-label">第 5 組 <span>跨文化裁判席</span></span><div class="cq-value" style="font-size:18px;">JURY<small> 評定席</small></div></div><div class="health-track"><div class="health-fill" style="width:100%; background:var(--accent,#7c3aed);"></div></div><span class="cq-float" style="color:var(--accent,#7c3aed);">${state.jurySubmitted?'裁決就緒':'評定中'}</span></div>`;
    }
    const anger = g.anger ?? g.cq ?? 25;
    const delta = state.results?.[g.id]?.actualDelta;
    const angerClass = anger > 55 ? 'critical' : anger > 25 ? 'low' : '';
    return `<div class="cq-group card"><div class="cq-group-head"><span class="group-label">第 ${g.id} 組 <span>溝通怒氣值</span></span><div class="cq-value">${anger}<small>怒氣</small></div></div><div class="health-track" role="progressbar" aria-label="第 ${g.id} 組溝通怒氣值" aria-valuenow="${anger}" aria-valuemin="0" aria-valuemax="100"><div class="health-fill ${angerClass}" style="width:${anger}%"></div></div>${animate&&delta!==undefined?`<span class="cq-float ${delta>0?'loss':''}">${delta>0?'+':''}${delta} 怒氣</span>`:''}</div>`;
  }).join('');

  $('#app').innerHTML=`<section class="cq-strip" aria-label="各組溝通怒氣值即時監控">${cqStripHtml}</section>${roundNav(state.roundIndex)}${state.phase==='finished'?'<div class="finished-banner">四回合探索完成 · 帶著理解，回到下一場真實對話。</div>':''}${revealed?resultsMarkup():scenarioMarkup()}`;
  
  document.querySelector('.host-controls')?.remove();const controls=document.createElement('footer');controls.className='host-controls';
  controls.innerHTML=`<div class="timer-wrap">${revealed?`<span class="clock">${String(state.roundIndex+1).padStart(2,'0')} / 04</span><span class="timer-label">${state.phase==='finished'?'課堂已完成':'本回合已揭曉'}</span>`:`<span class="clock" data-clock>--:--</span><div class="timer-label"><strong data-debate>${state.roundIndex===3?'三方結構化辯論':'小組研討時間'}</strong>${state.deadline?'倒數進行中':state.remaining!==null?'計時已暫停':'準備好，就開始'}</div>`}${state.phase==='voting'?`<button class="icon-button" data-host-action="timer" aria-label="${state.deadline?'暫停':'繼續'}計時">${state.deadline?'Ⅱ':'▷'}</button>`:''}</div><div class="control-right"><span class="control-note">${revealed?'每一個決策，都是一次理解的練習。':state.phase==='voting'?'第 1~4 組研討決策，第 5 組評定體感衝突排序。':'邀請學員掃碼加入，第 1~4 組為決策組，第 5 組為裁判組。'}</span>${state.phase==='finished'?'<button class="button secondary" id="finish-manage">課堂管理</button>':`<button class="button primary" data-host-action="${revealed?'next':state.phase==='voting'?'reveal':'start'}">${revealed?(state.roundIndex===3?'完成本次課堂':'進入下一回合'):state.phase==='voting'?'揭曉決策與裁判評定':'開始本回合研討'} <span aria-hidden="true">${state.phase==='voting'?'↗':'→'}</span></button>`}</div>`;
  document.body.append(controls);document.querySelectorAll('[data-host-action]').forEach(el=>el.addEventListener('click',()=>hostAction(el.dataset.hostAction)));$('#finish-manage')?.addEventListener('click',openManage);
  document.querySelectorAll('[data-review]').forEach(el=>el.addEventListener('click',()=>{selectedReview=el.dataset.review;renderReview();}));if(revealed)renderReview();
}

function scenarioMarkup(){
  const r=state.round;
  const decisionGroups=state.groups.slice(0,4);
  return `<section class="scenario">${scene}<div class="scenario-copy"><div class="topic-row"><span class="topic-badge">ROUND ${String(state.roundIndex+1).padStart(2,'0')} · ${r.dimension}</span><span class="topic-location">${esc(r.location)}</span></div><h1>${esc(r.title)}</h1><p class="scenario-context">${esc(r.context)}</p></div>${dialogue(r)}</section><div class="question-prompt"><span><span class="prompt-symbol" aria-hidden="true">↳</span>${esc(r.prompt)}</span><span class="prompt-hint">THINK TOGETHER, DECIDE TOGETHER</span></div><section class="progress-card card" aria-label="全班投票進度"><div class="progress-intro"><div><h2>決策與裁判進度</h2><p>${state.phase==='voting'?'第 1~4 組研擬方案，第 5 組裁判評定體感衝突。':'學員加入後，即可開始研討。'}</p></div></div><div class="stat-number">${state.completed}<small>/ 4 決策組</small></div><div class="progress-groups">${decisionGroups.map(g=>`<div class="progress-group ${g.submitted?'done':''}"><span class="status-circle">${g.submitted?'✓':''}</span><span>第 ${g.id} 組 · ${g.submitted?'已提交':g.count?'研討中':'等待加入'}</span></div>`).join('')}<div class="progress-group jury-progress-group ${state.jurySubmitted?'done':''}"><span class="status-circle">${state.jurySubmitted?'✓':''}</span><span>第 5 組 (裁判組) · ${state.jurySubmitted?'裁決已送出':'正在評定中…'}</span></div></div></section><p class="progress-foot">${state.phase==='voting'?'各組決策獨立保密，所有結果與裁判評定於揭曉後一起呈現。':'從聽見彼此開始，一起練習跨文化決策。'}</p>`;
}

function resultsMarkup(){
  const values=Object.values(state.results);const current=values.length?Math.round(values.reduce((sum,r)=>sum+r.tension,0)/values.length*10)/10:null;
  const reduction=current===null?0:Math.round((state.round.baseline-current)*10)/10;
  const summary={baseline:state.round.baseline,tension:current,reduction,analysis:`${values.length} 組決策組的平均張力結果。${reduction>0?'對話張力獲得實質緩解；不同方案對信任與合作的深層影響，值得一起覆盤。':'目前的決策尚未讓衝突張力降溫；回到各方在意的風險與自尊，尋找合作切入點。'}`};
  
  return `${values.length?tensionCard(summary):'<section class="card waiting-card"><h2>本回合沒有已提交決策</h2><p>沒有可計算的決策平均張力，各組 CQ 維持原值。</p></section>'}<p class="result-question">ROUND ${state.roundIndex+1} · ${state.round.dimension} <strong>${esc(state.round.title.replace('\n',''))}</strong></p><div class="results-layout"><section class="card"><div class="section-heading"><h2>決策組選擇與裁判評定</h2><span>${state.completed} / 4 組已提交</span></div>${state.distribution.map(o=>`<div class="distribution-row ${o.result.cq>0?'best':''}"><span class="option-letter">${o.id==='X'?'—':o.id}</span><div><div class="bar-label"><span>${esc(o.title)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${o.count/4*100}%"></div></div></div><span class="bar-count">${o.count}</span></div>`).join('')}<div class="group-results">${state.groups.slice(0,4).map(g=>{
    const result=state.results[g.id];
    const rk=state.juryRankings?.[g.id];
    let rankBadge='';
    if(rk){
      if(state.roundIndex===3){
        rankBadge=rk==='tier1'?'卓越雙贏 Tier 1':rk==='tier2'?'局部妥協 Tier 2':'嚴重破局 Tier 3';
      }else{
        rankBadge=`並列第 ${rk} 名`;
      }
    }
    const delta = result?.actualDelta;
    return `<div class="group-result">第 ${g.id} 組<strong>${result?.id==='X'?'破局':result?.id||'—'}</strong>${rankBadge?`<span class="jury-rank-tag">${rankBadge}</span>`:''}<small class="${delta>0?'negative-text':'positive-text'}">${result!==undefined?(delta>0?'+':'')+delta+' 怒氣':'未提交'}</small></div>`;
  }).join('')}<div class="group-result jury-group-result">第 5 組 (裁判組)<strong>${state.jurySubmitted?'裁決已揭曉':'完成評定'}</strong><small class="positive-text">裁判公正席</small></div></div></section><section class="card"><div class="section-heading"><h2>看見文化盲點（裁判解密）</h2><span>選擇方案，展開覆盤</span></div><div class="review-tabs" role="tablist" aria-label="方案覆盤">${state.distribution.map(o=>`<button class="review-tab" role="tab" data-review="${o.id}" aria-selected="${selectedReview===o.id}" aria-controls="review-content">${o.id==='X'?'破局':'方案 '+o.id}</button>`).join('')}</div><div id="review-content" role="tabpanel" aria-live="polite"></div></section></div><p class="simulation-note">張力與怒氣數值為課堂情境模型；全班指標採已提交決策組的平均值。第 5 組為客觀裁判組。溝通怒氣值範圍 0–100，初始基準 25。<br>文化脈絡用於理解情境，不代表所有個人的行為。</p>`;
}

function renderReview(){
  const entry=state.distribution.find(o=>o.id===selectedReview)||state.distribution[0];
  selectedReview=entry.id;const r=entry.result;
  const angerDelta = r.angerDelta ?? (r.cq ? -r.cq : 0);
  document.querySelectorAll('[data-review]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.review===selectedReview)));
  $('#review-content').innerHTML=`<h3 class="review-verdict">${esc(r.verdict)}</h3><p class="review-copy">${esc(r.analysis)}</p><div class="review-insight"><div class="eyebrow">BEYOND THE WORDS · 深層文化盲點</div><p class="review-copy">${esc(r.blindspot)}</p></div><div class="review-insight"><span class="pill ${r.reduction>0?'positive':'negative'}">${r.reduction>0?'↓ 張力降 '+r.reduction+' 個百分點':r.reduction<0?'↑ 張力升 '+Math.abs(r.reduction)+' 個百分點':'張力持平'}</span> <span class="pill ${angerDelta>0?'negative':'positive'}">怒氣 ${angerDelta>0?'↑ 飆升 +'+angerDelta:'↓ 降溫 '+angerDelta} 點</span></div>`;
}

async function hostAction(action,extra={}){
  if(busy)return;
  if(action==='reveal'){
    busy=true;
    try{
      const latest=await api('state',undefined,'host');
      state={...latest,clockOffset:latest.serverTime-Date.now()};
    }catch(e){toast(e.message);busy=false;return;}
    busy=false;
    if(state.completed<4){
      if(!await ask('還有決策組別正在討論',`目前 ${state.completed} / 4 決策組已提交。現在揭曉會結束本回合投票，未提交組別的 CQ 維持原值。`,'結束投票並揭曉'))return;
      extra.confirmIncomplete=true;
    }
  }
  busy=true;document.querySelectorAll('[data-host-action]').forEach(el=>el.disabled=true);
  try{
    await api(action,extra,'host');
    lastSignature='';
    await refresh();
  }catch(e){toast(e.message);await refresh();}
  finally{busy=false;document.querySelectorAll('[data-host-action]').forEach(el=>el.disabled=false);}
}

async function refresh(){
  try{
    const next=await api('state',undefined,'host');
    next.clockOffset=next.serverTime-Date.now();
    const signature=JSON.stringify({...next,serverTime:0,clockOffset:0});
    state=next;status(true);
    if(gate.open)gate.close();
    if(signature!==lastSignature){lastSignature=signature;render();}
  }catch(e){
    if(e.status===401){
      state=null;lastSignature='';
      document.querySelector('.host-controls')?.remove();
      $('#app').innerHTML='<div class="loading">登入後即可開始課堂。</div>';
      if(!gate.open)gate.showModal();
      status(true);
    }else status(false);
  }
}

$('#login-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.currentTarget.querySelector('button');
  button.disabled=true;$('#login-error').textContent='';
  try{
    await api('login',{password:$('#password').value},'host');
    $('#password').value='';gate.close();
    await refresh();
  }catch(error){$('#login-error').textContent=error.message;}
  finally{button.disabled=false;}
});

document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>document.getElementById(el.dataset.close).close()));
$('#qr-open').addEventListener('click',()=>{
  if(!state)return;
  $('#qr-url').textContent=state.joinUrl;$('#qr-code').innerHTML='';
  try{
    const qr=window.qrcode(0,'M');
    qr.addData(state.joinUrl);qr.make();
    $('#qr-code').innerHTML=qr.createSvgTag({cellSize:6,margin:24,scalable:true});
    $('#qr-code svg').setAttribute('aria-label','學員加入 QR Code');
    $('#qr-code svg').setAttribute('role','img');
  }catch{ $('#qr-code').textContent='QR Code 無法產生，請使用下方網址';}
  $('#qr-note').textContent=/localhost|127\.0\.0\.1/.test(state.joinUrl)?'目前為本機預覽。手機加入請使用同一 Wi-Fi 的電腦區網網址，或部署後的正式網址。':'第 1~4 組為決策組，第 5 組為裁判組。掃碼後填寫姓名加入。';
  $('#qr-dialog').showModal();
});

$('#copy-url').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.joinUrl);toast('參與網址已複製');}catch{toast('請長按或選取網址複製');}});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('此瀏覽器不支援全螢幕，請使用瀏覽器的全螢幕功能');}});

function openManage(){
  if(!state)return;
  $('#representatives').innerHTML=state.groups.map(g=>`<div class="manage-row"><label for="rep-${g.id}">第 ${g.id} 組${g.id===5?' (裁判組)':''}</label><select id="rep-${g.id}" data-representative ${g.members.length?'':'disabled'}>${g.members.length?g.members.map(m=>`<option value="${m.id}" ${m.id===g.representative?'selected':''}>${esc(m.name)}</option>`).join(''):'<option>等待學員加入</option>'}</select></div>`).join('');
  document.querySelectorAll('[data-representative]').forEach(select=>select.addEventListener('change',async()=>{
    select.disabled=true;
    try{
      await api('representative',{memberId:select.value},'host');
      toast('本組代表已更新');
      await refresh();
    }catch(e){toast(e.message);}
    finally{select.disabled=false;}
  }));
  $('#manage-dialog').showModal();
}

$('#manage-open').addEventListener('click',openManage);
$('#reset').addEventListener('click',async()=>{if(await ask('重新開始這堂課？','將清除全部成員、投票、回合結果與 CQ，學員需要重新加入。此操作無法復原。','清除並重新開始')){$('#manage-dialog').close();await hostAction('reset',{confirm:'RESET'});}});
async function poll(){await refresh();setTimeout(poll,document.hidden?5000:1500);}
startClock(()=>state);poll();
