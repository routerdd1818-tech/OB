import { $,esc,api,toast,status,scene,roundNav,tensionCard,dialogue,startClock,broadcastSync,listenSync,playRevealDrum,toggleSound,isSoundEnabled } from './common.js';
let state=null,lastSignature='',selectedReview='B',busy=false,previousReveal='',confirmResolve;
function ask(title,text,label='確認'){const modal=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-text').textContent=text;$('#confirm-yes').textContent=label;modal.showModal();return new Promise(resolve=>confirmResolve=resolve);}
function closeConfirm(value){$('#confirm-dialog').close();confirmResolve?.(value);confirmResolve=null;}
$('#confirm-yes').addEventListener('click',()=>closeConfirm(true));$('#confirm-no').addEventListener('click',()=>closeConfirm(false));$('#confirm-dialog').addEventListener('cancel',e=>{e.preventDefault();closeConfirm(false);});

function render(){
  const r=state.round;const revealed=['revealed','finished'].includes(state.phase);const revealKey=revealed?`${state.epoch}:${state.roundIndex}`:'';const animate=revealed&&previousReveal!==revealKey;previousReveal=revealKey;
  if(animate) playRevealDrum();
  document.body.classList.toggle('is-revealed',revealed);
  document.documentElement.style.setProperty('--accent',r.color);
  
  const cqStripHtml = state.groups.map(g=>{
    if(g.id===5) {
      const juryTitle = r.juryRole?.short || '跨文化角色席';
      return `<div class="cq-group card jury-cq-group"><div class="cq-group-head"><span class="group-label">第 5 組 <span>${esc(juryTitle)}</span></span><div class="cq-value" style="font-size:18px;">JURY<small> 角色席</small></div></div><div class="health-track"><div class="health-fill" style="width:100%; background:var(--accent,#7c3aed);"></div></div><span class="cq-float" style="color:var(--accent,#7c3aed);">${state.jurySubmitted?'籌碼就緒':'對話席'}</span></div>`;
    }
    const cq = g.cq ?? 100;
    const res = state.results?.[g.id];
    const delta = res?.actualDelta;
    const juryBonus = res?.juryBonus ?? 0;
    const cqClass = cq < 50 ? 'critical' : cq < 75 ? 'low' : '';
    const animClass = animate && delta !== undefined ? (delta < 0 ? 'cq-damage-shake' : delta > 0 ? 'cq-heal-glow' : '') : '';
    const cascadePill = !revealed && g.cascade ? `<span class="host-cascade-pill ${g.cascade.type==='buff'?'is-buff':'is-penalty'}">${esc(g.cascade.badge)}</span>` : '';
    return `<div class="cq-group card ${animClass}"><div class="cq-group-head"><span class="group-label">第 ${g.id} 組 <span>${esc(r.juryRole?.counterpart || '決策組')}</span>${cascadePill}</span><div class="cq-value">${cq}<small>CQ</small></div></div><div class="health-track" role="progressbar" aria-label="第 ${g.id} 組 CQ 韌性值" aria-valuenow="${cq}" aria-valuemin="0" aria-valuemax="100"><div class="health-fill ${cqClass}" style="width:${cq}%"></div></div>${animate&&delta!==undefined?`<span class="cq-float ${delta<0?'loss':''}">${delta>0?'+':''}${delta} CQ${juryBonus?` (${juryBonus>0?'+10':'-15'})`:''}</span>`:''}</div>`;
  }).join('');

  $('#app').innerHTML=`<section class="cq-strip" aria-label="各組 CQ 韌性值即時監控">${cqStripHtml}</section>${roundNav(state.roundIndex)}${state.phase==='finished'?'<div class="finished-banner">四回合探索完成 · 帶著理解，回到下一場真實對話。</div>':''}${revealed?resultsMarkup():scenarioMarkup()}`;
  
  document.querySelector('.host-controls')?.remove();const controls=document.createElement('footer');controls.className='host-controls';
  controls.innerHTML=`<div class="timer-wrap">${revealed?`<span class="clock">${String(state.roundIndex+1).padStart(2,'0')} / 04</span><span class="timer-label">${state.phase==='finished'?'課堂已完成':'本回合已揭曉'}</span>`:`<span class="clock" data-clock>--:--</span><div class="timer-label"><strong data-debate>${state.roundIndex===3?'三方結構化辯論':'小組研討時間'}</strong>${state.deadline?'倒數進行中':state.remaining!==null?'計時已暫停':'準備好，就開始'}</div>`}${state.phase==='voting'?`<button class="icon-button" data-host-action="timer" aria-label="${state.deadline?'暫停':'繼續'}計時">${state.deadline?'Ⅱ':'▷'}</button>`:''}</div><div class="control-right"><span class="control-note">${revealed?'每一個決策，都是一次理解的練習。':state.phase==='voting'?`第 1~4 組研討決策，第 5 組【${esc(r.juryRole?.short || '角色席')}】手握 2 張同理加成卡 (+10) 與 1 張踩雷否決卡 (-15)。`:`邀請學員掃碼加入，第 1~4 組為【${esc(r.juryRole?.counterpart || '決策組')}】，第 5 組為【${esc(r.juryRole?.short || '角色席')}】。`}</span>${state.phase==='finished'?'<button class="button secondary" id="finish-manage">課堂管理</button>':`<button class="button primary" data-host-action="${revealed?'next':state.phase==='voting'?'reveal':'start'}">${revealed?(state.roundIndex===3?'完成本次課堂':'進入下一回合'):state.phase==='voting'?'揭曉決策與 CQ 韌性':'開始本回合研討'} <span aria-hidden="true">${state.phase==='voting'?'↗':'→'}</span></button>`}</div>`;
  document.body.append(controls);document.querySelectorAll('[data-host-action]').forEach(el=>el.addEventListener('click',()=>hostAction(el.dataset.hostAction)));$('#finish-manage')?.addEventListener('click',openManage);
  document.querySelectorAll('[data-review]').forEach(el=>el.addEventListener('click',()=>{selectedReview=el.dataset.review;renderReview();}));if(revealed)renderReview();
}

function scenarioMarkup(){
  const r=state.round;
  const decisionGroups=state.groups.slice(0,4);
  const allDecisionDone=state.completed>=4;
  return `<section class="scenario"><div class="scenario-copy"><div class="topic-row"><span class="topic-badge">ROUND ${String(state.roundIndex+1).padStart(2,'0')} · ${r.dimension}</span><span class="topic-location">${esc(r.location)}</span></div><p class="scenario-context">${esc(r.context)}</p></div>${dialogue(r)}</section><div class="question-prompt"><span class="prompt-badge">決策焦點</span><span class="prompt-text">${esc(r.prompt)}</span></div>
  ${state.jurySubmitted && state.phase==='voting' ? `<div class="card jury-host-status-banner">
    <span class="prompt-badge" style="background:#7c3aed;">第 5 組【${esc(r.juryRole?.short || '角色席')}】裁決就緒</span>
    <p>已完成全班道具配發（${state.jurySummary?.empathyCount || 0} 張同理加成卡、${state.jurySummary?.vetoCount || 0} 張踩雷否決卡），揭曉時公開受獎對象！</p>
  </div>` : ''}
  ${allDecisionDone && state.phase==='voting' ? `<div class="card pitch-stage-callout">
    <h2>全組已提交！進入【各組 30 秒申辯 ＆ 裁判發卡】</h2>
    <p>請第 1~4 組依序向第 5 組【${esc(r.juryRole?.short || '角色席')}】申辯；第 5 組可發放同理心加成卡 (+10 CQ) 或文化踩雷否決卡 (-15 CQ)！</p>
  </div>` : ''}
  <section class="progress-card card" aria-label="全班投票進度"><div class="progress-intro"><div><h2>決策進度</h2><p>${state.phase==='voting'?(allDecisionDone?`請依序進行 30 秒申辯`:`各組討論提交中`):'學員加入後即可開始'}</p></div></div><div class="stat-number">${state.completed}<small>/ 4 組</small></div><div class="progress-groups">${decisionGroups.map(g=>`<div class="progress-group ${g.submitted?'done':''}"><span class="status-circle">${g.submitted?'✓':''}</span><span>第 ${g.id} 組 · ${g.submitted?'已鎖定':g.count?'討論中':'未加入'}${g.cascade?` <small class="cascade-mini">(${esc(g.cascade.badge)})</small>`:''}</span></div>`).join('')}<div class="progress-group jury-progress-group ${state.jurySubmitted?'done':''}"><span class="status-circle">${state.jurySubmitted?'✓':''}</span><span>第 5 組【${esc(r.juryRole?.short || '角色席')}】· ${state.jurySubmitted?'籌碼已鎖定':'審視中'}</span></div></div></section>`;
}

function quadrantMatrixMarkup(){
  const pointsHtml = state.distribution.map(o => {
    const q = o.result?.quadrant || { x: 50, y: 50, zone: '' };
    const pickedGroups = [1, 2, 3, 4].filter(gid => state.results?.[gid]?.id === o.id);
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
    <div class="section-heading" style="margin-bottom:8px;">
      <h2>2×2 跨文化決策象限落點圖</h2>
      <span>點擊座標點切換右側盲點解析</span>
    </div>
    <div class="quadrant-axis-header">
      <span>▲ 平等賦權（專業自治 · 對等協作）</span>
    </div>
    <div class="quadrant-board" role="region" aria-label="2x2 跨文化決策象限圖">
      <div class="q-cell q-tl"><span class="q-zone-name">去層級直球區</span><small>高任務 × 高賦權</small></div>
      <div class="q-cell q-tr"><span class="q-zone-name">跨文化共創區</span><small>高關係 × 高賦權</small></div>
      <div class="q-cell q-bl"><span class="q-zone-name">高壓防衛區</span><small>高任務 × 高控制</small></div>
      <div class="q-cell q-br"><span class="q-zone-name">表面和諧區</span><small>高關係 × 高控制</small></div>
      <div class="q-axis-h"></div>
      <div class="q-axis-v"></div>
      ${pointsHtml}
    </div>
    <div class="quadrant-axis-footer">
      <span>◀ 任務導向（直接溝通）</span>
      <span>▼ 階級控制（由上而下）</span>
      <span>關係導向（高語境尊嚴） ▶</span>
    </div>
  </div>`;
}

function resultsMarkup(){
  const r=state.round;
  const values=Object.values(state.results);const current=values.length?Math.round(values.reduce((sum,r)=>sum+r.tension,0)/values.length*10)/10:null;
  const reduction=current===null?0:Math.round((state.round.baseline-current)*10)/10;
  const summary={baseline:state.round.baseline,tension:current,reduction,analysis:`${values.length} 組決策組的平均張力結果。${reduction>0?'對話張力獲得實質緩解；不同方案對信任與合作的深層影響，值得一起覆盤。':'目前的決策尚未讓衝突張力降溫；回到各方在意的風險與自尊，尋找合作切入點。'}`};
  
  return `${values.length?tensionCard(summary):'<section class="card waiting-card"><h2>本回合沒有已提交決策</h2><p>沒有可計算的決策平均張力，各組 CQ 維持原值。</p></section>'}<p class="result-question">ROUND ${state.roundIndex+1} · ${state.round.dimension} — ${esc(r.location)}</p><div class="results-layout"><section class="card">${quadrantMatrixMarkup()}<div class="group-results">${state.groups.slice(0,4).map(g=>{
    const result=state.results[g.id];
    const rk=state.juryRankings?.[g.id];
    let rankBadge='';
    if(rk==='empathy') rankBadge='同理心加成 (+10 CQ)';
    else if(rk==='veto') rankBadge='文化踩雷否決 (-15 CQ)';
    else if(rk==='neutral') rankBadge='中立觀察 (0 CQ)';
    else if(rk){
      if(state.roundIndex===3){
        rankBadge=rk==='tier1'?'卓越雙贏 Tier 1':rk==='tier2'?'局部妥協 Tier 2':'嚴重破局 Tier 3';
      }else{
        rankBadge=`回饋：並列第 ${rk} 名`;
      }
    }
    const delta = result?.actualDelta;
    const baseDelta = result?.baseDelta ?? result?.cq;
    const juryBonus = result?.juryBonus ?? 0;
    return `<div class="group-result">第 ${g.id} 組<strong>方案 ${result?.id==='X'?'破局':result?.id||'—'}</strong>${rankBadge?`<span class="jury-rank-tag ${rk==='empathy'?'is-buff':rk==='veto'?'is-veto':''}">${rankBadge}</span>`:''}<small class="${delta<0?'negative-text':'positive-text'}">${result!==undefined?`${delta>0?'+':''}${delta} CQ${juryBonus?` (方案${baseDelta>0?'+':''}${baseDelta} / 裁判${juryBonus>0?'+':''}${juryBonus})`:''}`:'未提交'}</small></div>`;
  }).join('')}<div class="group-result jury-group-result">第 5 組【${esc(r.juryRole?.short || '角色席')}】<strong>${state.jurySubmitted?'籌碼裁決已生效':'完成對話'}</strong><small class="positive-text">${esc(r.juryRole?.title || '角色對手席')}</small></div></div><div class="host-public-jury-board"><div class="section-heading" style="margin: 18px 0 10px;"><h2>第 5 組【${esc(r.juryRole?.short || '角色席')}】全班道具配發與裁決榜</h2><span>${esc(r.juryRole?.title || '角色對手席')}</span></div><div class="host-jury-board-grid">${state.groups.slice(0,4).map(g=>{
    const result=state.results[g.id];
    const rk=state.juryRankings?.[g.id];
    let verdictLabel='';
    let verdictClass='';
    if(rk==='empathy' || result?.juryBonus > 0) {
      verdictLabel='同理心加成 (+10 CQ)';
      verdictClass='is-buff';
    } else if(rk==='veto' || result?.juryBonus < 0) {
      verdictLabel='文化踩雷否決 (-15 CQ)';
      verdictClass='is-veto';
    } else {
      verdictLabel='中立觀察 (0 CQ)';
      verdictClass='is-neutral';
    }
    return `<div class="host-jury-card ${verdictClass}"><div class="host-jury-card-head"><strong>第 ${g.id} 組</strong><span class="host-jury-delta ${result?.actualDelta>0?'positive-text':result?.actualDelta<0?'negative-text':''}">${result?.actualDelta!==undefined?`${result.actualDelta>0?'+':''}${result.actualDelta} CQ`:'—'}</span></div><div class="host-jury-choice">方案 ${result?.id==='X'?'破局':result?.id||'—'} · ${esc(result?.shortTitle || result?.title || '')}</div><div class="host-jury-badge-row"><span class="jury-tag-pill ${verdictClass}">${verdictLabel}</span></div></div>`;
  }).join('')}</div></div></section><section class="card"><div class="section-heading"><h2>看見文化盲點（情境解密）</h2><span>選擇方案，展開覆盤</span></div><div class="review-tabs" role="tablist" aria-label="方案覆盤">${state.distribution.map(o=>`<button class="review-tab" role="tab" data-review="${o.id}" aria-selected="${selectedReview===o.id}" aria-controls="review-content">${o.id==='X'?'破局':'方案 '+o.id} (${o.count}組)</button>`).join('')}</div><div id="review-content" role="tabpanel" aria-live="polite"></div></section></div>`;
}

function renderReview(){
  const entry=state.distribution.find(o=>o.id===selectedReview)||state.distribution[0];
  selectedReview=entry.id;const r=entry.result;
  document.querySelectorAll('[data-review]').forEach(el=>{
    el.setAttribute('aria-selected',String(el.dataset.review===selectedReview));
    el.classList.toggle('is-active-point',el.dataset.review===selectedReview);
  });
  const q=r.quadrant;
  $('#review-content').innerHTML=`<h3 class="review-verdict">${esc(r.verdict)}</h3>${q?`<div class="review-zone-badge">象限落點：${esc(q.zone)}</div>`:''}<p class="review-copy">${esc(r.analysis)}</p><div class="review-insight"><div class="eyebrow">BEYOND THE WORDS · 深層文化盲點</div><p class="review-copy">${esc(r.blindspot)}</p></div><div class="review-insight"><span class="pill ${r.reduction>0?'positive':'negative'}">${r.reduction>0?'↓ 張力降 '+r.reduction+' 個百分點':r.reduction<0?'↑ 張力升 '+Math.abs(r.reduction)+' 個百分點':'張力持平'}</span> <span class="pill ${r.cq>0?'positive':'negative'}">方案基礎 ${r.cq>0?'CQ +'+r.cq:'CQ '+r.cq}</span></div>`;
}

async function hostAction(action,extra={}){
  if(busy)return;
  if(action==='next'){
    busy=true;document.querySelectorAll('[data-host-action]').forEach(el=>el.disabled=true);
    try{
      await api('next',extra,'host');
      const latest=await api('state',undefined,'host');
      if(latest.roundIndex <= 3 && latest.phase !== 'finished') {
        try { await api('start',{},'host'); } catch(err){}
      }
      broadcastSync('host_action',{ action:'next', roundIndex: latest.roundIndex });
      lastSignature='';
      await refresh();
      toast(latest.phase==='finished'?'四回合已全部完成！':`已進入第 ${latest.roundIndex+1} 回合研討 ✓`);
    }catch(e){toast(e.message);await refresh();}
    finally{busy=false;document.querySelectorAll('[data-host-action]').forEach(el=>el.disabled=false);}
    return;
  }
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
    broadcastSync('host_action',{ action, roundIndex: state?.roundIndex });
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
    if(signature!==lastSignature){lastSignature=signature;render();}
  }catch(e){
    status(false);
  }
}

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

$('#sound-toggle')?.addEventListener('click',()=>{
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

listenSync(packet => {
  if (!packet || !state) return;
  if (packet.type === 'group_vote') {
    if (packet.roundIndex === state.roundIndex) {
      const gid = Number(packet.group);
      if (gid >= 1 && gid <= 4) {
        const g = state.groups?.find(grp => grp.id === gid);
        if (g) {
          g.submitted = true;
          g.choice = packet.choice;
          state.completed = state.groups.slice(0, 4).filter(grp => grp.submitted).length;
          render();
        }
      }
    }
  } else if (packet.type === 'jury_verdict') {
    if (packet.roundIndex === state.roundIndex) {
      state.jurySubmitted = true;
      state.juryRankings = packet.rankings || {};
      const g = state.groups?.find(grp => grp.id === 5);
      if (g) g.submitted = true;
      render();
    }
  }
});

async function poll(){await refresh();setTimeout(poll,document.hidden?5000:1500);}
startClock(()=>state, { enableAudio: true });poll();
