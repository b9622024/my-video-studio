# 可樂吉 B-roll Pipeline V1.0｜Pixabay Edition

**目前狀態：程式、人工審核及接口測試已完成，真實API搜尋與選片品質尚未驗收。** 本任務Node程序未取得PIXABAY_API_KEY，官方雲端狀態仍是revision1且無綁定變數；不等於使用者未在設定介面儲存。實際API請求0，便當候選0，沒有偽造影片或使用牛奶資料冒充。詳見docs/STATUS.md。

獨立於既有引擎，基於visual-remotion-v2.5（abc828dbffe50b1ad0dad4c6a053f1a259f46e46）。四份V2.5原JSON保存compat/v25，不修改原Composition、HyperFrames或GPT-SoVITS。

## 執行需求與金鑰

Node>=24.5（本機24.19）、FFmpeg/ffprobe；Remotion接口測試沿用/workspace/videos/keleji-remotion-visual-v2.5的既有4.0.539、Chromium。後端無npm執行依賴，不需下載模型、GPU、付費LLM或訂閱。

僅透過執行環境的安全變數設定PIXABAY_API_KEY，勿貼對話、寫HTML或提交.env。先確認**運行中任務**已套用新設定，不能僅依草稿或另一個GitHub／網站專案的設定判定已注入。工具目前僅可讀狀態，不能將設定強行注入既有程序。

```sh
node src/cli.mjs diagnose
node src/cli.mjs validate --project projects/bento-v1
node --use-env-proxy src/cli.mjs search --project projects/bento-v1
node src/cli.mjs review --project projects/bento-v1
node src/cli.mjs serve --project projects/bento-v1 --port 3110
```

Codex中連網命令須由工具正式network權限執行。--use-env-proxy使用既有HTTP_PROXY/HTTPS_PROXY及CA；不取消沙箱或修改代理。diagnose僅輸出變數是否存在，不顯示值。搜尋blocked時CLI exit2，不當成成功。

## Script Analyzer：Codex協助，不是後端LLM

本輪便當示範口白由Codex依主題撰寫，A兩句合成一個事件，B夾菜、C盛飯。換新逐字稿時用prompts/script-analyzer.md讓Codex整理場景，再validate。scaffold命令只保存逐字稿與待填框架，不能自動理解任意中文：

```sh
node src/cli.mjs scaffold --script my-script.txt --id new-topic --project projects/new-topic
# Codex fills scene-plan.json using prompts/script-analyzer.md
node src/cli.mjs validate --project projects/new-topic
node --use-env-proxy src/cli.mjs search --project projects/new-topic
```

## 搜尋／排序的實際能力

後端Pixabay影片API，僅允許官方參數q/lang/video_type/category/min_width/min_height/safesearch/order/page/per_page；無orientation。film/en/true為預設。每場景先一個動作query，少於2支可連線候選時才試第二個，本輪最多6次API請求。相同查詢24小時快取；本地每分鐘8次、每日60次，並讀官方速率標頭。429保存冷卻時間停止，不立即重試；401/403停止；網路或5xx最多重試一次。並行程序以鎖避免暴衝。強制中止後若遺留.runtime/pixabay/request.lock，確認沒有搜尋程序後才移除空鎖目錄。

每query最多挑3支metadata候選作HEAD檢查，不下載原影片。合併去重後每scene推薦最多3支可連線素材，不足明列。30/25/20/15/10評分依相關性、動作標籤、幾何裁切、解析度、長度作**初篩**；不能據tags證明動作、主體位置、色調或美術合格。所有素材pending，需實看。large空URL／不存在時改用實際可用variants；只使用API提供的thumbnail，不捏造縮圖URL。

## iPhone人工審核

review.html自含CSS/JS與候選metadata，無API Key、不呼叫搜尋後端。影片controls/playsinline、preload none；失敗時保留API縮圖及原始來源連結。來源／作者／授權、裁切與風險在每支候選中呈現。

- Approve：需填實際動作、有效起訖，確認觀看／裁切與人物品牌用途；每scene一支。設定改動後退回pending。
- Reject：更新頁面狀態，匯出後不進剪輯。
- Search Again：匯出search-again.json；沒有假按鈕或前端金鑰。後端只搜尋指定場景，仍受快取與限流。
- 匯出review-results.json。Blob下載在頁尾提供同份JSON複製備用；localStorage不可用時仍可匯出。新候選revision使舊審核失效。

本輪已測393×852觸控Chromium；沒有WebKit及實體iPhone，不能聲稱Safari實機通過。下載HTML若被iOS Files/聊天預覽以不執行JS的方式開啟，請在可執行JavaScript的Safari HTTP頁面使用。可把專案放到同Wi-Fi的可信任電腦，手動啟動LAN預覽：

```sh
node src/cli.mjs serve --project projects/bento-v1 --port 3110 --host 0.0.0.0
# iPhone Safari opens http://<that-computer-LAN-IP>:3110/
```

預設只綁127.0.0.1。雲端localhost不等於手機localhost；本輪未建立公開隧道或正式部署，若平台有受保護port preview可使用平台入口。靜態server支援Safari的Range請求，不提供API／.env／快取檔路由。

## 匯回與Remotion

```sh
node src/cli.mjs import --project projects/bento-v1 --file /path/review-results.json
node --use-env-proxy src/cli.mjs search --project projects/bento-v1 --requests /path/search-again.json
# After new candidates, build review and export a new revision of review results
node --use-env-proxy src/cli.mjs download --project projects/bento-v1
node src/cli.mjs compile --project projects/bento-v1
```

重新搜尋使舊審核失效，必須重新審核／匯回後再download。僅下載已核准且確有製片用途的素材，每次最多3檔／各50MiB，官方下載403即停。ffprobe與SHA-256驗證後產生local_path；沒有下載hash=null。compile要求全scene已核准、動作／裁切確認、已下載且hash一致；不自動補假素材或循環短片。輸出edit-timeline.json/remotion-input.json供既有引擎讀取，資料規格見docs/CONTRACT.md。adapters/remotion/ApprovedBrollAdapter.tsx是最小媒體消費接口，不是另一套影片引擎。

測試：npm test（24項後端模擬測試）；node tests/server.test.mjs（本機HTTP）；tools/test-review-ui.py（需先建立test-only fixture server3111及真實空頁3110）；node tools/test-remotion-interface.mjs（既有引擎合成紅片測試，非Pixabay素材）。詳見docs/TEST-REPORT.md。

## 保存與資料限制

.gitignore排除.runtime快取、下載影片、金鑰、審核個人結果及node_modules。不要大量抓素材建公開庫或用作AI訓練。素材用途須核對人物、商標及授權，不冒稱學員案例、健康／減重效果、背書或影像營養實測。官方來源與查核見docs/PIXABAY-SOURCES.md。

原始碼及空的真實專案資料可存Git；工作備份另存私有持久位置，Codex暫存工作區不是永久保存。真實便當API搜尋、2–3支/scene視覺選片及人工核准尚待環境金鑰注入後完成；本版不宣稱全流程驗收通過。
