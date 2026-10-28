# 目前進度：A1／B2／C2 已核准，540預覽待畫面驗收

使用者回覆「A1 B2 C2」後，已建立私有核准清單並完成12秒540×960、30fps H.264無聲字幕預覽。檢查紀錄見 [preview-report.json](preview-report.json)。尚未取得畫面品質核准，沒有1080正式輸出。以下保留階段一的原始交付說明。

# 可樂吉 B-roll V1.1：階段一交付

目前停在素材審核。沒有建立正式 approved-assets.json，沒有12秒成品，也沒有1080正式輸出。由使用者明確選擇A/B/C後，才能進入階段二、三；540預覽畫面驗收後才進入1080輸出。

基礎分支：broll-pipeline-v1.0.1，commit a29f204。開發分支：broll-pipeline-v1.1。projects/bento-v1、bento-v101、舊Composition、HyperFrames及GPT-SoVITS均未覆寫。本輪沒有新API搜尋或付費服務；沿用V1.0.1已實際取得的官方tiny影片、作者／授權與影格紀錄。

## 12秒混合分鏡（待選片）

|段落|時間|Codex測試旁白|視覺角色與選項|
|---|---|---|---|
|A 外食餐點情境|0–4秒|外食先看看餐點的組成。|A1：餐盤肉與沙拉，全畫面。A2：牛肉與白飯，分割畫面＋餐點組成關係提示。均為contextual_match。|
|B 蔬菜與配菜|4–8秒|配菜也看看蔬菜的搭配。|B1：11605烹調綠葉菜，原片34–38秒，contextual_match。B2：逐步連結蔬菜／其他配菜／餐點搭配的資訊圖。|
|C 主食份量|8–12秒|主食份量，依自己的需求調整。|C1：11626熟白飯，原片4–8秒，搭配非量化份量概念圖。C2：純資訊動畫，觀察→依需求→調整。|

建議複核組合為A1／B1／C1：實拍貫穿三段，只有主食概念需要資訊動畫。這只是推薦，沒有預設核准。所有實拍選項action_verified=false，不把情境符合改寫成精確動作已驗證。B1不再要求拍到裝入便當，因此在新意圖下可列為烹調蔬菜情境；不是把V1.0.1缺少裝盒證據當成成功。

旁白由Codex自寫並允許調整，這次已改為觀察與概念解說。未來若使用者提供正式逐字稿，不得自動改寫核心意思。餐盤、鍋鏟、白飯只證明畫面中的物件／情境，不證明份量、熱量、營養均衡、健康成果或人物背書。沒有稻田、農業或生稻穀候選。

## 不用架server的選片方式

直接觀看交付的A1.mp4、A2.mp4、B1.mp4、C1.mp4，配合contact-sheet.jpg及每候選三張JPG。B2、C2是已明示尚未渲染的資訊動畫構圖JPG；C1.mp4只展示白飯來源，資訊圖待核准後合成。

可直接在Codex對話回覆，例如「A：候選1；B：候選1；C：候選1」，或「B：改資訊動畫B2」。請選明確編號；若都不合適，可提出新方向或自有MP4/MOV。不要求使用者自行架伺服器。

來源、作者、授權、原片區間見包內sources.tsv；preview-hashes.json保存交付候選副本hash與V1.0.1來源預覽hash。source_sha256仍為null，表示正式rendition尚未下載，不能把低解析度審核hash冒充正式影片hash。

review.html是另一種選片方式，匯出只產生selection_request_not_formal_approval，不會自動建立正式選用清單。iOS「檔案」預覽可能不執行JS，此時直接觀看個別MP4／JPG並回覆編號即可。平台Chromium禁止file URI，未繞過；本輪HTML以私人loopback HTTP作內部QA，不將雲端localhost當成iPhone入口。未測實體iPhone Safari。

## 四種模式與證據

- exact_action_footage：物件狀態與動作均經實看，才可exact_match。
- contextual_broll：實看確認物件／狀態／情境，可contextual_match；不宣稱未發生的操作。
- information_motion_graphics：過程、關係、比較或抽象變化；motion_graphics_fallback。數字比較須有實際來源；本示範不用數字、食物插畫或固定建議比例。
- user_provided_footage：MP4/MOV匯入、旋轉正規化、H.264、影格、原始與正規化hash、權利聲明。沒有物件／動作審核前仍metadata_only。本輪未有使用者iPhone素材，HDR色彩與實機檔尚未驗收。

required_evidence.event_mandatory=true時，不能以情境或純動畫冒充操作、實驗或實際成果。缺少事件證據時回user_footage_required；沒有可接受模式則no_acceptable_visual。推薦最多三項，不以metadata分數作畫面驗證。

## 通用Composition與資料接口

adapters/remotion/v11/HybridComposition.tsx讀取編譯bundle內四份資料：scene-plan、approved-assets、edit-timeline及asset-manifest。不同文章改JSON，不重新手寫影片元件。模式／版面可全畫面、分割、情境＋資訊、純動畫、自有影片；標題、旁白字幕、裁切及時間由資料控制。全畫面不強制標題卡；圖表在獨立區域，字幕在底部保留區。資訊動畫以進度、關係線與節點表現概念，不做逐句PPT輪播。

src/hybrid.mjs保存分鏡與選項hash，防止核准後偷換內容；編譯前驗證來源作者授權、正式影片hash、區間長度及場景完整性。沒有正式媒體不能用審核副本自動進剪輯。正式1080還要求與當前revision／預覽hash一致的使用者畫面核准。

真人錄音接口：plan.narration={local_path:'audio/name.wav',sha256,offset_frame:0,volume:1}，支援wav/mp3/m4a。自訂字幕：plan.captions=[{frames:[start,end],text}]；未提供時顯示各scene旁白作字幕。尚未提供真人錄音，所以不宣稱已有語音影片；不呼叫GPT-SoVITS。

## 階段狀態

|階段|狀態|
|---|---|
|一：分鏡、候選、審核|已交付，待使用者選擇|
|二：正式選用清單|尚未執行|
|三：12秒540×960預覽|尚未渲染，待素材核准|
|四：1080×1920、30fps H.264|待540畫面品質核准|
|五：其他主題成片接口驗收|尚未執行；目前只有不同主題單元測試|
