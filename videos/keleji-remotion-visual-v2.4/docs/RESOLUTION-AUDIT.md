# 解析度與交付調查

使用者回報收到512×910影片。此副本的實際檔案尚未提供，無法檢查其metadata或SHA-256，原因保持未確認；不能推斷已經證實是聊天平台轉碼。

2026-10-28重新對V2.2現存檔案執行ffprobe：

|檔案|尺寸|fps／長度|SHA-256|
|---|---|---|---|
|Remotion out/milk-pour-4s-1080x1920.mp4|1080×1920|30／4.000秒|e37c50e20f810624b153c66859434aa66dfb12ece7a67d94cddb1b338b135e81|
|outputs/visual-v2.2/keleji-milk-pour-4s.mp4|1080×1920|30／4.000秒|同上，逐位元組一致|
|outputs/visual-v2.2/keleji-milk-pour-preview-540p.mp4|540×960|30／4.000秒|9f98eed22c9c89becb36ff9f048a9adb6dee0a4c3e2f3ecc120162a361090e8d|

完整ffprobe JSON在v22-resolution-audit.json。現存已檢查的三檔沒有512×910版本。

V2.3兩個Remotion master和outputs交付副本均再次獨立ffprobe並比對SHA-256。都是1080×1920、30fps、H.264、120格、4.000秒、無音軌；完整結果見v23-qa-metrics.json。未另外製作V2.3壓縮／分享影片副本。

正式交付檔名含MASTER-1080x1920；提供獨立MP4及包入ZIP的同一原檔。網頁播放器可能以較小顯示尺寸呈現，顯示尺寸本身不是檔案解析度證據。建議下載masters ZIP、解壓後執行：

```sh
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name,nb_frames -show_entries format=duration -of json keleji-v23-A-MASTER-1080x1920.mp4
sha256sum -c SHA256SUMS.txt
```

只有取得使用者收到的512×910實體副本，才能進一步定位哪個傳遞步驟發生改變。
