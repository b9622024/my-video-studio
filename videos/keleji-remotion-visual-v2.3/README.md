# Keleji Remotion Visual V2.3

獨立 A/B 視覺製程測試，保留原 V2.2，不修改 HyperFrames 或聲音系統。兩個正式 Composition 均為1080×1920、30fps、120格、4秒、無音軌。

- MilkEditorialA：原創物件 atlas + 改良遮罩／體積累積流量／編輯式鏡頭。風格化合成，不是物理解算。
- MilkFootageB：Pexels #6535488 真實連續倒奶鏡頭 + 精簡標題、裁切、微幅推近。
- MilkPourStudy：V2.2 原始 Composition 比較用，src/MilkPour.tsx及其atlas保持原樣。

## 建置與渲染

Node.js、FFmpeg、Chromium必要；Remotion與React版本鎖定在package-lock.json。當前專案只以node_modules符號連結沿用V2.2環境，沒有安裝或修改舊依賴。新機器解壓至新目錄後：

```sh
npm ci
python tools/acquire-footage.py
npm run studio
npm run typecheck
node tools/render-v23.mjs --stills
node tools/render-v23.mjs --B --stills
node tools/render-v23.mjs
node tools/render-v23.mjs --B
node tools/verify-v23-seek.mjs
python tools/qa-v23.py
node tools/check-public.mjs
```

Codex連網命令及本機Studio/渲染服務須使用工具正式network權限。保留既有HTTP_PROXY/HTTPS_PROXY及CA驗證；不需取消沙箱。

預設瀏覽器/usr/bin/chromium，可用REMOTION_BROWSER_EXECUTABLE覆寫。QA輸出目錄預設/workspace/outputs/visual-v2.3，可直接修改tools/qa-v23.py中的out以移植。Python QA需numpy、Pillow；這兩者為檢查工具，非影片執行依賴。

渲染輸出在out/，A/B master不縮小。--preview明確產生540×960預覽，正式交付不使用預覽。V2.3沒有產生分享轉碼；交付ZIP直接封裝原始MP4，SHA-256與ffprobe見docs/v23-qa-metrics.json。

## 保存與授權

Git包含非敏感原始碼、鎖定檔、原創圖與OFL字型；不包含影片、原始實拍、私人音訊、模型、金鑰、node_modules。實拍取得方式與雜湊在docs/asset-manifest.json，來源及授權見docs/ASSETS-V23.md。

私人工作備份包含本片使用的4秒實拍trim供還原，不在公開Git轉散布原始stock。使用者下載備份另存持久位置；Codex工作區不是永久保存。tools/acquire-footage.py由官方CDN恢復，來源改變會停止；本機FFmpeg不同版本可能讓衍生檔位元組不同，需重新記錄產物hash。

Remotion授權條件見docs/REMOTION-LICENSE.md；本次沒有開通新付費服務或GPU。未安裝GSAP或新渲染依賴；採用已驗證的Remotion內建OffthreadVideo，不修改V2.2相依目錄。

## 文件

- design.md：視覺邏輯、逐秒分鏡、圖層。
- docs/COMPARISON-V23.md：美術觀察、限制、時間、30秒Reels建議。
- docs/RESOLUTION-AUDIT.md：V2.2解析度調查及V2.3交付方式。
- docs/v23-qa-metrics.json：規格／逐格／跳轉／渲染時間原始結果。
- docs/ASSETS.md、docs/QA.md、docs/qa-metrics.json：繼承的V2.2歷史文件，非V2.3結果。

HyperFrames保持獨立工具鏈，未跨引擎嵌入；GPT-SoVITS、字幕與音訊備份流程沒有讀寫。本次不建立大型元件庫、不製作12秒版。
