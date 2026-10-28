# 可樂吉 Remotion Visual Study V2.2

獨立新增於 `/workspace/videos/keleji-remotion-visual`，不是已找回的舊 Remotion。`MilkPourStudy`：4秒、1080×1920、30fps、H.264、無聲。
原創編輯式物件動畫；畫面標示「風格化動畫示意」，不是實拍或擬真液體模擬。

## 重建與執行

Node 24.19.0；Remotion各套件固定4.0.539，React19.3.1；完整鎖定於package-lock.json。

```bash
npm ci
npm run typecheck
npm run studio
npm run render -- --preview
npm run render
npm run frames
node tools/verify-seek.mjs
python tools/qa_video.py
```

Studio使用3100埠。Linux預設瀏覽器 `/usr/bin/chromium`；換環境可設定 `REMOTION_BROWSER_EXECUTABLE`。正式渲染兩個worker，不需GPU或雲端服務。
在本Codex環境，需要連網或啟動本機HTTP服務的命令使用工具正式網路權限（`sandbox_permissions=with_additional_permissions`、`additional_permissions.network.enabled=true`），保留代理與CA信任。npm快取可用命令限定的 `npm_config_cache=/workspace/.cache/npm`，Node保留 `NODE_USE_ENV_PROXY=1`。不要更改其他專案。
QA腳本另需Python的numpy/Pillow與FFmpeg/FFprobe；本環境已有，不影響影片本身的Node依賴。
`qa_video.py`需先將正式MP4的0、26、44、65、90、119格抽到`out/decoded/frame-01.png`等；本輪命令與結果見docs/QA.md。

## 原始碼

- src/Root.tsx、src/index.ts：獨立Composition與Remotion入口。
- src/MilkPour.tsx：素材遮罩、盒子軌跡、液帶、液面／波紋、影格鏡頭。
- src/timeline.ts：物件ID、動作、起訖影格、資產、參數、可選旁白詞與時間偏移。
- tools/render.mjs：低解析／正式MP4與主要影格渲染。
- tools/verify-seek.mjs：非順序影格可重現檢查。
- design.md：視覺邏輯、分層及動作時間軸。
- docs/asset-manifest.json、docs/ASSETS.md：素材來源、權利依據、hash。
- docs/QA.md、docs/qa-metrics.json：已做的驗證與限制。

## 保存與相容性

遠端目標：`b9622024/my-video-studio` 的 `visual-remotion-v2.2` 分支，專案位於 `videos/keleji-remotion-visual/`。分支承接既有遠端，不force push，不改聲音或HyperFrames來源。
所有使用中的素材均包含於public/assets：原創生成atlas與SIL OFL字型／授權檔。庫存影片研究候選、node_modules、輸出與Skills全文不提交。
官方Skills來源與固定commit見vendor-skills/SOURCE.json及docs/SKILLS.md；本機保留已讀取快照，不宣稱在本輪前就已安裝。

現有HyperFrames仍於 `/workspace/videos/star-action`，工具鏈、Skills、Registry均未變動。HTML/GSAP元件不能直接當React元件匯入；未來可先改寫成影格驅動React、或以已授權預渲染素材橋接，本階段未強行整合。
此專案不引用任何配音、字幕或GPT-SoVITS路徑。未新增共享JSON欄位，故不改舊資料格式。

Remotion本輪為本機評估，沒有啟用付費渲染。其軟體授權依組織規模不同；個人、最多3人的營利組織等適用免費條款，正式用途應依附帶 docs/REMOTION-LICENSE.md 判定。原創圖像輸出權利依OpenAI適用服務條款；字型依FONT-OFL.txt。沒有宣稱輸出享有獨占著作權。
