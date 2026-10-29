# V1.2.3 新增載荷來源與提示詞

使用內建 `image_gen.imagegen`，`transparent_background=true`。只生成獨立載荷，沒有重新生成餐盤、蔬菜、雞肉、原飯堆或木匙。模型版本／seed未提供。下列為重建規格摘要，不保證重生成像素相同；原始輸出與雜湊在私人包及`payload-provenance.json`。

## v1：否決

參考：原paddle-loaded、paddle-empty、rice-A。

> Isolate ONLY the cohesive spoonful of white short-grain rice from the loaded-paddle reference. REMOVE all wood and utensil. One complete rice-only object on native transparent alpha. Same nearly overhead 2.5D view, upper-left light, warm ivory grain color, moist grain texture. No plate, tool, text, extra mounds, repeated stamps or broad floor shadow. One constant payload for continuous animation, not a complete meal state.

結果：成功產生可分離RGBA物件，但實際放到匙上後米粒過細，與原飯堆接觸處材質不一致，沒有為此材質版本渲染動畫。

## v2：本輪私人測試候選

參考：原rice-A及失敗的v1載荷。

> Create one corrected rice-only payload. Match the reference's plump large short-grain kernels, warm ivory color, moist highlights, upper-left light and near-overhead editorial 2.5D view. A much smaller coherent cluster, roughly 20–30 visible grains, about five or six grains across, three or four deep. Fewer visibly larger grains relative to the small cluster, not another large heap of tiny grains. No plate, paddle, wood, text, separate floating grains, floor shadow, smooth molded ball or repeated copies. Native clean alpha, one constant original payload layer.

粒數僅為圖像設計方向，沒有當作精確粒數／食物量資料。v2初放場景仍偏大，改用固定67邏輯像素寬度做米粒尺度註冊。這是固定素材尺寸，整段沒有用縮放表示份量變化。

原始v1和v2檔案皆保留。低alpha邊緣另存衍生檔；新載荷輸出時最多1個8-bit色階差，沒有主體重畫或幾何變形。最後用同一把空匙＋同一個載荷的連續位置約束生成接觸／分離中間態，沒有要求AI重新畫每一個完整動作場景來掩蓋註冊不一致。
