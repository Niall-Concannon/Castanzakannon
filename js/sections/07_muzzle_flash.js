// Muzzle flash drawing and spark effects live here.




// Draw Muzzle Flashes keeps the game logic moving.
function drawMuzzleFlashes() {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        const f    = muzzleFlashes[i];
        f.age++;
        if (f.age >= MUZZLE_LIFE) { muzzleFlashes.splice(i, 1); continue; }

        const life = 1 - f.age / MUZZLE_LIFE;
        const sc   = toScreen(f.x, f.y);

        ctx.save();


        const flashR = 10 * life;
        const flashG = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, flashR);
        flashG.addColorStop(0,   `rgba(255,240,180,${life})`);
        flashG.addColorStop(0.4, `rgba(255,140,30,${life * 0.85})`);
        flashG.addColorStop(1,   `rgba(255,80,0,0)`);
        ctx.fillStyle = flashG;
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, flashR, 0, Math.PI * 2);
        ctx.fill();


        const flareLen = 18 * life;
        const flareG   = ctx.createLinearGradient(
            sc.x, sc.y,
            sc.x + Math.cos(f.angle) * flareLen,
            sc.y + Math.sin(f.angle) * flareLen
        );
        flareG.addColorStop(0,   `rgba(255,220,100,${life * 0.9})`);
        flareG.addColorStop(0.5, `rgba(255,100,20,${life * 0.5})`);
        flareG.addColorStop(1,   'rgba(255,60,0,0)');
        ctx.strokeStyle = flareG;
        ctx.lineWidth   = 5 * life;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(sc.x, sc.y);
        ctx.lineTo(
            sc.x + Math.cos(f.angle) * flareLen,
            sc.y + Math.sin(f.angle) * flareLen
        );
        ctx.stroke();


        for (const sp of f.sparks) {
            const tx = sc.x + sp.vx * f.age;
            const ty = sc.y + sp.vy * f.age;
            const sparkAlpha = life * 0.9;
            ctx.strokeStyle = `rgba(255,${180 + Math.floor(70 * life)},50,${sparkAlpha})`;
            ctx.lineWidth   = 1.5 * life;
            ctx.shadowColor = 'rgba(255,160,30,0.8)';
            ctx.shadowBlur  = 4;
            ctx.beginPath();
            ctx.moveTo(sc.x, sc.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();


            ctx.fillStyle = `rgba(255,240,180,${sparkAlpha})`;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.5 * life, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

