// Pickup collection chest rewards and damage numbers live here.




// Update Chests keeps the game logic moving.
function updateChests() {
    for (let i = chests.length - 1; i >= 0; i--) {
        const chest = chests[i];
        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (dist <= player.size + chest.size) {
            rewardChestLoot();
            chests.splice(i, 1);
        }
    }
}

// Draw Chests keeps the game logic moving.
function drawChests() {
    for (const chest of chests) {
        const crx = (chest.prevX ?? chest.x) + (chest.x - (chest.prevX ?? chest.x)) * renderAlpha;
        const cry = (chest.prevY ?? chest.y) + (chest.y - (chest.prevY ?? chest.y)) * renderAlpha;
        const sc = toScreen(crx, cry);
        const drawRadius = chest.size * CHEST_DRAW_SCALE;
        const pulse = 0.82 + 0.18 * Math.sin(frameCount * 0.06);

        ctx.save();
        const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, drawRadius * 3.3 * pulse);
        halo.addColorStop(0, 'rgba(40,210,90,0.35)');
        halo.addColorStop(0.5, 'rgba(40,210,90,0.13)');
        halo.addColorStop(1, 'rgba(40,210,90,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, drawRadius * 3.3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 18 * pulse;
        if (pickupChestSprite.complete && pickupChestSprite.naturalWidth) {
            ctx.drawImage(pickupChestSprite, sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
        } else {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
        }
        ctx.restore();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'rgba(220,255,225,0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 5;
        ctx.fillText('CHEST', sc.x, sc.y - drawRadius - 10);
        ctx.restore();
    }
}

// Update Pickups keeps the game logic moving.
function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];

        if (!p.vx)    p.vx    = 0;
        if (!p.vy)    p.vy    = 0;
        if (!p.trail) p.trail = [];
        if (!p.type) p.type = 'xp';
        if (p.type === 'xp') {
            if (!p.variant) p.variant = 'green';
            if (!p.value) p.value = XP_PICKUP_BASE_VALUE * (p.variant === 'blue' ? TANK_XP_MULTIPLIER : 1);
        } else if (p.type === 'ammo' && !p.value) {
            p.value = AMMO_PICKUP_VALUE_MIN;
        } else if (p.type === 'heal') {
            p.value = 0;
        } else if (p.type === 'instakill') {
            p.value = 0;
        }

        const dist = Math.hypot(player.x - p.x, player.y - p.y);

        if (p.type === 'xp') {
            const attractRadius = getPlayerXpAttractRadius();
            if (dist < attractRadius && dist > 0) {
                const pull = XP_ATTRACT_SPEED * (1 - dist / attractRadius) + 0.5;
                p.vx += (player.x - p.x) / dist * pull * 0.15;
                p.vy += (player.y - p.y) / dist * pull * 0.15;
                const sp = Math.hypot(p.vx, p.vy);
                if (sp > XP_ATTRACT_SPEED) { p.vx = (p.vx / sp) * XP_ATTRACT_SPEED; p.vy = (p.vy / sp) * XP_ATTRACT_SPEED; }
                if (frameCount % 2 === 0) p.trail.push({ x: p.x, y: p.y, age: 0 });
            } else {
                p.vx *= 0.85;
                p.vy *= 0.85;
            }
        } else {

            p.vx = 0;
            p.vy = 0;
        }

        for (let t = p.trail.length - 1; t >= 0; t--) {
            p.trail[t].age++;
            if (p.trail[t].age > 12) p.trail.splice(t, 1);
        }

        if (p.type === 'xp') {
            p.x += p.vx;
            p.y += p.vy;
        }

        if (dist < player.size + p.size) {
            if (p.type === 'xp') {
                playExpOrbPickup();
                player.xp += p.value * player.xpGainMult;
                xpBarFlash  = 12;
                if (player.xp >= player.xpToNextLevel) {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                    beginLevelUp();
                }
            } else if (p.type === 'ammo') {
                playAmmoPickupSound();
                player.ammo = AMMO_MAX;
                player.ammoRegenTimer = 0;
                player.ammoNoShootFrames = 0;
                player.infiniteAmmoTimer = AMMO_POWERUP_DURATION_FRAMES;
            } else if (p.type === 'heal') {
                playHealPickupSound();
                player.healOverTimeTimer = HEAL_OVER_TIME_DURATION_FRAMES;
            } else if (p.type === 'instakill') {
                playInstakillPickupSound();
                player.instakillTimer = INSTAKILL_DURATION_FRAMES;
            }
            pickups.splice(i, 1);
        }
    }
}

// Spawn Damage Number keeps the game logic moving.
function spawnDamageNumber(x, y, value) {
    const displayValue = Math.max(1, Math.round(value));
    damageNumbers.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.8 - Math.random() * 0.25,
        life: 30,
        maxLife: 30,
        alpha: 1,
        value: displayValue,
        scale: 1 + Math.min(0.3, displayValue / 18),
    });
}

// Update Damage Numbers keeps the game logic moving.
function updateDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const n = damageNumbers[i];
        n.x += n.vx;
        n.y += n.vy;
        n.vy += 0.04;
        n.life--;
        if (n.life <= 0) {
            damageNumbers.splice(i, 1);
            continue;
        }
        n.alpha = n.life / n.maxLife;
    }
}

// Draw Damage Numbers keeps the game logic moving.
function drawDamageNumbers() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    for (const n of damageNumbers) {
        const screen = toScreen(n.x, n.y);
        ctx.globalAlpha = n.alpha;
        ctx.font = `bold ${Math.round(16 * n.scale)}px Arial`;
        ctx.fillStyle = '#ffff00';
        ctx.fillText(n.value, screen.x, screen.y);
    }
    ctx.restore();
}

// Draw Pickups keeps the game logic moving.
function drawPickups() {
    const drawList = [];

    for (const p of pickups) {
        if (p.type === 'ammo' || p.type === 'heal' || p.type === 'instakill') continue;
        drawList.push(p);
    }
    for (const p of pickups) {
        if (p.type !== 'heal') continue;
        drawList.push(p);
    }
    for (const p of pickups) {
        if (p.type !== 'instakill') continue;
        drawList.push(p);
    }
    for (const p of pickups) {
        if (p.type !== 'ammo') continue;
        drawList.push(p);
    }

    for (const p of drawList) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const sc  = toScreen(prx, pry);
        const variant = p.type === 'ammo'
            ? { shadow: '#ff0000', rgb: '255,238,102' }
            : p.type === 'heal'
                ? { shadow: '#ff0000', rgb: '117,255,144' }
            : p.type === 'instakill'
                ? { shadow: '#ff0000', rgb: '255,94,94' }
            : XP_PICKUP_VARIANTS[p.variant] ?? XP_PICKUP_VARIANTS.green;


        if (p.type === 'xp' && p.trail?.length) {
            for (const t of p.trail) {
                const ts   = toScreen(t.x, t.y);
                const life = 1 - t.age / 12;
                const r    = p.size * 0.55 * life;
                ctx.save();
                ctx.globalAlpha  = life * 0.7;
                ctx.shadowColor  = variant.shadow;
                ctx.shadowBlur   = 6 * life;
                ctx.fillStyle    = `rgba(${variant.rgb},${life * 0.85})`;
                ctx.beginPath();
                ctx.arc(ts.x, ts.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        if (p.type === 'xp') {
            const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.04);
            ctx.save();


            const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, p.size * 3.5 * pulse);
            halo.addColorStop(0,   `rgba(${variant.rgb},0.35)`);
            halo.addColorStop(0.5, `rgba(${variant.rgb},0.12)`);
            halo.addColorStop(1,   `rgba(${variant.rgb},0)`);
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, p.size * 3.5 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = variant.shadow;
            ctx.shadowBlur  = 18 * pulse;

            const sprite = p.variant === 'blue' ? pickupXpBlueSprite : pickupXpSprite;
            if (sprite.complete && sprite.naturalWidth) {
                ctx.drawImage(sprite, sc.x - p.size, sc.y - p.size, p.size * 2, p.size * 2);
            } else {
                ctx.fillStyle = variant.shadow;
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else if (p.type === 'ammo') {
            const pulse = 0.72 + 0.28 * Math.sin(frameCount * 0.05);
            const drawRadius = p.size * AMMO_PICKUP_DRAW_SCALE;
            ctx.save();

            const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, drawRadius * 3.2 * pulse);
            halo.addColorStop(0,   `rgba(${variant.rgb},0.38)`);
            halo.addColorStop(0.5, `rgba(${variant.rgb},0.12)`);
            halo.addColorStop(1,   'rgba(255,238,102,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, drawRadius * 3.2 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = variant.shadow;
            ctx.shadowBlur  = 18 * pulse;
            if (pickupAmmoSprite.complete && pickupAmmoSprite.naturalWidth) {
                ctx.drawImage(pickupAmmoSprite, sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
            } else {
                ctx.fillStyle = variant.shadow;
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, drawRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else if (p.type === 'heal') {
            const pulse = 0.75 + 0.25 * Math.sin(frameCount * 0.06);
            const drawRadius = p.size * HEAL_PICKUP_DRAW_SCALE;
            ctx.save();

            const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, drawRadius * 3.4 * pulse);
            halo.addColorStop(0,   `rgba(${variant.rgb},0.36)`);
            halo.addColorStop(0.5, `rgba(${variant.rgb},0.12)`);
            halo.addColorStop(1,   'rgba(117,255,144,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, drawRadius * 3.4 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = variant.shadow;
            ctx.shadowBlur  = 18 * pulse;
            if (pickupHealSprite.complete && pickupHealSprite.naturalWidth) {
                ctx.drawImage(pickupHealSprite, sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
            } else {
                ctx.fillStyle = variant.shadow;
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, drawRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else if (p.type === 'instakill') {
            const pulse = 0.76 + 0.24 * Math.sin(frameCount * 0.08);
            const drawRadius = p.size * INSTAKILL_PICKUP_DRAW_SCALE;
            ctx.save();

            const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, drawRadius * 3.5 * pulse);
            halo.addColorStop(0,   `rgba(${variant.rgb},0.4)`);
            halo.addColorStop(0.5, `rgba(${variant.rgb},0.14)`);
            halo.addColorStop(1,   'rgba(255,94,94,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, drawRadius * 3.5 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = variant.shadow;
            ctx.shadowBlur  = 20 * pulse;
            if (pickupInstaKillSprite.complete && pickupInstaKillSprite.naturalWidth) {
                ctx.drawImage(pickupInstaKillSprite, sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
            } else {
                ctx.fillStyle = variant.shadow;
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, drawRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else {
            ctx.drawImage(pickupXpSprite, sc.x - p.size, sc.y - p.size, p.size * 2, p.size * 2);
        }
    }
}

