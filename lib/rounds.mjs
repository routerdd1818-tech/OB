// Teaching simulation. Tension values are supplied course parameters, not empirical measurements.
// CQ deltas model trust damage and repair; see README for the designed teaching rubric.
export const rounds = [
  {
    dimension: '認知', english: 'COGNITIVE CQ', color: '#0071e3', location: '跨洋董事會 · 東京 × 矽谷', title: '同一個時程，\n不同的回應。',
    context: '併購後的第一次跨洋董事會，美方要求日本團隊承諾新製程的交付日期。東京端保持安靜，專案負責人最後只說：「這個時程，可能需要再研究一下。」距離客戶發表會，只剩三週。',
    dialogue: [{ who: '矽谷總部', text: '我們需要一個明確的日期。下週五，能交付嗎？' }, { who: '東京研發', text: '我們理解這件事的重要性……內部可能還需要再研究一下。' }],
    prompt: '你是整合專案負責人。下一步，如何推進這場對話？', baseline: 85, seconds: 180,
    juryRole: {
      title: '【公司方】東京研發團隊代表席',
      short: '公司方 · 東京團隊',
      counterpart: '矽谷總部決策小組',
      stance: '你們是日本在地的研發團隊（公司方）。面對總部在董事會逼交期，你們在乎技術真實性、職人尊嚴與高語境文化的「面子」。請聆聽各組（總部方）的說服，評定誰真正給予尊重與心理安全！',
      pitchTarget: '向第 5 組【公司方 · 東京研發團隊】申辯說服'
    },
    options: [
      { id: 'A', title: '里程碑量化確認', text: '於董事會會議中逐項檢視各製程進度百分比，請東京負責人當場給出確切的交付死線，以利向客戶同步。', tension: 90, angerDelta: 0, cq: 0, verdict: '防衛升級 · 公開逼問', analysis: '公開逼問死線踩中高語境「面子」禁忌，日方因無法在未完備時給出公開承諾而啟動被動防禦，現場張力飆升。', blindspot: '將委婉保留直接解讀為進度資訊不足，忽略了公開場合中的關係與面子風險。' },
      { id: 'B', title: '會後專案單獨照會', text: '會議中先將時程列為待確認事項，會後由負責人與日方代表個別通話，深入探討實質障礙並共同研擬向董事會呈報的方案。', tension: 35, angerDelta: 0, cq: 0, verdict: '心理安全 · 私下照會', analysis: '實踐高語境文化「根回し（Nemawashi）」，私下搭設心理安全階梯，在非公開場合促成真實資訊流動。', blindspot: '先建立可說真話的空間，再談公開承諾。私下協調是跨文化決策落地的重要實踐。' },
      { id: 'C', title: '基層第一線問卷調研', text: '針對東京第一線研發工程師發放不記名問卷，繞過層級直接蒐集對製程交付時程的真實估算數據。', tension: 75, angerDelta: 0, cq: 0, verdict: '位階焦慮 · 繞過層級', analysis: '雖然看似避開面子，但繞過主管破壞了日企傳統的和睦（Wa）與位階秩序，引發基層人際信任焦慮。', blindspot: '匿名不等於心理安全；繞過主管的表達管道仍可能讓工程師承擔關係壓力。' },
      { id: 'D', title: '指派資深技術顧問進駐', text: '立即指派總部資深技術顧問親赴東京辦公室現場，深入研發核心協助排解技術瓶頸並統籌交付排程。', tension: 92, angerDelta: 0, cq: 0, verdict: '信任受損 · 外部質疑', analysis: '美方視為「增援資源」，但日方視為「外部接管與能力質疑」，引發強烈防衛心理。', blindspot: '出發點是支援，對方接收到的卻可能是不被信任與專業遭否定。' }
    ]
  },
  {
    dimension: '動機', english: 'MOTIVATIONAL CQ', color: '#15803d', location: '晶圓挪用事件 · 信任修復', title: '被挪用的晶圓，\n被動搖的專業自尊。',
    context: '東京團隊發現，尚未通過品質驗證的晶圓被挪作對外展示。外界開始質疑研發品質，工程師認為自己的名字被放在一項未曾同意的承諾之下，拒絕繼續支援。',
    dialogue: [{ who: '東京工程師', text: '那些晶圓還沒有簽核。為什麼對外說是我們核准的？' }, { who: '整合主管', text: '客戶正在等下一批樣品。我們需要團隊重新投入。' }],
    prompt: '你需要修復合作意願。此刻，你會優先採取哪個行動？', baseline: 90, seconds: 180,
    juryRole: {
      title: '【總部方】矽谷高層決策席',
      short: '總部方 · 矽谷高層',
      counterpart: '在地危機協調小組',
      stance: '你們是矽谷總部高層（總部方）。面對晶圓挪用風波與日方工程師拒絕配合，你們在乎客戶樣品交付死線、市場信譽與合規責任。請聆聽各組（協調小組）的提案與說服，評定誰能在兼顧總部利益的同時真正修復團隊動機與自尊！',
      pitchTarget: '向第 5 組【總部方 · 矽谷高層決策席】申辯說服'
    },
    options: [
      { id: 'A', title: '啟動內部合規稽核程序', text: '啟動正式內部合規審查，要求相關研發團隊簽署專案保密協定並配合訪談，以建立制度化責任調查。', tension: 95, angerDelta: 0, cq: 0, verdict: '防衛升級 · 程序阻隔', analysis: '法律與合規程序先於承擔傷害，日方工程師感覺被當成潛在責任承擔者，損害基本動機與信任。', blindspot: '程序保護若先於承認傷害，可能被理解成對受害者的威脅與噤聲。' },
      { id: 'B', title: '提撥專案特別激勵津貼', text: '由總部特別提撥專案津貼與額外研發獎金，肯定團隊付出並激勵工程團隊全力趕製下一批驗證樣品。', tension: 75, angerDelta: 0, cq: 0, verdict: '名譽受挫 · 金錢陷阱', analysis: '名譽金錢化陷阱。對重視職人榮譽感的團隊而言，用金錢補償未授權挪用形同二次侮辱，踩中動機 CQ 最深層紅線。', blindspot: '動機不只來自報酬。專業聲譽、歸屬感與效能感可能比金錢更關鍵。' },
      { id: 'C', title: '簽發內部責任釐清專函', text: '由總部高層正式簽發組織內部說明函，公開澄清工程團隊未曾核准該批展示晶圓，並正式表彰其專業把關標準。', tension: 30, angerDelta: 0, cq: 0, verdict: '尊嚴修復 · 組織平反', analysis: '恢復名譽與自尊。用組織正式權威平反不實質疑，修復職人尊嚴與效能感，為重新協同奠定信任基石。', blindspot: '用組織認可的正式方式恢復名譽，讓團隊知道自己的專業判斷仍有份量。' },
      { id: 'D', title: '對外揭示責任並向主管機關備案', text: '在後續法說會與公開通訊中據實說明樣品挪用責任在於行政層級，並向主管單位備案以示合規清白。', tension: 100, angerDelta: 0, cq: 0, verdict: '衝突失控 · 公開究責', analysis: '雖看似極度透明，但公開擴大內部醜聞引發外界恐慌與法規調查，導致全產品線面臨停滯危機。', blindspot: '公開究責的強度若失去控制，可能讓修復合作的空間一併消失。' }
    ]
  },
  {
    dimension: '行為', english: 'BEHAVIORAL CQ', color: '#b45309', location: 'Slack 專案頻道 · 溝通重啟', title: '訊息越來越快，\n合作卻停了下來。',
    context: '量產異常尚未排除，矽谷主管在 Slack 頻道連續追問。東京團隊只回覆「收到」，之後不再更新。美方認為日方不透明，日方認為自己的技術判斷被公開否定。',
    dialogue: [{ who: '矽谷主管', text: '兩小時了，還沒有更新？請所有人即時回報。' }, { who: '東京工程師', text: '收到。我們正在確認。' }],
    prompt: '為了讓技術資訊重新流動，你會如何調整合作方式？', baseline: 95, seconds: 180,
    juryRole: {
      title: '【公司方】東京第一線研發工程團隊',
      short: '公司方 · 東京工程師',
      counterpart: '專案整合推動小組',
      stance: '你們是東京第一線研發工程團隊（公司方）。面對即時通訊中的公開追問與質疑，你們在乎技術專業是否受尊重、是否能免於公開審視的焦慮。請聆聽各組（推動小組）的說服，評定誰能打破層級壁壘、重建真正對等的技術信任！',
      pitchTarget: '向第 5 組【公司方 · 東京第一線工程團隊】申辯說服'
    },
    options: [
      { id: 'A', title: '建立去層級技術對等站會', text: '由兩地第一線架構師每日共同主持 15 分鐘對等短會，聚焦具體異常與驗證方法，溝通內容完全脫鉤個人績效考核。', tension: 40, angerDelta: 0, cq: 0, verdict: '對等協作 · 重構載體', analysis: '重構溝通載體與行為協定。將討論從公開審視的 Slack 轉為平等的工程同儕對話，有效降低防衛焦慮。', blindspot: '改變互動形式與權力距離，讓提出問題重新成為專業合作的一部分。' },
      { id: 'B', title: '行政備忘錄逐層回報體系', text: '發出行政督導備忘錄，要求東京各級主管依層級逐日整合進度，由部門主管統一窗口對總部回報。', tension: 95, angerDelta: 0, cq: 0, verdict: '官僚阻礙 · 下意上達', analysis: '加劇下意上達的「稟議制」摩擦，將現場主管置於夾縫之中，反而使即時技術資訊流動更加緩慢。', blindspot: '只加強由上而下的要求，可能堵住第一線提出異議與建立共識的路徑。' },
      { id: 'C', title: '跨文化非正式線上交流會', text: '暫停緊繃的即時文字交鋒，每週五安排輕鬆的跨文化線上茶會，促進兩地成員的生活交流與人際熟稔。', tension: 85, angerDelta: 0, cq: 0, verdict: '形式社交 · 錯位安撫', analysis: '形式主義的社交模仿。重大技術異常未排除前強推社交娛樂，顯得輕浮且未正視現場工程師承擔的龐大壓力。', blindspot: '關係活動需要配合時機；眼前的技術壓力若未被承認，善意也可能落空。' },
      { id: 'D', title: '導入工單系統雙小時密集更新', text: '要求兩地工程師全面改用 Jira 追蹤，設定每 2 小時更新一次工單子項目與進度細節，確保全域透明可視。', tension: 98, angerDelta: 0, cq: 0, verdict: '監視焦慮 · 消極怠工', analysis: '監視焦慮與消極怠工。過密的形式化追蹤只會換來制式應付，阻礙真實技術問題的主動提出。', blindspot: '更多可見的回報，不一定代表更多真實的問題資訊。' }
    ]
  },
  {
    dimension: '巔峰博弈', english: 'THE FINAL NEGOTIATION', color: '#7c3aed', location: '做空危機 · 三方協商', title: '一份提案，\n能否留住三方的明天？',
    context: '做空機構即將發布報告，指控產品品質與內部治理失序。總部要求立即對外澄清，東京工程師堅持先守住技術真相，客戶則要求可驗證的交付承諾。你們必須在一分鐘內形成三方皆能接受的變色龍提案。',
    dialogue: [{ who: '總部代表', text: '市場不會等。我們今天就需要一致的對外立場。' }, { who: '東京與客戶', text: '沒有可驗證的品質承諾，誰能承擔下一步？' }],
    prompt: '先提出方案，再由總部、東京與客戶三方表態。你們能達成協議嗎？', baseline: 98, seconds: 60,
    juryRole: {
      title: '【關鍵方】全球客戶與獨立董事審查席',
      short: '關鍵方 · 客戶與董事',
      counterpart: '跨國協商談判小組',
      stance: '你們是全球關鍵客戶與獨立董事審查席（關鍵方）。面對做空狙擊與誠信危機，你們要的是可驗證的交付承諾與透明治理，拒絕任何和稀泥的政治妥協。請審視各組的提案與說服，評定誰能實現兼顧三方尊嚴與利益的卓越共識！',
      pitchTarget: '向第 5 組【關鍵方 · 客戶與董事審查席】申辯說服'
    },
    options: [
      { id: 'A', title: '責任對半均攤聯合聲明', text: '總部與東京共同發布聯合聲明均攤責任，對外展現團結口徑，力求平息華爾街做空報告引起的短期動盪。', tension: 78, angerDelta: 0, cq: 0, verdict: '脆弱妥協 · 均攤責任', analysis: '和稀泥的政治妥協未釐清真相，無法滿足客戶對嚴格品質保證的要求，東京團隊士氣亦受重挫。', blindspot: '平均分配責任不等於公平；真相未被承認，合作基礎仍不穩固。' },
      { id: 'B', title: '雙軌戰略協定與聯名品質會', text: '總部與東京共同簽署技術說明函守住研發真相，同步成立客戶聯名的「旗艦品質委員會」，設定透明驗證里程碑直面做空報告。', tension: 33, angerDelta: 0, cq: 0, verdict: '雙軌協作 · 全面雙贏', analysis: '整合各方核心利益。總部取得對抗做空的有力工具，東京守住職人尊嚴，客戶獲得實質驗證管道，實現全維度雙贏。', blindspot: '將事實釐清與對外行動分為兩條同步軌道，讓各方核心需求都進入協議。' },
      { id: 'C', title: '獨立第三方全面審計凍結 60 天', text: '委任國際第三方獨立鑑識機構調查插單與品質流程，專案暫停出貨 60 天以等待完整審計報告。', tension: 73, angerDelta: 0, cq: 0, verdict: '錯失窗口 · 程序陷阱', analysis: '程序正義陷阱。錯失商務黃金期，客戶因合約違約直接轉單，專案遭受毀滅性商業損失。', blindspot: '程序完整仍需兼顧時間；調查與眼前的風險處理需要同步推進。' },
      { id: 'D', title: '總部統一發布立場並提供補償', text: '由總部全權發布統一對外立場，同時成立特別專案補償基金，對日方團隊與客戶後續造成的損失進行實質經濟補償。', tension: 83, angerDelta: 0, cq: 0, verdict: '信任崩解 · 利益收買', analysis: '利益補償替代話語權。企圖用資金平息專業質疑，引發核心工程師集體辭職抗議與客戶的不信任。', blindspot: '先奪走發言權再提供補償，可能讓利益安排被理解為收買。' }
    ],
    breakdown: { id: 'X', title: '談判破局', tension: 100, angerDelta: 0, cq: 0, verdict: '三方談判未達共識', analysis: '任一方拒絕提案：華爾街做空狙擊，東京集體辭職，協同體系瓦解。', blindspot: '提案內容之外，三方是否真正接受同樣重要。未形成共識，協議就無法執行。' }
  }
];

export const neutralTitles = [
  ['明確排程檢視', '個別照會商討', '基層匿名調研', '指派顧問進駐'],
  ['內部合規程序', '提撥激勵津貼', '責任釐清專函', '對外公開說明'],
  ['對等技術短會', '逐層督導體系', '非正式交流會', '密集工單追蹤'],
  ['聯合承擔聲明', '雙軌品質協作', '獨立審計暫停', '發布補償方案']
];

export function publicRound(index, options = false) {
  const { dimension, english, color, location, title, context, dialogue, prompt, baseline, seconds, juryRole } = rounds[index];
  return {
    dimension, english, color, location, title, context, dialogue, prompt, baseline, seconds, juryRole,
    ...(options ? { options: rounds[index].options.map(({ id, text }, i) => ({ id, title: neutralTitles[index][i], text })) } : {})
  };
}

export function outcome(index, vote) {
  if (!vote) return null;
  const round = rounds[index];
  const result = vote.choice === 'X' ? round.breakdown : round.options.find(o => o.id === vote.choice);
  return { ...result, baseline: round.baseline, reduction: round.baseline - result.tension };
}
