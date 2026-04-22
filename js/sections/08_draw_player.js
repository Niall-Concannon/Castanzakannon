// Player rendering and weapon drawing happen here.




// Draw Player keeps the game logic moving.
function drawPlayer() {

    drawDashTrail();

    const rx = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const ry = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const s  = toScreen(rx, ry);
    const size = player.size * 2;

    const flickering = player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0;
    const bodySprite = getPlayerSprite(playerAnim.frame);
    const flipX      = player.dashing ? playerAnim.dashFlipX : player.facing === -1;

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


    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, RAIL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,180,180,0.18)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();
    ctx.restore();

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


    const angle      = player.weaponAngle;
    const gunScreenX = s.x + Math.cos(angle) * RAIL_RADIUS;
    const gunScreenY = s.y + Math.sin(angle) * RAIL_RADIUS;
    const isFiring   = mouseDown && player.shootCooldown > 0;
    const gunSprite  = isFiring ? gunSprites.shoot : gunSprites.idle;

    ctx.save();
    if (flickering) ctx.globalAlpha = 0.35;
    ctx.translate(gunScreenX, gunScreenY);
    ctx.rotate(angle);
    if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);
    ctx.drawImage(gunSprite, -GUN_W / 2, -GUN_H / 2, GUN_W, GUN_H);
    ctx.restore();

    drawMuzzleFlashes();
}

