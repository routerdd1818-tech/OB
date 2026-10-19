// Teaching simulation. Tension values are supplied course parameters, not empirical measurements.
// CQ deltas model trust damage and repair; see README for the designed teaching rubric.
export const rounds = [
  {
    dimension: '認知', english: 'COGNITIVE CQ', color: '#0071e3', location: '跨洋董事會 · 東京 × 矽谷', title: '同一個時程，\n不同的回應。',
    context: '併購後的第一次跨洋董事會，美方要求日本團隊承諾新製程的交付日期。東京端保持安靜，專案負責人最後只說：「這個時程，可能需要再研究一下。」距離客戶發表會，只剩三週。',
    dialogue: [{ who: '矽谷總部', text: '我們需要一個明確的日期。下週五，能交付嗎？' }, { who: '東京研發', text: '我們理解這件事的重要性……內部可能還需要再研究一下。' }],
    prompt: '你是整合專案負責人。下一步，如何推進這場對話？', baseline: 85, seconds: 180,
    options: [
      { id: 'A', title: '進度量化逼問', text: '在董事會逐項確認進度百分比，請日方當場承諾明確交付死線。', tension: 90, cq: -15, verdict: '防衛升級', analysis: '公開逼問死線踩中高語境禁忌，讓未說出口的疑慮轉為防衛。', blindspot: '將委婉保留直接解讀為進度資訊不足，忽略了公開場合中的關係與面子風險。' },
      { id: 'B', title: '強派矽谷專家', text: '安排矽谷資深專家進駐東京，協助團隊排除障礙並接手進度協調。', tension: 92, cq: -20, verdict: '信任受損', analysis: '未經邀請進駐被視為審計接管與能力質疑。', blindspot: '出發點是支援，對方接收到的卻可能是不被信任與專業遭否定。' },
      { id: 'C', title: '基層不記名投票', text: '向第一線工程師發送匿名問卷，直接蒐集對交付日期的判斷。', tension: 75, cq: -10, verdict: '有限緩解', analysis: '雖取得部分資訊，卻破壞組織和睦（Wa），引發基層社交焦慮。', blindspot: '匿名不等於心理安全；繞過主管的表達管道仍可能讓工程師承擔關係壓力。' },
      { id: 'D', title: '會後個別電話溝通', text: '會後與日方負責人個別通話，釐清疑慮，再一起整理可向董事會提出的安排。', tension: 35, cq: 10, verdict: '心理安全建立', analysis: '實踐「根回し（Nemawashi）」，私下搭設心理安全階梯。', blindspot: '先建立可說真話的空間，再談公開承諾。私下協調可以是讓決策落地的必要工作。' }
    ]
  },
  {
    dimension: '動機', english: 'MOTIVATIONAL CQ', color: '#15803d', location: '晶圓挪用事件 · 信任修復', title: '被挪用的晶圓，\n被動搖的專業自尊。',
    context: '東京團隊發現，尚未通過品質驗證的晶圓被挪作對外展示。外界開始質疑研發品質，工程師認為自己的名字被放在一項未曾同意的承諾之下，拒絕繼續支援。',
    dialogue: [{ who: '東京工程師', text: '那些晶圓還沒有簽核。為什麼對外說是我們核准的？' }, { who: '整合主管', text: '客戶正在等下一批樣品。我們需要團隊重新投入。' }],
    prompt: '你需要修復合作意願。此刻，你會優先採取哪個行動？', baseline: 90, seconds: 180,
    options: [
      { id: 'A', title: '合規調查與保密協議', text: '啟動正式合規調查，要求相關工程師簽署保密協議並配合訪談。', tension: 95, cq: -15, verdict: '防衛升級', analysis: '法律霸凌，將受害工程師視為潛在犯罪嫌疑人。', blindspot: '程序保護若先於承認傷害，可能被理解成對受害者的威脅與噤聲。' },
      { id: 'B', title: '雙倍津貼激勵', text: '提供雙倍專案津貼與額外獎金，邀請工程師完成下一批樣品。', tension: 75, cq: -10, verdict: '有限緩解', analysis: '將名譽金錢化，對職人精神形成二次羞辱。', blindspot: '動機不只來自報酬。專業聲譽、歸屬感與效能感可能比金錢更關鍵。' },
      { id: 'C', title: '法說會公開索賠', text: '在法說會公開事件與責任歸屬，宣布向涉事單位追討損害。', tension: 100, cq: -25, verdict: '衝突失控', analysis: '玉石俱焚，引發主管機關調查與產品線無限期凍結。', blindspot: '公開究責的強度若失去控制，可能讓修復合作的空間一併消失。' },
      { id: 'D', title: '內部責任專函肯定', text: '正式發出內部責任說明專函，澄清工程師未曾核准，肯定團隊的專業標準。', tension: 30, cq: 10, verdict: '專業尊嚴修復', analysis: '正式出函洗刷冤屈，守住群體自尊與效能感。', blindspot: '用組織認可的正式方式恢復名譽，讓團隊知道自己的專業判斷仍有份量。' }
    ]
  },
  {
    dimension: '行為', english: 'BEHAVIORAL CQ', color: '#b45309', location: 'Slack 專案頻道 · 溝通重啟', title: '訊息越來越快，\n合作卻停了下來。',
    context: '量產異常尚未排除，矽谷主管在 Slack 頻道連續追問。東京團隊只回覆「收到」，之後不再更新。美方認為日方不透明，日方認為自己的技術判斷被公開否定。',
    dialogue: [{ who: '矽谷主管', text: '兩小時了，還沒有更新？請所有人即時回報。' }, { who: '東京工程師', text: '收到。我們正在確認。' }],
    prompt: '為了讓技術資訊重新流動，你會如何調整合作方式？', baseline: 95, seconds: 180,
    options: [
      { id: 'A', title: 'Jira 每 2 小時監控', text: '要求每兩小時更新 Jira，讓主管能即時追蹤每一項任務與負責人。', tension: 98, cq: -20, verdict: '監視焦慮升高', analysis: '監視焦慮促發形式合規與消極怠工；張力進一步升至 98%。', blindspot: '更多可見的回報，不一定代表更多真實的問題資訊。' },
      { id: 'B', title: '行政備忘錄層級督導', text: '發出行政備忘錄，要求日方各級主管逐層督導並統一對外回報。', tension: 95, cq: -15, verdict: '張力持平', analysis: '破壞下意上達「稟議制」，陷現場主管於夾縫。', blindspot: '只加強由上而下的要求，可能堵住第一線提出異議與建立共識的路徑。' },
      { id: 'C', title: '跨文化線上茶會', text: '安排輕鬆的線上茶會，讓兩地同事交流生活、重新熟悉彼此。', tension: 85, cq: -10, verdict: '有限緩解', analysis: '重大危機時強推娛樂，被視為輕浮不專業。', blindspot: '關係活動需要配合時機；眼前的技術壓力若未被承認，善意也可能落空。' },
      { id: 'D', title: '去層級技術對等站會', text: '由兩地工程師共同主持短站會，聚焦異常與驗證方法，討論內容不納入個人考核。', tension: 40, cq: 10, verdict: '對等協作恢復', analysis: '脫鉤考核，同儕探討回歸技術本質。', blindspot: '改變互動形式與權力距離，讓提出問題重新成為專業合作的一部分。' }
    ]
  },
  {
    dimension: '巔峰博弈', english: 'THE FINAL NEGOTIATION', color: '#7c3aed', location: '做空危機 · 三方協商', title: '一份提案，\n能否留住三方的明天？',
    context: '做空機構即將發布報告，指控產品品質與內部治理失序。總部要求立即對外澄清，東京工程師堅持先守住技術真相，客戶則要求可驗證的交付承諾。你們必須在一分鐘內形成三方皆能接受的變色龍提案。',
    dialogue: [{ who: '總部代表', text: '市場不會等。我們今天就需要一致的對外立場。' }, { who: '東京與客戶', text: '沒有可驗證的品質承諾，誰能承擔下一步？' }],
    prompt: '先提出方案，再由總部、東京與客戶三方表態。你們能達成協議嗎？', baseline: 98, seconds: 60,
    options: [
      { id: 'A', title: '責任對半均攤', text: '總部與日方共同承擔各半責任，以聯合聲明盡快結束爭議。', tension: 78, cq: -10, verdict: '脆弱妥協', analysis: '和稀泥妥協未清查真相，日方士氣潰散且評級遭降。', blindspot: '平均分配責任不等於公平；真相未被承認，合作基礎仍不穩固。' },
      { id: 'B', title: '總部發布並事後補償', text: '由總部先發布統一說明，之後以資源與補償處理日方的損失。', tension: 83, cq: -15, verdict: '信任持續流失', analysis: '收買侮辱引發核心工程師相繼辭職。', blindspot: '先奪走發言權再提供補償，可能讓利益安排被理解為收買。' },
      { id: 'C', title: '獨立審計凍結 60 天', text: '交由獨立第三方調查，暫停產品相關決策與出貨六十天。', tension: 73, cq: -10, verdict: '錯失回應窗口', analysis: '程序拖延錯失黃金期，客戶取消大單造成巨額索賠。', blindspot: '程序完整仍需兼顧時間；調查與眼前的風險處理需要同步推進。' },
      { id: 'D', title: '雙軌協定', text: '共同簽署技術說明函，同步成立聯名旗艦品質會，安排可驗證的改善與對外說明。', tension: 33, cq: 15, verdict: '雙贏解鎖', analysis: '對內守住真相與職人自尊，對外聯名共組品質會抵禦做空。', blindspot: '將事實釐清與對外行動分為兩條同步軌道，讓各方核心需求都進入協議。' }
    ],
    breakdown: { id: 'X', title: '談判破局', tension: 100, cq: -25, verdict: '協同體系瓦解', analysis: '任一方拒絕提案：華爾街做空狙擊，東京集體辭職，協同體系瓦解。', blindspot: '提案內容之外，三方是否真正接受同樣重要。未形成共識，協議就無法執行。' }
  }
];
const neutralTitles = [
  ['董事會確認交期','派駐技術專家','匿名蒐集評估','會後個別協調'],
  ['啟動合規調查','提高專案津貼','公開說明與索賠','發出責任說明函'],
  ['定時更新進度','逐層督導回報','安排交流茶會','建立工程師站會'],
  ['共同承擔責任','先發布後補償','暫停並獨立審計','同步說明與品質協作']
];
export function publicRound(index, options = false) {
  const { dimension, english, color, location, title, context, dialogue, prompt, baseline, seconds } = rounds[index];
  return { dimension, english, color, location, title, context, dialogue, prompt, baseline, seconds,
    ...(options ? { options: rounds[index].options.map(({id,text},i) => ({id,title:neutralTitles[index][i],text})) } : {}) };
}
export function outcome(index, vote) {
  if (!vote) return null;
  const round = rounds[index];
  const result = vote.choice === 'X' ? round.breakdown : round.options.find(o => o.id === vote.choice);
  return { ...result, baseline: round.baseline, reduction: round.baseline - result.tension };
}
