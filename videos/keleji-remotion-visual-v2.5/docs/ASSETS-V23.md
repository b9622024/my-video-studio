# V2.3 素材及授權紀錄

- **A 版物件 atlas**：以 V2.2 原創生成素材做 image_gen 精修。保留輪廓、位置與印刷圖案，改善玻璃高光及紙材。原1536×1024 RGBA；SVG依輪廓遮罩分離，未使用幾何盒子或幾何杯子取代物件。權利依據為 OpenAI 適用服務條款的輸出內容權利約定，非 CC0 或獨占著作權保證。https://openai.com/policies/terms-of-use/ 。明確為風格化合成，不是真實商品攝影或物理流體模擬。
- **B 版實拍**：ROMAN ODINTSOV，Pexels #6535488，頁名 A Person Pouring a Milk Inside the Glass。https://www.pexels.com/video/a-person-pouring-a-milk-inside-the-glass-6535488/ 。2026-10-28 查核頁面確認作者、2160×4096、29.97fps、約15秒。沿用本機既有研究原檔，未重新下載。
- **商用依據**：https://www.pexels.com/license/ 2026-10-28查核：允許免費使用與修改；列舉廣告及社群使用。禁止暗示人物／品牌背書、轉售未修改素材或重新經營素材平台。本片沒有可辨識人物、品牌、營養數字或背書。不是將素材宣告為公有領域。
- **B 取用方式**：原片4.0–8.0秒，維持1×速度；只去聲音、正常29.97→30fps取樣、縮放至1080×2048。Remotion再做9:16裁切、輕微暖調、4.5%推近及標題排版。未繪製或替換液體、玻璃或液面。未添加假資訊標註。
- **實拍限制**：容器在畫外，不能展示盒子傾倒；無法查證原片奶品脂肪含量，標題只提出問題，不能把畫面當成特定全脂產品實驗。
- **字型**：沿用 Noto Serif TC 600 子集，SIL OFL1.1。附public/assets/FONT-OFL.txt，原取得URL見font-source.json。
- Git僅保存原創圖、字型及來源紀錄；實拍原檔與取用片段不放公開Git。備份含實際使用的4秒工作片，僅用於本片還原，不作素材庫再散布。tools/acquire-footage.py可由官方CDN重新取得，保留代理並核對原檔SHA-256。

逐檔雜湊、來源大小與裁切參數見 asset-manifest.json。原 V2.2 atlas、影片與 Composition 均保留。
