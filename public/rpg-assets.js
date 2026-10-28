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
          <!-- Twilight Skyline Sunset Gradient (Deep Night Sky -> Dusk Amber Horizon) -->
          <linearGradient id="tokyo-sunset-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0a0e1a"/>
            <stop offset="28%" stop-color="#1e1b4b"/>
            <stop offset="52%" stop-color="#431407"/>
            <stop offset="74%" stop-color="#9a3412"/>
            <stop offset="88%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>

          <!-- Modern Executive Boardroom Light Wood Floor -->
          <linearGradient id="tokyo-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f5f2eb"/>
            <stop offset="100%" stop-color="#e6e0d4"/>
          </linearGradient>

          <!-- Executive Sleek Walnut Surface (#452c24 ~ #1e110c) -->
          <linearGradient id="walnut-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#4a3026"/>
            <stop offset="30%" stop-color="#3d251d"/>
            <stop offset="70%" stop-color="#2c1912"/>
            <stop offset="100%" stop-color="#1c0f0a"/>
          </linearGradient>

          <!-- Aluminum Chamfer Bevel Edge -->
          <linearGradient id="table-bevel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="45%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>

          <!-- Frosted Acoustic Cleanroom Glass -->
          <linearGradient id="cleanroom-frosted-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22"/>
            <stop offset="50%" stop-color="#0284c7" stop-opacity="0.10"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.30"/>
          </linearGradient>

          <!-- Executive Architectural Carpet Pattern -->
          <pattern id="executive-carpet-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <rect width="32" height="32" fill="#efeae1" stroke="#e2dbd0" stroke-width="1"/>
            <line x1="0" y1="16" x2="32" y2="16" stroke="#e7e1d6" stroke-width="0.6"/>
          </pattern>
        </defs>

        <!-- Floor Background -->
        <rect x="0" y="0" width="960" height="420" fill="url(#tokyo-floor)"/>
        <rect x="0" y="150" width="960" height="270" fill="url(#executive-carpet-grid)"/>

        <!-- ====================================================================== -->
        <!-- 1. Floor-to-Ceiling Skyline Windows (Y: 10 to 152)                     -->
        <!-- ====================================================================== -->
        <g id="skyline-window-wall">
          <!-- Sky Backdrop Inside Window Aperture -->
          <rect x="20" y="10" width="920" height="142" rx="4" fill="url(#tokyo-sunset-sky)"/>

          <!-- Distant Mt. Fuji Silhouette -->
          <polygon points="175,138 215,82 230,82 270,138" fill="#1e1b4b" opacity="0.6"/>
          <polygon points="212,82 222,74 233,82" fill="#fed7aa" opacity="0.4"/>

          <!-- Tokyo Skyscraper Cluster Silhouettes (Layer 1 - Dark Indigo) -->
          <rect x="40" y="85" width="35" height="65" fill="#151b2e" opacity="0.9"/>
          <rect x="85" y="65" width="45" height="85" fill="#121829" opacity="0.95"/>
          <rect x="140" y="90" width="30" height="60" fill="#1e2238" opacity="0.85"/>
          <rect x="275" y="70" width="38" height="80" fill="#121829" opacity="0.95"/>
          <rect x="365" y="80" width="48" height="70" fill="#171d33" opacity="0.9"/>
          <rect x="425" y="55" width="55" height="95" fill="#111624" opacity="0.95"/>
          <rect x="490" y="95" width="40" height="55" fill="#1a2035" opacity="0.85"/>
          <rect x="540" y="75" width="50" height="75" fill="#141a2c" opacity="0.92"/>
          <rect x="600" y="60" width="60" height="90" fill="#0f1422" opacity="0.95"/>
          <rect x="670" y="88" width="42" height="62" fill="#181f36" opacity="0.88"/>
          <rect x="725" y="68" width="52" height="82" fill="#121829" opacity="0.95"/>
          <rect x="790" y="82" width="40" height="68" fill="#151b2e" opacity="0.9"/>
          <rect x="840" y="58" width="48" height="92" fill="#0e1320" opacity="0.95"/>
          <rect x="898" y="92" width="35" height="58" fill="#1a2035" opacity="0.85"/>

          <!-- High-rise Illuminated Window Lights -->
          <g fill="#fef08a" opacity="0.75">
            <rect x="92" y="75" width="3" height="3"/><rect x="100" y="75" width="3" height="3"/><rect x="116" y="88" width="3" height="3"/>
            <rect x="435" y="68" width="3" height="3"/><rect x="445" y="68" width="3" height="3"/><rect x="455" y="80" width="3" height="3"/><rect x="465" y="92" width="3" height="3"/>
            <rect x="612" y="72" width="3.5" height="3.5"/><rect x="625" y="72" width="3.5" height="3.5"/><rect x="640" y="85" width="3.5" height="3.5"/><rect x="612" y="100" width="3.5" height="3.5"/>
            <rect x="735" y="78" width="3" height="3"/><rect x="748" y="78" width="3" height="3"/><rect x="758" y="95" width="3" height="3"/>
            <rect x="850" y="70" width="3.5" height="3.5"/><rect x="865" y="70" width="3.5" height="3.5"/><rect x="850" y="85" width="3.5" height="3.5"/><rect x="872" y="98" width="3.5" height="3.5"/>
          </g>

          <!-- Tokyo Tower Silhouette with Nocturnal Red/White Lattice Lighting -->
          <g id="tokyo-tower-silhouette" transform="translate(322, 28)">
            <!-- Tower Base Struts -->
            <path d="M4,122 L11,55 L17,55 L24,122 M11,55 L14,14 L17,55" fill="none" stroke="#ef4444" stroke-width="1.8"/>
            <path d="M7,100 L21,100 M9,80 L19,80 M12,62 L16,62" stroke="#ffffff" stroke-width="1.4"/>
            <!-- Main Observatory Deck (White Lit) -->
            <rect x="8" y="70" width="12" height="7" rx="1.5" fill="#ffffff" filter="drop-shadow(0 0 4px #ffffff)"/>
            <!-- Special Observatory Deck -->
            <rect x="11" y="44" width="6" height="4" rx="1" fill="#ffffff"/>
            <!-- Top Antenna Spire & Red Aviation Warning Beacon -->
            <line x1="14" y1="14" x2="14" y2="0" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="14" cy="0" r="2.5" fill="#ef4444" class="pulse-aura"/>
          </g>

          <!-- Architectural Heavy Charcoal Aluminum Window Mullions & Framing -->
          <line x1="20" y1="152" x2="940" y2="152" stroke="#334155" stroke-width="4"/>
          <line x1="20" y1="10" x2="940" y2="10" stroke="#1e293b" stroke-width="3"/>
          <rect x="20" y="10" width="12" height="142" fill="#1e293b" stroke="#334155" stroke-width="1"/>
          <rect x="248" y="10" width="12" height="142" fill="#1e293b" stroke="#334155" stroke-width="1"/>
          <rect x="478" y="10" width="12" height="142" fill="#1e293b" stroke="#334155" stroke-width="1"/>
          <rect x="708" y="10" width="12" height="142" fill="#1e293b" stroke="#334155" stroke-width="1"/>
          <rect x="928" y="10" width="12" height="142" fill="#1e293b" stroke="#334155" stroke-width="1"/>

          <!-- Glass Sheen Glare Lines -->
          <line x1="60" y1="20" x2="180" y2="140" stroke="#ffffff" stroke-width="1" stroke-opacity="0.12"/>
          <line x1="300" y1="20" x2="420" y2="140" stroke="#ffffff" stroke-width="1" stroke-opacity="0.08"/>
          <line x1="530" y1="20" x2="650" y2="140" stroke="#ffffff" stroke-width="1" stroke-opacity="0.10"/>
        </g>

        <!-- ====================================================================== -->
        <!-- 2. Left Wing: Thermal Packaging Cleanroom Lab (X: 30 to 220)          -->
        <!-- ====================================================================== -->
        <g id="cleanroom-bay" transform="translate(35, 145)">
          <!-- Lab Enclosure Wall -->
          <rect x="0" y="0" width="195" height="245" rx="8" fill="#0b111e" stroke="#1e293b" stroke-width="2"/>
          <!-- Soundproof Double-Glazed Observation Window -->
          <rect x="12" y="15" width="171" height="130" rx="6" fill="url(#cleanroom-frosted-glass)" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.7"/>
          
          <!-- Inside Cleanroom: Robotic Arm & Wafer Thermal Chamber -->
          <circle cx="65" cy="75" r="26" fill="#111827" stroke="#0ea5e9" stroke-width="2"/>
          <circle cx="65" cy="75" r="14" fill="#0284c7" fill-opacity="0.4"/>
          <!-- Articulated Precision Arm -->
          <line x1="65" y1="75" x2="115" y2="70" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="115" cy="70" r="5" fill="#facc15"/>
          <line x1="115" y1="70" x2="140" y2="90" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
          <!-- Heating / Cold Test Chamber -->
          <rect x="125" y="80" width="42" height="48" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
          <circle cx="146" cy="104" r="8" fill="#f59e0b" fill-opacity="0.8" class="pulse-aura"/>
          <!-- Status Telemetry on Observation Glass -->
          <rect x="18" y="158" width="159" height="68" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1"/>
          <text x="26" y="177" font-family="'SF Mono',monospace" font-size="9.5" fill="#38bdf8" font-weight="700">CHAMBER BAY-01</text>
          <text x="26" y="196" font-family="'SF Mono',monospace" font-size="9" fill="#94a3b8">TEMP: +85°C STABLE</text>
          <text x="26" y="214" font-family="'SF Mono',monospace" font-size="8.5" fill="#10b981">VACUUM: 99.98% OK</text>
        </g>

        <!-- ====================================================================== -->
        <!-- 3. Center: Executive Sleek Walnut Boardroom Table & 5 Mesh Chairs       -->
        <!-- ====================================================================== -->
        <g id="boardroom-table-center" transform="translate(240, 165)">
          <!-- Top Row: 3 Executive Ergonomic Mesh Chairs (North side of table) -->
          <!-- Chair 1 (Left North) -->
          <g transform="translate(60, 0)">
            <ellipse cx="20" cy="14" rx="16" ry="11" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <path d="M8,14 Q20,3 32,14" fill="none" stroke="#64748b" stroke-width="2"/>
            <line x1="20" y1="14" x2="20" y2="24" stroke="#94a3b8" stroke-width="3"/>
          </g>
          <!-- Chair 2 (Center North) -->
          <g transform="translate(195, -4)">
            <ellipse cx="20" cy="14" rx="16" ry="11" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <path d="M8,14 Q20,3 32,14" fill="none" stroke="#64748b" stroke-width="2"/>
            <line x1="20" y1="14" x2="20" y2="24" stroke="#94a3b8" stroke-width="3"/>
          </g>
          <!-- Chair 3 (Right North) -->
          <g transform="translate(330, 0)">
            <ellipse cx="20" cy="14" rx="16" ry="11" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <path d="M8,14 Q20,3 32,14" fill="none" stroke="#64748b" stroke-width="2"/>
            <line x1="20" y1="14" x2="20" y2="24" stroke="#94a3b8" stroke-width="3"/>
          </g>

          <!-- Boardroom Table Aluminum Chamfer Edge (Base Outline) -->
          <rect x="10" y="22" width="410" height="136" rx="34" fill="url(#table-bevel)" filter="drop-shadow(0 12px 28px rgba(0,0,0,0.65))"/>
          <!-- Rich Walnut Tabletop Surface -->
          <rect x="14" y="25" width="402" height="130" rx="31" fill="url(#walnut-surface)"/>

          <!-- Polished Wood Grain Surface Sheen Reflection -->
          <path d="M30,32 Q215,22 400,32 L390,70 Q215,55 40,70 Z" fill="#ffffff" opacity="0.04"/>

          <!-- Central Recessed Telepresence Connectivity Well -->
          <rect x="90" y="78" width="250" height="22" rx="5" fill="#171e29" stroke="#334155" stroke-width="1.2"/>
          <line x1="95" y1="89" x2="335" y2="89" stroke="#0ea5e9" stroke-width="1.5" stroke-opacity="0.4"/>

          <!-- Embedded Omni-Directional Boundary Microphones (Dual Pods) -->
          <circle cx="140" cy="89" r="6" fill="#1f2937" stroke="#38bdf8" stroke-width="1.5"/>
          <circle cx="140" cy="89" r="2.5" fill="#38bdf8" class="pulse-aura"/>
          <circle cx="290" cy="89" r="6" fill="#1f2937" stroke="#38bdf8" stroke-width="1.5"/>
          <circle cx="290" cy="89" r="2.5" fill="#38bdf8" class="pulse-aura"/>

          <!-- Executive Tabletop Props -->
          <!-- Modern Ultra-Slim Laptop 1 (Left) -->
          <g transform="translate(45, 52)">
            <polygon points="0,26 28,26 26,10 2,10" fill="#0f172a" stroke="#64748b" stroke-width="1"/>
            <polygon points="3,11 25,11 27,24 1,24" fill="#0284c7" opacity="0.45"/>
            <line x1="5" y1="16" x2="23" y2="16" stroke="#93c5fd" stroke-width="1"/>
          </g>
          <!-- Modern Ultra-Slim Tablet Stand 2 (Right) -->
          <g transform="translate(355, 52)">
            <polygon points="0,26 28,26 26,10 2,10" fill="#0f172a" stroke="#64748b" stroke-width="1"/>
            <polygon points="3,11 25,11 27,24 1,24" fill="#10b981" opacity="0.45"/>
            <line x1="5" y1="16" x2="23" y2="16" stroke="#a7f3d0" stroke-width="1"/>
          </g>

          <!-- Leather Meeting Portfolios with Brass Corners -->
          <rect x="180" y="44" width="26" height="18" rx="2" fill="#2d1e18" stroke="#ca8a04" stroke-width="0.8"/>
          <rect x="224" y="44" width="26" height="18" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="0.8"/>

          <!-- Crystal Clear Water Tumblers -->
          <circle cx="85" cy="118" r="4.5" fill="#bae6fd" fill-opacity="0.3" stroke="#e0f2fe" stroke-width="1"/>
          <circle cx="345" cy="118" r="4.5" fill="#bae6fd" fill-opacity="0.3" stroke="#e0f2fe" stroke-width="1"/>

          <!-- Bottom Row: 2 Executive Ergonomic Mesh Chairs (South/Flank) -->
          <!-- Chair 4 (South Left) -->
          <g transform="translate(75, 142)">
            <ellipse cx="20" cy="14" rx="16" ry="11" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <path d="M8,14 Q20,23 32,14" fill="none" stroke="#64748b" stroke-width="2"/>
          </g>
          <!-- Chair 5 (South Right) -->
          <g transform="translate(315, 142)">
            <ellipse cx="20" cy="14" rx="16" ry="11" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <path d="M8,14 Q20,23 32,14" fill="none" stroke="#64748b" stroke-width="2"/>
          </g>
        </g>

        <!-- ====================================================================== -->
        <!-- 4. Right Wing: 85" Telepresence Screen Wall (X: 685 to 925)            -->
        <!-- ====================================================================== -->
        <g id="telepresence-wall" transform="translate(685, 145)">
          <rect x="0" y="0" width="240" height="245" rx="8" fill="#111827" stroke="#1f2937" stroke-width="2"/>
          <!-- 85" Ultra-Thin Bezel Conference Monitor -->
          <rect x="14" y="15" width="212" height="120" rx="5" fill="#080d16" stroke="#475569" stroke-width="2"/>
          <rect x="20" y="21" width="200" height="108" rx="3" fill="#0c1929"/>
          
          <!-- Screen Telemetry & Microchip Graphic -->
          <text x="30" y="42" font-family="'SF Pro Display',sans-serif" font-size="10.5" fill="#38bdf8" font-weight="800" letter-spacing="1">PROJECT CHRONOS</text>
          <text x="30" y="58" font-family="'SF Mono',monospace" font-size="8" fill="#94a3b8">CROSS-PACIFIC R&amp;D LINK</text>
          <!-- Live Telemetry Waveform -->
          <path d="M30,95 L65,95 L75,75 L85,110 L95,85 L105,95 L145,95 L155,80 L165,95 L200,95" fill="none" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="105" cy="95" r="3" fill="#38bdf8" class="pulse-aura"/>
          <text x="30" y="118" font-family="'SF Mono',monospace" font-size="8.5" fill="#10b981">LATENCY: 12ms | SYNERGY: ACTIVE</text>

          <!-- Modern Executive Credenza / Audio-Bar Under Display -->
          <rect x="14" y="150" width="212" height="75" rx="4" fill="#1a120c" stroke="#3d251d" stroke-width="1.5"/>
          <rect x="24" y="160" width="192" height="12" rx="3" fill="#0f172a" stroke="#334155" stroke-width="1"/>
          <!-- Brass Handles -->
          <line x1="60" y1="195" x2="90" y2="195" stroke="#ca8a04" stroke-width="2"/>
          <line x1="140" y1="195" x2="170" y2="195" stroke="#ca8a04" stroke-width="2"/>
        </g>
      </svg>

      <!-- YEP_Event Mini Labels (Positioned on top of scene elements) -->
      <div class="mini-label-anchor" style="top: 24px; left: 160px;">
        ${renderMiniLabelHtml('🏢 東京精密研發本部 · 38F 董事會議廳', '🏢')}
      </div>
      <div class="mini-label-anchor" style="top: 135px; left: 130px;">
        ${renderMiniLabelHtml('🔬 封裝熱測潔淨實驗室', '🔬')}
      </div>
      <div class="mini-label-anchor" style="top: 165px; left: 450px;">
        ${renderMiniLabelHtml('💼 跨國併購核心談判長桌', '💼')}
      </div>

      <div class="scene-party-dock">
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

      <div class="scene-party-dock">
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

      <div class="scene-party-dock">
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

      <div class="scene-party-dock">
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
    roleTitle = '東京技術主管 · 高橋';
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
  title = '',
  dimension = '',
  location = '',
  context = '',
  dialogue = [],
  text = '',
  prompt = '',
  mood = 'normal',
  worldState = {},
  groups = [],
  chiefNavId = null
}) {
  const sceneHtml = renderRpgScene(roundIndex, worldState, groups);
  const bustHtml = renderCharacterBust(roundIndex, mood);
  const defaultSpeaker =
    roundIndex === 0
      ? '東京技術主管 · 高橋'
      : roundIndex === 1
      ? '杭州廠長 · 老陳'
      : roundIndex === 2
      ? '首席架構師 · 漢斯'
      : '荷蘭大客戶 · 范德堡';

  const finalSpeaker = speaker || defaultSpeaker;

  const cleanQuote = (str) => {
    if (!str) return '';
    let s = String(str).trim();
    s = s.replace(/^[「"“\s]+|[」"”\s]+$/g, '');
    return `「${s}」`;
  };

  const dialogueList = Array.isArray(dialogue) && dialogue.length > 0
    ? dialogue
    : (text ? [{ who: finalSpeaker, text }] : []);

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
              <!-- 1. 題目列 (Round + Dimension + Title) -->
              <div class="rpg-topic-bar">
                <div class="rpg-topic-tags">
                  <span class="rpg-round-pill">ROUND 0${roundIndex + 1}</span>
                  ${dimension ? `<span class="rpg-dimension-pill">${esc(dimension)}</span>` : ''}
                </div>
                <h2 class="rpg-topic-headline">${esc(title || '跨文化決策挑戰')}</h2>
              </div>

              <!-- 2. 情境背景 (Context) -->
              ${context ? `
                <div class="rpg-context-card">
                  <span class="context-badge">📖 決策情境</span>
                  <p class="context-desc">${esc(context)}</p>
                </div>
              ` : ''}

              <!-- 3. 現場對話串列 (Dialogue Stream) -->
              ${dialogueList.length > 0 ? `
                <div class="rpg-dialogue-stream">
                  ${dialogueList.map(d => `
                    <div class="rpg-dialogue-line">
                      <strong class="rpg-line-who">${esc(d.who)}：</strong>
                      <span class="rpg-line-speech">${esc(cleanQuote(d.text))}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- 4. 決策課題 (Dilemma Prompt) -->
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

// ----------------------------------------------------------------------------
// 6. Big Screen Persistent QR Code Join Dock (Stage Component)
// ----------------------------------------------------------------------------

export function renderQrJoinDock(joinUrl = '', studentCount = 0, onlineGroups = 0) {
  const displayUrl = joinUrl
    ? joinUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    : 'my00-rt-bf0f.vercel.app';
  const groupCount = Math.max(0, Math.min(5, Number(onlineGroups) || 0));

  return `
    <div class="qr-join-dock" role="region" aria-label="手機掃碼秒入席">
      <div class="qr-dock-preview">
        <div id="stage-qr-code" class="qr-dock-canvas" aria-label="加入 QR Code"></div>
      </div>
      <div class="qr-dock-meta">
        <div class="qr-dock-badge">
          <span class="qr-pulse-dot" aria-hidden="true"></span>
          <span class="qr-dock-title">📱 手機掃碼秒入席</span>
        </div>
        <div class="qr-dock-url" title="${esc(joinUrl || ('https://' + displayUrl))}">${esc(displayUrl)}</div>
        <div class="qr-dock-stats">
          <span class="qr-stat-pill">在線 <strong>${groupCount} / 5</strong> 組</span>
          <span class="qr-stat-pill"><strong>${Number(studentCount) || 0}</strong> 人參與</span>
        </div>
      </div>
    </div>
  `;
}
