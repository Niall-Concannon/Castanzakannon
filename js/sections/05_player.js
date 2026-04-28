// Player flow wave progress and combat actions are managed here.




// Start Game keeps the game logic moving.
function startGame() {
    // Go to weapon selection before actually starting
    gameState = 'weaponSelect';
    selectedWeaponIndex = 0; // default to Assault Rifle
}

function confirmWeaponAndStart() {
    if (typeof normalizeSelectedCharacter === 'function') {
        normalizeSelectedCharacter();
    }
    if (typeof normalizeSelectedWeapon === 'function') {
        normalizeSelectedWeapon();
    }
    if (typeof resetCloudRunState === 'function') {
        resetCloudRunState();
    }

    showPerfGuide = false;
    showCheatMenu = false;
    currentArenaLevel = 1;
    currentWave = 1;
    enemiesRemainingInWave = 0;
    enemiesToSpawn = 0;
    waveClearTimer = 0;
    setMapThemeForCurrentLevel();
    generateMap();
    pickups       = [];
    enemies       = [];
    projectiles   = [];
    enemyProjectiles = [];
    muzzleFlashes = [];
    railgunBeams = [];
    dashTrail     = [];
    trailTimer = 0;
    chests = [];

    player.x     = (MAP_W * TILE) / 2;
    player.y     = (MAP_H * TILE) / 2;
    player.prevX = player.x;
    player.prevY = player.y;
    const chosen = getSelectedCharacter();
    player.speed = chosen.speed;
    player.maxHp = chosen.maxHp;
    player.xpGainMult = chosen.xpGainMult ?? 1;
    player.lifestealOnKill = chosen.lifestealOnKill ?? 0;
    player.bulletDamage = 1;
    player.fireRateMult = 1;
    player.damageTakenMult = 1;
    player.xpAttractMult = 1;
    player.ammoRegenMult = 1;
    player.aoePulseDamage = 0;
    player.aoePulseRadius = 0;
    player.aoePulseIntervalFrames = 34;
    player.aoePulseTimer = 0;
    player.aoePulseFlash = 0;
    player.hasRailgunUlt = false;
    player.railgunUltCooldown = 0;
    player.railgunUltCooldownFrames = RAILGUN_ULT_COOLDOWN_FRAMES;
    player.railgunUltDamage = 22;
    player.upgradeLevels = {};
    player.itemLevels = {};
    player.inventory = [];
    player.lastLootText = '';
    player.lastLootTimer = 0;
    player.critChance = 0;
    player.critMult = 1.75;
    player.projectilePierce = 0;
    player.extraShots = 0;
    player.explosionRadius = 0;
    player.chainLightningChance = 0;
    player.chainLightningDamageMult = 0.6;
    player.executeBonusMult = 1;
    player.shieldMax = 0;
    player.shieldCharges = 0;
    player.shieldRegenCooldown = 180;
    player.shieldRegenTimer = 0;
    player.auraDamage = 0;
    player.auraRadius = 120;
    player.auraIntervalFrames = 60;
    player.auraTimer = 60;
    player.killHealFlat = 0;
    player.killAmmoFlat = 0;
    player.killShieldFlat = 0;
    player.reviveCharges = 0;
    player.puddleDamageAccumulator = 0;
    currentLevelUpChoices = [];
    player.dashMaxCharges = Math.max(1, chosen.dashCharges ?? 1);
    player.dashCharges = player.dashMaxCharges;
    player.dashDistanceMult = chosen.dashDistanceMult ?? 1;
    player.dashPhasesWalls = chosen.dashPhasesWalls ?? false;
    player.dashRechargeFrames = Math.max(1, chosen.dashRechargeFrames ?? 120);
    player.dashCooldown = 0;
    player.dashLockFrames = 0;
    player.hp    = player.maxHp;
    player.ammoRegenTimer = 0;
    player.ammoNoShootFrames = 0;
    player.sniperReloadLocked = false;
    player.sniperReloadTimer = 0;
    player.sniperPingDelayTimer = -1;
    player.sniperAmmoPierceProgress = 0;
    player.infiniteAmmoTimer = 0;
    player.healOverTimeTimer = 0;
    player.instakillTimer = 0;
    player.xp    = 0;
    player.level = 1;
    player.puddleDamageAccumulator = 0;
    elapsedGameMs = 0;
    gamePaused   = false;

    player.swordExtension = 0;
    player.swordPhase = 'idle';
    player.swordHitSet = new Set();

    // Apply the chosen weapon loadout (must happen before ammo init)
    const requestedWeaponIndex = selectedWeaponIndex;
    const canUseRequestedWeapon = typeof isWeaponUnlocked === 'function' ? isWeaponUnlocked(requestedWeaponIndex) : true;
    const loadoutIndex = canUseRequestedWeapon ? requestedWeaponIndex : 0;
    const loadout = WEAPON_LOADOUTS[loadoutIndex] ?? WEAPON_LOADOUTS[0];
    selectedWeaponIndex = loadoutIndex;
    loadout.apply(player);
    player.ammo  = player.weaponAmmoMax ?? AMMO_MAX;
    gameState    = 'playing';
    gameState    = 'playing';
    lastTimestamp = 0;
    accumulator   = 0;
    voidEncounter.completedLevels = {};
    voidEncounter.active = false;
    voidEncounter.state = 'inactive';
    voidEncounter.returnContext = null;
    necromancerEncounter.completedLevels = {};
    necromancerEncounter.active = false;
    necromancerEncounter.state = 'inactive';
    necromancerEncounter.returnContext = null;
    endlessMode = false;
    endlessWave = 0;
    // Totems use 10% chance per wave — don't force-spawn on game start
    spawnVoidTotemForLevel(false);
    spawnNecromancerTotemForLevel(false);
    spawnDevModePowerupLine();
    playRandomMusicTrack();
    startWave(1);
}

// Draw Cheat Menu keeps the game logic moving.
function drawCheatMenu() {
    if (!showCheatMenu || gameState !== 'playing') return;

    const zones = getCheatMenuZones();
    const { panel, close, tabs, entries } = zones;
    const activeColor = '#ff0000';
    const inactiveColor = 'rgba(255,255,255,0.28)';

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'left';
    ctx.fillText('DEV CHEAT MENU', panel.x + 10, panel.y + 22);

    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const closeHover = mouseX >= close.x && mouseX <= close.x + close.w && mouseY >= close.y && mouseY <= close.y + close.h;
    ctx.fillStyle = closeHover ? '#ff0000' : '#ff0000';
    ctx.fillText('X', close.x + close.w / 2, close.y + 15);

    const tabsList = [
        { id: 'items', label: 'ITEMS' },
        { id: 'upgrades', label: 'UPGRADES' },
    ];

    for (const tab of tabsList) {
        const tabZone = tabs[tab.id];
        const tabHover = mouseX >= tabZone.x && mouseX <= tabZone.x + tabZone.w && mouseY >= tabZone.y && mouseY <= tabZone.y + tabZone.h;
        const active = devCheatMenuTab === tab.id;
        ctx.fillStyle = active ? 'rgba(255,0,0,0.18)' : tabHover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(tabZone.x, tabZone.y, tabZone.w, tabZone.h);
        ctx.strokeStyle = active ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,255,0.18)';
        ctx.strokeRect(tabZone.x, tabZone.y, tabZone.w, tabZone.h);
        ctx.fillStyle = active ? activeColor : inactiveColor;
        ctx.fillText(tab.label, tabZone.x + tabZone.w / 2, tabZone.y + 16);
    }

    for (const cell of entries) {
        const hover = mouseX >= cell.x && mouseX <= cell.x + cell.w && mouseY >= cell.y && mouseY <= cell.y + cell.h;
        const level = cell.entry.kind === 'upgrade' ? getUpgradeLevel(cell.entry.id) : getItemLevel(cell.entry.id);
        const rarityColor = getRarityUiColor(cell.entry.rarity);

        if (hover) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
        }

        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = rarityColor;
        ctx.fillText(cell.entry.title, cell.x + 6, cell.y + 15);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff0000';
        ctx.fillText(`Lv ${level}`, cell.x + cell.w - 8, cell.y + 15);
    }

    const hoveredCell = entries.find(cell => mouseX >= cell.x && mouseX <= cell.x + cell.w && mouseY >= cell.y && mouseY <= cell.y + cell.h);
    if (hoveredCell) {
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(220,230,255,0.88)';
        ctx.fillText(hoveredCell.entry.detail, panel.x + 10, panel.y + panel.h - 10);
    } else {
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(220,230,255,0.85)';
        ctx.fillText(devCheatMenuTab === 'items' ? 'Click an item to add it' : 'Click an upgrade to apply it', panel.x + 10, panel.y + panel.h - 10);
    }
    ctx.restore();
}

// Set Map Theme For Current Level keeps the game logic moving.
function setMapThemeForCurrentLevel() {
    currentMapThemeId = Math.max(1, Math.min(MAX_ARENA_LEVELS, currentArenaLevel));
    currentMapTheme = MAP_THEME_SPRITES[currentMapThemeId] ?? MAP_THEME_SPRITES[1];
}

// Applies level 3 puddle damage when the player is standing in a hazard tile.
function applyLevel3PuddleDamage() {
    if (currentArenaLevel !== 3 || !levelDecorations.length) return;

    const playerRadius = player.size * 0.5;
    const hazardDamagePerFrame = player.maxHp * LEVEL3_PUDDLE_DAMAGE_PER_SECOND * (FIXED_STEP / 1000);
    let standingInPuddle = false;

    for (const deco of levelDecorations) {
        if (deco.type !== 'puddle') continue;
        const widthTiles = deco.widthTiles ?? 1;
        const heightTiles = deco.heightTiles ?? 1;
        const centerX = (deco.tx + widthTiles * 0.5) * TILE;
        const centerY = (deco.ty + heightTiles * 0.5) * TILE;
        const halfWidth = (widthTiles * TILE) * 0.5;
        const halfHeight = (heightTiles * TILE) * 0.5;

        if (Math.abs(player.x - centerX) <= halfWidth + playerRadius && Math.abs(player.y - centerY) <= halfHeight + playerRadius) {
            standingInPuddle = true;
            break;
        }
    }

    if (!standingInPuddle) return;

    player.puddleDamageAccumulator = (player.puddleDamageAccumulator ?? 0) + hazardDamagePerFrame;
    while (player.puddleDamageAccumulator >= 1) {
        applyPlayerDamage(1);
        player.puddleDamageAccumulator -= 1;
    }
}

// Get Wave Enemy Total keeps the game logic moving.
function getWaveEnemyTotal(waveNumber) {

    if (devTestMode) return 1;
    return WAVE_BASE_ENEMIES + (waveNumber - 1) * WAVE_STEP_ENEMIES;
}

// Get Configured Waves Per Level keeps the game logic moving.
function getConfiguredWavesPerLevel() {
    if (!devTestMode) return WAVES_PER_LEVEL;
    return Math.max(1, Math.min(WAVES_PER_LEVEL, devTestWaveLimit));
}

// Start Wave keeps the game logic moving.
function startWave(waveNumber) {

    currentWave = waveNumber;
    enemiesRemainingInWave = getWaveEnemyTotal(currentWave);
    enemiesToSpawn = enemiesRemainingInWave;
    waveClearTimer = 0;
    waveSpawnDelayFrames = WAVE_START_SPAWN_DELAY_FRAMES;
    enemySpawnBudget = 0;
    spawnArenaChest();

    // Roll totem chance each wave (already-spawned totems are guarded inside)
    spawnVoidTotemForLevel(false);
    spawnNecromancerTotemForLevel(false);

    if (waveNumber === getConfiguredWavesPerLevel()) {
        finalWaveBannerTimer = 180;
        spawnBossEnemy();
    }
}

// Get Alive Enemy Count keeps the game logic moving.
function getAliveEnemyCount() {
    let alive = 0;
    for (const e of enemies) if (e.alive) alive++;
    return alive;
}

// Update Wave Spawner keeps the game logic moving.
function updateWaveSpawner() {
    if (isAnyBossEncounterActive()) return;
    if (waveSpawnDelayFrames > 0) {
        waveSpawnDelayFrames--;
        return;
    }

    const spawnsPerSecond = WAVE_BASE_SPAWNS_PER_SECOND + (currentWave - 1) * WAVE_SPAWN_RATE_STEP;

    enemySpawnBudget += spawnsPerSecond * (FIXED_STEP / 1000);
    let alive = getAliveEnemyCount();
    while (enemySpawnBudget >= 1 && enemiesToSpawn > 0 && alive < MAX_ACTIVE_ENEMIES) {
        spawnEnemy(pickRandomEnemyType());
        enemiesToSpawn--;
        enemySpawnBudget--;
        alive++;
    }
}

// Update Wave Progression keeps the game logic moving.
function updateWaveProgression() {
    if (isAnyBossEncounterActive()) return;
    const alive = getAliveEnemyCount();
    if (enemiesRemainingInWave > 0 || enemiesToSpawn > 0 || alive > 0) {
        waveClearTimer = 0;
        return;
    }

    if (chests.some(chest => chest.bossChest)) {
        waveClearTimer = 0;
        return;
    }

    waveClearTimer++;
    if (waveClearTimer < WAVE_CLEAR_DELAY_FRAMES) return;
    waveClearTimer = 0;

    // Endless mode: just keep going
    if (endlessMode) {
        endlessWave++;
        startEndlessWave(endlessWave);
        return;
    }

    if (currentWave < getConfiguredWavesPerLevel()) {
        startWave(currentWave + 1);
        return;
    }

    if (currentArenaLevel >= MAX_ARENA_LEVELS) {
        // Enter endless mode instead of showing win screen
        endlessMode = true;
        endlessWave++;
        startEndlessWave(endlessWave);
        return;
    }


    currentArenaLevel++;
    setMapThemeForCurrentLevel();
    generateMap();
    playRandomMusicTrack();

    enemies = [];
    pickups = [];
    projectiles = [];
    enemyProjectiles = [];
    muzzleFlashes = [];
    railgunBeams = [];
    dashTrail = [];
    trailTimer = 0;
    chests = [];

    player.x = (MAP_W * TILE) / 2;
    player.y = (MAP_H * TILE) / 2;
    player.prevX = player.x;
    player.prevY = player.y;
    player.puddleDamageAccumulator = 0;

    spawnDevModePowerupLine();
    // Totems reset per level; wave 1 of new level gets the 10% roll
    voidTotem = null;
    necromancerTotem = null;

    startWave(1);
}

// Starts one endless wave with escalating enemy count.
function startEndlessWave(n) {
    // Grow enemy count quickly — base 80 + 30 per endless wave
    const count = 80 + (n - 1) * 30;
    currentWave = getConfiguredWavesPerLevel(); // keep UI wave indicator maxed
    enemiesRemainingInWave = count;
    enemiesToSpawn = count;
    waveClearTimer = 0;
    waveSpawnDelayFrames = WAVE_START_SPAWN_DELAY_FRAMES;
    enemySpawnBudget = 0;
}

// Cleanup Dead Enemies keeps the game logic moving.
function cleanupDeadEnemies() {
    enemies = enemies.filter(e => e.alive);
}

// Player Dash keeps the game logic moving.
function playerDash() {
    if (player.dashing || player.dashCharges <= 0 || (player.dashLockFrames ?? 0) > 0) return;

    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup'])    dirY = -1;
    if (keys['s'] || keys['arrowdown'])  dirY =  1;
    if (keys['a'] || keys['arrowleft'])  dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX =  1;
    if (dirX === 0 && dirY === 0) dirX = player.facing;

    const n = Math.hypot(dirX, dirY);
    player.dashDirX    = dirX / n;
    player.dashDirY    = dirY / n;
    player.dashing     = true;
    player.dashTime    = DASH_DURATION;
    player.dashCharges--;
    playDashSound();
    if (player.dashCharges < player.dashMaxCharges && player.dashCooldown <= 0) {
        player.dashCooldown = player.dashRechargeFrames;
    }


    dashTrail  = [];
    trailTimer = 0;
}

// Returns the number of mid-segments the sword can grow to right now.
function getVoidSwordMaxMidSegments() {
    const fromExtraShots = player.extraShots ?? 0;
    const fromPellets = Math.max(0, (player.weaponPellets ?? 1) - 1);
    const fromPierce = player.projectilePierce ?? 0;
    return VOID_SWORD_BASE_MID_SEGMENTS + fromExtraShots + fromPellets + fromPierce;
}

// Returns the active mid segment count and the world-space sword length for the current frame.
function getVoidSwordGeometry() {
    const maxMid = getVoidSwordMaxMidSegments();
    const phase = Math.max(0, Math.min(1, player.swordExtension ?? 0));
    const activeMid = Math.floor(phase * maxMid + 1e-6);
    const length = VOID_SWORD_BOT_LEN + activeMid * VOID_SWORD_MID_LEN + VOID_SWORD_TOP_LEN;
    return { maxMid, activeMid, phase, length };
}

// Drives the sword extension/retraction state machine and applies hit damage.
function updateVoidSword() {
    if (player.weaponType !== 'void_sword') {
        player.swordExtension = 0;
        player.swordPhase = 'idle';
        if (player.swordHitSet?.size) player.swordHitSet.clear();
        return;
    }

    const extendFrames = Math.max(1, getPlayerShootCooldownFrames());
    const retractFrames = Math.max(1, extendFrames / VOID_SWORD_RETRACT_SPEED_MULT);
    const extendStep = 1 / extendFrames;
    const retractStep = 1 / retractFrames;

    if (!player.swordHitSet) player.swordHitSet = new Set();

    if (player.swordPhase === 'idle') {
        if (mouseDown) {
            player.swordPhase = 'extending';
            player.swordHitSet.clear();
            if (typeof scheduleStartVoidSwordLoop === 'function') scheduleStartVoidSwordLoop();
        }
    }

    if (player.swordPhase === 'extending') {
        if (!mouseDown) {
            player.swordPhase = 'retracting';
            if (typeof scheduleStopVoidSwordLoop === 'function') scheduleStopVoidSwordLoop();
        } else {
            player.swordExtension = Math.min(1, (player.swordExtension ?? 0) + extendStep);
            if (player.swordExtension >= 1) {
                player.swordExtension = 1;
                player.swordPhase = 'retracting';
                if (typeof scheduleStopVoidSwordLoop === 'function') scheduleStopVoidSwordLoop();
            }
        }
    } else if (player.swordPhase === 'retracting') {
        player.swordExtension = Math.max(0, (player.swordExtension ?? 0) - retractStep);
        if (player.swordExtension <= 0) {
            player.swordExtension = 0;
            if (mouseDown) {
                player.swordPhase = 'extending';
                player.swordHitSet.clear();
                if (typeof scheduleStartVoidSwordLoop === 'function') scheduleStartVoidSwordLoop();
            } else {
                player.swordPhase = 'idle';
            }
        }
    }

    if (player.swordPhase !== 'extending') return;

    const angle = player.weaponAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const anchorX = player.x + cosA * RAIL_RADIUS;
    const anchorY = player.y + sinA * RAIL_RADIUS;
    const { length } = getVoidSwordGeometry();
    if (length <= 0) return;
    const halfThickness = VOID_SWORD_BLADE_THICKNESS / 2;
    const damage = Math.max(1, player.bulletDamage ?? 1);

    const hitTarget = (target) => {
        if (!target?.alive) return;
        if (player.swordHitSet.has(target)) return;
        const dx = target.x - anchorX;
        const dy = target.y - anchorY;
        const along = dx * cosA + dy * sinA;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        const radius = target.size ?? 12;
        if (along < -radius || along > length + radius) return;
        if (perp > halfThickness + radius) return;
        player.swordHitSet.add(target);
        applyEnemyDamage(target, damage, { sourceX: anchorX, sourceY: anchorY });
    };

    for (const e of enemies) hitTarget(e);
    for (const t of tumorTurrets) hitTarget(t);
}

// Player Shoot keeps the game logic moving.
function playerShoot() {
    if (player.weaponType === 'void_sword') return;
    if (!mouseDown || player.shootCooldown > 0) return;
    const hasInfiniteAmmo = player.infiniteAmmoTimer > 0;
    const shotCost = player.weaponShotCost ?? AMMO_SHOT_COST;

    if (!hasInfiniteAmmo && player.sniperReloadLocked) {
        if (player.ammo > 0) {
            player.sniperReloadLocked = false;
            player.sniperReloadTimer = 0;
        } else {
            return;
        }
    }

    if (!hasInfiniteAmmo && player.ammo < shotCost) return;

    if (!hasInfiniteAmmo) {
        player.ammo = Math.max(0, player.ammo - shotCost);
        if (player.ammo <= 0) {
            player.sniperReloadLocked = true;
            player.sniperReloadTimer = 0;
            if (player.weaponType === 'sniper') {
                player.sniperPingDelayTimer = SNIPER_PING_DELAY_FRAMES;
            }
        }
    }
    player.ammoRegenTimer = 0;
    player.ammoNoShootFrames = 0;
    player.shootCooldown = getPlayerShootCooldownFrames();
    if (player.weaponType === 'sniper') {
        playSniperShot();
    } else if (player.weaponType === 'smg') {
        playSmgShot();
    } else if (player.weaponType === 'shotgun') {
        playShotgunShot();
    } else if (player.weaponType === 'necromancer_staff') {
        playNecroShot();
    } else {
        playLaserShot();
    }


    const spread = (Math.random() - 0.5) * (player.weaponSpread ?? BULLET_SPREAD);
    const angle  = player.weaponAngle + spread;

    const gunX = player.x + Math.cos(player.weaponAngle) * RAIL_RADIUS;
    const gunY = player.y + Math.sin(player.weaponAngle) * RAIL_RADIUS;

    const barrelTip = 22;
    const bx = gunX + Math.cos(angle) * barrelTip;
    const by = gunY + Math.sin(angle) * barrelTip;

    const pellets   = player.weaponPellets ?? 1;
    const shotCount = Math.max(1, pellets + (player.extraShots ?? 0));
    const isShotgun = pellets > 1;
    const spreadStep = isShotgun ? (player.weaponSpread ?? 0.55) / pellets
                                 : (shotCount > 1 ? 0.055 : 0);
    const startOffset = -(shotCount - 1) * 0.5;

    for (let i = 0; i < shotCount; i++) {
        const pelletAngle = isShotgun
            ? player.weaponAngle + (Math.random() - 0.5) * (player.weaponSpread ?? 0.55)
            : angle + (startOffset + i) * spreadStep;
        const projectile = {
            x: bx, y: by, prevX: bx, prevY: by,
            velocityX: Math.cos(pelletAngle) * (player.weaponSpeed ?? 12),
            velocityY: Math.sin(pelletAngle) * (player.weaponSpeed ?? 12),
            size: (player.weaponPellets ?? 1) > 1 ? 4 : 5,
            framesLeft: player.weaponFrames ?? 80,
            piercesLeft: player.projectilePierce ?? 0,
            critChance: player.critChance ?? 0,
            critMult: player.critMult ?? 1.75,
            explosionRadius: player.explosionRadius ?? 0,
            chainChance: player.chainLightningChance ?? 0,
            chainDamageMult: player.chainLightningDamageMult ?? 0.6,
            isCrit: Math.random() < (player.critChance ?? 0),
        };

        if (player.weaponType === 'necromancer_staff') {
            const isVoid = Math.random() < VOID_SNAKE_CHANCE;
            projectile.size = NECRO_SNAKE_PROJECTILE_SIZE;
            projectile.piercesLeft = 0;
            projectile.bouncesLeft = isVoid ? VOID_SNAKE_BOUNCES : NECRO_SNAKE_BOUNCES;
            projectile.bounceRange = SNAKE_BOUNCE_RANGE;
            projectile.visited = new Set();
            projectile.sprite = isVoid ? voidSnakeProjectileSprite : necroSnakeProjectileSprite;
            projectile.lengthMultiplier = 400 / 65;
            if (isVoid) {
                projectile.appliesSlow = true;
                projectile.slowFrames = VOID_SNAKE_SLOW_FRAMES;
                projectile.slowMult = VOID_SNAKE_SLOW_MULT;
            }
        }

        projectiles.push(projectile);
    }


    const sparks = [];
    for (let i = 0; i < MUZZLE_SPARKS; i++) {
        const sa = angle + (Math.random() - 0.5) * 1.4;
        sparks.push({
            vx:   Math.cos(sa) * (2.5 + Math.random() * 4),
            vy:   Math.sin(sa) * (2.5 + Math.random() * 4),
            len:  3 + Math.random() * 5,
        });
    }
    muzzleFlashes.push({ x: bx, y: by, angle, age: 0, sparks });
}

// Update Player keeps the game logic moving.
function updatePlayer() {
    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup'])    dirY = -1;
    if (keys['s'] || keys['arrowdown'])  dirY =  1;
    if (keys['a'] || keys['arrowleft'])  dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX =  1;

    if (player.dashing) {
        player.dashTime--;
        if (player.dashTime <= 0) {
            player.dashing = false;
        } else {
            const dashSpeed = DASH_SPEED * player.dashDistanceMult;
            const nx = player.x + player.dashDirX * dashSpeed;
            const ny = player.y + player.dashDirY * dashSpeed;
            if (player.dashPhasesWalls) {
                player.x = nx;
                player.y = ny;
            } else {
                if (!wallCollision(nx,      player.y, player.size)) player.x = nx;
                if (!wallCollision(player.x, ny,      player.size)) player.y = ny;
            }


            if (trailTimer <= 0) {
                dashTrail.push({
                    x:     player.x,
                    y:     player.y,
                    flipX: player.facing === -1,
                    age:   0,
                });
                if (dashTrail.length > TRAIL_LENGTH) dashTrail.shift();
                trailTimer = TRAIL_INTERVAL;
            }
            trailTimer--;
        }
    } else {
        const n  = Math.hypot(dirX, dirY) || 1;
        const mx = (dirX / n) * player.speed;
        const my = (dirY / n) * player.speed;
        const canMoveX = !wallCollision(player.x + mx, player.y,      player.size);
        const canMoveY = !wallCollision(player.x,      player.y + my, player.size);
        if (canMoveX) player.x += mx;
        if (canMoveY) player.y += my;


        if (!canMoveX && !canMoveY && (dirX !== 0 || dirY !== 0)) {
            const angle = Math.atan2(dirY, dirX);
            const slide = player.speed * 0.95;
            const px = -Math.sin(angle);
            const py =  Math.cos(angle);

            const c1x = player.x + px * slide;
            const c1y = player.y + py * slide;
            const c2x = player.x - px * slide;
            const c2y = player.y - py * slide;

            const c1ok = !wallCollision(c1x, c1y, player.size);
            const c2ok = !wallCollision(c2x, c2y, player.size);

            if (c1ok || c2ok) {
                if (!c2ok) {
                    player.x = c1x; player.y = c1y;
                } else if (!c1ok) {
                    player.x = c2x; player.y = c2y;
                } else {

                    const d1 = (c1x - player.x) * mx + (c1y - player.y) * my;
                    const d2 = (c2x - player.x) * mx + (c2y - player.y) * my;
                    if (d1 >= d2) {
                        player.x = c1x; player.y = c1y;
                    } else {
                        player.x = c2x; player.y = c2y;
                    }
                }
            }
        }
    }

    player.x = Math.max(TILE * 2, Math.min(MAP_W * TILE - TILE * 2, player.x));
    player.y = Math.max(TILE * 2, Math.min(MAP_H * TILE - TILE * 2, player.y));

    if (player.dashPhasesWalls && !player.dashing && wallCollision(player.x, player.y, player.size)) {
        rescuePlayerFromWall();
    }

    applyLevel3PuddleDamage();

    if ((player.dashLockFrames ?? 0) > 0) {
        player.dashLockFrames--;
        if (player.dashCooldown < 2) player.dashCooldown = 2;
    } else if (player.dashCharges < player.dashMaxCharges) {
        if (player.dashCooldown > 0) player.dashCooldown--;
        if (player.dashCooldown <= 0) {
            player.dashCharges++;
            player.dashCooldown = player.dashCharges < player.dashMaxCharges ? player.dashRechargeFrames : 0;
        }
    }
    if (player.shootCooldown > 0) player.shootCooldown = Math.max(0, player.shootCooldown - 1);
    if (player.invulnTimer   > 0) player.invulnTimer--;

    if ((player.sniperPingDelayTimer ?? -1) > 0) {
        player.sniperPingDelayTimer--;
        if (player.sniperPingDelayTimer === 0) {
            playSniperPing();
            player.sniperPingDelayTimer = -1;
        }
    }

    // Laser loop management: schedule start/stop with small delays to avoid stutter.
    if (mouseDown && lastShotWasLaser) {
        if (typeof scheduleStartLaserLoop === 'function') scheduleStartLaserLoop();
    } else {
        if (typeof scheduleStopLaserLoop === 'function') scheduleStopLaserLoop();
    }

    if (player.infiniteAmmoTimer > 0) {
        player.infiniteAmmoTimer--;
        player.ammoRegenTimer = 0;
        player.ammoNoShootFrames = 0;
        player.sniperReloadLocked = false;
        player.sniperReloadTimer = 0;
    } else {
        const ammoMax = player.weaponAmmoMax ?? AMMO_MAX;

        if (player.sniperReloadLocked) {
            if (player.ammo > 0) {
                player.sniperReloadLocked = false;
                player.sniperReloadTimer = 0;
            } else {
                player.ammoRegenTimer = 0;
                player.ammoNoShootFrames++;
                player.sniperReloadTimer = Math.max(0, player.sniperReloadTimer ?? 0) + 1;
                if (player.sniperReloadTimer >= SNIPER_RELOAD_MIN_FRAMES) {
                    player.ammo = ammoMax;
                    player.sniperReloadLocked = false;
                    player.sniperReloadTimer = 0;
                }
            }
        } else if (player.ammo < ammoMax && !mouseDown) {
            player.ammoNoShootFrames++;
            player.ammoRegenTimer++;
            const idleSeconds = (player.ammoNoShootFrames * FIXED_STEP) / 1000;
            const baseInterval = player.weaponAmmoRegen ?? AMMO_REGEN_INTERVAL_FRAMES;
            const regenInterval = Math.max(
                AMMO_REGEN_MIN_INTERVAL_FRAMES,
                Math.floor((baseInterval * Math.exp(-AMMO_REGEN_ACCEL_PER_SEC * idleSeconds)) / player.ammoRegenMult),
            );
            if (player.ammoRegenTimer >= regenInterval) {
                player.ammo = Math.min(ammoMax, player.ammo + 1);
                player.ammoRegenTimer = 0;
            }
        } else if (player.ammo < ammoMax) {
            player.ammoRegenTimer = 0;
            player.ammoNoShootFrames = 0;
        } else {
            player.ammoRegenTimer = 0;
            player.ammoNoShootFrames++;
            player.sniperReloadTimer = 0;
        }
    }


    if (!player.dashing) {
        for (const g of dashTrail) g.age++;
        dashTrail = dashTrail.filter(g => g.age < TRAIL_LIFETIME);
    }

    for (const e of enemies) {
        if (!e.alive) continue;
        if (player.invulnTimer <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
            applyPlayerDamage(10);
            player.invulnTimer = 60;
        }
    }

    if (player.healOverTimeTimer > 0 && player.hp > 0 && player.hp < player.maxHp) {
        const framesLeft = Math.max(1, player.healOverTimeTimer);
        const missingHp = player.maxHp - player.hp;
        const healAmount = Math.max(HEAL_OVER_TIME_MIN_PER_FRAME, missingHp / framesLeft);
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        player.healOverTimeTimer--;
    } else if (player.healOverTimeTimer > 0) {
        player.healOverTimeTimer--;
    }

    if (player.instakillTimer > 0) player.instakillTimer--;
    if (player.railgunUltCooldown > 0) player.railgunUltCooldown--;
    if (player.aoePulseFlash > 0) player.aoePulseFlash--;
    triggerChronoPulse();

    if ((player.shieldMax ?? 0) > 0 && (player.shieldCharges ?? 0) < player.shieldMax) {
        if (player.shieldRegenTimer > 0) {
            player.shieldRegenTimer--;
        } else {
            player.shieldCharges = Math.min(player.shieldMax, player.shieldCharges + 1);
            player.shieldRegenTimer = player.shieldRegenCooldown;
        }
    }

    if ((player.auraDamage ?? 0) > 0) {
        if (player.auraTimer > 0) {
            player.auraTimer--;
        } else {
            player.auraTimer = player.auraIntervalFrames;
            const auraRadius = player.auraRadius ?? 120;
            for (const e of enemies) {
                if (!e.alive) continue;
                if (Math.hypot(player.x - e.x, player.y - e.y) <= auraRadius + e.size) {
                    applyEnemyDamage(e, Math.max(1, player.auraDamage), { sourceX: player.x, sourceY: player.y, allowTriggers: false });
                }
            }
            for (const t of tumorTurrets) {
                if (!t.alive) continue;
                if (Math.hypot(player.x - t.x, player.y - t.y) <= auraRadius + t.size) {
                    applyEnemyDamage(t, Math.max(1, player.auraDamage), { sourceX: player.x, sourceY: player.y, allowTriggers: false });
                }
            }
        }
    }

    if (player.hp <= 0) {
        lastLevelDied = player.level;
        gameState = 'gameOver';
        if (typeof registerCloudRunOutcome === 'function') {
            registerCloudRunOutcome('defeat');
        }
    }

    player.weaponAngle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
    playerShoot();
    updateVoidSword();
    updatePlayerAnim();
}

// Update Player Anim keeps the game logic moving.
function updatePlayerAnim() {
    const moving = keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
                   keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];

    player.facing = Math.cos(player.weaponAngle) >= 0 ? 1 : -1;

    if (player.dashing) {
        playerAnim.frame    = 'walk1';
        playerAnim.dashFlipX = player.dashDirX < 0;
    } else if (moving) {
        playerAnim.timer--;
        if (playerAnim.timer <= 0) {
            playerAnim.walkToggle = !playerAnim.walkToggle;
            playerAnim.timer = 10;
        }
        playerAnim.frame = playerAnim.walkToggle ? 'walk1' : 'walk2';
    } else {
        playerAnim.frame = 'idle';
    }
}

