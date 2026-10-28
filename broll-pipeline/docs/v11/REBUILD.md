# V1.1 重建與後續執行

Node>=24.5、Python Pillow／Playwright／jsonschema、FFmpeg／ffprobe、既有Chromium。沒有新的付費API或GPU。私有預覽不放GitHub；從交付包取回候選影片，或沿用V1.0.1本機預覽。金鑰只留環境。

## 階段一

```sh
git checkout broll-pipeline-v1.1
cd broll-pipeline
npm test
node tests/hybrid.test.mjs
# V1.0.1證據／媒體仍在本機時才能重新打包：
V101_REVIEW_PROJECT=/path/to/projects/bento-v101 python tools/prepare-v11.py
python tools/package-v11-review.py
python tools/test-v11-review.py
```

prepare-v11.py是便當示範的資料初始化器，不是任意逐字稿的語意模型。新的主題由Codex依prompts/script-analyzer.md分析成JSON，再交同一套hybrid編排與Composition。不要對已有核准的專案重新初始化；新增project_id與revision保留舊資料。

schemas/v11/contracts.schema.json採JSON Schema2020-12，$defs含scene_plan、review_options、approved_assets、edit_timeline、asset_manifest。scene-plan新增欄位可選，舊版仍可驗證；舊版缺少required_evidence時採事件證據優先的保守策略。hash、選擇唯一性、物件／動作符合與完整區間另有runtime驗證，不能只靠Schema判斷。

## 階段二：收到使用者明確回覆後

保存使用者實際原文與當前review-options.revision_id，再建立選擇請求。以下是格式，不是已核准資料，不得直接照抄當作使用者的選擇：

```json
{
  "project_id":"bento-v11",
  "revision_id":"從當前review-options.json取得",
  "provenance":"user_explicit",
  "approval_evidence":{"channel":"chat","message":"使用者當次明確選片的原始回覆"},
  "selections":[{"scene_id":"A","option_id":"使用者選的編號"},{"scene_id":"B","option_id":"使用者選的編號"},{"scene_id":"C","option_id":"使用者選的編號"}]
}
```

```sh
node tools/hybrid-cli.mjs approve-chat --project projects/bento-v11 --file /private/actual-selection.json
node --use-env-proxy tools/hybrid-cli.mjs prepare-media --project projects/bento-v11
```

前一命令才會建立approved-assets.json；後者僅下載核准的官方medium/small，每run最多3支／各50MiB，GET403停止。metadata與預覽不是正式下載。下載後ffprobe、來源／作者／授權及SHA-256全部保存manifest。不下載已拒絕的素材，不用第三方代理。

自有素材先取得權利聲明，例如rights_confirmed、author、statement，再執行：

```sh
node tools/hybrid-cli.mjs ingest-user --project projects/new-topic --input /private/phone.MOV --rights /private/rights.json
```

輸出user-input候選、三張影格、原始及正規化hash；尚未核准。由Codex實際看影格／影片，填寫視覺證據與有效區間後，新增到review-options、重算revision，再請使用者選片。不能因為是自有素材就略過事件／裁切審核。iPhone旋轉由FFmpeg處理；HDR轉SDR色彩與HEVC實機檔仍須後續畫面驗收。

## 階段三：沿用V2.5版本，獨立執行目錄

不改舊版node_modules或Composition。本輪已從V2.5原lockfile在.runtime/v11-host安裝相同版本作TypeScript檢查；暫存重置後可重建：

```sh
mkdir -p .runtime/v11-host
cp ../videos/keleji-remotion-visual-v2.5/package.json ../videos/keleji-remotion-visual-v2.5/package-lock.json .runtime/v11-host/
npm ci --prefix .runtime/v11-host --cache /workspace/.cache/npm --ignore-scripts --no-audit --no-fund
# 必須先有本專案正式核准及正式媒體：
node tools/render-hybrid.mjs --project projects/bento-v11 --host .runtime/v11-host
```

渲染命令先驗證核准，失敗時不啟動Remotion。核准後才產生360frames、540×960、30fps、H.264預覽，保存preview-artifact.json與hash。配音未提供時為無聲附字幕預覽。截圖、字體、食物清晰度、字幕遮擋、裁切與鏡頭節奏必須在真實540預覽驗收，不能以TypeScript檢查替代畫面驗收。

## 階段四與五

使用者明確核准540畫面後，保存quality-approval.json（provenance:user_explicit、message、revision_id、preview_sha256），再執行 `node tools/render-hybrid.mjs --project projects/bento-v11 --final`。未有正確預覽hash及核准會被阻擋。輸出1080×1920、30fps、H.264後仍需ffprobe與畫面檢查，不自動宣稱驗收通過。

其他主題複製資料結構並修改scene-plan／選項，使用同一Composition。現有通勤主題單元測試只證明資料無便當寫死，正式跨主題成片驗收依使用者指定順序留到階段五。
