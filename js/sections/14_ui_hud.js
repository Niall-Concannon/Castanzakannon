// The main HUD overlays and screens are rendered here.




// Draw UI keeps the game logic moving.
function drawUI() {
    if (showFpsCounter) {
        ctx.save();
        ctx.textAlign  = 'left';
        ctx.font       = 'bold 13px monospace';
        ctx.fillStyle  = '#ff0000';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur  = 4;
        ctx.fillText(fps + ' FPS', 10, canvas.height - 10);
        ctx.restore();
    }

    if (devTestMode) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('DEV TEST MODE: 1 ENEMY PER WAVE', canvas.width / 2, 22);
        ctx.restore();
    }

    if (devCheatMenuEnabled) {
        const boxW = 290;
        const boxH = 44;
        const boxX = 18;
        const boxY = Math.max(120, Math.floor(canvas.height * 0.5) - Math.floor(boxH / 2));

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
            ctx.fillText('K: items menu   Esc: close panel', boxX + 8, boxY + 33);
        } else {
            ctx.fillText('K: open items menu', boxX + 8, boxY + 33);
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
    const waveLabel = endlessMode
        ? `∞ Endless Wave ${endlessWave}`
        : `Level ${currentArenaLevel}  Wave ${currentWave}/${WAVES_PER_LEVEL}`;
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

    if ((player.dashLockFrames ?? 0) > 0) {
        const secs = Math.ceil((player.dashLockFrames * FIXED_STEP) / 1000);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#d9b8ff';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 8;
        ctx.fillText(`DASH LOCK ${secs}s`, canvas.width / 2, 34);
        ctx.restore();
    }

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
    drawVoidTotemArrow();
    drawVoidTotemPrompt();
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


    for (const chest of chests) {
        const cx = MM_X + (chest.x - viewOriginX) * scaleX;
        const cy = MM_Y + (chest.y - viewOriginY) * scaleY;
        const color = chest.bossChest ? '#ffe272' : '#ffd060';
        const r = 3;
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
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

    // Totems on minimap
    const totemsToDraw = [];
    if (voidTotem && voidTotem.active)           totemsToDraw.push({ t: voidTotem,        color: '#cc44ff' });
    if (necromancerTotem && necromancerTotem.active) totemsToDraw.push({ t: necromancerTotem, color: '#44ffaa' });
    for (const { t, color } of totemsToDraw) {
        const tx = MM_X + (t.x - viewOriginX) * scaleX;
        const ty = MM_Y + (t.y - viewOriginY) * scaleY;
        // Pulsing diamond shape
        const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.08);
        const r = 5 * pulse;
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(tx,     ty - r);
        ctx.lineTo(tx + r, ty    );
        ctx.lineTo(tx,     ty + r);
        ctx.lineTo(tx - r, ty    );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
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

// Returns layout rects for the pause menu panel and its elements.
function getPauseMenuLayout() {
    const panelW = Math.min(420, Math.floor(canvas.width * 0.52));
    const panelH = Math.min(380, Math.floor(canvas.height * 0.62));
    const panelX = Math.floor(canvas.width  / 2 - panelW / 2);
    const panelY = Math.floor(canvas.height / 2 - panelH / 2);
    const sliderW = Math.floor(panelW * 0.72);
    const sliderX = Math.floor(canvas.width / 2 - sliderW / 2);
    const row1Y = panelY + Math.floor(panelH * 0.33);   // Music label baseline
    const row2Y = panelY + Math.floor(panelH * 0.54);   // SFX label baseline
    const btnW  = Math.floor(panelW * 0.48);
    const btnH  = 42;
    const btnGap = 14;
    const btnY  = panelY + panelH - btnH - 22;
    return {
        panel:       { x: panelX, y: panelY, w: panelW, h: panelH },
        musicLabel:  { x: sliderX, y: row1Y },
        musicSlider: { x: sliderX, y: row1Y + 18, w: sliderW, h: 8 },
        sfxLabel:    { x: sliderX, y: row2Y },
        sfxSlider:   { x: sliderX, y: row2Y + 18, w: sliderW, h: 8 },
        resumeBtn:   { x: Math.floor(canvas.width / 2 - btnW - btnGap / 2), y: btnY, w: btnW, h: btnH },
        menuBtn:     { x: Math.floor(canvas.width / 2 + btnGap / 2),        y: btnY, w: btnW, h: btnH },
    };
}

// Draw Pause Overlay keeps the game logic moving.
function drawPauseOverlay() {
    const lay = getPauseMenuLayout();
    const p   = lay.panel;
    const cx  = canvas.width / 2;

    // Dim background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Panel background + border
    ctx.fillStyle = 'rgba(8,8,18,0.96)';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // Title
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.font        = 'bold 36px Arial';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowColor = '#aabbff';
    ctx.shadowBlur  = 18;
    ctx.fillText('PAUSED', cx, p.y + 44);
    ctx.shadowBlur = 0;

    // Subtitle hint
    ctx.font      = '13px Arial';
    ctx.fillStyle = 'rgba(180,200,255,0.65)';
    ctx.fillText('Esc to resume  ·  Audio Settings', cx, p.y + 74);

    // ── Music Volume ──
    const sliderHandleR = 7;
    const musicNorm = musicVolume;
    const sfxNorm   = sfxVolume;

    ctx.textAlign   = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font        = '15px Arial';
    ctx.fillStyle   = '#d8eaff';
    ctx.fillText('Music Volume', lay.musicLabel.x, lay.musicLabel.y);
    ctx.textAlign   = 'right';
    ctx.fillStyle   = '#8ab4e8';
    ctx.fillText(Math.round(musicNorm * 100) + '%', lay.musicLabel.x + lay.musicSlider.w, lay.musicLabel.y);

    _drawPauseSlider(lay.musicSlider.x, lay.musicSlider.y, lay.musicSlider.w, musicNorm, sliderHandleR);

    // ── SFX Volume ──
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font        = '15px Arial';
    ctx.fillStyle   = '#d8eaff';
    ctx.fillText('Game Audio Volume', lay.sfxLabel.x, lay.sfxLabel.y);
    ctx.textAlign   = 'right';
    ctx.fillStyle   = '#8ab4e8';
    ctx.fillText(Math.round(sfxNorm * 100) + '%', lay.sfxLabel.x + lay.sfxSlider.w, lay.sfxLabel.y);

    _drawPauseSlider(lay.sfxSlider.x, lay.sfxSlider.y, lay.sfxSlider.w, sfxNorm, sliderHandleR);

    // ── Buttons ──
    _drawPauseButton(lay.resumeBtn, 'Resume', mouseX, mouseY, '#1a3a1a', '#2ecc71');
    _drawPauseButton(lay.menuBtn,   'Main Menu', mouseX, mouseY, '#2a1a1a', '#e05555');

    ctx.restore();
}

function _drawPauseSlider(x, y, w, norm, hr) {
    const hx = x + norm * w;
    // Track background
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y - 2, w, 4);
    // Filled portion
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(x, y - 3, norm * w, 6);
    // Handle
    ctx.beginPath();
    ctx.arc(hx, y, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#4a9eff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function _drawPauseButton(btn, label, mx, my) {
    const hover = mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
    const bgColor = label === 'Resume'
        ? (hover ? '#2ecc71' : 'rgba(46,204,113,0.18)')
        : (hover ? '#e05555' : 'rgba(224,85,85,0.18)');
    const borderColor = label === 'Resume' ? '#2ecc71' : '#e05555';

    ctx.fillStyle   = bgColor;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `${hover ? 'bold ' : ''}16px Arial`;
    ctx.fillStyle    = hover ? '#ffffff' : borderColor;
    ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
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

    for (const deco of levelDecorations) {
        if (deco.type !== 'skullCandle') continue;

        const width = deco.drawWidth ?? 30;
        const height = deco.drawHeight ?? 34;
        const worldX = deco.x - width * 0.5;
        const worldY = deco.y - height + TILE * 0.5;
        const ds = toScreen(worldX, worldY);
        const sx = Math.round(ds.x);
        const sy = Math.round(ds.y);

        if (sx > canvas.width + width || sx < -width || sy > canvas.height + height || sy < -height) continue;

        const flameX = sx + width * 0.5;
        const flameY = sy + height * 0.17;
        const glowR = Math.max(26, Math.min(44, width * 1.3));
        const candleLight = fogCtx.createRadialGradient(flameX, flameY, glowR * 0.16, flameX, flameY, glowR);
        candleLight.addColorStop(0, 'rgba(0,0,0,0.48)');
        candleLight.addColorStop(0.42, 'rgba(0,0,0,0.25)');
        candleLight.addColorStop(1, 'rgba(0,0,0,0)');
        fogCtx.fillStyle = candleLight;
        fogCtx.beginPath();
        fogCtx.arc(flameX, flameY, glowR, 0, Math.PI * 2);
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

