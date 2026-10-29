# 版本與重建

基礎為 visual-language-v2.0 / 7a419611274fca27a0a0dd259f89a3713d2d5859，已用GitHub ls-remote核對。新分支 visual-language-v2.0.1；所有新增檔案隔離在v201路徑，不更改舊Composition、素材核准、API、HyperFrames、GPT-SoVITS。

沿用既有 Remotion 4.0.539 / React19 / TypeScript5.9.3 / Chromium 與 Noto CJK。未新增npm套件、GPU或付費服務。`REMOTION_HOST` 指向已有 node_modules 的Remotion專案；預設為本環境既有v11-host。`CHROMIUM_PATH`、`OUTPUT_DIR`可選。

在 broll-pipeline 目錄：

```sh
node tools/export-v201-svg.mjs
node tools/render-v201.mjs --stills
node tests/recognizable-v201.test.mjs
```

先檢查所有中間與完成影格，再記錄 projects/recognizable-v201/object-recognition-gate.json：source_sha256須與render-receipt相同、reviewed_stills須含實際觀看檔案的SHA256、creator_static_pass只能由製作者檢查後記錄；任一關鍵造型自評低於3先修正。**不要把人類測試旗標改成已完成**，也不要用腳本自動宣稱美術通過。

```sh
node tools/render-v201.mjs --render
python tools/package-v201.py
```

--render 需要對應版本的已檢查影格與 gate；來源或影格改動即拒絕。重建相同來源可沿用已記錄gate與stills，不代表人類核准。附帶TypeScript檢查可複製既有host的tsconfig到.runtime/v201-stage後執行tsc --project。打包需現有Pillow、FFmpeg/ffprobe；會完整解碼六支影片、抽實際MP4影格並檢查完成狀態保持。影片檔不塞入Git，保存於審核包。

無文字辨識測試直接開啟no-text MP4或blind-test/test-*.mp4；不需本機伺服器、HTML或雲端localhost。iPhone請下載MP4後以檔案／相簿播放，保持正常顯示比例。ZIP內檔案可個別開啟。沒有建立公開網站。人工測試答案表在verification.json，請勿先給受試者看。
