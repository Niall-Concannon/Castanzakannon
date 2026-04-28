// Projectile motion hits and beam effects are handled here.




// Segment Circle Hit keeps the game logic moving.
function segmentCircleHit(x1, y1, x2, y2, cx, cy, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.000001) {
        return Math.hypot(cx - x1, cy - y1) <= radius;
    }

    const tRaw = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
    const t = Math.max(0, Math.min(1, tRaw));
    const nx = x1 + dx * t;
    const ny = y1 + dy * t;
    return Math.hypot(cx - nx, cy - ny) <= radius;
}

// Has Active Ammo Pickup keeps the game logic moving.
function hasActiveAmmoPickup() {
    for (const p of pickups) {
        if (p.type === 'ammo') return true;
    }
    return false;
}

// Has Active Heal Pickup keeps the game logic moving.
function hasActiveHealPickup() {
    for (const p of pickups) {
        if (p.type === 'heal') return true;
    }
    return false;
}

// Has Active Instakill Pickup keeps the game logic moving.
function hasActiveInstakillPickup() {
    for (const p of pickups) {
        if (p.type === 'instakill') return true;
    }
    return false;
}

// Spawn Dev Mode Powerup Line keeps the game logic moving.
function spawnDevModePowerupLine() {
    if (!devTestMode) return;

    const centerX = player.x;
    const y = player.y - 72;
    const spacing = 44;

    pickups.push({
        x: centerX - spacing, y, prevX: centerX - spacing, prevY: y,
        vx: 0, vy: 0,
        size: HEAL_PICKUP_WORLD_SIZE,
        type: 'heal',
    });

    pickups.push({
        x: centerX, y, prevX: centerX, prevY: y,
        vx: 0, vy: 0,
        size: AMMO_PICKUP_WORLD_SIZE,
        type: 'ammo',
        value: AMMO_PICKUP_VALUE_MIN,
    });

    pickups.push({
        x: centerX + spacing, y, prevX: centerX + spacing, prevY: y,
        vx: 0, vy: 0,
        size: INSTAKILL_PICKUP_WORLD_SIZE,
        type: 'instakill',
    });
}

// Picks the next bounce target for a snake projectile (nearest hostile not visited yet).
function pickBounceTarget(p, originX, originY) {
    const range = p.bounceRange ?? SNAKE_BOUNCE_RANGE;
    let best = null;
    let bestDist = range;
    for (const e of enemies) {
        if (!e.alive || p.visited.has(e)) continue;
        const dist = Math.hypot(e.x - originX, e.y - originY);
        if (dist < bestDist) { bestDist = dist; best = e; }
    }
    for (const t of tumorTurrets) {
        if (!t.alive || p.visited.has(t)) continue;
        const dist = Math.hypot(t.x - originX, t.y - originY);
        if (dist < bestDist) { bestDist = dist; best = t; }
    }
    return best;
}

// Routes a hit through bounce/slow effects; returns true if the projectile should despawn.
function consumeProjectileHit(p, target) {
    if (p.appliesSlow) {
        const slowFrames = p.slowFrames ?? VOID_SNAKE_SLOW_FRAMES;
        const slowMult = p.slowMult ?? VOID_SNAKE_SLOW_MULT;
        target.slowFrames = Math.max(target.slowFrames ?? 0, slowFrames);
        target.slowMult = Math.min(target.slowMult ?? 1, slowMult);
    }
    if ((p.bouncesLeft ?? 0) > 0) {
        p.visited.add(target);
        p.bouncesLeft--;
        const next = pickBounceTarget(p, target.x, target.y);
        if (!next) return true;
        const speed = Math.hypot(p.velocityX, p.velocityY) || NECRO_SNAKE_PROJECTILE_SPEED;
        const a = Math.atan2(next.y - target.y, next.x - target.x);
        p.velocityX = Math.cos(a) * speed;
        p.velocityY = Math.sin(a) * speed;
        return false;
    }
    if ((p.piercesLeft ?? 0) > 0) {
        p.piercesLeft--;
        return false;
    }
    return true;
}

// Update Projectiles keeps the game logic moving.
function updateProjectiles() {
    updateRailgunBeams();

    // Snapshot the array reference so that if completeVoidEncounterVictory replaces
    // the global `projectiles` mid-loop (void boss killed by a projectile), the loop
    // keeps a stable reference and won't read undefined entries from the new array.
    const arr = projectiles;
    for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        const oldX = p.x;
        const oldY = p.y;
        p.lastHitFrame = -1;
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.framesLeft--;

        const ignoreWalls = (p.bouncesLeft ?? 0) > 0 || p.visited;
        if ((!ignoreWalls && wallCollision(p.x, p.y, p.size)) || p.framesLeft <= 0) {
            arr.splice(i, 1);
            continue;
        }

        let hitThisFrame = false;
        for (const t of tumorTurrets) {
            if (!t.alive) continue;
            if (p.visited?.has(t)) continue;

            if (segmentCircleHit(oldX, oldY, p.x, p.y, t.x, t.y, p.size + t.size)) {
                const turretDamageBase = player.instakillTimer > 0 ? t.hp : player.bulletDamage;
                let turretDamage = getCurrentProjectileDamage(turretDamageBase, t);
                if (p.isCrit) turretDamage = Math.round(turretDamage * (p.critMult ?? 1.75));
                applyEnemyDamage(t, turretDamage, { sourceX: p.x, sourceY: p.y, sourceProjectile: p });
                hitThisFrame = true;
                p.lastHitFrame = frameCount;
                if (consumeProjectileHit(p, t)) {
                    arr.splice(i, 1);
                }
                break;
            }
        }

        if (hitThisFrame || p.lastHitFrame === frameCount) continue;
        if (!arr[i]) continue;

        for (const e of enemies) {
            if (!e.alive) continue;
            if (p.visited?.has(e)) continue;
            if (segmentCircleHit(oldX, oldY, p.x, p.y, e.x, e.y, p.size + e.size)) {
                const enemyDamageBase = player.instakillTimer > 0 ? e.hp : player.bulletDamage;
                let enemyDamage = getCurrentProjectileDamage(enemyDamageBase, e);
                if (p.isCrit) enemyDamage = Math.round(enemyDamage * (p.critMult ?? 1.75));
                applyEnemyDamage(e, enemyDamage, { sourceX: p.x, sourceY: p.y, sourceProjectile: p });
                p.lastHitFrame = frameCount;

                if (consumeProjectileHit(p, e)) {
                    arr.splice(i, 1);
                }
                break;
            }
        }
    }
}

// Draw Projectiles keeps the game logic moving.
function drawProjectiles() {
    for (const p of projectiles) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const sc  = toScreen(prx, pry);
        const sprite = p.sprite ?? projectileSprite;
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(Math.atan2(p.velocityY, p.velocityX));
        if (p.lengthMultiplier && p.lengthMultiplier > 1) {
            const drawH = p.size * 2;
            const drawW = drawH * p.lengthMultiplier;
            ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.drawImage(sprite, -p.size, -p.size, p.size * 2, p.size * 2);
        }
        ctx.restore();
    }

    for (const beam of railgunBeams) {
        const s1 = toScreen(beam.x1, beam.y1);
        const s2 = toScreen(beam.x2, beam.y2);
        const life = beam.life / Math.max(1, beam.maxLife);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = `rgba(255,170,240,${0.85 * life})`;
        ctx.lineWidth = 8 * life;
        ctx.shadowColor = 'rgba(255,110,220,0.95)';
        ctx.shadowBlur = 22 * life;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255,255,255,${0.95 * life})`;
        ctx.lineWidth = 2.5 * life;
        ctx.shadowBlur = 8 * life;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
        ctx.restore();
    }
}

// Update Enemy Projectiles keeps the game logic moving.
function updateEnemyProjectiles() {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        let oldX = p.x;
        let oldY = p.y;

        if (p.projectileType === 'void_skull' || p.projectileType === 'necro_orb' || p.projectileType === 'water_homing') {
            const aim = Math.atan2(player.y - p.y, player.x - p.x);
            const speed = Math.hypot(p.velocityX, p.velocityY);
            const steer = p.homingStrength ?? 0.06;
            p.velocityX += (Math.cos(aim) * speed - p.velocityX) * steer;
            p.velocityY += (Math.sin(aim) * speed - p.velocityY) * steer;
        }

        if (p.projectileType === 'void_wave_aoe' || p.projectileType === 'water_wave_aoe') {
            const maxRadius = p.waveMaxRadius ?? VOID_WAVE_AOE_MAX_RADIUS;
            const waveFrames = p.projectileType === 'water_wave_aoe' ? 60 : VOID_WAVE_AOE_FRAMES;
            const lifeUsed = Math.max(0, waveFrames - p.framesLeft);
            const progress = Math.max(0, Math.min(1, lifeUsed / Math.max(1, waveFrames)));
            p.size = 18 + maxRadius * progress;
            p.waveAnimTimer = (p.waveAnimTimer ?? 0) + 1;
            if (p.projectileType === 'water_wave_aoe') {
                const waterBoss = enemies.find(e => e.alive && e.isWaterBoss);
                if (waterBoss) {
                    oldX = waterBoss.x;
                    oldY = waterBoss.y;
                    p.x = waterBoss.x;
                    p.y = waterBoss.y;
                }
            }
            p.velocityX = 0;
            p.velocityY = 0;
        }

        p.x += p.velocityX;
        p.y += p.velocityY;
        p.framesLeft--;

        const ignoreWalls = p.projectileType === 'void_wave_aoe' || p.projectileType === 'water_wave_aoe' || p.ignoreWalls;
        if ((!ignoreWalls && wallCollision(p.x, p.y, p.size)) || p.framesLeft <= 0) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        if (segmentCircleHit(oldX, oldY, p.x, p.y, player.x, player.y, player.size + p.size)) {
            if (player.invulnTimer <= 0) {
                applyPlayerDamage(p.damage ?? TUMOR_PROJECTILE_DAMAGE);
                player.invulnTimer = 60;
                if (p.projectileType === 'void_burst' || p.appliesDashLock) {
                    player.dashLockFrames = Math.max(player.dashLockFrames ?? 0, VOID_BURST_DASH_LOCK_FRAMES);
                    player.dashCooldown = Math.max(player.dashCooldown ?? 0, player.dashRechargeFrames ?? 120);
                }
            }
            if (p.projectileType !== 'void_wave_aoe' && p.projectileType !== 'water_wave_aoe') {
                enemyProjectiles.splice(i, 1);
            }
        }
    }
}

// Draw Enemy Projectiles keeps the game logic moving.
function drawEnemyProjectiles() {
    for (const p of enemyProjectiles) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const sc  = toScreen(prx, pry);

        let sprite = enemyProjectileSprite;
        if (p.projectileType === 'sniper') sprite = p.sprite ?? sniperProjectileSprite;
        else if (p.projectileType === 'void_main') sprite = p.sprite ?? voidProjectileSprite;
        else if (p.projectileType === 'void_burst') sprite = p.sprite ?? voidBurstProjectileSprite;
        else if (p.projectileType === 'void_skull') sprite = p.sprite ?? voidSkullProjectileSprite;
        else if (p.projectileType === 'void_spike') sprite = p.sprite ?? voidSpikeProjectileSprite;
        else if (p.projectileType === 'necro_bolt') sprite = p.sprite ?? necromancerProjectileSprite;
        else if (p.projectileType === 'necro_orb') sprite = p.sprite ?? necromancerBurstProjectileSprite;
        else if (p.projectileType === 'necro_rift') sprite = p.sprite ?? necromancerSpikeProjectileSprite;
        else if (p.projectileType === 'water_shot') sprite = p.sprite ?? waterShotProjectileSprite;
        else if (p.projectileType === 'water_homing') sprite = p.sprite ?? waterHomingProjectileSprite;

        if (p.projectileType === 'void_wave_aoe' || p.projectileType === 'water_wave_aoe') {
            const frames = p.projectileType === 'water_wave_aoe' ? waterWaveAoeFrames : voidWaveAoeFrames;
            const animIndex = Math.floor((p.waveAnimTimer ?? 0) / 4) % frames.length;
            const waveSprite = frames[animIndex] ?? frames[0];
            ctx.save();
            ctx.globalAlpha = 0.86;
            ctx.translate(sc.x, sc.y);
            const waveSize = p.size * 2;
            ctx.drawImage(waveSprite, -waveSize, -waveSize, waveSize * 2, waveSize * 2);
            ctx.restore();
            continue;
        }

        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(Math.atan2(p.velocityY, p.velocityX));
        if (p.projectileType === 'necro_bolt' || p.projectileType === 'necro_orb' || p.projectileType === 'necro_rift') {
            ctx.filter = 'hue-rotate(115deg) saturate(1.2)';
        }
        if (p.projectileType === 'void_burst' || p.projectileType === 'necro_orb') {
            const pulse = 0.75 + Math.sin((p.framesLeft ?? 0) * 0.28) * 0.25;
            ctx.shadowColor = p.projectileType === 'necro_orb' ? '#5ae6b0' : '#b060ff';
            ctx.shadowBlur = 28 * pulse;
            ctx.globalAlpha = 0.92;
            const s = p.size * (1 + pulse * 0.18);
            ctx.drawImage(sprite, -s, -s, s * 2, s * 2);
            ctx.shadowBlur = 0;
        } else {
            ctx.drawImage(sprite, -p.size, -p.size, p.size * 2, p.size * 2);
        }
        ctx.restore();
    }
}

