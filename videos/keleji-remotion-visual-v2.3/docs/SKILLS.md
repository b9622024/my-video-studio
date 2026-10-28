# 本輪使用的官方技能與文件

Remotion官方Skills來源：https://github.com/remotion-dev/skills ，固定commit記錄於 vendor-skills/SOURCE.json。取得時版本對應Remotion4.0.539。
已讀 remotion-best-practices、remotion-create、remotion-markup、remotion-render 及 video-layout、compositions、embedding-videos、sequencing參考。
重點採用：以影格函式計算動畫、明確Composition入口、本機素材、等待字型／圖像、先Studio預覽與主要影格再正式渲染。
此新目錄已有本輪設計與素材檔，依使用者指定路徑建立最小Remotion入口與依賴，而非在非空目錄執行會另建子層的create-video。沒有覆蓋舊專案。
本輪也使用 Vercel React Best Practices 技能對新增TSX檢查：無逐格setState、無即時動畫時鐘、載入effect有明確依賴、無CSS-in-JS套件、SVG數量有限、主要運算只針對120影格。非Next.js應用，沒有為此引入Tailwind／shadcn／資料抓取框架。
官方Skills的本機全文快照在vendor-skills/skills，未作為必要執行相依或公開重新散布；重新取得可依SOURCE.json定位。

## V2.3
再次閱讀cloud-environment-runtime與官方Remotion的create、markup、embedding-videos、render、compositions、video-layout規範。另套用vercel:react-best-practices做TSX複查：hook僅在頂層；靜態排版／字型與逐格場景分離；無隨機、即時播放時鐘、CSS animation或跨影格可變狀態；無新增第三方動畫套件。字型載入用delayRender/continueRender；媒體由Remotion OffthreadVideo取樣，沿用現有依賴以避免改動V2.2。標題64px是本輪使用者明確要求縮小主標的版面選擇。
