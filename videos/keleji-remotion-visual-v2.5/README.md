# Keleji V2.5 多來源B-roll測試

獨立專案/workspace/videos/keleji-remotion-visual-v2.5。MilkBrollV25：1080×1920、30fps、360格、12秒、H.264、無旁白。保留舊Composition原碼；V2.2/2.3/2.4、HyperFrames及GPT-SoVITS目錄不變。

## 實際內容與限制
兩個實拍來源：Pexels6535488及11158788。倒奶全幅 → 兩來源真實影片分割比較 → 右窗連續擴展至停止倒入／液面收束特寫。不同於V2.4單一實拍背景；不是複製同一杯或把不同物件假合成同一桌面。中段畫面不代表指定商品，也未測量200mL。片尾無延長停格。右側青綠原片調低飽和並減亮部，仍可看出原片風格差異，不宣稱完全一致。

無PEXELS_API_KEY，本輪使用一般搜尋與人工查核官方來源。三個新候選官方CDN403，未繞過；改用已保存的合法兩來源。每段3個候選方案有選用／備選／403狀態，並非3段皆可下載。這是可追溯curation流程，不是已完成全自動Pexels搜尋。

## 四份可重用紀錄
- scene-plan.json：每段需要看見的事件、鏡頭任務、文字及資料連結。
- broll-candidates.json：具體動作查詢、候選／作者／授權日／尺寸長度／裁切起訖／理由，未知保留null。
- asset-manifest.json：實際兩來源與三個工作trim、hash、規格與授權。
- edit-timeline.json：剪輯區間、分割版面、動作銜接、調色及示意標註。

可套用不同主題時保留schema_version，重新查證資料、素材授權與事件適配，不能只替換關鍵詞就宣稱已選片。tools/validate-v25-plan.py檢查來源、區間、hash、200mL計算與三段計畫。

## 重建與檢查
Node.js、Chromium、FFmpeg必要，Python QA需numpy/Pillow/fontTools。現環境node_modules只沿用舊依賴符號連結，未重新安裝。在新目錄還原專案備份後：

```sh
npm ci
python tools/acquire-v25.py
npm run studio
npm run typecheck
python tools/validate-v25-plan.py
node tools/render-v25.mjs --stills
python tools/storyboard-v25.py
node tools/render-v25.mjs --preview
# View materials and full preview before master
node tools/render-v25.mjs
node tools/verify-v25-seek.mjs
python tools/qa-v25.py
node tools/check-public.mjs
python tools/package-v25.py
```

缺工作片可從備份還原；acquire-v25.py接受--source653及--source111的合法原檔路徑，依原hash重建。可選--download只走官方CDN並在403停止，不繞過防護。不同FFmpeg版本可能產生不同衍生hash，需人工核對更新。若要查看繼承的舊Composition，還需還原相對應的舊工作素材。

Codex連網與本機渲染服務使用正式network權限，保留代理及CA。Chromium預設/usr/bin/chromium，可指定REMOTION_BROWSER_EXECUTABLE。Studio3105，輸出/workspace/outputs/visual-v2.5。正式原始MP4與交付copy各自ffprobe、hash核對；預覽另標540p。

## 保存
Git只放非敏感程式、資料、鎖定檔、OFL字型與繼承的原創圖，排除所有MP4、私人聲音、模型、金鑰及node_modules。工作備份含本次實際三個trim供本片還原，不作stock再散布。請下載ZIP另存持久位置，不把Codex暫存空間當永久備份。素材／資料來源見docs/SOURCES-V25.md；差異與美術檢查見docs/DIFF-QA-V25.md；舊V2.2–2.4文件保持歷史用途。
