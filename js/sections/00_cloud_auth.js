// Supabase auth and cloud save bootstrap for account data and unlockables.

const SUPABASE_PROJECT_URL = 'https://lknltlcslvqoatwtfdlm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FbxRRzWOsFiG1Oh_Q2YF7g_WfgFswvD';
const CLOUD_AUTH_EMAIL_DOMAIN = 'players.castanzakannon.local';
const CLOUD_AUTOSAVE_INTERVAL_MS = 30000;
const CHARACTER_UNLOCK_WAVE_REQUIREMENTS = [0, 5, 10, 15, 20];

let supabaseClient = null;
let cloudAuthReady = false;
let cloudUser = null;
let cloudSaveRowId = null;
let cloudSaveInFlight = false;
let cloudSaveQueued = false;
let cloudLastAutosaveAt = 0;
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

cloudAuthButtonRow.appendChild(cloudSignupButton);
cloudAuthButtonRow.appendChild(cloudLoginButton);
cloudAuthButtonRow.appendChild(cloudLogoutButton);
cloudAuthButtonRow.appendChild(cloudSaveButton);

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

function isCharacterUnlocked(index) {
    if (index <= 0) return true;
    const unlockKey = `character_${index + 1}`;
    return cloudUnlockState.keys.has(unlockKey);
}

function getCharacterUnlockRequirementText(index) {
    const waveRequirement = CHARACTER_UNLOCK_WAVE_REQUIREMENTS[index] ?? 0;
    if (waveRequirement <= 0) return 'Starter';
    return `Reach wave ${waveRequirement}`;
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
        const waveRequirement = CHARACTER_UNLOCK_WAVE_REQUIREMENTS[i] ?? 0;
        const unlockKey = `character_${i + 1}`;
        if (cloudUnlockState.bestWave >= waveRequirement && !cloudUnlockState.keys.has(unlockKey)) {
            cloudUnlockState.keys.add(unlockKey);
            newlyUnlocked.push(unlockKey);
        }
    }

    normalizeSelectedCharacter();
    return newlyUnlocked;
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

    cloudUnlockState.bestWave = Math.max(cloudUnlockState.bestWave, absoluteWave);
    cloudUnlockState.bestArenaLevel = Math.max(cloudUnlockState.bestArenaLevel, currentArenaLevel);

    const newlyUnlocked = unlockCharactersFromProgress();
    if (newlyUnlocked.length > 0 && cloudUser) {
        persistUnlockKeys(newlyUnlocked);
    }

    if ((cloudUnlockState.bestWave !== prevBestWave || cloudUnlockState.bestArenaLevel !== prevBestArena) && cloudUser) {
        queueCloudSave('milestone');
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

    const newlyUnlocked = unlockCharactersFromProgress();
    if (newlyUnlocked.length > 0) {
        await persistUnlockKeys(newlyUnlocked);
    }

    if (saveRow?.settings) applyLoadedSettings(saveRow.settings);
    if (saveRow?.stats) applyLoadedStats(saveRow.stats);
}

async function queueCloudSave(reason = 'manual') {
    if (!supabaseClient || !cloudUser) return;
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
        cloudUser = user;

        try {
            await ensureProfile();
            await loadCloudData();
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
    cloudUnlockState.bestWave = 1;
    cloudUnlockState.bestArenaLevel = 1;
    cloudUnlockState.keys = new Set(['character_1']);
    normalizeSelectedCharacter();
    setCloudStatus('Cloud: signed out');
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
}

function tickCloudAutosave() {
    if (!cloudUser || !supabaseClient) return;
    const now = Date.now();
    if (now - cloudLastAutosaveAt < CLOUD_AUTOSAVE_INTERVAL_MS) return;
    if (gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'win') return;
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
window.registerCloudRunOutcome = registerCloudRunOutcome;
window.resetCloudRunState = resetCloudRunState;
window.queueCloudSave = queueCloudSave;
window.tickCloudAutosave = tickCloudAutosave;
window.normalizeSelectedCharacter = normalizeSelectedCharacter;
