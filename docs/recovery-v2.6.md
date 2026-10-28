# V2.6：classic v2 CPU 首次實際配音

2026-10-28 UTC。已在 2 核 CPU 配額／8 GiB RAM／無 NVIDIA GPU 環境，以使用者本人參考音檔實際生成 A、B 配音。未訓練、未租 GPU、未使用付費 API。歷史 A 仍只作聽感標竿。

## 安裝與網路

上游固定 commit b4570b876f5c086819ba84e3215472733c6a7b70。186 個原始 Python 檔與官方 tar 比對，無改動；沒有用替代 TTS 聲音。
執行器連網使用 exec_command 的 sandbox_permissions=with_additional_permissions、additional_permissions.network.enabled=true；保留繼承的 HTTP_PROXY／HTTPS_PROXY／CA 信任，不繞過代理或平台權限。
V2.4 的舊網路結論已加更正，V2.5 診斷另存 docs/network-v2.5.md。不存在「白名單沒開」或「代理已證實故障」的現行結論。

獨立執行環境 /workspace/voice-runtime/venv：Python 3.12、torch 2.6.0+cpu、torchaudio 2.6.0+cpu、numpy 1.26.4、transformers 4.51.3、CPU onnxruntime 1.20.1。pip check 通過，無 CUDA runtime／NVIDIA 套件。
只裝實際推論匯入依賴；Lightning、torchmetrics 與 matplotlib 因上游匯入圖需要而保留，沒有執行 Trainer、優化器或訓練。
jieba_fast 編譯改用現有 GCC；補上匯入需要的 resampy、matplotlib 並固定 numpy／contourpy 相容版本。沒有修改其他專案的 Python 或 Node 環境。
完整可重建版本見 config/requirements-cpu.v2.6.lock.txt；.in 是挑選依賴的紀錄，正式重建應用 lock。

必要模型：原五個大檔約 1.690 GB 已按 V2.4 bytes 與 SHA-256 全數驗證；另補上上游文字切分實際需要的官方 fastText lid.176.bin（131266198 bytes）、小型設定檔。
config/model-assets.v2.6.lock.json 保存固定 HF commit URL、精確大小與實測雜湊。五大檔比對原官方 LFS hash；設定檔／fastText 是取得後計算的雜湊，不冒稱有發布者簽章。
含壓縮 G2PW 的資產清單共 1821781389 bytes；上游程式、G2PW 解壓及兩個 venv 等合計工作區約 4.7 GiB（不是單純權重大小）。仍有約 26 GiB 可用磁碟。

另建獨立、可省略的 asr-venv，用約 75 MiB 的免費本機 tiny 模型核對參考與輸出，沒有上傳音訊、下載 ASR 大模型或加入 TTS 執行依賴。ASR lock 獨立保存。初裝 av19 與 faster-whisper 不相容，已固定 av16.0.1。

## 參考逐字稿

原 A／B、原始81秒錄音與所有舊成果均未覆寫。
使用者新提供的兩段文字與候選 WAV、完整原錄音透過無 initial prompt 的 tiny ASR 交叉比對，大致相符；A 首段有額外一字的 ASR 差異，原長錄音相同句未出現。具體字詞及時間保存在私人 reference-review-v26.json，非公開文件。
尚未宣稱人工逐字核定或首尾音素邊界已證實；本輪依使用者提供文字進行有標示限制的首輪生成，供本人聆聽驗收。

## 實際測試

所有生成：官方 classic v2、CPU FP32、兩執行緒、seed 20261028、temperature 1.0、top_k 15、top_p 1.0、speed_factor 1.0、batch 1、串行、非串流；無 GPU acceleration、super sampling 或額外參考混音。
實際載入權重、參考 hash、參考逐字稿、目標文字與完整有效參數保存在 PRIVATE/run-*/request.json、inference.log、result.json；這些檔案不推送公開 GitHub。

初版 cut5 的 A 9.48 秒／B 7.04 秒雖然成功生成，但短片段疑似漏讀，保留為未通過品質的初版。只做一輪控制變因修正：cut5 → cut0，其餘參數一致，A／B 都重做。
交付版本：run-A-cut0、run-B-cut0。沒有強制裁成10秒，沒有變調、強力降噪或後製改速。

| 交付版 | 輸出長度 | 純推論 | 冷程序總耗時 | 主程序 peak RSS |
| --- | ---: | ---: | ---: | ---: |
| A cut0 | 7.22 秒 | 24.94 秒 | 36.13 秒 | 4.84 GiB |
| B cut0 | 7.82 秒 | 24.96 秒 | 35.94 秒 | 4.87 GiB |

冷程序總耗時包含匯入、雜湊驗證、載入、推論與退出，不等於 model_load_seconds；每段獨立程序，避免把共用高水位冒當單段測量。
A CPU user/system 約45.59／2.36秒；B 約44.10／2.36秒，因兩執行緒 CPU 時間可高於牆鐘。
監控限制為程序樹 RSS 7 GiB、時間20分鐘、磁碟剩2 GiB；沒有觸發停止或 OOM。
cgroup 計數含可回收 file cache 曾達8 GiB配額並出現回收壓力（memory.events max 增加），但 oom／oom_kill 都是0；不代表程序本身需要8 GiB，也不代表可以安全並行多個推論。
完整非敏感數字見 docs/test-results.v2.6.json。

## 品質與適用範圍

4 個生成 WAV 都可完整解碼；交付 cut0 版 ASR 覆蓋完整目標語句，包含姓名所在句。小型 ASR 對部分詞／姓名出現近音辨識及 B 的字詞疑義，細節留在私人報告。
ASR 不是聲線相似度或發音品質驗收，不能宣稱台灣口音、姓名讀音及自然度已通過。請本人試聽兩個交付檔。
此環境可繼續短句、單工作序列的參數優化；不要並行兩個 TTS 程序，長文與更大模型仍未驗證，不建議在本環境訓練。
沒有新增付費服務；原有雲端環境本身計費取決於使用者帳戶，本輪未變更方案或租用資源。

## 重建與避免再次遺失

1. 從 voice-recovery-v2.6 分支或程式碼 ZIP 取得程式及 lock；ZIP 的 repository.bundle 保留本機原歷史。遠端分支承接既有遠端歷史，不能強制推送本機不相關根歷史。
2. 將私人音訊 ZIP、可選模型 ZIP 與校驗清單下載到私人持久儲存。工作區不是永久備份；沒有建立公開音訊／模型分享連結。
3. 模型 ZIP 解壓至獨立 runtime 目錄；含已驗證官方資產、原始上游 tar、ASR tiny（可選）與完整清單，不含 venv。私人音訊 ZIP 解壓至 repo 外的 voice-private 目錄。
4. 在取得正式工具網路權限的命令中執行 `python scripts/setup_cpu_v26.py --runtime /PRIVATE_RUNTIME`。它會驗證／重用已有模型，從固定來源重建 venv，只取所需資產；不修改代理、不安裝 CUDA、不訓練。即使重用模型，pip 重建仍需網路；未提供完整離線 wheelhouse。
5. 若沒有模型 ZIP，同一腳本可由固定 URL 下載，並按 lock 驗證。下載與完整重建腳本的第二環境 round-trip 尚未實跑；本輪已在當前環境完成各組件安裝與真實推論。
6. 新環境路徑通常不同：執行 `python scripts/relocate_request_v26.py --input /RESTORED_PRIVATE/v2.6/run-A-cut0/request.json --output /NEW_PRIVATE_RUN/request.json --upstream /PRIVATE_RUNTIME/GPT-SoVITS-b4570b876f5c086819ba84e3215472733c6a7b70 --private-root /RESTORED_PRIVATE`；這會寫新檔，不覆寫舊 run。
7. 執行 `python scripts/monitor_tts_v26.py --report /NEW_PRIVATE_RUN/resources.json --log /NEW_PRIVATE_RUN/inference.log -- /PRIVATE_RUNTIME/venv/bin/python scripts/run_tts_v26.py --upstream /PRIVATE_RUNTIME/GPT-SoVITS-b4570b876f5c086819ba84e3215472733c6a7b70 --request /NEW_PRIVATE_RUN/request.json`。監控工具需要 psutil（在已建立 venv 或系統 Python 中）；run_tts 不需網路且會再核對全部模型與參考 hash。
8. 每次生成使用新 run 目錄；保留私人原文／輸出／雜湊／資源紀錄，公開 Git 只保存非敏感程式、依賴、模板與匿名摘要。下載保存後再核驗 SHA-256，才完成跨任務的私人持久備份。
