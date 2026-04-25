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
    const baseSniperWeights = {
        1: 0.07,
        2: 0.14,
        3: 0.22,
        4: 0.3,
        5: 0.38,
    };
    const waveBonus = Math.min(0.14, Math.max(0, currentWave - 1) * 0.03);
    const sniperWeight = (baseSniperWeights[level] ?? 0.07) + waveBonus;
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
    const hp = variantStats.hp ?? spec.hp;
    const speed = variantStats.speed ?? spec.speed;
    const wallSize = type === 'tank' ? spec.size * 0.8 : spec.size;
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

        if (e.type === 'sniper') {
            if (e.shootAnimFrames > 0) e.shootAnimFrames--;
            if (e.cooldownFrames > 0) e.cooldownFrames--;

            const hasSight = hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize * 0.7);
            const inAttackRange = distToPlayer >= SNIPER_MIN_RANGE && distToPlayer <= SNIPER_RANGE;

            if (distToPlayer < SNIPER_MIN_RANGE) {
                tx = e.x - (player.x - e.x);
                ty = e.y - (player.y - e.y);
                e.chargeFrames = 0;
            } else if (!inAttackRange || !hasSight) {
                tx = player.x;
                ty = player.y;
                e.chargeFrames = 0;
            } else {
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
                        });

                        e.chargeFrames = 0;
                        e.cooldownFrames = e.sniperCooldownFrames;
                        e.shootAnimFrames = SNIPER_SHOOT_ANIM_FRAMES;
                    }
                }
            }
        }

        const moved = !shouldMove || moveEnemyToward(e, tx, ty, e.speed * speedMult);
        if (!moved) {

            e.path = [];
            e.pathTimer = 0;
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
            const frameCount = e.type === 'sniper'
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
        const sz  = e.size * 2;
        const frames = e.isBoss ? BOSS_ENEMY_SPRITE_FRAMES : getEnemySpriteFrames(e.type);
        const walkFrameCount = e.type === 'sniper'
            ? Math.max(1, Math.min(3, frames.length))
            : Math.max(1, frames.length);
        const walkSprite = frames[e.animFrame % walkFrameCount] ?? frames[0];
        const sprite = e.type === 'sniper' && e.shootAnimFrames > 0 && frames.length >= 4
            ? frames[3]
            : walkSprite;

        ctx.save();
        ctx.globalAlpha = alpha;
        if (e.hitFlash > 0) ctx.filter = 'brightness(10)';

        if (player.x < e.x) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -(sc.x + e.size), sc.y - e.size, sz, sz);
        } else {
            ctx.drawImage(sprite, sc.x - e.size, sc.y - e.size, sz, sz);
        }
        ctx.restore();

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

