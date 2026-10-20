export const $ = selector => document.querySelector(selector);
export const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function api(action='state',body,role='member') {
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  const token = (typeof localStorage!=='undefined' && role==='member') ? localStorage.getItem('cq_member_token') : null;
  const headers = body ? {'Content-Type':'application/json'} : {};
  if(token) headers['Authorization'] = `Bearer ${token}`;
  try{const response=await fetch(`/api/workshop?action=${action}&role=${role}`,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
    const data=await response.json();if(!response.ok) throw Object.assign(new Error(data.error),{status:response.status});return data;
  } catch(error){if(error.name==='AbortError') throw new Error('連線逾時，請重試');throw error;} finally{clearTimeout(timeout);}
}
let toastTimer;
export function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
export function status(online){$('#connection').textContent=online?'即時連線':'連線中斷 · 重試中';$('#connection').classList.toggle('offline',!online);document.body.classList.toggle('disconnected',!online);}
export const scene = '';
export function roundNav(index){return `<nav class="round-nav" aria-label="回合進度">${['認知','動機','行為','巔峰博弈'].map((title,i)=>`<span class="round-step ${i===index?'current':i<index?'complete':''}" ${i===index?'aria-current="step"':''}><b>${i<index?'✓':String(i+1).padStart(2,'0')}</b><span>${title}</span></span>`).join('<i class="step-line"></i>')}</nav>`;}
export function tensionCard(result,mobile=false){if(!result)return '';const down=result.reduction>0;return `<section class="${mobile?'ios-mobile-tension-card':'ios-tension-hero'} card result-enter"><div class="tension-heading"><div class="eyebrow">${mobile?'YOUR GROUP’S IMPACT':'THE IMPACT OF YOUR DIALOGUE'}</div><span class="pill ${down?'positive':'negative'}">${down?'↓ 張力降低':'張力未降低'}${down?' '+result.reduction+' 個百分點':''}</span></div><div class="tension-body"><div><h2>${down?'讓對話，多一點空間。':'這場對話，還需要一座橋。'}</h2><p class="muted">${esc(result.analysis)}</p></div><div class="tension-values"><span>${result.baseline}<small>%</small></span><i>→</i><strong class="${down?'positive-text':'negative-text'}">${result.tension}<small>%</small></strong></div></div><div class="tension-track"><span class="baseline-marker" style="left:${result.baseline}%"></span><span class="tension-fill ${down?'reduced':'increased'}" style="width:${result.tension}%"></span></div><div class="track-caption"><span>較低張力</span><span>起始 ${result.baseline}% → 當前 ${result.tension}%</span></div></section>`;}
export function dialogue(round){return `<div class="dialogue-card card"><div class="dialogue-label"><span class="tiny-dot"></span> 對話現場</div>${round.dialogue.map((line,i)=>`<div class="dialogue-line"><div class="speaker-avatar">${i?'東':'西'}</div><div><span class="speaker-name">${esc(line.who)}</span><p>「${esc(line.text)}」</p></div></div>`).join('')}</div>`;}
export function startClock(getState){setInterval(()=>{const state=getState();if(!state)return;const now=Date.now()+(state.clockOffset||0);const seconds=Math.max(0,Math.ceil((state.deadline?state.deadline-now:state.remaining??state.round.seconds*1000)/1000));document.querySelectorAll('[data-clock]').forEach(node=>{node.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;node.classList.toggle('time-low',seconds<=15);});document.querySelectorAll('[data-debate]').forEach(node=>{node.textContent=state.roundIndex===3?(seconds>40?'01 交換立場':seconds>20?'02 協商提案':seconds>0?'03 三方表態':'時間到 · 請提交共同決策'):(seconds===0?'時間到 · 請提交共同決策':'小組研討時間');});},250);}

export const SYNC_TOPIC = 'ob_cq_my00_dialogue_v1';
export function broadcastSync(type, data) {
  try {
    fetch(`https://ntfy.sh/${SYNC_TOPIC}`, {
      method: 'POST',
      headers: { 'Title': type, 'Priority': '1' },
      body: JSON.stringify({ type, data, timestamp: Date.now() })
    }).catch(()=>{});
  } catch(e){}
}
export function listenSync(onMessage) {
  try {
    if (typeof EventSource === 'undefined') return null;
    const es = new EventSource(`https://ntfy.sh/${SYNC_TOPIC}/sse`);
    es.onmessage = e => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.event === 'message' && payload.message) {
          const packet = JSON.parse(payload.message);
          onMessage(packet);
        }
      } catch(err){}
    };
    return es;
  } catch(e){ return null; }
}
