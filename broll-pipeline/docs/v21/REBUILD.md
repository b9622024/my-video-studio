# V2.1 第一階段重建

基礎visual-language-v2.0.3／407d44ed3dde59036d723677b43029a02de1a03d。新分支visual-language-v2.1。

實際原創PNG、衍生alpha、scene.json與來源均保存在本分支；不需要再次生成圖像即可重建三張構圖。來源生成模型非決定性，無seed，不能只靠提示詞重現完全相同像素。

在broll-pipeline，以既有Remotion 4.0.539／React19／Chromium／Noto CJK環境執行：

```sh
node tools/render-v21-art.mjs
python tools/package-v21-art.py
```

REMOTION_HOST可指定已有node_modules的專案；OUTPUT_DIR可指定輸出。工具只使用renderStill、一影格Composition；任何參數都拒絕，沒有MP4選項。衍生matte只是原始插畫的幾何裁切與合成，不重繪原圖。

包內提供540預覽與1080審核圖。建築底圖原生1024×1536；1080畫面不表示所有材質都是原生1080或1920。靠近後的背景有插值放大，請以實際檔案驗收。包內舊版MP4只作V2.0.3比較，不是V2.1動畫。

必須先收到使用者美術核准，再檢查新投影rig，才可實作3秒動態；不回填歷史核准旗標，不修改舊物理或引擎。

如需重建可編輯SVG圖層，再執行`node tools/export-v21-layer-vectors.mjs`。由同一套controller匯出，圖片連結使用../original相對路徑，請保留assets資料夾結構；另附的alpha PNG不需要SVG解析器即可觀看。

舊版比較需要V2.0.3母檔，可用V203_MASTER指定路徑；V203_PREVIEW可指定舊預覽。如使用本審核包內old-v203的三張已抽影格，無需重新抽取。單獨重建新版三張圖不依賴舊影片。
