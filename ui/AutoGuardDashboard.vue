<script setup>
import { computed, onMounted } from 'vue';
import { initAutoGuardStore, setAutoGuardEnabled, setAutoGuardRule, useAutoGuardDashboardState } from '../../autoguard/dashboardStore.js';

const state = useAutoGuardDashboardState();
const recentEvents = computed(() => [...state.events].slice(-100).reverse());
const statusText = computed(() => state.enabled ? '防護已啟用' : '防護已停用');
const eventLabel = (event) => ({
  blocked: '封鎖成功', error: '封鎖失敗', scanned: '已掃描', 'no-match': '未命中規則',
  disabled: '防護停用', 'already-blocked': '已處理過'
}[event.action] || event.action || '事件');
const eventClass = (event) => event.action === 'blocked' ? 'success' : event.action === 'error' ? 'danger' : 'muted';
const formatTime = (value) => value ? new Date(value).toLocaleString() : '';
onMounted(() => { void initAutoGuardStore(); });
</script>

<template>
  <section class="autoguard">
    <header class="autoguard__header">
      <div><h2>AutoGuard 防護中心</h2><p>個人檔案 Bio 與公開連結監控</p></div>
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
      <small class="note">網域命中是你設定的封鎖條件，不代表已獨立證實帳號本人有違規行為。</small>
    </section>
    <section class="autoguard__activity">
      <h3>最近活動 <small>最多保留 200 筆</small></h3>
      <p v-if="!recentEvents.length" class="empty">尚無事件紀錄。新載入的公開個人檔案會在符合監控條件時留下紀錄。</p>
      <ol v-else><li v-for="event in recentEvents" :key="event.id">
        <div><strong>{{ event.displayName || event.userId || '未知使用者' }}</strong>
          <span>{{ event.matchedDomains?.join(', ') || event.error || '' }}</span><time>{{ formatTime(event.timestamp) }}</time></div>
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
.autoguard__stats article{display:grid;gap:5px}.autoguard__stats strong{font-size:1.7rem}.autoguard__stats span,.note,.rule small{font-size:.85rem;opacity:.7}
.toggle,.rule{display:flex;align-items:center;gap:10px}.toggle{font-weight:600}
.rule{justify-content:space-between;padding:12px 0;border-top:1px solid var(--border)}.rule span{display:grid;gap:5px}.rule input,.toggle input{width:18px;height:18px}
.note{display:block;margin-top:12px}.autoguard__activity ol{list-style:none;padding:0;margin:0}
.autoguard__activity li{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--border)}
.autoguard__activity li div{display:grid;gap:4px;min-width:0}.autoguard__activity li span,.autoguard__activity time{font-size:.85rem;opacity:.7;overflow-wrap:anywhere}
.autoguard__activity h3 small{font-size:.8rem;opacity:.6;font-weight:400;margin-left:8px}
.tag--success{color:#16834a}.tag--danger{color:#c43d3d}.tag--muted{opacity:.7}
@media(max-width:600px){.autoguard__header{align-items:flex-start;flex-direction:column}.autoguard__stats{grid-template-columns:1fr}.autoguard__activity li{flex-direction:column}}
</style>
