# Codex輔助分鏡，不是後端LLM服務

讀取使用者繁體中文逐字稿，先辨認觀眾需要理解的因果與具體動作，再合併相鄰句子形成連續事件。不要每句硬配一鏡頭。沿用projects/bento-v1/scene-plan.json欄位，輸出schema_version、project_id、title、fps、source_script、script_provenance、analysis_origin與scenes。

每段必填：id/name/narration/viewer_takeaway/event/required_objects/required_actions/visual_mode/duration_seconds/search_queries/misleading_risks/animation_refs。英文queries以動作為主，每段先1–2個、最多3個，每個4–100字元。資料／機制不能靠實拍證明時選information_graphics並註記應查證資料，不能從畫面推定健康、體脂、營養或背書。記錄來源是Codex協助，不宣稱CLI能自動理解任意中文。

scaffold命令只保存逐字稿與待填框架；Codex完成分析後用validate檢查，再search。沒有額外付費LLM API。參考V2.5格式compat/v25，新增欄位不覆寫舊專案。
