# 《Project ATLAS：Vercel 完整部署手冊與課堂上線指南》

本專案（`Project ATLAS` 跨文化組織行為學沉浸式決策博弈系統）採用 **100% 零外掛純靜態技術架構**（Pure HTML5 + Modern CSS + Web Audio API + Vector SVG Graphics）。
**無需 Node.js 構建步驟、無需 npm install、無需後端資料庫**，上傳至 Vercel 即可享有全球 Anycast 高速 CDN，10 秒內完成全球上線！

---

## 雙端獨立網址架構（重點說明）

部署完成後，系統將具備兩個相互獨立、各司其職的乾淨網址：

1. **學員參與者網址（手機端掃碼進入）**：
   * **網址格式**：`https://<您的專案名稱>.vercel.app/`
   * **對應檔案**：`index.html`
   * **功能**：專門為手機直式螢幕優化，學員初次進入需輸入姓名並選取組別（第 1 組至第 5 組，**不顯示一組應有多少人**），組內研討 2 分鐘後送出該組代表決策。
2. **簡報者主控台網址（電腦大螢幕投影）**：
   * **網址格式**：`https://<您的專案名稱>.vercel.app/host`
   * **對應檔案**：`host.html`
   * **功能**：專門為電腦寬螢幕（16:9 投影）優化，即時掌握 5 組 100 點 CQ 生命值血條與各組已送出狀態，內建倒數計時器、節奏主控（揭曉判定與進入下一回），並可投影學員端專屬加入 QR Code。

---

## 快速準備：專案目錄檔案結構

- **`index.html`**：學員手機端入口（含登入驗證、情境題、4 個專業選項、代表送出決策）。
- **`host.html`**：簡報者大螢幕主控台（含 5 組血條監控、計時器、情境背景與 CQ 判定覆盤）。
- **`vercel.json`**：Vercel 全域路由與靜態重寫配置檔（設定 `/host -> host.html` 與 `/ -> index.html`）。
- **`.gitignore`**：防呆過濾檔（自動排除 docx 與大型 pdf）。

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
打開 Mac 的「終端機」（Terminal），依序執行以下指令（將 `<您的GitHub帳號>` 換成您的真實名稱）：

```bash
cd /Users/routertt/Documents/OB/project-atlas

# 1. 確保 git 倉庫狀態乾淨
git add .
git commit -m "feat: complete split host and participant URLs with non-obvious subtle dilemmas"

# 2. 綁定 GitHub main 分支
git branch -M main
git remote add origin https://github.com/<您的GitHub帳號>/project-atlas-cq.git

# 3. 推送上傳至 GitHub
git push -u origin main
```

---

### 步驟 3：在 Vercel 匯入並一鍵發布
1. 開啟 [Vercel 官方網站 (https://vercel.com)](https://vercel.com) 並登入（建議直接以 GitHub 帳號登入）。
2. 在 Vercel 控制台（Dashboard）點擊右上角的 **「Add New...」➔「Project」**。
3. 在「Import Git Repository」列表中，找到剛才建立的 **`project-atlas-cq`**，點擊 **「Import」**。
4. 在「Configure Project」設定畫面中：
   - **Framework Preset**：選擇 **Other**。
   - **Root Directory**：維持 `./`（預設值）。
   - **Build and Output Settings**：維持預設（無需任何 build command）。
5. 點擊藍色的 **「Deploy」** 按鈕！
6. 等待約 5~10 秒，頁面即會跳出彩帶畫面「Congratulations!」，代表部署成功！

---

## 課堂現場使用指引

1. **投影機投射大螢幕**：
   * 簡報者在電腦瀏覽器開啟：`https://<您的專案名稱>.vercel.app/host`。
   * 點擊右上角的 **「[ 課堂掃碼 ]」**，畫面中央即會浮現手機加入 QR Code。
2. **學員手機掃碼加入**：
   * 學員使用手機鏡頭掃描投影幕上的 QR Code，手機自動連至：`https://<您的專案名稱>.vercel.app/`。
   * 學員在手機上輸入姓名、選取組別（第 1 組至第 5 組，無預設人數限制）。
   * 大螢幕即時統計並顯示簽到在線總人數。
3. **進行對話生存博弈**：
   * 簡報者宣布開始組內研商（計時 2 分鐘）。
   * 各組學員在手機上討論 4 個看似合理的商務方案，選取後點擊「[ 確認送出代表決策 ]」。
   * 大螢幕顯示各組完成決策後，簡報者點擊「[ 揭曉各組選擇與 CQ 判定 ]」，觸發扣血動效與深入覆盤！
