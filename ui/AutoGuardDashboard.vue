<script setup>
import { computed, onMounted } from 'vue';
import {
  initAutoGuardStore, setAutoGuardEnabled, setAutoGuardRule,
  addAutoGuardWhitelist, removeAutoGuardWhitelist, recordAutoGuardPendingFriend, dismissAutoGuardPendingFriend, setAutoGuardFriendReviewSettings, useAutoGuardDashboardState
} from '../../autoguard/dashboardStore.js';

const state = useAutoGuardDashboardState();
const recentEvents = computed(() => [...state.events].slice(-100).reverse());
const statusText = computed(() => state.enabled ? '防護已啟用' : '防護已停用');
const eventLabel = event => ({
  blocked: '封鎖成功', error: '封鎖失敗', scanned: '已掃描',
  'no-match': '未命中規則', 'pending-approval': '待你確認白名單',
  'awaiting-profile': '等待個人檔案', 'anomaly-rescan': '異常重掃'
}[event.action] || event.action || '事件');
const eventClass = event => event.action === 'blocked' ? 'success' : event.action === 'error' ? 'danger' : 'muted';
const formatTime = value => value ? new Date(value).toLocaleString() : '';
onMounted(() => { void initAutoGuardStore(); });
</script>

<template>
  <section class="autoguard">
    <header class="autoguard__header">
      <div><h2>AutoGuard 防護中心</h2><p>以目前所在世界為掃描核心；不掃描不在房間內的好友</p></div>
      <label class="toggle"><input type="checkbox" :checked="state.enabled" @change="setAutoGuardEnabled($event.target.checked)"><span>{{ statusText }}</span></label>
    </header>
    <div class="autoguard__stats">
      <article><strong>{{ state.scannedCount }}</strong><span>掃描次數</span></article>
      <article><strong>{{ state.blockedCount }}</strong><span>封鎖成功</span></article>
      <article><strong>{{ state.failedCount }}</strong><span>封鎖失敗</span></article>
    </div>
    <section class="autoguard__rules">
      <h3>自動封鎖規則</h3>
      <label v-for="domain in ['hexed.cc', 'oversee.lol']" :key="domain" class="rule">
        <span><code>{{ domain }}</code><small>Bio 或 Bio Links 命中時封鎖</small></span>
        <input type="checkbox" :checked="state.rules[domain]" @change="setAutoGuardRule(domain, $event.target.checked)">
      </label>
    </section>
    <section class="autoguard__rules">
      <h3>新好友逾時審核</h3>
      <p>新增好友滿 30 分鐘提醒；提醒後再給你 5 分鐘確認。自動封鎖預設關閉。</p>
      <label class="rule"><span>啟用逾時自動封鎖（需先設定邀請訊息範本）</span>
        <input type="checkbox" :checked="state.friendReviewSettings?.autoBlockEnabled === true"
          @change="setAutoGuardFriendReviewSettings({ autoBlockEnabled: $event.target.checked })">
      </label>
      <label class="rule"><span>邀請訊息範本 Slot（0–10）<small>請先在 VRCX 邀請訊息設定中建立指定警告文字，再填入對應 Slot</small></span>
        <input type="number" min="0" max="10" :value="state.friendReviewSettings?.inviteMessageSlot ?? ''"
          @change="setAutoGuardFriendReviewSettings({ inviteMessageSlot: $event.target.value === '' ? null : Math.max(0, Math.min(10, Number($event.target.value))) })">
      </label>
      <p class="empty">若無法取得目前房間，或邀請訊息傳送失敗，系統不得假裝已通知；不會在未送出通知時執行封鎖。</p>
    </section>
    <section class="autoguard__activity">
      <h3>新好友｜待你檢查並決定是否加入白名單 <small>{{ state.pendingFriends.length }}</small></h3>
      <p v-if="!state.pendingFriends.length" class="empty">目前沒有待審核的新好友。</p>
      <ol v-else><li v-for="item in state.pendingFriends" :key="item.userId">
        <div><strong>{{ item.displayName || item.userId }}</strong><span>{{ item.userId }} · 新增來源：{{ item.source === 'unknown' ? '未知' : item.source }}</span><time>{{ formatTime(item.timestamp) }}</time></div>
        <div class="actions"><button @click="addAutoGuardWhitelist(item.userId)">確認安全並加入白名單</button><button class="remove" @click="dismissAutoGuardPendingFriend(item.userId)">暫不加入</button></div>
      </li></ol>
    </section>
    <section class="autoguard__activity">
      <h3>安全候選｜等待手動加入白名單 <small>{{ state.pendingApprovals.length }}</small></h3>
      <p v-if="!state.pendingApprovals.length" class="empty">目前沒有待確認的安全候選。</p>
      <ol v-else><li v-for="item in state.pendingApprovals" :key="item.userId">
        <div><strong>{{ item.displayName || item.userId }}</strong><span>{{ item.userId }}</span><time>{{ formatTime(item.timestamp) }}</time></div>
        <button @click="addAutoGuardWhitelist(item.userId)">確認安全並加入</button>
      </li></ol>
    </section>
    <section class="autoguard__activity">
      <h3>已確認白名單 <small>{{ state.whitelist.length }}</small></h3>
      <p v-if="!state.whitelist.length" class="empty">尚未加入白名單。</p>
      <ol v-else><li v-for="userId in state.whitelist" :key="userId">
        <strong>{{ userId }}</strong><button class="remove" @click="removeAutoGuardWhitelist(userId)">移除</button>
      </li></ol>
    </section>
    <section class="autoguard__activity">
      <h3>最近活動 <small>最多保留 200 筆</small></h3>
      <p v-if="!recentEvents.length" class="empty">尚無事件紀錄。</p>
      <ol v-else><li v-for="event in recentEvents" :key="event.id">
        <div><strong>{{ event.displayName || event.userId || '未知使用者' }}</strong>
          <span>{{ event.matchedDomains?.join(', ') || event.reason || event.error || '' }}</span><time>{{ formatTime(event.timestamp) }}</time></div>
        <b :class="'tag--' + eventClass(event)">{{ eventLabel(event) }}</b>
      </li></ol>
    </section>
  </section>
</template>

<style scoped>
.autoguard{display:grid;gap:18px;padding:24px;max-width:1100px;color:var(--foreground)}
.autoguard__header{display:flex;align-items:center;justify-content:space-between;gap:16px}
h2,h3,p{margin:0}h2{font-size:1.4rem}h3{font-size:1rem;margin-bottom:12px}
.autoguard__header p,.empty{opacity:.7;margin-top:5px}
.autoguard__stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.autoguard__stats article,.autoguard__rules,.autoguard__activity{border:1px solid var(--border);border-radius:12px;padding:16px}
.autoguard__stats article{display:grid;gap:5px}.autoguard__stats strong{font-size:1.7rem}.autoguard__stats span,.rule small{font-size:.85rem;opacity:.7}
.toggle,.rule{display:flex;align-items:center;gap:10px}.toggle{font-weight:600}
.rule{justify-content:space-between;padding:12px 0;border-top:1px solid var(--border)}.rule span{display:grid;gap:5px}.rule input,.toggle input{width:18px;height:18px}
.autoguard__activity ol{list-style:none;padding:0;margin:0}
.autoguard__activity li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--border)}
.autoguard__activity li div{display:grid;gap:4px;min-width:0}.autoguard__activity li span,.autoguard__activity time{font-size:.85rem;opacity:.7;overflow-wrap:anywhere}
.autoguard__activity h3 small{font-size:.8rem;opacity:.6;font-weight:400;margin-left:8px}
.autoguard .actions{display:flex;gap:8px;flex-wrap:wrap}.autoguard button{border:1px solid var(--border);border-radius:8px;padding:7px 10px;background:transparent;color:inherit;cursor:pointer}
.autoguard .remove{opacity:.7}.tag--success{color:#16834a}.tag--danger{color:#c43d3d}.tag--muted{opacity:.7}
@media(max-width:600px){.autoguard__header{align-items:flex-start;flex-direction:column}.autoguard__stats{grid-template-columns:1fr}.autoguard__activity li{align-items:flex-start;flex-direction:column}}
</style>
