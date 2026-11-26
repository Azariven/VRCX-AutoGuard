import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());

async function patchFile(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  let source = (await readFile(filePath, "utf8")).replace(/\r\n/g, "\n");
  for (const [before, after, label] of replacements) {
    if (source.includes(after)) continue;
    const occurrences = source.split(before).length - 1;
    if (occurrences !== 1) {
      throw new Error(relativePath + ": expected one anchor for " + label + ", found " + occurrences);
    }
    source = source.replace(before, after);
  }
  await writeFile(filePath, source, "utf8");
}

await patchFile("src/coordinators/userCoordinator.js", [
  [
    "import { avatarRequest, instanceRequest, queryRequest, userRequest } from '../api';",
    "import { avatarRequest, instanceRequest, playerModerationRequest, queryRequest, userRequest } from '../api';",
    "player moderation API import"
  ],
  [
    "import { useFeedStore } from '../stores/feed';",
    "import { useFeedStore } from '../stores/feed';\n" +
    "import { createProfileThreatGuard } from '../autoguard/profileThreatGuard.js';\n\n" +
    "const profileThreatGuard = createProfileThreatGuard({\n" +
    "    sendBlock: (userId) =>\n" +
    "        playerModerationRequest.sendPlayerModeration({\n" +
    "            moderated: userId,\n" +
    "            type: 'block'\n" +
    "        }),\n" +
    "    onLog: (entry) => console.info('[VRCX AutoGuard]', entry)\n" +
    "});\n\n" +
    "export async function inspectAutoGuardProfile(candidate = {}) {\n" +
    "    const userStore = useUserStore();\n" +
    "    const userId = String(candidate.userId || '');\n" +
    "    if (!userId || userId === userStore.currentUser.id) return { action: 'ignore' };\n" +
    "    await initAutoGuardStore();\n" +
    "    if (!useAutoGuardDashboardState().enabled) return { action: 'disabled' };\n" +
    "    if (getAutoGuardWhitelist().includes(userId)) return { action: 'whitelisted', userId };\n" +
    "    const result = await userRequest.getPublicProfile({ userId });\n" +
    "    return profileThreatGuard.inspect(result.ref, userStore.currentUser.id, candidate);\n" +
    "}",
    "profile guard singleton"
  ],
  [
    "    const { cachedProfiles } = useUserStore();",
    "    const userStore = useUserStore();\n    const { cachedProfiles } = userStore;",
    "profile store reference"
  ],
]);

await patchFile("src/coordinators/friendRelationshipCoordinator.js", [
  [
    "export function handleFriendAdd(args) {\n    const friendStore = useFriendStore();",
    "export function handleFriendAdd(args) {\n    const friendStore = useFriendStore();\n" +
    "    const userId = args.params.userId;\n" +
    "    userRequest.getPublicProfile({ userId }).catch((error) => {\n" +
    "        console.warn('[VRCX AutoGuard] Could not load new friend profile:', error);\n" +
    "    });",
    "new friend profile fetch"
  ]
]);

await patchFile("src/coordinators/friendRelationshipCoordinator.js", [
  [
    "import { watchState } from '../services/watchState';",
    "import { watchState } from '../services/watchState';\nimport { recordAutoGuardPendingFriend } from '../autoguard/dashboardStore.js';",
    "AutoGuard pending-friend import"
  ],
  [
    "export function handleFriendAdd(args) {\n    const friendStore = useFriendStore();",
    "export function handleFriendAdd(args) {\n    const friendStore = useFriendStore();\n    const addedUserId = args.params.userId;\n    const addedUser = useUserStore().cachedUsers.get(addedUserId);\n    recordAutoGuardPendingFriend({ userId: addedUserId, displayName: addedUser?.displayName || '', source: 'unknown' });",
    "new friend manual review queue"
  ]
]);

await patchFile("src/coordinators/friendRelationshipCoordinator.js", [
  [
    "import { storeToRefs } from 'pinia';",
    "import { storeToRefs } from 'pinia';\n\nstartAutoGuardFriendReviewRuntime();",
    "start friend review runtime after imports"
  ]
]);

await patchFile("src/coordinators/friendRelationshipCoordinator.js", [
  [
    "import { watchState } from '../services/watchState';",
    "import { watchState } from '../services/watchState';\nimport { startAutoGuardFriendReviewRuntime } from '../autoguard/friendReviewRuntime.js';",
    "friend review runtime import"
  ],
  [
    "export function handleFriendAdd(args) {\n    const friendStore = useFriendStore();",
    "export function handleFriendAdd(args) {\n    startAutoGuardFriendReviewRuntime();\n    const friendStore = useFriendStore();",
    "start timed friend review runtime"
  ]
]);

await patchFile("src/stores/notification/index.js", [
  [
    "import configRepository from '../../services/config';",
    "import configRepository from '../../services/config';\n" +
    "import { getSocialSignalCandidate } from '../../autoguard/socialSignalPolicy.js';\n" +
    "import { inspectAutoGuardProfile } from '../../coordinators/userCoordinator';",
    "social notification profile review imports"
  ],
  [
    "    function handlePipelineNotification(args) {\n        const ref = args.json;",
    "    function handlePipelineNotification(args) {\n        const ref = args.json;\n" +
    "        const socialCandidate = getSocialSignalCandidate(ref, userStore.currentUser.id);\n" +
    "        if (socialCandidate) {\n" +
    "            inspectAutoGuardProfile(socialCandidate).catch((error) => {\n" +
    "                console.warn('[VRCX AutoGuard] Could not inspect social-event sender profile:', error);\n" +
    "            });\n" +
    "        }",
    "inspect friend and group notification senders"
  ]
]);

await patchFile("src/coordinators/gameLogCoordinator.js", [
  [
    "    if (!userId && gameLog.displayName) {\n" +
    "        userId =\n" +
    "            findUserByDisplayName(userStore.cachedUsers, gameLog.displayName, userStore.cachedUserIdsByDisplayName)\n" +
    "                ?.id ?? '';\n" +
    "    }",
    "    if (!userId && gameLog.displayName) {\n" +
    "        userId =\n" +
    "            findUserByDisplayName(userStore.cachedUsers, gameLog.displayName, userStore.cachedUserIdsByDisplayName)\n" +
    "                ?.id ?? '';\n" +
    "    }\n" +
    "    if (\n" +
    "        gameLog.type === 'player-joined' &&\n" +
    "        userId &&\n" +
    "        userId !== userStore.currentUser.id &&\n" +
    "        !userStore.cachedProfiles.has(userId)\n" +
    "    ) {\n" +
    "        userRequest.getPublicProfile({ userId }).catch((error) => {\n" +
    "            console.warn('[VRCX AutoGuard] Could not load joining player profile:', error);\n" +
    "        });\n" +
    "    }",
    "player join profile fetch"
  ]
]);


await patchFile("src/coordinators/userCoordinator.js", [
  [
    "import { createProfileThreatGuard } from '../autoguard/profileThreatGuard.js';",
    "import { createProfileThreatGuard } from '../autoguard/profileThreatGuard.js';\n" +
    "import { getAutoGuardWhitelist, getEnabledAutoGuardDomains, initAutoGuardStore, recordAutoGuardEvent, recordAutoGuardScan, useAutoGuardDashboardState } from '../autoguard/dashboardStore.js';",
    "dashboard store imports"
  ],
  [
    "    onLog: (entry) => console.info('[VRCX AutoGuard]', entry)",
    "    onLog: (entry) => recordAutoGuardEvent(entry),\n" +
    "    onScan: (entry) => recordAutoGuardScan(entry),\n" +
    "    isEnabled: () => useAutoGuardDashboardState().enabled,\n" +
    "    getEnabledDomains: getEnabledAutoGuardDomains,\n" +
    "    ensureReady: initAutoGuardStore,\n" +
    "    isWhitelisted: (userId) => getAutoGuardWhitelist().includes(userId)",
    "dashboard event and settings wiring"
  ]
]);

await patchFile("src/plugins/router.js", [
  [
    "import MainLayout from '../views/Layout/MainLayout.vue';",
    "import MainLayout from '../views/Layout/MainLayout.vue';\nimport AutoGuard from '../views/AutoGuard/AutoGuard.vue';",
    "AutoGuard route import"
  ],
  [
    "{ path: 'feed', name: 'feed', component: Feed },",
    "{ path: 'feed', name: 'feed', component: Feed },\n            { path: 'auto-guard', name: 'auto-guard', component: AutoGuard, meta: { navKey: 'auto-guard' } },",
    "AutoGuard route"
  ]
]);

await patchFile("src/shared/constants/ui.js", [
  [
    "        key: 'search',\n        icon: 'ri-search-line',\n        tooltip: 'nav_tooltip.search',\n        labelKey: 'nav_tooltip.search',\n        routeName: 'search'\n    },",
    "        key: 'search',\n        icon: 'ri-search-line',\n        tooltip: 'nav_tooltip.search',\n        labelKey: 'nav_tooltip.search',\n        routeName: 'search'\n    },\n    { key: 'auto-guard', icon: 'ri-shield-check-line', tooltip: 'nav_tooltip.auto_guard', labelKey: 'nav_tooltip.auto_guard', routeName: 'auto-guard' },",
    "AutoGuard navigation definition"
  ]
]);

await patchFile("src/components/nav-menu/navLayoutDefaults.js", [
  [
    "        { type: 'item', key: 'search' },",
    "        { type: 'item', key: 'search' },\n        { type: 'item', key: 'auto-guard' },",
    "AutoGuard default navigation entry"
  ]
]);

await patchFile("src/localization/zh-TW.json", [
  [
    '        "search": "搜尋",\n        "favorites": "收藏",',
    '        "search": "搜尋",\n        "auto_guard": "AutoGuard 防護中心",\n        "favorites": "收藏",',
    "AutoGuard Traditional Chinese label"
  ]
]);

console.log("VRCX AutoGuard integration applied to " + root);
