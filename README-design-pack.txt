
healthcare Design Pack — 視覺統一升級（不改功能）
=============================================

這包只做「樣式與框架視覺強化」，完全不改動你頁面上既有的元素 ID 或事件邏輯。

包含：
- hc-theme.css  → 全站樣式（卡片、按鈕、輸入框、表格、圖表間距等）
- hc-ui.js      → 自動加上頂部工具列（頭像＋登出）與品牌抬頭，並依個人性別顯示頭像

安裝步驟（每個分頁都做一次：weight.html、diet.html、exercise.html、water.html、overview.html）：
1) 在 <head> 內加入：
   <link rel="stylesheet" href="hc-theme.css">

2) 在 </body> 前加入：
   <script defer src="hc-ui.js"></script>

3) 不需要改你的既有 HTML 結構與 JS；如果頁面原本沒有卡片容器、標題或工具列，
   hc-ui.js 會「不破壞功能」的前提下自動補上：
   - .hc-wrap（頁面置中背景）
   - .card（主卡片）
   - .hc-toolbar（右上角頭像＋登出）
   - .hc-header（logo＋health care 標題）
   - .hc-sub（副標語）

4) 頭像圖檔請放在**同一層資料夾**（GitHub Pages 需要同層）：
   - avatar-male.png / avatar-female.png / avatar-neutral.png
   並確保 profile.html 會把性別存到 localStorage: hc_profile_gender = 'male'|'female'|'neutral'

5) 登出邏輯：hc-ui.js 會綁定 #btnLogout；如果你頁面已經有登出按鈕 ID 不同，
   也會新增一顆不影響原本事件的登出按鈕，行為為清除 hc_currentUser/hc_role 後回 index.html。

撤回方式：
- 只要移除 <link href="hc-theme.css"> 與 <script src="hc-ui.js"> 兩行即可恢復原狀。

微調：
- 想縮小卡片寬度或改色，在 hc-theme.css 的 :root 變數調整即可。
