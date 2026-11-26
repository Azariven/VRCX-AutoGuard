# VRCX AutoGuard

**An experimental defensive security add-on integrated into VRCX.**  
**一套整合進 VRCX 的實驗性防護工具。**

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

### 為什麼開始做 AutoGuard？

自從我常常待在 VRChat 的社團地圖、休息場景與公共聚會世界後，逐漸遇到一些讓我困擾的情況。

有時會出現我完全不認識的新帳號，名稱看起來像隨機生成的英文字母與數字組合。部分帳號會在個人簡介中宣傳，聲稱可以透過 **hexed.cc** 的 Reuploader 產品取得完整的 Avatar 資料庫。當我刪除或拒絕某些可疑好友邀請後，過一段時間又會出現其他帳號，繼續推薦相關社團或服務。

這些經驗讓我開始懷疑，自己是否碰上了有組織的機器人宣傳或騷擾行為。為了確認這並非只有我遇到，我開始在網路上查找資料，並看到了這篇與自身經驗高度相似的分享：

- [相關使用者經驗與觀察（note.com）](https://note.com/byebye_hojorin/n/n70eafe0cf7dd)

文章中提到的帳號宣傳內容，與我曾看過的簡介幾乎一致。其中包含以下原文（引用自該文章）：

> hexed․cc - These bots are automatically replaced when banned․ We collect avatars‚ player locations‚ and voice data until VRChat unbans our main accounts and cooperates․ The full avatar database is available through our Reuploader product at hexed․cc․ BUY NOW we are just better and our reuploader can bypass every avatar protection systemǃ

看到這段內容後，我更希望能保護自己與常去的社群空間。不過，這些自述與個人觀察並不能單獨證明對方真的具有所宣稱的能力，也不能證明 VRChat 存在可被利用來未經同意強制新增好友的漏洞。

我也曾在自己的好友清單中，注意到一位我不記得曾經手動新增、而且簡介內容與上述宣傳相符的帳號。這讓我開始思考：除了手動刪除或封鎖之外，能不能利用 VRCX 已有的使用者資料、房間事件與管理功能，建立一套可設定、可追蹤、也能自行維護白名單的防護流程？

**VRCX AutoGuard 就是從這個想法開始的。**

我的目標不是宣稱能辨識所有機器人，也不是破解 VRChat 或追蹤任何人的私人資料，而是把使用者可取得的公開個人檔案資訊與目前房間事件，轉換成明確、可檢查的防護規則。面對特定風險指標時，我寧願採取較保守的封鎖策略；但所有規則都應該清楚顯示，並允許使用者管理與調整。

### 功能介紹

#### 1. 個人簡介網域比對與封鎖
- 檢查 VRChat 公開個人檔案的 Bio 與 Bio Links。
- 可設定的指定網域包含 `hexed.cc` 與 `oversee.lol`。
- 採用完整網域比對、忽略大小寫，並正規化常見 Unicode 點號形式。
- 不以隨機名稱、VRC+ 圖示、信任等級或帳號年齡作為封鎖依據。
- 命中已啟用規則時，透過 VRCX 的登入狀態送出 VRChat 封鎖請求。

> 網域命中代表符合使用者設定的封鎖條件，不等於已證實該帳號違規或具有特定惡意能力。請依自身需求啟用規則。

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

- 目標整合版本：VRCX commit `e819c4e4ee13218393fcf8263e7745971dfc9821`。
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

- Target integration version: VRCX commit `e819c4e4ee13218393fcf8263e7745971dfc9821`.
- The repository includes automated unit tests, a VRCX integration script, and a Windows build workflow.
- Use the latest successful full Windows build from GitHub Actions. A renderer-only artifact is not a Windows installer.

---

## Development

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for integration and validation steps.

## License

Review the repository license and upstream VRCX license before redistributing modified builds.
