<template>
<section class="autoguard-settings">
<h2>VRCX AutoGuard</h2>
<p>Exact user ID matching only. Review the candidate list before enabling automatic moderation.</p>
<label><input v-model="config.enabled" type="checkbox"> Enable AutoGuard</label>
<label><input v-model="config.previewOnly" type="checkbox"> Preview only</label>
<label><input v-model="config.autoBlockFriendRequests" type="checkbox"> Auto-block matching friend requests</label>
<label><input v-model="config.autoBlockInstanceJoins" type="checkbox"> Auto-block matching instance joins</label>
<label>Watchlist<textarea v-model="watchlistText" rows="8"/></label>
<label>Whitelist<textarea v-model="whitelistText" rows="4"/></label>
<button @click="save">Save</button>
<p>Avatar-change and rejoin patterns are review-only, not proof of malicious activity.</p>
</section>
</template>
<script setup>
import { reactive,ref } from "vue";
import { getAutoGuardRuntime } from "../src/autoguard/runtime.js";
import { normalizeUserId } from "../src/autoguard/config.js";
const runtime=getAutoGuardRuntime(); const config=reactive({...runtime.config});
const watchlistText=ref((config.watchlist||[]).join("\n")); const whitelistText=ref((config.whitelist||[]).join("\n"));
const parse=s=>[...new Set(s.split(/[\\s,;]+/).map(normalizeUserId).filter(Boolean))];
function save(){runtime.updateConfig({...config,watchlist:parse(watchlistText.value),whitelist:parse(whitelistText.value)});}
</script>
