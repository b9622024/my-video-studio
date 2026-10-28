# V2.4：人工核對與 classic v2 CPU 執行評估

日期：2026-10-28 UTC。未訓練、未下載模型、未生成配音、未新增付費服務。
本文件及模型來源清單可公開；聲音、逐字稿與核對表留在私人備份。

## 參考音訊狀態

V2.3 已切的兩個候選以原始位元組獨立匯出 WAV，SHA-256 與來源記錄一致；原 A／B 未覆寫。
新 A：來源原錄音 6.850–15.100 秒（8.25 秒）。新 B：17.150–25.450 秒（8.30 秒）。
規格皆 48 kHz、mono、16-bit PCM。未降噪、變調、增益或重採樣。
ASR 執行器及模型快取仍缺；沒有可靠的原始口白可對應到這兩段。歷史生成用候選目標文字不能用來猜原錄音。
逐字稿均標記「等待人工核對」，內容留空，明確標示全段待填。句子完整性、換氣與噪音尚未經聽音核定，不能從停頓檢測推斷。
私人 reference-review.json 保存每段路徑、SHA-256、來源時間與待核對欄位；核定前禁止進入推論。

## 確切程式版本與執行入口

候選上游：https://github.com/RVC-Boss/GPT-SoVITS/commit/b4570b876f5c086819ba84e3215472733c6a7b70
使用此固定多版本程式的 classic `version: v2`，不是 v2Pro、v2ProPlus、v3、v4 或 v5，也不是歷史 A 的已恢復版本。
已讀該 commit 的 tts_infer.yaml 與 TTS.py：v2 CPU／is_half=false 有明確配置。TTS.py 第 411–414 行亦將 CPU half 設定關閉。
同檔第 927–928 行檢查 16 kHz 參考為 48000–160000 samples，即 3–10 秒；新 A／B 及歷史 B 的長度符合，歷史 A 約 11.47 秒則不符合此入口，不能直接拿去重現。

不需啟動完整 Gradio WebUI 或訓練介面，可用官方 api_v2.py 本機推論入口，或 TTS_infer_pack/TTS.py 程式介面。API v2 名稱本身不代表模型已選 v2。
精簡「執行入口」不代表只需 torch：TTS.py 仍匯入 Lightning、Transformers、PEFT 及其他共享模組；需在隔離 venv 建立可實測的依賴集合，尚未驗證可移除哪些套件。
官方 requirements 對 x86_64 預設列 onnxruntime-gpu；CPU 方案需驗證 onnxruntime CPU provider 與文字前端相容性，不能盲目安裝 CUDA 套件。
G2PW 缺目錄時會嘗試自動下載，模型準備後也需先設離線環境並確認所有檔案存在，避免推論時偷偷拉模型。

## 權重精確大小（中繼資料，尚未下載）

來源為官方 README 指向的 HF repo，查閱各檔 raw Git LFS pointer，取得 payload size 與預期 SHA-256。

| 檔案 | bytes | 十進位 MB |
| --- | ---: | ---: |
| s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt | 155315150 | 155.315 |
| s2G2333k.pth | 106035259 | 106.035 |
| chinese-roberta-wwm-ext-large/pytorch_model.bin | 651225145 | 651.225 |
| chinese-hubert-base/pytorch_model.bin | 188811417 | 188.811 |
| G2PWModel.zip | 588856634 | 588.857 |
| 已知大檔合計 | 1690243605 | 1690.244 |

大檔約 1.690 GB（1.574 GiB）。另需 BERT config/tokenizer、HuBERT config/preprocessor 等小檔；精確小檔總量尚未取得。
這不是完整環境大小：不含 G2PW 解壓、Python wheels、虛擬環境及快取。G2PW 解壓大小、CPU torch wheel 及解析後的全部套件總量未知。
不需要下載 s2D discriminator、UVR5、全系列模型或 ASR 大模型來執行 classic v2 的這個測試。
config/model-assets.v2.4.json 保存原始位元組數、預期雜湊與來源，尚未本機驗證。部分網頁快取為 2 天前；正式取得前需再固定 HF commit，並以這些預期雜湊驗證。

## CPU RAM、時間與磁碟

已知雲端配額：約 2 核 CPU、8 GiB RAM，沒有可見 NVIDIA GPU，磁碟約 30 GiB 可用。
CPU 路徑有程式碼依據，但尚無模型、依賴或 smoke test；不能宣稱目前可執行。
官方檢查的文件未給此 exact classic v2 commit 在 2 核／8 GiB 上的峰值 RAM或產生 10 秒中文的耗時基準。
峰值記憶體：未知。序列化 FP16 檔案大小不能等同 CPU FP32 常駐或推論峰值，還有 ONNX、activations、載入暫存與其他模型。
10 秒輸出耗時：未知，不能引用 v2ProPlus 的 GPU／Apple CPU 數字估 classic v2。冷啟動與暖機後應分別實測；1.0／0.95 速度亦不保證正好輸出 10 秒。
可用磁碟足以容納上述已知大檔，但無法據此保證整套相依與快取均能容納。初步預留 10 GiB 是作業預算，非實測完整總量；下載前仍需完整資產與套件大小核算。
若後續獲准準備模型，先固定 2 執行緒、batch=1、cpu、FP32，在 /usr/bin/time -v 下做短句 smoke test，記錄峰值 RSS、cgroup memory.peak 與 elapsed；再量 10 秒級內容的暖機耗時，不在本輪執行。

## 網路與費用

V2.5／V2.6 更正：下列失敗是當時命令執行沙箱未取得正式網路權限，不能解讀為代理或模型下載來源故障。網路政策 unrestricted 已生效；在工具提供 network.enabled=true 權限後，現有 proxy:8080、GitHub、PyPI、Hugging Face 與 PyTorch 來源均成功。後續連網命令沿用代理與正式網路權限，不取消沙箱或繞過平台控制。


2026-10-28 執行器 curl 小型 HEAD 檢查：HF 兩個 metadata URL、GitHub、PyTorch CPU wheel index 全部 return code 7，無法連上 proxy:8080，未進入來源站。
GitHub 連線工具及網頁查詢可讀官方資料；這與執行器下載通道不同，不能當成模型下載成功。未繞過代理。
上述公開權重來源可下載，不需付費 TTS API；CPU 本機推論也不需租 GPU。本輪未購買或新增資源。
現有雲端環境本身的計費／流量／私人雲端容量費率未提供，因此不能保證帳戶全部費用為零；尚無可靠完整安裝與推論時間，無法估算現有 CPU 使用成本。

## 三組受控測試（全數 pending）

config/voice-test.v2.4.template.json 已保存同一模型、目標文字、seed=20261028、temperature=1.0、top_k=15、top_p=1.0、cut5 及其他固定參數。
T1：核定歷史 B 及其逐字稿，speed_factor=1.0。
T2：只換核定新參考與其對應逐字稿，speed_factor=1.0。
T3：沿用 T2，只改 speed_factor=0.95。
新設定是待驗證提案，不是歷史 A 遺失參數。歷史 A 僅作盲聽標竿。
前置條件尚未滿足：歷史 B／新參考／目標文字核定、下載通道恢復、權重本機雜湊驗證、依賴與 CPU smoke test，以及使用者同意開始正式測試。

## 保存與下一任務還原

遠端新分支從現有 voice-recovery-v2.3 的遠端 HEAD 建立，僅新增／更新經審查文字檔；不 force push，不改寫 V2.3。
本機仍保留原本歷史，程式碼 ZIP 含 Git bundle；遠端和本機 SHA 不同是預期狀態。
私人 WAV、逐字稿核對表與聲線資產不進公開 GitHub，V2.4 私人 ZIP 包含 V2.3 的全部救援資料及新核對紀錄。
程式碼與私人備份均實際解壓驗證後交付，但雲端暫存不是永久保存，也無法確認使用者是否已下載到私人 Google Drive／iCloud。
只有使用者下載、異地保存並可校驗還原後，才能確認私人音訊具跨任務備份；本輪沒有假裝已設定持久磁碟。

## 官方依據

- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/GPT_SoVITS/configs/tts_infer.yaml
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/GPT_SoVITS/TTS_infer_pack/TTS.py
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/api_v2.py
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/GPT_SoVITS/text/g2pw/onnx_api.py
- 各模型 raw LFS pointer URL 見 config/model-assets.v2.4.json。
