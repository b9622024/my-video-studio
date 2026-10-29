# Huashu Motion 安裝及環境驗證

本輪只做安裝、doctor、官方demo及靜態測試，未開始牛奶動畫。保留原Remotion、HyperFrames、GPT-SoVITS、所有素材與私密設定。

## 安裝結果

官方來源：https://github.com/alchaincyf/huashu-motion

固定 commit：`52467f99c602b76ba86d511d37acdfe93fa1e16e`，package/Skill版本0.3.1。

- 完整可重建安裝：`/workspace/huashu-environment/.runtime/huashu-motion`。
- Codex專案Skill連結：`/workspace/huashu-environment/.agents/skills/huashu-motion`。
- CLI：`/workspace/huashu-environment/.agents/skills/huashu-motion/bin/om`。
- 完整倉庫保留 cli、runtime、templates、studio、examples、fonts及Skill支援文件；不是僅SKILL.md。
- 初次官方來源檢查用克隆另留在 `/workspace/huashu-motion-source`。
- 未修改全域PATH；以Skill實際路徑呼叫。

已讀官方README、Skill、CLI包裝器、doctor、capture/browser相關程式。官方 `npx skills add alchaincyf/huashu-motion -a codex -y` 在工作區頂層失敗（該`.agents`為唯讀平台掛載），在可寫專案根目錄成功。然而複製結果只含Skill與bin包裝器，沒有鄰接CLI，會改走未固定版本的npm fallback。因此採README正式支援的完整倉庫＋Skill目錄連結。該npx複製目錄保留在本機`.runtime/huashu-skill-npx-copy`，沒有覆寫其他Skill。

## 實際測試

|測試|結果|
|---|---|
|`bin/om doctor`|成功；Node24.19.0、FFmpeg/ffprobe7.1.5、H.264及其他編碼器、Chromium154均偵測到|
|重複執行setup腳本|成功；相同commit重用，未重裝任何既有套件|
|`om demo ... --no-open --port 4849`|官方showcase複製成功，Studio啟動成功；本機HTTP GET 200|
|`om check ... --source`|0 errors、1個no-real-material warning；這是未改的官方demo，沒有為了消警告修改它|
|`om still ... --at 0,1`（正式附加網路權限）|失敗；Chromium SUID sandbox helper的owner/mode不合預期|
|同一`om still`（平台require_escalated機制）|Chromium能啟動，但file://頁面被管理政策拒絕：`net::ERR_BLOCKED_BY_ADMINISTRATOR`|
|短片render|未執行；still所需的共用capture路徑被阻擋，不反覆無效重試|
|MP4／QA|沒有新MP4，不能宣稱渲染或動態QA通過|

doctor只做版本／可執行檔偵測，不等於瀏覽器真正能載入作品。官方capture.js直接載入file://，本輪沒有改為其他URL以避開政策，沒有加入no-sandbox、沒有chmod系統檔案或移除管理政策。正式權限請求沒有被auto-review拒絕；後續阻礙來自瀏覽器實際回傳的管理政策錯誤。

官方demo為橫式Tea Across the Ages；未重製、未改寫內容。診斷時Studio僅綁127.0.0.1；驗證完即停止，不把localhost當成iPhone可用網址。沒有建立公開服務或受保護外網網址。

## 目前任務與新任務的區別

目前：CLI、Skill、完整支援檔案及Studio伺服器可使用；**still/render功能受平台阻擋，尚不可用**。

新Codex Cloud任務：不能假設本機安裝或忽略檔會持久保存。本分支僅交付可重複安裝腳本，尚未更新或Republish雲端環境；也沒有實際建立新任務測試。

在含本分支的專案根目錄，執行：

```bash
bash broll-pipeline/tools/setup-huashu.sh
OM_CHROME=/usr/bin/chromium .agents/skills/huashu-motion/bin/om doctor
```

腳本下載完整官方倉庫並固定commit，保留既有非symlink安裝，不覆寫其他Skill，不跑npm install、不改既有Node／Remotion依賴、不安裝音色或模型。`.runtime`與本機Skill連結均忽略，不提交整份第三方倉庫。

## my-video-studio環境設定與Republish

需要在my-video-studio環境設定中操作，**GitHub commit本身不會完成這一步**：

1. 環境使用包含本安裝腳本的分支／commit；若之後換回其他分支，先將此安裝腳本納入該分支。
2. 在現有Setup／啟動安裝流程後追加 `bash broll-pipeline/tools/setup-huashu.sh`；不要取代原本Remotion、HyperFrames等初始化。命令須在實際Git根目錄執行；若平台checkout尚未完成，應放在checkout完成後的任務啟動階段。
3. 保留既有網路代理、CA與憑證注入；安裝需要正式允許GitHub下載。無需讀取或修改任何API key。
4. 平台需提供能安全啟動的Chromium sandbox配置，且正式允許官方renderer讀取工作區file://檔案，或提供官方相容的執行環境。這是平台層需求，不是靠倉庫腳本取消政策。
5. 保存環境設定並使用平台的Republish／發布新版環境功能；待發布完成，選擇新版環境建立全新任務。
6. 新任務重新確認Skill實際路徑、完整checkout commit、doctor，然後執行demo、still及render。只有新任務實測通過才可宣稱跨任務可用。

目前沒有可寫的雲端環境配置工具，本輪僅能讀取環境狀態，不能代表使用者完成Republish。實測環境仍為revision1／running；未將revision1當作故障原因。真正的失敗證據是上述兩個瀏覽器錯誤。
