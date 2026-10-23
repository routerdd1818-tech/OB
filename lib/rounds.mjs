export const rounds = [
  {
    id: 0,
    dimension: '象限一【平等 × 共識導向】· 荷蘭與斯德哥爾摩的大 D 承諾',
    color: '#d97706',
    speaker: '荷蘭技術總監·范德堡',
    location: 'Act 1 · 斯德哥爾摩總部（象限一：平等 × 共識導向）',
    miniLabel: '斯德哥爾摩總部 · 綠能戰情會議室',
    seconds: 180,
    title: '阿姆斯特丹與斯德哥爾摩的「共識困局」',
    context: '瑞典與荷蘭聯合研發團隊召開跨國淨零物流啟動會議。團隊秉持「平等主義（Egalitarian）」與「共識導向（Consensual）」，全員皆有權直抒己見；但在面對緊迫交付時程時，會議陷入各持己見的長考與分析癱瘓。',
    dialogue: [
      { who: '荷蘭技術總監', text: '「在我們平等的文化裡，每個人都必須充分參與並達成真正共識。決策一旦拍板就是神聖的『大寫 D』，不能草率！」' },
      { who: '瑞典專案主管', text: '「但若下週還沒共識，專案就會延誤。有人提議由主管直接強制拍板，但這會徹底破壞團隊的平等信任……」' },
      { who: '團隊核心成員反饋', text: '「若主管為求快而強行由上而下拍板，只會引發技術團隊消極抗命，甚至推翻決策。」' }
    ],
    prompt: '面對象限一「平等 × 共識導向（大 D）」的文化特質，領導者該採取什麼決策機制？',
    baseline: 78,
    juryRole: {
      title: '【公司方】北歐技術審查代表席',
      short: '公司方 · 北歐團隊',
      counterpart: '跨國研發決策小組',
      stance: '你們是北歐與荷蘭在地的技術骨幹。在象限一文化中，決策必須經過全員平等辯論與深度共識凝聚，一旦拍板就是不可輕易翻案的「大 D」。請評定誰真正理解象限一的運作法則！',
      pitchTarget: '向第 5 組【公司方 · 北歐技術審查代表席】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '主管由上而下發布強制最後通牒',
        text: '主管直接行使最高權力，要求全員在 24 小時內停止爭論並按指定時程執行。',
        result: {
          cq: -20,
          reduction: -5,
          tension: 83,
          shortTitle: '強權通牒',
          verdict: '⚠️ 激化對立，團隊全線質疑領導公正性',
          analysis: '誤將「由上而下模式」強套在「平等 × 共識」的團隊，粗暴打破全員參與的心理安全感，導致信任破裂。',
          blindspot: '正如 Meyer 所言：在象限一（荷蘭、瑞典、丹麥），主管的角色是促進者（Facilitator）。獨斷拍板會被視為專橫與外行。',
          quadrant: { x: 85, y: 15, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'B',
        title: '建立結構化共識機制，收斂為「大 D」神聖承諾',
        text: '設定清楚的決策框架與評估準則，引導平等開放辯論後收斂分歧，凝聚全員背書的神聖「大寫 D」里程碑。',
        result: {
          cq: 25,
          reduction: 18,
          tension: 60,
          shortTitle: '大 D 凝聚',
          verdict: '🎉 尊重平等精神並高效凝聚神聖共識',
          analysis: '精準落實象限一的核心解方：在平等架構下以客觀標準引導全員合意，一旦達成共識即刻在石碑上不可動搖。',
          blindspot: '平等與共識需要「結構引導」，而非放任無序爭論。建立透明的標準是凝聚大 D 的關鍵。',
          quadrant: { x: 25, y: 80, zone: '共識 × 平等區' }
        }
      },
      {
        id: 'C',
        title: '無限期交給基層自行形式投票',
        text: '完全採行全員無記名投票，由簡單多數決決定是否如期上線。',
        result: {
          cq: -10,
          reduction: 2,
          tension: 76,
          shortTitle: '形式多數',
          verdict: '⚠️ 陷入分析癱瘓與少數派消極抵抗',
          analysis: '形式化多數決並非真正共識，落敗方仍會消極抵制，且缺乏領導者統整會導致專案時程延宕。',
          blindspot: '共識導向追求的是「各方理解並共同承諾」，簡單粗暴的舉手表決只會掩蓋根本歧見。',
          quadrant: { x: 15, y: 70, zone: '共識 × 平等區' }
        }
      },
      {
        id: 'D',
        title: '交給總部工程師直接獨裁拍板',
        text: '不理會荷蘭與北歐在地反應，由外地主管直接行使最高權限指定最終技術方案。',
        result: {
          cq: -15,
          reduction: -2,
          tension: 80,
          shortTitle: '獨裁拍板',
          verdict: '💥 釀成嚴重抗命與技術團隊出走',
          analysis: '展現了典型的文化盲目，完全摧毀了在地團隊的主人翁意識，導致後續維運全面癱瘓。',
          blindspot: '在重視平等的社會中，缺乏參與感會直接摧毀團隊的執行意願與敬業度。',
          quadrant: { x: 70, y: 20, zone: '由上而下 × 平等區' }
        }
      }
    ],
    hiddenIntel: {
      title: '《第一回合極密情報：大 D 的力量》',
      text: '北歐與荷蘭管理學經典教訓：在象限一文化中，前期花時間凝聚共識雖然慢，但一旦達成「大 D」拍板，後續執行力如同高速列車，零阻力達成目標。'
    }
  },
  {
    id: 1,
    dimension: '象限二【階級 × 共識導向】· 東京團隊的稟議與根回破局',
    color: '#0284c7',
    speaker: '東京研發總監·渡邊',
    location: 'Act 2 · 東京精密研發中心（象限二：階級 × 共識導向）',
    miniLabel: '東京精密總部 · 14 樓跨洋視訊室',
    seconds: 180,
    title: '東京研發總部的「微笑沉默」與稟議僵局',
    context: '跨國架構移交東京研發總部。西方空降主管在跨洋會議上要求日方工程師直球表態並當場拍板；然而東京團隊全員微笑鞠躬、不發一語（建前 Tatemae），會後卻遲遲不肯簽署時程確認書。',
    branchingContext: {
      good: '【東京鼎力相助】因上回合成功導入結構化大 D 機制，北歐與東京團隊建立互信！然而面對日企獨特的「階級森嚴＋全員共識」，西方主管若處理不慎仍可能重蹈覆轍！',
      bad: '【全班共業 · 日方心防緊閉】因上回合強權推動導致跨國戒心升高，日方團隊更加保守封閉，在會議中集體保持沉默！（全班本輪研討時間強制縮短 30 秒！）'
    },
    dialogue: [
      { who: '西方空降主管', text: '「大家不用拘泥職級，有意見就當場直說！同意下週交付的請現在舉手表態！」' },
      { who: '東京渡邊總監', text: '「……（全員微笑鞠躬，現場陷入長達數十秒的徹底寂靜）……」' },
      { who: '日籍資深顧問私下提醒', text: '「在日本『階級森嚴 ＋ 共識導向』的文化中，公開反駁主管或在未經私下充分『根回（Nemawashi）』前要人當眾表態，等同逼人自絕於團隊。」' }
    ],
    prompt: '面對象限二「階層森嚴但追求由下而上共識」的日方團隊，領導者的第一步應該是？',
    baseline: 72,
    juryRole: {
      title: '【公司方】東京精密研發代表席',
      short: '公司方 · 東京團隊',
      counterpart: '西方整合推進小組',
      stance: '你們是東京研發骨幹。在日本文化中，重大決策必須在正式大會前透過「根回」私下磨平疑慮，並由下而上進行「稟議」簽核。請評定誰真正理解象限二的運作法則！',
      pitchTarget: '向第 5 組【公司方 · 東京研發代表席】申辯說服'
    },
    options: [
      {
        id: 'A',
        title: '在公開群組標註日方並要求限期表態',
        text: '以美式直球作風在百人公開頻道發文追問，要求東京主管今日內逐一表態。',
        result: {
          cq: -15,
          reduction: -3,
          tension: 75,
          shortTitle: '公開逼宮',
          verdict: '⚠️ 日方深感名譽受辱，開啟集體防衛機制',
          analysis: '在階級與面子文化中，公開質疑等於當眾羞辱，只會讓日方退入絕對沉默並全面抵制。',
          blindspot: '象限二極度重視「面子文化」與「階層禮節」。在正式公開場合挑戰對方是跨文化溝通的大忌。',
          quadrant: { x: 30, y: 40, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'B',
        title: '導入「根回（Nemawashi）」私下對話與稟議推動',
        text: '暫緩大會表態，由主管在會前私下一對一拜訪各利害關係人摸底，再由日方發起「稟議（Ringi）」由下而上簽核。',
        result: {
          cq: 30,
          reduction: 22,
          tension: 50,
          shortTitle: '根回稟議',
          verdict: '🌟 完美切中日式決策核心，順利解凍專案',
          analysis: '精準落實 Erin Meyer 在象限二的建議：在正式會議前完成私下合意，讓正式會議成為宣告共識的儀式。',
          blindspot: '在日本文化中，真正的決策永遠在會前的走廊、茶水間與一對一摸底中完成。',
          quadrant: { x: 80, y: 75, zone: '共識 × 階層區' }
        }
      },
      {
        id: 'C',
        title: '全面引進第三方顧問進行美式文化培訓',
        text: '花費數週舉辦美式文化洗腦講座，強迫日方工程師習慣公開辯論。',
        result: {
          cq: -20,
          reduction: -8,
          tension: 80,
          shortTitle: '文化強灌',
          verdict: '🔥 引發日方強烈反彈與核心人才流失',
          analysis: '試圖透過外力粗暴改變百年文化習俗，只會造成巨大的跨文化磨擦與信任崩塌。',
          blindspot: '管理學黃金律：永遠是領導者因地制宜調整領導風格，而不是強求在地團隊改變其文化DNA。',
          quadrant: { x: 75, y: 35, zone: '由上而下 × 階層區' }
        }
      },
      {
        id: 'D',
        title: '跳過日方團隊由西方主管全權代簽',
        text: '不理會日方的稟議流程，西方主管直接越俎代庖簽署發布。',
        result: {
          cq: -30,
          reduction: -15,
          tension: 87,
          shortTitle: '越權強推',
          verdict: '💥 失去核心技術支援，品質全面崩盤',
          analysis: '徹底踐踏了日方的專業自尊與組織規程，導致現場工程師完全拒絕為後續品質背書。',
          blindspot: '未經稟議簽核的專案在日企缺乏組織正當性，任何後續問題都將演變為災難。',
          quadrant: { x: 85, y: 20, zone: '由上而下 × 階層區' }
        }
      }
    ],
    hiddenIntel: {
      title: '《第二回合極密情報：根回與稟議的雙核心》',
      text: '日本企業決策真髓：會前一對一私下溝通稱為「根回（Nemawashi）」，由下而上各部門會簽審批稱為「稟議（Ringi）」。掌握雙核心，提案通過率 100%。'
    }
  },
  {
    id: 2,
    dimension: '決策哲學 · 法蘭克福的石碑大 D vs. 紐約的小 d 動態',
    color: '#0d9488',
    speaker: '德國營運長·漢斯',
    location: 'Act 3 · 法蘭克福營運中心（大 D 承諾 vs 小 d 速度）',
    miniLabel: '法蘭克福運營中心 · 戰情室',
    seconds: 180,
    title: '德美跨國團隊的「決策意義」撕裂',
    context: '美德聯合物流團隊開會，美國大老闆短暫討論後興奮宣佈：「Great! We have a decision!」德國團隊隨即花費三天三夜、一絲不苟地落實；幾天後，美國老闆因拿到新數據隨興說：「我們要換個方向。」德國團隊憤怒指責美國人雙面、不誠實。',
    branchingContext: {
      good: '【供應鏈暢通無阻】上回合成功切換指揮官模式，北京產能全線爆發！然而在法蘭克福系統整合階段，美德雙方對決策性質的認知衝突浮上檯面，德國工程師要求守住大 D 承諾！',
      bad: '【全班共業 · 橫向孤立與過載】因上回合管理失調導致產線延誤，團隊身心俱疲！此時美國老闆又隨興翻案，德國團隊怒不可遏，瀕臨全面罷工！（全班本輪研討時間強制縮短 30 秒！）'
    },
    dialogue: [
      { who: '德國營運長·漢斯', text: '「我們已經依照合約與承諾把物流網架構刻在石碑上了！你怎麼可以說改就改？你們根本不尊重承諾！」' },
      { who: '美國老闆', text: '「這只是個小寫 d 的動態里程碑啊！有新數據不趕快修正，盲目執行才是愚蠢吧？」' }
    ],
    prompt: '面對美德雙方對「大寫 D（承諾）」與「小寫 d（速度）」的哲學衝突，你們該建立什麼機制？',
    baseline: 68,
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
        text: '要求德國團隊學會矽谷的敏捷精神，隨時準備推翻重來。',
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
        text: '規定每次開會結束前，主持人必須明確宣告：這是一次需要長遠對齊的「大寫 D（最終承諾）」，還是一次隨時可以調整的「小寫 d（動態測試）」。',
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
        text: '所有大小決議都必須經過數週的書面審查與全體同意才準執行。',
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
        text: '美國人隨便改美國的，德國人慢慢做德國的，開會各說各話。',
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
    ],
    hiddenIntel: {
      title: '《第三回合極密情報：德意志銀行的教訓》',
      text: '教訓證明：在共識導向的國家，主管必須「先花時間贏得支持，才能宣佈定案」。'
    }
  },
  {
    id: 3,
    dimension: '跨文化四象限調適 · 全球淨零碳排決戰',
    color: '#7c3aed',
    speaker: '聯合國永續發展特使',
    location: 'Act 4 · 全球淨零高峰會（四大象限四方終極交鋒）',
    miniLabel: '全球淨零高峰會 · 總裁指揮中心',
    seconds: 60,
    title: '波士頓（美）× 東京（日）× 巴黎（法）× 北京（中）的四方紅線交鋒',
    context: '全球綠能快遞面臨最終淨零碳排上線關頭！波士頓總部（平等＋小 d 速度）要求立刻全面發布；東京（階層＋大 D 共識）要求重新跑完三個月稟議；巴黎（階層＋小 d 指揮）要求聽從指揮但拒絕週末加班；北京（階層＋指揮）要求提供極為詳細的中央作戰清單。四方陷入終極死鎖，且任一方拒絕即宣告破局。',
    branchingContext: {
      good: '【四方聯防 · 綠能先驅】距離全球淨零發布僅剩 60 分鐘，外界高度關注！關鍵時刻，東京、北京與法蘭克福團隊並肩待命，等待你在高峰會上的最終拍板！',
      bad: '【全班共業 · 內部信任赤字】距離全球發布僅剩 60 分鐘！因前幾輪跨文化摩擦累積，東京拒絕背書、北京推卸責任、巴黎堅持罷工，聯合國特使在後台下達最後通牒！（全班本輪應變時間壓縮至 45 秒！）'
    },
    dialogue: [
      { who: '波士頓總部', text: '「氣候危機刻不容緩，不要管程序了，立刻全面上線！」' },
      { who: '東京辦公室', text: '「沒有完成全體共識與稟議合規，東京絕不背書！」' },
      { who: '巴黎分公司', text: '「我們同意總部，但依據法國勞基法，週末絕對不加班！」' },
      { who: '北京分公司', text: '「請給我們詳細的中央指揮清單，否則基層無所適從！」' }
    ],
    prompt: '面對橫跨四大領導象限的四方衝突，你們的終極整合拍板是？',
    baseline: 62,
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
        text: '無視東京的稟議、巴黎的勞基法與北京的指揮需求，由總部強制一鍵全球上線。',
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
        text: '採用 Meyer 的核心結論：針對波士頓採用小 d 敏捷，針對東京預留根回與大 D 稟議期，針對巴黎落實勞動權益對話，針對北京給予精準指揮清單。在不同戰線切換對應的領導象限。',
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
        text: '放棄全球同步，讓波士頓、東京、巴黎、北京各自決定何時轉型。',
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
        text: '無限期擱置專案，將所有高管送往跨文化訓練營。',
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
      text: '若多方表態中有任何一方選擇拒絕，即觸發全班共業警報,專案宣告破局。'
    },
    hiddenIntel: {
      title: '《第四回合極密情報：動態切換》',
      text: 'Erin Meyer 的終極結論：成功的跨國領導者從不依賴單一母文化的套路。看清對方的文化座標，有意識地在不同象限切換，是贏得全球戰局的唯一解方。'
    }
  }
];

export const neutralTitles = rounds.map(r => r.options.map(o => o.title));

export function publicRound(index, options = true, worldState = {}) {
  const round = rounds[index] || rounds[0];
  const copy = { ...round };
  delete copy.hiddenIntel;
  if (!copy.seconds) copy.seconds = index === 3 ? 60 : 180;
  if (!copy.miniLabel) {
    copy.miniLabel = index === 0 ? '東京精密總部 · 14 樓跨洋會議室'
      : index === 1 ? '北京合資物流基地 · 中央調度室'
      : index === 2 ? '法蘭克福運營中心 · 戰情室'
      : '全球淨零高峰會 · 總裁指揮中心';
  }
  if (!copy.location) {
    copy.location = index === 0 ? 'Act 1 · 斯德哥爾摩與東京（權威與共識）'
      : index === 1 ? 'Act 2 · 北京合資物流廠（美式授權 vs 階級指揮）'
      : index === 2 ? 'Act 3 · 法蘭克福營運中心（大 D 承諾 vs 小 d 速度）'
      : 'Act 4 · 全球淨零高峰會（四大象限四方終極交鋒）';
  }
  if (round.branchingContext && worldState) {
    const prevKey = 'r' + index;
    const prevStatus = worldState[prevKey];
    if (prevStatus === 'good' || prevStatus === 'buff') {
      copy.context = round.branchingContext.good || copy.context;
    } else if (prevStatus === 'bad' || prevStatus === 'penalty') {
      copy.context = round.branchingContext.bad || copy.context;
    }
  }
  if (!options) {
    delete copy.options;
  } else if (copy.options) {
    // 嚴格保留使用者設定的完整選項標題與內文，僅剔除未揭曉前之底層答案
    copy.options = copy.options.map(o => ({
      id: o.id,
      title: o.title,
      text: o.text
    }));
  }
  return copy;
}

export function outcome(roundIndex, vote) {
  const round = rounds[roundIndex] || rounds[0];
  const choice = vote?.choice || 'A';
  if (choice === 'X') {
    return {
      id: 'X',
      title: '多方協商破局',
      cq: -25,
      tension: 100,
      reduction: -38,
      shortTitle: '協商破局',
      verdict: '❌ 各方未能達成共識，談判破局',
      analysis: '由於各方堅持單一母國的文化套路，未能進行跨文化象限切換，導致全球溝通斷聯。',
      blindspot: '跨文化管理的死穴，就是期待全世界都用你的方式思考。',
      quadrant: { x: 50, y: 50, zone: '破局中央區' }
    };
  }
  const option = round.options.find(o => o.id === choice) || round.options[0];
  const red = option.result ? option.result.reduction : (option.reduction ?? 0);
  const cq = option.result ? option.result.cq : (option.cq ?? 0);
  const shortTitle = option.result ? option.result.shortTitle : (option.shortTitle || option.title);
  const verdict = option.result ? option.result.verdict : option.verdict;
  const analysis = option.result ? option.result.analysis : option.analysis;
  const blindspot = option.result ? option.result.blindspot : option.blindspot;
  const quadrant = option.result ? option.result.quadrant : option.quadrant;
  const tension = option.tension ?? (round.baseline - red);

  return {
    id: option.id,
    title: option.title,
    cq,
    tension,
    reduction: red,
    shortTitle,
    verdict,
    analysis,
    blindspot,
    quadrant,
    baseline: round.baseline
  };
}

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
        badge: '🌟 前一輪共贏加成',
        title: '跨文化信任紅利累積中',
        effectText: '因前一輪成功破解文化盲點，本輪全班研討時間增加 15 秒，團隊 CQ 韌性顯著提升！',
        hint: '學會切換領導象限帶來的信任，能為下一次跨國危機爭取到更多緩衝時間。',
        timePenalty: 0
      };
    }
    if (roundIndex === 2) {
      return {
        type: 'buff',
        badge: '🌟 前一輪共贏加成',
        title: '跨文化信任紅利累積中',
        effectText: '因前一輪成功破解文化盲點，本輪全班研討時間增加 15 秒，團隊 CQ 韌性顯著提升！',
        hint: '學會切換領導象限帶來的信任，能為下一次跨國危機爭取到更多緩衝時間。',
        timePenalty: 0
      };
    }
    return {
      type: 'buff',
      badge: '🌟 前一輪共贏加成',
      title: '跨文化信任紅利累積中',
      effectText: '因前一輪成功破解文化盲點，本輪全班研討時間增加 15 秒，團隊 CQ 韌性顯著提升！',
      hint: '學會切換領導象限帶來的信任，能為下一次跨國危機爭取到更多緩衝時間。',
      timePenalty: -15
    };
  } else {
    if (roundIndex === 1) {
      return {
        type: 'penalty',
        badge: '⚠️ 前一輪失誤共業',
        title: '跨文化盲點衝擊警報',
        effectText: '因前一輪陷入單一母文化盲區，本輪團隊心防上升，研討時間縮短 30 秒！',
        hint: '跨文化管理容不得理所當然的直覺，必須重新檢視對方的權威與決策邏輯。',
        timePenalty: 30
      };
    }
    if (roundIndex === 2) {
      return {
        type: 'penalty',
        badge: '⚠️ 前一輪失誤共業',
        title: '跨文化盲點衝擊警報',
        effectText: '因前一輪陷入單一母文化盲區，本輪團隊心防上升，研討時間縮短 30 秒！',
        hint: '跨文化管理容不得理所當然的直覺，必須重新檢視對方的權威與決策邏輯。',
        timePenalty: 30
      };
    }
    return {
      type: 'penalty',
      badge: '⚠️ 前一輪失誤共業',
      title: '跨文化盲點衝擊警報',
      effectText: '因前一輪陷入單一母文化盲區，本輪團隊心防上升，研討時間縮短 30 秒！',
      hint: '跨文化管理容不得理所當然的直覺，必須重新檢視對方的權威與決策邏輯。',
      timePenalty: 15
    };
  }
}
