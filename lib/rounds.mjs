// Teaching simulation based on HBR "Being the Boss" & Erin Meyer's Leadership Culture Matrix.
// Tension values are course parameters matching the validated test matrix.
// CQ deltas model trust damage and repair across global leadership cultures.

export const rounds = [
  {
    dimension: '權威與共識', english: 'AUTHORITY & CONSENSUS', color: '#0071e3',
    location: 'Act 1 · 東京併購首戰（波士頓總部 × 東京研發）',
    title: '同一個時程，\n不同的回應。',
    miniLabel: '東京精密總部 · 14 樓跨洋會議室',
    speaker: '東京總工 · 高橋',
    context: '波士頓科技巨頭 Apex 剛併購日本東京精密大廠，距離全球發表會僅剩三週。美籍整合主管習慣美式「扁平開放、當場拍板」，帶著簡報飛抵東京主持跨洋董事會，要求日方總工程師高橋當場承諾新製程交付日。沒想到東京團隊全場沉默，高橋最後只委婉表示：「這個時程，內部可能還需要再研究一下。」',
    dialogue: [
      { who: '波士頓總部', text: '我們開會鼓勵暢所欲言，但今天結束前需要拍板明確日期。下週五能交出最終驗證晶圓嗎？' },
      { who: '東京高橋總工程師', text: '我們明白事情的重要性……但目前製程參數牽涉多個部門，內部可能還需要再研究一下。' }
    ],
    prompt: '面對「階層嚴明卻採全員共識制（Consensual & Hierarchical）」的日本團隊，身為跨國主管的你該如何推進決策？',
    baseline: 85, seconds: 180,
    hiddenIntel: {
      title: '《東京實驗室內部未公開日誌》',
      text: '高橋總工昨晚徹夜測試發現，第三批次晶圓在極高溫下有 0.3% 的熱膨脹偏移。依東京廠規矩，未找齊全體課長私下對齊補救方案並完成由下而上的稟議簽核前，誰敢在大會上公開承諾就是出賣團隊。但若會後指派對等技術窗口私下摸底分擔驗證，高橋手頭其實已備妥 48 小時內能修正參數的備案。'
    },
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
        title: '拆解關鍵里程碑並逐項盤點排程',
        shortTitle: '里程碑盤點',
        text: '將新製程拆解為核心技術里程碑，於董事會逐項盤點各項驗證進度，請東京窗口針對落後項目給出明確預估天數，以利向客戶同步。',
        tension: 90,
        cq: -25,
        verdict: '公開逼問 · 引發防衛心理',
        analysis: '犯了 HBR 所指出的「維度混淆」錯誤：以為日本重視階級就該在正式會議由上而下逐項逼問承諾。在日本「階層×共識」文化中，公開檢視未完備項目被視為讓對方在全場失面子，日方將本能地收縮防線、封閉真實資訊。',
        blindspot: '在日本，正式會議是用來「確認已達成的共識」，而非在眾人面前公開檢驗或逼定死線的地方。',
        quadrant: { x: 28, y: 32, zone: '由上而下 × 平等區' }
      },
      {
        id: 'B',
        title: '會後由對等專案窗口私下溝通確認',
        shortTitle: '會後窗口對齊',
        text: '會上先對齊產品發表戰略目標；會後指派兩地資深工程經理建立對等溝通窗口，私下一對一梳理技術卡點，待日方內部達成共識後再排定時程。',
        tension: 35,
        cq: 20,
        verdict: '非正式摸底 · 尊重共識程序',
        analysis: '完全契合 HBR「共識×階層（日本）」生存法則！會中不施加公開承諾壓力，會後透過對等專案窗口進行非正式摸底（根回），尊重日方由下而上逐級校準的共識流程。一旦內部完成確認，便能形成不可動搖的堅實承諾，後端執行極速！',
        blindspot: '想在共識型階層文化推動改變，關鍵不在會議桌上的公開雄辯，而在進入會議室前的非正式私下對齊。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'C',
        title: '邀請第一線研發工程師直接發言',
        shortTitle: '一線工程直詢',
        text: '打破繁瑣的跨國管理層級，在會議中直接點名負責核心製程的基層工程師說明技術細節，由兩地一線人員開誠布公交流真實進度。',
        tension: 75,
        cq: -15,
        verdict: '越級直詢 · 破壞組織秩序',
        analysis: '將矽谷「跳過主管直接問一線」的去層級思維硬套在日本團隊上。公開越級點名不僅讓日本基層工程師陷入不敢違逆長官的恐慌，更當眾削弱高橋的職級尊嚴，造成跨國合作體系的信任危機。',
        blindspot: '在階層制文化中，越過主管直接向部屬索取公開說明，等於逼部屬在全場長官面前陷入忠誠兩難。',
        quadrant: { x: 28, y: 70, zone: '共識 × 平等區' }
      },
      {
        id: 'D',
        title: '交由美日執行長層級進行閉門協調',
        shortTitle: '高層閉門協調',
        text: '將交付問題提升至公司併購戰略高度，由波士頓執行長與東京廠社長召開閉門會議，以最高決策權直接拍板資源配置與交付目標。',
        tension: 92,
        cq: -30,
        verdict: '高層施壓 · 無法解決基層卡點',
        analysis: '誤用 Linda Hill 所警示的「職位權威迷思」。看似常規的高層升級，但在未摸清基層技術風險前，單靠頂層施壓只能換來表面的應酬性答應，無法解決一線工程師的技術隱憂，為日後埋下更大延遲。',
        blindspot: '正式職權只能買到表面的服從，買不到專業團隊對技術細節真正的擔保與投入。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      }
    ]
  },
  {
    dimension: '賦權與指導', english: 'EMPOWERMENT VS DIRECTION', color: '#15803d',
    location: 'Act 2 · 杭州量產危機（波士頓賦權教條 × 杭州合資廠）',
    title: '被誤解的賦權，\n停擺的合資產線。',
    miniLabel: '杭州合資量產基地 · 中央控制室',
    speaker: '杭州廠長 · 老陳',
    context: '東京製程透過「根回」敲定後，立即移交中國杭州合資廠進行試產。負責督導的波士頓主管照搬美式「扁平化賦權（Empowerment）」管理教條，在週會上只丟出良率目標，便要求杭州團隊「主動腦力激盪、自己決定改進方案」。結果整整一週無人提案、良率異常無人敢通報，中方幹部更私下痛批美方主管「既無能又傲慢」。',
    branchingContext: {
      good: '【東京鼎力相助】因上回合成功建立私下對接窗口，高橋總工指派首席大弟子攜帶「48 小時熱膨脹修正參數」飛抵杭州駐廠，試產良率穩步衝上 78%！然而波士頓總部供應鏈副總麥可為保住北美專案營收，竟動用政治關係強行抽走杭州廠下一批特種光阻材料配額！',
      bad: '【全班共業 · 日方心防緊閉】因上回合在正式會議強行逼問或施壓，東京團隊雖表面移交製程，卻扣留了最關鍵的「高溫補償微調表」，杭州試產首日良率暴跌至 45%！廠長老陳暴怒拒背黑鍋，總部供應鏈副總麥可更趁機抽走杭州廠的特種光阻材料配額！（全班本輪研討時間強制縮短 30 秒！）'
    },
    hiddenIntel: {
      title: '《集團董事會高層人事風向備忘錄》',
      text: '供應鏈副總麥可正面臨集團董事會「本季晶圓化學廢料必須降低 30%」的死命令，否則將取消年度分紅。北美專案用的是高廢料舊製程；反觀你們的 Chronos 採用新型低溫製程，正好能幫他的部門拉低整體廢料率。只要在基準架構基礎上將良率與其減廢考核指標深度綁定，他不僅會歸還材料，還會成為你們的鐵桿盟友。'
    },
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
        title: '實施 OKR 目標管理與基層自主認領',
        shortTitle: '自主目標認領',
        text: '落實敏捷管理原則，管理層僅設定總體良率底線，由杭州工程師自主組成攻關小組，自由認領問題模組並提出改進方案。',
        tension: 95,
        cq: -25,
        verdict: '完全放手 · 角色期望崩盤',
        analysis: '正如 HBR「Chill Factor 杭州案」所示，將西方「去階層化」教條硬塞進高度階層文化，會造成嚴重角色混亂。員工認為主管不給具體方向就是失職與推卸責任，強制自主認領反而讓全廠陷入群龍無首的癱瘓。',
        blindspot: '在「由上而下×階層制」文化中，好主管的定義是「準備周全的導演」，而非「放手不管的促進者」。',
        quadrant: { x: 28, y: 32, zone: '由上而下 × 平等區' }
      },
      {
        id: 'B',
        title: '建立異常通報 SOP 並連動績效考核',
        shortTitle: '通報制度考評',
        text: '導入嚴格的製造流程規範，建立良率異常即時通報制度與責任矩陣，將問題回報的主動性納入班組主管的季度考評指標。',
        tension: 75,
        cq: -15,
        verdict: '制度施壓 · 加深隱瞞風險',
        analysis: '在階層嚴明的環境中，基層原本就因害怕「讓領導沒面子或受罰」而不敢主動通報壞消息。單純強化考核懲罰只會加深防衛心理，促使產線採取更隱蔽的掩蓋手段。',
        blindspot: '階層文化中的沉默往往源於對權威的敬畏與自保，懲罰沉默只會製造更精密的隱瞞。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      },
      {
        id: 'C',
        title: '提供基準方案架構並分批徵詢實務回饋',
        shortTitle: '基準架構導引',
        text: '由技術主管先提出一套完整的參考改善架構與具體驗收標準；隨後透過書面提問與分組內部討論，引導現場工程師針對細節補充實務修正建議。',
        tension: 30,
        cq: 20,
        verdict: '示範領航 · 兼顧威信與反饋',
        analysis: '完美運用 HBR 對「由上而下×階層制」的雙軌解方！一方面滿足中方團隊對主管「事先準備周全、指令具體明確」的專業期待；另一方面透過書面提問與分組自評，成功繞過階層敬畏的心理障礙，引導真實技術細節浮現！',
        blindspot: '先給出清晰的結構與指導方針建立主管威信，再創造安全的發言管道，才能在階層文化中激發主動性。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'D',
        title: '引進第三方精實製造顧問團隊駐廠',
        shortTitle: '外聘精實顧問',
        text: '聘請具備跨國經驗的精實製造專家團隊進駐杭州廠，由外部客觀第三方主導產線診斷與製程優化，降低美中團隊直接摩擦。',
        tension: 100,
        cq: -35,
        verdict: '弱化骨幹 · 削弱內部認同',
        analysis: '看似專業中立的外部介入，但直接架空了當地工程幹部的管理職能，不僅印證了美方對當地團隊的不信任，更難以在短期內取得產線真實默會知識，導致合資夥伴產生嚴重疏離感。',
        blindspot: '當一套管理方法在異地失靈時，該修正的是領導者的文化雷達，而非急於引進外部仲介。',
        quadrant: { x: 28, y: 70, zone: '共識 × 平等區' }
      }
    ]
  },
  {
    dimension: '大D與小d', english: 'BIG D VS SMALL d', color: '#b45309',
    location: 'Act 3 · 慕尼黑系統整合（美式小 d 靈活迭代 × 德日大 D 鐵律承諾）',
    title: '說好的規格，\n怎麼說改就改？',
    miniLabel: '慕尼黑系統整合中心 · 架構戰情室',
    speaker: '首席架構師 · 漢斯',
    context: '杭州試產重回正軌，距發表會剩最後 7 天。波士頓主管為順應北美客戶新回饋，在未重新協商下，單方面將上週才與德國慕尼黑、日本東京共同敲定的「核心介面規格」翻案微調，並在 80 人跨國頻道宣布：「上週只是暫定小決定（Small d），今天起改走新規格！」德國與東京團隊深感遭背叛，痛批美方「雙面人、毫無誠信」，跨國協作瞬間停擺。',
    branchingContext: {
      good: '【供應鏈綠色通道】上回合成功與供應鏈建立互賴同盟，杭州高品質晶圓搭乘專機提前運抵慕尼黑！然而在最後衝刺階段，慕尼黑王牌架構師漢斯為追求極致效能，未經共識便單方面修改了三地共同敲定的核心介面規格，引發德日工程師強烈反彈。',
      bad: '【全班共業 · 橫向孤立與過載】因上回合跨部門衝突與產線過載，測試晶片延誤四天抵達慕尼黑，全團隊身心俱疲！高壓之下，王牌架構師漢斯擅自重寫底層通訊協定，並在 80 人頻道痛罵東京與杭州工程師「平庸無能」，引爆全體罷工危機！（全班本輪研討時間強制縮短 30 秒！）'
    },
    hiddenIntel: {
      title: '《慕尼黑人資與系統壓測雙重密報》',
      text: '系統壓測顯示，漢斯的改動確實修復了一個潛伏漏洞，但漏掉了東京感測器的相容接口。若給他獨立特權或全面放開動態變更，系統必出大禍；若強行拔除權限，他會立刻離職。唯有召開跨國共審，將「核心架構凍結」與「外圍彈性參數分級」制度化，漢斯才會在專業尊重下配合團隊常規。'
    },
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
        title: '確立核心架構凍結與周邊參數彈性分級',
        shortTitle: '核心外圍分級',
        text: '召開跨國協調會坦承程序疏漏；共同界定不可任意變更的「核心架構承諾」，僅將周邊模組開放為依實測數據滾動調校的「彈性參數」並由專人把關。',
        tension: 40,
        cq: 20,
        verdict: '架構分級 · 兼顧承諾與敏捷',
        analysis: '精準實踐 HBR 的黃金解方：「將決策流程完全明文化（Be explicit about the process）」！透過共同界定核心架構的不可變性（Big D），讓德日團隊守住技術尊嚴與品質承諾，同時以周邊彈性（Small d）保留市場競爭所需的靈活性。',
        blindspot: '跨國團隊最怕的不是改變本身，而是「一方以為已經定案不可動搖，另一方卻以為只是持續迭代的草稿」。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'B',
        title: '倡導市場導向的持續整合與動態發布',
        shortTitle: '動態敏捷發布',
        text: '向跨國團隊說明最新市場競爭情勢，主張所有規格在正式交付前皆應保持開放，導入每日持續整合以隨時吸收最佳修改方案。',
        tension: 95,
        cq: -25,
        verdict: '持續變更 · 摧毀工程信任',
        analysis: '忽視德國與日本精密製造仰賴「前期嚴密驗證、後端零誤差執行」的成功根基。強推無邊界的每日滾動修改，等同摧毀德日工程師的品質防線，引發跨國技術骨幹集體抵制。',
        blindspot: '把本國的敏捷迭代習慣當成唯一先進標準，會讓重視契約與承諾的跨國夥伴徹底喪失心理安全感。',
        quadrant: { x: 32, y: 26, zone: '由上而下 × 平等區' }
      },
      {
        id: 'C',
        title: '維持原版規格交付，北美批次採軟體相容方案',
        shortTitle: '雙軌相容版本',
        text: '承諾德日團隊維持原定硬體介面不變，但由北美團隊透過軟體相容層先行測試新特性，待穩定後再推廣至全體版本。',
        tension: 85,
        cq: -15,
        verdict: '暗度陳倉 · 坐實雙面操作',
        analysis: '看似聰明的折衷，但本質上違背了 Linda Hill 強調的「動機與品格信任」。一旦德日工程師在聯調中發現北美私自改動邏輯，跨國合作的信任基石將徹底瓦解。',
        blindspot: '迴避正面跨文化對話而採取私下變通，往往會把原本的「流程誤解」升級為無法挽回的「道德背叛」。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      },
      {
        id: 'D',
        title: '設立全球首席架構師並由其單一裁決',
        shortTitle: '首席架構裁決',
        text: '為化解多地爭端延誤時程，由總部指定一名資深架構專家統攬全局，賦予其在爭議時做出不可異議之最終技術判決的權力。',
        tension: 98,
        cq: -30,
        verdict: '強推集權 · 扼殺全員共識',
        analysis: '在「共識型」團隊眼中，剝奪集體討論與校準權力無異於制度專斷。德日據點將拒絕為最終系統的整體穩定性背書，導致全球發表會面臨災難性的整合失敗。',
        blindspot: '省下前期跨文化校準的時間，往往要在後端付出成倍的返工與拆台代價。',
        quadrant: { x: 24, y: 42, zone: '由上而下 × 平等區' }
      }
    ]
  },
  {
    dimension: '四象限調適', english: 'DYNAMIC ADAPTATION', color: '#7c3aed',
    location: 'Act 4 · 布魯塞爾全球發表前夕（四大領導象限三方終極對決）',
    title: '跨越四大象限，\n尋找唯一的共治交集。',
    miniLabel: '布魯塞爾全球首發會場 · 後台指揮中心',
    speaker: '荷蘭客戶 · 范德堡',
    context: '全球發表會前夕最後 24 小時，三方齊聚布魯塞爾卻因一批極端溫測數據陷入僵局：波士頓總部（由上而下×平等，小 d 速決派）要求立刻拍板如期上市、邊賣邊更新；東京與慕尼黑研發代表（共識×階層，大 D 根回派）堅持必須先完成內部稟議與技術邊界簽核；荷蘭鹿特丹歐洲最大客戶（共識×平等，北歐促進者派）則反對任何高層獨斷，要求三方平起平坐、公開透明達成一致共識。',
    branchingContext: {
      good: '【三地聯防 · 技術長城】距離布魯塞爾全球首發僅剩 60 分鐘，華爾街做空機構突襲指控晶片在極端低溫下有衰減風險。關鍵時刻，東京高橋、杭州老陳與慕尼黑漢斯主動並肩待命，交出完整聯測白皮書作為你的後盾！歐洲最大客戶范德堡親臨後台，等待你的最終方案。',
      bad: '【全班共業 · 內部信任赤字】距離全球首發僅剩 60 分鐘，做空機構突襲指控晶片低溫衰減！然而因前幾輪決策失誤累積，東京拒絕背書、杭州推卸責任、慕尼黑陷入內鬨，歐洲大客戶范德堡在後台下達最後通牒！（全班本輪應變時間壓縮至 45 秒！）'
    },
    hiddenIntel: {
      title: '《荷蘭皇家電信董事會法務密電》',
      text: '范德堡面臨歐盟嚴格的電信合規審查。他最怕兩件事：一是供應商「全量強推或用折扣保固掩蓋問題」，這會害他吃上歐盟隱匿風險的天價罰單；二是「全面延期」，因為他下週只需先部署 70% 的室內常溫機房！只要劃定首波常溫批次先行交付，並針對極端環境成立客戶與研發三方共審機制，他當場就會簽字背書！'
    },
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
        title: '如期發表並在規格中標註操作限制區間',
        shortTitle: '標註操作限制',
        text: '維持發表會時程照常發布，但於技術文件中載明極端溫測為非標準作業條件，承諾後續透過韌體更新持續拓展適用範圍。',
        tension: 78,
        cq: -20,
        verdict: '轉嫁風險 · 無法建立實質當責',
        analysis: '既違反德日團隊對技術真實性與邊界驗證的工匠底線，也觸怒荷蘭客戶對公開透明共識的要求，被視為試圖以文字遊戲掩蓋問題。',
        blindspot: '在跨文化高壓危機中，試圖用免責條款討好市場，最終只會讓所有象限的夥伴同時失去信心。',
        quadrant: { x: 72, y: 32, zone: '由上而下 × 階層區' }
      },
      {
        id: 'B',
        title: '成熟場景優先出貨，同步成立多方技術共審小組',
        shortTitle: '分批交付共審',
        text: '針對已完成嚴密驗證的標準環境批次如期交付；同時與主要客戶及研發代表成立聯合審查小組，透明共享後續數據並分批拓展應用場景。',
        tension: 33,
        cq: 25,
        verdict: '多方共治 · 兼顧品質信譽與商務推進',
        analysis: '完美融合 Erin Meyer 四大領導象限與 Linda Hill 三大要務！既守住德日對成熟批次技術邊界的嚴肅承諾，又以透明共審回應荷蘭客戶對平等參與的期待，同時滿足總部的市場時效，促成三贏！',
        blindspot: '卓越的全球領導者從不固守單一管理教條，而是能依對手所在的文化象限，靈活切換決策機制與治理語言。',
        quadrant: { x: 72, y: 70, zone: '共識 × 階層區' }
      },
      {
        id: 'C',
        title: '主動延後全球發表以完成全環境耐受測試',
        shortTitle: '全面延期驗證',
        text: '基於對品牌品質的最高承諾，宣布發表會順延一個月，待三地實驗室完成所有極端條件的互測認證後再行上市。',
        tension: 73,
        cq: -20,
        verdict: '完全保守 · 蒙受巨大商業代價',
        analysis: '過度順從前期漫長驗證的工匠精神，卻完全忽略商業時效與資本市場信用，導致總部與核心客戶蒙受慘重商業損失與競爭劣勢。',
        blindspot: '跨文化調適不是無原則地犧牲商業推進，而是在承諾品質與市場速度之間架起兼顧各方的橋樑。',
        quadrant: { x: 28, y: 70, zone: '共識 × 平等區' }
      },
      {
        id: 'D',
        title: '維持全量出貨並提供專屬保固與商業補償',
        shortTitle: '全額商務保障',
        text: '評估極端環境實際發生率極低，決定按原計畫全量出貨，針對核心客戶提供額外延長保固、無條件換貨與價格折讓。',
        tension: 83,
        cq: -30,
        verdict: '利益補償 · 忽視工程安全底線',
        analysis: '以美式商業利益交換思維，試圖以金錢補償替代嚴謹驗證，直接踐踏了德日工程師的品質尊嚴與歐洲客戶對合規安全的堅持，引發聯合抵制。',
        blindspot: '在重視技術與原則的文化夥伴面前，試圖以商業利益平息安全質疑，只會讓專業團隊質疑領導者的品格動機。',
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
  ['里程碑盤點', '會後窗口對齊', '一線工程直詢', '高層閉門協調'],
  ['自主目標認領', '通報制度考評', '基準架構導引', '外聘精實顧問'],
  ['核心外圍分級', '動態敏捷發布', '雙軌相容版本', '首席架構裁決'],
  ['標註操作限制', '分批交付共審', '全面延期驗證', '全額商務保障']
];

export function computeCascade(roundIndex, prevOrWorldState, worldStateArg) {
  if (!roundIndex || roundIndex < 1) return null;
  const ws = (prevOrWorldState && typeof prevOrWorldState === 'object' && ('r1' in prevOrWorldState || 'r2' in prevOrWorldState || 'r3' in prevOrWorldState))
    ? prevOrWorldState
    : (worldStateArg && typeof worldStateArg === 'object')
      ? worldStateArg
      : null;
  const prevVote = (prevOrWorldState && typeof prevOrWorldState === 'object' && 'choice' in prevOrWorldState) ? prevOrWorldState : null;

  if (roundIndex === 1) {
    const isGood = ws ? (ws.r1 === 'good' || ws.r1 === 'buff') : (prevVote?.choice === 'B');
    if (isGood) {
      return {
        type: 'buff',
        badge: '東京鼎力相助 (+0s)',
        title: '因果連鎖：會前「根回」奏效（東京技術支援）',
        effectText: '因上回合尊重日本「共識×階層」決策程序，高橋總工指派首席大弟子攜帶「48 小時熱膨脹修正參數」飛抵杭州駐廠，試產良率穩步衝上 78%！',
        hint: '【組織情報】供應鏈副總麥可面臨減廢考核壓力，將專案良率與其減廢考核指標深度綁定（方案 C），他將成為你們的鐵桿盟友。',
        timePenalty: 0
      };
    }
    return {
      type: 'penalty',
      badge: '全班共業 · 日方心防緊閉 (-30s)',
      title: '因果連鎖：日方心防緊閉（全班研討時間強制縮短 30 秒）',
      effectText: '因上回合強行逼問或施壓，東京扣留關鍵微調表，杭州試產良率暴跌至 45%！全班本輪研討時間強制縮短 30 秒！',
      hint: null,
      timePenalty: 30
    };
  }

  if (roundIndex === 2) {
    const isGood = ws ? (ws.r2 === 'good' || ws.r2 === 'buff') : (prevVote?.choice === 'C');
    if (isGood) {
      return {
        type: 'buff',
        badge: '供應鏈綠色通道 (+0s)',
        title: '因果連鎖：橫向同盟建立（材料全速供應）',
        effectText: '上回合成功與供應鏈建立互賴同盟，杭州高品質晶圓搭乘專機提前運抵慕尼黑！',
        hint: '【組織情報】面對王牌架構師私改規格，唯有召開跨國共審，將「核心架構凍結」與「外圍彈性參數分級」制度化（方案 A），漢斯才會配合團隊常規。',
        timePenalty: 0
      };
    }
    return {
      type: 'penalty',
      badge: '全班共業 · 橫向孤立與過載 (-30s)',
      title: '因果連鎖：橫向孤立與過載（全班研討時間強制縮短 30 秒）',
      effectText: '因上回合跨部門衝突與產線過載，測試晶片延誤四天，團隊身心俱疲，漢斯引爆罷工危機！全班研討時間強制縮短 30 秒！',
      hint: null,
      timePenalty: 30
    };
  }

  if (roundIndex === 3) {
    const r1Good = ws ? (ws.r1 === 'good' || ws.r1 === 'buff') : false;
    const r2Good = ws ? (ws.r2 === 'good' || ws.r2 === 'buff') : false;
    const r3Good = ws ? (ws.r3 === 'good' || ws.r3 === 'buff') : (prevVote?.choice === 'A');
    const goodCount = [r1Good, r2Good, r3Good].filter(Boolean).length;

    if (goodCount >= 2) {
      return {
        type: 'buff',
        badge: '三地聯防 · 時間獎勵 (+15s)',
        title: '因果連鎖：三地聯防技術長城（應變時間增至 75 秒）',
        effectText: '東京、杭州、慕尼黑骨幹主動交出聯測白皮書作為你的後盾！三地齊心為你背書，應變時間獎勵增加至 75 秒！',
        hint: '【組織情報】范德堡面臨歐盟合規審查，最忌全量強推掩蓋或全面延期；唯有劃定成熟標準批次先行交付、極端環境三方共審（方案 B），他當場就會簽字背書！',
        timePenalty: -15
      };
    }
    const isBad = ws ? (ws.r3 === 'bad' || ws.r3 === 'penalty') : (prevVote?.choice && prevVote.choice !== 'A');
    if (isBad) {
      return {
        type: 'penalty',
        badge: '全班共業 · 內部信任赤字 (-15s)',
        title: '因果連鎖：內部信任赤字（應變時間壓縮至 45 秒）',
        effectText: '因前幾輪決策失誤累積，東京拒絕背書、杭州推卸責任、慕尼黑陷入內鬨，范德堡在後台下達最後通牒！應變時間壓縮至 45 秒！',
        hint: null,
        timePenalty: 15
      };
    }
    return {
      type: 'buff',
      badge: '標準應變 (60s)',
      title: '因果連鎖：常態首發待命',
      effectText: '各據點配合聯測，范德堡等待最終方案。',
      hint: null,
      timePenalty: 0
    };
  }

  return null;
}

export function publicRound(index, options = false, worldState = {}) {
  const round = rounds[index];
  const { dimension, english, color, location, title, dialogue, prompt, baseline, seconds, juryRole, miniLabel, speaker } = round;
  let context = round.context;
  if (round.branchingContext && worldState) {
    const prevKey = index === 1 ? worldState.r1 : index === 2 ? worldState.r2 : index === 3 ? worldState.r3 : null;
    if (prevKey === 'good' || prevKey === 'buff') {
      context = round.branchingContext.good;
    } else if (prevKey === 'bad' || prevKey === 'penalty') {
      context = round.branchingContext.bad;
    }
  }
  return {
    dimension, english, color, location, title, context, dialogue, prompt, baseline, seconds, juryRole, miniLabel, speaker,
    ...(options ? { options: round.options.map(({ id, text }, i) => ({ id, title: neutralTitles[index][i], text })) } : {})
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
