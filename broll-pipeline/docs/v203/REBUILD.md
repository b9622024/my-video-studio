# V2.0.3 重建與檔案核對

基礎：visual-language-v2.0.2-motion / 1a4dbf986c394166488eb52623bd20c10f587d26。
新分支：visual-language-v2.0.3。舊物理系統、Composition與配音／B-roll／HyperFrames全部未改。

沿用既有Remotion 4.0.539、React19、TypeScript、Chromium、Noto CJK、FFmpeg及Pillow。REMOTION_HOST可指向既有node_modules所在專案；OUTPUT_DIR可改輸出位置。

```sh
node tests/v203-art.test.mjs
node tools/render-v203-art.mjs --stills
node tools/render-v203-art.mjs --render
python tools/package-v203-art.py
```

先看靜態，再作一次動態比較；工具分別輸出A/B原生540預覽與1080母檔，均為4秒、120幀、30fps、H.264、BT.709、無音軌。1080採Remotion原生scale2重新光柵化向量，沒有把540影片放大。母檔仍是美術測試，不等於正式公開核准。

`artifact-integrity.json`列出實際尺寸、解碼幀數、SAR/DAR、位元組數及完整SHA-256。下載檔可用：

```sh
sha256sum A-master-1080.mp4
ffprobe -v error -show_entries stream=width,height,nb_frames,r_frame_rate -of json A-master-1080.mp4
```

母檔和預覽是不同原生解析度，雜湊不同是預期，不能據此判定平台改檔。若要確認平台二次轉碼，必須取得平台播放副本再比對；本輪無法取得該副本，因此狀態是unknown。畫面在對話中的顯示尺寸不代表MP4檔案解析度。檔案和ZIP可直接下載，無需本機伺服器。
