# 測試結果與真實驗收缺口

- 後端24項（mock API）：24小時持久快取、無金鑰零請求、401/403/429、標頭冷卻、有限重試、DNS分類、跨程序速率、敏感資料遮蔽、缺large、影片HEAD型態、重複候選、限定場景重新搜尋。
- 人工核准／下載／接口：拒絕未知、過期、重複、未確認動作、無效裁切／起訖；未核准零下載；403停止；50MiB限制；ffprobe及hash驗證；檔案變更阻擋。包含於上述24項。
- HTTP 1項：Safari常用Range 0–1回206，越界回416；.env及metadata原檔路由不公開。
- 行動UI 13項：Approve/Reject/未完成核准阻擋、設定修改退回pending、裁切模式、Search Again及兩種JSON下載、複製fallback、本機儲存、無橫向溢出、真實專案空狀態。
- 瀏覽器匯出的TEST-ONLY JSON另外經後端validateReview實際接受。
- Remotion：沿用V2.5 Remotion4.0.539，合成紅色影片的核准→下載→ffprobe/hash→compile→adapter→第15格1080×1920靜圖成功；中心RGB(253,0,0)。未修改舊Composition。

mock／紅片／TEST-ONLY UI不是Pixabay搜尋結果，也不是使用者對素材的核准。實體iPhone Safari及WebKit尚未測試；僅以既有Chromium393×852觸控模式驗證UI，使用標準playsinline/Blob下載及JSON複製備用。

真實Pixabay API：因運行程序沒有PIXABAY_API_KEY，尚未發出請求。便當每scene2–3支真實候選、視覺確認及真實人工核准尚未驗收，不宣稱V1.0完整成功。

結構化報告在test-results；重新執行方式見README。
