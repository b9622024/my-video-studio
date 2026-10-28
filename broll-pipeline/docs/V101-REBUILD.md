# V1.0.1 使用、測試與重建

## 私有審核包與iPhone

本輪沒有Codex受保護預覽網址；未公開部署。請下載 broll-v101-review.zip 並完整解壓縮，保留review.html與previews/的相對位置。包內有6支低解析度H.264影片及18張代表影格、四份專案JSON、視覺檢查紀錄與本報告。

1. 在與iPhone同Wi-Fi的可信任電腦上安裝Node>=24.5；不需npm install。
2. 進入解壓縮目錄，執行 `node serve.mjs --lan`。這是使用者本機電腦，不是Codex雲端。
3. iPhone Safari開啟 `http://<該電腦區域網路IP>:3112/`。電腦防火牆需允許自己的區域網路；不要將port轉發至公網。
4. 播放、拖曳時間、切換9:16、填寫實際動作／起訖及確認，再採用或排除。已明確排除素材的採用按鈕停用；仍可播放核對與排除。
5. 匯出review-results.json；若Safari下載未出現，可複製頁尾同份JSON。Search Again只匯出請求，須交回後端執行，不在頁面呼叫API。

離線時，mp4可用系統播放器個別觀看。桌面瀏覽器直接開review.html可能可執行，但iOS「檔案」或聊天預覽不保證執行JavaScript，也不保證播放相對路徑影片；此時Approve/Reject、裁切操作與JSON匯出不可保證。透過上述電腦HTTP方式可在無外網的同Wi-Fi操作本機素材；外部Pixabay來源及授權連結需要網路。未測實體iPhone Safari，本輪為393×852觸控Chromium。

包內不含金鑰、API快取、原始大影片或測試核准JSON。不得將此包公開散布為素材庫。僅作此次私人審核，刪除不再使用的預覽；正式使用仍核對Pixabay條款、人物及品牌權利。

## 從GitHub重建頁面

```sh
git checkout broll-pipeline-v1.0.1
cd broll-pipeline
node src/cli.mjs validate --project projects/bento-v101
# 先從審核包把previews/放到projects/bento-v101/previews/
node tools/apply-visual-review.mjs
node src/cli.mjs review --project projects/bento-v101
node src/cli.mjs serve --project projects/bento-v101 --port 3112
```

預覽媒體不提交GitHub；只取公開程式碼不能憑空播放本機媒體。visual-review.json為本輪實際影格檢查紀錄，不是自動視覺服務。apply-visual-review依候選ID套用已有紀錄；新增或沒看過的候選保持metadata_only。若重新GET取代預覽，必須重新看片，不得直接假定舊紀錄仍適用。

## 重新搜尋與製作預覽

Pixabay金鑰沿用環境變數。不能寫入程式、HTML、日誌或Git。

```sh
node --use-env-proxy tools/search-v101.mjs
```

會先用PixabayClient的24小時快取，再搜尋plan中的最多3個方向／場景。每次執行最多6個新API請求；全新環境9個方向可能第一輪受run上限停止，需要至少1分鐘後第二次執行，前6筆沿用快取。429遵守官方冷卻，401/403停止，不變換身份或繞過。程式保留錯誤紀錄，不能將被限流當查無素材。

來源影片僅用API提供的tiny／small網址，每檔最多20MiB，GET403標unavailable不換網址繞過。FFmpeg／ffprobe產生3張影格及480寬無聲H.264預覽；保留全片時間座標，避免剪短後匯出起訖錯位。原tiny下載處理後刪除。搜尋會改候選revision，使舊審核失效。

新的搜尋結果必須先看新影格，更新visual-review.json及影格hash證據；不能把本輪人工輔助檢查當成自動辨識。再執行：

```sh
node tools/apply-visual-review.mjs
node tools/quality-report.mjs
node src/cli.mjs review --project projects/bento-v101
```

Search Again匯出可由既有CLI `search --requests`執行，它仍是V1.0 metadata搜尋；執行後必須再走V1.0.1語意／預覽／實看流程。不可把CLI新結果直接當成已視覺驗證。本輪不開放頁面直接API搜尋。

## 測試

```sh
npm test
node tests/server.test.mjs
# 另開terminal啟動前述3112本機server，再跑：
python tools/test-v101-ui.py
node tools/test-v101-contract.mjs
# 視需要重新診斷少量官方來源，這不是API搜尋：
node --use-env-proxy tools/compare-http.mjs
```

Node>=24.5、FFmpeg／ffprobe、Python Playwright及既有/usr/bin/chromium。無新增付費API、GPU、模型或npm執行依賴。Codex內連網與本機監聽命令需正式network權限。

UI測試會逐支播放實際預覽並解碼縮圖，測試核准只存/workspace/outputs/broll-v101-tests；測完清除瀏覽器狀態。contract測試使用隔離單場景副本及同份真實影片、真實頁面匯出，驗證hash、import、compile與既有Remotion資料接口；不render、不寫正式核准、不修改Composition。

正式審核匯回仍用 `node src/cli.mjs import --project projects/bento-v101 --file /path/review-results.json`。未核准場景及缺少正式下載／hash會阻擋完整compile。本輪停在使用者驗收，不啟動V1.1。
