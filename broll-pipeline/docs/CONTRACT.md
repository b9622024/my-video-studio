# 四份資料與人工審核接口

V2.5原始四份JSON逐位元組保存於compat/v25，原專案不改。新專案以projects/<id>/保存相同四類資料，schema_version=1.0，並新增語意與審核欄位。

1. scene-plan.json：project_id、source_script、analysis_origin、fps、scenes。每scene有id/name/narration/viewer_takeaway/event/required_objects/required_actions/visual_mode/duration_seconds/search_queries/misleading_risks/animation_refs。Codex協助填語意；scaffold只建待填框架，不是後端中文LLM。
2. broll-candidates.json：真實API結果的正規化metadata、variants、thumbnail、作者／頁面、初篩分數、availability、visual_verification。每場景最多3支可連線候選；不到2支明確不足。HTTP錯誤與零命中分開。revision_id綁定本輪資料，舊審核不能套新候選。
3. asset-manifest.json：asset_id/provider/source_url/author/license_url/license_checked_at/duration/width/height/selected_trim/crop_parameters/source_sha256/visual_tags/review_status/project_id。未下載hash=null；visual_tags及動作未實看時保持空／未驗證。下載後增加實際ffprobe資料與local_path。
4. edit-timeline.json：只由完整人工核准、下載及hash核對後產生approved_for_edit；每clip有asset_id、scene_id、frames、source_seconds、selected_trim、crop_parameters、source_url、author、license_url、local_path、source_sha256、旁白與動畫／字幕reference。缺場景不自動填素材、循環或停格。

## 審核匯出
review-results.json：schema_version/project_id/candidate_set_id/provenance/decisions/search_again。採用需actual_action_description、action_verified、risk_reviewed、有效selected_trim及已核對crop_parameters；每scene最多一個approved。改裁切／描述後回pending。後端拒絕未知、重複、過期、跨專案或未核對資料。Reject永不送正式剪輯。

Search Again下載search-again.json，含project_id與requests[{scene_id,queries}]，回CLI執行；靜態頁沒有假搜尋按鈕，也不碰API Key。

## Remotion
先用compileEdit及validateEditInput驗證，再把核准media放入既有Remotion專案public/media，使用adapters/remotion/ApprovedBrollAdapter.tsx讀取remotion-input.json。這只是既有V2.5引擎的媒體消費接口；動態文字、分割畫面及字幕繼續由原引擎處理，沒有重建引擎。

本輪真實便當專案尚無核准素材，不會進正式編輯。合成紅色測試片只在暫存測試專案驗證資料接口，不是Pixabay候選，也不是人工作品核准結果。
