# V2.3 狀態、環境與下一輪測試

日期：2026-10-28 UTC。本文件不包含私人逐字稿或聲音資產。

## 保存與安全

原 commit 91465f5 僅包含 .gitignore、README.md、config/voice-test.template.json、docs/voice-recovery.md、scripts/private_assets.py。
私人資產始終位於 repo 外；Git 新增 credential／替代音訊及模型格式排除規則。
提交前使用 scripts/check_public_files.py 檢查完整已追蹤檔案，人工審查文字內容；此掃描不能保證辨識所有類型機密，不能用 git add -f 納入資產。
GitHub metadata 確認 origin 為 b9622024/my-video-studio、public，連線帳號有 push 權限。CLI push 因 proxy:8080 無法連線失敗；GitHub 連線工具可存取，將以文字檔 API 保存快照，遠端 SHA 與本機 SHA 不會相同。
程式碼下載包包含本機 Git bundle，可復原 91465f5 起的歷史。bundle 僅供使用者下載，不放公開 repo；它包含正常 Git 作者資訊。
私人備份包含原始 ZIP、8 音檔、原逐檔雜湊、恢復紀錄與未核定參考候選；沒有公開音訊連結。
程式碼 ZIP 與私人 ZIP 均需使用者下載到持久儲存，工作區不算永久保存。

## 逐字稿與參考片段

使用者提供的歷史候選文字只存私人 transcripts.json，對照狀態為未驗證。本機可找到的任務／輸出紀錄沒有原始逐字稿或生成文字；10 秒結果不可用來證明整段候選文字完全一致。
沒有 whisper／whisper-cli／FunASR／Vosk 執行器與權重快取。HyperFrames 有免費本機 Whisper 入口，但沒有模型與執行器；直接呼叫可能自動下載，不在本輪執行。CLI 網路下載通道亦不可用。沒有假造 ASR 初稿或聽音核對。
A／B 對應逐字稿、停頓、句子起訖全部待確認；無法確認處標示為全段待核對。
依 100ms RMS 停頓邊界，從原錄音提取 6.85–15.10 秒、17.15–25.45 秒兩個候選（8.25／8.30 秒）。只裁切與轉 PCM，不降噪、不變聲、不調增益；未覆寫原 A／B。
這是聲學候選，尚不能保證完整句子、單一說話者或低雜音。未核對逐字稿前，不提升為標準參考、不進行推論。下一步需可用的本機中文 ASR 加人工校正，或使用者提供精確逐字稿。

## 實測環境

CPU：3 個邏輯 CPU 可見，但 cgroup cpu.max = 200000/100000，實際配額約 2 核。
RAM：宿主視圖約 9.7 GiB，cgroup memory.max = 8589934592（8 GiB）；無 swap。
GPU：未找到 nvidia-smi 或 /dev/nvidia*，未發現可用 NVIDIA GPU。
磁碟：工作區約 30 GiB 可用。Python 3.12.14、ffmpeg 7.1.5 已有。
未安裝 torch、torchaudio、transformers、librosa 等必要套件；目前 numpy 2.3.5 與官方 numpy<2.0 衝突，不能直接污染現有視訊環境安裝。

## 官方 v2 評估（已讀取來源，未下載模型）

上游：https://github.com/RVC-Boss/GPT-SoVITS
查詢 main 時 commit：b4570b876f5c086819ba84e3215472733c6a7b70。
官方 README 同時描述 v2／v2Pro／v3／v4／v5；本輪選 classic v2，不把 v2Pro 或 V5 當成遺失的歷史 A。
官方 tts_infer.yaml 的 v2 區塊支援 cpu、is_half=false。中文另需 BERT、HuBERT、G2PW；推論不需要下載訓練用 discriminator、UVR5 或全部 ASR 模型。

v2 權重官方來源：https://huggingface.co/lj1995/GPT-SoVITS/tree/main/gsv-v2final-pretrained
GPT：s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt
SoVITS：s2G2333k.pth
G2PW：https://huggingface.co/XXXXRT/GPT-SoVITS-Pretrained/resolve/main/G2PWModel.zip
權重實際檔案大小、HF revision、雜湊及全部相依模型總量尚未查證，不能宣稱已完成下載資源核算。
規劃預留至少 10 GiB 作依賴、模型與下載暫存的初始磁碟預算（是保守作業預算，非官方最低值或模型實測總量）；下載前先查清每個資產大小並加上解壓、快取空間。
CPU FP32 可作後續驗證方向，8 GiB RAM 是否足夠、實際峰值及耗時尚未量測；不能保證在此環境成功執行。
不必先付費即可準備流程；現有 CPU 可先評估，不自動租 GPU。GPU 加速非本輪必要條件，也未有已驗證免費 GPU。

相依來源：官方 requirements.txt、extra-req.txt、install.sh；主要含 torch／torchaudio、numpy<2.0、librosa==0.10.2、transformers>=4.51,<5、pytorch-lightning>=2.4、G2PW 相關文字前端套件等。上游 requirements 並非完整鎖定檔。
未建立虛假的 pip freeze。後續應用獨立 venv，選相容 CPU PyTorch，安裝成功後才輸出實際 lock 與 smoke test 結果。
官方 api_v2.py 是 API 介面名稱；僅使用 api_v2.py 不代表已選 classic v2 模型，須核對配置與實際載入權重。

來源檔：
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/README.md
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/GPT_SoVITS/configs/tts_infer.yaml
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/requirements.txt
- https://github.com/RVC-Boss/GPT-SoVITS/blob/b4570b876f5c086819ba84e3215472733c6a7b70/api_v2.py

## 可重建程序

1. 下載兩份 ZIP 到私人持久儲存，保留 SHA256SUMS.txt。解壓私人 ZIP 後執行 private_zip.py verify；清單不應上傳公開 GitHub。
2. 程式碼包中的 repository.bundle 可用 `git clone repository.bundle restored-code` 還原；或從已保存的 GitHub 分支取得文字快照。比較 commit、讀取本文件與設定範本。
3. 逐字稿與參考候選核對完成後，更新私人紀錄；原錄音永不覆寫。
4. 待可用網路恢復及模型下載確認後，在獨立目錄取得上述固定 upstream commit。逐一確認模型 revision／大小／SHA-256／授權，再取得必要資產；不執行會下載全系列的大型安裝捷徑。
5. 獨立 venv 安裝相容 CPU 依賴，保存鎖定版本與硬體快照。從官方 v2 區塊建立 custom cpu/FP32 config，明確指向已核對權重。
6. 於上游根目錄執行 `python api_v2.py -a 127.0.0.1 -p 9880 -c /PRIVATE_PATH/tts_infer.yaml`；尚缺模型／環境，這是未執行的待驗證命令。
7. 用 config/voice-test.v2.3.template.json 新建私人 run 紀錄，補齊參考、文字、所有權重與有效參數後呼叫本機 /tts。記錄實際載入權重日誌、耗時、輸出雜湊及 ffprobe duration；不把範本 status 改成已完成來假裝推論。
8. 每次 run 獨立目錄，原檔與輸出均不覆寫；先驗證再備份。新增資產後重新產生 ZIP 全檔清單與雜湊。跨任務還原測試後才標記持久保存完成。

## 下一輪三組（未執行）

前提：參考逐字稿核定、模型可運作、硬體 smoke test 通過。三組固定同一目標文字、模型、seed=20261028、temperature=1.0、top_k=15、top_p=1.0、speed_factor=1.0、cut5；這些是新提案，並非原 A 設定。
1. 新基準 R1：經核對的歷史參考 B（8.23 秒），先測短句再完整候選文。
2. 選段比較 R2：只改用核定的新 7–9 秒參考，對照 R1；完整記錄逐字稿作為參考條件的一部分。
3. 語速比較 R3：沿用 R2 參考及全部設定，只改 speed_factor=0.95；檢查台灣語調與自然度，避免同時改取樣參數。
歷史 A 音檔只做額外聽感標竿，不與新組宣稱為相同模型／參數。若兩個參考都未核定，三組保持 pending。
