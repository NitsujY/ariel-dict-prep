# Ariel's Word Playground 🎈

一個溫柔、無壓力嘅英文串字遊戲 App，專為 5 歲小朋友默書預習而設。
完全靜態，無後端、無帳戶、無追蹤，可直接部署到 GitHub Pages。

A gentle, no-pressure English spelling game for a 5-year-old's dictation prep.
Fully static: no backend, no accounts, no tracking. Deploys to GitHub Pages.

## 遊戲模式 Game modes

| 模式 | 玩法 |
|---|---|
| 🔊 聽聽搵搵 Listen & Find | 聽一個完整英文詞，從 2–3 個選項中搵出佢（熱身用） |
| 🧩 填填字母 Missing Letters | 填返缺少嘅字母（如 `□ a p p y`），大字母按鈕輸入，可隨時改答案 |
| 🔍 改改錯字 Fix the Word | 詞語有一個字母寫錯咗，搵出嚟再改返啱 |

每個遊戲：預覽詞語／聆聽 → 㩒「我準備好喇」→ 作答 → 溫柔回饋 → 手動下一題。
每輪預設 3 題，完成後由小朋友揀「全部完成」或「再玩一次」，絕不自動開新局。
任何時候都可以：再聽一次、睇完整詞語（提示）、跳過、離開。
無計時、無生命值的、無分數壓力；用提示永遠唔會有懲罰。

## 本地開發 Local development

```bash
npm install
npm run dev        # 開發伺服器
npm test           # 單元測試（問題產生、缺字位置、重複字母、JSON 匯入驗證）
npm run build      # 產生 dist/
npm run preview    # 預覽 production build
```

## 字表 Word lists

- 內建字表喺 `src/data/lists.json`（初始六個詞：tall, pretty, lovely, smart, happy, helpful）。
  要更新內建字表：改呢個檔案再重新部署。喺 App 入面編輯**唔會**改動 repository。
- App 入面（家長模式）可以：貼上詞語（每行一個）、新增／編輯／刪除自訂字表、
  揀選今次練習嘅詞語子集、調整難度（隱藏字母位置、選項數目、每輪題數等）。
- 詞語保留家長輸入嘅大小寫；空白行同重複詞語會提示，唔會靜靜雞改你啲字。

## 語音 Audio

- 用瀏覽器 `speechSynthesis` 讀出完整英文詞（預設 en-GB，家長可揀聲音同語速）。
- 如果某個詞有 `audio` 檔案路徑（放喺 `public/` 入面），會優先播放錄音。
- 瀏覽器唔支援語音時會顯示提示，請家長讀出詞語 — 唔會阻礙遊戲。
- 部分瀏覽器需要用戶先㩒過嘢先播到聲；App 內所有流程都係由小朋友主動㩒掣開始。

## 資料與私隱 Data & privacy

- 自訂字表、設定、練習紀錄全部只存喺該裝置瀏覽器嘅 localStorage（格式有版本號 `awp:v1`）。
- **資料唔會自動同步到其他裝置。** 轉裝置前請用「匯出 JSON」備份，再喺新裝置「匯入」。
- 練習紀錄只記：字表、詞語、遊戲模式、難度分類（聽辨／有提示填字／無提示填字）、
  答啱與否、重試次數、跳過、有冇用提示。無「掌握度」分數，無計時指標，無任何個人資料或追蹤。
- 瀏覽器儲存唔可用時，App 會顯示提示並繼續運作（但唔會保留更改）。

## 部署到 GitHub Pages Deployment

1. Push 去 GitHub repository 嘅 `main` branch。
2. Repository **Settings → Pages → Source 揀 “GitHub Actions”**。
3. `.github/workflows/deploy.yml` 會自動 build + 測試 + 部署。

子路徑（`https://user.github.io/repo-name/`）已經處理好：
Vite `base: './'`（相對路徑載入所有 JS/CSS/JSON/audio）＋ hash routing（`#/...`），
唔使任何 server rewrite，亦唔使逐個 repo 改設定。

## 限制 Limitations

- 唔保證離線可用：靜態 hosting 同瀏覽器語音都唔等於 offline support。
- 語音質素視乎瀏覽器同作業系統安裝咗嘅英文聲音。
- 自動 phonics 教學（字母音、拼音規則）**唔喺 MVP 範圍**；App 只讀完整詞語。
- localStorage 會喺清除瀏覽器資料時消失 — 重要字表請匯出備份。

## 未來可能擴充 Future ideas (not built)

- 短句／小故事模式
- 完整詞語默寫模式
- PWA 離線支援
- 家長控制嘅難度建議

## 技術 Stack

React + TypeScript + Vite。無 router、無 state library、無 CSS framework — 刻意保持簡單。
模組：`questions.ts`（出題邏輯，純函數）、`wordlists.ts`（字表／匯入匯出）、
`audio.ts`（語音）、`storage.ts`（本地儲存）、`records.ts`（紀錄統計）、`i18n.ts`（介面文字，預留本地化）。
