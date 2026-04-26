// The fixed step loop and frame startup code are at the bottom of the stack.




// Game Loop keeps the game logic moving.
function gameLoop(timestamp) {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const dt = Math.min(timestamp - lastTimestamp, 100);
    lastTimestamp = timestamp;

    syncDevTestWaveControl();
    syncAudioControlPanel();

    fps = dt > 0 ? Math.round(1000 / dt) : fps;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'splash')   { drawSplash();   requestAnimationFrame(gameLoop); return; }
    if (gameState === 'splashTransition') {
        splashFadeTimerMs = Math.min(SPLASH_FADE_DURATION_MS, splashFadeTimerMs + dt);
        const half = SPLASH_FADE_DURATION_MS / 2;
        let fadeAlpha;
        if (splashFadeTimerMs <= half) {
            drawSplash();
            fadeAlpha = splashFadeTimerMs / half;
        } else {
            drawMenu();
            fadeAlpha = 1 - (splashFadeTimerMs - half) / half;
        }
        drawBlackFade(fadeAlpha);

        if (splashFadeTimerMs >= SPLASH_FADE_DURATION_MS) {
            gameState = 'menu';
            splashFadeTimerMs = 0;
        }

        requestAnimationFrame(gameLoop);
        return;
    }
    if (gameState === 'menu')         { drawMenu();               requestAnimationFrame(gameLoop); return; }
    if (gameState === 'weaponSelect') { drawWeaponSelectScreen(); requestAnimationFrame(gameLoop); return; }
    if (gameState === 'gameOver')     { drawGameOver();           requestAnimationFrame(gameLoop); return; }
    if (gameState === 'win')          { drawWinScreen();          requestAnimationFrame(gameLoop); return; }

    if (gameState === 'playing' && !gamePaused) {
        elapsedGameMs += dt;
        accumulator += dt;

        while (accumulator >= FIXED_STEP) {
            savePrevPositions();
            updatePlayer();
            updateWaveSpawner();
            updateEnemies();
            updateTumorTurrets();
            updateProjectiles();
            updateEnemyProjectiles();
            cleanupDeadEnemies();
            updateWaveProgression();
            updatePickups();
            updateChests();
            updateDamageNumbers();
            frameCount++;
            accumulator -= FIXED_STEP;
        }
        renderAlpha = accumulator / FIXED_STEP;
    } else {

        frameCount++;
        renderAlpha = 1;
    }

    updateCamera(renderAlpha);
    drawMap();
    if (fogEnabled) drawVisibilityMask();
    drawPlayer();
    drawEnemies();
    drawTumorTurrets();
    drawProjectiles();
    drawEnemyProjectiles();
    drawChests();
    drawVoidTotemObjective();
    drawPickups();
    drawDamageNumbers();
    drawLowHealthMarker();
    drawMinimap();
    drawUI();
    if (gamePaused) drawPauseOverlay();
    if (gameState === 'levelUp') drawLevelUpMenu();
    drawCursor();

    requestAnimationFrame(gameLoop);
}

generateMap();
styleAudioControls();

musicVolume = readStoredVolume(AUDIO_STORAGE_KEYS.music, musicVolume);
sfxVolume = readStoredVolume(AUDIO_STORAGE_KEYS.sfx, sfxVolume);

musicVolumeSlider.addEventListener('input', () => {
    setMusicVolume(Number(musicVolumeSlider.value) / 100);
});

sfxVolumeSlider.addEventListener('input', () => {
    setSfxVolume(Number(sfxVolumeSlider.value) / 100);
});

setMusicVolume(musicVolume, { persist: false });
setSfxVolume(sfxVolume, { persist: false });

initializeLaserShotPool();
initializeDashPool();
initializeAmmoPickupPool();
initializeHealPickupPool();
initializeInstakillPickupPool();
initializeUiClickPool();
initializeExpOrbPool();
playRandomMusicTrack();

for (let i = 1; i <= WAVES_PER_LEVEL; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = i === 1 ? '1 wave' : `${i} waves`;
    devTestWaveSelect.appendChild(option);
}

devTestWaveSelect.value = String(devTestWaveLimit);

devTestWaveSelect.addEventListener('change', () => {
    const parsed = parseInt(devTestWaveSelect.value, 10);
    if (Number.isNaN(parsed)) return;
    devTestWaveLimit = Math.max(1, Math.min(WAVES_PER_LEVEL, parsed));
});

requestAnimationFrame(gameLoop);