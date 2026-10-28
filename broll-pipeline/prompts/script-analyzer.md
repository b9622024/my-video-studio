# Codex輔助分鏡，不是後端LLM服務

讀取使用者繁體中文逐字稿，先辨認觀眾需要理解的因果與具體動作，再合併相鄰句子形成連續事件。不要每句硬配一鏡頭。沿用projects/bento-v1/scene-plan.json欄位，輸出schema_version、project_id、title、fps、source_script、script_provenance、analysis_origin與scenes。

每段必填：id/name/narration/viewer_takeaway/event/required_objects/required_actions/visual_mode/duration_seconds/search_queries/misleading_risks/animation_refs。英文queries以動作為主，每段先1–2個、最多3個，每個4–100字元。資料／機制不能靠實拍證明時選information_graphics並註記應查證資料，不能從畫面推定健康、體脂、營養或背書。記錄來源是Codex協助，不宣稱CLI能自動理解任意中文。

scaffold命令只保存逐字稿與待填框架；Codex完成分析後用validate檢查，再search。沒有額外付費LLM API。參考V2.5格式compat/v25，新增欄位不覆寫舊專案。

## V1.1 混合視覺分析（新增可選欄位，保留V1.0）

逐場景先回答：核心意思是什麼？是否必須拍到某個真實事件？哪些只是生活概念、情境或資訊解說？不可由影像暗示哪些沒有證據的結論？正式使用者逐字稿不得未經確認改寫核心意思；Codex自寫示範則須記錄改寫來源。

新增 visual_role（event_evidence/context_support/concept_explanation/process_demonstration）、visual_intent、required_evidence（event_mandatory/objects/object_state/action/context）、fallback_modes、fallback_reason、human_review_required。未提供新欄位時，後端保守視為需要事件證據，維持舊流程。

只在展示操作、實驗或實際成果時要求exact action。概念與情境支援可用已看過物件／狀態的contextual B-roll，不得聲稱未出現的動作。數據比較必須帶有來源與量測依據；缺證據時不得捏造數值。資訊動畫應呈現關係、過程或變化，不把逐句文字卡當動畫。

模式：exact_action_footage、contextual_broll、information_motion_graphics、user_provided_footage。推薦狀態：exact_match、contextual_match、motion_graphics_fallback、user_footage_required、no_acceptable_visual。只根據tags的候選仍metadata_only；scene intent改變可重新評估舊素材，但需說清楚先前被排除的「裝便當事件」已改為「餐點情境」，不是把舊失敗冒充exact_match。

先選符合事件的素材，再選情境素材，再選能搭配資訊動畫的素材，最後提出自有拍攝。每scene最多3項；未經使用者明確選擇不得寫正式approved-assets.json。對話回覆編號是首選審核管道，HTML保留為替代。核准後才下載正式rendition、編排時間軸、輸出540預覽；畫面品質核准後才能輸出1080正式影片。
