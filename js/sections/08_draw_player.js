// draws the player sprite and whatever weapon they got equipped




// main player draw function. handles body, ring, weapon, muzzle flashes etc
function drawPlayer() {

    drawDashTrail();

    // smooth the player position between frames so movement looks nice
    const rx = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const ry = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const s  = toScreen(rx, ry);
    const size = player.size * 2;

    // flicker when player is invulnerable, just toggles every few frames
    const flickering = player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0;
    const bodySprite = getPlayerSprite(playerAnim.frame);
    // if dashing keep the dash flip locked, otherwise flip based on facing direction
    const flipX      = player.dashing ? playerAnim.dashFlipX : player.facing === -1;

    // draw the player body, flipping horizontally if needed
    ctx.save();
    if (flickering) ctx.globalAlpha = 0.35;
    if (flipX) {
        ctx.translate(s.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(bodySprite, -size / 2, s.y - size / 2, size, size);
    } else {
        ctx.drawImage(bodySprite, s.x - size / 2, s.y - size / 2, size, size);
    }
    ctx.restore();


    // faint ring around the player showing where the gun orbits
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, RAIL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,180,180,0.18)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();
    ctx.restore();

    // flash a blue shockwave ring when the aoe pulse goes off
    if (player.aoePulseFlash > 0 && player.aoePulseRadius > 0) {
        const pulseT = player.aoePulseFlash / 8;
        const ringRadius = player.aoePulseRadius * (1 + (1 - pulseT) * 0.18);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = `rgba(120,220,255,${0.6 * pulseT})`;
        ctx.lineWidth = 5 * pulseT;
        ctx.shadowColor = 'rgba(120,220,255,0.9)';
        ctx.shadowBlur = 14 * pulseT;
        ctx.beginPath();
        ctx.arc(s.x, s.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }


    // figure out where the weapon should sit on the orbit ring around the player
    const angle      = player.weaponAngle;
    const gunScreenX = s.x + Math.cos(angle) * RAIL_RADIUS;
    const gunScreenY = s.y + Math.sin(angle) * RAIL_RADIUS;

    // void sword is built out of stacked sprite chunks, top + middles + bot
    if (player.weaponType === 'void_sword') {
        ctx.save();
        if (flickering) ctx.globalAlpha = 0.35;
        ctx.translate(gunScreenX, gunScreenY);
        ctx.rotate(angle + Math.PI / 2);
        const w = VOID_SWORD_BLADE_THICKNESS;
        const { activeMid } = getVoidSwordGeometry();
        let cursor = 0;
        ctx.drawImage(voidSwordSprites.bot, -w / 2, -(cursor + VOID_SWORD_BOT_LEN), w, VOID_SWORD_BOT_LEN);
        cursor += VOID_SWORD_BOT_LEN;
        for (let i = 0; i < activeMid; i++) {
            ctx.drawImage(voidSwordSprites.mid, -w / 2, -(cursor + VOID_SWORD_MID_LEN), w, VOID_SWORD_MID_LEN);
            cursor += VOID_SWORD_MID_LEN;
        }
        ctx.drawImage(voidSwordSprites.top, -w / 2, -(cursor + VOID_SWORD_TOP_LEN), w, VOID_SWORD_TOP_LEN);
        ctx.restore();
    // staff has its own size + idle/shoot sprites, draw it pointing the same way
    } else if (player.weaponType === 'necromancer_staff') {
        const isFiring = mouseDown && player.shootCooldown > 0;
        const weaponSprites = weaponGunSprites.necromancer_staff;
        const gunSprite  = isFiring ? weaponSprites.shoot : weaponSprites.idle;
        const staffH = 60;
        const aspect = (gunSprite.naturalWidth && gunSprite.naturalHeight)
            ? gunSprite.naturalWidth / gunSprite.naturalHeight
            : 144 / 390;
        const staffW = staffH * aspect;

        ctx.save();
        if (flickering) ctx.globalAlpha = 0.35;
        ctx.translate(gunScreenX, gunScreenY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.drawImage(gunSprite, -staffW / 2, -staffH, staffW, staffH);
        ctx.restore();

        drawMuzzleFlashes();
    // any normal gun, picks idle or shooting sprite and rotates it to point at the cursor
    } else {
        const isFiring   = mouseDown && player.shootCooldown > 0;
        const weaponSprites = weaponGunSprites[player.weaponType] ?? weaponGunSprites.assault_rifle;
        const gunSprite  = isFiring ? weaponSprites.shoot : weaponSprites.idle;

        ctx.save();
        if (flickering) ctx.globalAlpha = 0.35;
        ctx.translate(gunScreenX, gunScreenY);
        ctx.rotate(angle);
        // when aiming left, flip the gun upside down so it doesnt look weird
        if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);
        ctx.drawImage(gunSprite, -GUN_W / 2, -GUN_H / 2, GUN_W, GUN_H);
        ctx.restore();

        drawMuzzleFlashes();
    }
}

