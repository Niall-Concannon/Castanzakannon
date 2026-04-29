// xp bar at the top, ammo bar, powerup banners, off-screen pointer arrows, loot popups




// xp bar across the top of the screen, with level number and a flash on pickup
function drawXpBar() {
    if (xpBarFlash > 0) xpBarFlash--;

    const DW  = 560, DH = Math.round(DW * 28 / 620), RAD = Math.round(7 * DW / 620);
    const bx  = canvas.width / 2 - DW / 2;
    const by  = canvas.height - DH - 22;
    const xf  = Math.min(player.xp / player.xpToNextLevel, 1);
    const fw  = Math.floor(xf * DW);
    const t   = frameCount * 0.04;
    const flash   = xpBarFlash > 0;
    const pulse   = flash ? 1.0 : 0.6 + 0.4 * Math.sin(t * 1.3);
    const shimmer = Math.sin(t * 2.1) * 0.5 + 0.5;

    function clipRounded(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }

    ctx.drawImage(xpBarBgSprite, bx, by, DW, DH);

    if (fw > 1) {
        ctx.save();
        clipRounded(bx, by, fw, DH, RAD);
        ctx.clip();
        ctx.filter = `brightness(${flash ? 1 + xpBarFlash * 0.07 : 1})`;
        ctx.drawImage(xpBarFillSprite, bx, by, DW, DH);
        ctx.filter = 'none';

        const ig = ctx.createRadialGradient(bx + fw, by + DH / 2, 0, bx + fw, by + DH / 2, DH * (1.6 + pulse * 0.8));
        ig.addColorStop(0,   `rgba(180,255,80,${0.55 * pulse})`);
        ig.addColorStop(0.4, `rgba(100,255,30,${0.3  * pulse})`);
        ig.addColorStop(1,   'rgba(30,180,0,0)');
        ctx.fillStyle = ig;
        ctx.fillRect(bx, by, fw, DH);

        const sg = ctx.createLinearGradient(bx + shimmer * fw - DW * 0.06, 0, bx + shimmer * fw + DW * 0.06, 0);
        sg.addColorStop(0,   'rgba(255,255,200,0)');
        sg.addColorStop(0.5, `rgba(255,255,220,${0.22 * pulse})`);
        sg.addColorStop(1,   'rgba(255,255,200,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(bx, by, fw, DH);

        const tg = ctx.createLinearGradient(0, by, 0, by + DH * 0.45);
        tg.addColorStop(0, `rgba(220,255,140,${0.45 * pulse})`);
        tg.addColorStop(1, 'rgba(100,220,30,0)');
        ctx.fillStyle = tg;
        ctx.fillRect(bx, by, fw, DH);
        ctx.restore();
    }

    ctx.drawImage(xpBarFrameSprite, bx, by, DW, DH);

    ctx.save();
    ctx.textAlign  = 'center';
    ctx.font       = 'bold 15px Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur  = 7;
    ctx.fillStyle   = '#ff0000';
    ctx.fillText(`Level  ${player.level}`, canvas.width / 2, by - 6);
    ctx.font       = 'bold 12px Arial';
    ctx.shadowBlur  = 5;
    ctx.fillStyle   = 'rgba(255,255,255,0.88)';
    const xt = Number.isInteger(player.xp) ? player.xp : player.xp.toFixed(1);
    ctx.fillText(`${xt} / ${player.xpToNextLevel} XP`, canvas.width / 2, by + DH / 2 + 4);
    ctx.restore();
}

// ammo bar near the top. pulses red when low, hidden when youre on infinite ammo
function drawAmmoBar() {
    const DW  = 360;
    const DH  = Math.round(DW * 28 / 620);
    const RAD = Math.round(7 * DW / 620);
    const bx  = 22;
    const by  = canvas.height - DH - 58;
    const ammoPowerupActive = player.infiniteAmmoTimer > 0;
    const ammoMax = player.weaponAmmoMax ?? AMMO_MAX;
    const displayedAmmo = ammoPowerupActive ? ammoMax : player.ammo;
    const xf  = Math.min(displayedAmmo / ammoMax, 1);
    const fw  = Math.floor(xf * DW);
    const capX = Math.floor((ammoMax / ammoMax) * DW); // full bar cap
    const t   = frameCount * 0.04;
    const flash = ammoPowerupActive || player.ammo <= (ammoMax * 0.5);
    const pulse = flash ? 1.0 : 0.6 + 0.4 * Math.sin(t * 1.15);
    const shimmer = Math.sin(t * 1.7) * 0.5 + 0.5;

    function clipRounded(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(ammoBarGlowSprite, bx - 16, by - 16, DW + 32, DH + 32);
    ctx.restore();

    ctx.drawImage(ammoBarBgSprite, bx, by, DW, DH);

    if (fw > 1) {
        ctx.save();
        clipRounded(bx, by, fw, DH, RAD);
        ctx.clip();
        ctx.filter = `brightness(${flash ? 1 + xpBarFlash * 0.05 : 1})`;
        ctx.drawImage(ammoBarFillSprite, bx, by, DW, DH);
        ctx.filter = 'none';

        const ig = ctx.createRadialGradient(bx + fw, by + DH / 2, 0, bx + fw, by + DH / 2, DH * (1.3 + pulse * 0.6));
        ig.addColorStop(0,   `rgba(255,220,80,${0.55 * pulse})`);
        ig.addColorStop(0.4, `rgba(255,180,30,${0.28 * pulse})`);
        ig.addColorStop(1,   'rgba(255,140,0,0)');
        ctx.fillStyle = ig;
        ctx.fillRect(bx, by, fw, DH);

        const sg = ctx.createLinearGradient(bx + shimmer * fw - DW * 0.06, 0, bx + shimmer * fw + DW * 0.06, 0);
        sg.addColorStop(0,   'rgba(255,255,200,0)');
        sg.addColorStop(0.5, `rgba(255,255,220,${0.18 * pulse})`);
        sg.addColorStop(1,   'rgba(255,255,200,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(bx, by, fw, DH);
        ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + capX, by + 2);
    ctx.lineTo(bx + capX, by + DH - 2);
    ctx.stroke();
    ctx.restore();

    ctx.drawImage(ammoBarFrameSprite, bx, by, DW, DH);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff0000';
    ctx.fillText(ammoPowerupActive ? 'AMMO POWER' : 'AMMO', bx, by - 6);
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    if (ammoPowerupActive) {
        const secsLeft = Math.ceil((player.infiniteAmmoTimer * FIXED_STEP) / 1000);
        ctx.fillText(`INF ${secsLeft}s`, bx + DW - 88, by + DH / 2 + 4);
    } else {
        ctx.fillText(`${player.ammo} / ${ammoMax}`, bx + DW - 88, by + DH / 2 + 4);
    }

    if (player.weaponType === 'sniper') {
        const pierceNow = player.projectilePierce ?? 0;
        const pierceCap = SNIPER_MAX_PROJECTILE_PIERCE ?? 10;
        const progress = Math.floor(Math.max(0, Math.min(0.99, player.sniperAmmoPierceProgress ?? 0)) * 100);
        ctx.fillStyle = 'rgba(255,245,180,0.95)';
        ctx.fillText(`PIERCE ${pierceNow}/${pierceCap}  +${progress}%`, bx + 8, by + DH / 2 + 4);
    }
    ctx.restore();
}

// banner that shows up while infinite ammo powerup is active, with a countdown
function drawAmmoPowerupOverlay() {
    if (player.infiniteAmmoTimer <= 0) return;

    const secsLeft = Math.ceil((player.infiniteAmmoTimer * FIXED_STEP) / 1000);
    const pulse = 0.9 + 0.25 * Math.sin(frameCount * 0.25);
    const flashAlpha = (Math.floor(frameCount / 4) % 2 === 0) ? 0.95 : 0.45;
    const size = 78 * pulse;
    const cx = canvas.width * 0.5;
    const cy = 86;

    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 26;
    if (pickupAmmoSprite.complete && pickupAmmoSprite.naturalWidth) {
        ctx.drawImage(pickupAmmoSprite, cx - size * 0.5, cy - size * 0.5, size, size);
    } else {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 8;
    ctx.fillText(`INFINITE AMMO ${secsLeft}s`, cx, cy + 56);
    ctx.restore();
}

// same idea but for the instakill powerup banner
function drawInstakillPowerupOverlay() {
    if (player.instakillTimer <= 0) return;

    const secsLeft = Math.ceil((player.instakillTimer * FIXED_STEP) / 1000);
    const pulse = 0.9 + 0.25 * Math.sin(frameCount * 0.29);
    const flashAlpha = (Math.floor(frameCount / 4) % 2 === 0) ? 0.95 : 0.4;
    const size = 74 * pulse;
    const cx = canvas.width * 0.5;
    const cy = 168;

    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 26;
    if (pickupInstaKillSprite.complete && pickupInstaKillSprite.naturalWidth) {
        ctx.drawImage(pickupInstaKillSprite, cx - size * 0.5, cy - size * 0.5, size, size);
    } else {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 8;
    ctx.fillText(`INSTA KILL ${secsLeft}s`, cx, cy + 54);
    ctx.restore();
}

// returns the last enemy thats still alive, only used for the arrow that points at it
function getLastAliveEnemy() {
    for (const e of enemies) {
        if (e.alive) return e;
    }
    return null;
}

// arrow on the edge of the screen pointing to the last hidden enemy so you can find it
function drawLastEnemyArrow() {
    if (enemiesRemainingInWave !== 1 || enemiesToSpawn > 0) return;

    const enemy = getLastAliveEnemy();
    if (!enemy) return;

    const playerX = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const playerY = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const enemyX = (enemy.prevX ?? enemy.x) + (enemy.x - (enemy.prevX ?? enemy.x)) * renderAlpha;
    const enemyY = (enemy.prevY ?? enemy.y) + (enemy.y - (enemy.prevY ?? enemy.y)) * renderAlpha;

    const playerScreen = toScreen(playerX, playerY);
    const enemyScreen = toScreen(enemyX, enemyY);
    const dx = enemyScreen.x - playerScreen.x;
    const dy = enemyScreen.y - playerScreen.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const angle = Math.atan2(uy, ux);
    const edgeRadius = Math.min(canvas.width, canvas.height) * 0.42;
    const margin = 36;

    let ax = playerScreen.x + ux * edgeRadius;
    let ay = playerScreen.y + uy * edgeRadius;
    ax = Math.max(margin, Math.min(canvas.width - margin, ax));
    ay = Math.max(margin, Math.min(canvas.height - margin, ay));

    const pulse = 0.85 + 0.15 * Math.sin(frameCount * 0.22);

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);

    ctx.globalAlpha = 0.95;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 14 * pulse;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText('LAST ENEMY', ax, ay - 24);
    ctx.restore();
}

// returns the first pickup of a type currently on the floor, or null if none
function getActivePickupByType(type) {
    for (const p of pickups) {
        if (p.type === type) return p;
    }
    return null;
}

// off-screen arrow pointing at a special pickup so you know where to grab one
function drawSpecialPickupArrow(type, label, color) {
    const pickup = getActivePickupByType(type);
    if (!pickup) return;

    const playerX = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const playerY = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const pickupX = (pickup.prevX ?? pickup.x) + (pickup.x - (pickup.prevX ?? pickup.x)) * renderAlpha;
    const pickupY = (pickup.prevY ?? pickup.y) + (pickup.y - (pickup.prevY ?? pickup.y)) * renderAlpha;

    const playerScreen = toScreen(playerX, playerY);
    const pickupScreen = toScreen(pickupX, pickupY);
    const pickupScreenMargin = 28;
    const pickupOnScreen =
        pickupScreen.x >= pickupScreenMargin &&
        pickupScreen.x <= canvas.width - pickupScreenMargin &&
        pickupScreen.y >= pickupScreenMargin &&
        pickupScreen.y <= canvas.height - pickupScreenMargin;
    if (pickupOnScreen) return;

    const dx = pickupScreen.x - playerScreen.x;
    const dy = pickupScreen.y - playerScreen.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const angle = Math.atan2(uy, ux);
    const edgeRadius = Math.min(canvas.width, canvas.height) * 0.38;
    const margin = 42;

    let ax = playerScreen.x + ux * edgeRadius;
    let ay = playerScreen.y + uy * edgeRadius;
    ax = Math.max(margin, Math.min(canvas.width - margin, ax));
    ay = Math.max(margin, Math.min(canvas.height - margin, ay));

    const pulse = 0.82 + 0.18 * Math.sin(frameCount * 0.2);

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.96;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16 * pulse;

    ctx.fillStyle = 'rgba(0,0,0,0.56)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(-11, -10);
    ctx.lineTo(-11, 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 6;
    ctx.fillText(label, ax, ay - 24);
    ctx.restore();
}

function drawSpecialPickupArrows() {
    drawSpecialPickupArrow('ammo', 'MAX AMMO PICKUP', '#ff0000');
    drawSpecialPickupArrow('heal', 'MEDKIT PICKUP', '#00ff00');
    drawSpecialPickupArrow('instakill', 'INSTAKILL PICKUP', '#ff0000');
}

// arrow that points to the void/necro totem when its active and offscreen
function drawVoidTotemArrow() {
    const targets = [];
    if (hasActiveVoidTotem()) {
        targets.push({
            totem: voidTotem,
            glow: '#b07cff',
            arrow: '#c9a6ff',
            text: '#ddc8ff',
            label: voidTotem?.mode === 'return' ? 'RETURN TOTEM' : 'VOID TOTEM',
        });
    }
    if (hasActiveNecromancerTotem()) {
        targets.push({
            totem: necromancerTotem,
            glow: '#5fe3ad',
            arrow: '#8bf6cb',
            text: '#c9ffe4',
            label: necromancerTotem?.mode === 'return' ? 'RETURN TOTEM' : 'NECRO TOTEM',
        });
    }
    if (targets.length === 0) return;

    const playerX = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const playerY = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const playerScreen = toScreen(playerX, playerY);
    const edgeRadius = Math.min(canvas.width, canvas.height) * 0.39;
    const margin = 44;
    const pulse = 0.8 + 0.2 * Math.sin(frameCount * 0.18);

    for (const target of targets) {
        const t = target.totem;
        const totemX = (t.prevX ?? t.x) + (t.x - (t.prevX ?? t.x)) * renderAlpha;
        const totemY = (t.prevY ?? t.y) + (t.y - (t.prevY ?? t.y)) * renderAlpha;
        const totemScreen = toScreen(totemX, totemY);
        const dx = totemScreen.x - playerScreen.x;
        const dy = totemScreen.y - playerScreen.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.001) continue;

        // Don't show arrow if the totem is already on screen
        const onScreen = totemScreen.x >= 0 && totemScreen.x <= canvas.width &&
                         totemScreen.y >= 0 && totemScreen.y <= canvas.height;
        if (onScreen) continue;

        const ux = dx / dist;
        const uy = dy / dist;
        const angle = Math.atan2(uy, ux);

        let ax = playerScreen.x + ux * edgeRadius;
        let ay = playerScreen.y + uy * edgeRadius;
        ax = Math.max(margin, Math.min(canvas.width - margin, ax));
        ay = Math.max(margin, Math.min(canvas.height - margin, ay));

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.96;
        ctx.shadowColor = target.glow;
        ctx.shadowBlur = 16 * pulse;

        ctx.fillStyle = 'rgba(0,0,0,0.54)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = target.arrow;
        ctx.beginPath();
        ctx.moveTo(19, 0);
        ctx.lineTo(-11, -10);
        ctx.lineTo(-11, 10);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = target.text;
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 6;
        ctx.fillText(target.label, ax, ay - 24);
        ctx.restore();
    }
}

// "press E to use" prompt that pops up when you stand on a totem
function drawVoidTotemPrompt() {
    if (gamePaused) return;

    let promptText = '';
    let stroke = 'rgba(195,150,255,0.85)';
    let shadow = 'rgba(100,40,180,0.95)';
    if (hasActiveVoidTotem()) {
        const distVoid = Math.hypot(player.x - voidTotem.x, player.y - voidTotem.y);
        if (distVoid <= player.size + VOID_BOSS_TRIGGER_RADIUS) {
            promptText = voidTotem.mode === 'return'
                ? 'PRESS E TO RETURN TO THE ARENA'
                : 'PRESS E TO ENTER VOID FIGHT';
        }
    }
    if (!promptText && hasActiveNecromancerTotem()) {
        const distNecro = Math.hypot(player.x - necromancerTotem.x, player.y - necromancerTotem.y);
        if (distNecro <= player.size + VOID_BOSS_TRIGGER_RADIUS) {
            promptText = necromancerTotem.mode === 'return'
                ? 'PRESS E TO RETURN TO THE ARENA'
                : 'PRESS E TO ENTER NECROMANCER FIGHT';
            stroke = 'rgba(130,230,180,0.85)';
            shadow = 'rgba(35,130,88,0.95)';
        }
    }
    if (!promptText) return;

    const pulse = 0.88 + 0.12 * Math.sin(frameCount * 0.2);
    const boxW = 360;
    const boxH = 44;
    const x = canvas.width / 2 - boxW / 2;
    const y = canvas.height - 130;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(8,5,25,0.85)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#f1e5ff';
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 8;
    ctx.fillText(promptText, canvas.width / 2, y + 28);
    ctx.restore();
}

// the small hud thing showing your stat upgrades you have so far
function drawUpgradeHud() {
    const panelX = 20;
    const panelY = 252;
    const panelW = 260;
    const panelH = 108;

    const fireRateBonus = Math.round((player.fireRateMult - 1) * 100);
    const damageReduction = Math.round((1 - player.damageTakenMult) * 100);
    const bulletDamage = Number.isInteger(player.bulletDamage)
        ? String(player.bulletDamage)
        : player.bulletDamage.toFixed(2);
    const baseHp = getSelectedCharacter().maxHp ?? 100;
    const maxHpBonus = Math.max(0, Math.round(player.maxHp - baseHp));
    const speedBonus = Math.round(((player.speed / (getSelectedCharacter().speed || 1)) - 1) * 100);
    const aoeText = player.aoePulseDamage > 0
        ? `AOE ${player.aoePulseDamage} @ ${Math.round(player.aoePulseRadius)}`
        : 'AOE off';
    const ultText = player.hasRailgunUlt
        ? (player.railgunUltCooldown > 0
            ? `Q ${Math.ceil((player.railgunUltCooldown * FIXED_STEP) / 1000)}s`
            : 'Q READY')
        : 'Q locked';

    const acquired = LEVEL_UPGRADES
        .map(upgrade => ({ upgrade, level: getUpgradeLevel(upgrade.id) }))
        .filter(entry => entry.level > 0)
        .sort((a, b) => b.level - a.level || a.upgrade.title.localeCompare(b.upgrade.title));
    const visibleEntries = acquired.slice(0, 2);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.56)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = 'rgba(255,255,255,0.26)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 4;

    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('UPGRADES', panelX + 8, panelY + 14);

    ctx.font = '10px Arial';
    if (visibleEntries.length === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('No upgrades yet', panelX + 8, panelY + 34);
    } else {
        for (let i = 0; i < visibleEntries.length; i++) {
            const entry = visibleEntries[i];
            const y = panelY + 34 + i * 16;
            ctx.fillStyle = getRarityUiColor(entry.upgrade.rarity);
            ctx.fillText(`${entry.upgrade.title} L${entry.level} [${entry.upgrade.rarity[0].toUpperCase()}]`, panelX + 8, y);
        }
        if (acquired.length > visibleEntries.length) {
            ctx.fillStyle = 'rgba(220,230,255,0.7)';
            ctx.fillText(`+${acquired.length - visibleEntries.length} more`, panelX + 8, panelY + 66);
        }
    }

    ctx.fillStyle = 'rgba(220,230,255,0.88)';
    ctx.fillText(`FR+${fireRateBonus}% DMG ${bulletDamage} DR ${damageReduction}%`, panelX + 8, panelY + 82);
    ctx.fillText(`SPD+${speedBonus}% CD ${getPlayerShootCooldownFrames().toFixed(2)}f HP+${maxHpBonus}`, panelX + 8, panelY + 92);
    ctx.fillText(`${aoeText}  |  ${ultText}`, panelX + 8, panelY + 102);
    ctx.restore();
}

// little inventory display that shows the items youve picked up this run
function drawInventoryHud() {
    const slotSize = 44;
    const gap = 8;
    const entries = player.inventory;
    const rows = Math.min(2, Math.max(1, Math.ceil(entries.length / 9)));
    const cols = Math.max(1, Math.ceil(entries.length / rows));
    const padX = 12;
    const padY = 10;
    const panelW = cols * slotSize + (cols - 1) * gap + padX * 2;
    const panelH = rows * slotSize + (rows - 1) * gap + padY * 2;
    const panelX = canvas.width / 2 - panelW / 2;
    const panelY = 8;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    let hovered = null;
    for (let row = 0; row < rows; row++) {
        const startIndex = row * cols;
        const rowCount = Math.min(cols, entries.length - startIndex);
        const rowWidth = rowCount * slotSize + Math.max(0, rowCount - 1) * gap;
        const rowX = panelX + padX + (panelW - padX * 2 - rowWidth) / 2;
        const y = panelY + padY + row * (slotSize + gap);

        for (let col = 0; col < rowCount; col++) {
            const entry = entries[startIndex + col];
            const x = rowX + col * (slotSize + gap);
        const hover = mouseX >= x && mouseX <= x + slotSize && mouseY >= y && mouseY <= y + slotSize;
        if (hover) hovered = { x, y, entry };

        ctx.fillStyle = hover ? 'rgba(255,255,255,0.14)' : 'rgba(10,10,10,0.72)';
        ctx.fillRect(x, y, slotSize, slotSize);
        ctx.strokeStyle = hover ? '#ff0000' : getRarityUiColor(entry.rarity);
        ctx.lineWidth = hover ? 2 : 1;
        ctx.strokeRect(x, y, slotSize, slotSize);

        const icon = entry.unique 
            ? (UNIQUE_PLACEHOLDER_SPRITES[entry.id] ?? uniquePlaceholderSprite)
            : (ITEM_PLACEHOLDER_SPRITES[entry.id] ?? itemPlaceholderSprite);
        if (icon.complete && icon.naturalWidth) {
            ctx.drawImage(icon, x + 4, y + 4, slotSize - 8, slotSize - 8);
        } else {
            ctx.fillStyle = entry.unique ? '#ff0000' : '#ff0000';
            ctx.fillRect(x + 4, y + 4, slotSize - 8, slotSize - 8);
        }

        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff0000';
        ctx.fillText(String(entry.level), x + slotSize - 2, y + slotSize - 2);
        }
    }

    if (hovered) {
        const tipX = Math.min(canvas.width - 20, hovered.x + slotSize + 10);
        const tipY = Math.max(20, hovered.y + 10);

        ctx.textAlign = 'left';
        ctx.font = '10px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = getRarityUiColor(hovered.entry.rarity);
        ctx.fillText(hovered.entry.detail, tipX, tipY);
    }

    ctx.restore();
}

// little popup that says what you just got, slides in from the side and fades out
function drawLootToast() {
    if (player.lastLootTimer <= 0) return;
    player.lastLootTimer--;

    const timer = player.lastLootTimer;
    const fadeIn = Math.min(1, (220 - timer) / 20);
    const fadeOut = Math.min(1, timer / 40);
    const alpha = Math.min(1, fadeIn, fadeOut);
    const y = 122 + (1 - fadeIn) * 26 + Math.sin((220 - timer) * 0.05) * 2;
    const text = player.lastLootText;
    const width = Math.min(canvas.width - 80, 18 * Math.max(12, text.length) + 60);
    const height = 50;
    const x = canvas.width / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(18,18,26,0.86)';
    ctx.strokeStyle = 'rgba(190,220,255,0.92)';
    ctx.lineWidth = 2;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
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

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffeaa0';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

