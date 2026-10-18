# Project ATLAS：跨文化組織行為實體決策博弈系統
### （Organizational Behavior Cultural Intelligence Decision Game）

> **理論核心架構**：P. Christopher Earley & Elaine Mosakowski (2004) *Cultural Intelligence (CQ)* ＋ Erin Meyer (2015) *The Culture Map*  
> **系統技術架構**：100% 零外掛純靜態技術（Pure HTML5 + Modern CSS + Web Audio API + Vector SVG Graphics），零伺服器依賴，Vercel 一鍵秒級部署。

---

## 專案核心特色與機制

1. **五組非對稱資訊隔離陣營（2 : 2 : 1 分配）**：
   - **美式總部決策席（第 1、2 組）**：低語境契約主義，負有受託人責任（Fiduciary Duty）與發布會交付時程承諾。
   - **東京分部研發席（第 3、4 組）**：高語境和諧名譽，捍衛 98.4% 良率晶片品質與工程專業誠信，面臨代工廠產能受阻困局。
   - **全局協調智囊席（第 5 組）**：唯一掌握雙方關鍵限制情資的變色龍團隊，進駐協調審判席，推導 CQ 整合方案。
2. **第一階段：雙軌同步研商（Parallel War Room・2 分鐘同步計時）**：
   - 總部與分公司去依賴化，各自閉門研商 2 分鐘（120 秒），權衡可行代價；第 5 組全局情資席同步觀察雙方溝通動態。
3. **第二階段：觀點對話辯論（Live Debate Arena・雙階段 4 分鐘交鋒）**：
   - **階段一**：各組 2 分鐘研商辯論策略並推選代表發言。
   - **階段二**：雙方代表 2 分鐘現場正面觀點對話！全場學員隨時透過手機即時評測不滿指數（超滿意、滿意、普通、不滿、超不滿）。
4. **第三階段：文化智商整合方案（CQ Architect Console）**：
   - 第 5 組自由配置 Earley (2004) CQ 三大維度（Head 認知、Body 行為、Heart 動機，共 64 種組合），並由全班 4 個小組進行共識程度登記。
5. **第四階段：組織行為學終局理論覆盤（Theory Debrief）**：
   - 深入剖析制度性善意的結構性碰撞、當責（Accountability）定義的文化分歧，以及高 CQ 協調者的領導特質。
6. **真實上課人數動態推斷引擎（ClassroomRoster System）**：
   - 學員手機掃描開場 QR Code 選組後，系統自動加總各組實際人數，所有票數比重、不滿指數母數與結算公式全自動即時加權計算。

---

## 資料夾檔案清單與用途

| 檔案名稱 | 說明 |
| :--- | :--- |
| **`index.html`** | **主要入口網頁**。包含遊戲全流程、音效合成器、純向量場景插畫與即時開票系統（Vercel 預設載入）。 |
| **`project_atlas_cq_game.html`** | 本地同名鏡像備份檔案（與 `index.html` 內容與 SHA-256 雜湊碼嚴格一致）。 |
| **`vercel.json`** | Vercel 部署設定檔（包含 Clean URLs 與 Single-Page Application 靜態路由重寫）。 |
| **`.gitignore`** | Git 版本控制過濾設定檔（自動排除 Word 與大型 PDF 檔案）。 |
| **`README.md`** | 本專案綜合說明文件。 |
| **`VERCEL_DEPLOYMENT_GUIDE.md`** | **Vercel 一鍵極速部署教學手冊**（提供 GitHub 連動與 CLI 兩種方式）。 |
| **`Mechanism3_FactionBattle_Presentation_Guide.md`** | **課堂演講實戰指南**（包含 31 人各組角色設定、流程掌控與主持人 8 分鐘逐字稿小抄）。 |
| **`Peter_5Min_Interactive_Showcase_Plan.md`** | 5 分鐘高階互動展示演練大綱。 |
| **`CQ_Immersive_Game_Proposal.md`** | 沉浸式跨文化商業博弈專案初始架構提案書。 |

---

## 快速啟動與部署

### 1. 本機雙擊直接運行（完全離線可用）
- 直接使用 Chrome、Safari 或 Edge 等現代瀏覽器雙擊打開 **`index.html`** 即可立即開始。
- 無需連接網路，所有圖形（Vector SVG）與音效（Web Audio）皆在瀏覽器端即時運算產生。

### 2. Vercel 極速上線（10 秒完成全球 CDN 發布）
在此資料夾目錄下打開 Mac 終端機（Terminal）：

```bash
# 方式 A：使用 Vercel CLI 直接部署
npx vercel --prod

# 方式 B：使用 Git 推送至 GitHub 再由 Vercel 匯入
git init
git add .
git commit -m "feat: initial commit for Project Atlas"
git branch -M main
git remote add origin https://github.com/<您的GitHub帳號>/project-atlas.git
git push -u origin main
```
詳細步驟請參閱 [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)。
