// The main HUD overlays and screens are rendered here.




// Draw UI keeps the game logic moving.
function drawUI() {
    if (showFpsCounter) {
        ctx.save();
        ctx.textAlign  = 'center';
        ctx.font       = 'bold 13px monospace';
        ctx.fillStyle  = '#ff0000';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur  = 4;
        ctx.fillText(fps + ' FPS', canvas.width / 2, 18);
        ctx.restore();
    }

    if (devTestMode) {
        ctx.save();
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('DEV TEST MODE: 1 ENEMY PER WAVE', 20, 22);
        ctx.restore();
    }

    if (devCheatMenuEnabled) {
        const boxW = 290;
        const boxH = 44;
        const boxX = canvas.width / 2 - boxW / 2;
        const boxY = devTestMode ? 40 : 14;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = 'rgba(255,215,140,0.55)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('DEV CHEATS ENABLED', boxX + 8, boxY + 15);

        ctx.font = '11px Arial';
        ctx.fillStyle = '#ff0000';
        if (showCheatMenu) {
            ctx.fillText('K/F2: close cheat menu   Esc: close panel', boxX + 8, boxY + 33);
        } else {
            ctx.fillText('K/F2: open cheat menu', boxX + 8, boxY + 33);
        }
        ctx.restore();
    }


    ctx.save();
    ctx.font      = '10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('X: ' + Math.floor(player.x) + '  Y: ' + Math.floor(player.y), 20, canvas.height - 20);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    const waveLabel = `Level ${currentArenaLevel}  Wave ${currentWave}/${WAVES_PER_LEVEL}`;
    const alive = getAliveEnemyCount();

    const remainingNow = Math.max(0, enemiesRemainingInWave - alive);
    ctx.fillText(waveLabel, canvas.width - 22, 26);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText(`Enemies Remaining: ${enemiesRemainingInWave}`, canvas.width - 22, 48);
    ctx.fillStyle = 'rgba(220,220,220,0.9)';
    ctx.fillText(`To Spawn: ${remainingNow > 0 ? remainingNow : 0}`, canvas.width - 22, 68);
    const elapsedSeconds = Math.floor(elapsedGameMs / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    ctx.fillText(`Time: ${minutes}:${seconds}`, canvas.width - 22, 88);
    ctx.restore();

    drawVials();
    drawXpBar();
    drawAmmoBar();
    drawAmmoPowerupOverlay();
    drawInstakillPowerupOverlay();
    drawUpgradeHud();
    drawInventoryHud();
    drawLootToast();
    drawAmmoPickupArrow();
    drawLastEnemyArrow();
    drawCheatMenu();
    drawFinalWaveBanner()
}

// Draw Final Wave Banner keeps the game logic moving.
function drawFinalWaveBanner() {
    if (finalWaveBannerTimer <= 0) return;
    finalWaveBannerTimer--;
    const alpha = Math.min(1, finalWaveBannerTimer / 30);
    const pulse = 0.9 + 0.1 * Math.sin(frameCount * 0.3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(52 * pulse)}px Arial`;
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 18;
    ctx.fillText('FINAL WAVE', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText(`Level ${currentArenaLevel} - Survive to advance`, canvas.width / 2, canvas.height / 2 - 14);
    ctx.restore();
}

// Draw Minimap keeps the game logic moving.
function drawMinimap() {
    const BASE_MM_W = 260, BASE_MM_H = 220;
    const MM_W = Math.max(140, Math.round(BASE_MM_W * mapSize));
    const MM_H = Math.max(120, Math.round(BASE_MM_H * mapSize));
    const MM_X = canvas.width - MM_W - 20;
    const MM_Y = canvas.height - MM_H - 20;
    const scaleX = MM_W / (MAP_W * TILE);
    const scaleY = MM_H / (MAP_H * TILE);
    const viewOriginX = player.x - (MM_W * 0.5) / scaleX;
    const viewOriginY = player.y - (MM_H * 0.5) / scaleY;
    const mmCenterX = MM_X + MM_W / 2;
    const mmCenterY = MM_Y + MM_H / 2;
    const mmRadius = Math.min(MM_W, MM_H) * 0.5 - 1;

    ctx.save();

    function traceMinimapShape() {
        if (mapShape === 'circle') {
            ctx.arc(mmCenterX, mmCenterY, mmRadius, 0, Math.PI * 2);
            return;
        }
        if (mapShape === 'hexagon') {
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i + Math.PI / 6;
                const x = mmCenterX + mmRadius * Math.cos(angle);
                const y = mmCenterY + mmRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            return;
        }
        ctx.rect(MM_X, MM_Y, MM_W, MM_H);
    }

    ctx.save();
    ctx.globalAlpha = mapOpacity;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    traceMinimapShape();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    traceMinimapShape();
    ctx.clip();

    ctx.fillStyle = '#808080';
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (isSolidTileType(mapTiles[y][x])) {
                ctx.fillRect(
                    MM_X + (x * TILE - viewOriginX) * scaleX,
                    MM_Y + (y * TILE - viewOriginY) * scaleY,
                    Math.ceil(TILE * scaleX),
                    Math.ceil(TILE * scaleY)
                );
            }
        }
    }


    for (const p of pickups) {
        ctx.fillStyle = p.type === 'ammo' ? '#ffff00'
            : p.type === 'heal' ? '#00ff00'
            : p.type === 'instakill' ? '#ff0000'
            : '#00ff00';
        ctx.beginPath();
        ctx.arc(MM_X + (p.x - viewOriginX) * scaleX, MM_Y + (p.y - viewOriginY) * scaleY, 2, 0, Math.PI * 2);
        ctx.fill();
    }


    ctx.fillStyle = '#ff0000';
    for (const chest of chests) {
        ctx.fillRect(MM_X + (chest.x - viewOriginX) * scaleX - 2, MM_Y + (chest.y - viewOriginY) * scaleY - 2, 4, 4);
    }


    ctx.fillStyle = '#ff0000';
    for (const e of enemies) {
        if (!e.alive) continue;
        ctx.beginPath();
        ctx.arc(MM_X + (e.x - viewOriginX) * scaleX, MM_Y + (e.y - viewOriginY) * scaleY, 2, 0, Math.PI * 2);
        ctx.fill();
    }


    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(MM_X + (player.x - viewOriginX) * scaleX, MM_Y + (player.y - viewOriginY) * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = mapOpacity;
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    ctx.beginPath();
    traceMinimapShape();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

// Draw Pause Overlay keeps the game logic moving.
function drawPauseOverlay() {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = '16px Arial';
    ctx.fillText('Press Escape to resume', canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
}

// Draw Visibility Mask keeps the game logic moving.
function drawVisibilityMask() {
    if (fogCanvas.width !== canvas.width || fogCanvas.height !== canvas.height) {
        fogCanvas.width  = canvas.width;
        fogCanvas.height = canvas.height;
    }

    const rx = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const ry = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const s  = toScreen(rx, ry);

    fogCtx.save();
    fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
    const g = fogCtx.createRadialGradient(s.x, s.y, 120, s.x, s.y, 420);
    g.addColorStop(0,   'rgba(0,0,0,0)');
    g.addColorStop(0.4, 'rgba(0,0,0,0.4)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.75)');
    g.addColorStop(1,   'rgba(0,0,0,1)');
    fogCtx.fillStyle = g;
    fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);


    fogCtx.globalCompositeOperation = 'destination-out';
    for (const p of projectiles) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const ps  = toScreen(prx, pry);


        const lightRadius = Math.max(112, p.size * 26);
        const bulletLight = fogCtx.createRadialGradient(ps.x, ps.y, 0, ps.x, ps.y, lightRadius);
        bulletLight.addColorStop(0,    'rgba(0,0,0,0.56)');
        bulletLight.addColorStop(0.22, 'rgba(0,0,0,0.42)');
        bulletLight.addColorStop(0.5,  'rgba(0,0,0,0.24)');
        bulletLight.addColorStop(0.78, 'rgba(0,0,0,0.1)');
        bulletLight.addColorStop(1,   'rgba(0,0,0,0)');

        fogCtx.fillStyle = bulletLight;
        fogCtx.beginPath();
        fogCtx.arc(ps.x, ps.y, lightRadius, 0, Math.PI * 2);
        fogCtx.fill();
    }
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.restore();

    ctx.drawImage(fogCanvas, 0, 0);
}

// Draw Low Health Marker keeps the game logic moving.
function drawLowHealthMarker() {
    if (player.hp > 30 || player.hp <= 0) return;

    const alpha = Math.min(0.18, (30 - player.hp) / 120);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

