# 重建

使用現有 Remotion 4.0.539 / React 19 執行環境，安裝 Noto CJK 與 Chromium。沒有新增服務或配音。

在 broll-pipeline 執行：

```sh
REMOTION_HOST=/path/to/existing-remotion-host node tools/render-v20.mjs
REMOTION_HOST=/path/to/existing-remotion-host node tools/render-v20.mjs --render
```

第一行僅輸出關鍵影格；第二行加上12秒H.264、540×960、30fps、BT.709、無音軌MP4。預設使用既有 /workspace/broll-v11/broll-pipeline/.runtime/v11-host，輸出 /workspace/outputs/visual-language-v20。未重建舊引擎。

1080輸出未包含在本輪；可保持540邏輯畫布並用Remotion scale=2，避免只改Composition尺寸而破壞排版。兩個Token檔需同步；專案JSON為規範來源，adapters副本為編譯資源。

驗證與打包（需現有 Pillow、FFmpeg/ffprobe）：

```sh
python tools/package-v20.py
```

可用 OUTPUT_DIR 更改輸出目錄。打包包含實際MP4抽出的六張影格、影片規格核對、自查文件、元件與JSON。技術驗證與人工美術驗收分開記錄。
