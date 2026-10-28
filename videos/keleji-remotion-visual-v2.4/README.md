# Keleji V2.4：12秒實拍＋資訊動畫

獨立專案：/workspace/videos/keleji-remotion-visual-v2.4。Remotion4.0.539，MilkHybridV24，360格／30fps／1080×1920／H.264，無音軌。保留V2.3原Composition與來源檔案；不改HyperFrames或GPT-SoVITS。

## 敘事
0–4秒真實倒奶與短標題 → 4–8秒同樣200mL的明確商品脂肪比較 → 8–12秒份量概念刻度與整體飲食結論。同一實拍鏡頭持續，無液體造假，未知杯容量不標mL實測。

## 重建
需Node.js、Chromium、FFmpeg；Python檢查需numpy、Pillow、fontTools。現環境node_modules以符號連結沿用V2.3，沒有重裝。新機器請在全新目錄：

```sh
npm ci
python tools/acquire-footage.py
python tools/acquire-v24.py
npm run studio
npm run typecheck
node tools/render-v24.mjs --preview
node tools/render-v24.mjs --stills
# Inspect preview before master render
node tools/render-v24.mjs
node tools/verify-v24-seek.mjs
python tools/qa-v24.py
node tools/check-public.mjs
python tools/package-v24.py
```

Chromium預設/usr/bin/chromium，可用REMOTION_BROWSER_EXECUTABLE指定。Codex連網或啟動本機渲染服務需工具正式network權限；保留代理和CA驗證。腳本輸出預設/workspace/outputs/visual-v2.4，移植時可調整。單次並行2格；若資源不足先關閉不使用的Remotion Studio，不修改原專案或模型。

正式原始渲染out/MilkHybridV24-master-1080x1920.mp4與outputs正式副本逐位元組比對；預覽另標540p。下載原始影片ZIP可取得未縮小的master及SHA256SUMS。

## 來源、資料與保存
- design-v24.md：畫面邏輯與檢查順序。
- docs/timeline-v24.json：場景、圖層、來源區間與動作。
- docs/nutrition-v24.json：明確SKU、每100mL數據及200mL換算；實際顯示數字從這份JSON讀取。
- docs/SOURCES-V24.md：Pexels、OFL字型、全聯標示來源與限制。
- docs/QA-V24.md及v24-qa-metrics.json：預覽、正式規格及美術檢查。
- 其他V2.2／V2.3文件為繼承歷史，不代表V2.4結果。

不在Git放stock工作影片、渲染影片、聲音、模型、金鑰或node_modules。Git保存非敏感來源、字型／原創舊素材、設定、鎖定檔及紀錄。工作備份包含本片實際使用的授權trim與原始碼，可還原；不是stock素材庫再散布。下載後請另存持久位置，暫存工作區不是永久保存。

授權見docs/REMOTION-LICENSE.md；本輪無新付費服務／GPU／AI配音。品質尚需使用者試看片確認，不自動啟動素材搜尋或自動製片系統。
