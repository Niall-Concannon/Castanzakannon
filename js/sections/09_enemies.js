// Enemy spawning movement and drawing logic live here.




// Spawns one enemy and adds it to the active list.
function spawnEnemy(type) {
    const enemy = { alive: true };
    recycleEnemy(enemy, type);
    enemies.push(enemy);
}

// Picks a random enemy type for normal waves.
function pickRandomEnemyType() {
    const level = Math.max(1, Math.min(MAX_ARENA_LEVELS, currentArenaLevel));
    const globalWave = (level - 1) * WAVES_PER_LEVEL + currentWave; // absolute wave count

    // Sniper unlocks at global wave 3 (level 1 wave 3)
    const sniperUnlocked = globalWave >= 3 || endlessMode;
    const baseSniperWeights = {
        1: 0.07,
        2: 0.14,
        3: 0.22,
        4: 0.3,
        5: 0.38,
    };
    const waveBonus = Math.min(0.14, Math.max(0, currentWave - 1) * 0.03);
    const sniperWeight = sniperUnlocked ? ((baseSniperWeights[level] ?? 0.38) + waveBonus) : 0;
    const weights = {
        basic: 1.15,
        fast: 0.95,
        tank: 0.6,
        sniper: sniperWeight,
    };

    let totalWeight = 0;
    for (const weight of Object.values(weights)) totalWeight += weight;
    let roll = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(weights)) {
        roll -= weight;
        if (roll <= 0) return type;
    }

    return 'basic';
}

// Finds a safe spawn point away from the player.
function getEnemySpawnPosition(wallSize) {

    const minRadius = Math.min(canvas.width, canvas.height) * 0.5 + SPAWN_RING_INSET;
    const maxRadius = Math.max(canvas.width, canvas.height) * 0.7 + SPAWN_RING_INSET;

    for (let tries = 0; tries < 90; tries++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const ex = player.x + Math.cos(angle) * radius;
        const ey = player.y + Math.sin(angle) * radius;

        if (ex < TILE * 2 || ex > MAP_W * TILE - TILE * 2 || ey < TILE * 2 || ey > MAP_H * TILE - TILE * 2) continue;
        if (wallCollision(ex, ey, wallSize)) continue;
        if (Math.hypot(ex - player.x, ey - player.y) < Math.min(canvas.width, canvas.height) * 0.42) continue;

        return { x: ex, y: ey };
    }

    const fallback = findNearestFreePosition(player.x + TILE * 6, player.y, wallSize, 30);
    if (fallback) return fallback;

    return { x: player.x + TILE * 4, y: player.y + TILE * 4 };
}

// Resets an enemy so it can be reused from the pool.
function recycleEnemy(e, type = pickRandomEnemyType()) {
    const spec = ENEMY_TYPES[type];
    const variant = getEnemyVariantForLevel(currentArenaLevel);
    const variantStats = ENEMY_VARIANT_STATS[variant]?.[type] || spec;
    const baseHp = variantStats.hp ?? spec.hp;
    const baseSpeed = variantStats.speed ?? spec.speed;

    // Scale HP by wave within level (each wave adds 8% HP) + endless scaling
    const waveHpMult = 1 + (currentWave - 1) * 0.08;
    const endlessHpMult = endlessMode ? (1 + (endlessWave - 1) * 0.18) : 1;
    const endlessSpeedMult = endlessMode ? (1 + (endlessWave - 1) * 0.05) : 1;

    const hp = Math.ceil(baseHp * waveHpMult * endlessHpMult);
    const speed = baseSpeed * endlessSpeedMult;
    const wallSize = (type === 'tank' || type === 'void_sniper' || type === 'necromancer') ? spec.size * 0.8 : spec.size;
    const spawnPos = getEnemySpawnPosition(wallSize);

    e.x = spawnPos.x;
    e.y = spawnPos.y;
    e.prevX = spawnPos.x;
    e.prevY = spawnPos.y;
    e.hp = hp;
    e.maxHp = hp;
    e.size = spec.size;
    e.wallSize = wallSize;
    e.speed = speed;
    e.color = spec.color;
    e.hitFlash = 0;
    e.hpBarTimer = 0;                                                                                                                                   
    e.alive = true;
    e.type = type;
    e.animFrame = 0;
    e.animTimer = Math.floor(Math.random() * spec.animSpeed);
    e.path = [];
    e.pathTimer = Math.floor(Math.random() * 30);
    e.offscreenFrames = 0;
    e.chargeFrames = 0;
    e.cooldownFrames = 0;
    e.shootAnimFrames = 0;
    if (type === 'sniper') {
        e.projectileDamage = variantStats.projectileDamage ?? SNIPER_PROJECTILE_DAMAGE;
        e.sniperChargeFrames = Math.max(20, variantStats.chargeFrames ?? SNIPER_CHARGE_FRAMES);
        e.sniperCooldownFrames = Math.max(20, variantStats.cooldownFrames ?? SNIPER_COOLDOWN_FRAMES);
    } else if (type === 'void_sniper') {
        e.projectileDamage = VOID_MAIN_PROJECTILE_DAMAGE + Math.max(0, currentArenaLevel - 1) * 2;
        e.sniperChargeFrames = Math.max(10, SNIPER_CHARGE_FRAMES - currentArenaLevel * 6);
        e.sniperCooldownFrames = Math.max(12, SNIPER_COOLDOWN_FRAMES - currentArenaLevel * 6);
        e.voidAttackTimer = 0;
        e.voidBurstCooldown = 82;
        e.voidSpikeCooldown = 66;
        e.voidWaveCooldown = 120;
        e.voidSkullCooldown = 90;
        e.voidDashCooldown = 92;
    } else if (type === 'necromancer') {
        e.projectileDamage = NECROMANCER_BOLT_PROJECTILE_DAMAGE + Math.max(0, currentArenaLevel - 1) * 2;
        e.sniperChargeFrames = Math.max(12, SNIPER_CHARGE_FRAMES - currentArenaLevel * 4);
        e.sniperCooldownFrames = Math.max(12, SNIPER_COOLDOWN_FRAMES - currentArenaLevel * 4);
        e.necromancerSummonTimer = 0;
        e.necromancerSummonCooldown = 132;
        e.necromancerVolleyCooldown = 76;
        e.necromancerOrbCooldown = 118;
        e.necromancerRiftCooldown = 90;
        e.necromancerMoveAngle = Math.random() * Math.PI * 2;
        e.necromancerMoveTimer = 0;
        e.necromancerBehavior = 'strafe';
        e.necromancerBehaviorTimer = 0;
        e.necromancerAuraCooldown = 95;
    } else {
        e.projectileDamage = 0;
        e.sniperChargeFrames = SNIPER_CHARGE_FRAMES;
        e.sniperCooldownFrames = SNIPER_COOLDOWN_FRAMES;
    }
}

// Returns the outer recycle distance for offscreen enemies.
function getEnemyRecycleDistance() {
    return Math.hypot(canvas.width, canvas.height) * 1.1;
}

// Checks whether an enemy has drifted too far away.
function isEnemyOffscreenFromPlayer(e) {
    const dx = Math.abs(e.x - player.x);
    const dy = Math.abs(e.y - player.y);
    const maxDx = canvas.width / 2 + ENEMY_OFFSCREEN_MARGIN;
    const maxDy = canvas.height / 2 + ENEMY_OFFSCREEN_MARGIN;
    return dx > maxDx || dy > maxDy;
}

// Tests for a clear line between two points.
function hasLineOfSight(x1, y1, x2, y2, size) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist === 0) return true;
    const steps = Math.ceil(dist / (TILE * 0.4));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        if (wallCollision(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, size)) return false;
    }
    return true;
}

// Steers an enemy toward the target while avoiding walls.
function moveEnemyToward(e, tx, ty, step) {
    const baseAngle = Math.atan2(ty - e.y, tx - e.x);


    const steerOffsets = [
        0,
        0.2, -0.2, 0.4, -0.4,
        0.6, -0.6, 0.8, -0.8,
        1.0, -1.0, 1.2, -1.2,
        1.4, -1.4, 1.57, -1.57
    ];
    let bestMove = null;

    for (const offset of steerOffsets) {
        const angle = baseAngle + offset;
        const mx = Math.cos(angle) * step;
        const my = Math.sin(angle) * step;


        const canMoveDiagonally = !wallCollision(e.x + mx, e.y + my, e.wallSize);
        const canMoveX = !wallCollision(e.x + mx, e.y, e.wallSize);
        const canMoveY = !wallCollision(e.x, e.y + my, e.wallSize);

        if (!canMoveDiagonally && !canMoveX && !canMoveY) continue;


        let nx, ny, moveQuality;
        if (canMoveDiagonally) {
            nx = e.x + mx;
            ny = e.y + my;
            moveQuality = 1.0;
        } else {
            nx = e.x + (canMoveX ? mx : 0);
            ny = e.y + (canMoveY ? my : 0);
            moveQuality = 0.7;
        }

        const dist = Math.hypot(tx - nx, ty - ny);
        const anglePenalty = Math.abs(offset) * 3;
        const score = dist + anglePenalty - moveQuality * 5;

        if (!bestMove || score < bestMove.score) {
            bestMove = { nx, ny, score };
        }
    }

    if (!bestMove) return false;

    e.x = bestMove.nx;
    e.y = bestMove.ny;
    return true;
}

// Fires one void boss projectile with typed behavior fields.
function fireVoidBossProjectile(enemy, angle, projectileType, speed, size, damage, life, sprite, extra = {}) {
    const sx = enemy.x + Math.cos(angle) * (enemy.size + 14);
    const sy = enemy.y + Math.sin(angle) * (enemy.size + 14);
    enemyProjectiles.push({
        x: sx,
        y: sy,
        prevX: sx,
        prevY: sy,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size,
        framesLeft: life,
        projectileType,
        damage,
        sprite,
        ...extra,
    });
}

// Returns the max number of one necromancer minion type allowed on screen.
function getNecromancerMinionCap(type) {
    const scaledBonus = Math.max(0, currentArenaLevel - 1) * 2;
    if (type !== 'sniper' && type !== 'tank') return 0;
    if (type === 'tank') return 7 + scaledBonus;
    return 10 + scaledBonus;
}

// Counts alive necromancer minions for one type.
function getAliveNecromancerMinionCount(type) {
    let count = 0;
    for (const e of enemies) {
        if (!e.alive || !e.isNecromancerMinion) continue;
        if (e.type !== type) continue;
        count++;
    }
    return count;
}

// Counts all alive necromancer minions regardless of type.
function getAliveNecromancerMinionTotal() {
    let count = 0;
    for (const e of enemies) {
        if (!e.alive || !e.isNecromancerMinion) continue;
        count++;
    }
    return count;
}

// Chooses a summon type that is still under its on-screen cap.
function pickNecromancerSummonType() {
    const totalCap = 15;
    if (getAliveNecromancerMinionTotal() >= totalCap) return null;

    const summonWeights = {
        sniper: 1,
        tank: 0.45,
    };
    const summonTypes = Object.keys(summonWeights);
    const available = summonTypes.filter(type => getAliveNecromancerMinionCount(type) < getNecromancerMinionCap(type));
    if (available.length === 0) return null;

    let totalWeight = 0;
    for (const type of available) totalWeight += summonWeights[type] ?? 0;
    if (totalWeight <= 0) return available[Math.floor(Math.random() * available.length)] ?? null;

    let roll = Math.random() * totalWeight;
    for (const type of available) {
        roll -= summonWeights[type] ?? 0;
        if (roll <= 0) return type;
    }

    return available[available.length - 1] ?? null;
}

// Returns the active necromancer boss if one is alive.
function getActiveNecromancerBoss() {
    for (const e of enemies) {
        if (!e.alive) continue;
        if (e.isNecromancerBoss) return e;
    }
    return null;
}

// Builds a spread target around the player so necromancer snipers avoid clustering.
function getNecromancerSniperSpreadTarget(sniper) {
    let repelX = 0;
    let repelY = 0;
    for (const e of enemies) {
        if (!e.alive || e === sniper) continue;
        if (!e.isNecromancerMinion || e.type !== 'sniper') continue;
        const dx = sniper.x - e.x;
        const dy = sniper.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d <= 0.001 || d > 360) continue;
        const weight = (360 - d) / 360;
        repelX += (dx / d) * weight;
        repelY += (dy / d) * weight;
    }

    const toPlayer = Math.atan2(player.y - sniper.y, player.x - sniper.x);
    const sideBias = (sniper.orbitDir ?? (Math.random() < 0.5 ? -1 : 1)) * (Math.PI * 0.55);
    const spreadAngle = toPlayer + sideBias;
    const baseX = player.x + Math.cos(spreadAngle) * 430;
    const baseY = player.y + Math.sin(spreadAngle) * 430;

    return {
        x: baseX + repelX * 260,
        y: baseY + repelY * 260,
    };
}

// Returns an orbit target around the active necromancer boss for tank minions.
function getNecromancerTankOrbitTarget(tank, boss) {
    if (tank.orbitAngle === undefined) tank.orbitAngle = Math.random() * Math.PI * 2;
    if (tank.orbitDir === undefined) tank.orbitDir = Math.random() < 0.5 ? -1 : 1;
    if (tank.orbitRadius === undefined) tank.orbitRadius = 165 + Math.random() * 85;

    tank.orbitAngle += tank.orbitDir * (0.075 + currentArenaLevel * 0.009);
    tank.orbitRadius = Math.max(145, Math.min(280, tank.orbitRadius));

    const frontAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const frontArcHalf = 1.15;
    const frontOffset = Math.sin(tank.orbitAngle) * frontArcHalf;
    const orbitAngle = frontAngle + frontOffset;

    return {
        x: boss.x + Math.cos(orbitAngle) * tank.orbitRadius,
        y: boss.y + Math.sin(orbitAngle) * tank.orbitRadius,
    };
}

// Spawns one encounter summon that does not drop XP.
function spawnNecromancerSummon(centerX, centerY) {
    const type = pickNecromancerSummonType();
    if (!type) return false;
    const summon = { alive: true };
    recycleEnemy(summon, type);

    const angle = Math.random() * Math.PI * 2;
    const radius = 80 + Math.random() * 80;
    const sx = centerX + Math.cos(angle) * radius;
    const sy = centerY + Math.sin(angle) * radius;
    if (!wallCollision(sx, sy, summon.wallSize ?? summon.size)) {
        summon.x = sx;
        summon.y = sy;
        summon.prevX = sx;
        summon.prevY = sy;
    }

    summon.isVoidEncounterEnemy = true;
    summon.isBossEncounterEnemy = false;
    summon.isNecromancerMinion = true;
    summon.necromancerMinionKind = type;
    summon.noXpDrop = true;
    if (type === 'tank') {
        summon.size = Math.round(summon.size * 1.35);
        summon.wallSize = Math.round(summon.wallSize * 1.3);
        summon.hp = Math.max(8, Math.round(summon.hp * 2.6));
    } else {
        summon.hp = Math.max(3, Math.round(summon.hp * 0.8));
    }
    summon.maxHp = summon.hp;
    summon.speed *= type === 'tank' ? 1.9 : 1.08;

    if (type === 'tank' && wallCollision(summon.x, summon.y, summon.wallSize ?? summon.size)) {
        const safeSpot = findNearestFreePosition(summon.x, summon.y, summon.wallSize ?? summon.size, 36);
        if (safeSpot) {
            summon.x = safeSpot.x;
            summon.y = safeSpot.y;
            summon.prevX = safeSpot.x;
            summon.prevY = safeSpot.y;
        }
    }

    enemies.push(summon);
    return true;
}

// Updates movement targeting and enemy state each frame.
function updateEnemies() {

    const sanSlowMult = player.dashing ? 0.15 : 1.0;

    for (const e of enemies) {
        if (!e.alive) continue;

        if (!e.isBoss) {
            if (isEnemyOffscreenFromPlayer(e)) {
                e.offscreenFrames = (e.offscreenFrames ?? 0) + 1;
            } else {
                e.offscreenFrames = 0;
            }

            if (e.offscreenFrames >= ENEMY_OFFSCREEN_DESPAWN_FRAMES) {
                recycleEnemy(e);
                continue;
            }

            if (Math.hypot(player.x - e.x, player.y - e.y) > getEnemyRecycleDistance() * 1.35) {
                recycleEnemy(e);
                continue;
            }
        }

        if (e.pathTimer > 0) {
            e.pathTimer--;
        } else {

            e.path = findPath(e.x, e.y, player.x, player.y);
            e.pathTimer = 60;
        }

        let tx, ty;
        if (hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize)) {
            tx = player.x; ty = player.y; e.path = [];
        } else if (e.path.length > 0) {
            while (e.path.length > 1 && Math.hypot(e.path[0].x - e.x, e.path[0].y - e.y) < TILE * 0.55) {
                e.path.shift();
            }
            for (let wi = e.path.length - 1; wi > 0; wi--) {
                if (hasLineOfSight(e.x, e.y, e.path[wi].x, e.path[wi].y, e.wallSize)) {
                    e.path.splice(0, wi);
                    break;
                }
            }
            tx = e.path[0].x; ty = e.path[0].y;
        } else {
            tx = player.x; ty = player.y;
        }

        const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        const distMult = Math.min(4.0, 1.0 + Math.max(0, distToPlayer - 500) / 350);
        let speedMult = distMult * sanSlowMult;
        let shouldMove = true;

        if (e.isNecromancerMinion && e.type === 'tank') {
            const boss = getActiveNecromancerBoss();
            if (boss) {
                const target = getNecromancerTankOrbitTarget(e, boss);
                tx = target.x;
                ty = target.y;
                shouldMove = true;
                speedMult = 1.45 * sanSlowMult;
            }
        }

        if (e.type === 'void_sniper') {
            if (e.shootAnimFrames > 0) e.shootAnimFrames--;
            if (e.cooldownFrames > 0) e.cooldownFrames--;
            if (e.voidBurstCooldown > 0) e.voidBurstCooldown--;
            if (e.voidSpikeCooldown > 0) e.voidSpikeCooldown--;
            if (e.voidWaveCooldown > 0) e.voidWaveCooldown--;
            if (e.voidSkullCooldown > 0) e.voidSkullCooldown--;
            if (e.voidDashCooldown > 0) e.voidDashCooldown--;

            const hasSight = hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize * 0.8);
            const idealMin = 340;
            const idealMax = 690;

            if (distToPlayer < idealMin) {
                tx = e.x - (player.x - e.x);
                ty = e.y - (player.y - e.y);
                shouldMove = true;
                speedMult = 1.52 * sanSlowMult;
                e.chargeFrames = 0;
            } else if (distToPlayer > idealMax || !hasSight) {
                tx = player.x;
                ty = player.y;
                shouldMove = true;
                speedMult = 1.48 * sanSlowMult;
                e.chargeFrames = 0;
            } else {
                shouldMove = false;
                speedMult = 0;
            }

            if (e.voidDashCooldown <= 0 && hasSight) {
                const toPlayer = Math.atan2(player.y - e.y, player.x - e.x);
                const strafe = Math.random() < 0.5 ? Math.PI * 0.6 : -Math.PI * 0.6;
                const dashAngle = toPlayer + strafe;
                const dashDistance = 150 + currentArenaLevel * 24;
                const nx = e.x + Math.cos(dashAngle) * dashDistance;
                const ny = e.y + Math.sin(dashAngle) * dashDistance;
                if (!wallCollision(nx, ny, e.wallSize)) {
                    e.x = nx;
                    e.y = ny;
                } else {
                    const fallbackX = e.x - Math.cos(toPlayer) * (dashDistance * 0.6);
                    const fallbackY = e.y - Math.sin(toPlayer) * (dashDistance * 0.6);
                    if (!wallCollision(fallbackX, fallbackY, e.wallSize)) {
                        e.x = fallbackX;
                        e.y = fallbackY;
                    }
                }
                e.voidDashCooldown = Math.max(30, 82 - currentArenaLevel * 7);
                e.shootAnimFrames = Math.max(e.shootAnimFrames ?? 0, 6);
            }

            if (hasSight && e.cooldownFrames <= 0) {
                e.chargeFrames++;
                const levelScale = 1 + (Math.max(1, currentArenaLevel) - 1) * 0.11;
                if (e.chargeFrames >= Math.max(8, e.sniperChargeFrames - 10)) {
                    const baseAngle = Math.atan2(player.y - e.y, player.x - e.x);
                    const roll = Math.random();

                    if (e.voidWaveCooldown <= 0 && roll > 0.7) {
                        enemyProjectiles.push({
                            x: player.x,
                            y: player.y,
                            prevX: player.x,
                            prevY: player.y,
                            velocityX: 0,
                            velocityY: 0,
                            size: 22,
                            framesLeft: VOID_WAVE_AOE_FRAMES,
                            projectileType: 'void_wave_aoe',
                            damage: Math.round(VOID_WAVE_AOE_DAMAGE * levelScale),
                            sprite: voidWaveAoeFrames[0],
                            waveMaxRadius: VOID_WAVE_AOE_MAX_RADIUS,
                            waveAnimTimer: 0,
                        });
                        e.voidWaveCooldown = Math.max(48, 126 - currentArenaLevel * 12);
                        e.cooldownFrames = Math.max(10, e.sniperCooldownFrames - 12);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 6;
                    } else if (e.voidSpikeCooldown <= 0 && roll > 0.4) {
                        const pellets = 9;
                        const spread = 0.9;
                        for (let si = 0; si < pellets; si++) {
                            const t = pellets === 1 ? 0 : si / (pellets - 1);
                            const angle = baseAngle + (t - 0.5) * spread;
                            fireVoidBossProjectile(
                                e,
                                angle,
                                'void_spike',
                                VOID_SPIKE_PROJECTILE_SPEED * levelScale,
                                VOID_SPIKE_PROJECTILE_SIZE,
                                Math.round(VOID_SPIKE_PROJECTILE_DAMAGE * levelScale),
                                VOID_SPIKE_PROJECTILE_FRAMES,
                                voidSpikeProjectileSprite
                            );
                        }
                        e.voidSpikeCooldown = Math.max(28, 74 - currentArenaLevel * 7);
                        e.cooldownFrames = Math.max(9, e.sniperCooldownFrames - 13);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 4;
                    } else if (e.voidSkullCooldown <= 0 && roll > 0.2) {
                        const skullCount = Math.min(3 + Math.floor(currentArenaLevel / 2), 6);
                        for (let si = 0; si < skullCount; si++) {
                            const angle = baseAngle + (si - (skullCount - 1) / 2) * 0.24;
                            fireVoidBossProjectile(
                                e,
                                angle,
                                'void_skull',
                                VOID_SKULL_PROJECTILE_SPEED * (0.9 + currentArenaLevel * 0.08),
                                VOID_SKULL_PROJECTILE_SIZE,
                                Math.round(VOID_SKULL_PROJECTILE_DAMAGE * levelScale),
                                VOID_SKULL_PROJECTILE_FRAMES,
                                voidSkullProjectileSprite,
                                { homingStrength: 0.1 + currentArenaLevel * 0.01 }
                            );
                        }
                        e.voidSkullCooldown = Math.max(42, 96 - currentArenaLevel * 9);
                        e.cooldownFrames = Math.max(8, e.sniperCooldownFrames - 14);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 2;
                    } else if (e.voidBurstCooldown <= 0 && roll > 0.1) {
                        const burstCount = 7;
                        const burstSpread = 0.72;
                        for (let bi = 0; bi < burstCount; bi++) {
                            const t = bi / (burstCount - 1);
                            const bAngle = baseAngle + (t - 0.5) * burstSpread;
                            const speedVariance = 1 + (Math.abs(t - 0.5) * 0.3);
                            fireVoidBossProjectile(
                                e,
                                bAngle,
                                'void_burst',
                                VOID_BURST_PROJECTILE_SPEED * levelScale * speedVariance,
                                VOID_BURST_PROJECTILE_SIZE,
                                Math.round(VOID_BURST_PROJECTILE_DAMAGE * levelScale),
                                VOID_BURST_PROJECTILE_FRAMES,
                                voidBurstProjectileSprite,
                                { appliesDashLock: true }
                            );
                        }
                        screenShake = Math.max(screenShake, 14);
                        e.voidBurstCooldown = Math.max(36, 76 - currentArenaLevel * 7);
                        e.cooldownFrames = Math.max(9, e.sniperCooldownFrames - 12);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 4;
                    } else {
                        for (let mi = -1; mi <= 1; mi++) {
                            fireVoidBossProjectile(
                                e,
                                baseAngle + mi * 0.08,
                                'void_main',
                                VOID_MAIN_PROJECTILE_SPEED * levelScale,
                                VOID_MAIN_PROJECTILE_SIZE,
                                Math.round((e.projectileDamage ?? VOID_MAIN_PROJECTILE_DAMAGE) * levelScale),
                                VOID_MAIN_PROJECTILE_FRAMES,
                                voidProjectileSprite
                            );
                        }
                        e.cooldownFrames = Math.max(8, e.sniperCooldownFrames - 12);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES;
                    }

                    e.chargeFrames = 0;
                }
            }
        } else if (e.type === 'necromancer') {
            if (e.shootAnimFrames > 0) e.shootAnimFrames--;
            if (e.cooldownFrames > 0) e.cooldownFrames--;
            if (e.necromancerSummonCooldown > 0) e.necromancerSummonCooldown--;
            if (e.necromancerVolleyCooldown > 0) e.necromancerVolleyCooldown--;
            if (e.necromancerOrbCooldown > 0) e.necromancerOrbCooldown--;
            if (e.necromancerRiftCooldown > 0) e.necromancerRiftCooldown--;

            if (e.necromancerBehaviorTimer === undefined) e.necromancerBehaviorTimer = 0;
            if (!e.necromancerBehavior) e.necromancerBehavior = 'strafe';
            if (e.necromancerAuraCooldown === undefined) e.necromancerAuraCooldown = 95;

            const hasSight = hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize * 0.75);
            const idealMin = 220;
            const idealMax = 780;

            if (e.necromancerAuraCooldown > 0) {
                e.necromancerAuraCooldown--;
            } else {
                const auraRadius = 230 + currentArenaLevel * 18;
                const auraHeal = Math.max(1, Math.floor(currentArenaLevel * 0.6));
                for (const ally of enemies) {
                    if (!ally.alive) continue;
                    if (ally === e || !ally.isNecromancerMinion) continue;
                    const distToAlly = Math.hypot(ally.x - e.x, ally.y - e.y);
                    if (distToAlly > auraRadius) continue;
                    ally.hp = Math.min(ally.maxHp, ally.hp + auraHeal);
                    ally.hpBarTimer = Math.max(ally.hpBarTimer ?? 0, 25);
                }
                e.hpBarTimer = Math.max(e.hpBarTimer ?? 0, 25);
                e.necromancerAuraCooldown = Math.max(70, 108 - currentArenaLevel * 4);
            }

            e.necromancerMoveTimer = (e.necromancerMoveTimer ?? 0) + 1;
            if (e.necromancerMoveTimer >= 28) {
                e.necromancerMoveTimer = 0;
                const toward = Math.atan2(player.y - e.y, player.x - e.x);
                const wobble = (Math.random() - 0.5) * 1.1;
                e.necromancerMoveAngle = toward + Math.PI * 0.5 + wobble;
            }

            e.necromancerBehaviorTimer = (e.necromancerBehaviorTimer ?? 0) - 1;
            if (e.necromancerBehaviorTimer <= 0) {
                const modeRoll = Math.random();
                if (modeRoll < 0.36) e.necromancerBehavior = 'retreat';
                else if (modeRoll < 0.72) e.necromancerBehavior = 'chase';
                else e.necromancerBehavior = 'strafe';
                e.necromancerBehaviorTimer = 40 + Math.floor(Math.random() * 40);
            }

            if (distToPlayer < idealMin) {
                tx = e.x - (player.x - e.x) * 0.85;
                ty = e.y - (player.y - e.y) * 0.85;
                shouldMove = true;
                speedMult = 1.92 * sanSlowMult;
                e.chargeFrames = 0;
            } else if (distToPlayer > idealMax || !hasSight) {
                tx = player.x + Math.cos(e.necromancerMoveAngle ?? 0) * 120;
                ty = player.y + Math.sin(e.necromancerMoveAngle ?? 0) * 120;
                shouldMove = true;
                speedMult = 1.88 * sanSlowMult;
                e.chargeFrames = 0;
            } else {
                const toward = Math.atan2(player.y - e.y, player.x - e.x);
                if (e.necromancerBehavior === 'retreat') {
                    tx = e.x - Math.cos(toward) * 210;
                    ty = e.y - Math.sin(toward) * 210;
                    speedMult = 1.74 * sanSlowMult;
                } else if (e.necromancerBehavior === 'chase') {
                    tx = player.x;
                    ty = player.y;
                    speedMult = 1.68 * sanSlowMult;
                } else {
                    tx = player.x + Math.cos(e.necromancerMoveAngle ?? 0) * 170;
                    ty = player.y + Math.sin(e.necromancerMoveAngle ?? 0) * 170;
                    speedMult = 1.48 * sanSlowMult;
                }
                shouldMove = true;
            }

            if (hasSight && e.cooldownFrames <= 0) {
                e.chargeFrames++;
                const levelScale = 1 + (Math.max(1, currentArenaLevel) - 1) * 0.1;
                if (e.chargeFrames >= Math.max(4, e.sniperChargeFrames - 18)) {
                    const baseAngle = Math.atan2(player.y - e.y, player.x - e.x);
                    const roll = Math.random();

                    if (e.necromancerSummonCooldown <= 0 && roll > 0.56) {
                        const summonCount = Math.min(6 + currentArenaLevel, 12);
                        for (let si = 0; si < summonCount; si++) {
                            if (!spawnNecromancerSummon(e.x, e.y)) break;
                        }
                        e.necromancerSummonCooldown = Math.max(52, 96 - currentArenaLevel * 4);
                        e.cooldownFrames = Math.max(7, e.sniperCooldownFrames - 14);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 3;
                    } else if (e.necromancerOrbCooldown <= 0 && roll > 0.34) {
                        const ring = 10;
                        for (let oi = 0; oi < ring; oi++) {
                            const angle = baseAngle + (Math.PI * 2 * oi) / ring;
                            fireVoidBossProjectile(
                                e,
                                angle,
                                'necro_orb',
                                NECROMANCER_ORB_PROJECTILE_SPEED * (0.94 + currentArenaLevel * 0.05),
                                NECROMANCER_ORB_PROJECTILE_SIZE,
                                Math.round(NECROMANCER_ORB_PROJECTILE_DAMAGE * levelScale),
                                NECROMANCER_ORB_PROJECTILE_FRAMES,
                                necromancerBurstProjectileSprite,
                                { homingStrength: 0.035 + currentArenaLevel * 0.004 }
                            );
                        }
                        e.necromancerOrbCooldown = Math.max(28, 68 - currentArenaLevel * 5);
                        e.cooldownFrames = Math.max(5, e.sniperCooldownFrames - 18);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 5;
                    } else if (e.necromancerRiftCooldown <= 0 && roll > 0.12) {
                        const lanes = 8;
                        const spread = 1.2;
                        for (let ri = 0; ri < lanes; ri++) {
                            const t = lanes === 1 ? 0 : ri / (lanes - 1);
                            const angle = baseAngle + (t - 0.5) * spread;
                            fireVoidBossProjectile(
                                e,
                                angle,
                                'necro_rift',
                                NECROMANCER_RIFT_PROJECTILE_SPEED * levelScale,
                                NECROMANCER_RIFT_PROJECTILE_SIZE,
                                Math.round(NECROMANCER_RIFT_PROJECTILE_DAMAGE * levelScale),
                                NECROMANCER_RIFT_PROJECTILE_FRAMES,
                                necromancerSpikeProjectileSprite,
                                { appliesDashLock: true }
                            );
                        }
                        e.necromancerRiftCooldown = Math.max(24, 58 - currentArenaLevel * 4);
                        e.cooldownFrames = Math.max(5, e.sniperCooldownFrames - 19);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES + 2;
                    } else {
                        const volley = 7;
                        const spread = 0.92;
                        for (let vi = 0; vi < volley; vi++) {
                            const t = volley === 1 ? 0 : vi / (volley - 1);
                            const angle = baseAngle + (t - 0.5) * spread;
                            fireVoidBossProjectile(
                                e,
                                angle,
                                'necro_bolt',
                                NECROMANCER_BOLT_PROJECTILE_SPEED * levelScale,
                                NECROMANCER_BOLT_PROJECTILE_SIZE,
                                Math.round((e.projectileDamage ?? NECROMANCER_BOLT_PROJECTILE_DAMAGE) * levelScale),
                                NECROMANCER_BOLT_PROJECTILE_FRAMES,
                                necromancerProjectileSprite
                            );
                        }
                        e.necromancerVolleyCooldown = Math.max(22, 48 - currentArenaLevel * 3);
                        e.cooldownFrames = Math.max(4, e.sniperCooldownFrames - 20);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES;
                    }

                    e.chargeFrames = 0;
                }
            }
        } else if (e.type === 'sniper') {
            if (e.shootAnimFrames > 0) e.shootAnimFrames--;
            if (e.cooldownFrames > 0) e.cooldownFrames--;

            if (e.isNecromancerMinion) {
                const hasSight = hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize * 0.7);
                const spreadTarget = getNecromancerSniperSpreadTarget(e);
                const spreadDist = Math.hypot(e.x - spreadTarget.x, e.y - spreadTarget.y);

                if (distToPlayer < SNIPER_MIN_RANGE * 0.72) {
                    const retreatAngle = Math.atan2(e.y - player.y, e.x - player.x);
                    tx = e.x + Math.cos(retreatAngle) * 210 + (spreadTarget.x - e.x) * 0.3;
                    ty = e.y + Math.sin(retreatAngle) * 210 + (spreadTarget.y - e.y) * 0.3;
                    shouldMove = true;
                    speedMult = 1.62 * sanSlowMult;
                    e.chargeFrames = 0;
                } else {
                    tx = spreadTarget.x;
                    ty = spreadTarget.y;
                    shouldMove = spreadDist > 24;
                    speedMult = 1.24 * sanSlowMult;
                }

                if (hasSight && e.cooldownFrames <= 0 && distToPlayer <= SNIPER_RANGE * 1.35) {
                    e.chargeFrames++;
                    if (e.chargeFrames >= Math.max(10, e.sniperChargeFrames - 12)) {
                        const angle = Math.atan2(player.y - e.y, player.x - e.x);
                        const sx = e.x + Math.cos(angle) * (e.size + 10);
                        const sy = e.y + Math.sin(angle) * (e.size + 10);
                        enemyProjectiles.push({
                            x: sx,
                            y: sy,
                            prevX: sx,
                            prevY: sy,
                            velocityX: Math.cos(angle) * SNIPER_PROJECTILE_SPEED,
                            velocityY: Math.sin(angle) * SNIPER_PROJECTILE_SPEED,
                            size: SNIPER_PROJECTILE_SIZE,
                            framesLeft: SNIPER_PROJECTILE_FRAMES,
                            projectileType: 'sniper',
                            damage: e.projectileDamage,
                            sprite: getSniperProjectileSpriteForLevel(),
                        });

                        e.chargeFrames = 0;
                        e.cooldownFrames = Math.max(14, e.sniperCooldownFrames - 8);
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES;
                    }
                } else if (!hasSight) {
                    e.chargeFrames = 0;
                }
            } else {

            if (e.teleportCooldown === undefined) e.teleportCooldown = 180 + Math.floor(Math.random() * 120);
            if (!e.teleporting && e.teleportCooldown > 0) e.teleportCooldown--;

            if (e.teleporting) {
                shouldMove = false;
                speedMult = 0;
                e.teleportTimer = (e.teleportTimer ?? 0) + 1;
                const framesPerCell = 4;
                const totalFrames = sniperTeleportFrames.length * framesPerCell;
                if (e.teleportPhase === 'out' && e.teleportTimer >= totalFrames) {
                    const teleportDist = SNIPER_MIN_RANGE + Math.random() * (SNIPER_RANGE - SNIPER_MIN_RANGE - 60);
                    const teleportAngle = Math.random() * Math.PI * 2;
                    for (let attempt = 0; attempt < 16; attempt++) {
                        const ang = teleportAngle + attempt * (Math.PI * 2 / 16);
                        const cx = player.x + Math.cos(ang) * teleportDist;
                        const cy = player.y + Math.sin(ang) * teleportDist;
                        if (!wallCollision(cx, cy, e.wallSize)) {
                            cx < TILE * 2 ||
                            cx > MAP_W * TILE - TILE * 2 ||
                            cy < TILE * 2 ||
                            cy > MAP_H * TILE - TILE * 2
                        } continue;

                        if (!wallCollision(cx, cy, e.wallSize)) {
                            e.x = cx;
                            e.y = cy;
                            e.prevX = cx;
                            e.prevY = cy;
                            break;
                        }
                    }
                    e.teleportPhase = 'in';
                    e.teleportTimer = 0;
                } else if (e.teleportPhase === 'in' && e.teleportTimer >= totalFrames) {
                    e.teleporting = false;
                    e.teleportPhase = null;
                    e.teleportTimer = 0;
                    e.stuckFrames = 0;
                    e.fleeAngleBias = 0;
                    e.chargeFrames = 0;
                    e.teleportCooldown = 180 + Math.floor(Math.random() * 120);
                    const shotgunPellets = 6;
                    const shotgunSpread = 0.55;
                    const baseAngle = Math.atan2(player.y - e.y, player.x - e.x);
                    for (let pi = 0; pi < shotgunPellets; pi++) {
                        const t = pi / (shotgunPellets - 1);
                        const pelletAngle = baseAngle + (t - 0.5) * shotgunSpread;
                        enemyProjectiles.push({
                            x: e.x + Math.cos(pelletAngle) * (e.size + 10),
                            y: e.y + Math.sin(pelletAngle) * (e.size + 10),
                            prevX: e.x, prevY: e.y,
                            velocityX: Math.cos(pelletAngle) * SNIPER_PROJECTILE_SPEED,
                            velocityY: Math.sin(pelletAngle) * SNIPER_PROJECTILE_SPEED,
                            size: SNIPER_PROJECTILE_SIZE,
                            framesLeft: SNIPER_PROJECTILE_FRAMES,
                            projectileType: 'sniper',
                            damage: e.projectileDamage,
                            sprite: getSniperProjectileSpriteForLevel(),
                        });
                    }
                    e.cooldownFrames = e.sniperCooldownFrames;
                    e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES;
                }
            } else if (e.teleportCooldown <= 0) {
                e.teleporting = true;
                e.teleportPhase = 'out';
                e.teleportTimer = 0;
                shouldMove = false;
                speedMult = 0;
            } else {
                const hasSight = hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize * 0.7);
                const inAttackRange = distToPlayer >= SNIPER_MIN_RANGE && distToPlayer <= SNIPER_RANGE;

                if (distToPlayer < SNIPER_MIN_RANGE) {
                    const fleeAngle = Math.atan2(e.y - player.y, e.x - player.x) + (e.fleeAngleBias ?? 0);
                    tx = e.x + Math.cos(fleeAngle) * SNIPER_MIN_RANGE * 1.5;
                    ty = e.y + Math.sin(fleeAngle) * SNIPER_MIN_RANGE * 1.5;
                    e.chargeFrames = 0;
                } else if (!inAttackRange || !hasSight) {
                    e.fleeAngleBias = 0;
                    tx = player.x;
                    ty = player.y;
                    e.chargeFrames = 0;
                } else {
                    e.fleeAngleBias = 0;
                    shouldMove = false;
                    speedMult = 0;

                    if (e.cooldownFrames <= 0) {
                        e.chargeFrames++;
                        if (e.chargeFrames >= e.sniperChargeFrames) {
                            const angle = Math.atan2(player.y - e.y, player.x - e.x);
                            const sx = e.x + Math.cos(angle) * (e.size + 10);
                            const sy = e.y + Math.sin(angle) * (e.size + 10);
                            enemyProjectiles.push({
                                x: sx,
                                y: sy,
                                prevX: sx,
                                prevY: sy,
                                velocityX: Math.cos(angle) * SNIPER_PROJECTILE_SPEED,
                                velocityY: Math.sin(angle) * SNIPER_PROJECTILE_SPEED,
                                size: SNIPER_PROJECTILE_SIZE,
                                framesLeft: SNIPER_PROJECTILE_FRAMES,
                                projectileType: 'sniper',
                                damage: e.projectileDamage,
                                sprite: getSniperProjectileSpriteForLevel(),
                            });

                            e.chargeFrames = 0;
                            e.cooldownFrames = e.sniperCooldownFrames;
                            e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES;
                        }
                    }
                }
            }
            }
        }

        const moved = !shouldMove || moveEnemyToward(e, tx, ty, e.speed * speedMult);
        if (!moved) {
            e.path = [];
            e.pathTimer = 0;
            if (e.type === 'sniper' && !e.isNecromancerMinion && !e.teleporting) {
                e.stuckFrames = (e.stuckFrames ?? 0) + 1;
                if (e.stuckFrames >= 45) {
                    e.teleporting = true;
                    e.teleportPhase = 'out';
                    e.teleportTimer = 0;
                } else if (distToPlayer < SNIPER_MIN_RANGE) {
                    e.fleeAngleBias = ((e.fleeAngleBias ?? 0) + (Math.random() < 0.5 ? 0.55 : -0.55));
                }
            } else if (e.type === 'necromancer') {
                e.necromancerMoveAngle = (e.necromancerMoveAngle ?? 0) + (Math.random() < 0.5 ? 0.55 : -0.55);
            }
        } else if (e.type === 'sniper' && !e.isNecromancerMinion) {
            e.stuckFrames = 0;
        }


        for (const o of enemies) {
            if (o === e || !o.alive) continue;
            const dx = e.x - o.x, dy = e.y - o.y;
            const dist = Math.hypot(dx, dy), md = e.size + o.size;
            if (dist < md && dist > 0) {
                const ov = (md - dist) * 0.5, nx = dx / dist, ny = dy / dist;
                if (!wallCollision(e.x + nx * ov, e.y,               e.wallSize)) e.x += nx * ov;
                if (!wallCollision(e.x,            e.y + ny * ov,     e.wallSize)) e.y += ny * ov;
                if (!wallCollision(o.x - nx * ov, o.y,               o.wallSize ?? o.size)) o.x -= nx * ov;
                if (!wallCollision(o.x,            o.y - ny * ov,     o.wallSize ?? o.size)) o.y -= ny * ov;
            }
        }

        if (e.hitFlash  > 0) e.hitFlash--;
        if (e.hpBarTimer > 0) e.hpBarTimer--;

        e.animTimer--;
        if (e.animTimer <= 0) {
            const frames = getEnemySpriteFrames(e.type);
            const frameCount = (e.type === 'sniper' || e.type === 'void_sniper' || e.type === 'necromancer')
                ? Math.max(1, Math.min(3, frames.length))
                : Math.max(1, frames.length);
            e.animFrame = (e.animFrame + 1) % frameCount;
            e.animTimer = ENEMY_TYPES[e.type].animSpeed;
        }
    }
}

// Solves the intercept angle for a moving target.
function getInterceptAimAngle(sourceX, sourceY, targetX, targetY, targetVx, targetVy, projectileSpeed) {
    const rx = targetX - sourceX;
    const ry = targetY - sourceY;
    const vv = targetVx * targetVx + targetVy * targetVy;
    const rv = rx * targetVx + ry * targetVy;
    const rr = rx * rx + ry * ry;
    const a = vv - projectileSpeed * projectileSpeed;
    const b = 2 * rv;
    const c = rr;


    let t = -1;
    if (Math.abs(a) < 0.000001) {
        if (Math.abs(b) > 0.000001) t = -c / b;
    } else {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
            const sqrtDisc = Math.sqrt(disc);
            const t1 = (-b - sqrtDisc) / (2 * a);
            const t2 = (-b + sqrtDisc) / (2 * a);
            const valid = [t1, t2].filter(v => v > 0);
            if (valid.length > 0) t = Math.min(...valid);
        }
    }

    if (!(t > 0 && Number.isFinite(t))) {
        return Math.atan2(ry, rx);
    }

    const aimX = targetX + targetVx * t;
    const aimY = targetY + targetVy * t;
    return Math.atan2(aimY - sourceY, aimX - sourceX);
}

// Advances turret targeting charge and firing.
function updateTumorTurrets() {
    if (tumorTurrets.length === 0) return;

    for (const t of tumorTurrets) {
        if (!t.alive) continue;

        if (t.hitFlash > 0) t.hitFlash--;
        if (t.hpBarTimer > 0) t.hpBarTimer--;
        if (t.shootAnimFrames > 0) t.shootAnimFrames--;
        if (t.cooldownFrames > 0) t.cooldownFrames--;

        const dx = player.x - t.x;
        const dy = player.y - t.y;
        const dist = Math.hypot(dx, dy);
        if (dist > TUMOR_RANGE || !hasLineOfSight(t.x, t.y, player.x, player.y, t.size * 0.5)) {
            t.chargeFrames = 0;
            continue;
        }

        if (t.cooldownFrames > 0) continue;
        t.chargeFrames++;

        if (t.chargeFrames >= TUMOR_CHARGE_FRAMES) {
            const playerVx = player.x - (player.prevX ?? player.x);
            const playerVy = player.y - (player.prevY ?? player.y);

            const angle = getInterceptAimAngle(
                t.x,
                t.y,
                player.x,
                player.y,
                playerVx,
                playerVy,
                TUMOR_PROJECTILE_SPEED
            );
            const sx = t.x + Math.cos(angle) * (t.size + 8);
            const sy = t.y + Math.sin(angle) * (t.size + 8);
            enemyProjectiles.push({
                x: sx,
                y: sy,
                prevX: sx,
                prevY: sy,
                velocityX: Math.cos(angle) * TUMOR_PROJECTILE_SPEED,
                velocityY: Math.sin(angle) * TUMOR_PROJECTILE_SPEED,
                size: TUMOR_PROJECTILE_SIZE,
                framesLeft: TUMOR_PROJECTILE_FRAMES,
                projectileType: 'tumor',
                damage: TUMOR_PROJECTILE_DAMAGE,
            });

            t.chargeFrames = 0;
            t.cooldownFrames = TUMOR_COOLDOWN_FRAMES;
            t.shootAnimFrames = TUMOR_SHOOT_ANIM_FRAMES;
        }
    }
}

// Draws regular enemies and boss enemies.
function drawEnemies() {
    const innerR = 120, outerR = 420;

    for (const e of enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (fogEnabled && dist >= outerR) continue;

        const alpha = fogEnabled && dist > innerR ? 1 - (dist - innerR) / (outerR - innerR) : 1;
        const rx  = (e.prevX ?? e.x) + (e.x - (e.prevX ?? e.x)) * renderAlpha;
        const ry  = (e.prevY ?? e.y) + (e.y - (e.prevY ?? e.y)) * renderAlpha;
        const sc  = toScreen(rx, ry);
        const isSniperType = e.type === 'sniper';
        const drawScale = isSniperType ? 1.6 : 1.0;
        const sz  = e.size * 2 * drawScale;
        const frames = e.isNecromancerMinion
            ? (NECROMANCER_MINION_SPRITES[e.necromancerMinionKind] ?? getEnemySpriteFrames(e.type))
            : e.isNecromancerBoss
            ? NECROMANCER_BOSS_SPRITE_FRAMES
            : (e.isBoss && !e.isVoidBoss) ? BOSS_ENEMY_SPRITE_FRAMES : getEnemySpriteFrames(e.type);
        const walkFrameCount = (e.type === 'sniper' || e.type === 'void_sniper' || e.type === 'necromancer')
            ? Math.max(1, Math.min(3, frames.length))
            : Math.max(1, frames.length);
        const walkSprite = frames[e.animFrame % walkFrameCount] ?? frames[0];
        const sprite = (e.type === 'sniper' || e.type === 'void_sniper' || e.type === 'necromancer') && e.shootAnimFrames > 0 && frames.length >= 4
            ? frames[3]
            : walkSprite;

        if (e.isNecromancerBoss) {
            const auraRadius = 230 + currentArenaLevel * 18;
            const auraCycle = ((e.necromancerAuraCooldown ?? 0) % 32) / 32;
            const auraPulse = 1 + Math.sin(auraCycle * Math.PI * 2) * 0.05;
            const auraDrawRadius = auraRadius * auraPulse;
            const auraDrawSize = auraDrawRadius * 2;

            ctx.save();
            ctx.globalAlpha = alpha * 0.42;
            ctx.drawImage(
                necromancerAuraOutlineSprite,
                sc.x - auraDrawSize / 2,
                sc.y - auraDrawSize / 2,
                auraDrawSize,
                auraDrawSize
            );
            ctx.strokeStyle = 'rgba(90,255,154,0.9)';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(60,255,120,0.45)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, auraDrawRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = isSniperType && e.teleporting ? alpha * 0.3 : alpha;
        if (e.hitFlash > 0) ctx.filter = 'brightness(10)';
        else if (e.type === 'necromancer' || e.isNecromancerMinion) ctx.filter = 'hue-rotate(115deg) saturate(1.25)';

        const half = sz / 2;
        if (player.x < e.x) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -(sc.x + half), sc.y - half, sz, sz);
        } else {
            ctx.drawImage(sprite, sc.x - half, sc.y - half, sz, sz);
        }
        ctx.restore();

        if (isSniperType && e.teleporting && sniperTeleportFrames.length > 0) {
            const framesPerCell = 4;
            const frameIdx = Math.min(
                sniperTeleportFrames.length - 1,
                Math.floor((e.teleportTimer ?? 0) / framesPerCell)
            );
            const tSprite = sniperTeleportFrames[
                e.teleportPhase === 'in' ? sniperTeleportFrames.length - 1 - frameIdx : frameIdx
            ];
            const tSz = sz * 1.4;
            ctx.save();
            ctx.globalAlpha = alpha * 0.92;
            ctx.drawImage(tSprite, sc.x - tSz / 2, sc.y - tSz / 2, tSz, tSz);
            ctx.restore();
        }

        if (e.isBoss) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = 'rgba(210,120,255,0.9)';
            ctx.shadowColor = 'rgba(210,120,255,0.8)';
            ctx.shadowBlur = 14;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, e.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (alpha > 0.15 && e.hpBarTimer > 0) {
            const bw = e.size * 2, bh = 4, hf = e.hp / e.maxHp;
            const bx = sc.x - bw / 2, by = sc.y - e.size - 12;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#000000';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = hf > 0.5 ? '#00ff00' : hf > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(bx, by, bw * hf, bh);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 1;
            ctx.strokeRect(bx, by, bw, bh);

            if (e.isBoss) {
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,230,255,0.95)';
                ctx.fillText(e.bossName ?? 'BOSS', sc.x, by - 3);
            }
            ctx.restore();
        }
    }
}

// Draws tumor turrets and their charge effects.
function drawTumorTurrets() {
    const innerR = 120, outerR = 420;

    for (const t of tumorTurrets) {
        if (!t.alive) continue;
        const dist = Math.hypot(player.x - t.x, player.y - t.y);
        if (fogEnabled && dist >= outerR) continue;

        const alpha = fogEnabled && dist > innerR ? 1 - (dist - innerR) / (outerR - innerR) : 1;
        const rx  = (t.prevX ?? t.x) + (t.x - (t.prevX ?? t.x)) * renderAlpha;
        const ry  = (t.prevY ?? t.y) + (t.y - (t.prevY ?? t.y)) * renderAlpha;
        const sc  = toScreen(rx, ry);
        const sprite = t.shootAnimFrames > 0 ? tumorShootSprite : tumorIdleSprite;
        const sizePx = t.size * 2.2;

        const chargeProgress = t.cooldownFrames > 0
            ? 0
            : Math.max(0, Math.min(1, t.chargeFrames / TUMOR_CHARGE_FRAMES));

        if (chargeProgress > 0.04) {

            const auraIntensity = 0.6 + chargeProgress * 0.35;
            const innerAuraRadius = t.size * 0.8;
            const outerAuraRadius = t.size * (1.2 + chargeProgress * 0.8);

            const auraGradient = ctx.createRadialGradient(sc.x, sc.y, innerAuraRadius, sc.x, sc.y, outerAuraRadius);
            auraGradient.addColorStop(0, `rgba(255,100,100,${auraIntensity.toFixed(3)})`);
            auraGradient.addColorStop(0.4, `rgba(220,50,50,${(auraIntensity * 0.7).toFixed(3)})`);
            auraGradient.addColorStop(0.7, `rgba(150,0,0,${(auraIntensity * 0.3).toFixed(3)})`);
            auraGradient.addColorStop(1, 'rgba(80,0,0,0)');

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, outerAuraRadius, 0, Math.PI * 2);
            ctx.fill();


            const corePulse = 0.8 + 0.2 * Math.sin(frameCount * 0.15 + (t.x + t.y) * 0.01);
            const coreGlowRadius = t.size * 0.5 * corePulse;
            const coreGlow = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, coreGlowRadius);
            coreGlow.addColorStop(0, `rgba(255,150,100,${(chargeProgress * 0.8).toFixed(3)})`);
            coreGlow.addColorStop(1, 'rgba(255,80,80,0)');
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, coreGlowRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        if (t.hitFlash > 0) ctx.filter = 'brightness(10)';

        ctx.beginPath();
        ctx.arc(sc.x, sc.y, sizePx / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(sprite, sc.x - sizePx / 2, sc.y - sizePx / 2, sizePx, sizePx);
        ctx.restore();

        if (alpha > 0.15 && t.hpBarTimer > 0) {
            const bw = t.size * 2.2;
            const bh = 4;
            const hf = t.hp / t.maxHp;
            const bx = sc.x - bw / 2;
            const by = sc.y - t.size - 16;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#000000';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = hf > 0.5 ? '#00ff00' : hf > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(bx, by, bw * hf, bh);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 1;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.restore();
        }
    }
}

