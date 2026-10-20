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
export function roundNav(index){return `<nav class="round-nav" aria-label="回合進度">${['權威與共識','賦權與指導','大D與小d','四象限調適'].map((title,i)=>`<span class="round-step ${i===index?'current':i<index?'complete':''}" ${i===index?'aria-current="step"':''}><b>${i<index?'✓':String(i+1).padStart(2,'0')}</b><span>${title}</span></span>`).join('<i class="step-line"></i>')}</nav>`;}
export function tensionCard(result,mobile=false){if(!result)return '';const down=result.reduction>0;return `<section class="${mobile?'ios-mobile-tension-card':'ios-tension-hero'} card result-enter"><div class="tension-heading"><div class="eyebrow">${mobile?'YOUR GROUP’S IMPACT':'THE IMPACT OF YOUR DIALOGUE'}</div><span class="pill ${down?'positive':'negative'}">${down?'↓ 張力降低':'張力未降低'}${down?' '+result.reduction+' 個百分點':''}</span></div><div class="tension-body"><div><h2>${down?'讓對話，多一點空間。':'這場對話，還需要一座橋。'}</h2><p class="muted">${esc(result.analysis)}</p></div><div class="tension-values"><span>${result.baseline}<small>%</small></span><i>→</i><strong class="${down?'positive-text':'negative-text'}">${result.tension}<small>%</small></strong></div></div><div class="tension-track"><span class="baseline-marker" style="left:${result.baseline}%"></span><span class="tension-fill ${down?'reduced':'increased'}" style="width:${result.tension}%"></span></div><div class="track-caption"><span>較低張力</span><span>起始 ${result.baseline}% → 當前 ${result.tension}%</span></div></section>`;}
export function dialogue(round){return `<div class="dialogue-card card"><div class="dialogue-label"><span class="tiny-dot"></span> 對話現場</div>${round.dialogue.map((line,i)=>`<div class="dialogue-line"><div class="speaker-avatar">${i?'東':'西'}</div><div><span class="speaker-name">${esc(line.who)}</span><p>「${esc(line.text)}」</p></div></div>`).join('')}</div>`;}

let audioCtx = null;
let soundEnabled = true;

function getAudioCtx() {
  if (!soundEnabled || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  return audioCtx;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => { getAudioCtx(); }, { once: true, passive: true });
}

export function isSoundEnabled() { return soundEnabled; }
export function toggleSound() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) getAudioCtx();
  return soundEnabled;
}

export function playHeartbeat(secLeft) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const urgency = Math.max(0, (10 - secLeft) / 10);
    const baseFreq = 58 + urgency * 18;
    // First beat (Lub)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq * 1.4, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.11);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.32 + urgency * 0.15, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Second beat (Dub)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.15, now + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.28);
    gain2.gain.setValueAtTime(0.001, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.22 + urgency * 0.12, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.31);
  } catch(e){}
}

export function playRevealDrum() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Deep Timpani impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.85);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.15);

    // Dramatic warm brass/chime overtone
    [196, 293.66, 392].forEach((freq, idx) => {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      hOsc.type = 'triangle';
      hOsc.frequency.setValueAtTime(freq, now + idx * 0.04);
      hGain.gain.setValueAtTime(0.001, now + idx * 0.04);
      hGain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.04 + 0.05);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);
      hOsc.connect(hGain);
      hGain.connect(ctx.destination);
      hOsc.start(now + idx * 0.04);
      hOsc.stop(now + 1.4);
    });
  } catch(e){}
}

let lastBeepKey = '';
export function startClock(getState, opts = {}) {
  setInterval(() => {
    const state = getState();
    if (!state) return;
    const now = Date.now() + (state.clockOffset || 0);
    const baseSeconds = Math.max(0, Math.ceil((state.deadline ? state.deadline - now : state.remaining ?? state.round.seconds * 1000) / 1000));
    const penalty = state.cascade?.timePenalty || 0;
    const seconds = Math.max(0, baseSeconds - penalty);
    if (opts.enableAudio && state.phase === 'voting' && state.deadline && baseSeconds <= 10 && baseSeconds >= 1) {
      const beepKey = `${state.epoch}:${state.roundIndex}:${baseSeconds}`;
      if (beepKey !== lastBeepKey) {
        lastBeepKey = beepKey;
        playHeartbeat(baseSeconds);
      }
    }
    document.querySelectorAll('[data-clock]').forEach(node => {
      node.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      node.classList.toggle('time-low', seconds <= 15);
    });
    document.querySelectorAll('[data-debate]').forEach(node => {
      const penaltyTag = penalty > 0 ? ` (心防懲罰 -${penalty}s)` : '';
      node.textContent = state.roundIndex === 3
        ? (seconds > 40 ? '01 交換立場' + penaltyTag : seconds > 20 ? '02 協商提案' + penaltyTag : seconds > 0 ? '03 三方表態' + penaltyTag : '時間到 · 請提交共同決策')
        : (seconds === 0 ? '時間到 · 請提交共同決策' : '小組研討時間' + penaltyTag);
    });

    // 30s Pitch timer update
    if (state.pitch && state.pitch.deadline) {
      const pitchSec = Math.max(0, Math.ceil((state.pitch.deadline - now) / 1000));
      document.querySelectorAll('[data-pitch-clock]').forEach(node => {
        node.textContent = `${String(Math.floor(pitchSec / 60)).padStart(2, '0')}:${String(pitchSec % 60).padStart(2, '0')}`;
        node.classList.toggle('time-low', pitchSec <= 10 && pitchSec > 0);
      });
      if (opts.enableAudio && pitchSec <= 10 && pitchSec >= 1) {
        const pitchBeepKey = `pitch:${pitchSec}`;
        if (pitchBeepKey !== lastBeepKey) {
          lastBeepKey = pitchBeepKey;
          playHeartbeat(pitchSec);
        }
      }
      if (pitchSec === 0) {
        if (!state._pitchEndedFired) {
          state._pitchEndedFired = true;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pitch-ended', { detail: { group: state.pitch?.group } }));
          }
        }
      } else {
        state._pitchEndedFired = false;
      }
    } else {
      document.querySelectorAll('[data-pitch-clock]').forEach(node => {
        node.textContent = '00:30';
        node.classList.remove('time-low');
      });
    }
  }, 250);
}

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
