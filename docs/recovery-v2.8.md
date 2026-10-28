# V2.8：A0 完整短影音配音測試

2026-10-28 UTC。使用者正式選定 V2.7 A0。A1 停頓過長、A2 未明顯改善，因此本輪不再調整或使用這兩個版本。
沿用現有 classic v2 CPU 環境，沒有下載模型、重裝套件、訓練、付費 API 或 GPU。

## 真實設定與四段生成

直接讀取 /workspace/voice-private/v2.7/A0/request.json，並在每次執行前驗證本人8.25秒參考及全部模型SHA-256。
上游 commit b4570b876f5c086819ba84e3215472733c6a7b70；classic v2 CPU FP32，torch 2.6.0+cpu。
模型來源／HF revision／大小及hash沿用 config/model-assets.v2.6.lock.json，沒有替換權重或聲線。
text_lang/prompt_lang=all_zh，seed=20261028，temperature=1.0，top_k=15，top_p=1.0，speed_factor=1.0，cut0，repetition_penalty=1.35，fragment_interval=0.3，batch=1，串行非串流。
完整有效數值設定見 config/narration.v2.8.json；私人參考文字、目標段落與各段實際request/result/log只保存在私人空間。
prepare_segments_v28.py 從真實 A0 request 複製，四段只有 inputs.text 不同；其餘inputs、模型設定與參考hash逐欄一致。每段同一固定seed、獨立程序，不在一個長文請求內生成。

## 實測交付

| 段落 | WAV長度 | 純推論 | 含啟動總耗時 | 主程序 peak RSS |
| --- | ---: | ---: | ---: | ---: |
| 1 | 6.66秒 | 21.80秒 | 34.05秒 | 4.80GiB |
| 2 | 5.26秒 | 19.41秒 | 29.66秒 | 4.65GiB |
| 3 | 6.46秒 | 23.91秒 | 34.97秒 | 4.76GiB |
| 4 | 7.66秒 | 24.30秒 | 34.88秒 | 4.87GiB |

完整 WAV 26.04秒，落在25–30秒目標內。所有WAV為32kHz mono PCM16，完整解碼通過，未出現數位滿幅削波。這不是感知音質、聲線或正式使用合格的自動評分。
OOM及OOM kill計數仍為0。CPU逐段執行，沒有並行多個TTS。

## 接合與停頓

完整檔案段落範圍為0–6.66、6.66–11.92、11.92–18.38、18.38–26.04秒。
每段模型輸出已含0.3秒精確零樣本尾端；join_wavs_v28.py只在完整段落邊界逐樣本串接。
未裁任何樣本、補任何靜音、交疊淡化、改速、變調或硬裁到目標秒數；合併PCM與四個原始PCM串列逐位元組一致。
inspect_wav_v28.py以20ms RMS<-35dBFS記錄低能量區間。完整檔案6.18–6.80、17.88–18.52、23.64–24.24秒各約0.60–0.64秒；這是聲學線索，不是已確認過長停頓、純靜音或安全剪輯邊界，故未自動刪除。

## 發音檢查與待驗收

使用既有、無initial prompt的免費本機tiny ASR，分段及完整音訊各做輔助辨識，沒有新增下載。第三段重點字詞有ASR文字支持；第一、二、四段的重點詞和部分句尾有辨識差異。
無法僅根據小型ASR的選字確認是否實際讀錯、漏音或重複。姓名同音字差異不判錯；也沒有把ASR猜對品牌當成發音通過。
具體字詞、各段與完整檔案的粗略時間位置保存私人 pronunciation-review.json 和 DELIVERY_zh_TW.md，請使用者聽音核定。
尚未取得可確認「明顯發音錯誤」的人工聽音證據，沒有擅改固定seed、參考或取樣參數以迎合ASR。完全相同的確定性請求重跑預期會重現同一波形，因此未空轉重生成。
若使用者指出某段實際有錯，下一輪只為該段建立新候選並保留另外三段，不重新生成全篇。
結論：已驗證目前A0技術流程可完成26.04秒四段式短影音音訊；發音、自然停頓與本人聲線的正式使用標準仍待本人試聽。

## 私人交付與保存

/workspace/outputs/voice-v2.8：四個獨立WAV、完整WAV、各段私人request JSON、join-report與中文私人交付表。
/workspace/voice-private/v2.8：目標script.json、四段完整參數、原始WAV、生成日誌、資源報告、ASR與發音疑義紀錄。
V2.7人工確認版私人備份覆蓋的114個檔案重新核驗均未改動；V2.6模型備份與A0原輸出保留。
私人備份ZIP包含所有救援與歷代私人資料，並實際解壓及核對完整清單；程式碼ZIP含本機Git bundle。模型沿用已保存的V2.6模型備份，不重複打包或下載。
非敏感腳本、數值設定與摘要保存 voice-recovery-v2.8 分支，承接V2.7遠端歷史，沒有force push。真人錄音、生成音訊與原參考逐字稿不公開。
ZIP必須由使用者下載至私人持久儲存；Codex workspace不是永久備份，未建立公開音訊分享連結。

## 重建與再執行

1. 先檢查既有runtime與V2.6模型lock／備份，按 docs/recovery-v2.6.md 恢復，避免重複下載。
2. 使用 prepare_segments_v28.py --baseline PRIVATE_A0/request.json --paragraphs PRIVATE_V28/script.json --output-root NEW_PRIVATE_ROOT，寫全新目錄，不能覆寫歷史。
3. 依V2.6的 monitor_tts_v26.py／run_tts_v26.py 命令逐段執行；新任務路徑不同時先用 relocate_request_v26.py，保留原文、數值與hash。
4. 四段完成且確認採用後，用 join_wavs_v28.py --output NEW_FULL.wav --report NEW_JOIN.json 段1.wav 段2.wav 段3.wav 段4.wav 接合。它只接受一致PCM規格並拒絕覆寫。
5. 用 inspect_wav_v28.py --output NEW_AUDIT.json 檔案... 檢查，再以私人表做人工聽感驗收。每次變動保留獨立版本與新備份，不把技術可執行誤當品質已通過。
