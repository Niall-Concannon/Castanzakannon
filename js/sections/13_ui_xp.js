// XP ammo and loot HUD pieces are drawn here.




// Draw Xp Bar keeps the game logic moving.
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

// Draw Ammo Bar keeps the game logic moving.
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

// Draw Ammo Powerup Overlay keeps the game logic moving.
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

// Draw Instakill Powerup Overlay keeps the game logic moving.
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

// Get Last Alive Enemy keeps the game logic moving.
function getLastAliveEnemy() {
    for (const e of enemies) {
        if (e.alive) return e;
    }
    return null;
}

// Draw Last Enemy Arrow keeps the game logic moving.
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

// Get Active Ammo Pickup keeps the game logic moving.
function getActiveAmmoPickup() {
    for (const p of pickups) {
        if (p.type === 'ammo') return p;
    }
    return null;
}

// Draw Ammo Pickup Arrow keeps the game logic moving.
function drawAmmoPickupArrow() {
    const ammoPickup = getActiveAmmoPickup();
    if (!ammoPickup) return;

    const playerX = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const playerY = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const pickupX = (ammoPickup.prevX ?? ammoPickup.x) + (ammoPickup.x - (ammoPickup.prevX ?? ammoPickup.x)) * renderAlpha;
    const pickupY = (ammoPickup.prevY ?? ammoPickup.y) + (ammoPickup.y - (ammoPickup.prevY ?? ammoPickup.y)) * renderAlpha;

    const playerScreen = toScreen(playerX, playerY);
    const pickupScreen = toScreen(pickupX, pickupY);
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
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 16 * pulse;

    ctx.fillStyle = 'rgba(0,0,0,0.56)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0000';
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
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 6;
    ctx.fillText('MAX AMMO PICKUP', ax, ay - 24);
    ctx.restore();
}

// Draw Void Totem Arrow keeps the game logic moving.
function drawVoidTotemArrow() {
    if (!hasActiveVoidTotem()) return;

    const playerX = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const playerY = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const totemX = (voidTotem.prevX ?? voidTotem.x) + (voidTotem.x - (voidTotem.prevX ?? voidTotem.x)) * renderAlpha;
    const totemY = (voidTotem.prevY ?? voidTotem.y) + (voidTotem.y - (voidTotem.prevY ?? voidTotem.y)) * renderAlpha;

    const playerScreen = toScreen(playerX, playerY);
    const totemScreen = toScreen(totemX, totemY);
    const dx = totemScreen.x - playerScreen.x;
    const dy = totemScreen.y - playerScreen.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const angle = Math.atan2(uy, ux);
    const edgeRadius = Math.min(canvas.width, canvas.height) * 0.39;
    const margin = 44;

    let ax = playerScreen.x + ux * edgeRadius;
    let ay = playerScreen.y + uy * edgeRadius;
    ax = Math.max(margin, Math.min(canvas.width - margin, ax));
    ay = Math.max(margin, Math.min(canvas.height - margin, ay));

    const pulse = 0.8 + 0.2 * Math.sin(frameCount * 0.18);

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.96;
    ctx.shadowColor = '#b07cff';
    ctx.shadowBlur = 16 * pulse;

    ctx.fillStyle = 'rgba(0,0,0,0.54)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c9a6ff';
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
    ctx.fillStyle = '#ddc8ff';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 6;
    ctx.fillText('VOID TOTEM', ax, ay - 24);
    ctx.restore();
}

// Draw Void Totem Prompt keeps the game logic moving.
function drawVoidTotemPrompt() {
    if (!hasActiveVoidTotem() || gamePaused) return;

    const dist = Math.hypot(player.x - voidTotem.x, player.y - voidTotem.y);
    if (dist > player.size + VOID_BOSS_TRIGGER_RADIUS) return;

    const pulse = 0.88 + 0.12 * Math.sin(frameCount * 0.2);
    const boxW = 360;
    const boxH = 44;
    const x = canvas.width / 2 - boxW / 2;
    const y = canvas.height - 130;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(8,5,25,0.85)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = 'rgba(195,150,255,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#f1e5ff';
    ctx.shadowColor = 'rgba(100,40,180,0.95)';
    ctx.shadowBlur = 8;
    ctx.fillText('PRESS E TO ENTER VOID FIGHT', canvas.width / 2, y + 28);
    ctx.restore();
}

// Draw Upgrade Hud keeps the game logic moving.
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

// Draw Inventory Hud keeps the game logic moving.
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

// Draw Loot Toast keeps the game logic moving.
function drawLootToast() {
    if (player.lastLootTimer <= 0) return;
    player.lastLootTimer--;

    const alpha = Math.min(1, player.lastLootTimer / 30);
    const y = 122 + Math.sin((220 - player.lastLootTimer) * 0.05) * 2;
    const text = player.lastLootText;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvas.width / 2, y);
    ctx.restore();
}

