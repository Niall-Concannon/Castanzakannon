// chests, pickup orbs (xp/ammo/heal/instakill), boss totems, damage numbers

// list of chest opening flair effects (text card + particles)
let chestPickupEffects = [];




// checks if player is touching a chest, opens it, gives loot and spawns the popup
function updateChests() {
    for (let i = chests.length - 1; i >= 0; i--) {
        const chest = chests[i];
        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (dist <= player.size + chest.size) {
            const gotLoot = chest.bossChest ? rewardBossLoot() : rewardChestLoot();
            const text = player.lastLootText || 'CHEST OPENED';
            const particles = [];
            for (let p = 0; p < 10; p++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.9 + Math.random() * 1.6;
                particles.push({
                    x: chest.x,
                    y: chest.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed * 0.45 - 1.6,
                    life: 18 + Math.floor(Math.random() * 18),
                    maxLife: 18 + Math.floor(Math.random() * 18),
                    size: 2 + Math.random() * 2.5,
                    color: chest.bossChest ? '255,212,110' : '140,255,160',
                });
            }
            chestPickupEffects.push({
                x: chest.x,
                y: chest.y,
                timer: 72,
                text: gotLoot ? text : 'CHEST EMPTY',
                boss: !!chest.bossChest,
                created: frameCount,
                icon: gotLoot ? player.lastLootIcon : null,
                particles,
            });
            chests.splice(i, 1);
        }
    }
}

// draws each chest with its bobbing motion, glow halo, sparkles, and label
function drawChests() {
    for (const chest of chests) {
        const crx = (chest.prevX ?? chest.x) + (chest.x - (chest.prevX ?? chest.x)) * renderAlpha;
        const cry = (chest.prevY ?? chest.y) + (chest.y - (chest.prevY ?? chest.y)) * renderAlpha;
        const bob = Math.sin(frameCount * 0.08 + (chest.spawnOffset ?? 0)) * 4;
        const sc = toScreen(crx, cry + bob);
        const drawRadius = chest.size * CHEST_DRAW_SCALE;
        const pulse = 0.82 + 0.18 * Math.sin(frameCount * 0.06 + (chest.spawnOffset ?? 0));
        const label = chest.bossChest ? 'BOSS CHEST' : 'CHEST';

        ctx.save();
        const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, drawRadius * 3.3 * pulse);
        halo.addColorStop(0, 'rgba(40,210,90,0.35)');
        halo.addColorStop(0.5, 'rgba(40,210,90,0.13)');
        halo.addColorStop(1, 'rgba(40,210,90,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, drawRadius * 3.3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        for (let s = 0; s < 4; s++) {
            const angle = frameCount * 0.08 + s * Math.PI * 0.5 + (chest.spawnOffset ?? 0);
            const sparkleRadius = drawRadius * 2.1;
            const sparkleX = sc.x + Math.cos(angle) * sparkleRadius;
            const sparkleY = sc.y + Math.sin(angle) * sparkleRadius;
            const sparkleAlpha = 0.45 + 0.22 * Math.sin(frameCount * 0.12 + s);
            ctx.fillStyle = `rgba(255,255,220,${sparkleAlpha})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2 + 0.8 * Math.sin(frameCount * 0.16 + s), 0, Math.PI * 2);
            ctx.fill();
        }

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
        ctx.fillText(label, sc.x, sc.y - drawRadius - 10);
        ctx.restore();
    }
}

// ticks down the chest pickup popup effects and moves their particles
function updateChestPickupEffects() {
    for (let i = chestPickupEffects.length - 1; i >= 0; i--) {
        const effect = chestPickupEffects[i];
        effect.timer--;
        for (let j = effect.particles.length - 1; j >= 0; j--) {
            const particle = effect.particles[j];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.14;
            particle.life--;
            if (particle.life <= 0) {
                effect.particles.splice(j, 1);
            }
        }
        if (effect.timer <= 0) {
            chestPickupEffects.splice(i, 1);
        }
    }
}

// draws the loot popup card after opening a chest, with icon + particles + glow
function drawChestPickupEffects() {
    const duration = 72;
    for (const effect of chestPickupEffects) {
        const progress = 1 - effect.timer / duration;
        const screen = toScreen(effect.x, effect.y - 14 - Math.sin(progress * Math.PI) * 20);
        const alpha = Math.min(1, effect.timer / 24, progress * 1.4);
        const cardScale = 0.96 + 0.08 * Math.sin((frameCount + effect.created) * 0.18);
        const glowRadius = 30 + progress * 20;

        ctx.save();
        ctx.globalAlpha = alpha * 0.36;
        const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, glowRadius);
        glow.addColorStop(0, effect.boss ? 'rgba(255,220,150,0.78)' : 'rgba(140,255,170,0.68)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        for (const particle of effect.particles) {
            const partScreen = toScreen(particle.x, particle.y);
            const lifeRatio = Math.max(0, particle.life / particle.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha * lifeRatio;
            ctx.fillStyle = `rgba(${particle.color},${0.95 * lifeRatio})`;
            ctx.beginPath();
            ctx.arc(partScreen.x, partScreen.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const text = effect.text;
        const cardWidth = Math.min(canvas.width - 80, Math.max(180, text.length * 10 + 120));
        const cardHeight = 56;
        const halfW = cardWidth * 0.5;
        const halfH = cardHeight * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(screen.x, screen.y - 36);
        ctx.scale(cardScale, cardScale);

        ctx.fillStyle = 'rgba(14,18,30,0.92)';
        ctx.strokeStyle = effect.boss ? 'rgba(255,215,120,0.95)' : 'rgba(145,255,170,0.95)';
        ctx.lineWidth = 2;
        const radius = 14;
        ctx.beginPath();
        ctx.moveTo(-halfW + radius, -halfH);
        ctx.lineTo(halfW - radius, -halfH);
        ctx.quadraticCurveTo(halfW, -halfH, halfW, -halfH + radius);
        ctx.lineTo(halfW, halfH - radius);
        ctx.quadraticCurveTo(halfW, halfH, halfW - radius, halfH);
        ctx.lineTo(-halfW + radius, halfH);
        ctx.quadraticCurveTo(-halfW, halfH, -halfW, halfH - radius);
        ctx.lineTo(-halfW, -halfH + radius);
        ctx.quadraticCurveTo(-halfW, -halfH, -halfW + radius, -halfH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const icon = effect.icon;
        if (icon?.complete && icon.naturalWidth) {
            ctx.drawImage(icon, -halfW + 14, -22, 44, 44);
        } else if (pickupChestSprite.complete && pickupChestSprite.naturalWidth) {
            ctx.drawImage(pickupChestSprite, -halfW + 14, -22, 44, 44);
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#f8f1d4';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(text, -halfW + 72, 0);
        ctx.restore();
    }
}

// shared draw helper for boss summoning/return totems. just adds a glow + sprite + label
function drawBossTotemObjective(totem, sprite, label, auraColor, glowColor) {
    if (!totem || !totem.active) return;

    const tx = (totem.prevX ?? totem.x) + (totem.x - (totem.prevX ?? totem.x)) * renderAlpha;
    const ty = (totem.prevY ?? totem.y) + (totem.y - (totem.prevY ?? totem.y)) * renderAlpha;
    const sc = toScreen(tx, ty);
    const pulse = 0.82 + 0.18 * Math.sin(frameCount * 0.12);
    const drawRadius = totem.size * 1.55;

    ctx.save();
    const aura = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, drawRadius * 3.1 * pulse);
    aura.addColorStop(0, auraColor[0]);
    aura.addColorStop(0.45, auraColor[1]);
    aura.addColorStop(1, auraColor[2]);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, drawRadius * 3.1 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18 * pulse;
    ctx.drawImage(sprite, sc.x - drawRadius, sc.y - drawRadius, drawRadius * 2, drawRadius * 2);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = auraColor[3];
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 6;
    ctx.fillText(label, sc.x, sc.y - drawRadius - 12);
    ctx.restore();
}

// purple void totem, label changes to RETURN when youre meant to head back
function drawVoidTotemObjective() {
    const label = voidTotem?.mode === 'return' ? 'RETURN TOTEM' : 'VOID TOTEM';
    drawBossTotemObjective(
        voidTotem,
        voidTotemSprite,
        label,
        ['rgba(148,90,255,0.34)', 'rgba(105,40,210,0.2)', 'rgba(30,0,65,0)', 'rgba(236,214,255,0.95)'],
        '#9f66ff'
    );
}

// green necro totem version of the same thing
function drawNecromancerTotemObjective() {
    const label = necromancerTotem?.mode === 'return' ? 'RETURN TOTEM' : 'NECRO TOTEM';
    drawBossTotemObjective(
        necromancerTotem,
        necromancerTotemSprite,
        label,
        ['rgba(85,230,155,0.32)', 'rgba(50,180,110,0.18)', 'rgba(0,58,38,0)', 'rgba(215,255,230,0.95)'],
        '#5df0a0'
    );
}

// updates every floating pickup. xp orbs get sucked toward player, the rest just sit
// also handles actually picking them up when you walk over them
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

        // xp orbs steer toward the player when in range, otherwise they just slow down
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

        // close enough to player = pick it up. each type does something different
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
                if (!grantSniperAmmoPierceBonus((p.value ?? AMMO_PICKUP_VALUE_MIN) * SNIPER_AMMO_PIERCE_PROGRESS_STEP)) {
                    player.ammo = AMMO_MAX;
                    player.ammoRegenTimer = 0;
                    player.ammoNoShootFrames = 0;
                    player.infiniteAmmoTimer = AMMO_POWERUP_DURATION_FRAMES;
                }
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

// makes a yellow damage number popup at a given spot
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

// floats the damage numbers up with a little gravity, fades and removes when expired
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

// draws all the active damage numbers in yellow with a black shadow
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

// draws all pickup orbs. sorts by type so the rare ones (ammo) draw on top
function drawPickups() {
    // build a draw order: xp first, then heal, instakill, ammo on top
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


        // draw the little trail of fading dots behind moving xp orbs
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

