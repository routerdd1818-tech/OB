// Teaching simulation based on HBR "Being the Boss" & Erin Meyer's Leadership Culture Matrix.
// Tension values are course parameters matching the validated test matrix.
// CQ deltas model trust damage and repair across global leadership cultures.

export const rounds = [
  {
    dimension: '權威與共識', english: 'AUTHORITY & CONSENSUS', color: '#0071e3',
    location: 'Act 1 · 東京併購首戰（波士頓總部 × 東京研發）',
    title: '同一個時程，\n不同的回應。',
    context: '波士頓科技巨頭 Apex 剛併購日本東京精密大廠，距離全球發表會僅剩三週。美籍整合主管習慣美式「扁平開放、當場拍板」，帶著簡報飛抵東京主持跨洋董事會，要求日方總工程師高橋當場承諾新製程交付日。沒想到東京團隊全場沉默，高橋最後只委婉表示：「這個時程，內部可能還需要再研究一下。」',
    dialogue: [
      { who: '波士頓總部', text: '我們開會鼓勵暢所欲言，但今天結束前需要拍板明確日期。下週五能交出最終驗證晶圓嗎？' },
      { who: '東京高橋總工程師', text: '我們明白事情的重要性……但目前製程參數牽涉多個部門，內部可能還需要再研究一下。' }
    ],
    prompt: '面對「階層嚴明卻採全員共識制（Consensual & Hierarchical）」的日本團隊，身為跨國主管的你該如何推進決策？',
    baseline: 85, seconds: 180,
    juryRole: {
      title: '【公司方】東京研發團隊代表席',
      short: '公司方 · 東京團隊',
      counterpart: '波士頓總部決策小組',
      stance: '你們是日本在地的研發團隊（公司方）。面對美方主管在正式會議逼迫當場拍板，你們在乎「會前根回摸底」與「由下而上稟議簽核」的共識程序，反對未經全員充分驗證的草率承諾。請聆聽各組申辯，評定誰真正理解共識×階層的運作法則！',
      pitchTarget: '向第 5 組【公司方 · 東京研發團隊】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '美式由上而下當場拍板',
        shortTitle: '當場拍板',
        text: '展現美式決斷力，在會議中逐項檢視進度並由主管當場拍板下週五為最終死線，要求東京團隊會後全力配合執行。',
        tension: 90,
        cq: -25,
        verdict: '維度錯置 · 誤把階層當獨斷',
        analysis: '犯了 HBR 所指出的「維度混淆」錯誤：以為日本重階層就該由主管獨斷拍板。在日本「階層×共識」文化中，未經會前摸底便在正式會議強行定案，會被視為極度專斷跋扈，導致日方表面順從、實則抗拒。',
        blindspot: '在日本，正式會議是用來「蓋章確認已達成的共識」，而非當場辯論拍板的地方。',
        quadrant: { x: 28, y: 32, zone: '由上而下 × 平等區' }
      },
      {
        id: 'B',
        title: '啟動會前「根回」與稟議共識',
        shortTitle: '會前根回',
        text: '宣布今日會議僅先對齊目標；會後安排對等工程窗口與東京各課長進行一對一私下摸底（根回），協助完成由下而上的「稟議」簽核後，再召開正式會議定案。',
        tension: 35,
        cq: 20,
        verdict: '精準調適 · 根回與稟議大 D',
        analysis: '完全契合 HBR「共識×階層（日本）」生存法則！透過會前非正式的一對一摸底（根回）排除技術隱憂，並尊重日方由下而上逐級簽核的「稟議」制度，雖然前期耗時，但一旦定案即形成不可動搖的「大 D」承諾，後端執行極速！',
        blindspot: '想在共識型階層文化推動改變，關鍵不在會議桌上的口才，而在進會議室前的私下校準。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'C',
        title: '北歐式扁平越級公開表決',
        shortTitle: '越級直詢',
        text: '認為高橋態度保守，當場跳過高橋直接點名東京年輕工程師發表真實意見，並提議全場舉手表決是否能如期交付。',
        tension: 75,
        cq: -15,
        verdict: '階層踩雷 · 摧毀領導威信',
        analysis: '將北歐「共識×平等」的扁平表決硬套在日本「共識×階層」團隊上。公開越級點名不僅讓日本基層工程師陷入不敢違逆長官的恐慌，更當眾羞辱高橋的職級尊嚴，導致跨國信任瞬間結冰。',
        blindspot: '在階層制文化中，越過主管直接向部屬索取公開承諾，等於逼部屬在全場面前背叛長官。',
        quadrant: { x: 28, y: 70, zone: '共識 × 平等區' }
      },
      {
        id: 'D',
        title: '動用總部最高職權下達軍令',
        shortTitle: '高層施壓',
        text: '搬出併購母公司執行長授權，聲明時程已對華爾街公布絕不更改，若東京無法當場承諾將直接撤換專案負責人。',
        tension: 92,
        cq: -30,
        verdict: '權威濫用 · 引發集體防衛',
        analysis: '誤用 Linda Hill 所警告的「職位權威迷思」。單靠正式職權壓制日本團隊的專業稟議流程，會徹底摧毀「品格與動機信任」，讓東京團隊轉入消極怠工。',
        blindspot: '正式職權只能買到表面的服從，買不到高語境職人團隊真正的技術投入。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      }
    ]
  },
  {
    dimension: '賦權與指導', english: 'EMPOWERMENT VS DIRECTION', color: '#15803d',
    location: 'Act 2 · 杭州量產危機（波士頓賦權教條 × 杭州合資廠）',
    title: '被誤解的賦權，\n停擺的合資產線。',
    context: '東京製程透過「根回」敲定後，立即移交中國杭州合資廠進行試產。負責督導的波士頓主管照搬美式「扁平化賦權（Empowerment）」管理教條，在週會上只丟出良率目標，便要求杭州團隊「主動腦力激盪、自己決定改進方案」。結果整整一週無人提案、良率異常無人敢通報，中方幹部更私下痛批美方主管「既無能又傲慢」。',
    dialogue: [
      { who: '波士頓駐廠主管', text: '我特地把權力下放給大家自由發揮，為什麼開會沒人提想法，連產線出問題都不主動回報？' },
      { who: '杭州合資廠工程幹部', text: '主管開會前自己都沒準備好完整計畫與明確標準，卻把問題丟給下屬，這不是無能與推卸責任嗎？' }
    ],
    prompt: '面對「由上而下×階層制（Top-Down & Hierarchical）」的杭州團隊，你該如何化解「美式賦權變無能」的危機並重啟產線？',
    baseline: 90, seconds: 180,
    juryRole: {
      title: '【總部方】矽谷高層決策席',
      short: '總部方 · 矽谷高層',
      counterpart: '杭州現場協調小組',
      stance: '你們是總部資深營運審查席（總部方）。面對杭州量產危機與中方針鋒相對的「無能」批評，你們在乎交付進度與品質標準，也深知階層文化中「導演型領導」與「心理安全」的必要性。請評定誰能真正打破沉默、重建量產秩序！',
      pitchTarget: '向第 5 組【總部方 · 矽谷高層決策席】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '推行美式 360 度互評與自主搶單',
        shortTitle: '強制360度',
        text: '堅持西方扁平化管理正統，取消所有層級審批並強制推行 360 度匿名互評，要求工程師在公開看板自行認領良率問題。',
        tension: 95,
        cq: -25,
        verdict: '教條僵化 · 角色期望崩盤',
        analysis: '正如 HBR「Chill Factor 杭州案」所示，將西方「去階層化」教條硬塞進高度階層文化，會造成嚴重角色混亂。員工認為主管不給方向就是失職，強制自主搶單只會讓全廠陷入觀望與癱瘓。',
        blindspot: '在「由上而下×階層制」文化中，好主管的定義是「準備周全的導演」，而非「放手不管的促進者」。',
        quadrant: { x: 28, y: 32, zone: '由上而下 × 平等區' }
      },
      {
        id: 'B',
        title: '嚴懲隱瞞不報並下達連坐罰則',
        shortTitle: '高壓問責',
        text: '召開全廠訓話大會，痛批中方團隊缺乏主動精神，宣布今後凡未在第一時間回報良率異常者一律扣發季度獎金。',
        tension: 75,
        cq: -15,
        verdict: '恐懼升級 · 報喜不報憂',
        analysis: '在階層嚴明的環境中，下屬原本就因害怕「讓領導沒面子或受罰」而不敢回報壞消息。高壓連坐只會強化防衛心理，導致基層徹底掩蓋產線真實數據。',
        blindspot: '階層文化中的沉默往往源於對權威的敬畏與自保，懲罰沉默只會製造更精密的隱瞞。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      },
      {
        id: 'C',
        title: '展現導演型具體規劃並設計安全回報機制',
        shortTitle: '導演領航',
        text: '先由主管提出完整周密的試產計畫、明確標準與階段檢核點以立威信；同時改採「會前書面提問」與「小組無主管討論後統一彙報」，讓基層能安全反映產線真相。',
        tension: 30,
        cq: 20,
        verdict: '雙向調適 · 導演威信與心理安全',
        analysis: '完美運用 HBR 對「由上而下×階層制」的雙軌解方！一方面滿足中方團隊對主管「事先準備周全、指令具體明確（Director）」的專業期待；另一方面透過會前書面與無主管小組討論，成功繞過階層敬畏，讓真實問題浮現！',
        blindspot: '先給出清晰的結構與指導方針建立主管威信，再創造安全的發言管道，才能在階層文化中激發主動性。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'D',
        title: '全面改派波士頓工程師接管產線',
        shortTitle: '撤換骨幹',
        text: '認定杭州團隊無法適應現代化賦權管理，直接凍結當地幹部權限，由波士頓總部空降工程師全面接管試產指揮。',
        tension: 100,
        cq: -35,
        verdict: '文化傲慢 · 合資徹底決裂',
        analysis: '把跨文化管理維度的差異歸咎於當地員工素質，不僅印證了中方對美方「傲慢」的指控，更直接引發合資夥伴集體罷工抗議。',
        blindspot: '當一套管理方法在異地失靈時，該修正的是領導者的文化雷達，而非怪罪當地的土壤。',
        quadrant: { x: 28, y: 70, zone: '共識 × 平等區' }
      }
    ]
  },
  {
    dimension: '大D與小d', english: 'BIG D VS SMALL d', color: '#b45309',
    location: 'Act 3 · 慕尼黑系統整合（美式小 d 靈活迭代 × 德日大 D 鐵律承諾）',
    title: '說好的規格，\n怎麼說改就改？',
    context: '杭州試產重回正軌，距發表會剩最後 7 天。波士頓主管為順應北美客戶新回饋，在未重新協商下，單方面將上週才與德國慕尼黑、日本東京共同敲定的「核心介面規格」翻案微調，並在 80 人跨國頻道宣布：「上週只是暫定小決定（Small d），今天起改走新規格！」德國與東京團隊深感遭背叛，痛批美方「雙面人、毫無誠信」，跨國協作瞬間停擺。',
    dialogue: [
      { who: '波士頓產品總監', text: '市場瞬息萬變，決策本來就是暫定路標（Small d），有新數據當然要立刻轉彎，為什麼德日團隊反應這麼激烈？' },
      { who: '德國慕尼黑與東京代表', text: '我們花了好幾週凝聚共識才敲定這項決策（Big D），你們說改就改、出爾反爾，叫我們如何信任總部的承諾？' }
    ],
    prompt: '面對美式「小 d（靈活暫定）」與德日「大 D（神聖承諾）」的決策認知撞擊，你該如何在最後七天修復信任並推進整合？',
    baseline: 95, seconds: 180,
    juryRole: {
      title: '【公司方】東京第一線研發工程團隊',
      short: '公司方 · 東京工程師',
      counterpart: '跨國整合推進小組',
      stance: '你們是東京與慕尼黑的第一線研發骨幹（公司方）。在德日文化中，決策一旦拍板就是神聖不可侵犯的「大 D」，隨意翻案等同摧毀品質誠信與工程自尊。請聆聽各組申辯，評定誰能真正給出制度化承諾、修復跨國信任！',
      pitchTarget: '向第 5 組【公司方 · 東京第一線工程團隊】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '將決策流程明文化並確立「大D/小d」分級協定',
        shortTitle: '大小D分級',
        text: '立即召開跨國核心代表短會，坦承未事先說明決策性質的疏失；與德、日共同制定「決策明文化協定」——主架構鎖定為不可任意翻案的「大 D 承諾」，僅將外圍參數列為可快速迭代的「小 d 實驗」並經對等窗口簽核。',
        tension: 40,
        cq: 20,
        verdict: '流程明文化 · 化解雙面人誤解',
        analysis: '精準實踐 HBR 的黃金解方：「將決策流程完全明文化（Be explicit about the process）」！透過建立全團隊共享的「大 D / 小 d」語彙與變更邊界，讓德日團隊安心守住核心品質承諾，同時保留美方所需的局部敏捷度。',
        blindspot: '跨國團隊最怕的不是改變本身，而是「一方以為已經定案（Big D），另一方卻以為只是草稿（Small d）」。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'B',
        title: '強制全體改採美式每日敏捷翻案機制',
        shortTitle: '強推敏捷',
        text: '在大群組向德日團隊上課，強調矽谷敏捷精神就是「沒有任何決定是最終決定」，要求各國無條件配合每日規格滾動修正。',
        tension: 95,
        cq: -25,
        verdict: '文化霸權 · 承諾體系崩潰',
        analysis: '忽視德國與日本精密工業仰賴「大 D 決策（前期嚴密驗證、後端零誤差執行）」的成功根基。強推無邊界的每日翻案，等同摧毀德日工程師的品質防線，引發技術骨幹集體抵制。',
        blindspot: '把本國的「小 d」習慣當成唯一先進標準，會讓重視「大 D」承諾的夥伴徹底喪失安全感。',
        quadrant: { x: 32, y: 26, zone: '由上而下 × 平等區' }
      },
      {
        id: 'C',
        title: '表面答應不改卻暗中要求杭州廠偷改參數',
        shortTitle: '私下妥協',
        text: '為安撫德國與東京情緒，在公開頻道宣布維持原規格，私下卻指示杭州合資廠在量產韌體中偷偷寫入美方的新規格。',
        tension: 85,
        cq: -15,
        verdict: '誠信破產 · 坐實雙面人指控',
        analysis: '違背 Linda Hill「管理自己（Manage Yourself）」中最核心的「品格與動機信任（Trust in Character）」。一旦德日團隊在最終聯測發現韌體遭暗中竄改，跨國協作將永久破裂。',
        blindspot: '迴避正面溝通而採取暗箱操作，只會把原本的「文化誤解」變成無法挽回的「道德背叛」。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      },
      {
        id: 'D',
        title: '關閉跨國討論頻道並由總部單向發布指令',
        shortTitle: '凍結溝通',
        text: '認為跨國共識討論太浪費時間，直接將 80 人頻道設為禁言，宣布最後七天所有規格由波士頓總部單向發布、各國照單執行。',
        tension: 98,
        cq: -30,
        verdict: '獨斷封鎖 · 跨國網絡斷鏈',
        analysis: '在「共識型」團隊眼中，剝奪發言與校準管道無異於宣戰。各國據點將拒絕為最終產品的相容性負責，導致全球發表會面臨系統癱瘓風險。',
        blindspot: '省下前期對齊共識的時間，往往要在後端付出十倍的返工與拆台代價。',
        quadrant: { x: 24, y: 42, zone: '由上而下 × 平等區' }
      }
    ]
  },
  {
    dimension: '四象限調適', english: 'DYNAMIC ADAPTATION', color: '#7c3aed',
    location: 'Act 4 · 布魯塞爾全球發表前夕（四大領導象限三方終極對決）',
    title: '跨越四大象限，\n尋找唯一的共治交集。',
    context: '全球發表會前夕最後 24 小時，三方齊聚布魯塞爾卻因一批極端溫測數據陷入僵局：波士頓總部（由上而下×平等，小 d 速決派）要求立刻拍板如期上市、邊賣邊更新；東京與慕尼黑研發代表（共識×階層，大 D 根回派）堅持必須先完成內部稟議與技術邊界簽核；荷蘭鹿特丹歐洲最大客戶（共識×平等，北歐促進者派）則反對任何高層獨斷，要求三方平起平坐、公開透明達成一致共識。',
    dialogue: [
      { who: '波士頓總部代表', text: '距離發表只剩 24 小時，我們必須立刻由高層拍板（Top-down）如期發布，後續再用小 d 軟體更新微調！' },
      { who: '東京研發與荷蘭客戶代表', text: '沒有經稟議確認的「大 D」品質承諾與全員平等透明的共識（Consensual），誰敢為明天的全球首發背書？' }
    ],
    prompt: '面對橫跨「全球四大領導文化象限」的三方代表，你們必須在 60 秒內提出方案並取得波士頓總部、東京/慕尼黑研發、荷蘭客戶三方一致同意（任一方拒絕即破局）！',
    baseline: 98, seconds: 60,
    juryRole: {
      title: '【關鍵方】全球客戶與獨立董事審查席',
      short: '關鍵方 · 客戶與董事',
      counterpart: '跨國危機協商小組',
      stance: '你們是荷蘭大客戶與獨立董事審查席（關鍵方）。你們身處「共識×平等」與治理最高峰，痛恨黑箱欺瞞或單方專斷，要的是兼顧品質安全與商務時效的具體多方協定。請審核各組提案，評定誰展現了真正的動態領導調適！',
      pitchTarget: '向第 5 組【關鍵方 · 客戶與董事審查席】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '發布模糊公關稿掩蓋溫測差異',
        shortTitle: '模糊公關',
        text: '提議先對外發布圓滑模糊的公關聲明宣稱一切完美，把技術爭議留到發表會後再私下慢慢喬。',
        tension: 78,
        cq: -20,
        verdict: '迴避實質 · 大D與平等派雙雙否決',
        analysis: '既違反德日團隊對「大 D 技術真實性」的職人工匠底線，也觸怒荷蘭「共識×平等」客戶對公開透明的要求，無法建立實質當責。',
        blindspot: '在跨文化高壓危機中，試圖用公關辭令討好所有人，最終只會讓所有象限的夥伴同時失去信任。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      },
      {
        id: 'B',
        title: '大D技術邊界簽核 ＋ 荷蘭式透明共識審查 ＋ 小d分階段交付',
        shortTitle: '四象限共治',
        text: '實踐 HBR「動態文化調適」：1. 尊重東京/慕尼黑「共識×階層」完成常溫批次之大 D 稟議簽核；2. 邀請荷蘭客戶以「共識×平等」促進者模式共同透明審閱數據；3. 配合波士頓總部以「小 d」敏捷節奏於 14 天內迭代極端溫區韌體。',
        tension: 33,
        cq: 20,
        verdict: '動態調適 · 四大象限完美整合',
        analysis: '完美融合 Erin Meyer 四大領導象限與 Linda Hill 三大要務！同時滿足日德對「大 D 承諾與階層稟議」的堅持、荷蘭對「平等透明共識」的重視、以及美國總部對「小 d 速度與市場推進」的需求，締造三贏局面！',
        blindspot: '卓越的全球領導者從不固守單一管理教條，而是能依對手所在的文化象限，靈活切換領導語言與決策機制。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'C',
        title: '宣布全球發表會無限期延後直至零瑕疵',
        shortTitle: '延後發表',
        text: '完全倒向保守派，宣布取消明日布魯塞爾全球發表會，待所有跨國團隊重新走完三個月稟議流程後再行上市。',
        tension: 73,
        cq: -20,
        verdict: '錯失商機 · 總部與市場重創',
        analysis: '過度順從「大 D」的前期漫長磨合，卻完全忽視「小 d」商業速度與資本市場承諾，導致波士頓總部與客戶雙雙蒙受巨大損失。',
        blindspot: '跨文化調適不是無底線放棄商業時效，而是在速度（小 d）與承諾（大 D）之間設計可運作的橋樑。',
        quadrant: { x: 28, y: 70, zone: '共識 × 平等區' }
      },
      {
        id: 'D',
        title: '由波士頓執行長獨斷下令強行全量出貨',
        shortTitle: '強行出貨',
        text: '動用波士頓總部最終否決權，無視東京研發與荷蘭客戶異議，下令明天全線強行出貨並以折扣補償客戶。',
        tension: 83,
        cq: -30,
        verdict: '獨斷破局 · 荷蘭與東京聯合抵制',
        analysis: '以美式「由上而下」霸權同時踐踏「共識×平等（荷蘭）」與「共識×階層（日本）」的核心底線，引發客戶當場退單與研發團隊拒絕背書。',
        blindspot: '在共識型文化夥伴面前強行推動獨斷決策，省下了一小時的爭論，卻會賠上整個跨國聯盟。',
        quadrant: { x: 28, y: 36, zone: '由上而下 × 平等區' }
      }
    ],
    breakdown: {
      id: 'X',
      title: '談判破局',
      shortTitle: '談判破局',
      tension: 100,
      cq: -50,
      verdict: '跨文化協商破裂 · 聯盟瓦解',
      analysis: '任一方拒絕提案：東京與慕尼黑團隊拒絕背書，荷蘭客戶撤回訂單，波士頓總部全球發表會慘遭重創。',
      blindspot: '跨文化領導最忌盲目套用本國經驗；缺乏對彼此文化決策模式的尊重，再完美的技術與商機也無法落地。',
      quadrant: { x: 24, y: 22, zone: '協商破裂區' }
    }
  }
];

export const neutralTitles = [
  ['當場拍板死線', '啟動根回摸底', '扁平越級表決', '動用職權施壓'],
  ['強制自主搶單', '嚴懲連坐罰則', '導演計畫領航', '空降接管產線'],
  ['大小D分級協定', '強制敏捷翻案', '私下偷改參數', '封鎖討論頻道'],
  ['模糊公關聲明', '四象限動態共治', '延後發表流程', '高層強行出貨']
];

export function computeCascade(roundIndex, prevVote) {
  if (!roundIndex || roundIndex < 1 || !prevVote || !prevVote.choice) return null;
  const c = prevVote.choice;
  if (roundIndex === 1) {
    if (c === 'B') {
      return {
        type: 'buff',
        badge: '信任加持',
        title: '因果連鎖：會前「根回」奏效（東京稟議過關）',
        effectText: '東京工程師感念上回合尊重日本「共識×階層」決策程序，私下向本組透露杭州廠情資！',
        hint: '【提前解鎖第 5 組情報】杭州合資廠屬於 HBR「由上而下×階層制」文化，切勿照搬美式扁平賦權；唯有「展現導演型具體計畫 + 安全回報機制（方案 C）」能化解無能與傲慢的誤解。',
        timePenalty: 0
      };
    }
    if (c === 'A') {
      return {
        type: 'penalty',
        badge: '日方心防緊閉 (-30s)',
        title: '因果連鎖：日方心防緊閉（上回合公開逼問死線）',
        effectText: '因上回合於董事會強推當場拍板，踩中「階層×共識」大忌，東京團隊啟動防衛，本組研討時間縮短 30 秒！',
        hint: null,
        timePenalty: 30
      };
    }
    return {
      type: 'penalty',
      badge: '跨國戒心升高 (-30s)',
      title: '因果連鎖：跨國戒心升高（上回合引發位階與越級焦慮）',
      effectText: '上回合越級或高壓施壓破壞了稟議秩序，溝通阻力劇增，本組研討時間縮短 30 秒！',
      hint: null,
      timePenalty: 30
    };
  }
  if (roundIndex === 2) {
    if (c === 'C') {
      return {
        type: 'buff',
        badge: '信任加持',
        title: '因果連鎖：導演型領導立威（杭州試產順暢）',
        effectText: '杭州團隊感佩主管準備周全且能兼顧基層心聲，主動分享跨國整合關鍵底牌！',
        hint: '【提前解鎖第 5 組情報】面對德日「大 D 承諾」與美式「小 d 暫定」衝突，強推每日翻案（B）或暗箱竄改（C）必遭抵制；唯有「將決策流程明文化並確立大小 D 分級協定（方案 A）」能修復雙面人誤會。',
        timePenalty: 0
      };
    }
    return {
      type: 'penalty',
      badge: '產線戒心未除 (-30s)',
      title: '因果連鎖：產線信任受損（上回合賦權失能或高壓懲罰）',
      effectText: '杭州團隊對主管領導能力存疑，真實問題延遲回報，本組研討時間縮短 30 秒！',
      hint: null,
      timePenalty: 30
    };
  }
  if (roundIndex === 3) {
    if (c === 'A') {
      return {
        type: 'buff',
        badge: '信任加持',
        title: '因果連鎖：大小 D 流程明文化（跨國互信穩固）',
        effectText: '跨國團隊在清晰的決策邊界下建立深厚互信，在發表前夕為本組提供布魯塞爾談判底牌！',
        hint: '【提前解鎖第 5 組情報】布魯塞爾三方橫跨四大領導象限，模糊公關（A）與強行出貨（D）必遭荷蘭或日德抵制；唯有「大 D 技術邊界簽核 + 荷蘭式透明共識審查 + 小 d 分階段交付（方案 B）」能取得三方一致同意。',
        timePenalty: 0
      };
    }
    return {
      type: 'penalty',
      badge: '談判時間壓縮 (-15s)',
      title: '因果連鎖：承諾信用破產（上回合隨意翻案引發雙面人危機）',
      effectText: '各國對總部承諾存疑，布魯塞爾三方協商極度緊繃，本組談判時間縮短 15 秒！',
      hint: null,
      timePenalty: 15
    };
  }
  return null;
}

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
  const optIdx = round.options.findIndex(o => o.id === vote.choice);
  const result = vote.choice === 'X' ? round.breakdown : round.options[optIdx];
  const short = result.shortTitle || (optIdx >= 0 ? neutralTitles[index][optIdx] : result.title);
  return {
    ...result,
    shortTitle: short,
    baseline: round.baseline,
    reduction: round.baseline - result.tension
  };
}
