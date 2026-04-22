// The health and dash vials are drawn in this file.




// Vial Interior Path keeps the game logic moving.
function vialInteriorPath(sc) {
    const ncx = VCX * sc, nW2 = (VNECK_W / 2) * sc;
    const nY1 = VNECK_Y1 * sc, nY2 = VNECK_Y2 * sc;
    const sY1 = VSHOULDER_Y1 * sc, sY2 = VSHOULDER_Y2 * sc;
    const bW2 = (VBODY_W / 2) * sc;
    const bX1 = (VCX - VBODY_W / 2) * sc, bX2 = (VCX + VBODY_W / 2) * sc;
    const bY1 = VBODY_Y1 * sc, bY2 = VBODY_Y2 * sc, br = VBRAD * sc;

    ctx.rect(ncx - nW2, nY1, nW2 * 2, nY2 - nY1);
    ctx.moveTo(ncx - nW2, sY1); ctx.lineTo(ncx + nW2, sY1); ctx.lineTo(bX2, sY2); ctx.lineTo(bX1, sY2); ctx.closePath();
    ctx.moveTo(bX1 + br, bY1); ctx.lineTo(bX2 - br, bY1); ctx.arcTo(bX2, bY1, bX2, bY1 + br, br);
    ctx.lineTo(bX2, bY2 - br); ctx.arcTo(bX2, bY2, bX2 - br, bY2, br);
    ctx.lineTo(bX1 + br, bY2); ctx.arcTo(bX1, bY2, bX1, bY2 - br, br);
    ctx.lineTo(bX1, bY1 + br); ctx.arcTo(bX1, bY1, bX1 + br, bY1, br); ctx.closePath();
}

// Draw Vial keeps the game logic moving.
function drawVial(screenX, screenY, fillPercent, colors, glowSprite, label, valueText = '') {
    const sc = VIAL_SCALE;
    const W  = VSRC_W * sc, H = VSRC_H * sc;
    const GW = (VSRC_W + 40) * sc, GH = (VSRC_H + 40) * sc;
    const gp = 0.75 + 0.25 * Math.sin(frameCount * 0.04);

    ctx.save();
    ctx.globalAlpha = gp * 0.85;
    ctx.drawImage(glowSprite, screenX - 20 * sc, screenY - 20 * sc, GW, GH);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.drawImage(vialBgSprite, 0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    vialInteriorPath(sc);
    ctx.clip();

    const lat = VSHOULDER_Y1 * sc, lab = VBODY_Y2 * sc;
    const lh  = (lab - lat) * Math.max(0, Math.min(1, fillPercent));
    const lty = lab - lh;
    const wA  = 3.5 * sc, wF = 0.10 / sc, wP = frameCount * 0.055;
    const w2F = wF * 1.6,  w2P = frameCount * 0.038;
    const bx1s = (VCX - VBODY_W / 2 - 2) * sc, bx2s = (VCX + VBODY_W / 2 + 2) * sc;

    const lg = ctx.createLinearGradient(0, lty, 0, lab);
    lg.addColorStop(0,   colors.top);
    lg.addColorStop(0.4, colors.mid);
    lg.addColorStop(1,   colors.bot);
    ctx.fillStyle = lg;

    ctx.beginPath();
    ctx.moveTo(bx1s, lty);
    for (let x = bx1s; x <= bx2s; x += 1) {
        ctx.lineTo(x, lty + Math.sin(x * wF + wP) * wA + Math.sin(x * w2F + w2P) * wA * 0.45);
    }
    ctx.lineTo(bx2s, lab + 4); ctx.lineTo(bx1s, lab + 4); ctx.closePath(); ctx.fill();

    const sg = ctx.createLinearGradient(0, lty, 0, lty + 18 * sc);
    sg.addColorStop(0, 'rgba(255,255,255,0.22)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(bx1s, lty);
    for (let x = bx1s; x <= bx2s; x += 1) {
        ctx.lineTo(x, lty + Math.sin(x * wF + wP) * wA + Math.sin(x * w2F + w2P) * wA * 0.45);
    }
    ctx.lineTo(bx2s, lty + 18 * sc); ctx.lineTo(bx1s, lty + 18 * sc); ctx.closePath(); ctx.fill();

    if (fillPercent > 0.08 && vialBubblesSprite.complete && vialBubblesSprite.naturalWidth) {
        const bf = Math.floor(frameCount / 7) % 4;
        ctx.globalAlpha = 0.45 * fillPercent;
        ctx.drawImage(vialBubblesSprite, bf * VSRC_W, 0, VSRC_W, VSRC_H, 0, 0, W, H);
        ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.drawImage(vialFrameSprite, 0, 0, W, H);

    if (colors.bot === 'red' && fillPercent < 0.25) {
        const fl = 0.12 + 0.12 * Math.sin(frameCount * 0.35);
        ctx.save();
        ctx.beginPath();
        vialInteriorPath(sc);
        ctx.clip();
        ctx.fillStyle = `rgba(255,0,0,${fl})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    ctx.textAlign  = 'center';
    ctx.font       = `bold ${Math.round(13 * sc)}px Arial`;
    ctx.shadowColor = 'black';
    ctx.shadowBlur  = 5;
    ctx.fillStyle   = 'rgba(220,220,255,0.92)';
    ctx.fillText(label, W / 2, H + 18 * sc);

    if (valueText) {
        ctx.font       = `bold ${Math.round(12 * sc)}px Arial`;
        ctx.fillStyle  = 'rgba(245,245,255,0.95)';
        ctx.fillText(valueText, W / 2, H + 34 * sc);
    }

    ctx.shadowBlur  = 0;
    ctx.restore();
}

// Draw Vials keeps the game logic moving.
function drawVials() {
    const lp = 12, tp = 18, gap = 12;
    const hpY   = tp;
    const dashY = tp;
    const hpX   = lp;
    const dashX = lp + VIAL_W + gap;
    const hf    = player.hp / player.maxHp;

    const hc = hf > 0.5
        ? { top: 'red', mid: 'red', bot: 'red' }
        : hf > 0.25
        ? { top: 'red', mid: 'red', bot: 'red' }
        : { top: 'red', mid: 'red', bot: 'red' };

    const hpValue = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    drawVial(hpX, hpY, hf, hc, vialGlowHpSprite, 'â¤  HP', hpValue);

    const baseCharges = player.dashCharges;
    const hasPartial = player.dashCharges < player.dashMaxCharges;
    const partial = hasPartial ? Math.max(0, Math.min(1, 1 - player.dashCooldown / player.dashRechargeFrames)) : 0;
    const df = Math.max(0, Math.min(1, (baseCharges + partial) / player.dashMaxCharges));
    const dr = player.dashCharges > 0;
    const dc = dr
        ? { top: 'red', mid: 'red', bot: 'red' }
        : { top: 'red', mid: 'red', bot: 'red' };

    const dashValue = `${player.dashCharges}/${player.dashMaxCharges}`;
    drawVial(dashX, dashY, df, dc, vialGlowDashSprite, 'âš¡ DASH', dashValue);

    if (dr) {
        const ra = 0.55 + 0.45 * Math.abs(Math.sin(frameCount * 0.07));
        ctx.save();
        ctx.globalAlpha = ra;
        ctx.fillStyle   = 'red';
        ctx.font        = `bold ${Math.round(11 * VIAL_SCALE)}px Arial`;
        ctx.textAlign   = 'center';
        ctx.shadowColor = 'red';
        ctx.shadowBlur  = 8;
        ctx.fillText('READY', dashX + VIAL_W / 2, dashY - 6);
        ctx.restore();
    }
}

