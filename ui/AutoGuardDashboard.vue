<script setup>
import { computed } from 'vue';

const props = defineProps({
  enabled: { type: Boolean, default: false },
  events: { type: Array, default: () => [] },
  scannedCount: { type: Number, default: 0 },
  blockedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 }
});

const recentEvents = computed(() => [...props.events].slice(-100).reverse());
const statusText = computed(() => props.enabled ? '監控已啟用' : '尚未連接事件來源');
const eventLabel = (event) => ({
  blocked: '已送出封鎖',
  error: '封鎖失敗',
  no-match: '未命中規則',
  'already-blocked': '已處理過'
}[event.action] || event.action || '事件');
const eventClass = (event) => event.action === 'blocked' ? 'success' : event.action === 'error' ? 'danger' : 'muted';
</script>

<template>
  <section class="autoguard">
    <header class="autoguard__header">
      <div>
        <h2>AutoGuard 防護中心</h2>
        <p>個人檔案 Bio 與公開連結監控</p>
      </div>
      <span class="autoguard__status" :class="enabled ? 'is-on' : 'is-off'">
        {{ statusText }}
      </span>
    </header>

    <div class="autoguard__stats">
      <article><strong>{{ scannedCount }}</strong><span>已掃描資料</span></article>
      <article><strong>{{ blockedCount }}</strong><span>已送出封鎖</span></article>
      <article><strong>{{ failedCount }}</strong><span>封鎖失敗</span></article>
    </div>

    <div class="autoguard__rules">
      <h3>立即封鎖規則</h3>
      <div><code>hexed.cc</code><span>Bio 或 Bio Links 命中即封鎖</span></div>
      <div><code>oversee.lol</code><span>Bio 或 Bio Links 命中即封鎖</span></div>
      <small>網域命中是使用者設定的封鎖條件，不代表已獨立證實帳號本人有違規行為。</small>
    </div>

    <div class="autoguard__activity">
      <h3>最近活動</h3>
      <p v-if="!recentEvents.length" class="autoguard__empty">
        尚無事件資料。需先將 VRCX 個人檔案掃描器的事件回呼接到此面板。
      </p>
      <ol v-else>
        <li v-for="(event, index) in recentEvents" :key="event.id || event.userId + '-' + index">
          <div>
            <strong>{{ event.displayName || event.userId || '未知使用者' }}</strong>
            <span>{{ event.matchedDomains?.join(', ') || event.reason || '' }}</span>
            <time>{{ event.time || event.timestamp || '' }}</time>
          </div>
          <b :class="'tag--' + eventClass(event)">{{ eventLabel(event) }}</b>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.autoguard{display:grid;gap:18px;padding:20px;color:var(--text-color,inherit)}
.autoguard__header{display:flex;align-items:center;justify-content:space-between;gap:16px}
h2,h3,p{margin:0}h2{font-size:1.35rem}h3{font-size:1rem;margin-bottom:10px}
.autoguard__header p,.autoguard__empty{opacity:.7;margin-top:5px}
.autoguard__status,.autoguard__stats article,.autoguard__rules,.autoguard__activity{border:1px solid var(--border-color, #8885);border-radius:10px;padding:14px}
.autoguard__status{white-space:nowrap}.is-on{color:#16834a}.is-off{color:#a66b12}
.autoguard__stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.autoguard__stats article{display:grid;gap:4px}.autoguard__stats strong{font-size:1.6rem}.autoguard__stats span,.autoguard__rules small{opacity:.7;font-size:.85rem}
.autoguard__rules>div{display:flex;gap:12px;align-items:center;margin:8px 0}.autoguard__rules small{display:block;margin-top:12px}
.autoguard__activity ol{list-style:none;padding:0;margin:0}.autoguard__activity li{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--border-color,#8885)}
.autoguard__activity li div{display:grid;gap:4px;min-width:0}.autoguard__activity li span,.autoguard__activity time{font-size:.85rem;opacity:.7;overflow-wrap:anywhere}
.tag--success{color:#16834a}.tag--danger{color:#c43d3d}.tag--muted{opacity:.7}
@media(max-width:560px){.autoguard__header{align-items:flex-start;flex-direction:column}.autoguard__stats{grid-template-columns:1fr}.autoguard__activity li{flex-direction:column}}
</style>
