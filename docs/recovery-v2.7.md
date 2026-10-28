# V2.7：A 聲線的停頓與參考音訊受控比較

2026-10-28 UTC。沿用已安裝、已驗證的 classic v2 CPU 環境；沒有重裝、下載、訓練、付費 API 或 GPU。
使用者對 V2.6 的實際回饋：A 相對自然但有機械感，B 某些語調偏向中國大陸普通話。因此本輪以 V2.6 交付 A（run-A-cut0）作基準，不用歷史遺失設定的 A 冒充可重現基準。

## 真實基準與模型

直接讀取 V2.6 run-A-cut0/request.json、result.json 及實際檔案。
上游 commit b4570b876f5c086819ba84e3215472733c6a7b70，classic v2，CPU FP32，torch 2.6.0+cpu，兩執行緒。
GPT s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt；SoVITS s2G2333k.pth。權重來源／版本／SHA-256 沿用 config/model-assets.v2.6.lock.json，全部在執行前重新驗證。
基準 text_lang=all_zh、prompt_lang=all_zh、top_k=15、top_p=1.0、temperature=1.0、speed_factor=1.0、seed=20261028、text_split_method=cut0、repetition_penalty=1.35、fragment_interval=0.3。
完整其他有效參數見 config/voice-comparison.v2.7.json；私人參考路徑、逐字稿與實際送入的文字保存在私人 request.json 及 COMPARISON_zh_TW.md，不公開。

## 三組交付與差異

A0：模型、參考、文字與所有有效推論設定完全沿用 V2.6 交付 A；重新生成 WAV 的 SHA-256 與 V2.6 A 完全一致，證實這次環境可逐位元組重現。
A1：交付版對應私人 A1-punctuation/；只把老師分句後的逗號改句號，並在「今天」後加逗號。字詞不變，cut0、fragment_interval、取樣參數、參考及 seed 全部同 A0。
A2：私人 A2/；只換參考音檔和對應參考文字，目標文字、模型、seed 與全部有效推論參數同 A0。新片段取自原錄音 34.20–42.35 秒，8.15秒、48kHz mono 16-bit PCM，只裁切與編碼、不降噪、變調或改增益。未覆寫原錄音或既有參考。

另保留一個非主要交付的 A1 初版（私人 A1/）：cut3、fragment_interval 0.22，其餘同 A0，輸出6.96秒。因輔助 ASR 出現可能的字詞替換疑義，額外做一次只改標點的候選；這不證明初版真的讀錯，也不證明交付版聽感比較好。沒有持續任意掃 seed 或大批試參數。
prepare_trials_v27.py 可建立相同輸入：預設 A1 punctuation；--pause-policy sentence_split 可重建初版。實際輸入與腳本輸出經逐欄核對一致。

## 結果與限制

| 交付版 | 音訊長度 | 純推論 | 含啟動總耗時 | 主程序 peak RSS |
| --- | ---: | ---: | ---: | ---: |
| A0 | 7.22 秒 | 22.17 秒 | 32.90 秒 | 4.82 GiB |
| A1 punctuation | 8.38 秒 | 25.06 秒 | 35.52 秒 | 4.95 GiB |
| A2 | 6.86 秒 | 24.94 秒 | 36.49 秒 | 4.79 GiB |

三段皆為32kHz mono 16-bit WAV，完整解碼通過、未出現數位滿幅削波；沒有強制裁成相同秒數或後製時間伸縮。這些檢查不能證明沒有感知失真、漏字或重複。
OOM 與 OOM kill 計數仍為0。cgroup 包含可回收 file cache 可接近8GiB，不應並行多個 TTS。

新參考的片段 ASR 辨識到全部預期語句。生成完成後，使用者明確回覆「文字與首尾正確」，因此 A2 參考逐字稿與起訖已人工核定。原生成時的 request.json 仍保留 ASR_supported_pending_human 歷史狀態，私人 A2-human-confirmation.json 另存對應音檔 hash 的後續確認。此確認不代表生成音檔的口音、自然度或聲線相似度已通過。
輸出 ASR 作為完整性疑義線索，不作台灣口音、捲舌、自然度或聲線相似度分數。姓名同音異字不判錯；其他辨識差異也不能直接當確定發音錯誤。具體詞與時段保存在私人比較報告。
A1 有一段約0.90秒的低能量內部區間，A0 最長約0.48秒，A2 約0.72秒；這是20ms RMS<-35dBFS的聲學觀察，不是已核實的語句停頓邊界。沒有自動剪掉該區間，因其中可能有低音量語音或呼吸。請特別核對 A1 是否停頓過長。
本輪未宣稱已達到「比 V2.6 A 更自然、更台灣」；這個成功標準等待使用者對三段實音作聽感判斷。不是以成功產生 WAV 當作口音優化通過。

## 私人交付與保存

輸出目錄 /workspace/outputs/voice-v2.7 提供三段獨立 WAV、A0/A1 共用參考、新 A2 參考、每段完整私人 request/result JSON 及中文比較表。
私人 /workspace/voice-private/v2.7 保留全部原始輸出、初版 A1、ASR、逐字稿與日誌。V2.6 私人備份清單的每個檔案重新驗證均未改動。
新私人備份包含所有救援與 V2.6/V2.7 私人資料，程式碼備份含本機 Git bundle；模型未重複打包，仍使用 V2.6 模型備份及固定雜湊清單。
非敏感程式、數值參數與摘要保存新遠端分支 voice-recovery-v2.7，承接 V2.6 遠端歷史；不強制推送本機不相關根歷史。
ZIP 解壓與還原雜湊會實際驗證；私人檔案仍須使用者下載至私人持久儲存，不能依賴 Codex 工作區永久保存。

## 再執行

1. 沿用 V2.6 安裝及模型；若在新任務，先驗證現有模型及備份，按 docs/recovery-v2.6.md 恢復，避免重複下載。
2. 用 prepare_trials_v27.py 讀取實際 V2.6 A 私人 request，新參考與私人 transcript.txt，輸出到全新私人目錄；只有真正收到本人確認才能用 --reference-review human_confirmed。
3. 逐段使用 V2.6 monitor_tts_v26.py 與 run_tts_v26.py 執行，每段獨立程序。不要覆寫已存在的輸出。
4. 比較每段實際 request 與模型 hash；保留數值資源結果、原始 WAV 與私人 ASR 線索。
5. 依私人比較表逐項人工判斷捲舌、句尾、聊天感、關鍵句、漏字／重複／失真、本人相似度，再決定下一輪調整。不以 ASR 選字差異替代聽感驗收。
