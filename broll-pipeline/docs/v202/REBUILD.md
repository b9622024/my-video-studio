# V2.0.2 第一階段重建

來源：visual-language-v2.0.1 / dbe394b9c4daf22e373df4e177b00ac673e7cadb，已核對GitHub分支。新分支visual-language-v2.0.2。

沿用既有Remotion 4.0.539／React19、TypeScript、Chromium與Noto CJK環境，不安裝新引擎／付費資源。REMOTION_HOST可指定既有node_modules所在專案；OUTPUT_DIR可改輸出。

在broll-pipeline目錄執行：

```sh
node tools/render-v202-storyboard.mjs
python tools/package-v202.py
```

渲染工具只匯入renderStill，每個Composition僅一影格。沒有8秒MP4輸出選項；傳任何參數即拒絕。本輪四張姿態圖不是從240幀成品抽出。下一階段必須先取得人工分鏡核准，再新增動態實作與測試。

原始參考影片透過使用者的Drive連結取得，私人保存在.runtime/v202-reference/source.mp4，不提交Git、不打包原片、不作動畫素材。分析用影格如仍在本環境，可另外打包私人evidence；工程文件只保留Drive來源與SHA，沒有短效下載網址或憑證。取得原片後以FFprobe查PTS，FFmpeg原始索引2008/2009及2300/2301可重做硬切前後對照；其他轉場以0.2秒抽樣、只報約值。

本輪包含參考片取得與圖像分析所用的[Google Drive skill](skill://plugin_connector_1p_ab21a553bfbc81919ea8fd1858e3ffa7/google-drive/SKILL.md)。沒有寫入或分享Drive檔案，僅讀取使用者指定影片。
