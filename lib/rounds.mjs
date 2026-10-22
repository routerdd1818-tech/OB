// Teaching simulation based on HBR "Being the Boss" & Erin Meyer's Leadership Culture Matrix.
// Script: 全球綠能快遞：跨國物流重組與零碳轉型計畫
// Tension values match baseline - reduction.
// CQ deltas model trust damage and repair across global leadership cultures.

export const rounds = [
  {
    id: 0,
    dimension: '權威與共識 · 斯德哥爾摩與東京的初次交鋒',
    english: 'AUTHORITY & CONSENSUS',
    color: '#d97706',
    speaker: '東京研發總監 · 渡邊',
    location: 'Act 1 · 斯德哥爾摩與東京（權威與共識）',
    miniLabel: '東京精密總部 · 14 樓跨洋會議室',
    title: '全球綠能物流啟動會議的「微笑沉默」',
    context: '瑞典總部（強調平等與共識導向）的空降主管在東京分公司召開淨零物流啟動會，要求全體員工直接提出創新減碳方案。然而，東京團隊全程鞠躬微笑、不發一語，會後卻遲遲不肯簽署時程確認書。',
    dialogue: [
      { who: '瑞典總主管', text: '大家不用拘泥職位，平等討論！每個人都有權利直接決定下週的減碳目標，大家覺得呢？' },
      { who: '東京渡邊總監', text: '……（鞠躬微笑，不發一語）……' },
      { who: '會後私下回報', text: '渡邊私下表示：在階級分明的架構下，直接在會議公開反駁主管是不禮貌的，且重大決策必須回到本社進行嚴謹的稟議與根回……' }
    ],
    prompt: '面對日方「階級森嚴卻追求共識（大 D）」的文化特徵，瑞典總部的第一步決策是？',
    baseline: 78,
    seconds: 180,
    juryRole: {
      title: '【公司方】東京研發團隊代表席',
      short: '公司方 · 東京團隊',
      counterpart: '瑞典總部決策小組',
      stance: '你們是日本在地的研發團隊（公司方）。面對瑞典主管在正式會議要求全員扁平拍板，你們在乎「會前根回摸底」與「由下而上稟議簽核」的共識程序，反對未經充分磨合的公開表態。請評定誰真正理解共識×階級的運作法則！',
      pitchTarget: '向第 5 組【公司方 · 東京研發團隊】申辯說服'
    },
    hiddenIntel: {
      title: '《第一回合極密情報：根回機制》',
      text: '日本企業的歷史經驗告訴我們：在日企，正式會議只是蓋章儀式。只要在會前完成「根回」一對一溝通，提案通過率高達 100%。'
    },
    options: [
      {
        id: 'A',
        title: '發布北歐式平等最後通牒',
        shortTitle: '北歐式強推',
        text: '以扁平開放姿態發出強制公告，要求各級員工直接私訊主管並在線上公開投票。',
        tension: 83,
        reduction: -5,
        cq: -20,
        verdict: '⚠️ 激化對立，日方全線靜默抵制',
        analysis: '誤將「權威平等（北歐風格）」套用在「階級森嚴」的日本團隊，強行打破稟議秩序，導致信任基礎破裂。',
        blindspot: '正如 Meyer 所言：權威（階級 vs 平等）與決策（由上而下 vs 共識）是完全獨立的兩個維度。日本屬於「階級森嚴＋共識導向」，不適用北歐式單向扁平動員。',
        quadrant: { x: 85, y: 15, zone: '由上而下 × 階層區' },
        result: {
          cq: -20,
          reduction: -5,
          shortTitle: '北歐式強推',
          verdict: '⚠️ 激化對立，日方全線靜默抵制',
          analysis: '誤將「權威平等（北歐風格）」套用在「階級森嚴」的日本團隊，強行打破稟議秩序，導致信任基礎破裂。',
          blindspot: '正如 Meyer 所言：權威（階級 vs 平等）與決策（由上而下 vs 共識）是完全獨立的兩個維度。日本屬於「階級森嚴＋共識導向」，不適用北歐式單向扁平動員。',
          quadrant: { x: 85, y: 15, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'B',
        title: '導入「根回」一對一對話',
        shortTitle: '根回破冰',
        text: '暫緩公開投票，由瑞典主管在正式開會前，私下一對一拜訪各利害關係人，把分歧與合規疑慮在會前磨平。',
        tension: 60,
        reduction: 18,
        cq: 25,
        verdict: '🎉 深入日式決策核心，成功瓦解沉默',
        analysis: '精準運用日式「根回」機制。在正式會議前完成私下合意，讓正式會議成為「宣佈共識的儀式」，贏得日方高度敬意。',
        blindspot: '在共識導向與階層並存的文化中（如日本、德國），正式會議從來不是用來激辯的，真正的決策早已在私下對話中完成。',
        quadrant: { x: 25, y: 80, zone: '共識 × 階層區' },
        result: {
          cq: 25,
          reduction: 18,
          shortTitle: '根回破冰',
          verdict: '🎉 深入日式決策核心，成功瓦解沉默',
          analysis: '精準運用日式「根回」機制。在正式會議前完成私下合意，讓正式會議成為「宣佈共識的儀式」，贏得日方高度敬意。',
          blindspot: '在共識導向與階層並存的文化中（如日本、德國），正式會議從來不是用來激辯的，真正的決策早已在私下對話中完成。',
          quadrant: { x: 25, y: 80, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'C',
        title: '無限期交給基層自行投票',
        shortTitle: '形式民主',
        text: '完全採行全員無記名投票，由多數決決定是否如期上線。',
        tension: 76,
        reduction: 2,
        cq: -10,
        verdict: '⚠️ 陷入分析癱瘓與無止盡拖延',
        analysis: '忽略了日本雖然講求共識，但本質上是高度階級導向的（需由上而下推動稟議），形式投票無法取代結構程序。',
        blindspot: '共識導向不等於北歐式的扁平平等投票，在不同文化中其凝聚動能的機制天差地遠。',
        quadrant: { x: 15, y: 70, zone: '共識 × 階層區' },
        result: {
          cq: -10,
          reduction: 2,
          shortTitle: '形式民主',
          verdict: '⚠️ 陷入分析癱瘓與無止盡拖延',
          analysis: '忽略了日本雖然講求共識，但本質上是高度階級導向的（需由上而下推動稟議），形式投票無法取代結構程序。',
          blindspot: '共識導向不等於北歐式的扁平平等投票，在不同文化中其凝聚動能的機制天差地遠。',
          quadrant: { x: 15, y: 70, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'D',
        title: '交給總部工程師直接獨裁拍板',
        shortTitle: '獨裁強推',
        text: '不理會日方反應，由總部主管直接行使最高權限指定最終技術方案。',
        tension: 80,
        reduction: -2,
        cq: -15,
        verdict: '💥 釀成嚴重抗命與品質災難',
        analysis: '展現了典型的外行領導，完全摧毀了在地團隊的心理安全感，導致後續維運全面消極。',
        blindspot: '誤以為階級社會就是「老闆一人說了算」，卻忽略了日本基層不參與共識稟議就不會真正動工的現實。',
        quadrant: { x: 70, y: 20, zone: '由上而下 × 平等區' },
        result: {
          cq: -15,
          reduction: -2,
          shortTitle: '獨裁強推',
          verdict: '💥 釀成嚴重抗命與品質災難',
          analysis: '展現了典型的外行領導，完全摧毀了在地團隊的心理安全感，導致後續維運全面消極。',
          blindspot: '誤以為階級社會就是「老闆一人說了算」，卻忽略了日本基層不參與共識稟議就不會真正動工的現實。',
          quadrant: { x: 70, y: 20, zone: '由上而下 × 平等區' }
        }
      }
    ]
  },
  {
    id: 1,
    dimension: '領導盲區 · 美式自主授權 vs. 北京階級指揮',
    english: 'EMPOWERMENT VS DIRECTION',
    color: '#0284c7',
    speaker: '北京物流廠長 · 陳廠長',
    location: 'Act 2 · 北京合資物流廠（美式授權 vs 階級指揮）',
    miniLabel: '北京合資物流基地 · 中央調度室',
    title: '北京合資廠的「缺乏主動性」衝突',
    context: '美國物流巨擘將總部的扁平化、360度評估與自主授權帶入北京合資廠。美國主管抱怨中國員工「缺乏主動性、只會聽命行事」；中國員工則私下抱怨美國主管「不僅無能，而且極度傲慢，開會前完全不給指令」。',
    branchingContext: {
      good: '【東京鼎力相助】因上回合成功導入根回機制，東京團隊在會前全力協調，日方標準平穩落地！然而美方主管進駐北京合資廠後，將扁平授權硬套在產線，再次引爆中方管理階層的強烈質疑！',
      bad: '【全班共業 · 日方心防緊閉】因上回合強行打破日本稟議秩序，日方心防緊閉且消極抵制；與此同時北京合資廠又因美方主管放手不管，導致全廠陷入癱瘓！（全班本輪研討時間強制縮短 30 秒！）'
    },
    hiddenIntel: {
      title: '《第二回合極密情報：指揮官的藝術》',
      text: '優秀人才之所以在美式會議沉默，是因為不習慣在拍板前挑戰權威。明確告訴他們「在此階段必須表達異議」，才能真正激活團隊。只要轉型為指揮官模式提出明確作戰方針（方案 B），就能徹底釋放產能。'
    },
    dialogue: [
      { who: '美國總主管', text: '我都已經充分授權了，大家為什麼遇到問題都不自己提出解法？太被動了吧！' },
      { who: '北京陳廠長私下反饋', text: '主管開會前自己毫無腹案，也不給詳細工作指示，卻要我們越級提解法，這不是無能是什麼？' }
    ],
    prompt: '面對「由上而下 ＋ 階級主義」的北京團隊，美國主管的領導風格應該如何調整？',
    baseline: 72,
    seconds: 180,
    juryRole: {
      title: '【總部方】美方營運審查席',
      short: '總部方 · 美方高層',
      counterpart: '北京協調小組',
      stance: '你們是總部資深營運審查席。面對北京合資廠的停擺與中方針鋒相對的「無能」批評，你們在乎交付進度與品質標準，也深知階層文化中「導演型領導」與「明確指令」的必要性。請評定誰能真正打破僵局！',
      pitchTarget: '向第 5 組【總部方 · 美方高層審查席】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '繼續堅持美式扁平授權與自我管理',
        shortTitle: '水土不服',
        text: '取消所有層級簽核，要求北京員工學會獨立自主，像矽谷工程師一樣主動找答案。',
        tension: 75,
        reduction: -3,
        cq: -15,
        verdict: '⚠️ 導致員工無所適從，集體陷入觀望',
        analysis: '在「階級主義 ＋ 由上而下決策」的環境中（中國、印度、法國），部屬將主管視為「指揮官」。沒有明確指令的授權等於失職。',
        blindspot: '中國職場高度重視權威與清晰指示。過度崇尚美式扁平授權，會被基層解讀為主管推卸責任或能力不足。',
        quadrant: { x: 30, y: 40, zone: '由上而下 × 階層區' },
        result: {
          cq: -15,
          reduction: -3,
          shortTitle: '水土不服',
          verdict: '⚠️ 導致員工無所適從，集體陷入觀望',
          analysis: '在「階級主義 ＋ 由上而下決策」的環境中（中國、印度、法國），部屬將主管視為「指揮官」。沒有明確指令的授權等於失職。',
          blindspot: '中國職場高度重視權威與清晰指示。過度崇尚美式扁平授權，會被基層解讀為主管推卸責任或能力不足。',
          quadrant: { x: 30, y: 40, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'B',
        title: '轉型為「指揮官模式」並明確定義期望',
        shortTitle: '精準指揮',
        text: '調整領導姿態，由主管在會前提出明確清晰的作戰方針，並要求部屬「帶著 3 個備選方案」來開會。',
        tension: 50,
        reduction: 22,
        cq: 30,
        verdict: '🌟 完美切中文化期望，生產力大噴發',
        analysis: '落實 Meyer 在書中的建議：在階級指揮型文化中，主管必須給予明確結構，並在框架內建立對話。',
        blindspot: '成功的跨國主管懂得因地制宜：在波士頓你可以當促進者，但在北京你必須扮演好指揮官。',
        quadrant: { x: 80, y: 75, zone: '由上而下 × 階層區' },
        result: {
          cq: 30,
          reduction: 22,
          shortTitle: '精準指揮',
          verdict: '🌟 完美切中文化期望，生產力大噴發',
          analysis: '落實 Meyer 在書中的建議：在階級指揮型文化中，主管必須給予明確結構，並在框架內建立對話。',
          blindspot: '成功的跨國主管懂得因地制宜：在波士頓你可以當促進者，但在北京你必須扮演好指揮官。',
          quadrant: { x: 80, y: 75, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'C',
        title: '全面引進第三方顧問進行心理建設',
        shortTitle: '文化殖民',
        text: '花費數月舉辦文化洗腦課程，強迫北京員工接受美國矽谷文化。',
        tension: 80,
        reduction: -8,
        cq: -20,
        verdict: '🔥 引發基層強烈反彈與離職潮',
        analysis: '試圖透過外力改變根深蒂固的社會文化，造成嚴重的內部文化摩擦與人才流失。',
        blindspot: '管理學的黃金法則：永遠是領導者去適應在地文化，而不是要求幾百名在地員工去適應外國主管的鄉愁。',
        quadrant: { x: 75, y: 35, zone: '由上而下 × 階層區' },
        result: {
          cq: -20,
          reduction: -8,
          shortTitle: '文化殖民',
          verdict: '🔥 引發基層強烈反彈與離職潮',
          analysis: '試圖透過外力改變根深蒂固的社會文化，造成嚴重的內部文化摩擦與人才流失。',
          blindspot: '管理學的黃金法則：永遠是領導者去適應在地文化，而不是要求幾百名在地員工去適應外國主管的鄉愁。',
          quadrant: { x: 75, y: 35, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'D',
        title: '全面外包給當地合夥人全權管理',
        shortTitle: '棄守治理',
        text: '總部徹底放手，由中方合夥人全權決定，總部不再過問任何細節。',
        tension: 87,
        reduction: -15,
        cq: -30,
        verdict: '💥 失去核心技術控制權與品質崩盤',
        analysis: '從另一個極端的管理失控，導致總部的全球戰略目標無法貫徹。',
        blindspot: '放任不管不等於跨文化融合，跨國管理的本質在於「保有主導權的同時進行文化轉譯」。',
        quadrant: { x: 85, y: 20, zone: '由上而下 × 階層區' },
        result: {
          cq: -30,
          reduction: -15,
          shortTitle: '棄守治理',
          verdict: '💥 失去核心技術控制權與品質崩盤',
          analysis: '從另一個極端的管理失控，導致總部的全球戰略目標無法貫徹。',
          blindspot: '放任不管不等於跨文化融合，跨國管理的本質在於「保有主導權的同時進行文化轉譯」。',
          quadrant: { x: 85, y: 20, zone: '由上而下 × 階層區' }
        }
      }
    ]
  },
  {
    id: 2,
    dimension: '決策哲學 · 法蘭克福的石碑大 D vs. 紐約的小 d 動態',
    english: 'BIG D VS SMALL d',
    color: '#0d9488',
    speaker: '德國營運長 · 漢斯',
    location: 'Act 3 · 法蘭克福營運中心（大 D 承諾 vs 小 d 速度）',
    miniLabel: '法蘭克福運營中心 · 戰情室',
    title: '德美跨國團隊的「決策意義」撕裂',
    context: '美德聯合物流團隊開會，美國大老闆短暫討論後興奮宣佈：「Great! We have a decision!」德國團隊隨即花費三天三夜、一絲不苟地落實；幾天後，美國老闆因拿到新數據隨興說：「我們要換個方向。」德國團隊憤怒指責美國人雙面、不誠實。',
    branchingContext: {
      good: '【供應鏈暢通無阻】上回合成功切換指揮官模式，北京產能全線爆發！然而在法蘭克福系統整合階段，美德雙方對決策性質的認知衝突浮上檯面，德國工程師要求守住大 D 承諾！',
      bad: '【全班共業 · 橫向孤立與過載】因上回合管理失調導致產線延誤，團隊身心俱疲！此時美國老闆又隨興翻案，德國團隊怒不可遏，瀕臨全面罷工！（全班本輪研討時間強制縮短 30 秒！）'
    },
    hiddenIntel: {
      title: '《第三回合極密情報：德意志銀行的教訓》',
      text: '教訓證明：在共識導向的國家，主管必須「先花時間贏得支持，才能宣佈定案」。規定每次會議明確宣告「大寫 D」或「小寫 d」（方案 B），即可兼顧德國的承諾與美國的敏捷。'
    },
    dialogue: [
      { who: '德國營運長 · 漢斯', text: '我們已經依照合約與承諾把物流網架構刻在石碑上了！你怎麼可以說改就改？你們根本不尊重承諾！' },
      { who: '美國老闆', text: '這只是個小寫 d 的動態里程碑啊！有新數據不趕快修正，盲目執行才是愚蠢吧？' }
    ],
    prompt: '面對美德雙方對「大寫 D（承諾）」與「小寫 d（速度）」的哲學衝突，你們該建立什麼機制？',
    baseline: 68,
    seconds: 180,
    juryRole: {
      title: '【公司方】德國第一線營運工程團隊',
      short: '公司方 · 德國工程師',
      counterpart: '跨國整合推進小組',
      stance: '你們是德國第一線營運工程骨幹。在德國文化中，決策一旦拍板就是神聖不可侵犯的「大 D」，隨意翻案等同摧毀品質誠信與工程自尊。請評定誰能真正給出制度化承諾、修復跨國信任！',
      pitchTarget: '向第 5 組【公司方 · 德國工程團隊】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '完全聽從美國老闆的彈性調整',
        shortTitle: '破壞德國信賴',
        text: '要求德國團隊學會矽谷的敏捷精神，隨時準備推翻重來。',
        tension: 78,
        reduction: -10,
        cq: -25,
        verdict: '⚠️ 導致德國工程師全面產生倦怠與不信任',
        analysis: '德國與日本屬於「大寫 D（Consensual / 刻在石碑上）」的精密製造邏輯，頻繁朝令夕改會徹底摧毀其工程品質。',
        blindspot: '小寫 d（速度重於完美、隨時修正）適用於軟體網際網路業；但在容錯率極低的精密工業與合規場景，貿然套用會引發災難。',
        quadrant: { x: 30, y: 70, zone: '共識 × 階層區' },
        result: {
          cq: -25,
          reduction: -10,
          shortTitle: '破壞德國信賴',
          verdict: '⚠️ 導致德國工程師全面產生倦怠與不信任',
          analysis: '德國與日本屬於「大寫 D（Consensual / 刻在石碑上）」的精密製造邏輯，頻繁朝令夕改會徹底摧毀其工程品質。',
          blindspot: '小寫 d（速度重於完美、隨時修正）適用於軟體網際網路業；但在容錯率極低的精密工業與合規場景，貿然套用會引發災難。',
          quadrant: { x: 30, y: 70, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'B',
        title: '導入「D 與 d 雙軌宣告協定」',
        shortTitle: '精準宣告',
        text: '規定每次開會結束前，主持人必須明確宣告：這是一次需要長遠對齊的「大寫 D（最終承諾）」，還是一次隨時可以調整的「小寫 d（動態測試）」。',
        tension: 43,
        reduction: 25,
        cq: 35,
        verdict: '🏆 完美化解認知鴻溝，建立雙向信任',
        analysis: '精準落實 Erin Meyer 的核心解方。透過明確定義決策性質，讓美德雙方在相同的認知框架下協作。',
        blindspot: '跨國管理最怕「用同一套詞彙，卻懷抱完全不同的心理預期」。將隱性的文化假設顯性化，是最高的管理智慧。',
        quadrant: { x: 50, y: 75, zone: '共識 × 階層區' },
        result: {
          cq: 35,
          reduction: 25,
          shortTitle: '精準宣告',
          verdict: '🏆 完美化解認知鴻溝，建立雙向信任',
          analysis: '精準落實 Erin Meyer 的核心解方。透過明確定義決策性質，讓美德雙方在相同的認知框架下協作。',
          blindspot: '跨國管理最怕「用同一套詞彙，卻懷抱完全不同的心理預期」。將隱性的文化假設顯性化，是最高的管理智慧。',
          quadrant: { x: 50, y: 75, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'C',
        title: '全面改用德國的冗長審查流程',
        shortTitle: '陷入癱瘓',
        text: '所有大小決議都必須經過數週的書面審查與全體同意才準執行。',
        tension: 73,
        reduction: -5,
        cq: -20,
        verdict: '⏳ 喪失市場商機，專案速度歸零',
        analysis: '為了遷就德國的嚴謹而放棄了美國團隊追求的市場速度，導致產品上市時機過期。',
        blindspot: '過度的共識導向會造成「分析癱瘓」，在快節奏市場中同樣是致命傷。',
        quadrant: { x: 20, y: 90, zone: '共識 × 階層區' },
        result: {
          cq: -20,
          reduction: -5,
          shortTitle: '陷入癱瘓',
          verdict: '⏳ 喪失市場商機，專案速度歸零',
          analysis: '為了遷就德國的嚴謹而放棄了美國團隊追求的市場速度，導致產品上市時機過期。',
          blindspot: '過度的共識導向會造成「分析癱瘓」，在快節奏市場中同樣是致命傷。',
          quadrant: { x: 20, y: 90, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'D',
        title: '允許兩邊各自為政互不干涉',
        shortTitle: '組織分裂',
        text: '美國人隨便改美國的，德國人慢慢做德國的，開會各說各話。',
        tension: 86,
        reduction: -18,
        cq: -35,
        verdict: '🚨 物流網介面與技術架構完全斷裂',
        analysis: '團隊實質分裂為兩個互不隸屬的組織，專案走向全面失控。',
        blindspot: '不溝通的放任絕不是多元共融，而是組織治理的完全失敗。',
        quadrant: { x: 60, y: 30, zone: '由上而下 × 平等區' },
        result: {
          cq: -35,
          reduction: -18,
          shortTitle: '組織分裂',
          verdict: '🚨 物流網介面與技術架構完全斷裂',
          analysis: '團隊實質分裂為兩個互不隸屬的組織，專案走向全面失控。',
          blindspot: '不溝通的放任絕不是多元共融，而是組織治理的完全失敗。',
          quadrant: { x: 60, y: 30, zone: '由上而下 × 平等區' }
        }
      }
    ]
  },
  {
    id: 3,
    dimension: '跨文化四象限調適 · 全球淨零碳排決戰',
    english: 'DYNAMIC ADAPTATION',
    color: '#7c3aed',
    speaker: '聯合國永續發展特使',
    location: 'Act 4 · 全球淨零高峰會（四大象限四方終極交鋒）',
    miniLabel: '全球淨零高峰會 · 總裁指揮中心',
    title: '波士頓（美）× 東京（日）× 巴黎（法）× 北京（中）的四方紅線交鋒',
    context: '全球綠能快遞面臨最終淨零碳排上線關頭！波士頓總部（平等＋小 d 速度）要求立刻全面發布；東京（階層＋大 D 共識）要求重新跑完三個月稟議；巴黎（階層＋小 d 指揮）要求聽從指揮但拒絕週末加班；北京（階層＋指揮）要求提供極為詳細的中央作戰清單。四方陷入終極死鎖，且任一方拒絕即宣告破局。',
    branchingContext: {
      good: '【四方聯防 · 綠能先驅】距離全球淨零發布僅剩 60 分鐘，外界高度關注！關鍵時刻，東京、北京與法蘭克福團隊並肩待命，等待你在高峰會上的最終拍板！',
      bad: '【全班共業 · 內部信任赤字】距離全球發布僅剩 60 分鐘！因前幾輪跨文化摩擦累積，東京拒絕背書、北京推卸責任、巴黎堅持罷工，聯合國特使在後台下達最後通牒！（全班本輪應變時間壓縮至 45 秒！）'
    },
    hiddenIntel: {
      title: '《第四回合極密情報：動態切換》',
      text: 'Erin Meyer 的終極結論：成功的跨國領導者從不依賴單一母文化的套路。看清對方的文化座標，有意識地在不同象限切換（方案 B），是贏得全球戰局的唯一解方。'
    },
    dialogue: [
      { who: '波士頓總部', text: '氣候危機刻不容緩，不要管程序了，立刻全面上線！' },
      { who: '東京辦公室', text: '沒有完成全體共識與稟議合規，東京絕不背書！' },
      { who: '巴黎分公司', text: '我們同意總部，但依據法國勞基法，週末絕對不加班！' },
      { who: '北京分公司', text: '請給我們詳細的中央指揮清單，否則基層無所適從！' }
    ],
    prompt: '面對橫跨四大領導象限的四方衝突，你們的終極整合拍板是？',
    baseline: 62,
    seconds: 60,
    juryRole: {
      title: '【關鍵方】聯合國特使與全球審查席',
      short: '關鍵方 · 審查特使',
      counterpart: '跨文化危機協商小組',
      stance: '你們是全球永續審查與獨立董事席。身處全球治理最高峰，痛恨黑箱欺瞞或單方專斷，要的是兼顧品質安全與各方文化的具體多方協定。請審核各組提案！',
      pitchTarget: '向第 5 組【關鍵方 · 審查特使】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '強制貫徹波士頓總部的美國式快節奏',
        shortTitle: '美國霸權',
        text: '無視東京的稟議、巴黎的勞基法與北京的指揮需求，由總部強制一鍵全球上線。',
        tension: 67,
        reduction: -5,
        cq: -20,
        verdict: '⚠️ 惹怒日、法、中，面臨法律訴訟與抵制危機',
        analysis: '展現了典型的美國中心主義，徹底踩雷 Erin Meyer 書中警告的跨國領導大忌。',
        blindspot: '全球化不等於美式化。強行將單一國家的管理邏輯套用在全球市場，只會引發嚴重的跨國反彈。',
        quadrant: { x: 80, y: 20, zone: '由上而下 × 平等區' },
        result: {
          cq: -20,
          reduction: -5,
          shortTitle: '美國霸權',
          verdict: '⚠️ 惹怒日、法、中，面臨法律訴訟與抵制危機',
          analysis: '展現了典型的美國中心主義，徹底踩雷 Erin Meyer 書中警告的跨國領導大忌。',
          blindspot: '全球化不等於美式化。強行將單一國家的管理邏輯套用在全球市場，只會引發嚴重的跨國反彈。',
          quadrant: { x: 80, y: 20, zone: '由上而下 × 平等區' }
        }
      },
      {
        id: 'B',
        title: '建立「全球文化座標動態切換協議」',
        shortTitle: '模組化管理',
        text: '採用 Meyer 的核心結論：針對波士頓採用小 d 敏捷，針對東京預留根回與大 D 稟議期，針對巴黎落實勞動權益對話，針對北京給予精準指揮清單。在不同戰線切換對應的領導象限。',
        tension: 32,
        reduction: 30,
        cq: 40,
        verdict: '🏆 跨文化領導的最高境界！四方完美對齊，全球綠能大捷',
        analysis: '完美體現了《Being the Boss》的精髓：優秀的全球主管懂得辨識對方的文化座標，並在「堅持自我」與「靈活調適」之間切換。',
        blindspot: '跨文化領導力的本質，就是擁有一套能夠在「不同文化象限」自由切換的領導密碼。',
        quadrant: { x: 50, y: 90, zone: '共識 × 階層區' },
        result: {
          cq: 40,
          reduction: 30,
          shortTitle: '模組化管理',
          verdict: '🏆 跨文化領導的最高境界！四方完美對齊，全球綠能大捷',
          analysis: '完美體現了《Being the Boss》的精髓：優秀的全球主管懂得辨識對方的文化座標，並在「堅持自我」與「靈活調適」之間切換。',
          blindspot: '跨文化領導力的本質，就是擁有一套能夠在「不同文化象限」自由切換的領導密碼。',
          quadrant: { x: 50, y: 90, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'C',
        title: '各分公司各自為政、分區上市',
        shortTitle: '鬆散邦聯',
        text: '放棄全球同步，讓波士頓、東京、巴黎、北京各自決定何時轉型。',
        tension: 77,
        reduction: -15,
        cq: -30,
        verdict: '❌ 全球品牌形象破碎，協同綜效歸零',
        analysis: '消極逃避跨文化整合的困難，導致組織失去了跨國企業最大的規模優勢。',
        blindspot: '分開管理雖然避開了衝突，但也同時放棄了跨國協作的真正價值。',
        quadrant: { x: 10, y: 10, zone: '共識 × 平等區' },
        result: {
          cq: -30,
          reduction: -15,
          shortTitle: '鬆散邦聯',
          verdict: '❌ 全球品牌形象破碎，協同綜效歸零',
          analysis: '消極逃避跨文化整合的困難，導致組織失去了跨國企業最大的規模優勢。',
          blindspot: '分開管理雖然避開了衝突，但也同時放棄了跨國協作的真正價值。',
          quadrant: { x: 10, y: 10, zone: '共識 × 平等區' }
        }
      },
      {
        id: 'D',
        title: '全面停工並交由外部仲裁',
        shortTitle: '無限內耗',
        text: '無限期擱置專案，將所有高管送往跨文化訓練營。',
        tension: 82,
        reduction: -20,
        cq: -40,
        verdict: '💥 商業機會流失，專案宣分散場',
        analysis: '在關鍵時刻陷入過度反思與內耗，錯失了地球永續生存的黃金時機。',
        blindspot: '學理必須為實戰服務，管理者的最終考驗是在混亂中果斷創造秩序。',
        quadrant: { x: 90, y: 90, zone: '由上而下 × 階層區' },
        result: {
          cq: -40,
          reduction: -20,
          shortTitle: '無限內耗',
          verdict: '💥 商業機會流失，專案宣分散場',
          analysis: '在關鍵時刻陷入過度反思與內耗，錯失了地球永續生存的黃金時機。',
          blindspot: '學理必須為實戰服務，管理者的最終考驗是在混亂中果斷創造秩序。',
          quadrant: { x: 90, y: 90, zone: '由上而下 × 階層區' }
        }
      }
    ],
    breakdown: {
      id: 'X',
      title: '多方協商破局（任一方拒絕）',
      shortTitle: '協商破局',
      tension: 100,
      reduction: -38,
      cq: -25,
      verdict: '❌ 各方未能達成共識，談判破局',
      analysis: '由於各方堅持單一母國的文化套路，未能進行跨文化象限切換，導致全球溝通斷聯。',
      blindspot: '跨文化管理的死穴，就是期待全世界都用你的方式思考。',
      quadrant: { x: 50, y: 50, zone: '破局中央區' },
      result: {
        cq: -25,
        reduction: -38,
        shortTitle: '協商破局',
        verdict: '❌ 各方未能達成共識，談判破局',
        analysis: '由於各方堅持單一母國的文化套路，未能進行跨文化象限切換，導致全球溝通斷聯。',
        blindspot: '跨文化管理的死穴，就是期待全世界都用你的方式思考。',
        quadrant: { x: 50, y: 50, zone: '破局中央區' }
      }
    }
  }
];

export const neutralTitles = [
  ['北歐式強推', '根回破冰', '形式民主', '獨裁強推'],
  ['水土不服', '精準指揮', '文化殖民', '棄守治理'],
  ['破壞德國信賴', '精準宣告', '陷入癱瘓', '組織分裂'],
  ['美國霸權', '模組化管理', '鬆散邦聯', '無限內耗']
];

export function computeCascade(roundIndex, prevOrWorldState, worldStateArg) {
  if (!roundIndex || roundIndex < 1) return null;
  const ws = (prevOrWorldState && typeof prevOrWorldState === 'object' && ('r1' in prevOrWorldState || 'r2' in prevOrWorldState || 'r3' in prevOrWorldState))
    ? prevOrWorldState
    : (worldStateArg && typeof worldStateArg === 'object')
      ? worldStateArg
      : null;
  const prevVote = (prevOrWorldState && typeof prevOrWorldState === 'object' && 'choice' in prevOrWorldState) ? prevOrWorldState : null;

  const prevKey = 'r' + roundIndex;
  const prevStatus = ws ? ws[prevKey] : (prevVote?.choice === 'B' ? 'good' : 'bad');

  if (prevStatus === 'good' || prevStatus === 'buff') {
    if (roundIndex === 1) {
      return {
        type: 'buff',
        badge: '東京鼎力相助 (+0s)',
        title: '因果連鎖：根回破冰（東京技術支援）',
        effectText: '因上回合成功導入日式「根回」機制，東京團隊在會前全力協調，日方標準平穩落地！',
        hint: '【組織情報】在北京合資廠切換為「指揮官模式」（方案 B）明確定義作戰方針，能徹底釋放產能。',
        timePenalty: 0
      };
    }
    if (roundIndex === 2) {
      return {
        type: 'buff',
        badge: '供應鏈暢通無阻 (+0s)',
        title: '因果連鎖：指揮官模式奏效（北京產能爆發）',
        effectText: '上回合成功切換指揮官模式，北京產能全線爆發，關鍵物流網絡提早貫通！',
        hint: '【組織情報】面對德美決策撕裂，建立「D 與 d 雙軌宣告協定」（方案 B），即可兼顧德國的石碑承諾與美國的敏捷速度。',
        timePenalty: 0
      };
    }
    return {
      type: 'buff',
      badge: '四方聯防 · 時間獎勵 (+15s)',
      title: '因果連鎖：跨文化信任紅利（應變時間增至 75 秒）',
      effectText: '各據點彼此建立深厚跨文化互信，東京、北京與法蘭克福團隊全線待命支援！應變時間增加至 75 秒！',
      hint: '【組織情報】針對不同戰線有意識地在四大領導象限動態切換（方案 B），是贏得全球淨零大捷的唯一解方！',
      timePenalty: -15
    };
  } else {
    if (roundIndex === 1) {
      return {
        type: 'penalty',
        badge: '全班共業 · 日方心防緊閉 (-30s)',
        title: '因果連鎖：日方心防緊閉（全班研討時間強制縮短 30 秒）',
        effectText: '因上回合強行打破日本稟議秩序，日方心防緊閉且消極抵制！全班本輪研討時間強制縮短 30 秒！',
        hint: null,
        timePenalty: 30
      };
    }
    if (roundIndex === 2) {
      return {
        type: 'penalty',
        badge: '全班共業 · 產線停擺與過載 (-30s)',
        title: '因果連鎖：產線停擺與過載（全班研討時間強制縮短 30 秒）',
        effectText: '因上回合管理失調導致產線延誤，團隊身心俱疲！全班本輪研討時間強制縮短 30 秒！',
        hint: null,
        timePenalty: 30
      };
    }
    return {
      type: 'penalty',
      badge: '全班共業 · 內部信任赤字 (-15s)',
      title: '因果連鎖：內部信任赤字（應變時間壓縮至 45 秒）',
      effectText: '因前幾輪跨文化摩擦累積，東京拒絕背書、北京推卸責任、巴黎堅持罷工！應變時間壓縮至 45 秒！',
      hint: null,
      timePenalty: 15
    };
  }
}

export function publicRound(index, options = false, worldState = {}) {
  const round = rounds[index] || rounds[0];
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

export function outcome(roundIndex, vote) {
  if (!vote) return null;
  const round = rounds[roundIndex] || rounds[0];
  const choice = vote.choice || 'A';
  if (choice === 'X' && round.breakdown) {
    return {
      ...round.breakdown,
      baseline: round.baseline,
      reduction: round.baseline - round.breakdown.tension
    };
  }
  const optIdx = round.options.findIndex(o => o.id === choice);
  const option = optIdx >= 0 ? round.options[optIdx] : round.options[0];
  const short = option.shortTitle || neutralTitles[roundIndex]?.[optIdx] || option.title;
  return {
    ...option,
    shortTitle: short,
    baseline: round.baseline,
    reduction: round.baseline - option.tension
  };
}
