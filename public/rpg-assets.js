// ============================================================================
// rpg-assets.js - JRPG Visual Assets & UI Components
// For "Being The Boss" Leadership Decision Lab (Project Chronos)
// Conforms to RPG Maker YEP (MessageCore / EventMiniLabel) & GALV (MessageBusts)
// ============================================================================

export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// ----------------------------------------------------------------------------
// 1. Chibi Party Sprites (Groups 1 ~ 5)
// ----------------------------------------------------------------------------
const CHIBI_CONFIGS = [
  { id: 1, name: '第 1 組', color: '#2563eb', hair: '#1e3a8a', skin: '#fde68a', clothes: '#1d4ed8', role: '戰略先鋒' },
  { id: 2, name: '第 2 組', color: '#059669', hair: '#064e3b', skin: '#fef08a', clothes: '#047857', role: '工程守護' },
  { id: 3, name: '第 3 組', color: '#d97706', hair: '#78350f', skin: '#fed7aa', clothes: '#b45309', role: '營運協調' },
  { id: 4, name: '第 4 組', color: '#7c3aed', hair: '#4c1d95', skin: '#fef3c7', clothes: '#6d28d9', role: '架構核心' },
  { id: 5, name: '第 5 組', color: '#dc2626', hair: '#881337', skin: '#fde68a', clothes: '#b91c1c', role: '危機治理' }
];

function renderChibiSpriteSvg(cfg, isLocked = false, isNavigator = false) {
  const { id, color, hair, skin, clothes } = cfg;
  return `
    <svg class="chibi-svg" viewBox="0 0 48 56" width="48" height="56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="chibi-shadow-${id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0.35)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
        <filter id="chibi-glow-${id}">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${isNavigator ? '#facc15' : color}" flood-opacity="0.8"/>
        </filter>
      </defs>
      <!-- Shadow on ground -->
      <ellipse cx="24" cy="50" rx="14" ry="4" fill="url(#chibi-shadow-${id})" />
      ${isNavigator ? `
        <!-- Navigator Golden Halo Ring -->
        <ellipse cx="24" cy="50" rx="16" ry="5" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="3 2" class="halo-spin"/>
        <path d="M19,10 L24,4 L29,10 L26,9 L24,12 L22,9 Z" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
      ` : ''}
      ${isLocked ? `
        <!-- Locked Aura Ring -->
        <ellipse cx="24" cy="50" rx="15" ry="4.5" fill="none" stroke="#38bdf8" stroke-width="1.8" class="pulse-aura"/>
      ` : ''}
      <!-- Body & Clothing -->
      <rect x="18" y="32" width="12" height="15" rx="3" fill="${clothes}" />
      <rect x="19" y="44" width="4" height="6" rx="2" fill="#1f2937" />
      <rect x="25" y="44" width="4" height="6" rx="2" fill="#1f2937" />
      <!-- Cape / Collar -->
      <path d="M17,32 Q24,35 31,32 L33,42 Q24,44 15,42 Z" fill="${color}" opacity="0.9" />
      <!-- Hands -->
      <circle cx="15" cy="38" r="2.5" fill="${skin}" />
      <circle cx="33" cy="38" r="2.5" fill="${skin}" />
      <!-- Head -->
      <ellipse cx="24" cy="22" rx="11" ry="10" fill="${skin}" filter="url(#chibi-glow-${id})" />
      <!-- Hair Back -->
      <path d="M13,22 Q12,12 24,11 Q36,12 35,22 Q37,30 35,32 Q33,26 31,27 Q24,28 17,27 Q15,26 13,32 Z" fill="${hair}" />
      <!-- Face -->
      <!-- Eyes -->
      <ellipse cx="20" cy="22" rx="1.8" ry="2.4" fill="#0f172a" />
      <ellipse cx="28" cy="22" rx="1.8" ry="2.4" fill="#0f172a" />
      <circle cx="20.6" cy="21.2" r="0.7" fill="#ffffff" />
      <circle cx="28.6" cy="21.2" r="0.7" fill="#ffffff" />
      <!-- Cheeks -->
      <ellipse cx="18" cy="25" rx="1.5" ry="0.9" fill="#f43f5e" opacity="0.45" />
      <ellipse cx="30" cy="25" rx="1.5" ry="0.9" fill="#f43f5e" opacity="0.45" />
      <!-- Mouth -->
      <path d="M22.5,26 Q24,27.5 25.5,26" fill="none" stroke="#991b1b" stroke-width="0.8" stroke-linecap="round" />
      <!-- Front Bangs -->
      <path d="M14,19 Q18,22 22,17 Q25,23 29,18 Q33,22 34,19 Q31,14 24,13 Q17,14 14,19 Z" fill="${hair}" />
      <!-- Group Badge on Chest -->
      <circle cx="24" cy="37" r="4" fill="#ffffff" stroke="${color}" stroke-width="1.2" />
      <text x="24" y="39.8" text-anchor="middle" font-size="5" font-family="'SF Pro Text',sans-serif" font-weight="900" fill="${color}">${id}</text>
    </svg>
  `;
}

function renderChibiPartyHtml(groups = [], chiefNavId = null) {
  return `
    <div class="rpg-chibi-party" aria-label="第 1 至 5 組冒險者隊伍">
      ${CHIBI_CONFIGS.map((cfg) => {
        const grp = groups.find((g) => g.id === cfg.id) || {};
        const isLocked = Boolean(grp.locked || grp.choice);
        const isNav = chiefNavId ? Number(chiefNavId) === cfg.id : Boolean(grp.isNavigator);
        return `
          <div class="chibi-party-member ${isNav ? 'is-nav' : ''} ${isLocked ? 'is-locked' : ''}" data-group-id="${cfg.id}" title="${cfg.name} (${cfg.role})${isNav ? ' 👑 首席領航者' : isLocked ? ' 🔒 已鎖定' : ''}">
            <div class="chibi-sprite-wrap">
              ${renderChibiSpriteSvg(cfg, isLocked, isNav)}
            </div>
            <div class="chibi-nametag">
              ${isNav ? '<span class="chibi-crown-badge">👑</span>' : ''}
              <span class="chibi-group-no">G${cfg.id}</span>
              ${isLocked ? '<span class="chibi-lock-dot" title="已完成決策"></span>' : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. 2D Top-Down Scenes (Acts 1 ~ 4) with YEP_Event Mini Labels
// ----------------------------------------------------------------------------

function renderMiniLabelHtml(text, icon = '📍', statusClass = '') {
  return `
    <div class="yep-mini-label ${statusClass}">
      <span class="yep-mini-icon">${icon}</span>
      <span class="yep-mini-text">${esc(text)}</span>
    </div>
  `;
}

function renderSceneAct1Tokyo(worldState = {}, groups = []) {
  return `
    <div class="rpg-scene-canvas act-tokyo">
      <svg class="scene-bg-svg" viewBox="0 0 960 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tokyo-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="60%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>
          <linearGradient id="tokyo-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1f2937"/>
            <stop offset="100%" stop-color="#111827"/>
          </linearGradient>
          <linearGradient id="table-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.15"/>
          </linearGradient>
          <pattern id="tatami-grid" width="40" height="24" patternUnits="userSpaceOnUse">
            <rect width="40" height="24" fill="#1b2432" stroke="#253245" stroke-width="1"/>
            <line x1="0" y1="12" x2="40" y2="12" stroke="#2a394f" stroke-width="0.7"/>
          </pattern>
        </defs>
        <!-- Floor -->
        <rect x="0" y="0" width="960" height="420" fill="url(#tokyo-floor)"/>
        <rect x="0" y="80" width="960" height="340" fill="url(#tatami-grid)"/>
        
        <!-- Panoramic Window Wall (Top) -->
        <rect x="30" y="15" width="900" height="75" rx="6" fill="url(#tokyo-sky)" stroke="#475569" stroke-width="2"/>
        <!-- Window Grids & Skyline -->
        <path d="M80,90 L90,40 L100,90 M140,90 L140,55 L165,55 L165,90 M230,90 L245,25 L260,90 M520,90 L530,35 L545,90" stroke="#64748b" stroke-width="1.5" fill="none" opacity="0.6"/>
        <circle cx="245" cy="22" r="3" fill="#ef4444" opacity="0.9"/>
        <!-- Glass divisions -->
        <line x1="260" y1="15" x2="260" y2="90" stroke="#334155" stroke-width="3"/>
        <line x1="500" y1="15" x2="500" y2="90" stroke="#334155" stroke-width="3"/>
        <line x1="720" y1="15" x2="720" y2="90" stroke="#334155" stroke-width="3"/>

        <!-- Left Wing: Cleanroom & Thermal Test Lab -->
        <rect x="40" y="120" width="260" height="260" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.4"/>
        <!-- Cleanroom Window -->
        <rect x="55" y="135" width="230" height="110" rx="6" fill="#0369a1" fill-opacity="0.25" stroke="#38bdf8" stroke-width="1.2"/>
        <!-- Robotic Arm & Chamber -->
        <circle cx="120" cy="190" r="28" fill="#1e293b" stroke="#0ea5e9" stroke-width="2"/>
        <rect x="180" y="160" width="80" height="60" rx="4" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
        <circle cx="220" cy="190" r="14" fill="#f59e0b" fill-opacity="0.6"/>
        <line x1="120" y1="190" x2="190" y2="190" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>

        <!-- Center: Cross-Pacific Boardroom Table -->
        <g transform="translate(340, 140)">
          <!-- Large oval boardroom desk -->
          <ellipse cx="170" cy="120" rx="150" ry="85" fill="#1e293b" stroke="#475569" stroke-width="4"/>
          <ellipse cx="170" cy="120" rx="130" ry="70" fill="url(#table-glass)" stroke="#38bdf8" stroke-width="1.5"/>
          <!-- Central Telepresence Hologram Projector -->
          <circle cx="170" cy="120" rx="28" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="170" cy="120" rx="14" fill="#38bdf8" class="pulse-aura"/>
          <!-- Video conference monitors -->
          <rect x="60" y="70" width="30" height="18" rx="2" fill="#0284c7" stroke="#e2e8f0" stroke-width="1"/>
          <rect x="110" y="45" width="30" height="18" rx="2" fill="#0284c7" stroke="#e2e8f0" stroke-width="1"/>
          <rect x="200" y="45" width="30" height="18" rx="2" fill="#0284c7" stroke="#e2e8f0" stroke-width="1"/>
          <rect x="250" y="70" width="30" height="18" rx="2" fill="#0284c7" stroke="#e2e8f0" stroke-width="1"/>
          <rect x="70" y="160" width="30" height="18" rx="2" fill="#0284c7" stroke="#e2e8f0" stroke-width="1"/>
          <rect x="240" y="160" width="30" height="18" rx="2" fill="#0284c7" stroke="#e2e8f0" stroke-width="1"/>
          <!-- Chairs -->
          <circle cx="45" cy="120" r="10" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
          <circle cx="295" cy="120" r="10" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
          <circle cx="170" cy="225" r="10" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
          <circle cx="170" cy="15" r="10" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
        </g>

        <!-- Right Side: Presentation & R&D Display Wall -->
        <rect x="710" y="120" width="210" height="250" rx="8" fill="#182234" stroke="#475569" stroke-width="1.5"/>
        <rect x="725" y="135" width="180" height="100" rx="4" fill="#0369a1" fill-opacity="0.3" stroke="#0284c7" stroke-width="1"/>
        <line x1="740" y1="185" x2="880" y2="185" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3"/>
        <text x="740" y="160" font-family="'SF Mono',monospace" font-size="10" fill="#38bdf8">CHRONOS DIE-01</text>
        <text x="740" y="215" font-family="'SF Mono',monospace" font-size="9" fill="#94a3b8">TEMP: +85C | YIELD: ?</text>
      </svg>

      <!-- YEP_Event Mini Labels (Positioned on top of scene elements) -->
      <div class="mini-label-anchor" style="top: 24px; left: 140px;">
        ${renderMiniLabelHtml('🏢 東京精密研發本部 · 14F', '🏢')}
      </div>
      <div class="mini-label-anchor" style="top: 110px; left: 110px;">
        ${renderMiniLabelHtml('🔬 封裝熱測實驗室', '🔬')}
      </div>
      <div class="mini-label-anchor" style="top: 125px; left: 450px;">
        ${renderMiniLabelHtml('📡 跨洋視訊主控桌', '📡')}
      </div>

      <!-- Chibi Party (Standing on the carpet pathway near conference table) -->
      <div class="scene-party-dock" style="left: 360px; bottom: 25px;">
        ${renderChibiPartyHtml(groups, worldState.chiefNavigator)}
      </div>
    </div>
  `;
}

function renderSceneAct2Hangzhou(worldState = {}, groups = []) {
  const r1Buff = worldState.r1 === 'buff' || worldState.r1 === 'good' || worldState.r1 === 'B' || worldState.tokyo === 'buff';
  const r1Penalty = worldState.r1 === 'penalty' || worldState.r1 === 'bad' || worldState.tokyo === 'penalty';
  
  return `
    <div class="rpg-scene-canvas act-hangzhou">
      <svg class="scene-bg-svg" viewBox="0 0 960 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hz-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f2922"/>
            <stop offset="100%" stop-color="#061a15"/>
          </linearGradient>
          <pattern id="cleanroom-tile" width="48" height="48" patternUnits="userSpaceOnUse">
            <rect width="48" height="48" fill="#0d2e26" stroke="#134e3f" stroke-width="1"/>
            <circle cx="24" cy="24" r="1.5" fill="#10b981" opacity="0.4"/>
          </pattern>
        </defs>
        <!-- Floor -->
        <rect x="0" y="0" width="960" height="420" fill="url(#hz-floor)"/>
        <rect x="0" y="0" width="960" height="420" fill="url(#cleanroom-tile)"/>
        
        <!-- Safety Yellow Line / Walkway -->
        <rect x="30" y="190" width="900" height="50" fill="#064e3b" stroke="#eab308" stroke-width="2" stroke-dasharray="14 10"/>
        
        <!-- Assembly Line 1 (Top Left) -->
        <g transform="translate(40, 30)">
          <rect x="0" y="0" width="380" height="130" rx="8" fill="#134e4a" stroke="#14b8a6" stroke-width="2"/>
          <line x1="20" y1="65" x2="360" y2="65" stroke="#2dd4bf" stroke-width="6" stroke-linecap="round"/>
          <!-- Wafer Pods FOUP -->
          <rect x="50" y="45" width="40" height="40" rx="6" fill="#facc15" stroke="#713f12" stroke-width="2"/>
          <rect x="150" y="45" width="40" height="40" rx="6" fill="#facc15" stroke="#713f12" stroke-width="2"/>
          <rect x="250" y="45" width="40" height="40" rx="6" fill="#facc15" stroke="#713f12" stroke-width="2"/>
        </g>

        <!-- Chemical Photoresist Storage (Top Right) -->
        <g transform="translate(540, 30)">
          <rect x="0" y="0" width="380" height="130" rx="8" fill="#1c2d27" stroke="#eab308" stroke-width="2"/>
          <!-- Chemical Tanks -->
          <circle cx="70" cy="65" r="35" fill="#374151" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="170" cy="65" r="35" fill="#374151" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="270" cy="65" r="35" fill="#374151" stroke="#10b981" stroke-width="3"/>
          <text x="70" y="70" font-family="sans-serif" font-size="11" fill="#fef08a" text-anchor="middle" font-weight="bold">PR-A</text>
          <text x="170" y="70" font-family="sans-serif" font-size="11" fill="#fef08a" text-anchor="middle" font-weight="bold">PR-B</text>
          <text x="270" y="70" font-family="sans-serif" font-size="11" fill="#a7f3d0" text-anchor="middle" font-weight="bold">ECO</text>
        </g>

        <!-- Central Yield Monitor Console (Bottom) -->
        <g transform="translate(40, 260)">
          <rect x="0" y="0" width="380" height="130" rx="10" fill="#0f172a" stroke="#059669" stroke-width="2"/>
          <rect x="20" y="20" width="340" height="90" rx="6" fill="#022c22" stroke="#10b981" stroke-width="1"/>
          <!-- Yield Chart Waveform -->
          <path d="M40,85 Q100,${r1Penalty ? 95 : 45} 160,${r1Penalty ? 90 : 50} T280,${r1Penalty ? 98 : 40} L340,${r1Penalty ? 95 : 35}" fill="none" stroke="${r1Penalty ? '#ef4444' : '#10b981'}" stroke-width="3.5"/>
          <text x="40" y="42" font-family="'SF Mono',monospace" font-size="11" fill="#a7f3d0" font-weight="bold">
            ${r1Penalty ? '🔴 良率 YIELD: 45% (嚴重暴跌)' : '🟢 良率 YIELD: 78% (健康受控)'}
          </text>
        </g>
      </svg>

      <!-- YEP_Event Mini Labels -->
      <div class="mini-label-anchor" style="top: 18px; left: 160px;">
        ${renderMiniLabelHtml('⚙️ 杭州試產一號線', '⚙️')}
      </div>
      <div class="mini-label-anchor" style="top: 18px; left: 660px;">
        ${renderMiniLabelHtml('📦 特種光阻材料倉', '📦')}
      </div>
      <div class="mini-label-anchor" style="top: 245px; left: 160px;">
        ${renderMiniLabelHtml('📊 中央良率監控台', '📊')}
      </div>

      <!-- Dynamic Causal State Mini Label (Tokyo Tech Support or Heat Alert) -->
      <div class="mini-label-anchor" style="top: 175px; left: 470px;">
        ${r1Penalty
          ? renderMiniLabelHtml('🔴 高溫參數缺失警報 · 心防緊閉 -30s', '⚠️', 'label-crisis')
          : renderMiniLabelHtml('🟢 東京技師駐廠支援 · 根回互信 +33%', '✨', 'label-synergy')
        }
      </div>

      <!-- Chibi Party (Standing on the safety green/yellow walkway) -->
      <div class="scene-party-dock" style="left: 450px; bottom: 35px;">
        ${renderChibiPartyHtml(groups, worldState.chiefNavigator)}
      </div>
    </div>
  `;
}

function renderSceneAct3Munich(worldState = {}, groups = []) {
  const r2Penalty = worldState.r2 === 'penalty' || worldState.r2 === 'bad' || worldState.hangzhou === 'penalty';
  
  return `
    <div class="rpg-scene-canvas act-munich">
      <svg class="scene-bg-svg" viewBox="0 0 960 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="munich-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#18181b"/>
            <stop offset="100%" stop-color="#09090b"/>
          </linearGradient>
          <pattern id="server-tile" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#18181b" stroke="#27272a" stroke-width="1"/>
            <rect x="4" y="4" width="32" height="32" fill="#121215" rx="3"/>
          </pattern>
        </defs>
        <!-- Floor -->
        <rect x="0" y="0" width="960" height="420" fill="url(#munich-floor)"/>
        <rect x="0" y="0" width="960" height="420" fill="url(#server-tile)"/>

        <!-- Server Rack Cluster (Top & Right) -->
        <g transform="translate(40, 25)">
          <!-- 4 Server Cabinets -->
          ${[0, 90, 180, 270].map((dx, i) => `
            <g transform="translate(${dx}, 0)">
              <rect x="0" y="0" width="75" height="135" rx="5" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>
              ${[15, 35, 55, 75, 95, 115].map((dy) => `
                <line x1="8" y1="${dy}" x2="67" y2="${dy}" stroke="#52525b" stroke-width="2"/>
                <circle cx="15" cy="${dy - 4}" r="2" fill="${i % 2 === 0 ? '#06b6d4' : '#10b981'}" class="pulse-aura"/>
                <circle cx="23" cy="${dy - 4}" r="2" fill="#3b82f6"/>
              `).join('')}
            </g>
          `).join('')}
        </g>

        <!-- Glass War Room Entry (Center-Right) -->
        <g transform="translate(480, 30)">
          <rect x="0" y="0" width="440" height="135" rx="8" fill="#1e1e24" stroke="#6366f1" stroke-width="2" stroke-opacity="0.4"/>
          <!-- Dual Screen Workstations -->
          <rect x="30" y="45" width="80" height="50" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
          <rect x="140" y="45" width="80" height="50" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
          <rect x="250" y="45" width="80" height="50" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
          <!-- Glowing Terminal Code -->
          <line x1="38" y1="60" x2="95" y2="60" stroke="#38bdf8" stroke-width="2"/>
          <line x1="38" y1="70" x2="80" y2="70" stroke="#38bdf8" stroke-width="2"/>
          <line x1="148" y1="60" x2="205" y2="60" stroke="#a855f7" stroke-width="2"/>
        </g>

        <!-- Stress Testing Bay (Bottom Left) -->
        <g transform="translate(40, 240)">
          <rect x="0" y="0" width="360" height="145" rx="8" fill="#111827" stroke="#e11d48" stroke-width="2" stroke-dasharray="8 4"/>
          <circle cx="80" cy="70" r="38" fill="#1f2937" stroke="#f43f5e" stroke-width="3"/>
          <polygon points="80,45 92,68 68,68" fill="#fbbf24"/>
          <text x="80" y="88" font-family="'SF Mono',monospace" font-size="10" fill="#fda4af" text-anchor="middle">99.8% LOAD</text>
        </g>
      </svg>

      <!-- YEP_Event Mini Labels -->
      <div class="mini-label-anchor" style="top: 15px; left: 170px;">
        ${renderMiniLabelHtml('🏛️ 慕尼黑架構中心', '🏛️')}
      </div>
      <div class="mini-label-anchor" style="top: 15px; left: 660px;">
        ${renderMiniLabelHtml('💻 核心介面聯調席', '💻')}
      </div>
      <div class="mini-label-anchor" style="top: 225px; left: 160px;">
        ${renderMiniLabelHtml('⚡ 壓力測試機櫃', '⚡')}
      </div>

      <!-- Dynamic Causal State Mini Label -->
      <div class="mini-label-anchor" style="top: 180px; left: 540px;">
        ${r2Penalty
          ? renderMiniLabelHtml('🔴 斷料怠工危機 · 協調時間 -30s', '⚠️', 'label-crisis')
          : renderMiniLabelHtml('🟢 綠色通道直達 · 晶圓全速上線', '⚡', 'label-synergy')
        }
      </div>

      <!-- Chibi Party (Standing near the integration terminal consoles) -->
      <div class="scene-party-dock" style="left: 450px; bottom: 35px;">
        ${renderChibiPartyHtml(groups, worldState.chiefNavigator)}
      </div>
    </div>
  `;
}

function renderSceneAct4Brussels(worldState = {}, groups = []) {
  return `
    <div class="rpg-scene-canvas act-brussels">
      <svg class="scene-bg-svg" viewBox="0 0 960 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bru-stage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <radialGradient id="spotlight" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stop-color="#fef08a" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- Floor & Stage Backdrop -->
        <rect x="0" y="0" width="960" height="420" fill="url(#bru-stage)"/>
        
        <!-- Keynote Stage Spotlight Beams -->
        <polygon points="120,0 20,420 300,420" fill="url(#spotlight)"/>
        <polygon points="760,0 600,420 940,420" fill="url(#spotlight)"/>

        <!-- Giant Global Keynote Screen (Top Center) -->
        <g transform="translate(240, 20)">
          <rect x="0" y="0" width="480" height="150" rx="12" fill="#090d16" stroke="#fbbf24" stroke-width="2.5"/>
          <!-- Stage Lighting Girders -->
          <line x1="20" y1="15" x2="460" y2="15" stroke="#475569" stroke-width="3"/>
          <text x="240" y="65" font-family="'SF Pro Display',sans-serif" font-size="20" fill="#ffffff" font-weight="900" text-anchor="middle" letter-spacing="3">PROJECT CHRONOS</text>
          <text x="240" y="95" font-family="'SF Pro Text',sans-serif" font-size="12" fill="#facc15" text-anchor="middle" letter-spacing="4">GLOBAL LAUNCH KEYNOTE</text>
          <!-- Status Ring -->
          <circle cx="240" cy="120" r="12" fill="#10b981" class="pulse-aura"/>
        </g>

        <!-- Backstage Crisis War Room Desk (Bottom Left) -->
        <g transform="translate(40, 230)">
          <rect x="0" y="0" width="380" height="155" rx="8" fill="#111827" stroke="#ef4444" stroke-width="2"/>
          <rect x="20" y="25" width="160" height="95" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
          <!-- Red Hotline Phone -->
          <circle cx="260" cy="70" r="22" fill="#991b1b" stroke="#f87171" stroke-width="2"/>
          <rect x="245" y="63" width="30" height="14" rx="4" fill="#ffffff"/>
          <text x="100" y="65" font-family="'SF Mono',monospace" font-size="10" fill="#fca5a5">WALL STREET SHORT REPORT</text>
          <text x="100" y="85" font-family="'SF Mono',monospace" font-size="9" fill="#94a3b8">TEMP: -20C AT RISK</text>
        </g>

        <!-- EU Regulatory Tribunal Desk (Bottom Right) -->
        <g transform="translate(540, 230)">
          <rect x="0" y="0" width="380" height="155" rx="8" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
          <!-- 12 European Stars Circle -->
          <circle cx="100" cy="80" r="35" fill="none" stroke="#facc15" stroke-width="1.8" stroke-dasharray="5 13"/>
          <text x="240" y="70" font-family="sans-serif" font-size="12" fill="#93c5fd" font-weight="bold">EU CONFORMITY DESK</text>
          <text x="240" y="95" font-family="'SF Mono',monospace" font-size="10" fill="#cbd5e1">ROYAL DUTCH TELECOM</text>
        </g>
      </svg>

      <!-- YEP_Event Mini Labels -->
      <div class="mini-label-anchor" style="top: 15px; left: 450px;">
        ${renderMiniLabelHtml('🌐 布魯塞爾全球首發舞台', '🌐')}
      </div>
      <div class="mini-label-anchor" style="top: 215px; left: 180px;">
        ${renderMiniLabelHtml('🛡️ 後台危機指揮中心', '🛡️')}
      </div>
      <div class="mini-label-anchor" style="top: 215px; left: 690px;">
        ${renderMiniLabelHtml('⚖️ 歐盟合規審查席', '⚖️')}
      </div>

      <!-- Chibi Party (Standing on the backstage central runway) -->
      <div class="scene-party-dock" style="left: 450px; bottom: 35px;">
        ${renderChibiPartyHtml(groups, worldState.chiefNavigator)}
      </div>
    </div>
  `;
}

export function renderRpgScene(roundIndex = 0, worldState = {}, groups = []) {
  const idx = Number(roundIndex) || 0;
  let sceneContent = '';
  if (idx === 0) sceneContent = renderSceneAct1Tokyo(worldState, groups);
  else if (idx === 1) sceneContent = renderSceneAct2Hangzhou(worldState, groups);
  else if (idx === 2) sceneContent = renderSceneAct3Munich(worldState, groups);
  else sceneContent = renderSceneAct4Brussels(worldState, groups);

  return `
    <div class="rpg-map-viewport act-${idx + 1}" data-round-index="${idx}">
      ${sceneContent}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. GALV_MessageBusts Character Busts (SVG Anime Style)
// ----------------------------------------------------------------------------

function renderBustTakahashiSvg(mood = 'normal') {
  const isAlly = mood === 'ally' || mood === 'happy';
  return `
    <svg class="bust-svg" viewBox="0 0 320 400" width="300" height="375" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="takahashi-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#cbd5e1"/>
          <stop offset="60%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
        <linearGradient id="wafer-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <radialGradient id="glasses-glint" cx="70%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
        </radialGradient>
      </defs>

      <!-- Aura / Emotion Effect Background -->
      ${isAlly ? `
        <!-- Ally Synergy Aura -->
        <circle cx="160" cy="180" r="140" fill="#10b981" fill-opacity="0.12" filter="blur(20px)"/>
        <g fill="#34d399">
          <circle cx="80" cy="120" r="3" class="pulse-aura"/>
          <circle cx="240" cy="90" r="4" class="pulse-aura"/>
          <circle cx="60" cy="220" r="2.5"/>
          <polygon points="250,150 255,140 260,150 255,160"/>
        </g>
      ` : `
        <!-- Tense Stress Marks / Sweat -->
        <g stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round">
          <line x1="85" y1="90" x2="85" y2="105"/>
          <line x1="91" y1="92" x2="91" y2="108"/>
          <line x1="97" y1="94" x2="97" y2="106"/>
        </g>
        <!-- Blue sweat drop -->
        <path d="M78,115 C75,123 85,123 82,115 C80,110 80,110 78,115 Z" fill="#38bdf8" opacity="0.9"/>
      `}

      <!-- Body / Clothing -->
      <!-- White Research Lab Coat (Overcoat) -->
      <path d="M50,400 L80,240 Q160,260 240,240 L270,400 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M90,260 L130,400 L70,400 Z" fill="#e2e8f0"/>
      <path d="M230,260 L190,400 L250,400 Z" fill="#e2e8f0"/>
      <!-- Navy Inner Suit & Shirt -->
      <polygon points="120,245 160,290 200,245 185,400 135,400" fill="#1e293b"/>
      <polygon points="145,245 160,275 175,245" fill="#ffffff"/>
      <!-- Burgundy Tie -->
      <polygon points="156,260 164,260 168,340 160,360 152,340" fill="#991b1b"/>

      <!-- Neck & Head Base -->
      <rect x="142" y="190" width="36" height="45" fill="#fed7aa"/>
      <ellipse cx="160" cy="165" rx="52" ry="58" fill="#fde68a"/>

      <!-- Facial Features -->
      <!-- Eyebrows -->
      ${isAlly ? `
        <path d="M125,145 Q140,140 150,145" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
        <path d="M170,145 Q180,140 195,145" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
      ` : `
        <path d="M125,148 Q140,154 150,150" fill="none" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M170,150 Q180,154 195,148" fill="none" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>
      `}

      <!-- Eyes -->
      ${isAlly ? `
        <!-- Smiling Eyes -->
        <path d="M128,162 Q138,154 148,162" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
        <path d="M172,162 Q182,154 192,162" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
        <!-- Cheek blush -->
        <ellipse cx="132" cy="172" rx="7" ry="3.5" fill="#f43f5e" opacity="0.35"/>
        <ellipse cx="188" cy="172" rx="7" ry="3.5" fill="#f43f5e" opacity="0.35"/>
      ` : `
        <!-- Serious Focused Eyes -->
        <ellipse cx="138" cy="160" rx="9" ry="7" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
        <ellipse cx="182" cy="160" rx="9" ry="7" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
        <circle cx="138" cy="160" r="5" fill="#1e293b"/>
        <circle cx="182" cy="160" r="5" fill="#1e293b"/>
        <circle cx="140" cy="158" r="1.8" fill="#ffffff"/>
        <circle cx="184" cy="158" r="1.8" fill="#ffffff"/>
      `}

      <!-- Nose & Mouth -->
      <path d="M160,165 L157,178 L163,178" fill="none" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
      ${isAlly ? `
        <!-- Warm Smile -->
        <path d="M150,190 Q160,200 170,190" fill="none" stroke="#991b1b" stroke-width="2.5" stroke-linecap="round"/>
      ` : `
        <!-- Tight Stern Lip -->
        <line x1="152" y1="192" x2="168" y2="192" stroke="#991b1b" stroke-width="2.2" stroke-linecap="round"/>
      `}

      <!-- Thin Silver-Frame Glasses -->
      <rect x="122" y="150" width="32" height="20" rx="4" fill="url(#glasses-glint)" stroke="#64748b" stroke-width="2"/>
      <rect x="166" y="150" width="32" height="20" rx="4" fill="url(#glasses-glint)" stroke="#64748b" stroke-width="2"/>
      <line x1="154" y1="158" x2="166" y2="158" stroke="#64748b" stroke-width="2.5"/>
      <line x1="110" y1="156" x2="122" y2="156" stroke="#64748b" stroke-width="2"/>
      <line x1="198" y1="156" x2="210" y2="156" stroke="#64748b" stroke-width="2"/>

      <!-- Layered Silver-Gray Hair -->
      <path d="M102,175 Q90,95 160,90 Q230,95 218,175 Q212,130 190,120 Q160,115 130,120 Q108,130 102,175 Z" fill="url(#takahashi-hair)"/>
      <path d="M120,118 Q140,135 155,120 Q168,140 185,118 Q195,135 205,125 Q180,95 135,105 Z" fill="#e2e8f0" opacity="0.65"/>

      <!-- Hand holding Silicon Wafer Inspector -->
      <g transform="translate(195, 260)">
        <circle cx="45" cy="45" r="42" fill="url(#wafer-gradient)" stroke="#f8fafc" stroke-width="2.5" filter="drop-shadow(0 4px 10px rgba(2,132,199,0.5))"/>
        <!-- Wafer Microchip Grid -->
        <path d="M15,45 L75,45 M45,15 L45,75 M25,25 L65,65 M25,65 L65,25" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        <!-- Hand / Fingers holding it -->
        <rect x="10" y="55" width="20" height="12" rx="6" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
      </g>
    </svg>
  `;
}

function renderBustLaoChenSvg(mood = 'normal') {
  const isAngry = mood === 'angry' || mood === 'tense';
  const isAlly = mood === 'ally' || mood === 'happy';

  return `
    <svg class="bust-svg" viewBox="0 0 320 400" width="300" height="375" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chen-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#27272a"/>
          <stop offset="70%" stop-color="#18181b"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
        <linearGradient id="chen-jacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f766e"/>
          <stop offset="100%" stop-color="#115e59"/>
        </linearGradient>
      </defs>

      <!-- Emotion Effects -->
      ${isAngry ? `
        <!-- Angry Fire Aura & Manga Vein -->
        <circle cx="160" cy="180" r="140" fill="#dc2626" fill-opacity="0.15" filter="blur(20px)"/>
        <!-- Anime 💢 Anger Vein Mark -->
        <g transform="translate(225, 105) scale(0.9)" stroke="#dc2626" stroke-width="3.5" fill="none" stroke-linecap="round">
          <path d="M0,8 Q8,8 8,0 M8,0 Q8,8 16,8 M16,8 Q8,8 8,16 M8,16 Q8,8 0,8"/>
        </g>
        <!-- Steam puffs -->
        <path d="M70,120 Q60,110 70,100 Q80,110 70,120 Z" fill="#ffffff" opacity="0.6"/>
        <path d="M250,130 Q260,120 250,110 Q240,120 250,130 Z" fill="#ffffff" opacity="0.6"/>
      ` : isAlly ? `
        <!-- Synergy Confident Green Glow -->
        <circle cx="160" cy="180" r="140" fill="#10b981" fill-opacity="0.15" filter="blur(20px)"/>
        <g fill="#facc15">
          <polygon points="70,110 73,100 80,105 73,110"/>
          <polygon points="250,130 253,120 260,125 253,130"/>
        </g>
      ` : ''}

      <!-- Cleanroom Work Vest / Jacket -->
      <path d="M40,400 L75,235 Q160,250 245,235 L280,400 Z" fill="url(#chen-jacket)" stroke="#042f2e" stroke-width="2"/>
      <!-- High-visibility yellow safety band -->
      <path d="M55,300 L265,300 L262,320 L58,320 Z" fill="#eab308"/>
      <!-- Inner Industrial Dark Shirt -->
      <polygon points="125,235 160,280 195,235 185,400 135,400" fill="#1f2937"/>
      <!-- ID Badge Lanyard -->
      <path d="M140,235 L155,320 M180,235 L165,320" stroke="#facc15" stroke-width="2.5"/>
      <rect x="145" y="320" width="30" height="42" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/>
      <rect x="150" y="325" width="20" height="15" rx="2" fill="#0f766e"/>
      <line x1="150" y1="346" x2="170" y2="346" stroke="#475569" stroke-width="2"/>
      <line x1="150" y1="352" x2="165" y2="352" stroke="#475569" stroke-width="1.5"/>

      <!-- Neck & Head Base -->
      <rect x="140" y="185" width="40" height="50" fill="#fed7aa"/>
      <ellipse cx="160" cy="160" rx="55" ry="58" fill="#fde68a"/>

      <!-- Facial Features -->
      <!-- Eyebrows -->
      ${isAngry ? `
        <!-- Angry Sharply Slanted Brows -->
        <path d="M120,138 L150,152" fill="none" stroke="#18181b" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M200,138 L170,152" fill="none" stroke="#18181b" stroke-width="4.5" stroke-linecap="round"/>
      ` : isAlly ? `
        <path d="M125,142 Q140,138 152,142" fill="none" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
        <path d="M168,142 Q180,138 195,142" fill="none" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
      ` : `
        <path d="M125,145 L150,148" fill="none" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
        <path d="M195,145 L170,148" fill="none" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
      `}

      <!-- Eyes -->
      ${isAngry ? `
        <!-- Clenched Piercing Eyes -->
        <polygon points="128,155 148,162 132,168" fill="#18181b"/>
        <polygon points="192,155 172,162 188,168" fill="#18181b"/>
        <circle cx="138" cy="161" r="2" fill="#ef4444"/>
        <circle cx="182" cy="161" r="2" fill="#ef4444"/>
      ` : isAlly ? `
        <!-- Broad Confident Eyes -->
        <ellipse cx="138" cy="158" rx="8" ry="7" fill="#18181b"/>
        <ellipse cx="182" cy="158" rx="8" ry="7" fill="#18181b"/>
        <circle cx="140" cy="156" r="2.5" fill="#ffffff"/>
        <circle cx="184" cy="156" r="2.5" fill="#ffffff"/>
      ` : `
        <ellipse cx="138" cy="158" rx="8" ry="6" fill="#18181b"/>
        <ellipse cx="182" cy="158" rx="8" ry="6" fill="#18181b"/>
        <circle cx="140" cy="156" r="2" fill="#ffffff"/>
        <circle cx="184" cy="156" r="2" fill="#ffffff"/>
      `}

      <!-- Nose & Mouth -->
      <path d="M160,162 L155,176 L165,176" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>
      ${isAngry ? `
        <!-- Bared Teeth / Shouting -->
        <rect x="145" y="186" width="30" height="14" rx="3" fill="#ffffff" stroke="#7f1d1d" stroke-width="2"/>
        <line x1="145" y1="193" x2="175" y2="193" stroke="#7f1d1d" stroke-width="1.2"/>
      ` : isAlly ? `
        <!-- Broad Hearty Smile -->
        <path d="M145,185 Q160,202 175,185 Z" fill="#ffffff" stroke="#78350f" stroke-width="2"/>
      ` : `
        <!-- Firm Straight Line -->
        <line x1="148" y1="190" x2="172" y2="190" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
      `}

      <!-- Energetic Spiky Hair -->
      <path d="M98,160 L102,110 L118,125 L125,95 L145,115 L160,85 L175,115 L195,95 L202,125 L218,110 L222,160 Q160,120 98,160 Z" fill="url(#chen-hair)"/>
      <path d="M102,110 L115,130 L135,110 L160,95 L185,110 L205,130 L218,110" stroke="#71717a" stroke-width="1.8" fill="none"/>

      <!-- Hand Holding Yield Clipboard (Left side) -->
      <g transform="translate(30, 270) rotate(-8)">
        <rect x="0" y="0" width="70" height="95" rx="4" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <rect x="6" y="8" width="58" height="80" rx="2" fill="#ffffff"/>
        <!-- Clip -->
        <rect x="22" y="0" width="26" height="12" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
        <!-- Yield Sheet Lines -->
        <text x="12" y="24" font-family="'SF Mono',monospace" font-size="7" fill="#0f766e" font-weight="bold">YIELD REPORT</text>
        <path d="M12,55 Q25,${isAngry ? 70 : 35} 40,${isAngry ? 68 : 38} T60,${isAngry ? 72 : 30}" fill="none" stroke="${isAngry ? '#dc2626' : '#059669'}" stroke-width="2"/>
        <!-- Fingers -->
        <circle cx="65" cy="50" r="6" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
      </g>
    </svg>
  `;
}

function renderBustHansSvg(mood = 'normal') {
  const isArrogant = mood === 'arrogant' || mood === 'normal' || mood === 'tense';
  const isAlly = mood === 'ally' || mood === 'happy';

  return `
    <svg class="bust-svg" viewBox="0 0 320 400" width="300" height="375" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hans-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="60%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
        <radialGradient id="headphone-ring" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="70%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>

      <!-- Holographic Code / Aura -->
      ${isAlly ? `
        <!-- Cyan Data Matrix Synergy -->
        <circle cx="160" cy="180" r="140" fill="#06b6d4" fill-opacity="0.12" filter="blur(20px)"/>
        <g font-family="'SF Mono',monospace" font-size="8" fill="#22d3ee" opacity="0.6">
          <text x="40" y="100">0101 ARCH_V3</text>
          <text x="230" y="120">SYNC_OK</text>
          <text x="240" y="240">SPEED +15%</text>
        </g>
      ` : `
        <!-- Electric Arrogance / Spark -->
        <g stroke="#38bdf8" stroke-width="2" fill="none">
          <path d="M240,110 L250,95 L245,120 L258,105"/>
        </g>
      `}

      <!-- German Minimalist Black Slim Turtleneck -->
      <path d="M50,400 L85,240 Q160,250 235,240 L270,400 Z" fill="#18181b" stroke="#09090b" stroke-width="2"/>
      <!-- High-collar Turtleneck -->
      <rect x="135" y="185" width="50" height="40" rx="8" fill="#27272a" stroke="#09090b" stroke-width="1.5"/>

      <!-- Arms Folded Posture -->
      <path d="M70,330 Q160,370 250,330 L240,400 L80,400 Z" fill="#27272a" stroke="#18181b" stroke-width="2"/>

      <!-- Neck & Head Base -->
      <ellipse cx="160" cy="160" rx="52" ry="56" fill="#fde68a"/>

      <!-- DJ / Studio Monitor Headphones around Neck -->
      <g transform="translate(110, 200)">
        <path d="M10,0 Q50,-15 90,0" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
        <!-- Left Cup -->
        <rect x="0" y="-8" width="22" height="32" rx="8" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
        <circle cx="11" cy="8" r="6" fill="url(#headphone-ring)"/>
        <!-- Right Cup -->
        <rect x="78" y="-8" width="22" height="32" rx="8" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
        <circle cx="89" cy="8" r="6" fill="url(#headphone-ring)"/>
      </g>

      <!-- Facial Features -->
      <!-- Eyebrows -->
      ${isAlly ? `
        <!-- Respectful Focus -->
        <path d="M125,142 L150,144" fill="none" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M170,144 L195,142" fill="none" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
      ` : `
        <!-- One Raised Eyebrow (Smug/Arrogant) -->
        <path d="M125,144 L150,148" fill="none" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M170,138 Q182,132 195,140" fill="none" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
      `}

      <!-- Eyes -->
      ${isAlly ? `
        <!-- Focused Approving Gaze -->
        <ellipse cx="138" cy="158" rx="8" ry="7" fill="#0f172a"/>
        <ellipse cx="182" cy="158" rx="8" ry="7" fill="#0f172a"/>
        <circle cx="140" cy="156" r="2.5" fill="#38bdf8"/>
        <circle cx="184" cy="156" r="2.5" fill="#38bdf8"/>
      ` : `
        <!-- Half-Lidded Smug Gaze -->
        <ellipse cx="138" cy="158" rx="8" ry="5.5" fill="#0f172a"/>
        <ellipse cx="182" cy="156" rx="8" ry="6" fill="#0f172a"/>
        <circle cx="140" cy="157" r="2" fill="#38bdf8"/>
        <circle cx="184" cy="155" r="2" fill="#38bdf8"/>
      `}

      <!-- Nose & Smirk -->
      <path d="M160,162 L156,176 L164,176" fill="none" stroke="#b45309" stroke-width="1.8" stroke-linecap="round"/>
      ${isAlly ? `
        <!-- Genuine Nodding Smile -->
        <path d="M150,188 Q160,196 170,188" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
      ` : `
        <!-- Cocky Asymmetrical Smirk -->
        <path d="M150,190 Q162,192 174,184" fill="none" stroke="#78350f" stroke-width="2.8" stroke-linecap="round"/>
      `}

      <!-- Tousled Wavy Anime Hair -->
      <path d="M100,165 Q90,90 160,80 Q230,90 220,165 Q210,120 185,110 Q160,105 135,110 Q110,120 100,165 Z" fill="url(#hans-hair)"/>
      <path d="M115,115 Q140,130 160,110 Q180,135 205,115 Q190,90 135,95 Z" fill="#fde68a" opacity="0.6"/>
      <!-- Dynamic locks on forehead -->
      <path d="M140,110 Q155,138 160,135 Q165,138 175,115" fill="none" stroke="#b45309" stroke-width="2"/>
    </svg>
  `;
}

function renderBustVanderbergSvg(mood = 'normal') {
  const isStern = mood === 'stern' || mood === 'normal' || mood === 'tense';
  const isAlly = mood === 'ally' || mood === 'happy';

  return `
    <svg class="bust-svg" viewBox="0 0 320 400" width="300" height="375" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vander-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="60%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#a16207"/>
        </linearGradient>
        <linearGradient id="vander-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>

      <!-- European Golden Aura or Stern Countdown Aura -->
      ${isAlly ? `
        <!-- European Starburst Golden Synergy -->
        <circle cx="160" cy="180" r="140" fill="#facc15" fill-opacity="0.14" filter="blur(20px)"/>
        <!-- 12 Stars Halo Ring -->
        <g stroke="#facc15" stroke-width="1.5" fill="#fde047">
          ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = 160 + 120 * Math.cos(rad);
            const y = 170 + 120 * Math.sin(rad);
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/>`;
          }).join('')}
        </g>
      ` : `
        <!-- Cold Blue Ultimatum Glare -->
        <circle cx="160" cy="180" r="140" fill="#1e3a8a" fill-opacity="0.18" filter="blur(20px)"/>
        <line x1="70" y1="80" x2="100" y2="110" stroke="#60a5fa" stroke-width="2" opacity="0.6"/>
        <line x1="250" y1="80" x2="220" y2="110" stroke="#60a5fa" stroke-width="2" opacity="0.6"/>
      `}

      <!-- Tailored European Midnight Double-Breasted Suit -->
      <path d="M40,400 L75,230 Q160,245 245,230 L280,400 Z" fill="url(#vander-suit)" stroke="#312e81" stroke-width="2.5"/>
      <!-- Peak Lapels -->
      <polygon points="100,235 150,330 115,350 75,235" fill="#312e81"/>
      <polygon points="220,235 170,330 205,350 245,235" fill="#312e81"/>
      <!-- Gold Double-Breasted Buttons -->
      <circle cx="140" cy="310" r="5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
      <circle cx="180" cy="310" r="5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
      <circle cx="140" cy="350" r="5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
      <circle cx="180" cy="350" r="5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
      <!-- Gold Tie Clip -->
      <polygon points="155,245 165,245 168,300 152,300" fill="#3b82f6"/>
      <rect x="150" y="275" width="20" height="3" rx="1.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>

      <!-- Neck & Head Base -->
      <rect x="142" y="180" width="36" height="45" fill="#fed7aa"/>
      <ellipse cx="160" cy="155" rx="52" ry="56" fill="#fde68a"/>

      <!-- Facial Features -->
      <!-- Eyebrows -->
      ${isAlly ? `
        <!-- Gracious Aristocratic Smile Brows -->
        <path d="M125,138 Q140,135 152,140" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
        <path d="M168,140 Q180,135 195,138" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      ` : `
        <!-- Stern Severe Frown Brows -->
        <path d="M125,142 L152,146" fill="none" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M195,142 L168,146" fill="none" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
      `}

      <!-- Sapphire Blue Eyes -->
      <ellipse cx="138" cy="155" rx="8" ry="6.5" fill="#0f172a"/>
      <ellipse cx="182" cy="155" rx="8" ry="6.5" fill="#0f172a"/>
      <circle cx="140" cy="154" r="3" fill="#0284c7"/>
      <circle cx="184" cy="154" r="3" fill="#0284c7"/>
      <circle cx="141" cy="153" r="1.2" fill="#ffffff"/>
      <circle cx="185" cy="153" r="1.2" fill="#ffffff"/>

      <!-- Nose & Mouth -->
      <path d="M160,158 L156,172 L164,172" fill="none" stroke="#b45309" stroke-width="1.8" stroke-linecap="round"/>
      ${isAlly ? `
        <!-- Endorsing Patrician Smile -->
        <path d="M148,185 Q160,195 172,185" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
      ` : `
        <!-- Stern Down-Turned Ultimatum Mouth -->
        <path d="M148,188 Q160,184 172,188" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
      `}

      <!-- Slicked-Back Undercut Hairstyle -->
      <path d="M105,160 Q100,80 160,75 Q220,80 215,160 Q205,100 160,95 Q115,100 105,160 Z" fill="url(#vander-hair)"/>
      <!-- Comb Lines -->
      <path d="M120,95 Q140,85 160,85 Q180,85 200,95" stroke="#ca8a04" stroke-width="1.5" fill="none"/>
      <path d="M130,110 Q145,100 160,100 Q175,100 190,110" stroke="#ca8a04" stroke-width="1.5" fill="none"/>

      <!-- Hand holding EU Compliance Dossier / Ultimatum Binder -->
      <g transform="translate(195, 255) rotate(5)">
        <rect x="0" y="0" width="75" height="100" rx="4" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>
        <rect x="5" y="5" width="65" height="90" rx="2" fill="#1e293b"/>
        <!-- Golden EU Seal -->
        <circle cx="37" cy="45" r="16" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="3 2"/>
        <polygon points="37,35 40,43 48,43 42,48 44,56 37,51 30,56 32,48 26,43 34,43" fill="#facc15"/>
        <text x="37" y="75" font-family="'SF Mono',monospace" font-size="7" fill="#fde047" text-anchor="middle" font-weight="bold">EU CONFORMITY</text>
        <!-- Hand holding -->
        <circle cx="10" cy="55" r="7" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
      </g>
    </svg>
  `;
}

export function renderCharacterBust(roundIndex = 0, mood = 'normal') {
  const idx = Number(roundIndex) || 0;
  let bustSvg = '';
  let roleTitle = '';

  if (idx === 0) {
    bustSvg = renderBustTakahashiSvg(mood);
    roleTitle = '東京總工 · 高橋';
  } else if (idx === 1) {
    bustSvg = renderBustLaoChenSvg(mood);
    roleTitle = '杭州廠長 · 老陳';
  } else if (idx === 2) {
    bustSvg = renderBustHansSvg(mood);
    roleTitle = '首席架構師 · 漢斯';
  } else {
    bustSvg = renderBustVanderbergSvg(mood);
    roleTitle = '荷蘭大客戶 · 范德堡';
  }

  return `
    <figure class="rpg-bust-figure mood-${mood} act-${idx + 1}" data-speaker="${esc(roleTitle)}" aria-label="${roleTitle} 半身立繪">
      <div class="bust-art-frame">
        ${bustSvg}
      </div>
    </figure>
  `;
}

// ----------------------------------------------------------------------------
// 4. Global World State Causal HUD
// ----------------------------------------------------------------------------

export function renderWorldStateHud(worldState = {}) {
  // Tokyo R&D (Round 1 Outcome)
  const tokyoState =
    worldState.r1 === 'buff' || worldState.r1 === 'good' || worldState.r1 === 'B' || worldState.tokyo === 'buff'
      ? { cls: 'is-good', dot: '🟢', text: '根回互信 · 正面支援', title: '東京團隊全力協調參數支援' }
      : worldState.r1 === 'penalty' || worldState.r1 === 'bad' || worldState.tokyo === 'penalty'
      ? { cls: 'is-bad', dot: '🔴', text: '心防緊閉 · 扣留參數 (-30s)', title: '日方心防緊閉，扣留高溫補償表' }
      : { cls: 'is-idle', dot: '⚪', text: '待命校準', title: '首輪探索中' };

  // Hangzhou Fab (Round 2 Outcome)
  const hangzhouState =
    worldState.r2 === 'buff' || worldState.r2 === 'good' || worldState.r2 === 'C' || worldState.hangzhou === 'buff'
      ? { cls: 'is-good', dot: '🟢', text: '綠色通道 · 全速供料', title: '特種光阻專機直送，良率受控' }
      : worldState.r2 === 'penalty' || worldState.r2 === 'bad' || worldState.hangzhou === 'penalty'
      ? { cls: 'is-bad', dot: '🔴', text: '斷料怠工 · 供應鏈卡件 (-30s)', title: '供應鏈奪權斷料，產線停擺' }
      : { cls: 'is-idle', dot: '⚪', text: '待命試產', title: '尚未結算' };

  // Munich Architecture (Round 3 Outcome)
  const munichState =
    worldState.r3 === 'buff' || worldState.r3 === 'good' || worldState.r3 === 'C' || worldState.r3 === 'A' || worldState.munich === 'buff'
      ? { cls: 'is-good', dot: '🟢', text: '技術長城 · 架構共審', title: '三地共審確立核心常規' }
      : worldState.r3 === 'penalty' || worldState.r3 === 'bad' || worldState.munich === 'penalty'
      ? { cls: 'is-bad', dot: '🔴', text: '常規瓦解 · 團隊分裂 (-15s)', title: '明星特權撕裂信任，協議衝突' }
      : { cls: 'is-idle', dot: '⚪', text: '待命聯調', title: '尚未結算' };

  return `
    <header class="world-state-hud card" aria-label="全球據點因果狀態列">
      <div class="hud-brand">
        <span class="hud-eyebrow">WORLD STATE HUD</span>
        <strong class="hud-title">跨國因果鏈</strong>
      </div>
      <div class="hud-badges-wrap">
        <div class="hud-badge ${tokyoState.cls}" title="${tokyoState.title}">
          <span class="hud-flag">🇯🇵</span>
          <span class="hud-location">東京研發</span>
          <span class="hud-status">${tokyoState.dot} ${tokyoState.text}</span>
        </div>
        <div class="hud-badge ${hangzhouState.cls}" title="${hangzhouState.title}">
          <span class="hud-flag">🇨🇳</span>
          <span class="hud-location">杭州產線</span>
          <span class="hud-status">${hangzhouState.dot} ${hangzhouState.text}</span>
        </div>
        <div class="hud-badge ${munichState.cls}" title="${munichState.title}">
          <span class="hud-flag">🇩🇪</span>
          <span class="hud-location">慕尼黑架構</span>
          <span class="hud-status">${munichState.dot} ${munichState.text}</span>
        </div>
      </div>
    </header>
  `;
}

// ----------------------------------------------------------------------------
// 5. Complete JRPG Dialogue Box (YEP_MessageCore + GALV_MessageBusts)
// ----------------------------------------------------------------------------

export function renderRpgDialogueBox({
  roundIndex = 0,
  speaker = '',
  text = '',
  prompt = '',
  mood = 'normal',
  worldState = {},
  groups = []
}) {
  const sceneHtml = renderRpgScene(roundIndex, worldState, groups);
  const bustHtml = renderCharacterBust(roundIndex, mood);
  const defaultSpeaker =
    roundIndex === 0
      ? '東京總工 · 高橋'
      : roundIndex === 1
      ? '杭州廠長 · 老陳'
      : roundIndex === 2
      ? '首席架構師 · 漢斯'
      : '荷蘭大客戶 · 范德堡';

  const finalSpeaker = speaker || defaultSpeaker;

  return `
    <div class="rpg-stage-card card" data-round="${roundIndex}">
      <!-- 2D Top-Down Scene Viewport -->
      <div class="rpg-stage-top">
        ${sceneHtml}
        <!-- GALV Bust Figure positioned at the right, breaking the frame -->
        <div class="galv-bust-wrap">
          ${bustHtml}
        </div>
      </div>

      <!-- Classic YEP MessageCore Dialogue Window -->
      <div class="rpg-dialogue-wrap">
        <div class="yep-name-box rpg-name-box" aria-label="發言者">
          <span class="name-box-text">${esc(finalSpeaker)}</span>
        </div>
        <div class="rpg-message-box" role="region" aria-label="JRPG 對話框">
          <div class="rpg-message-inner">
            <div class="rpg-message-content">
              <p class="rpg-dialogue-text">「${esc(text)}」</p>
              ${prompt ? `
                <div class="rpg-dialogue-prompt">
                  <span class="prompt-badge">⚔️ 決策課題</span>
                  <span class="prompt-text">${esc(prompt)}</span>
                </div>
              ` : ''}
            </div>
            <div class="rpg-next-caret" title="繼續下一段" aria-hidden="true">▼</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
