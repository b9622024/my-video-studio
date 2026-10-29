# 第二階段重建

基礎分支visual-language-v2.0.2／1184ab02cd10538b0b8ae264d17201f004d96a3c；本次新分支visual-language-v2.0.2-motion。

使用者已明確有條件核准第二階段動態測試；config只記錄測試授權，human_motion_approved仍為false。舊分鏡的審核旗標與原檔不改寫，避免覆蓋歷史。

沿用既有Remotion 4.0.539、React19、TypeScript、Chromium、Noto CJK與FFmpeg，不新增套件／付費資源。REMOTION_HOST可指定既有Remotion專案的node_modules所在路徑；OUTPUT_DIR可指定輸出。

在broll-pipeline：

```sh
node tests/v202-motion.test.mjs
node tools/render-v202-motion.mjs --stills
node tools/render-v202-motion.mjs --render
python tools/package-v202-motion.py
```

--render輸出兩支8秒540×960、30fps、240幀、H.264／yuv420p／BT.709、無音軌影片，CRF18。package工具會完整解碼實際影片，抽出0.5秒影格與接鏡點；模型測試與視覺自評分開記錄。

原片參考分析沿用第一階段文件，未下載新素材或複製原作者影片圖層。原始分鏡、V201三原型及更舊引擎均未改動。沒有GPU或新引擎。
