// Game state, loot logic, and shared helpers live in this file.




let fogEnabled     = false;
let keys           = {};
let camera         = { x: 0, y: 0 };
let mapTiles       = [];
let tumorTurrets   = [];
let frameCount     = 0;
let elapsedGameMs  = 0;
let gameState      = 'splash';
let gamePaused     = false;
let menuPage       = 'main';
let encyclopediaTab = 'enemies';
let encyclopediaRarityFilter = 'all';
let encyclopediaScroll = 0;
let selectedWeaponIndex = 0; // default: Assault Rifle
let selectedCursor = 0;
let selectedCharacter = 0;
let characterHoverAnim = CHARACTER_LOADOUTS.map(() => 0);
let mouseX         = 0;
let mouseY         = 0;
let mouseDown      = false;
let projectiles    = [];
let enemyProjectiles = [];
let enemies        = [];
let pickups        = [];
let muzzleFlashes  = [];
let damageNumbers  = [];
let levelDecorations = [];
let navGrid        = [];
let lastLevelDied  = 1;
let levelUpMenuHover = -1;
let levelUpInputDelay = 0;
let endlessMode = false;
let endlessWave = 0;       // counts up from 1 after normal content ends
let totemSpawnedThisLevel = false;
let xpBarFlash     = 0;
let lastTimestamp  = 0;
let accumulator    = 0;
let renderAlpha    = 1;
let fps            = 0;
let showPerfGuide  = false;
let showFpsCounter = true;
let splashFadeTimerMs = 0;
let devTestMode    = false;
let devCheatMenuEnabled = false;
let showCheatMenu = false;
let devCheatMenuTab = 'items';
let mapSize        = 1.0;
let mapOpacity     = 1.0;
let mapShape       = 'circle';
let devTestWaveLimit = WAVES_PER_LEVEL;
let currentArenaLevel = 1;
let currentWave = 1;
let enemiesRemainingInWave = 0;
let enemiesToSpawn = 0;
let waveClearTimer = 0;
let waveSpawnDelayFrames = 0;
let enemySpawnBudget = 0;
let currentMapThemeId = 1;
let currentMapTheme = MAP_THEME_SPRITES[1];
let audioUnlocked = false;
let musicVolume = 0.9;
let sfxVolume = 1;
let pendingMusicStart = false;
let currentMusicTrack = null;
let lastMusicTrackIndex = -1;
let laserShotPool = [];
let laserShotPoolIndex = 0;
let shotgunShotPool = [];
let shotgunShotPoolIndex = 0;
let smgShotPool = [];
let smgShotPoolIndex = 0;
let sniperShotPool = [];
let sniperShotPoolIndex = 0;
let sniperPingAudio = null;
let sniperPingAudioLayer = null;
let dashPool = [];
let dashPoolIndex = 0;
let ammoPickupPool = [];
let ammoPickupPoolIndex = 0;
let healPickupPool = [];
let healPickupPoolIndex = 0;
let instakillPickupPool = [];
let instakillPickupPoolIndex = 0;
let uiClickPool = [];
let uiClickPoolIndex = 0;
let expOrbPool = [];
let expOrbPoolIndex = 0;
let currentLevelUpChoices = [];
let railgunBeams = [];
let screenShake = 0;
let finalWaveBannerTimer = 0;
let chests = [];
let voidTotem = null;
let voidEncounter = {
    active: false,
    state: 'inactive',
    completedLevels: {},
    returnContext: null,
};
let necromancerTotem = null;
let necromancerEncounter = {
    active: false,
    state: 'inactive',
    completedLevels: {},
    returnContext: null,
};



let dashTrail  = [];
let trailTimer = 0;

const fogCanvas = document.createElement('canvas');
const fogCtx    = fogCanvas.getContext('2d');

let player = {
    x: MAP_W * TILE / 2,    y: MAP_H * TILE / 2,
    prevX: MAP_W * TILE / 2, prevY: MAP_H * TILE / 2,
    size: 20, speed: 4, color: 'blue',
    dashing: false, dashTime: 0,
    dashDirX: 0, dashDirY: 0,
    dashCooldown: 0, facing: 1,
    dashLockFrames: 0,
    dashCharges: 1, dashMaxCharges: 1,
    dashDistanceMult: 1,
    dashPhasesWalls: false,
    dashRechargeFrames: 120,
    shootCooldown: 0, weaponAngle: 0,
    hp: 100, maxHp: 100, invulnTimer: 0,
    ammo: AMMO_MAX, ammoRegenTimer: 0, ammoNoShootFrames: 0, infiniteAmmoTimer: 0,
    sniperReloadLocked: false,
    sniperReloadTimer: 0,
    sniperPingDelayTimer: -1,
    sniperAmmoPierceProgress: 0,
    healOverTimeTimer: 0,
    instakillTimer: 0,
    xpGainMult: 1,
    lifestealOnKill: 0,
    bulletDamage: 1,
    fireRateMult: 1,
    damageTakenMult: 1,
    xpAttractMult: 1,
    ammoRegenMult: 1,
    aoePulseDamage: 0,
    aoePulseRadius: 0,
    aoePulseIntervalFrames: 34,
    aoePulseTimer: 0,
    aoePulseFlash: 0,
    hasRailgunUlt: false,
    railgunUltCooldown: 0,
    railgunUltCooldownFrames: RAILGUN_ULT_COOLDOWN_FRAMES,
    railgunUltDamage: 22,
    upgradeLevels: {},
    itemLevels: {},
    inventory: [],
    lastLootText: '',
    lastLootTimer: 0,
    critChance: 0,
    critMult: 1.75,
    projectilePierce: 0,
    extraShots: 0,
    explosionRadius: 0,
    chainLightningChance: 0,
    chainLightningDamageMult: 0.6,
    executeBonusMult: 1,
    shieldMax: 0,
    shieldCharges: 0,
    shieldRegenCooldown: 180,
    shieldRegenTimer: 0,
    auraDamage: 0,
    auraRadius: 120,
    auraIntervalFrames: 60,
    auraTimer: 60,
    killHealFlat: 0,
    killAmmoFlat: 0,
    killShieldFlat: 0,
    reviveCharges: 0,
    xp: 0, xpToNextLevel: 100, level: 1,
};

// Calculates the current fire delay from the player stats.
function getPlayerShootCooldownFrames() {
    return Math.max(MIN_SHOOT_COOLDOWN, SHOOT_COOLDOWN / player.fireRateMult);
}

// Returns the current level of an upgrade.
function getUpgradeLevel(upgradeId) {
    return player.upgradeLevels?.[upgradeId] ?? 0;
}

// Looks up the rarity weight for upgrades.
function getUpgradeRarityWeight(rarity) {
    return UPGRADE_RARITY_WEIGHTS[rarity] ?? 0;
}

// Looks up the rarity weight for items.
function getItemRarityWeight(rarity) {
    return ITEM_RARITY_WEIGHTS[rarity] ?? 0;
}

// Converts sniper ammo-related bonuses into tiny pierce progress increments.
function grantSniperAmmoPierceBonus(progress = SNIPER_AMMO_PIERCE_PROGRESS_STEP) {
    if (player.weaponType !== 'sniper') return false;

    player.sniperAmmoPierceProgress = Math.max(0, (player.sniperAmmoPierceProgress ?? 0) + progress);
    while (player.sniperAmmoPierceProgress >= 1) {
        player.sniperAmmoPierceProgress -= 1;
        player.projectilePierce = Math.min(SNIPER_MAX_PROJECTILE_PIERCE, (player.projectilePierce ?? 0) + 1);
    }
    return true;
}

// Chooses a UI colour for the given rarity.
function getRarityUiColor(rarity) {
    if (rarity === 'mythical') return '#ff79c6';
    if (rarity === 'legendary') return '#ffcb66';
    if (rarity === 'epic') return '#d3a2ff';
    if (rarity === 'rare') return '#8ec7ff';
    if (rarity === 'uncommon') return '#7cffb0';
    return '#b6ffb6';
}

// Applies execute damage rules to a projectile hit.
function getCurrentProjectileDamage(baseDamage, target = null) {
    let damage = baseDamage;
    const healthRatio = target?.maxHp > 0 ? target.hp / target.maxHp : 1;
    if (healthRatio <= 0.4 && (player.executeBonusMult ?? 1) > 1) {
        damage *= player.executeBonusMult;
    }
    return damage;
}

// Finds the nearest living hostile unit.
function findNearestHostile(x, y, maxDistance = 260, exclude = null) {
    let best = null;
    let bestDist = maxDistance;

    for (const e of enemies) {
        if (!e.alive || e === exclude) continue;
        const dist = Math.hypot(e.x - x, e.y - y);
        if (dist < bestDist) {
            bestDist = dist;
            best = e;
        }
    }

    for (const t of tumorTurrets) {
        if (!t.alive || t === exclude) continue;
        const dist = Math.hypot(t.x - x, t.y - y);
        if (dist < bestDist) {
            bestDist = dist;
            best = t;
        }
    }

    return best;
}

// Applies damage and triggers any on-hit effects.
function applyEnemyDamage(target, damage, { sourceX, sourceY, sourceProjectile = null, allowTriggers = true } = {}) {
    if (!target || !target.alive) return false;

    target.hp -= damage;
    target.hitFlash = 8;
    target.hpBarTimer = 120;
    spawnDamageNumber(target.x, target.y - target.size * 0.8, damage);

    if (allowTriggers && sourceProjectile) {
        if (sourceProjectile.explosionRadius > 0) {
            triggerExplosionProc(sourceX ?? target.x, sourceY ?? target.y, sourceProjectile.explosionRadius, damage * 0.65, target);
        }

        if ((sourceProjectile.chainChance ?? 0) > 0 && Math.random() < sourceProjectile.chainChance) {
            triggerChainLightningProc(target, damage * (sourceProjectile.chainDamageMult ?? 0.6));
        }
    }

    if (target.hp <= 0) {
        target.hp = 0;
        handleEnemyDefeat(target);
        return true;
    }

    return false;
}

// Trigger Explosion Proc keeps the game logic moving.
function triggerExplosionProc(centerX, centerY, radius, damage, excludeTarget = null) {
    for (const e of enemies) {
        if (!e.alive || e === excludeTarget) continue;
        const dist = Math.hypot(e.x - centerX, e.y - centerY);
        if (dist > radius + e.size) continue;
        const splash = Math.max(1, Math.round(damage * (1 - Math.min(1, dist / Math.max(1, radius))) * 0.9));
        applyEnemyDamage(e, splash, { sourceX: centerX, sourceY: centerY, allowTriggers: false });
    }

    for (const t of tumorTurrets) {
        if (!t.alive || t === excludeTarget) continue;
        const dist = Math.hypot(t.x - centerX, t.y - centerY);
        if (dist > radius + t.size) continue;
        const splash = Math.max(1, Math.round(damage * (1 - Math.min(1, dist / Math.max(1, radius))) * 0.9));
        applyEnemyDamage(t, splash, { sourceX: centerX, sourceY: centerY, allowTriggers: false });
    }
}

// Trigger Chain Lightning Proc keeps the game logic moving.
function triggerChainLightningProc(origin, damage) {
    const arcTarget = findNearestHostile(origin.x, origin.y, 280, origin);
    if (!arcTarget) return;
    const arcDamage = Math.max(1, Math.round(damage * (player.chainLightningDamageMult ?? 0.6)));
    applyEnemyDamage(arcTarget, arcDamage, { sourceX: origin.x, sourceY: origin.y, allowTriggers: false });
}

// Get Item Level keeps the game logic moving.
function getItemLevel(itemId) {
    return player.itemLevels?.[itemId] ?? 0;
}

// Roll By Rarity keeps the game logic moving.
function rollByRarity(pool, weightFn) {
    if (!pool.length) return null;
    let totalWeight = 0;
    for (const entry of pool) totalWeight += Math.max(0, weightFn(entry.rarity));
    if (totalWeight <= 0) return pool[Math.floor(Math.random() * pool.length)] ?? null;

    let roll = Math.random() * totalWeight;
    for (const entry of pool) {
        roll -= Math.max(0, weightFn(entry.rarity));
        if (roll <= 0) return entry;
    }
    return pool[pool.length - 1] ?? null;
}

// Register Loot Gain keeps the game logic moving.
function registerLootGain(definition, source) {
    if (!definition) return false;

    const level = getItemLevel(definition.id);
    const maxStacks = definition.maxStacks ?? 1;
    if (level >= maxStacks) return false;

    definition.apply();
    player.itemLevels[definition.id] = level + 1;

    let entry = player.inventory.find(item => item.id === definition.id);
    if (!entry) {
        entry = {
            id: definition.id,
            title: definition.title,
            detail: definition.detail,
            rarity: definition.rarity,
            level: 0,
            source,
            unique: source === 'unique',
        };
        player.inventory.push(entry);
    }

    entry.level = player.itemLevels[definition.id];
    player.lastLootText = `${source === 'unique' ? 'UNIQUE' : 'ITEM'}: ${definition.title}`;
    player.lastLootTimer = 220;
    return true;
}

// Roll Random Stackable Loot keeps the game logic moving.
function rollRandomStackableLoot(pool, source, maxTries = 12) {
    for (let i = 0; i < maxTries; i++) {
        const definition = rollByRarity(pool, getItemRarityWeight);
        if (!definition) return false;
        if (registerLootGain(definition, source)) return true;
    }
    return false;
}

// Reward Boss Loot keeps the game logic moving.
function rewardBossLoot() {
    const gotUnique = rollRandomStackableLoot(UNIQUE_ITEM_DEFINITIONS, 'unique');
    if (Math.random() < 0.55) {
        rollRandomStackableLoot(ITEM_DEFINITIONS, 'item');
    }
    return gotUnique;
}

// Reward Chest Loot keeps the game logic moving.
function rewardChestLoot() {
    const rollUnique = Math.random() < 0.26;
    if (rollUnique && rollRandomStackableLoot(UNIQUE_ITEM_DEFINITIONS, 'unique')) return true;
    if (rollRandomStackableLoot(ITEM_DEFINITIONS, 'item')) return true;
    return rollRandomStackableLoot(UNIQUE_ITEM_DEFINITIONS, 'unique');
}

// Find Random Floor Position keeps the game logic moving.
function findRandomFloorPosition(minDistanceFromPlayer = TILE * 5, maxTries = 300) {
    for (let i = 0; i < maxTries; i++) {
        const tx = 3 + Math.floor(Math.random() * (MAP_W - 6));
        const ty = 3 + Math.floor(Math.random() * (MAP_H - 6));
        if (mapTiles[ty]?.[tx] !== TILE_FLOOR) continue;

        const x = tx * TILE + TILE * 0.5;
        const y = ty * TILE + TILE * 0.5;
        if (Math.hypot(x - player.x, y - player.y) < minDistanceFromPlayer) continue;
        if (wallCollision(x, y, CHEST_WORLD_SIZE)) continue;

        return { x, y };
    }

    return {
        x: player.x + TILE * 5,
        y: player.y + TILE * 3,
    };
}

// Spawn Arena Chest keeps the game logic moving.
function spawnArenaChest() {
    chests = [];
    const pos = findRandomFloorPosition(TILE * 7);
    chests.push({
        x: pos.x,
        y: pos.y,
        prevX: pos.x,
        prevY: pos.y,
        size: CHEST_WORLD_SIZE,
        opened: false,
    });
}

// Spawn Boss Enemy keeps the game logic moving.
function spawnBossEnemy() {
    const enemy = { alive: true };
    recycleEnemy(enemy, 'tank');
    enemy.isBoss = true;
    enemy.bossName = getBossName(currentArenaLevel + currentWave);
    enemy.maxHp = Math.round(enemy.maxHp * 9.5);
    enemy.hp = enemy.maxHp;
    enemy.size = 30;
    enemy.wallSize = 24;
    enemy.speed = Math.max(0.7, enemy.speed * 0.78);
    enemy.color = '#b84cff';
    enemy.hpBarTimer = 999999;
    enemies.push(enemy);
    enemiesRemainingInWave++;
}

// Roll Level Up Choices keeps the game logic moving.
function rollLevelUpChoices(count = 3) {
    const available = LEVEL_UPGRADES.slice();
    const picks = [];

    for (let i = 0; i < count && available.length > 0; i++) {

        let totalWeight = 0;
        for (const upgrade of available) totalWeight += getUpgradeRarityWeight(upgrade.rarity);
        if (totalWeight <= 0) break;

        let roll = Math.random() * totalWeight;
        let chosenIndex = 0;
        for (let j = 0; j < available.length; j++) {
            roll -= getUpgradeRarityWeight(available[j].rarity);
            if (roll <= 0) {
                chosenIndex = j;
                break;
            }
        }

        picks.push(available[chosenIndex]);
        available.splice(chosenIndex, 1);
    }

    if (picks.length < count) {
        for (const fallback of LEVEL_UPGRADES) {
            if (picks.length >= count) break;
            if (!picks.includes(fallback)) picks.push(fallback);
        }
    }

    return picks;
}

// Begin Level Up keeps the game logic moving.
function beginLevelUp() {
    currentLevelUpChoices = rollLevelUpChoices(3);
    gameState = 'levelUp';
    levelUpInputDelay = 120; // 2 seconds — prevents accidental clicks
}

// Apply Upgrade By Id keeps the game logic moving.
function applyUpgradeById(upgradeId) {
    const upgrade = LEVEL_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    upgrade.apply();
    player.upgradeLevels[upgrade.id] = getUpgradeLevel(upgrade.id) + 1;
    return true;
}

// Apply Upgrade Choice keeps the game logic moving.
function applyUpgradeChoice(choiceIndex) {
    const upgrade = currentLevelUpChoices[choiceIndex];
    if (!upgrade) return;

    applyUpgradeById(upgrade.id);
    currentLevelUpChoices = [];
    gameState = 'playing';
}

// Apply Player Damage keeps the game logic moving.
function applyPlayerDamage(baseDamage) {
    if ((player.shieldCharges ?? 0) > 0) {
        player.shieldCharges--;
        player.shieldRegenTimer = player.shieldRegenCooldown;
        screenShake = 12;
        return;
    }

    const scaledDamage = Math.max(1, Math.round(baseDamage * player.damageTakenMult));
    if ((player.reviveCharges ?? 0) > 0 && scaledDamage >= player.hp) {
        player.reviveCharges--;
        player.hp = Math.max(1, Math.round(player.maxHp * 0.45));
        player.invulnTimer = 120;
        player.shieldCharges = Math.min(player.shieldMax, player.shieldCharges + 1);
        screenShake = 24;
        return;
    }

    player.hp = Math.max(0, player.hp - scaledDamage);
    screenShake = 20;
}

// Clones plain data used in encounter save/restore.
function clonePlain(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
}

// Finds a boss totem spawn point near the arena center.
function pickBossTotemPosition(candidates, fallbackX, fallbackY) {
    for (const pos of candidates) {
        if (wallCollision(pos.x, pos.y, 20)) continue;
        return pos;
    }

    const fallback = findNearestFreePosition(fallbackX, fallbackY, 20, 50);
    return fallback ?? { x: fallbackX, y: fallbackY };
}

// Returns true when a level still needs its void totem fight.
function shouldSpawnVoidTotemForLevel(level = currentArenaLevel) {
    return !(voidEncounter.completedLevels?.[level]);
}

// Spawns one totem objective for the active level — 10% chance per wave, instant in dev mode.
function spawnVoidTotemForLevel(forceSpawn = false) {
    if (!shouldSpawnVoidTotemForLevel(currentArenaLevel) || voidEncounter.active) {
        voidTotem = null;
        return;
    }

    if (voidTotem && voidTotem.active) return; // already up

    const shouldSpawn = forceSpawn || devTestMode || (Math.random() < 0.10);
    if (!shouldSpawn) return;

    const cx = Math.floor(MAP_W / 2) * TILE;
    const cy = Math.floor(MAP_H / 2) * TILE;
    const candidates = [
        { x: cx + TILE * 16, y: cy - TILE * 10 },
        { x: cx - TILE * 17, y: cy + TILE * 9 },
        { x: cx + TILE * 18, y: cy + TILE * 11 },
        { x: cx - TILE * 15, y: cy - TILE * 12 },
    ];
    const chosen = pickBossTotemPosition(candidates, cx + TILE * 14, cy + TILE * 10);

    voidTotem = {
        x: chosen.x,
        y: chosen.y,
        prevX: chosen.x,
        prevY: chosen.y,
        size: 22,
        level: currentArenaLevel,
        active: true,
    };
}

// Returns true when a level still needs its necromancer totem fight.
function shouldSpawnNecromancerTotemForLevel(level = currentArenaLevel) {
    return !(necromancerEncounter.completedLevels?.[level]);
}

// Spawns the necromancer objective for the active level — 10% chance per wave, instant in dev mode.
function spawnNecromancerTotemForLevel(forceSpawn = false) {
    if (!shouldSpawnNecromancerTotemForLevel(currentArenaLevel) || necromancerEncounter.active) {
        necromancerTotem = null;
        return;
    }

    if (necromancerTotem && necromancerTotem.active) return; // already up

    const shouldSpawn = forceSpawn || devTestMode || (Math.random() < 0.10);
    if (!shouldSpawn) return;

    const cx = Math.floor(MAP_W / 2) * TILE;
    const cy = Math.floor(MAP_H / 2) * TILE;
    const candidates = [
        { x: cx + TILE * 14, y: cy + TILE * 12 },
        { x: cx - TILE * 16, y: cy - TILE * 11 },
        { x: cx + TILE * 17, y: cy - TILE * 9 },
        { x: cx - TILE * 13, y: cy + TILE * 13 },
    ];
    const chosen = pickBossTotemPosition(candidates, cx - TILE * 14, cy - TILE * 10);

    necromancerTotem = {
        x: chosen.x,
        y: chosen.y,
        prevX: chosen.x,
        prevY: chosen.y,
        size: 22,
        level: currentArenaLevel,
        active: true,
    };
}

// Returns true if the totem can currently be activated.
function hasActiveVoidTotem() {
    return !!voidTotem && voidTotem.active && !voidEncounter.active;
}

// Returns true if the necromancer totem can currently be activated.
function hasActiveNecromancerTotem() {
    return !!necromancerTotem && necromancerTotem.active && !necromancerEncounter.active;
}

// Attempts to trigger the encounter when the player presses E.
function tryActivateVoidTotem() {
    if (gameState !== 'playing' || gamePaused) return false;
    if (hasActiveVoidTotem()) {
        const dist = Math.hypot(player.x - voidTotem.x, player.y - voidTotem.y);
        if (dist <= player.size + VOID_BOSS_TRIGGER_RADIUS) {
            beginVoidEncounter();
            return true;
        }
    }
    if (hasActiveNecromancerTotem()) {
        const dist = Math.hypot(player.x - necromancerTotem.x, player.y - necromancerTotem.y);
        if (dist <= player.size + VOID_BOSS_TRIGGER_RADIUS) {
            beginNecromancerEncounter();
            return true;
        }
    }
    return false;
}

// Returns true when the run is currently in the isolated void encounter.
function isVoidEncounterActive() {
    return !!voidEncounter.active;
}

// Returns true when the run is currently in any isolated boss encounter.
function isAnyBossEncounterActive() {
    return !!voidEncounter.active || !!necromancerEncounter.active;
}

// Starts the teleport flow into the void boss arena.
function beginVoidEncounter() {
    if (voidEncounter.active) return;

    voidEncounter.active = true;
    voidEncounter.state = 'transition_in';
    gamePaused = true;

    voidEncounter.returnContext = {
        playerX: player.x,
        playerY: player.y,
        mapTiles: clonePlain(mapTiles),
        navGrid: clonePlain(navGrid),
        levelDecorations: clonePlain(levelDecorations),
        currentMapThemeId,
        currentMapTheme,
        currentArenaLevel,
        currentWave,
        enemiesRemainingInWave,
        enemiesToSpawn,
        waveClearTimer,
        waveSpawnDelayFrames,
        enemySpawnBudget,
        enemies: clonePlain(enemies),
        pickups: clonePlain(pickups),
        projectiles: clonePlain(projectiles),
        enemyProjectiles: clonePlain(enemyProjectiles),
        tumorTurrets: clonePlain(tumorTurrets),
        chests: clonePlain(chests),
        voidTotem: clonePlain(voidTotem),
        necromancerTotem: clonePlain(necromancerTotem),
    };

    enemies = [];
    pickups = [];
    projectiles = [];
    enemyProjectiles = [];
    tumorTurrets = [];
    chests = [];
    voidTotem = null;
    necromancerTotem = null;

    currentMapThemeId = 'special';
    currentMapTheme = MAP_THEME_SPRITES.special ?? MAP_THEME_SPRITES[1];
    generateVoidBossRoom();

    player.x = (MAP_W * TILE) * 0.5;
    player.y = (MAP_H * TILE) * 0.5 + TILE * 9;
    player.prevX = player.x;
    player.prevY = player.y;

    spawnVoidBossEnemy();

    voidEncounter.state = 'boss_fight';
    gamePaused = false;
}

// Spawns the void sniper boss entity for the encounter.
function spawnVoidBossEnemy() {
    const enemy = { alive: true };
    recycleEnemy(enemy, 'void_sniper');
    const level = Math.max(1, Math.min(MAX_ARENA_LEVELS, currentArenaLevel));
    const hpScale = [0, 1.22, 1.5, 1.85, 2.28, 2.85][level] ?? 1.22;
    const speedScale = [0, 1.08, 1.16, 1.24, 1.34, 1.46][level] ?? 1.08;
    enemy.x = (MAP_W * TILE) * 0.5;
    enemy.y = (MAP_H * TILE) * 0.5 - TILE * 9;
    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.hp = Math.round((enemy.hp ?? ENEMY_TYPES.void_sniper.hp) * hpScale);
    enemy.maxHp = enemy.hp;
    enemy.speed = (enemy.speed ?? ENEMY_TYPES.void_sniper.speed) * speedScale;
    enemy.size = ENEMY_TYPES.void_sniper.size;
    enemy.wallSize = enemy.size * 0.8;
    enemy.isBoss = true;
    enemy.isVoidBoss = true;
    enemy.isVoidEncounterEnemy = true;
    enemy.isBossEncounterEnemy = true;
    enemy.bossName = 'Void Sniper';
    enemy.voidAttackTimer = 0;
    enemy.voidBurstCooldown = 78;
    enemy.voidSpikeCooldown = 62;
    enemy.voidWaveCooldown = 110;
    enemy.voidSkullCooldown = 84;
    enemy.voidDashCooldown = 95;
    enemies.push(enemy);
}

// Grants the configured void boss XP reward for the current level.
function grantVoidBossXpReward() {
    const reward = VOID_BOSS_XP_REWARDS[currentArenaLevel] ?? VOID_BOSS_XP_REWARDS[1];
    player.xp += reward * player.xpGainMult;
    xpBarFlash = 18;
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        beginLevelUp();
    }
}

// Completes the void encounter and restores the previous arena state.
function completeVoidEncounterVictory() {
    if (!voidEncounter.active || !voidEncounter.returnContext) return;

    voidEncounter.state = 'transition_out';
    gamePaused = true;

    grantVoidBossXpReward();
    voidEncounter.completedLevels[currentArenaLevel] = true;

    const ctxSaved = voidEncounter.returnContext;
    mapTiles = ctxSaved.mapTiles ?? [];
    navGrid = ctxSaved.navGrid ?? [];
    levelDecorations = ctxSaved.levelDecorations ?? [];
    currentMapThemeId = ctxSaved.currentMapThemeId;
    currentMapTheme = ctxSaved.currentMapTheme;
    currentWave = ctxSaved.currentWave;
    enemiesRemainingInWave = ctxSaved.enemiesRemainingInWave;
    enemiesToSpawn = ctxSaved.enemiesToSpawn;
    waveClearTimer = ctxSaved.waveClearTimer;
    waveSpawnDelayFrames = ctxSaved.waveSpawnDelayFrames;
    enemySpawnBudget = ctxSaved.enemySpawnBudget;
    enemies = ctxSaved.enemies ?? [];
    pickups = ctxSaved.pickups ?? [];
    projectiles = ctxSaved.projectiles ?? [];
    enemyProjectiles = ctxSaved.enemyProjectiles ?? [];
    tumorTurrets = ctxSaved.tumorTurrets ?? [];
    chests = ctxSaved.chests ?? [];
    voidTotem = ctxSaved.voidTotem ?? null;
    necromancerTotem = ctxSaved.necromancerTotem ?? null;

    player.x = ctxSaved.playerX;
    player.y = ctxSaved.playerY;
    player.prevX = player.x;
    player.prevY = player.y;

    voidEncounter.returnContext = null;
    voidEncounter.active = false;
    voidEncounter.state = 'inactive';
    voidTotem = null;
    gamePaused = false;
}

// Starts the teleport flow into the necromancer boss arena.
function beginNecromancerEncounter() {
    if (necromancerEncounter.active) return;

    necromancerEncounter.active = true;
    necromancerEncounter.state = 'transition_in';
    gamePaused = true;

    necromancerEncounter.returnContext = {
        playerX: player.x,
        playerY: player.y,
        mapTiles: clonePlain(mapTiles),
        navGrid: clonePlain(navGrid),
        levelDecorations: clonePlain(levelDecorations),
        currentMapThemeId,
        currentMapTheme,
        currentArenaLevel,
        currentWave,
        enemiesRemainingInWave,
        enemiesToSpawn,
        waveClearTimer,
        waveSpawnDelayFrames,
        enemySpawnBudget,
        enemies: clonePlain(enemies),
        pickups: clonePlain(pickups),
        projectiles: clonePlain(projectiles),
        enemyProjectiles: clonePlain(enemyProjectiles),
        tumorTurrets: clonePlain(tumorTurrets),
        chests: clonePlain(chests),
        voidTotem: clonePlain(voidTotem),
        necromancerTotem: clonePlain(necromancerTotem),
    };

    enemies = [];
    pickups = [];
    projectiles = [];
    enemyProjectiles = [];
    tumorTurrets = [];
    chests = [];
    voidTotem = null;
    necromancerTotem = null;

    currentMapThemeId = 'necromancer';
    currentMapTheme = MAP_THEME_SPRITES.necromancer ?? MAP_THEME_SPRITES.special ?? MAP_THEME_SPRITES[1];
    generateNecromancerBossRoom();

    player.x = (MAP_W * TILE) * 0.5;
    player.y = (MAP_H * TILE) * 0.5 + TILE * 9;
    player.prevX = player.x;
    player.prevY = player.y;

    spawnNecromancerBossEnemy();

    necromancerEncounter.state = 'boss_fight';
    gamePaused = false;
}

// Spawns the necromancer boss entity for the encounter.
function spawnNecromancerBossEnemy() {
    const enemy = { alive: true };
    recycleEnemy(enemy, 'necromancer');
    const level = Math.max(1, Math.min(MAX_ARENA_LEVELS, currentArenaLevel));
    const hpScale = [0, 1.16, 1.42, 1.76, 2.12, 2.56][level] ?? 1.16;
    const speedScale = [0, 1.02, 1.08, 1.16, 1.24, 1.32][level] ?? 1.02;
    enemy.x = (MAP_W * TILE) * 0.5;
    enemy.y = (MAP_H * TILE) * 0.5 - TILE * 8;
    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.hp = Math.round((enemy.hp ?? ENEMY_TYPES.necromancer.hp) * hpScale);
    enemy.maxHp = enemy.hp;
    enemy.speed = (enemy.speed ?? ENEMY_TYPES.necromancer.speed) * speedScale;
    enemy.size = ENEMY_TYPES.necromancer.size;
    enemy.wallSize = enemy.size * 0.84;
    enemy.isBoss = true;
    enemy.isNecromancerBoss = true;
    enemy.isBossEncounterEnemy = true;
    enemy.bossName = 'Necromancer';
    enemy.necromancerSummonTimer = 0;
    enemy.necromancerSummonCooldown = 130;
    enemy.necromancerVolleyCooldown = 74;
    enemy.necromancerOrbCooldown = 116;
    enemy.necromancerRiftCooldown = 88;
    enemy.necromancerMoveAngle = Math.random() * Math.PI * 2;
    enemy.necromancerMoveTimer = 0;
    enemies.push(enemy);
}

// Grants the configured necromancer boss XP reward for the current level.
function grantNecromancerBossXpReward() {
    const reward = NECROMANCER_BOSS_XP_REWARDS[currentArenaLevel] ?? NECROMANCER_BOSS_XP_REWARDS[1];
    player.xp += reward * player.xpGainMult;
    xpBarFlash = 18;
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        beginLevelUp();
    }
}

// Completes the necromancer encounter and restores the previous arena state.
function completeNecromancerEncounterVictory() {
    if (!necromancerEncounter.active || !necromancerEncounter.returnContext) return;

    necromancerEncounter.state = 'transition_out';
    gamePaused = true;

    grantNecromancerBossXpReward();
    necromancerEncounter.completedLevels[currentArenaLevel] = true;

    const ctxSaved = necromancerEncounter.returnContext;
    mapTiles = ctxSaved.mapTiles ?? [];
    navGrid = ctxSaved.navGrid ?? [];
    levelDecorations = ctxSaved.levelDecorations ?? [];
    currentMapThemeId = ctxSaved.currentMapThemeId;
    currentMapTheme = ctxSaved.currentMapTheme;
    currentWave = ctxSaved.currentWave;
    enemiesRemainingInWave = ctxSaved.enemiesRemainingInWave;
    enemiesToSpawn = ctxSaved.enemiesToSpawn;
    waveClearTimer = ctxSaved.waveClearTimer;
    waveSpawnDelayFrames = ctxSaved.waveSpawnDelayFrames;
    enemySpawnBudget = ctxSaved.enemySpawnBudget;
    enemies = ctxSaved.enemies ?? [];
    pickups = ctxSaved.pickups ?? [];
    projectiles = ctxSaved.projectiles ?? [];
    enemyProjectiles = ctxSaved.enemyProjectiles ?? [];
    tumorTurrets = ctxSaved.tumorTurrets ?? [];
    chests = ctxSaved.chests ?? [];
    voidTotem = ctxSaved.voidTotem ?? null;
    necromancerTotem = ctxSaved.necromancerTotem ?? null;

    player.x = ctxSaved.playerX;
    player.y = ctxSaved.playerY;
    player.prevX = player.x;
    player.prevY = player.y;

    necromancerEncounter.returnContext = null;
    necromancerEncounter.active = false;
    necromancerEncounter.state = 'inactive';
    necromancerTotem = null;
    gamePaused = false;
}

// Get Player Xp Attract Radius keeps the game logic moving.
function getPlayerXpAttractRadius() {
    return XP_ATTRACT_RADIUS * player.xpAttractMult;
}

// Get Dev Cheat Menu Entries keeps the game logic moving.
function getDevCheatMenuEntries(tab) {
    if (tab === 'upgrades') {
        return LEVEL_UPGRADES.map(upgrade => ({
            id: upgrade.id,
            title: upgrade.title,
            detail: upgrade.detail,
            rarity: upgrade.rarity,
            level: getUpgradeLevel(upgrade.id),
            maxStacks: upgrade.maxStacks ?? 1,
            kind: 'upgrade',
            apply: () => applyUpgradeById(upgrade.id),
        }));
    }

    const items = ITEM_DEFINITIONS.map(def => ({
        id: def.id,
        title: def.title,
        detail: def.detail,
        rarity: def.rarity,
        level: getItemLevel(def.id),
        maxStacks: def.maxStacks ?? 1,
        kind: 'item',
        apply: () => registerLootGain(def, 'item'),
    }));

    const uniques = UNIQUE_ITEM_DEFINITIONS.map(def => ({
        id: def.id,
        title: def.title,
        detail: def.detail,
        rarity: def.rarity,
        level: getItemLevel(def.id),
        maxStacks: def.maxStacks ?? 1,
        kind: 'unique',
        apply: () => registerLootGain(def, 'unique'),
    }));

    return [...items, ...uniques].sort((a, b) => a.title.localeCompare(b.title));
}

// Get Cheat Menu Zones keeps the game logic moving.
function getCheatMenuZones() {
    const entries = getDevCheatMenuEntries(devCheatMenuTab);
    const panelW = 640;
    const tabH = 24;
    const cellH = 26;
    const cellGap = 6;
    const cols = 2;
    const rowCount = Math.ceil(entries.length / cols);
    const panelH = Math.min(canvas.height - 110, 74 + tabH + rowCount * cellH + Math.max(0, rowCount - 1) * cellGap + 18);
    const panelX = canvas.width / 2 - panelW / 2;
    const panelY = 106;
    const close = { x: panelX + panelW - 34, y: panelY + 8, w: 24, h: 20 };
    const tabs = {
        items: { x: panelX + 10, y: panelY + 36, w: 110, h: tabH },
        upgrades: { x: panelX + 126, y: panelY + 36, w: 110, h: tabH },
    };

    const entriesZones = entries.map((entry, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellW = Math.floor((panelW - 24 - cellGap) / cols);
        const x = panelX + 10 + col * (cellW + cellGap);
        const y = panelY + 70 + row * (cellH + cellGap);
        return { x, y, w: cellW, h: cellH, entry };
    });

    return {
        panel: { x: panelX, y: panelY, w: panelW, h: panelH },
        close,
        tabs,
        entries: entriesZones,
    };
}

// Handle Enemy Defeat keeps the game logic moving.
function handleEnemyDefeat(e) {
    if (!e.alive) return;

    e.alive = false;
    if (typeof registerAchievementEnemyKill === 'function') {
        registerAchievementEnemyKill(1);
    }
    if (!e.isVoidEncounterEnemy) {
        enemiesRemainingInWave = Math.max(0, enemiesRemainingInWave - 1);
    }

    if (e.isBossEncounterEnemy) {
        if (e.isVoidBoss) {
            if (typeof registerAchievementBossKill === 'function') {
                registerAchievementBossKill('void');
            }
            completeVoidEncounterVictory();
        } else if (e.isNecromancerBoss) {
            if (typeof registerAchievementBossKill === 'function') {
                registerAchievementBossKill('necromancer');
            }
            completeNecromancerEncounterVictory();
        }
        return;
    }

    if (e.isVoidBoss) {
        if (typeof registerAchievementBossKill === 'function') {
            registerAchievementBossKill('void');
        }
        completeVoidEncounterVictory();
        return;
    }

    if (e.isNecromancerBoss) {
        if (typeof registerAchievementBossKill === 'function') {
            registerAchievementBossKill('necromancer');
        }
        completeNecromancerEncounterVictory();
        return;
    }

    if (e.isBoss) {
        rewardBossLoot();
    }

    if (player.lifestealOnKill > 0 && player.hp > 0) {
        const heal = Math.max(1, Math.round(player.maxHp * player.lifestealOnKill));
        player.hp = Math.min(player.maxHp, player.hp + heal);
    }

    if ((player.killHealFlat ?? 0) > 0 && player.hp > 0) {
        player.hp = Math.min(player.maxHp, player.hp + player.killHealFlat);
    }

    if ((player.killAmmoFlat ?? 0) > 0) {
        if (!grantSniperAmmoPierceBonus(player.killAmmoFlat * SNIPER_AMMO_PIERCE_PROGRESS_STEP)) {
            player.ammo = Math.min(AMMO_MAX, player.ammo + player.killAmmoFlat);
        }
    }

    if ((player.killShieldFlat ?? 0) > 0 && (player.shieldMax ?? 0) > 0) {
        player.shieldCharges = Math.min(player.shieldMax, player.shieldCharges + player.killShieldFlat);
    }

    if (e.noXpDrop) {
        return;
    }

    const ammoDropChance = AMMO_DROP_CHANCE;
    const variant = e.type === 'tank' ? 'blue' : 'green';
    pickups.push({
        x: e.x, y: e.y, prevX: e.x, prevY: e.y,
        vx: 0, vy: 0,
        size: variant === 'blue' ? 15 : 10,
        type: 'xp', variant,
        value: XP_PICKUP_BASE_VALUE * (variant === 'blue' ? TANK_XP_MULTIPLIER : 1),
    });


    const canSpawnAmmoPickup = !hasActiveAmmoPickup() && player.infiniteAmmoTimer <= 0;
    if (canSpawnAmmoPickup && Math.random() < ammoDropChance) {
        const ammoValue = AMMO_PICKUP_VALUE_MIN + Math.floor(Math.random() * (AMMO_PICKUP_VALUE_MAX - AMMO_PICKUP_VALUE_MIN + 1));
        pickups.push({
            x: e.x, y: e.y, prevX: e.x, prevY: e.y,
            vx: 0, vy: 0,
            size: AMMO_PICKUP_WORLD_SIZE,
            type: 'ammo',
            value: ammoValue,
        });
    }

    const canSpawnHealPickup = !hasActiveHealPickup() && player.healOverTimeTimer <= 0;
    if (canSpawnHealPickup && Math.random() < HEAL_DROP_CHANCE) {
        pickups.push({
            x: e.x, y: e.y, prevX: e.x, prevY: e.y,
            vx: 0, vy: 0,
            size: HEAL_PICKUP_WORLD_SIZE,
            type: 'heal',
        });
    }

    const canSpawnInstakillPickup = !hasActiveInstakillPickup() && player.instakillTimer <= 0;
    if (canSpawnInstakillPickup && Math.random() < INSTAKILL_DROP_CHANCE) {
        pickups.push({
            x: e.x, y: e.y, prevX: e.x, prevY: e.y,
            vx: 0, vy: 0,
            size: INSTAKILL_PICKUP_WORLD_SIZE,
            type: 'instakill',
        });
    }
}

// Trigger Chrono Pulse keeps the game logic moving.
function triggerChronoPulse() {
    if (player.aoePulseDamage <= 0 || player.aoePulseRadius <= 0) return;


    if (player.aoePulseTimer > 0) {
        player.aoePulseTimer--;
        return;
    }

    player.aoePulseTimer = player.aoePulseIntervalFrames;
    player.aoePulseFlash = 8;

    for (const t of tumorTurrets) {
        if (!t.alive) continue;
        if (Math.hypot(t.x - player.x, t.y - player.y) <= player.aoePulseRadius + t.size) {
            t.hp -= player.aoePulseDamage;
            t.hitFlash = 8;
            t.hpBarTimer = 120;
            if (t.hp <= 0) t.alive = false;
        }
    }

    for (const e of enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - player.x, e.y - player.y) <= player.aoePulseRadius + e.size) {
            e.hp -= player.aoePulseDamage;
            e.hitFlash = 8;
            e.hpBarTimer = 120;
            if (e.hp <= 0) handleEnemyDefeat(e);
        }
    }
}

// Activate Railgun Ult keeps the game logic moving.
function activateRailgunUlt() {
    if (!player.hasRailgunUlt || player.railgunUltCooldown > 0 || player.hp <= 0) return false;


    const angle = player.weaponAngle;
    const sx = player.x + Math.cos(angle) * (RAIL_RADIUS + 10);
    const sy = player.y + Math.sin(angle) * (RAIL_RADIUS + 10);
    const ex = sx + Math.cos(angle) * RAILGUN_ULT_RANGE;
    const ey = sy + Math.sin(angle) * RAILGUN_ULT_RANGE;

    for (const t of tumorTurrets) {
        if (!t.alive) continue;
        if (segmentCircleHit(sx, sy, ex, ey, t.x, t.y, t.size + 10)) {
            t.hp -= player.railgunUltDamage;
            t.hitFlash = 10;
            t.hpBarTimer = 120;
            if (t.hp <= 0) t.alive = false;
        }
    }

    for (const e of enemies) {
        if (!e.alive) continue;
        if (segmentCircleHit(sx, sy, ex, ey, e.x, e.y, e.size + 8)) {
            e.hp -= player.railgunUltDamage;
            e.hitFlash = 10;
            e.hpBarTimer = 120;
            if (e.hp <= 0) handleEnemyDefeat(e);
        }
    }

    railgunBeams.push({ x1: sx, y1: sy, x2: ex, y2: ey, life: RAILGUN_BEAM_LIFE_FRAMES, maxLife: RAILGUN_BEAM_LIFE_FRAMES });
    player.railgunUltCooldown = player.railgunUltCooldownFrames;
    playLaserShot();
    return true;
}

// Update Railgun Beams keeps the game logic moving.
function updateRailgunBeams() {
    for (let i = railgunBeams.length - 1; i >= 0; i--) {
        railgunBeams[i].life--;
        if (railgunBeams[i].life <= 0) railgunBeams.splice(i, 1);
    }
}

let playerAnim = {
    frame:      'idle',
    timer:      0,
    walkToggle: false,
    idleTimer:  0,
    dashFrame:  'dash_h',
    dashFlipX:  false,
};

// Start Splash Transition keeps the game logic moving.
function startSplashTransition() {
    if (gameState !== 'splash') return;
    gameState = 'splashTransition';
    splashFadeTimerMs = 0;
}

// Clamp01 keeps the game logic moving.
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

// Read Stored Volume keeps the game logic moving.
function readStoredVolume(storageKey, fallback) {
    try {
        const raw = localStorage.getItem(storageKey);
        if (raw == null) return fallback;
        const parsed = Number(raw);

        if (!Number.isFinite(parsed)) return fallback;
        return clamp01(parsed);
    } catch (_) {
        return fallback;
    }
}

// Save Volume keeps the game logic moving.
function saveVolume(storageKey, value) {
    try {
        localStorage.setItem(storageKey, String(clamp01(value)));
    } catch (_) {

    }
}

// Style Audio Controls keeps the game logic moving.
function styleAudioControls() {
    audioControlPanel.style.position = 'fixed';
    audioControlPanel.style.right = '16px';
    audioControlPanel.style.bottom = '250px';
    audioControlPanel.style.zIndex = '25';
    audioControlPanel.style.display = 'none';
    audioControlPanel.style.flexDirection = 'column';
    audioControlPanel.style.gap = '6px';
    audioControlPanel.style.width = '220px';
    audioControlPanel.style.padding = '10px 12px';
    audioControlPanel.style.border = '1px solid #ffffff';
    audioControlPanel.style.background = 'rgba(0,0,0,0.78)';
    audioControlPanel.style.color = '#ffffff';
    audioControlPanel.style.font = '12px Arial, sans-serif';
    audioControlPanel.style.pointerEvents = 'auto';

    const sliders = [musicVolumeSlider, sfxVolumeSlider];
    for (const slider of sliders) {
        slider.style.width = '100%';
        slider.style.cursor = 'pointer';
    }
}

// Create Audio With Fallback keeps the game logic moving.
function createAudioWithFallback(sources, { loop = false } = {}) {
    const audio = new Audio();
    let srcIndex = 0;


    const tryNextSource = () => {
        if (srcIndex >= sources.length) return;
        audio.src = sources[srcIndex++];
    };

    audio.loop = loop;
    audio.preload = 'auto';
    audio.addEventListener('error', tryNextSource);
    tryNextSource();
    return audio;
}

// Update Audio Label Text keeps the game logic moving.
function updateAudioLabelText() {
    musicVolumeLabel.textContent = `Music Volume: ${Math.round(musicVolume * 100)}%`;
    sfxVolumeLabel.textContent = `Game Audio Volume: ${Math.round(sfxVolume * 100)}%`;
}

// Apply Music Volume keeps the game logic moving.
function applyMusicVolume() {
    if (currentMusicTrack) currentMusicTrack.volume = musicVolume;
}

// Scaled Sfx Volume keeps the game logic moving.
function scaledSfxVolume(multiplier = 1) {
    return clamp01(sfxVolume * multiplier);
}

// Apply Sfx Volume keeps the game logic moving.
function applySfxVolume() {
    for (const channel of laserShotPool) channel.volume = scaledSfxVolume(LASER_VOLUME_MULT);
    for (const channel of shotgunShotPool) channel.volume = scaledSfxVolume(SHOTGUN_VOLUME_MULT);
    for (const channel of smgShotPool) channel.volume = scaledSfxVolume(SMG_VOLUME_MULT);
    for (const channel of sniperShotPool) channel.volume = scaledSfxVolume(SNIPER_VOLUME_MULT);
    if (sniperPingAudio) sniperPingAudio.volume = scaledSfxVolume(SNIPER_PING_VOLUME_MULT);
    if (sniperPingAudioLayer) sniperPingAudioLayer.volume = scaledSfxVolume(SNIPER_PING_VOLUME_MULT);
    for (const channel of dashPool) channel.volume = sfxVolume;
    for (const channel of ammoPickupPool) channel.volume = scaledSfxVolume(AMMO_PICKUP_VOLUME_MULT);
    for (const channel of healPickupPool) channel.volume = scaledSfxVolume(HEAL_PICKUP_VOLUME_MULT);
    for (const channel of instakillPickupPool) channel.volume = scaledSfxVolume(INSTAKILL_PICKUP_VOLUME_MULT);
    for (const channel of uiClickPool) channel.volume = sfxVolume;
    for (const channel of expOrbPool) channel.volume = sfxVolume;
}

// Set Music Volume keeps the game logic moving.
function setMusicVolume(value, { persist = true } = {}) {
    musicVolume = clamp01(value);
    musicVolumeSlider.value = String(Math.round(musicVolume * 100));
    applyMusicVolume();
    if (persist) saveVolume(AUDIO_STORAGE_KEYS.music, musicVolume);
    updateAudioLabelText();
}

// Set Sfx Volume keeps the game logic moving.
function setSfxVolume(value, { persist = true } = {}) {
    sfxVolume = clamp01(value);
    sfxVolumeSlider.value = String(Math.round(sfxVolume * 100));
    applySfxVolume();
    if (persist) saveVolume(AUDIO_STORAGE_KEYS.sfx, sfxVolume);
    updateAudioLabelText();
}

// Pick Random Music Track Index keeps the game logic moving.
function pickRandomMusicTrackIndex() {
    if (!MUSIC_TRACK_PATHS.length) return -1;
    if (MUSIC_TRACK_PATHS.length === 1) return 0;

    let idx = Math.floor(Math.random() * MUSIC_TRACK_PATHS.length);
    if (idx === lastMusicTrackIndex) idx = (idx + 1 + Math.floor(Math.random() * (MUSIC_TRACK_PATHS.length - 1))) % MUSIC_TRACK_PATHS.length;
    return idx;
}

// Stop Current Music keeps the game logic moving.
function stopCurrentMusic() {
    if (!currentMusicTrack) return;
    currentMusicTrack.pause();
    currentMusicTrack.currentTime = 0;
}

// Play Current Music Track keeps the game logic moving.
function playCurrentMusicTrack() {
    if (!currentMusicTrack) return;
    currentMusicTrack.currentTime = 0;
    currentMusicTrack.play().catch(() => {
        pendingMusicStart = true;
    });
}

// Play Random Music Track keeps the game logic moving.
function playRandomMusicTrack() {
    const idx = pickRandomMusicTrackIndex();
    if (idx < 0) return;


    stopCurrentMusic();

    const nextTrack = createAudioWithFallback([MUSIC_TRACK_PATHS[idx]], { loop: false });
    nextTrack.volume = musicVolume;
    nextTrack.addEventListener('ended', playRandomMusicTrack);

    currentMusicTrack = nextTrack;
    lastMusicTrackIndex = idx;

    if (audioUnlocked) {
        playCurrentMusicTrack();
    } else {
        pendingMusicStart = true;
    }
}

// Initialize Laser Shot Pool keeps the game logic moving.
function initializeLaserShotPool() {
    laserShotPool = [];
    for (let i = 0; i < LASER_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(LASER_SHOT_PATHS);
        channel.volume = scaledSfxVolume(LASER_VOLUME_MULT);
        laserShotPool.push(channel);
    }
    laserShotPoolIndex = 0;
}

// Initialize Shotgun Shot Pool keeps the game logic moving.
function initializeShotgunShotPool() {
    shotgunShotPool = [];
    for (let i = 0; i < SHOTGUN_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(SHOTGUN_SHOT_PATHS);
        channel.volume = scaledSfxVolume(SHOTGUN_VOLUME_MULT);
        shotgunShotPool.push(channel);
    }
    shotgunShotPoolIndex = 0;
}

// Initialize Smg Shot Pool keeps the game logic moving.
function initializeSmgShotPool() {
    smgShotPool = [];
    for (let i = 0; i < SMG_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(SMG_SHOT_PATHS);
        channel.volume = scaledSfxVolume(SMG_VOLUME_MULT);
        smgShotPool.push(channel);
    }
    smgShotPoolIndex = 0;
}

// Initialize Sniper Shot Pool keeps the game logic moving.
function initializeSniperShotPool() {
    sniperShotPool = [];
    for (let i = 0; i < SNIPER_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(SNIPER_SHOT_PATHS);
        channel.volume = scaledSfxVolume(SNIPER_VOLUME_MULT);
        sniperShotPool.push(channel);
    }
    sniperShotPoolIndex = 0;
}

// Initialize Sniper Ping Audio keeps the game logic moving.
function initializeSniperPingAudio() {
    sniperPingAudio = createAudioWithFallback(SNIPER_PING_PATHS);
    sniperPingAudio.volume = scaledSfxVolume(SNIPER_PING_VOLUME_MULT);
    sniperPingAudioLayer = createAudioWithFallback(SNIPER_PING_PATHS);
    sniperPingAudioLayer.volume = scaledSfxVolume(SNIPER_PING_VOLUME_MULT);
}

// Initialize Dash Pool keeps the game logic moving.
function initializeDashPool() {
    dashPool = [];
    for (let i = 0; i < DASH_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(DASH_PATHS);
        channel.volume = sfxVolume;
        dashPool.push(channel);
    }
    dashPoolIndex = 0;
}

// Initialize Ammo Pickup Pool keeps the game logic moving.
function initializeAmmoPickupPool() {
    ammoPickupPool = [];
    for (let i = 0; i < AMMO_PICKUP_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(AMMO_PICKUP_PATHS);
        channel.volume = scaledSfxVolume(AMMO_PICKUP_VOLUME_MULT);
        ammoPickupPool.push(channel);
    }
    ammoPickupPoolIndex = 0;
}

// Initialize Heal Pickup Pool keeps the game logic moving.
function initializeHealPickupPool() {
    healPickupPool = [];
    for (let i = 0; i < HEAL_PICKUP_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(HEAL_PICKUP_PATHS);
        channel.volume = scaledSfxVolume(HEAL_PICKUP_VOLUME_MULT);
        healPickupPool.push(channel);
    }
    healPickupPoolIndex = 0;
}

// Initialize Instakill Pickup Pool keeps the game logic moving.
function initializeInstakillPickupPool() {
    instakillPickupPool = [];
    for (let i = 0; i < INSTAKILL_PICKUP_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(INSTAKILL_PICKUP_PATHS);
        channel.volume = scaledSfxVolume(INSTAKILL_PICKUP_VOLUME_MULT);
        instakillPickupPool.push(channel);
    }
    instakillPickupPoolIndex = 0;
}

// Initialize Ui Click Pool keeps the game logic moving.
function initializeUiClickPool() {
    uiClickPool = [];
    for (let i = 0; i < UI_CLICK_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(UI_CLICK_PATHS);
        channel.volume = sfxVolume;
        uiClickPool.push(channel);
    }
    uiClickPoolIndex = 0;
}

// Initialize Exp Orb Pool keeps the game logic moving.
function initializeExpOrbPool() {
    expOrbPool = [];
    for (let i = 0; i < EXP_ORB_POOL_SIZE; i++) {
        const channel = createAudioWithFallback(EXP_ORB_PATHS);
        channel.volume = sfxVolume;
        expOrbPool.push(channel);
    }
    expOrbPoolIndex = 0;
}

// Play Laser Shot keeps the game logic moving.
function playLaserShot() {
    if (!audioUnlocked || !laserShotPool.length) return;

    const channel = laserShotPool[laserShotPoolIndex];
    laserShotPoolIndex = (laserShotPoolIndex + 1) % laserShotPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Shotgun Shot keeps the game logic moving.
function playShotgunShot() {
    if (!audioUnlocked || !shotgunShotPool.length) return;

    const channel = shotgunShotPool[shotgunShotPoolIndex];
    shotgunShotPoolIndex = (shotgunShotPoolIndex + 1) % shotgunShotPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Smg Shot keeps the game logic moving.
function playSmgShot() {
    if (!audioUnlocked || !smgShotPool.length) return;

    const channel = smgShotPool[smgShotPoolIndex];
    smgShotPoolIndex = (smgShotPoolIndex + 1) % smgShotPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Sniper Shot keeps the game logic moving.
function playSniperShot() {
    if (!audioUnlocked || !sniperShotPool.length) return;

    const channel = sniperShotPool[sniperShotPoolIndex];
    sniperShotPoolIndex = (sniperShotPoolIndex + 1) % sniperShotPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Sniper Ping keeps the game logic moving.
function playSniperPing() {
    if (!audioUnlocked || !sniperPingAudio || !sniperPingAudioLayer) return;
    if (!sniperPingAudio.paused) return;
    if (!sniperPingAudioLayer.paused) return;

    sniperPingAudio.currentTime = 0;
    sniperPingAudioLayer.currentTime = 0;
    sniperPingAudio.play().catch(() => {

    });
    sniperPingAudioLayer.play().catch(() => {

    });
}

// Play Dash Sound keeps the game logic moving.
function playDashSound() {
    if (!audioUnlocked || !dashPool.length) return;

    for (let i = 0; i < DASH_PLAY_LAYERS; i++) {
        const channel = dashPool[dashPoolIndex];
        dashPoolIndex = (dashPoolIndex + 1) % dashPool.length;
        channel.currentTime = 0;
        channel.play().catch(() => {

        });
    }
}

// Play Ammo Pickup Sound keeps the game logic moving.
function playAmmoPickupSound() {
    if (!audioUnlocked || !ammoPickupPool.length) return;

    const channel = ammoPickupPool[ammoPickupPoolIndex];
    ammoPickupPoolIndex = (ammoPickupPoolIndex + 1) % ammoPickupPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Heal Pickup Sound keeps the game logic moving.
function playHealPickupSound() {
    if (!audioUnlocked || !healPickupPool.length) return;

    const channel = healPickupPool[healPickupPoolIndex];
    healPickupPoolIndex = (healPickupPoolIndex + 1) % healPickupPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Instakill Pickup Sound keeps the game logic moving.
function playInstakillPickupSound() {
    if (!audioUnlocked || !instakillPickupPool.length) return;

    const channel = instakillPickupPool[instakillPickupPoolIndex];
    instakillPickupPoolIndex = (instakillPickupPoolIndex + 1) % instakillPickupPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Ui Click keeps the game logic moving.
function playUiClick() {
    if (!audioUnlocked || !uiClickPool.length) return;

    const channel = uiClickPool[uiClickPoolIndex];
    uiClickPoolIndex = (uiClickPoolIndex + 1) % uiClickPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Play Exp Orb Pickup keeps the game logic moving.
function playExpOrbPickup() {
    if (!audioUnlocked || !expOrbPool.length) return;

    const channel = expOrbPool[expOrbPoolIndex];
    expOrbPoolIndex = (expOrbPoolIndex + 1) % expOrbPool.length;
    channel.currentTime = 0;
    channel.play().catch(() => {

    });
}

// Unlock Audio If Needed keeps the game logic moving.
function unlockAudioIfNeeded() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    if (pendingMusicStart && currentMusicTrack) {
        pendingMusicStart = false;
        playCurrentMusicTrack();
    }
}

// Sync Audio Control Panel keeps the game logic moving.
function syncAudioControlPanel() {
    const visible = false;
    audioControlPanel.style.display = visible ? 'flex' : 'none';
}

