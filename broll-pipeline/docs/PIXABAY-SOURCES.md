# 官方來源與查核（2026-10-28）

- API文件：https://pixabay.com/api/docs/ 。影片搜尋用/api/videos/，video_type=film，lang=en，safesearch=true。影片回傳的type映射為本系統video_type；不傳orientation。讀取實際variant尺寸、URL及thumbnail，不假設large可用。
- 官方預設100次／60秒，依X-RateLimit-Limit/Remaining/Reset處理；查詢結果至少快取24小時。本系統另採每run6次、每分鐘8次、每日60次的保守上限。403不等於查無影片；429停止並保存冷卻時間；5xx／網路只重試一次。
- Content License摘要：https://pixabay.com/service/license-summary/ 。完整條款：https://pixabay.com/service/terms/ ，查核頁標示更新2026-10-20。內容可依適用條款使用與改作，仍需核對人物、品牌等第三方權利及用途；不得誤導或暗示背書，不是所有素材一律可任意商用的保證。
- 搜尋結果清楚提供Pixabay來源及作者；影片可暫時嵌入審核，正式使用前由後端下載。圖片URL只用暫時搜尋展示，不永久hotlink。

不大量下載、不建立公開素材庫、不作AI訓練。本輪尚未下載任何Pixabay影片；沒有素材就不捏造hash、作者、實際動作或營養資訊。候選API標籤／幾何分數不是視覺證據，需人工實看。
