# 《Project ATLAS：Vercel 完整部署手冊與課堂上線指南》

本專案（`Project ATLAS` 跨文化組織行為學沉浸式決策博弈系統）採用 **100% 零外掛純靜態技術架構**（Pure HTML5 + Modern CSS + Web Audio API + Vector SVG Graphics）。
**無需 Node.js 構建步驟、無需 npm install、無需後端資料庫**，上傳至 Vercel 即可享有全球 Anycast 高速 CDN，10 秒內完成全球上線！

---

## 快速準備：專案目錄檔案結構

專案目錄內已備妥上線所需的核心檔案，並已配置好 `.gitignore`（自動排除本地的作業 Word 檔與大容量 PDF，僅上傳網頁主程式）：

- **`index.html`**：主要網頁入口（包含雙軌同步研商、觀點辯論、即時不滿指數評測、CQ 身心腦拼裝與大螢幕開票系統）。
- **`vercel.json`**：Vercel 全域路由與靜態重寫配置檔。
- **`.gitignore`**：防呆過濾檔（避免將本機的課程筆記、報告 docx 及 40MB 的 PDF 誤傳至雲端）。

---

## 部署方案一：GitHub ＋ Vercel 雲端自動持續部署（強烈推薦）

這是最穩定、最標準的部署方式。日後只要本地檔案修改並 push，Vercel 就會**自動更新線上網址**！

### 步驟 1：在 GitHub 建立新儲存庫（Repository）
1. 開啟 [GitHub (https://github.com)](https://github.com) 並登入帳號。
2. 點擊右上角的 **「+」➔「New repository」**。
3. 設定：
   - **Repository name**：輸入專案名稱，例如 `project-atlas-cq` 或 `ob-game`。
   - **Visibility**：選擇 **Public**（或 Private 皆可）。
   - **Initialize this repository with**：**不要勾選** README、.gitignore 或 license（維持空白）。
4. 點擊綠色的 **「Create repository」**。

### 步驟 2：在 Mac 終端機（Terminal）將專案推送至 GitHub
打開 Mac 的「終端機」（Terminal），依序複製貼上以下指令（記得將 `<您的GitHub帳號>` 與 `<倉庫名稱>` 換成您的真實名稱）：

```bash
cd /Users/routertt/Documents/OB

# 1. 初始化 Git 倉庫
git init

# 2. 將網頁程式加入版本控制（.gitignore 已自動排除 docx 與大型 pdf）
git add .

# 3. 建立首次提交
git commit -m "feat: complete Project ATLAS with parallel war room and professional OB terminology"

# 4. 綁定 GitHub main 分支
git branch -M main
git remote add origin https://github.com/<您的GitHub帳號>/project-atlas-cq.git

# 5. 推送上傳至 GitHub
git push -u origin main
```

---

### 步驟 3：在 Vercel 匯入並一鍵發布
1. 開啟 [Vercel 官方網站 (https://vercel.com)](https://vercel.com) 並登入（建議直接以 GitHub 帳號登入）。
2. 在 Vercel 控制台（Dashboard）點擊右上角的 **「Add New...」➔「Project」**。
3. 在「Import Git Repository」列表中，找到剛才建立的 **`project-atlas-cq`**，點擊 **「Import」**。
4. 在「Configure Project」設定畫面中：
   - **Framework Preset**：選擇 **`Other`**。
   - **Root Directory**：維持預設的 `./`。
   - **Build and Output Settings**：維持預設（不需要任何構建指令）。
5. 點擊下方的 **「Deploy」**！
6. 等待約 10~15 秒，畫面即會噴發彩帶祝賀，並提供您的專屬線上網址（例如：`https://project-atlas-cq.vercel.app`）！

---

## 部署方案二：使用 Vercel CLI 終端機指令（1 分鐘極速發布）

如果您希望不透過 GitHub、直接從本機終端機推送到 Vercel：

打開 Mac 終端機，執行以下指令：

```bash
cd /Users/routertt/Documents/OB

# 直接使用 npx 執行 vercel 部署（免預先安裝套件）
npx vercel --prod
```

終端機會出現幾道快速引導詢問，請直接依序回答：
1. `Set up and deploy "~/Documents/OB"?` ➔ 輸入 `y` 按 Enter。
2. `Which scope do you want to deploy to?` ➔ 按 Enter（選擇您的個人帳號）。
3. `Link to existing project?` ➔ 輸入 `n` 按 Enter。
4. `What’s your project’s name?` ➔ 輸入 `project-atlas-cq`（或直接按 Enter）。
5. `In which directory is your code located?` ➔ 直接按 Enter（預設 `./`）。

Vercel 就會直接將 `index.html` 發布至雲端，終端機最後會直接列印出您的專屬正式網址！

---

## 課堂現場展示與手機掃碼連線注意事項

1. **大螢幕動態 QR Code 自動連動**：
   - 當您使用 Vercel 網址開啟大螢幕時（例如 `https://project-atlas-cq.vercel.app`），系統開場大廳的 QR Code 就會**自動以該網址即時生成 QR Code**！
   - 現場學員只需拿起手機相機對準投影幕掃描，即可直接進入該線上網址進行選組與投票。
2. **大螢幕投影比例**：
   - 系統已內建向量 SVG 背景與彈性排版，無論投影機為 16:9、16:10 或 4K 解析度均會滿版自適應。
3. **音效播放提示**：
   - 瀏覽器為符合現代安全性規範，需要由使用者在畫面上進行第一次點擊（例如點擊「開始遊戲」或組別選項）以啟動 Web Audio 合成音效引擎。
4. **離線緊急備援機制**：
   - 即使教室臨時斷網，您也可以直接在 Mac 上雙擊開啟本地的 `index.html`，所有向量畫面、計時器、音效與決策邏輯依然 100% 完整運作。
