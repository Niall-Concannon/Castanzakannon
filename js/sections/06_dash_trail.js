// Dash trail rendering is handled in this file.







// Build Silhouette keeps the game logic moving.
function buildSilhouette(sprite, dw, dh, flipX, color) {

    if (_tintCanvas.width < dw || _tintCanvas.height < dh) {
        _tintCanvas.width  = Math.max(_tintCanvas.width,  dw);
        _tintCanvas.height = Math.max(_tintCanvas.height, dh);
    }

    _tintCtx.clearRect(0, 0, dw, dh);


    _tintCtx.save();
    if (flipX) {
        _tintCtx.translate(dw, 0);
        _tintCtx.scale(-1, 1);
    }
    _tintCtx.drawImage(sprite, 0, 0, dw, dh);
    _tintCtx.restore();


    _tintCtx.globalCompositeOperation = 'source-in';
    _tintCtx.fillStyle = color;
    _tintCtx.fillRect(0, 0, dw, dh);
    _tintCtx.globalCompositeOperation = 'source-over';
}

// Draw Dash Trail keeps the game logic moving.
function drawDashTrail() {
    if (dashTrail.length === 0) return;

    const total   = dashTrail.length;

    const size    = player.size * 2;
    const ghostSprite = getPlayerSprite('idle');
    if (!ghostSprite.complete || !ghostSprite.naturalWidth) return;

    for (let i = 0; i < total; i++) {
        const g    = dashTrail[i];
        const life = 1 - g.age / TRAIL_LIFETIME;
        if (life <= 0) continue;


        const t = i / Math.max(total - 1, 1);


        const ci  = Math.min(Math.floor(t * SANDEV_COLORS.length), SANDEV_COLORS.length - 1);
        const col = SANDEV_COLORS[ci];
        const colorStr = `rgb(${col.r},${col.g},${col.b})`;


        const baseAlpha = 0.35 + t * 0.55;
        const alpha     = baseAlpha * life;

        const sc = toScreen(g.x, g.y);


        const glowR = size * (0.9 + t * 0.4) * life;
        const grd   = ctx.createRadialGradient(sc.x, sc.y, size * 0.1, sc.x, sc.y, glowR);
        grd.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},${(alpha * 0.6).toFixed(3)})`);
        grd.addColorStop(0.5, `rgba(${col.r},${col.g},${col.b},${(alpha * 0.2).toFixed(3)})`);
        grd.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);
        ctx.save();
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();


        const dw = size, dh = size;
        buildSilhouette(ghostSprite, dw, dh, g.flipX, colorStr);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(_tintCanvas, 0, 0, dw, dh, sc.x - dw / 2, sc.y - dh / 2, dw, dh);
        ctx.restore();


        if (life > 0.3) {
            const rimAlpha = alpha * 0.55;
            const rimScale = 0.82;
            const rw = dw * rimScale, rh = dh * rimScale;
            buildSilhouette(ghostSprite, dw, dh, g.flipX, `rgba(255,255,255,0.9)`);
            ctx.save();
            ctx.globalAlpha = rimAlpha * life;
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(_tintCanvas, 0, 0, dw, dh,
                sc.x - rw / 2, sc.y - rh / 2, rw, rh);
            ctx.restore();
        }
    }
}

