# VRCX AutoGuard

**An experimental defensive security add-on integrated into VRCX.**  
**一套整合進 VRCX 的實驗性防護工具。**

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

### 為什麼開始做 AutoGuard？

這個專案起源於我在 VRChat 社群地圖、休息空間與公共聚會世界中的一些親身經歷。

我曾多次遇到陌生帳號使用近似隨機字串的名稱出現，部分帳號還會在個人簡介中宣傳 **hexed.cc** 的 Reuploader 服務，聲稱能提供完整的 Avatar 資料庫。當我拒絕或移除某些可疑邀請後，類似的宣傳內容有時又會透過其他帳號出現。

這些反覆發生的情況，讓我開始關注是否存在有組織的機器人宣傳或騷擾行為。我也因此搜尋其他使用者的經驗，並找到一篇與我所觀察到的現象相似的分享：

- [相關使用者經驗與觀察（note.com）](https://note.com/byebye_hojorin/n/n70eafe0cf7dd)

該文章提及的宣傳內容，與我曾在 VRChat 個人簡介中看過的文字相當接近，其中包含以下原文：

> hexed․cc - These bots are automatically replaced when banned․ We collect avatars‚ player locations‚ and voice data until VRChat unbans our main accounts and cooperates․ The full avatar database is available through our Reuploader product at hexed․cc․ BUY NOW we are just better and our reuploader can bypass every avatar protection systemǃ

需要特別說明的是，帳號簡介中的宣稱與個人觀察並不能單獨證實其實際能力，也不足以證明 VRChat 存在未經使用者同意便能強制新增好友的漏洞。這些內容是我開始研究防護方式的背景，而不是本專案已經驗證的結論。

我也曾在自己的好友清單中發現不記得曾親自新增、且簡介內容與上述宣傳相似的帳號。這促使我思考：能否運用 VRCX 已有的公開個人檔案資料、房間事件與管理功能，建立一套具備明確規則、活動紀錄及人工白名單管理的防護流程？

**VRCX AutoGuard 因此誕生。**

AutoGuard 的核心理念，是將可取得的公開個人檔案資訊與目前房間內的事件，整理成使用者能理解、檢查及自行調整的防護規則。它不宣稱能辨識所有機器人，也不會以破解遊戲或蒐集私人資料作為手段。對於符合使用者指定條件的風險指標，系統可以依設定採取相應處理；同時保留白名單、人工審核與活動紀錄，讓防護行為維持透明且可控。

### 功能介紹

#### 1. 個人簡介網域比對與封鎖
- 檢查 VRChat 公開個人檔案的 Bio 與 Bio Links。
- 可設定的指定網域包含 `hexed.cc` 與 `oversee.lol`。
- 採用完整網域比對、忽略大小寫，並正規化常見 Unicode 點號形式。
- 不以隨機名稱、VRC+ 圖示、信任等級或帳號年齡作為封鎖依據。
- 命中已啟用規則時，透過 VRCX 的登入狀態送出 VRChat 封鎖請求。

> 網域命中代表符合使用者設定的封鎖條件，不等於已證實該帳號違規或具有特定惡意能力。請依自身需求啟用規則。

#### 社群互動來源檢查
- 除了好友申請，也會檢查帶有明確發送者 ID 的群組邀請、群組加入申請，以及由玩家發起的群組推薦／資訊通知。
- 系統會讀取發送者的公開個人檔案，檢查 Bio 與 Bio Links 是否命中已啟用的風險網域。
- 只有個人檔案命中既有規則時，才會依 AutoGuard 設定執行封鎖；單純收到邀請或推薦不會直接導致封鎖。
- 沒有明確發送者 ID 的系統公告不會被當成玩家來源處理；白名單中的使用者會略過檢查與封鎖。

#### 2. 以目前所在世界為核心的掃描設計
- 以目前所在房間的玩家為主要掃描範圍，公開或私人房間皆適用。
- 不掃描不在目前房間內的好友。
- 玩家通常在同一房間工作階段只檢查一次，避免重複讀取與重複處理。
- 對短時間大量進出、或房間人數突然大幅減少等異常事件，設計有限度的可疑對象重新檢查機制。
- 新好友的審核與目前世界掃描分開處理；不會因為好友清單中存在某人，就直接認定對方有問題。

#### 3. 白名單與人工審核
- 可自行新增、移除白名單。
- 掃描後未命中封鎖規則的候選使用者，可以先放入待確認清單。
- 由使用者親自確認後才加入白名單，不會把「未命中」自動當作永久安全保證。
- 可檢視待審核好友、待確認候選與近期活動紀錄。

#### 4. 新好友逾時提醒與可選處理流程
- 對新加入好友建立審核項目。
- 預設在 30 分鐘後提醒，並保留額外 5 分鐘確認時間。
- 可選擇啟用逾時處理；自動封鎖預設關閉。
- 可選擇 VRCX 已設定的邀請訊息範本 Slot，先傳送房間邀請與提醒，再依設定執行後續封鎖。
- 若沒有有效房間、邀請訊息傳送失敗或設定不正確，系統不得假稱通知成功，也不應在通知失敗時繼續自動封鎖。

#### 5. 活動紀錄與設定
- 查看掃描、命中、封鎖成功、錯誤與待確認事件。
- 設定全域防護開關與個別網域規則。
- 保存白名單與審核設定，方便重新啟動後繼續管理。

### 重要提醒與限制

- 本專案是防護輔助工具，不是 VRChat 官方產品，也不是官方安全漏洞分析。
- 目前規則依賴公開個人檔案內容與 VRCX 可取得的事件；無法保證辨識所有機器人、外掛或騷擾帳號。
- 個人簡介可能被修改、偽裝或移除；網域比對也可能產生誤判。
- 不要只因為名稱隨機、帳號新、信任圖示不同或不認識對方，就推定其為機器人。
- 封鎖會影響社交關係，請在啟用自動封鎖前檢查規則與白名單。
- 本專案目前仍需要實際 VRCX 與 VRChat 使用情境測試；CI 建置成功不代表所有線上行為均已驗證。

### 專案狀態

- 目標整合版本：VRCX commit `v2026.11.14`。
- 專案包含自動化單元測試、VRCX 整合腳本與 Windows 建置流程。
- 請以 GitHub Actions 最新成功的完整 Windows 建置為準；renderer 測試產物不是 Windows 安裝程式。

---

## English

### Why I Started AutoGuard

After spending more time in VRChat community worlds, social hangouts, and public gathering spaces, I began running into a recurring issue that made me uncomfortable.

Unfamiliar accounts would appear with names that looked like randomly generated strings of letters and numbers. Some profiles promoted a service claiming that a complete avatar database could be accessed through the **hexed.cc** Reuploader product. After I declined or removed certain suspicious friend requests, other accounts sometimes appeared later and promoted similar communities or services.

These experiences made me wonder whether I was encountering coordinated bot advertising or targeted harassment. I started looking for other reports and found a post describing experiences that closely resembled mine:

- [Related user report and observations (note.com)](https://note.com/byebye_hojorin/n/n70eafe0cf7dd)

The promotional text described in that post was almost identical to wording I had seen in profile bios. The following is quoted from the post:

> hexed․cc - These bots are automatically replaced when banned․ We collect avatars‚ player locations‚ and voice data until VRChat unbans our main accounts and cooperates․ The full avatar database is available through our Reuploader product at hexed․cc․ BUY NOW we are just better and our reuploader can bypass every avatar protection systemǃ

Reading this made me want better ways to protect myself and the communities I spend time with. However, these claims and personal observations do not independently prove that the advertised capabilities are real, nor do they establish that VRChat has a vulnerability that can forcibly add friends without the account owner's consent.

I also noticed an account in my own friends list that I did not remember manually adding. Its profile contained promotional wording similar to the text above. This raised a practical question: instead of repeatedly deleting or blocking accounts by hand, could I use VRCX's existing profile information, room events, and moderation features to build a configurable defense workflow with activity logs and a user-managed whitelist?

**That question became the starting point for VRCX AutoGuard.**

The goal is not to claim that every bot can be detected, or to exploit VRChat or collect anyone's private data. AutoGuard turns publicly available profile information and events from the current room into explicit, inspectable protection rules. For selected risk indicators, I prefer a conservative blocking policy—but the rules should remain visible, configurable, and under the user's control.

### Features

#### 1. Profile-domain matching and blocking
- Checks the Bio and Bio Links of publicly available VRChat profiles.
- Includes configurable indicators such as `hexed.cc` and `oversee.lol`.
- Uses exact host matching, case-insensitive comparison, and normalization of common Unicode dot variants.
- Does not use random-looking display names, VRC+ icons, trust rank, or account age as blocking criteria.
- When an enabled rule matches, AutoGuard sends a VRChat block request through VRCX's authenticated session.

> A domain match means the profile met a user-configured blocking condition. It is not proof that the account has violated a rule or possesses any particular malicious capability. Enable rules according to your own risk tolerance.

#### Social-interaction source checks
- In addition to friend requests, AutoGuard reviews group invitations, group join requests, and player-attributed group recommendation/informative notifications when a concrete sender ID is available.
- It fetches the sender's public profile and checks the Bio and Bio Links against enabled risk-domain rules.
- Receiving an invitation or recommendation alone never triggers a block. A block is considered only when the sender's profile matches an enabled rule.
- System announcements without a concrete sender ID are ignored, and users on the whitelist are skipped.

#### 2. Current-world-focused scanning design
- Focuses on players in the room you are currently in, whether the instance is public or private.
- Does not scan friends who are outside your current instance.
- Normally checks a player once per room session to reduce duplicate work.
- Includes a bounded suspicious-candidate recheck design for unusual bursts of joins/leaves or sudden large drops in room population.
- Keeps friend review separate from room scanning; being present in a friend list alone is not treated as evidence of abuse.

#### 3. Whitelist and manual review
- Add or remove users from your own whitelist.
- Candidates that do not match a blocking rule can be placed in a pending-approval list.
- Only the user can confirm a candidate and add them to the whitelist; a clean scan is not treated as a permanent safety guarantee.
- Review pending friends, candidate approvals, and recent activity.

#### 4. New-friend reminders and optional follow-up
- Creates a review item when a new friend is added.
- Sends a reminder after 30 minutes, followed by an additional 5-minute grace period.
- Optional timeout handling is available; automatic blocking is disabled by default.
- Can select a configured VRCX invite-message template slot to send a room invite and notice before any follow-up block action.
- If there is no valid active room, the invite fails, or the slot is invalid, the system must not claim that a notice was sent and must not proceed with an automatic block after a failed notice.

#### 5. Activity history and settings
- Review scan, match, successful block, error, and pending-approval events.
- Configure the global protection switch and individual domain rules.
- Persist whitelist and review settings for continued management after restart.

### Important Notes and Limitations

- This is an independent defensive utility, not an official VRChat product or an official vulnerability analysis.
- Rules rely on public profile content and events available to VRCX. They cannot guarantee detection of every bot, modified client, or harassing account.
- Profile bios can be changed, spoofed, or removed; domain matching can produce false positives.
- A random-looking name, a new account, a different trust indicator, or simply being unfamiliar is not sufficient evidence that someone is a bot.
- Blocking affects social relationships. Review your rules and whitelist before enabling automatic blocking.
- Real-world testing with VRCX and VRChat is still required. A successful CI build does not prove every live behavior has been verified.

### Project Status

- Target integration version: VRCX commit `v2026.11.14`.
- The repository includes automated unit tests, a VRCX integration script, and a Windows build workflow.
- Use the latest successful full Windows build from GitHub Actions. A renderer-only artifact is not a Windows installer.

---

## 官方關係、免費性質與免責聲明 / Official Relationship, Free Software & Disclaimer

### 繁體中文

**VRCX AutoGuard 是一個免費、非官方的 VRCX 社群修改版本，並整合 AutoGuard 防護模組。它不是可直接載入官方 VRCX 的外掛，也不是 VRCX 官方產品；VRCX 原作者與開發團隊未製作、核准、背書或維護本專案。**

VRCX 本體由 **VRCX Team** 維護，是一款用於 VRChat 的第三方輔助應用程式。本專案以 VRCX 開放原始碼為基礎，整合 AutoGuard 功能後獨立建置與發布；使用者不能將 AutoGuard 當作外掛直接安裝到官方 VRCX。請參閱原專案與維護團隊：

- VRCX 官方網站／專案頁：[https://github.com/vrcx-team/VRCX](https://github.com/vrcx-team/VRCX)
- VRCX Team（原作者／維護團隊）：[https://github.com/vrcx-team](https://github.com/vrcx-team)
- VRCX 官方發布版本：[https://github.com/vrcx-team/VRCX/releases](https://github.com/vrcx-team/VRCX/releases)

**本專案完全免費提供。** 不收取下載費、使用費或訂閱費。若未來出現任何第三方收費散布或非官方修改版本，均不代表本專案作者授權或認可。

AutoGuard 的目的，是透過 VRCX 可取得的公開個人檔案資訊與房間事件，協助使用者辨識特定風險指標，降低疑似模型盜用宣傳帳號與騷擾帳號對個人及社群造成的困擾。它不是萬能防護工具，也不保證能阻止所有盜用、機器人、外掛或騷擾行為。

**封鎖功能與使用風險**
- AutoGuard 可依使用者啟用的規則，自動向 VRChat 發送封鎖請求。規則比對可能有誤判，包含正常使用者被誤封鎖的可能。
- 自動封鎖可能造成好友關係中斷、誤會、爭執、社群衝突或其他社交後果。即使是使用者自行設定的規則，也請先理解其判斷方式與影響。
- 使用者應自行檢查封鎖規則、白名單、待確認清單與活動紀錄，並自行決定是否啟用自動封鎖。建議先以人工審核模式觀察，再考慮開啟自動處理。
- 使用者須自行確認使用本專案是否符合所在地法律、VRChat 使用條款、平台政策及自身所處社群規範。若有疑慮，請勿使用自動封鎖功能。

**責任聲明**
本專案依「現狀」提供，不附帶任何明示或默示保證，包括但不限於準確性、可靠性、不中斷運作、適用特定用途或不侵害第三方權利。於適用法律允許的最大範圍內，專案作者與貢獻者不對因下載、安裝、設定、使用、無法使用或散布本專案所造成的直接、間接、附帶、特殊、衍生損害、資料損失、帳號或社交關係影響、封鎖爭議、平台處分、法律爭議或其他後果負責。

本聲明不表示使用者可以免除自身依法應負的責任，也不排除任何依法不得排除或限制的責任。使用者需自行承擔使用本軟體的風險，並對自己的封鎖決策及其後果負責。若不同意上述條款，請勿下載或使用本專案。

### English

**VRCX AutoGuard is a free, unofficial community-modified build of VRCX with an integrated AutoGuard protection module. It is not a drop-in plugin for the official VRCX application, nor is it an official VRCX product. It is not created, approved, endorsed, or maintained by the original VRCX authors or development team.**

The original VRCX application is maintained by **VRCX Team** and is a third-party companion application for VRChat. This project integrates AutoGuard into the open-source VRCX codebase and is built and distributed separately. AutoGuard cannot be installed as a plugin into the official VRCX application. Please refer to the original project and its maintainers:

- VRCX official project page: [https://github.com/vrcx-team/VRCX](https://github.com/vrcx-team/VRCX)
- VRCX Team (original authors / maintainers): [https://github.com/vrcx-team](https://github.com/vrcx-team)
- Official VRCX releases: [https://github.com/vrcx-team/VRCX/releases](https://github.com/vrcx-team/VRCX/releases)

**This project is provided completely free of charge.** There are no download fees, usage fees, or subscription fees. Any third-party paid distribution or unofficial modified build does not imply authorization or endorsement by this project's author.

AutoGuard aims to help users identify selected risk indicators through public profile information and room events available to VRCX, in order to reduce unwanted exposure to suspected avatar-ripping promotions and harassment. It is not a complete security solution and cannot guarantee protection against every form of avatar theft, bot activity, modified client, or harassment.

**Blocking Features and Risks**
- Based on rules enabled by the user, AutoGuard can automatically submit block requests to VRChat. Rule matching can be inaccurate, and legitimate users may be blocked by mistake.
- Automatic blocking may interrupt friendships and lead to misunderstandings, arguments, community conflicts, or other social consequences. This remains possible even when users configure the rules themselves.
- Users are responsible for reviewing blocking rules, whitelists, pending approvals, and activity logs, and for deciding whether to enable automatic blocking. It is recommended to start with manual review before enabling automated actions.
- Users must independently determine whether using this project complies with applicable local laws, VRChat's Terms of Service, platform policies, and their community rules. Do not use automatic blocking if you are unsure.

**Disclaimer of Liability**
This project is provided **"AS IS"**, without warranties of any kind, express or implied, including but not limited to accuracy, reliability, uninterrupted operation, fitness for a particular purpose, or non-infringement. To the maximum extent permitted by applicable law, the project author and contributors shall not be liable for direct, indirect, incidental, special, consequential, data-related, account-related, social, blocking-related, platform enforcement, legal, or other consequences arising from downloading, installing, configuring, using, being unable to use, or distributing this project.

Nothing in this disclaimer releases users from legal responsibilities imposed on them by applicable law, or excludes or limits liability that cannot legally be excluded or limited. Users assume the risks of using this software and remain responsible for their own blocking decisions and their consequences. Do not download or use this project if you do not agree with these terms.

---

## Development

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for integration and validation steps.

## License

Review the repository license and upstream VRCX license before redistributing modified builds.
