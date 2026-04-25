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

// Update Projectiles keeps the game logic moving.
function updateProjectiles() {
    updateRailgunBeams();

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const oldX = p.x;
        const oldY = p.y;
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.framesLeft--;

        if (wallCollision(p.x, p.y, p.size) || p.framesLeft <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        for (const t of tumorTurrets) {
            if (!t.alive) continue;

            if (segmentCircleHit(oldX, oldY, p.x, p.y, t.x, t.y, p.size + t.size)) {
                const turretDamageBase = player.instakillTimer > 0 ? t.hp : player.bulletDamage;
                let turretDamage = getCurrentProjectileDamage(turretDamageBase, t);
                if (p.isCrit) turretDamage = Math.round(turretDamage * (p.critMult ?? 1.75));
                applyEnemyDamage(t, turretDamage, { sourceX: p.x, sourceY: p.y, sourceProjectile: p });
                if ((p.piercesLeft ?? 0) > 0) {
                    p.piercesLeft--;
                } else {
                    projectiles.splice(i, 1);
                }
                break;
            }
        }

        if (!projectiles[i]) continue;

        for (const e of enemies) {
            if (!e.alive) continue;
            if (segmentCircleHit(oldX, oldY, p.x, p.y, e.x, e.y, p.size + e.size)) {
                const enemyDamageBase = player.instakillTimer > 0 ? e.hp : player.bulletDamage;
                let enemyDamage = getCurrentProjectileDamage(enemyDamageBase, e);
                if (p.isCrit) enemyDamage = Math.round(enemyDamage * (p.critMult ?? 1.75));
                applyEnemyDamage(e, enemyDamage, { sourceX: p.x, sourceY: p.y, sourceProjectile: p });

                if ((p.piercesLeft ?? 0) > 0) {
                    p.piercesLeft--;
                } else {
                    projectiles.splice(i, 1);
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
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(Math.atan2(p.velocityY, p.velocityX));
        ctx.drawImage(projectileSprite, -p.size, -p.size, p.size * 2, p.size * 2);
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
        const oldX = p.x;
        const oldY = p.y;
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.framesLeft--;

        if (wallCollision(p.x, p.y, p.size) || p.framesLeft <= 0) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        if (segmentCircleHit(oldX, oldY, p.x, p.y, player.x, player.y, player.size + p.size)) {
            if (player.invulnTimer <= 0) {
                applyPlayerDamage(p.damage ?? TUMOR_PROJECTILE_DAMAGE);
                player.invulnTimer = 60;
            }
            enemyProjectiles.splice(i, 1);
        }
    }
}

// Draw Enemy Projectiles keeps the game logic moving.
function drawEnemyProjectiles() {
    for (const p of enemyProjectiles) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const sc  = toScreen(prx, pry);
        const sprite = p.projectileType === 'sniper' ? (p.sprite ?? sniperProjectileSprite) : enemyProjectileSprite;
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(Math.atan2(p.velocityY, p.velocityX));
        ctx.drawImage(sprite, -p.size, -p.size, p.size * 2, p.size * 2);
        ctx.restore();
    }
}

