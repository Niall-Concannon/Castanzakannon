// the main game loop, runs every frame. logic is on a fixed step, drawing is interpolated




// runs once per frame. timestamp is what requestAnimationFrame gives us
function gameLoop(timestamp) {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    // dt = how many ms passed since last frame, capped so a long pause doesnt break things
    const dt = Math.min(timestamp - lastTimestamp, 100);
    lastTimestamp = timestamp;

    // keep the dev panels and cloud save stuff up to date every frame
    syncDevTestWaveControl();
    syncAudioControlPanel();
    if (typeof syncAuthPanel === 'function') {
        syncAuthPanel();
    }
    if (typeof updateCloudProgressMilestones === 'function') {
        updateCloudProgressMilestones();
    }
    if (typeof tickCloudAutosave === 'function') {
        tickCloudAutosave();
    }

    fps = dt > 0 ? Math.round(1000 / dt) : fps;

    // wipe the canvas to black before drawing the new frame
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // each game state just draws its own screen and bails out
    if (gameState === 'splash')   { cloudAuthToggleButton.style.display = 'none'; drawSplash();   requestAnimationFrame(gameLoop); return; }
    // splash fades into the menu in two halves, first fade out splash then fade in menu
    if (gameState === 'splashTransition') {
        cloudAuthToggleButton.style.display = 'none';
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
    if (gameState === 'menu')         { cloudAuthToggleButton.style.display = menuPage === 'main' ? 'flex' : 'none'; drawMenu();               requestAnimationFrame(gameLoop); return; }
    if (gameState === 'weaponSelect') { cloudAuthToggleButton.style.display = 'none'; drawWeaponSelectScreen(); requestAnimationFrame(gameLoop); return; }
    if (gameState === 'gameOver')     { cloudAuthToggleButton.style.display = 'none'; drawGameOver(); drawCursor(); requestAnimationFrame(gameLoop); return; }
    if (gameState === 'win')          { cloudAuthToggleButton.style.display = 'none'; drawWinScreen(); drawCursor(); requestAnimationFrame(gameLoop); return; }

    // if were actually playing run all the simulation logic
    if (gameState === 'playing' && !gamePaused) {
        elapsedGameMs += dt;
        accumulator += dt;

        // fixed step loop. keep stepping the sim FIXED_STEP ms at a time until we catch up
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
            updateChestPickupEffects();
            updateDamageNumbers();
            frameCount++;
            accumulator -= FIXED_STEP;
        }
        // leftover time becomes alpha for smooth interpolation between sim steps
        renderAlpha = accumulator / FIXED_STEP;
    } else {
        if (levelUpInputDelay > 0) levelUpInputDelay--;
        frameCount++;
        renderAlpha = 1;
    }

    // now actually draw everything in the right order, back to front
    updateCamera(renderAlpha);
    drawMap();
    if (fogEnabled) drawVisibilityMask();
    drawPlayer();
    drawEnemies();
    drawTumorTurrets();
    drawProjectiles();
    drawEnemyProjectiles();
    drawChests();
    drawChestPickupEffects();
    drawVoidTotemObjective();
    drawNecromancerTotemObjective();
    drawPickups();
    drawDamageNumbers();
    drawLowHealthMarker();
    drawMinimap();
    drawUI();
    if (gamePaused) drawPauseOverlay();
    if (gameState === 'levelUp') drawLevelUpMenu();
    if (typeof drawAchievementPopup === 'function') drawAchievementPopup();

    // settings button only shows on the main menu page
    cloudAuthToggleButton.style.display = (gameState === 'menu' && menuPage === 'main') ? 'flex' : 'none';
    drawCursor();

    requestAnimationFrame(gameLoop);
}

// startup stuff that runs once when the script loads
generateMap();
styleAudioControls();

// pull saved volumes out of localStorage if there are any
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

// pre-load audio pools so the first time you shoot/dash etc theres no hitch
initializeLaserShotPool();
initializeShotgunShotPool();
initializeSmgShotPool();
initializeSniperShotPool();
initializeSniperPingAudio();
initializeDashPool();
initializeAmmoPickupPool();
initializeHealPickupPool();
initializeInstakillPickupPool();
initializeUiClickPool();
initializeExpOrbPool();
initializeNecroShotPool();
initializeVoidSwordPool();
playRandomMusicTrack();

// fill the dev test wave dropdown with options 1..WAVES_PER_LEVEL
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

// kick off the game loop, this is what actually starts everything running
requestAnimationFrame(gameLoop);