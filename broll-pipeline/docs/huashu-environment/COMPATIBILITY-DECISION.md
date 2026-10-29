# Huashu Motion 最終相容性與製片路線決策

範圍：已安裝0.3.1，官方commit `52467f99c602b76ba86d511d37acdfe93fa1e16e`。本輪讀取實際SKILL.md、導演／節奏規則、CLI help及原始碼，沒有重裝、改政策、產生動畫或發布環境。

## A｜原生渲染目前能否使用？

**目前不能列為可用製片路線。** 上輪still兩次失敗，本輪未找到符合「官方明確支援＋目前平台允許」的替代入口，因此不再啟動瀏覽器或重試渲染。doctor及Studio HTTP 200只證明執行檔存在和伺服器可啟動。

原始碼鏈路（均固定上述commit）：

- `cli/om.js:299` → `cli/lib/still.js:10`：輸入解析成本機檔案，呼叫capture。
- `cli/lib/capture.js:19`的openFilm建立Chrome；`:48–49`執行 `Page.navigate({url:pathToFileURL(target).href})`，有errorText立即失敗。
- `cli/lib/render-om.js:69`也使用openFilm；因此still受阻的載入路徑也是原生render的必要條件。原生render本身未實測失敗，不捏造第二份錯誤。
- `cli/lib/render.js:28`明確只接受om引擎，HyperFrames替代引擎已移除。
- `OM_CHROME`是選擇已安裝瀏覽器；本機檢查只找到/usr/bin/chromium，沒有另一個已確認允許的瀏覽器。
- pipe／WebSocket是CDP傳輸選擇，並未改變file://導覽；`--video extract|seek`只改素材解碼；`--frames`、`--blur`也不是替代頁面入口。CLI未提供HTTP render URL或遠端CDP renderer入口。`om export html`是分享包，不是另一套渲染器。

[官方capture.js](https://github.com/alchaincyf/huashu-motion/blob/52467f99c602b76ba86d511d37acdfe93fa1e16e/cli/lib/capture.js#L48) · [renderer共用入口](https://github.com/alchaincyf/huashu-motion/blob/52467f99c602b76ba86d511d37acdfe93fa1e16e/cli/lib/render-om.js#L69) · [引擎限制](https://github.com/alchaincyf/huashu-motion/blob/52467f99c602b76ba86d511d37acdfe93fa1e16e/cli/lib/render.js#L28)

## B｜可否取其動態設計方法，由Remotion渲染？

**可以，需手動轉譯；這不是Huashu原生渲染。** 建議只保留「已有主體 → 預備 → 接觸倒入 → 液面增加 → 流尾排空 → 結果停留」，不搬入發布片的快切、音樂或品牌尾卡。使用者要求的無聲單近景優先於Skill的一般發布片預設。

|類別|可處理內容／限制|
|---|---|
|直接重用素材|既有`projects/milk-pour-test/assets/carton-original.png`、`glass-empty-original.png`，保留像素、尺寸及目前大比例構圖；不重新生成。液流、液面沒有獨立PNG，須以受控圖形合成。既有杯緣遮罩可作幾何起點，仍要看合成品質。|
|可轉換的GSAP設計參數|位置、旋轉、scale、transform-origin、明確起訖值、duration、delay、label與緩動曲線，轉成`t=frame/30`的純函數；相對時間先展開成絕對時間。固定錨點及原座標系必須保留，避免換框後比例跳動。|
|必須重實作|GSAP的DOM/CSS寫入、timeline/callback、液流前端與尾端、液面進度、落點、杯口遮擋及停止後安定；用Remotion影格值與SVG圖層組合，不能靠牆鐘播放GSAP。沒有已製作的Huashu牛奶GSAP作品可自動匯入，本案是依方法設計，不是既有作品格式轉換。|
|不保證等效|OM.spring不等於Remotion spring的同名參數；DOM量測、CSS 3D相機、插件、OM自動鏡頭、子影格motion blur、字型／色彩輸出均需各別驗證。Studio指點回饋、om check/qa與音樂／聲效系統不會自動移植；不能借用其通過標籤。|

建議架構僅三層：**動作規劃（事件／時間／錨點／easing） → 純時間狀態計算 → 既有Remotion圖層合成與檢查**。本輪只提出架構，沒有新增元件或修改舊Composition。

三秒規劃對應30fps（90影格，區間採左含右不含）：0–11預備、11–54倒入、54–72收束、72–90安定。0.35秒量化到第11影格（0.3667秒），邊界誤差約0.0167秒；液流實際抵達後才開始提高液面，停止時先關源頭再排尾流。這只是下一輪可採用的計畫，不是已驗證的成片品質。

## C｜完整Huashu是否需要另一個環境？

**若目前限制不由平台正式解除，就需要另一個正式允許其Chrome載入與逐幀擷取方式的執行環境。** 可是現有自有Mac／Linux／Windows工作站或組織已批准的執行機，不必新增付費服務；仍需逐項通過doctor、官方demo still及短render。官方README稱當前主要在macOS測試過，不保證每種Linux／Windows都相容。

也可能由官方未來提供受支援的新入口，或平台正式支援現有方式後再評估；本輪不試裝其他瀏覽器、不修改協定或政策。換環境只解決相容性，不能保證美術更好。

## D｜iPhone操作＋Codex Cloud最推薦路線

**近期採「Huashu導演／節奏規劃＋既有Remotion合成＋MP4與同時間影格審核」**。既有Remotion曾產出三秒成片，可作已知基線，但下一輪仍須遵守當時平台權限，不保證環境變更後永遠可用。這條路不需iPhone連localhost，也不需使用者自行架伺服器。公開服務／手機Studio不是目前已具備的功能。

Huashu原生留作日後在正式相容環境的選項。不能在沒有Huashu成片時宣稱它比Remotion更自然；本輪亦沒有證明轉譯後一定提高視覺品質。

## 非敏感支援診斷摘要

- Node v24.19.0；Chromium154.0.8037.57（Debian13）；FFmpeg7.1.5；執行使用者uid1000。
- 上輪命令：`OM_CHROME=/usr/bin/chromium <skill>/bin/om still <official-demo> --at 0,1 --out <output>`。
- 一般正式附加權限：`FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc:172`，提示chrome-sandbox應為root擁有、mode4755；沒有修改該檔。
- 平台require_escalated重試：`om: could not open .../official-demo/index.html: net::ERR_BLOCKED_BY_ADMINISTRATOR`；失敗在capture.js的Page.navigate回傳檢查，早於作品ready握手、seek及截圖。確切管理政策是哪一條，無足夠證據判定。
- 以上錯誤沿用前輪實測，不冒稱本輪重測。這輪環境狀態觀察為running／revision2；前輪revision1。沒有因版本改變就推斷問題解除，也沒有以revision1作故障原因。
- 本輪新增demo截圖嘗試0次、render0次；未找到合格替代入口，依停止條件結束排查。
- 可交維護者確認：現有file://入口是否有官方相容計畫；可交平台支援確認：能否正式支援此CLI的sandbox及本機頁面擷取。未向第三方送出訊息、私密資料或自動開issue。
