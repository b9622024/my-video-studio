# V2.5 素材與授權

查核日期：2026-10-28。Pexels授權 https://www.pexels.com/license/ 允許免費商用及修改，禁止暗示背書或把原片另作stock平台散布；本片不宣稱無品牌飲品是指定商品，也不把影片宣告為CC0。

|成片區間|來源／作者|原片區間|用途|
|---|---|---|---|
|0–4秒|Pexels6535488／ROMAN ODINTSOV|4–8秒|直式倒奶注意力鏡頭|
|4–8秒左窗|Pexels6535488／ROMAN ODINTSOV|11–15秒|暖色玻璃杯比較示意|
|4–8秒右窗|Pexels11158788／Towfiqu barbhuiya|27–31秒|另一個真實杯型／液流，不同拍攝來源|
|8–12秒|Pexels11158788／Towfiqu barbhuiya|31–35秒|右窗連續擴展，倒入停止、液面收束；無片尾停格|

- https://www.pexels.com/video/a-person-pouring-a-milk-inside-the-glass-6535488/
- https://www.pexels.com/video/pouring-milk-to-empty-glass-11158788/

實際尺寸／長度／SHA-256、原片與工作片對應見根目錄asset-manifest.json。影片去除聲音；不含真人聲紋、AI配音或音效。授權工作trim僅在本片還原備份保存，不提交公開Git；未重新散布原始stock庫。

## 搜尋與下載限制
沒有PEXELS_API_KEY。一般搜尋引擎用具體動作尋找官方頁，再人工查看官方下載連結；沒有建爬蟲、反覆輪詢API或繞過限制。

以下官方頁與Free download鏈結可查，但官方CDN回403，未取得原片：
- 7121318／Ivan S：https://www.pexels.com/video/pouring-milk-on-a-glass-cup-7121318/
- 8492937／ArtHouse Studio：https://www.pexels.com/video/a-bottle-of-milk-being-placed-on-a-table-8492937/
- 8004756／Darina Belonogova：https://www.pexels.com/video/a-person-using-a-milk-frother-8004756/

候選尺寸與約略長度僅據官方頁，未用ffprobe驗證；建議起訖與裁切保留null，不能假裝看過。4110201被官方標為植物奶／非乳品，排除，不把白色外觀當成牛乳。

本次每段保存3項候選方案（可用／未選／403分開），不代表每段有3段可下載推薦。沒有找到並取得同一場景兩杯牛乳或正式量杯的更理想素材；使用兩個真實影片視窗並列及無單位示意尺作簡潔替代，不合成假共用桌面或虛構mL。

## 數據與字型
V2.4指定全聯商品頁在2026-10-28再次開啟，仍為每100mL脂肪3.7g／1.4g；統一200mL顯示7.4g／2.8g：
- 福樂一番鮮特極全脂鮮乳1830ml，條碼4710043020144：https://shop.pxgo.com.tw/hourArrive/goods/237841-21210049-4710043020144
- 福樂一番鮮優質低脂鮮乳1830ml，條碼4710043020595：https://shop.pxgo.com.tw/hourArrive/goods/237842-21210052-4710043020595

數據取自商品標示，非實拍容量或成分測量，也不是所有品牌共同值。正式發布前如包裝配方更新應再核對；不能用畫面奶色推論脂肪。字型沿用Noto Serif TC600、SIL OFL1.1，含授權文字，來源／hash沿用docs/asset-manifest.json。沒有新生成圖片或新付費服務。
