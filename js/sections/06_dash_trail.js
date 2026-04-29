// draws the colorful trail of ghosts behind the player when they dash




// takes a sprite and paints it as a solid color silhouette on the offscreen tint canvas
// flipX flips it horizontally if the player is facing left
function buildSilhouette(sprite, dw, dh, flipX, color) {

    // grow the temp canvas if our sprite is bigger than what we had before
    if (_tintCanvas.width < dw || _tintCanvas.height < dh) {
        _tintCanvas.width  = Math.max(_tintCanvas.width,  dw);
        _tintCanvas.height = Math.max(_tintCanvas.height, dh);
    }

    _tintCtx.clearRect(0, 0, dw, dh);


    // draw the sprite, flipped if needed
    _tintCtx.save();
    if (flipX) {
        _tintCtx.translate(dw, 0);
        _tintCtx.scale(-1, 1);
    }
    _tintCtx.drawImage(sprite, 0, 0, dw, dh);
    _tintCtx.restore();


    // source-in means we only paint where the sprite already is, so it tints the shape
    _tintCtx.globalCompositeOperation = 'source-in';
    _tintCtx.fillStyle = color;
    _tintCtx.fillRect(0, 0, dw, dh);
    _tintCtx.globalCompositeOperation = 'source-over';
}

// draws each ghost in the dash trail with a glow and a fading alpha
function drawDashTrail() {
    if (dashTrail.length === 0) return;

    const total   = dashTrail.length;

    const size    = player.size * 2;
    const ghostSprite = getPlayerSprite('idle');
    if (!ghostSprite.complete || !ghostSprite.naturalWidth) return;

    for (let i = 0; i < total; i++) {
        const g    = dashTrail[i];
        // life goes from 1 to 0 as the ghost ages, used to fade it out
        const life = 1 - g.age / TRAIL_LIFETIME;
        if (life <= 0) continue;


        // t is 0 for the oldest ghost and 1 for the newest, picks color from the gradient
        const t = i / Math.max(total - 1, 1);


        // pick a color from the sandev palette based on where this ghost is in the trail
        const ci  = Math.min(Math.floor(t * SANDEV_COLORS.length), SANDEV_COLORS.length - 1);
        const col = SANDEV_COLORS[ci];
        const colorStr = `rgb(${col.r},${col.g},${col.b})`;


        // newer ghosts are more visible than older ones
        const baseAlpha = 0.35 + t * 0.55;
        const alpha     = baseAlpha * life;

        const sc = toScreen(g.x, g.y);


        // soft glow blob behind the silhouette
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


        // build the colored silhouette and stamp it down centered on the ghost spot
        const dw = size, dh = size;
        buildSilhouette(ghostSprite, dw, dh, g.flipX, colorStr);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(_tintCanvas, 0, 0, dw, dh, sc.x - dw / 2, sc.y - dh / 2, dw, dh);
        ctx.restore();


        // for the fresher ghosts, draw a slightly smaller white silhouette on top for shine
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

