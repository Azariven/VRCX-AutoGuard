# AutoGuard 原生整合狀態

Dashboard 元件現在讀取 VRCX renderer 內共用的 reactive store，並提供總開關與兩個網域規則開關。設定透過 VRCX configRepository 保存；事件最多保留 200 筆於本次執行階段。

整合腳本會把頁面掛入 VRCX 路由與原生左側導覽，並將 profile guard 的掃描／封鎖結果送入同一個 store。封鎖成功只在 VRCX moderation API Promise 成功回傳後計數。

仍需以 Windows CI build 驗證 Vue/renderer/Electron installer，並在實際 VRCX 登入環境測試 API 行為。
