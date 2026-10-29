# 原創圖像生成規格與重建提示詞

工具：此對話內建 `image_gen.imagegen`，`transparent_background=true`。未接入外部付費API。底層全新生成；米飯以新底層為視角／光源參考；飯匙以新底層及米飯圖為參考。未使用 C1 照片、Pixabay、舊M3照片或其遮罩。

以下為可供重建／交回ChatGPT使用的規格化提示詞；模型版本、seed及精確3D相機參數未由工具提供，不假造這些資料。重新生成不能保證像素一致。精確重建本輪三張構圖應使用審核包內的原始PNG與雜湊。

## 固定餐盤／食物底層

Create an ORIGINAL premium Japanese editorial 2.5D food-animation asset, not a photo collage or SVG art. One single isolated full warm ivory ceramic dinner plate with natural rim, nearly overhead camera tilted only 15 degrees from vertical, front edge at bottom. Center the whole plate on transparent alpha, no patterns or lettering. Tactile, beautifully detailed, realistic soft miniature / hand-finished editorial render, restrained colors, not cartoon or toy. Large soft upper-left light, gentle down-right contact shadows. Top-left plate quadrant: steamed broccoli, leafy greens, a few carrot slices. Top-right: three tidy lightly browned grilled chicken breast pieces. Entire LOWER HALF clean and EMPTY, reserved for separate rice. No rice, fork, knife, spoon, chopsticks, napkin, extra dish, table, hands, text, borders, infographic, nutrition ratios or symbols. No floating or deformed food. Native transparent alpha around plate and soft contact shadow. Fixed plate, vegetables and protein will be reused unchanged across states.

## 三種獨立米飯狀態圖集

References: the newly generated fixed plate image, for style/camera/light only. Generate ONLY THREE separate whole mounds of cooked Japanese short-grain white rice, one horizontal row on fully transparent alpha, widely separated in three columns. Left LESS, center intermediate, right MORE. Each one coherent natural irregular mound, independently designed whole; NOT cloned, translated or scaled duplicates and NOT rice stamps pasted together. Different grain arrangements but same moist short-grain texture, grain scale, white balance and premium editorial rendering. Same nearly overhead camera as reference and soft upper-left light, contact shadows down-right. Same imaginary plane/baseline and camera distance. Larger amounts spread into larger footprint and naturally increase height. Clean natural grain edges; subtle integrated contact shadow, no black fringe. No plates, bowls, utensils, vegetables, chicken, hands, labels, arrows, decorative lines, background tiles or checkerboard. Reference plate must not appear in the atlas.

## 空／載飯飯匙候選

References: newly generated fixed plate and rice states. Only TWO separate wooden Japanese rice paddles on transparent alpha, identical silhouette, size, angle and upper-left lighting. Wide empty gutter. Left empty; right carries a small cohesive spoonful of short-grain rice. Broad serving head lower-left, handle upper-right, whole tool visible. Pale beechwood, tactile grain, refined realistic editorial miniature render, not cartoon/collage. Rice rests ON the loaded paddle, no floating or penetration. No extra rice mounds, other utensils, hands, dish, plate, text or marks. Clean native transparency; no large ground shadow.

實際結果：兩把生成匙沒有做到精確相同輪廓，因此只列為候選，不得當作可直接切換的動畫資產。

## 靜態核准後仍需補的生產資產

1. **單一飯匙本體**：只使用同一原創空匙為固定工具，不以另一把生成匙替換它。
2. **可分離匙上米飯層**：參考固定飯匙，只生成對應的載飯物件及細緻接觸陰影，原生alpha，須與匙面方向／深度吻合。
3. **A→B、B→C 的註冊中間態**：固定盤子、食物、相機與光源；米飯只在真實接觸區增加，既有米粒不能全局重排或變形；匙覆蓋以外不得突然跳動。模型若做不到，需人工美術整理或改分鏡，不可淡化交疊。
4. **運動接觸陰影／前景遮擋**：匙接近盤面才產生對應陰影；明確區分匙、匙上米飯、落盤米飯的前後關係。不是把烘焙陰影隨物件漂浮。

這些是素材需求，尚未聲稱已完成。三張靜態圖的人審核准不能替代動作資產檢查。
