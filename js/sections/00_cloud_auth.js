// Supabase auth and cloud save bootstrap for account data and unlockables.

const SUPABASE_PROJECT_URL = 'https://lknltlcslvqoatwtfdlm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FbxRRzWOsFiG1Oh_Q2YF7g_WfgFswvD';
const CLOUD_AUTH_EMAIL_DOMAIN = 'players.castanzakannon.local';
const CLOUD_AUTOSAVE_INTERVAL_MS = 30000;
const CLOUD_ACHIEVEMENT_SAVE_INTERVAL_MS = 5000;
const CHARACTER_UNLOCK_WAVE_REQUIREMENTS = [0, 5, 10, 15, 20];
const ACHIEVEMENT_DEFINITIONS = [
    { id: 'kills_25', title: 'First Bloodline', description: 'Defeat 25 enemies.', stat: 'totalKills', target: 25 },
    { id: 'kills_50', title: 'Merciless', description: 'Defeat 50 enemies.', stat: 'totalKills', target: 50 },
    { id: 'kills_100', title: 'Centurion', description: 'Defeat 100 enemies.', stat: 'totalKills', target: 100 },
    { id: 'kills_250', title: 'War Machine', description: 'Defeat 250 enemies.', stat: 'totalKills', target: 250 },
    { id: 'kills_500', title: 'Extinction Protocol', description: 'Defeat 500 enemies.', stat: 'totalKills', target: 500 },
    { id: 'kills_1000', title: 'Grim Reaper', description: 'Defeat 1000 enemies.', stat: 'totalKills', target: 1000 },
    { id: 'kills_2500', title: 'Planet Cleaner', description: 'Defeat 2500 enemies.', stat: 'totalKills', target: 2500 },
    { id: 'void_boss_1', title: 'Voidbreaker', description: 'Defeat the Void Totem boss.', stat: 'voidBossKills', target: 1 },
    { id: 'void_boss_3', title: 'Void Hunter', description: 'Defeat 3 Void Totem bosses.', stat: 'voidBossKills', target: 3 },
    { id: 'void_boss_7', title: 'Void Nemesis', description: 'Defeat 7 Void Totem bosses.', stat: 'voidBossKills', target: 7 },
    { id: 'necro_boss_1', title: 'Bone Silence', description: 'Defeat the Necro Totem boss.', stat: 'necromancerBossKills', target: 1 },
    { id: 'necro_boss_3', title: 'Crypt Sweeper', description: 'Defeat 3 Necro Totem bosses.', stat: 'necromancerBossKills', target: 3 },
    { id: 'necro_boss_7', title: 'Lich Eraser', description: 'Defeat 7 Necro Totem bosses.', stat: 'necromancerBossKills', target: 7 },
    { id: 'wins_1', title: 'Champion', description: 'Win one full run.', stat: 'wins', target: 1 },
    { id: 'wins_3', title: 'Seasoned Victor', description: 'Win 3 runs.', stat: 'wins', target: 3 },
    { id: 'wins_10', title: 'Arena Conqueror', description: 'Win 10 runs.', stat: 'wins', target: 10 },
    { id: 'runs_5', title: 'Field Tested', description: 'Complete 5 runs (win or lose).', stat: 'totalRuns', target: 5 },
    { id: 'runs_20', title: 'Battle Hardened', description: 'Complete 20 runs (win or lose).', stat: 'totalRuns', target: 20 },
    { id: 'defeats_5', title: 'Never Quit', description: 'Keep fighting through 5 defeats.', stat: 'defeats', target: 5 },
    { id: 'wave_10', title: 'Wave Rider', description: 'Reach wave 10.', stat: 'bestWave', target: 10 },
    { id: 'wave_20', title: 'Wave Crusher', description: 'Reach wave 20.', stat: 'bestWave', target: 20 },
    { id: 'wave_30', title: 'Wave Emperor', description: 'Reach wave 30.', stat: 'bestWave', target: 30 },
    { id: 'arena_3', title: 'Tier Climber', description: 'Reach Arena Level 3.', stat: 'bestArenaLevel', target: 3 },
    { id: 'arena_5', title: 'Top Floor', description: 'Reach Arena Level 5.', stat: 'bestArenaLevel', target: 5 },
    { id: 'level_10', title: 'Ascendant', description: 'Reach player level 10 in a run.', stat: 'bestPlayerLevel', target: 10 },
    { id: 'level_20', title: 'Overclocked', description: 'Reach player level 20 in a run.', stat: 'bestPlayerLevel', target: 20 },
    { id: 'speed_10', title: 'Velocity', description: 'Get at least +10% speed in a run.', stat: 'bestSpeedBonusPct', target: 10 },
    { id: 'dash_extra', title: 'Blink Upgrade', description: 'Find an extra dash charge in a run.', stat: 'hasExtraDashPickup', target: 1 },
    { id: 'lifesteal_found', title: 'Vampiric', description: 'Get lifesteal in a run.', stat: 'hasLifestealPickup', target: 1 },
    { id: 'playtime_30m', title: 'On Patrol', description: 'Play for 30 total minutes.', stat: 'totalPlaySeconds', target: 1800 },
    { id: 'playtime_2h', title: 'Shift Lead', description: 'Play for 2 total hours.', stat: 'totalPlaySeconds', target: 7200 },
];

const CHARACTER_SECONDARY_UNLOCK_RULES = {
    chunkster: {
        requiresLifesteal: true,
    },
    gambit: {
        minPlayerLevel: 10,
    },
    dasher: {
        requiresExtraDash: true,
    },
    ghost_runner: {
        minSpeedBonusPct: 10,
    },
};

let supabaseClient = null;
let cloudAuthReady = false;
let cloudUser = null;
let cloudSaveRowId = null;
let cloudSaveInFlight = false;
let cloudSaveQueued = false;
let cloudLastAutosaveAt = 0;
let cloudLastAchievementSaveAt = 0;
let cloudAchievementSaveTimer = null;
let cloudDataHydrated = false;
let cloudSavePendingAfterHydration = false;
let cloudRunOutcomeSaved = false;
let cloudStatusMessage = 'Cloud: not connected';
let cloudSessionSyncPromise = null;
let cloudSessionSyncUserId = null;
let cloudLoginName = '';
let cloudAuthInitialized = false;
let cloudLogoutInFlight = false;
let cloudProfileSyncBlocked = false;
let cloudProfileWarningShown = false;
let cloudAuthPanelUserToggled = false;

const cloudUnlockState = {
    bestWave: 1,
    bestArenaLevel: 1,
    keys: new Set(['character_1']),
};

const cloudUnlockProgressState = {
    bestPlayerLevel: 1,
    hasLifestealPickup: false,
    hasExtraDashPickup: false,
    bestSpeedBonusPct: 0,
};

const cloudAchievementState = {
    totalKills: 0,
    voidBossKills: 0,
    necromancerBossKills: 0,
    wins: 0,
    totalRuns: 0,
    defeats: 0,
    totalPlaySeconds: 0,
    unlocked: new Set(),
    pendingPopups: [],
};

const cloudAuthPanel = document.createElement('section');
cloudAuthPanel.id = 'cloudAuthPanel';

const cloudAuthTitle = document.createElement('h2');
cloudAuthTitle.id = 'cloudAuthTitle';
cloudAuthTitle.textContent = 'Cloud Account';

const cloudAuthStatus = document.createElement('p');
cloudAuthStatus.id = 'cloudAuthStatus';
cloudAuthStatus.textContent = cloudStatusMessage;

const cloudUsernameInput = document.createElement('input');
cloudUsernameInput.id = 'cloudUsernameInput';
cloudUsernameInput.type = 'text';
cloudUsernameInput.placeholder = 'Username';
cloudUsernameInput.autocomplete = 'username';
cloudUsernameInput.maxLength = 24;

const cloudPasswordInput = document.createElement('input');
cloudPasswordInput.id = 'cloudPasswordInput';
cloudPasswordInput.type = 'password';
cloudPasswordInput.placeholder = 'Password';
cloudPasswordInput.autocomplete = 'current-password';

const cloudDisplayNameInput = document.createElement('input');
cloudDisplayNameInput.id = 'cloudDisplayNameInput';
cloudDisplayNameInput.type = 'text';
cloudDisplayNameInput.placeholder = 'Display name';
cloudDisplayNameInput.maxLength = 24;

const cloudAuthButtonRow = document.createElement('div');
cloudAuthButtonRow.id = 'cloudAuthButtonRow';

const cloudSignupButton = document.createElement('button');
cloudSignupButton.id = 'cloudSignupButton';
cloudSignupButton.type = 'button';
cloudSignupButton.textContent = 'Sign Up';

const cloudLoginButton = document.createElement('button');
cloudLoginButton.id = 'cloudLoginButton';
cloudLoginButton.type = 'button';
cloudLoginButton.textContent = 'Login';

const cloudLogoutButton = document.createElement('button');
cloudLogoutButton.id = 'cloudLogoutButton';
cloudLogoutButton.type = 'button';
cloudLogoutButton.textContent = 'Logout';

const cloudSaveButton = document.createElement('button');
cloudSaveButton.id = 'cloudSaveButton';
cloudSaveButton.type = 'button';
cloudSaveButton.textContent = 'Save Now';

const cloudResetProgressButton = document.createElement('button');
cloudResetProgressButton.id = 'cloudResetProgressButton';
cloudResetProgressButton.type = 'button';
cloudResetProgressButton.textContent = 'Reset Progress';

cloudAuthButtonRow.appendChild(cloudSignupButton);
cloudAuthButtonRow.appendChild(cloudLoginButton);
cloudAuthButtonRow.appendChild(cloudLogoutButton);
cloudAuthButtonRow.appendChild(cloudSaveButton);
cloudAuthButtonRow.appendChild(cloudResetProgressButton);

cloudAuthPanel.appendChild(cloudAuthTitle);
cloudAuthPanel.appendChild(cloudAuthStatus);
cloudAuthPanel.appendChild(cloudUsernameInput);
cloudAuthPanel.appendChild(cloudPasswordInput);
cloudAuthPanel.appendChild(cloudDisplayNameInput);
cloudAuthPanel.appendChild(cloudAuthButtonRow);

const cloudAuthToggleButton = document.createElement('button');
cloudAuthToggleButton.id = 'cloudAuthToggleButton';
cloudAuthToggleButton.type = 'button';
cloudAuthToggleButton.textContent = '⚙️';
cloudAuthToggleButton.title = 'Toggle Cloud Account';

document.body.appendChild(cloudAuthPanel);
document.body.appendChild(cloudAuthToggleButton);

function setCloudStatus(message) {
    cloudStatusMessage = message;
    cloudAuthStatus.textContent = message;
}

function sanitizeDisplayName(name) {
    const cleaned = String(name ?? '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'Pilot';
    return cleaned.slice(0, 24);
}

function sanitizeLoginName(name) {
    return String(name ?? '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 24);
}

function getAuthEmailFromUsername(username) {
    return `${username}@${CLOUD_AUTH_EMAIL_DOMAIN}`;
}

function withCloudTimeout(promise, label = 'request', ms = 4500) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timeout`)), ms);
        }),
    ]);
}



function getAuthInputCredentials() {
    const username = sanitizeLoginName(cloudUsernameInput.value);
    return {
        username,
        email: getAuthEmailFromUsername(username),
        password: cloudPasswordInput.value,
    };
}

function getAbsoluteWaveProgress() {
    const level = typeof currentArenaLevel === 'number' ? currentArenaLevel : 1;
    const wave = typeof currentWave === 'number' ? currentWave : 1;
    return Math.max(1, (Math.max(1, level) - 1) * WAVES_PER_LEVEL + Math.max(1, wave));
}

function normalizeCharacterRuleKey(name) {
    return String(name ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function getCharacterUnlockRule(index) {
    const waveRequirement = CHARACTER_UNLOCK_WAVE_REQUIREMENTS[index] ?? 0;
    const loadout = CHARACTER_LOADOUTS[index] ?? null;
    const ruleKey = normalizeCharacterRuleKey(loadout?.name);
    const secondary = CHARACTER_SECONDARY_UNLOCK_RULES[ruleKey] ?? null;
    return {
        waveRequirement,
        secondary,
    };
}

function isSecondaryUnlockRequirementMet(rule) {
    if (!rule) return true;
    if (rule.requiresLifesteal && !cloudUnlockProgressState.hasLifestealPickup) return false;
    if (rule.requiresExtraDash && !cloudUnlockProgressState.hasExtraDashPickup) return false;
    if ((rule.minPlayerLevel ?? 0) > cloudUnlockProgressState.bestPlayerLevel) return false;
    if ((rule.minSpeedBonusPct ?? 0) > cloudUnlockProgressState.bestSpeedBonusPct) return false;
    return true;
}

function getSecondaryUnlockRequirementText(rule) {
    if (!rule) return [];
    const parts = [];
    if (rule.requiresLifesteal) parts.push('Get lifesteal');
    if (rule.requiresExtraDash) parts.push('Find an extra dash charge');
    if ((rule.minPlayerLevel ?? 0) > 0) parts.push(`Reach player level ${rule.minPlayerLevel}`);
    if ((rule.minSpeedBonusPct ?? 0) > 0) parts.push(`Get +${rule.minSpeedBonusPct}% speed`);
    return parts;
}

function getCurrentSpeedBonusPercent() {
    const baseSpeed = Number(getSelectedCharacter()?.speed ?? 0);
    const currentSpeed = Number(player?.speed ?? 0);
    if (baseSpeed <= 0 || currentSpeed <= 0) return 0;
    return Math.max(0, Math.round(((currentSpeed / baseSpeed) - 1) * 100));
}

function updateUnlockProgressFromCurrentRun() {
    if (!player) return false;
    let changed = false;

    const runLevel = Math.max(1, Number(player.level ?? 1) || 1);
    if (runLevel > cloudUnlockProgressState.bestPlayerLevel) {
        cloudUnlockProgressState.bestPlayerLevel = runLevel;
        changed = true;
    }

    if (!cloudUnlockProgressState.hasLifestealPickup && (player.lifestealOnKill ?? 0) > 0.001) {
        cloudUnlockProgressState.hasLifestealPickup = true;
        changed = true;
    }

    const baseDashCharges = Math.max(1, Number(getSelectedCharacter()?.dashCharges ?? 1) || 1);
    if (!cloudUnlockProgressState.hasExtraDashPickup && (player.dashMaxCharges ?? 1) > baseDashCharges) {
        cloudUnlockProgressState.hasExtraDashPickup = true;
        changed = true;
    }

    const speedBonusPct = getCurrentSpeedBonusPercent();
    if (speedBonusPct > cloudUnlockProgressState.bestSpeedBonusPct) {
        cloudUnlockProgressState.bestSpeedBonusPct = speedBonusPct;
        changed = true;
    }

    return changed;
}

function serializeUnlockProgressState() {
    return {
        bestPlayerLevel: Math.max(1, Math.floor(Number(cloudUnlockProgressState.bestPlayerLevel ?? 1) || 1)),
        hasLifestealPickup: !!cloudUnlockProgressState.hasLifestealPickup,
        hasExtraDashPickup: !!cloudUnlockProgressState.hasExtraDashPickup,
        bestSpeedBonusPct: Math.max(0, Math.floor(Number(cloudUnlockProgressState.bestSpeedBonusPct ?? 0) || 0)),
    };
}

function applyLoadedUnlockProgress(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    cloudUnlockProgressState.bestPlayerLevel = Math.max(1, Number(data.bestPlayerLevel ?? 1) || 1);
    cloudUnlockProgressState.hasLifestealPickup = !!data.hasLifestealPickup;
    cloudUnlockProgressState.hasExtraDashPickup = !!data.hasExtraDashPickup;
    cloudUnlockProgressState.bestSpeedBonusPct = Math.max(0, Number(data.bestSpeedBonusPct ?? 0) || 0);
}

function resetUnlockProgressState() {
    cloudUnlockProgressState.bestPlayerLevel = 1;
    cloudUnlockProgressState.hasLifestealPickup = false;
    cloudUnlockProgressState.hasExtraDashPickup = false;
    cloudUnlockProgressState.bestSpeedBonusPct = 0;
}

function isCharacterUnlocked(index) {
    if (index <= 0) return true;
    const unlockKey = `character_${index + 1}`;
    return cloudUnlockState.keys.has(unlockKey);
}

function getCharacterUnlockRequirementText(index) {
    const { waveRequirement, secondary } = getCharacterUnlockRule(index);
    const parts = [];
    if (waveRequirement > 0) {
        parts.push(`Reach wave ${waveRequirement}`);
    }
    parts.push(...getSecondaryUnlockRequirementText(secondary));
    if (parts.length === 0) return 'Starter';
    return parts.join(' + ');
}

function getCharacterUnlockRequirementLines(index, maxLines = 2) {
    const text = getCharacterUnlockRequirementText(index);
    const chunks = text.split(' + ').filter(Boolean);
    if (chunks.length <= maxLines) return chunks;

    const lines = [];
    for (let i = 0; i < chunks.length; i++) {
        if (i < maxLines - 1) {
            lines.push(chunks[i]);
            continue;
        }
        lines.push(chunks.slice(i).join(' + '));
        break;
    }
    return lines;
}

function normalizeSelectedCharacter() {
    if (typeof selectedCharacter !== 'number') return;
    if (!isCharacterUnlocked(selectedCharacter)) {
        selectedCharacter = 0;
    }
}

function unlockCharactersFromProgress() {
    const newlyUnlocked = [];
    cloudUnlockState.keys.add('character_1');

    for (let i = 1; i < CHARACTER_UNLOCK_WAVE_REQUIREMENTS.length; i++) {
        const { waveRequirement, secondary } = getCharacterUnlockRule(i);
        const unlockKey = `character_${i + 1}`;
        const waveRequirementMet = cloudUnlockState.bestWave >= waveRequirement;
        const secondaryRequirementMet = isSecondaryUnlockRequirementMet(secondary);
        if (waveRequirementMet && secondaryRequirementMet && !cloudUnlockState.keys.has(unlockKey)) {
            cloudUnlockState.keys.add(unlockKey);
            newlyUnlocked.push(unlockKey);
        }
    }

    normalizeSelectedCharacter();
    return newlyUnlocked;
}

function getAchievementProgressValue(def) {
    let rawValue = cloudAchievementState?.[def.stat] ?? 0;
    // Baseline values for these stats start at 1, but achievements should start at 0 progress.
    if (def.stat === 'bestWave') rawValue = Math.max(0, (cloudUnlockState.bestWave ?? 1) - 1);
    if (def.stat === 'bestArenaLevel') rawValue = Math.max(0, (cloudUnlockState.bestArenaLevel ?? 1) - 1);
    if (def.stat === 'bestPlayerLevel') rawValue = Math.max(0, (cloudUnlockProgressState.bestPlayerLevel ?? 1) - 1);
    if (def.stat === 'bestSpeedBonusPct') rawValue = cloudUnlockProgressState.bestSpeedBonusPct;
    if (def.stat === 'hasExtraDashPickup') rawValue = cloudUnlockProgressState.hasExtraDashPickup ? 1 : 0;
    if (def.stat === 'hasLifestealPickup') rawValue = cloudUnlockProgressState.hasLifestealPickup ? 1 : 0;
    const value = Number(rawValue ?? 0);
    return Math.max(0, Number.isNaN(value) ? 0 : value);
}

function evaluateAchievements({ queuePopup = false } = {}) {
    const newlyUnlocked = [];
    for (const def of ACHIEVEMENT_DEFINITIONS) {
        const progress = getAchievementProgressValue(def);
        if (progress < def.target) continue;
        if (cloudAchievementState.unlocked.has(def.id)) continue;
        cloudAchievementState.unlocked.add(def.id);
        newlyUnlocked.push(def);
    }

    if (queuePopup && newlyUnlocked.length > 0) {
        for (const def of newlyUnlocked) {
            cloudAchievementState.pendingPopups.push({
                title: def.title,
                description: def.description,
                expiresAt: Date.now() + 3000,
            });
        }
    }

    return newlyUnlocked;
}

function getAchievementEntries() {
    return ACHIEVEMENT_DEFINITIONS.map(def => {
        const current = getAchievementProgressValue(def);
        const target = def.target;
        const unlocked = cloudAchievementState.unlocked.has(def.id);
        const ratio = target > 0 ? Math.min(1, current / target) : 1;
        return {
            id: def.id,
            title: def.title,
            detail: def.description,
            current,
            target,
            ratio,
            unlocked,
            kind: 'achievement',
            rarity: unlocked ? 'legendary' : 'common',
        };
    });
}

function serializeAchievementState() {
    return {
        totalKills: Math.max(0, Math.floor(cloudAchievementState.totalKills ?? 0)),
        voidBossKills: Math.max(0, Math.floor(cloudAchievementState.voidBossKills ?? 0)),
        necromancerBossKills: Math.max(0, Math.floor(cloudAchievementState.necromancerBossKills ?? 0)),
        wins: Math.max(0, Math.floor(cloudAchievementState.wins ?? 0)),
        totalRuns: Math.max(0, Math.floor(cloudAchievementState.totalRuns ?? 0)),
        defeats: Math.max(0, Math.floor(cloudAchievementState.defeats ?? 0)),
        totalPlaySeconds: Math.max(0, Math.floor(cloudAchievementState.totalPlaySeconds ?? 0)),
        unlocked: Array.from(cloudAchievementState.unlocked),
    };
}

function applyLoadedAchievements(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    cloudAchievementState.totalKills = Math.max(0, Number(data.totalKills ?? 0) || 0);
    cloudAchievementState.voidBossKills = Math.max(0, Number(data.voidBossKills ?? 0) || 0);
    cloudAchievementState.necromancerBossKills = Math.max(0, Number(data.necromancerBossKills ?? 0) || 0);
    cloudAchievementState.wins = Math.max(0, Number(data.wins ?? 0) || 0);
    cloudAchievementState.totalRuns = Math.max(0, Number(data.totalRuns ?? 0) || 0);
    cloudAchievementState.defeats = Math.max(0, Number(data.defeats ?? 0) || 0);
    cloudAchievementState.totalPlaySeconds = Math.max(0, Number(data.totalPlaySeconds ?? 0) || 0);

    cloudAchievementState.unlocked = new Set();
    for (const id of data.unlocked ?? []) {
        if (typeof id === 'string') cloudAchievementState.unlocked.add(id);
    }

    evaluateAchievements({ queuePopup: false });
}

function resetAchievementProgress() {
    cloudAchievementState.totalKills = 0;
    cloudAchievementState.voidBossKills = 0;
    cloudAchievementState.necromancerBossKills = 0;
    cloudAchievementState.wins = 0;
    cloudAchievementState.totalRuns = 0;
    cloudAchievementState.defeats = 0;
    cloudAchievementState.totalPlaySeconds = 0;
    cloudAchievementState.unlocked = new Set();
    cloudAchievementState.pendingPopups = [];
}

function queueAchievementProgressSave(reason = 'achievement') {
    if (!supabaseClient || !cloudUser) return;
    const now = Date.now();
    const elapsed = now - cloudLastAchievementSaveAt;
    if (elapsed < CLOUD_ACHIEVEMENT_SAVE_INTERVAL_MS) {
        const waitMs = CLOUD_ACHIEVEMENT_SAVE_INTERVAL_MS - elapsed;
        if (cloudAchievementSaveTimer !== null) return;
        cloudAchievementSaveTimer = setTimeout(() => {
            cloudAchievementSaveTimer = null;
            queueAchievementProgressSave('achievement-delayed');
        }, waitMs);
        return;
    }
    cloudLastAchievementSaveAt = now;
    queueCloudSave(reason);
}

function registerAchievementEnemyKill(amount = 1) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (safeAmount <= 0) return;
    cloudAchievementState.totalKills += safeAmount;
    evaluateAchievements({ queuePopup: true });
    queueAchievementProgressSave('achievement-kill');
}

function registerAchievementBossKill(type) {
    if (type === 'void') {
        cloudAchievementState.voidBossKills += 1;
    } else if (type === 'necromancer') {
        cloudAchievementState.necromancerBossKills += 1;
    }
    evaluateAchievements({ queuePopup: true });
    queueAchievementProgressSave('achievement-boss');
}

function registerAchievementRunOutcome(result) {
    cloudAchievementState.totalRuns += 1;
    cloudAchievementState.totalPlaySeconds += Math.max(0, Math.round((elapsedGameMs ?? 0) / 1000));
    if (result === 'win') {
        cloudAchievementState.wins += 1;
    } else if (result === 'defeat') {
        cloudAchievementState.defeats += 1;
    }
    evaluateAchievements({ queuePopup: true });
    queueAchievementProgressSave('achievement-run');
}

function drawAchievementPopup() {
    if (typeof ctx === 'undefined') return;
    const now = Date.now();
    cloudAchievementState.pendingPopups = cloudAchievementState.pendingPopups.filter(p => p.expiresAt > now);
    if (cloudAchievementState.pendingPopups.length === 0) return;

    const popup = cloudAchievementState.pendingPopups[0];
    const width = Math.min(360, canvas.width - 28);
    const height = 74;
    const x = canvas.width - width - 14;
    const y = 14;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.84)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,0.66)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#ffe066';
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Arial';
    ctx.fillText('Achievement Unlocked', x + 12, y + 24);

    ctx.fillStyle = '#f1f1f1';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(popup.title, x + 12, y + 44);

    ctx.fillStyle = '#ccd3da';
    ctx.font = '12px Arial';
    ctx.fillText(popup.description, x + 12, y + 62);
    ctx.restore();
}

async function persistUnlockKey(unlockKey) {
    if (!supabaseClient || !cloudUser) return;
    const { error } = await withCloudTimeout(
        supabaseClient
            .from('unlocks')
            .upsert({
                user_id: cloudUser.id,
                unlock_key: unlockKey,
                unlocked_at: new Date().toISOString(),
            }, { onConflict: 'user_id,unlock_key' }),
        'unlock upsert',
    );

    if (error) throw error;
}

async function persistUnlockKeys(unlockKeys) {
    if (!unlockKeys.length) return;
    for (const unlockKey of unlockKeys) {
        try {
            await persistUnlockKey(unlockKey);
        } catch (err) {
            setCloudStatus(`Unlock sync error: ${err.message}`);
            return;
        }
    }
}

function serializeCloudSavePayload() {
    const nowIso = new Date().toISOString();
    const stats = {
        selectedCharacter: typeof selectedCharacter === 'number' ? selectedCharacter : 0,
        selectedCursor: typeof selectedCursor === 'number' ? selectedCursor : 0,
        playerLevel: typeof player?.level === 'number' ? player.level : 1,
        playerXp: typeof player?.xp === 'number' ? player.xp : 0,
        lastLevelDied: typeof lastLevelDied === 'number' ? lastLevelDied : 1,
        unlockProgress: serializeUnlockProgressState(),
        achievements: serializeAchievementState(),
    };

    const progression = {
        bestWave: cloudUnlockState.bestWave,
        bestArenaLevel: cloudUnlockState.bestArenaLevel,
        currentArenaLevel: typeof currentArenaLevel === 'number' ? currentArenaLevel : 1,
        currentWave: typeof currentWave === 'number' ? currentWave : 1,
        currentState: typeof gameState === 'string' ? gameState : 'menu',
        updatedAt: nowIso,
    };

    const settings = {
        musicVolume: typeof musicVolume === 'number' ? musicVolume : 0.9,
        sfxVolume: typeof sfxVolume === 'number' ? sfxVolume : 1,
        mapSize: typeof mapSize === 'number' ? mapSize : 1,
        mapOpacity: typeof mapOpacity === 'number' ? mapOpacity : 1,
        mapShape: typeof mapShape === 'string' ? mapShape : 'circle',
        showFpsCounter: !!showFpsCounter,
        fogEnabled: !!fogEnabled,
    };

    return { stats, progression, settings, nowIso };
}

function updateCloudProgressMilestones() {
    if (typeof currentArenaLevel !== 'number' || typeof currentWave !== 'number') return;

    const absoluteWave = getAbsoluteWaveProgress();
    const prevBestWave = cloudUnlockState.bestWave;
    const prevBestArena = cloudUnlockState.bestArenaLevel;
    const unlockProgressChanged = updateUnlockProgressFromCurrentRun();

    cloudUnlockState.bestWave = Math.max(cloudUnlockState.bestWave, absoluteWave);
    cloudUnlockState.bestArenaLevel = Math.max(cloudUnlockState.bestArenaLevel, currentArenaLevel);

    const newlyUnlocked = unlockCharactersFromProgress();
    if (newlyUnlocked.length > 0 && cloudUser) {
        persistUnlockKeys(newlyUnlocked);
    }

    if ((cloudUnlockState.bestWave !== prevBestWave || cloudUnlockState.bestArenaLevel !== prevBestArena || unlockProgressChanged) && cloudUser) {
        queueCloudSave('milestone');
    }

    if (unlockProgressChanged || cloudUnlockState.bestWave !== prevBestWave || cloudUnlockState.bestArenaLevel !== prevBestArena) {
        evaluateAchievements({ queuePopup: true });
    }
}

function shouldShowCloudPanel() {
    return gameState === 'menu' || gameState === 'gameOver' || gameState === 'win';
}

function isCloudAuthInputFocused() {
    const active = document.activeElement;
    if (!active) return false;
    if (!cloudAuthPanel.contains(active)) return false;
    const tag = active.tagName;
    return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON';
}

function syncAuthPanel() {
    // Auto-hide when not in menu/gameover/win states, otherwise respect user toggle
    const shouldBeVisible = shouldShowCloudPanel() && cloudAuthPanelUserToggled;
    cloudAuthPanel.style.display = shouldBeVisible ? 'flex' : 'none';

    const signedIn = !!cloudUser;
    cloudUsernameInput.disabled = signedIn;
    cloudPasswordInput.disabled = signedIn;
    cloudSignupButton.disabled = signedIn || !cloudAuthReady;
    cloudLoginButton.disabled = signedIn || !cloudAuthReady;
    cloudLogoutButton.disabled = !signedIn || !cloudAuthReady;
    cloudSaveButton.disabled = !signedIn || !cloudAuthReady;
    cloudResetProgressButton.disabled = !signedIn || !cloudAuthReady;

    cloudDisplayNameInput.disabled = !signedIn;

    if (signedIn) {
        const titleName = cloudDisplayNameInput.value.trim() || cloudLoginName || 'Signed in';
        cloudAuthTitle.textContent = `Cloud Account - ${titleName}`;
    } else {
        cloudAuthTitle.textContent = 'Cloud Account';
    }
}

async function ensureProfile() {
    if (!supabaseClient || !cloudUser) return false;
    if (cloudProfileSyncBlocked) return false;

    const fallbackName = cloudLoginName || cloudUser.email?.split('@')[0] || 'Pilot';
    const displayName = sanitizeDisplayName(cloudDisplayNameInput.value || fallbackName);

    const { error } = await withCloudTimeout(
        supabaseClient
            .from('profiles')
            .upsert({
                id: cloudUser.id,
                display_name: displayName,
                updated_at: new Date().toISOString(),
            }),
        'profile upsert',
    );

    if (error) {
        const msg = String(error?.message ?? 'unknown profile error');
        if (msg.includes('permission denied') || msg.includes('row-level security')) {
            cloudProfileSyncBlocked = true;
            if (!cloudProfileWarningShown) {
                cloudProfileWarningShown = true;
                setCloudStatus('Cloud: profile sync disabled (profiles RLS)');
            }
            return false;
        }
        throw error;
    }

    cloudDisplayNameInput.value = displayName;
    return true;
}

function applyLoadedSettings(settings) {
    if (!settings) return;

    if (typeof settings.mapSize === 'number') mapSize = Math.max(0.5, Math.min(2, settings.mapSize));
    if (typeof settings.mapOpacity === 'number') mapOpacity = Math.max(0.2, Math.min(1, settings.mapOpacity));
    if (typeof settings.mapShape === 'string') mapShape = settings.mapShape;
    if (typeof settings.showFpsCounter === 'boolean') showFpsCounter = settings.showFpsCounter;
    if (typeof settings.fogEnabled === 'boolean') fogEnabled = settings.fogEnabled;

    if (typeof settings.musicVolume === 'number') {
        if (typeof setMusicVolume === 'function') {
            setMusicVolume(settings.musicVolume, { persist: false });
        } else {
            musicVolume = settings.musicVolume;
        }
    }

    if (typeof settings.sfxVolume === 'number') {
        if (typeof setSfxVolume === 'function') {
            setSfxVolume(settings.sfxVolume, { persist: false });
        } else {
            sfxVolume = settings.sfxVolume;
        }
    }
}

function applyLoadedStats(stats) {
    if (!stats) return;

    if (typeof stats.selectedCursor === 'number') {
        selectedCursor = Math.max(0, Math.min(cursorSprites.length - 1, stats.selectedCursor));
    }

    if (typeof stats.lastLevelDied === 'number') {
        lastLevelDied = Math.max(1, stats.lastLevelDied);
    }

    if (typeof stats.selectedCharacter === 'number') {
        selectedCharacter = Math.max(0, Math.min(CHARACTER_LOADOUTS.length - 1, stats.selectedCharacter));
    }

    if (stats.unlockProgress) {
        applyLoadedUnlockProgress(stats.unlockProgress);
    }

    if (stats.achievements) {
        applyLoadedAchievements(stats.achievements);
    }

    normalizeSelectedCharacter();
}

async function loadCloudData() {
    if (!supabaseClient || !cloudUser) return;

    const { data: profileRow } = await supabaseClient
        .from('profiles')
        .select('display_name')
        .eq('id', cloudUser.id)
        .maybeSingle();

    if (profileRow) {
        cloudDisplayNameInput.value = sanitizeDisplayName(profileRow.display_name);
    }

    const { data: unlockRows } = await supabaseClient
        .from('unlocks')
        .select('unlock_key')
        .eq('user_id', cloudUser.id);

    cloudUnlockState.keys = new Set(['character_1']);
    for (const row of unlockRows ?? []) {
        if (typeof row.unlock_key === 'string') {
            cloudUnlockState.keys.add(row.unlock_key);
        }
    }

    const { data: saveRows } = await supabaseClient
        .from('saves')
        .select('id, stats, progression, settings, updated_at')
        .eq('user_id', cloudUser.id)
        .order('updated_at', { ascending: false })
        .limit(1);

    const saveRow = saveRows?.[0] ?? null;
    cloudSaveRowId = saveRow?.id ?? null;

    if (saveRow?.progression) {
        const savedBestWave = Number(saveRow.progression.bestWave ?? 1);
        const savedBestArena = Number(saveRow.progression.bestArenaLevel ?? 1);
        cloudUnlockState.bestWave = Math.max(1, Number.isNaN(savedBestWave) ? 1 : savedBestWave);
        cloudUnlockState.bestArenaLevel = Math.max(1, Number.isNaN(savedBestArena) ? 1 : savedBestArena);
    }

    if (saveRow?.settings) applyLoadedSettings(saveRow.settings);
    if (saveRow?.stats) applyLoadedStats(saveRow.stats);

    const newlyUnlocked = unlockCharactersFromProgress();
    if (newlyUnlocked.length > 0) {
        await persistUnlockKeys(newlyUnlocked);
    }
}

async function queueCloudSave(reason = 'manual') {
    if (!supabaseClient || !cloudUser) return;
    if (!cloudDataHydrated) {
        cloudSavePendingAfterHydration = true;
        return;
    }
    if (cloudSaveInFlight) {
        cloudSaveQueued = true;
        return;
    }

    cloudSaveInFlight = true;
    const { stats, progression, settings, nowIso } = serializeCloudSavePayload();

    try {
        await ensureProfile();

        const saveRecord = {
            user_id: cloudUser.id,
            stats,
            progression,
            settings,
            updated_at: nowIso,
        };

        if (cloudSaveRowId) {
            const { error } = await withCloudTimeout(
                supabaseClient
                    .from('saves')
                    .update(saveRecord)
                    .eq('id', cloudSaveRowId)
                    .eq('user_id', cloudUser.id),
                'save update',
            );
            if (error) throw error;
        } else {
            const { data: inserted, error } = await withCloudTimeout(
                supabaseClient
                    .from('saves')
                    .insert(saveRecord)
                    .select('id')
                    .limit(1),
                'save insert',
            );
            if (error) throw error;
            cloudSaveRowId = inserted?.[0]?.id ?? null;
        }

        const keysToPersist = Array.from(cloudUnlockState.keys);
        for (const key of keysToPersist) {
            await persistUnlockKey(key);
        }

        cloudLastAutosaveAt = Date.now();
        setCloudStatus(`Cloud: saved (${reason})`);
    } catch (err) {
        const errMessage = String(err?.message ?? 'unknown error');
        if (errMessage.includes('lock:sb-') || errMessage.includes('another request stole it') || errMessage.includes('timeout')) {
            cloudSaveQueued = true;
            setCloudStatus('Cloud: retrying save...');
            setTimeout(() => {
                if (cloudUser && supabaseClient) {
                    queueCloudSave('retry');
                }
            }, 250);
            return;
        }
        setCloudStatus(`Cloud save failed: ${errMessage}`);
    } finally {
        cloudSaveInFlight = false;
        if (cloudSaveQueued) {
            cloudSaveQueued = false;
            queueCloudSave('queued');
        }
    }
}

async function saveRunHistory(result) {
    if (!supabaseClient || !cloudUser) return;

    const durationSeconds = Math.max(0, Math.round((elapsedGameMs ?? 0) / 1000));
    const score = Math.max(0, Math.round((player?.level ?? 1) * 100 + (cloudUnlockState.bestWave ?? 1) * 20));

    await supabaseClient.from('run_history').insert({
        user_id: cloudUser.id,
        result,
        wave_reached: cloudUnlockState.bestWave,
        score,
        duration_seconds: durationSeconds,
    });
}

async function registerCloudRunOutcome(result) {
    if (cloudRunOutcomeSaved) return;
    cloudRunOutcomeSaved = true;

    updateCloudProgressMilestones();
    registerAchievementRunOutcome(result);

    if (!supabaseClient || !cloudUser) return;

    try {
        await saveRunHistory(result);
        await queueCloudSave(result);
    } catch (err) {
        setCloudStatus(`Cloud run log failed: ${err.message}`);
    }
}

function resetCloudRunState() {
    cloudRunOutcomeSaved = false;
}

async function handleSignedIn(session) {
    const user = session?.user ?? null;
    if (!user) return;

    const usernameFromEmail = user.email?.split('@')[0] ?? '';
    if (usernameFromEmail) {
        cloudLoginName = sanitizeLoginName(usernameFromEmail);
        cloudUsernameInput.value = cloudLoginName;
    }

    if (cloudSessionSyncPromise && cloudSessionSyncUserId === user.id) {
        await cloudSessionSyncPromise;
        return;
    }

    cloudSessionSyncUserId = user.id;
    cloudSessionSyncPromise = (async () => {
        cloudDataHydrated = false;
        cloudSavePendingAfterHydration = false;
        cloudUser = user;

        try {
            await ensureProfile();
            await loadCloudData();
            cloudDataHydrated = true;
            if (cloudSavePendingAfterHydration) {
                cloudSavePendingAfterHydration = false;
                queueCloudSave('post-sync');
            }
            setCloudStatus('Cloud: synced');
        } catch (err) {
            setCloudStatus(`Cloud sync failed: ${err.message}`);
        } finally {
            cloudSessionSyncPromise = null;
            cloudSessionSyncUserId = null;
        }
    })();

    await cloudSessionSyncPromise;
}

function handleSignedOut() {
    cloudUser = null;
    cloudLoginName = '';
    cloudSaveRowId = null;
    cloudProfileSyncBlocked = false;
    cloudProfileWarningShown = false;
    cloudDataHydrated = false;
    cloudSavePendingAfterHydration = false;
    if (cloudAchievementSaveTimer !== null) {
        clearTimeout(cloudAchievementSaveTimer);
        cloudAchievementSaveTimer = null;
    }
    cloudLastAchievementSaveAt = 0;
    cloudUnlockState.bestWave = 1;
    cloudUnlockState.bestArenaLevel = 1;
    cloudUnlockState.keys = new Set(['character_1']);
    resetUnlockProgressState();
    resetAchievementProgress();
    normalizeSelectedCharacter();
    setCloudStatus('Cloud: signed out');
}

async function tryResetCloudProgress() {
    if (!supabaseClient || !cloudUser) {
        setCloudStatus('Login required before reset');
        return;
    }

    if (gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'win') {
        setCloudStatus('Reset available only in menu/game over/win screens');
        return;
    }

    const confirmed = window.confirm('Reset all cloud progress for this account? This cannot be undone.');
    if (!confirmed) return;

    setCloudStatus('Resetting cloud progress...');

    try {
        const userId = cloudUser.id;

        const { error: unlockError } = await withCloudTimeout(
            supabaseClient.from('unlocks').delete().eq('user_id', userId),
            'unlock reset',
        );
        if (unlockError) throw unlockError;

        const { error: saveError } = await withCloudTimeout(
            supabaseClient.from('saves').delete().eq('user_id', userId),
            'save reset',
        );
        if (saveError) throw saveError;

        const { error: historyError } = await withCloudTimeout(
            supabaseClient.from('run_history').delete().eq('user_id', userId),
            'history reset',
        );
        if (historyError) throw historyError;

        cloudSaveRowId = null;
        cloudUnlockState.bestWave = 1;
        cloudUnlockState.bestArenaLevel = 1;
        cloudUnlockState.keys = new Set(['character_1']);
        resetUnlockProgressState();
        selectedCharacter = 0;
        lastLevelDied = 1;
        resetAchievementProgress();
        normalizeSelectedCharacter();

        await queueCloudSave('reset');
        setCloudStatus('Cloud: progress reset complete');
    } catch (err) {
        setCloudStatus(`Reset failed: ${String(err?.message ?? 'unknown error')}`);
    }
}

async function trySignup() {
    if (!supabaseClient) return;
    const { username, email, password } = getAuthInputCredentials();
    if (!username || !password) {
        setCloudStatus('Enter username and password');
        return;
    }
    if (username.length < 3) {
        setCloudStatus('Username must be at least 3 characters');
        return;
    }

    cloudLoginName = username;
    cloudUsernameInput.value = username;
    if (!cloudDisplayNameInput.value.trim()) {
        cloudDisplayNameInput.value = username;
    }

    setCloudStatus('Creating account...');
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        setCloudStatus(`Sign up failed: ${error.message}`);
        return;
    }

    setCloudStatus('Sign up successful. You can now log in.');
}

async function tryLogin() {
    if (!supabaseClient) return;
    const { username, email, password } = getAuthInputCredentials();
    if (!username || !password) {
        setCloudStatus('Enter username and password');
        return;
    }
    if (username.length < 3) {
        setCloudStatus('Username must be at least 3 characters');
        return;
    }

    cloudLoginName = username;
    cloudUsernameInput.value = username;
    if (!cloudDisplayNameInput.value.trim()) {
        cloudDisplayNameInput.value = username;
    }

    setCloudStatus('Logging in...');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        setCloudStatus(`Login failed: ${error.message}`);
        return;
    }

    if (data?.session?.user) {
        await handleSignedIn(data.session);
        return;
    }

    setCloudStatus('Login successful. Waiting for session...');
}

async function tryLogout() {
    if (!supabaseClient || cloudLogoutInFlight) return;

    const withTimeout = (promise, ms = 3500) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Logout timeout')), ms);
            }),
        ]);
    };

    cloudLogoutInFlight = true;
    setCloudStatus('Logging out...');

    try {
        const { error } = await withTimeout(supabaseClient.auth.signOut());
        if (error) throw error;
        handleSignedOut();
        return;
    } catch (err) {
        const msg = String(err?.message ?? 'unknown error');
        const isLockOrTimeout = msg.includes('lock:sb-') || msg.includes('stole it') || msg.includes('timeout');

        if (!isLockOrTimeout) {
            setCloudStatus(`Logout failed: ${msg}`);
            return;
        }

        try {
            // Fallback clears local auth state so the UI can recover immediately.
            const { error: localError } = await withTimeout(supabaseClient.auth.signOut({ scope: 'local' }), 2000);
            if (localError) throw localError;
            handleSignedOut();
            setCloudStatus('Cloud: signed out (local fallback)');
        } catch (localErr) {
            handleSignedOut();
            setCloudStatus(`Cloud: signed out with warning (${String(localErr?.message ?? 'fallback error')})`);
        }
    } finally {
        cloudLogoutInFlight = false;
    }
}

function initializeCloudAuth() {
    if (cloudAuthInitialized) return;

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        setCloudStatus('Cloud unavailable: missing supabase-js script');
        syncAuthPanel();
        return;
    }

    cloudAuthInitialized = true;
    supabaseClient = window.supabase.createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY);
    cloudAuthReady = true;
    setCloudStatus('Cloud: ready');

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            handleSignedOut();
            return;
        }

        if (session?.user) {
            await handleSignedIn(session);
        }
    });

    supabaseClient.auth.getSession().then(async ({ data, error }) => {
        if (error) {
            setCloudStatus(`Session error: ${error.message}`);
            return;
        }

        if (data?.session?.user) {
            await handleSignedIn(data.session);
        }
    });

    cloudSignupButton.addEventListener('click', () => {
        trySignup();
    });

    cloudLoginButton.addEventListener('click', () => {
        tryLogin();
    });

    cloudLogoutButton.addEventListener('click', async () => {
        await tryLogout();
    });

    cloudSaveButton.addEventListener('click', async () => {
        if (!cloudUser || !supabaseClient) {
            setCloudStatus('Login required before cloud save');
            return;
        }
        setCloudStatus('Saving...');
        await queueCloudSave('manual');
    });

    cloudResetProgressButton.addEventListener('click', async () => {
        await tryResetCloudProgress();
    });

    cloudDisplayNameInput.addEventListener('change', () => {
        if (cloudUser) {
            queueCloudSave('profile');
        }
    });

    cloudAuthToggleButton.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        cloudAuthPanelUserToggled = !cloudAuthPanelUserToggled;
        syncAuthPanel();
    });

    cloudPasswordInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            tryLogin();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && cloudUser && supabaseClient) {
            queueCloudSave('lifecycle-hidden');
        }
    });

    window.addEventListener('beforeunload', () => {
        if (cloudUser && supabaseClient) {
            queueCloudSave('lifecycle-unload');
        }
    });
}

function tickCloudAutosave() {
    if (!cloudUser || !supabaseClient) return;
    const now = Date.now();
    if (now - cloudLastAutosaveAt < CLOUD_AUTOSAVE_INTERVAL_MS) return;
    queueCloudSave('autosave');
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeCloudAuth();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        initializeCloudAuth();
    }, { once: true });
    window.addEventListener('load', () => {
        initializeCloudAuth();
    }, { once: true });
}

window.cloudAuthPanel = cloudAuthPanel;
window.isCloudAuthInputFocused = isCloudAuthInputFocused;
window.syncAuthPanel = syncAuthPanel;
window.updateCloudProgressMilestones = updateCloudProgressMilestones;
window.isCharacterUnlocked = isCharacterUnlocked;
window.getCharacterUnlockRequirementText = getCharacterUnlockRequirementText;
window.getCharacterUnlockRequirementLines = getCharacterUnlockRequirementLines;
window.registerCloudRunOutcome = registerCloudRunOutcome;
window.registerAchievementEnemyKill = registerAchievementEnemyKill;
window.registerAchievementBossKill = registerAchievementBossKill;
window.getAchievementEntries = getAchievementEntries;
window.drawAchievementPopup = drawAchievementPopup;
window.resetAchievementProgress = resetAchievementProgress;
window.resetCloudRunState = resetCloudRunState;
window.queueCloudSave = queueCloudSave;
window.tickCloudAutosave = tickCloudAutosave;
window.normalizeSelectedCharacter = normalizeSelectedCharacter;
