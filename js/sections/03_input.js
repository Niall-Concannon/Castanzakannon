// Keyboard mouse and touch input are wired up here.




window.addEventListener('keydown', e => {
    unlockAudioIfNeeded();

    if (gameState === 'splash') {
        startSplashTransition();
        return;
    }

    if (gameState === 'splashTransition') {
        return;
    }

    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Escape' && gameState === 'menu' && (menuPage === 'cursors' || menuPage === 'characters' || menuPage === 'encyclopedia' || menuPage === 'mapConfig' || menuPage === 'audioConfig' || menuPage === 'devTestConfig')) {
        menuPage = 'main';
        playUiClick();
    }

    if (e.key === 'Escape' && gameState === 'playing') {
        if (showCheatMenu) {
            showCheatMenu = false;
            playUiClick();
            return;
        }
        gamePaused = !gamePaused;
        playUiClick();
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if      (gameState === 'menu'    && menuPage === 'main') { playUiClick(); startGame(); }
        else if (gameState === 'gameOver') { playUiClick(); gameState = 'menu'; menuPage = 'main'; }
        else if (gameState === 'win')      { playUiClick(); gameState = 'menu'; menuPage = 'main'; }
        else if (gameState === 'levelUp')  { playUiClick(); currentLevelUpChoices = []; gameState = 'playing'; }
        else if (gameState === 'playing')  playerDash();
    }

    if (gameState === 'playing' && !gamePaused && e.key.toLowerCase() === 'q') {
        activateRailgunUlt();
    }

    if (gameState === 'playing' && devCheatMenuEnabled) {
        const lower = e.key.toLowerCase();
        if (lower === 'k' || e.key === 'F2') {
            showCheatMenu = !showCheatMenu;
            playUiClick();
        }
    }

    if (gameState === 'levelUp') {
        if (e.key === '1') { playUiClick(); applyUpgradeChoice(0); }
        if (e.key === '2') { playUiClick(); applyUpgradeChoice(1); }
        if (e.key === '3') { playUiClick(); applyUpgradeChoice(2); }
    }
});

window.addEventListener('keyup',     e  => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e  => { 
    mouseX = e.clientX; 
    mouseY = e.clientY;
    updateMapConfigSliders();
    updateAudioConfigSliders();
});
window.addEventListener('mouseup',   () => { mouseDown = false; });
window.addEventListener('wheel', e => {
    if (gameState !== 'menu' || menuPage !== 'encyclopedia') return;

    const entries = filterEncyclopediaEntries(getEncyclopediaEntriesForTab());
    const metrics = getEncyclopediaScrollMetrics(entries);
    if (metrics.maxScroll <= 0) return;

    const wheelStep = e.deltaMode === 1 ? 28 : e.deltaMode === 2 ? metrics.listH : 1;
    encyclopediaScroll = Math.min(metrics.maxScroll, Math.max(0, encyclopediaScroll + e.deltaY * wheelStep));
    e.preventDefault();
}, { passive: false });

window.addEventListener('mousedown', e => {
    if (devTestWaveControl.contains(e.target)) return;
    if (audioControlPanel.contains(e.target)) {
        unlockAudioIfNeeded();
        return;
    }

    unlockAudioIfNeeded();

    if (gameState === 'splash') {
        startSplashTransition();
        return;
    }

    if (gameState === 'splashTransition') {
        return;
    }

    if (gameState === 'playing' && showCheatMenu) {
        const zones = getCheatMenuZones();
        const inPanel = mouseX >= zones.panel.x && mouseX <= zones.panel.x + zones.panel.w && mouseY >= zones.panel.y && mouseY <= zones.panel.y + zones.panel.h;

        if (mouseX >= zones.close.x && mouseX <= zones.close.x + zones.close.w && mouseY >= zones.close.y && mouseY <= zones.close.y + zones.close.h) {
            playUiClick();
            showCheatMenu = false;
            return;
        }

        for (const row of zones.rows) {
            if (mouseX >= row.x && mouseX <= row.x + row.w && mouseY >= row.y && mouseY <= row.y + row.h) {
                if (applyUpgradeById(row.upgrade.id)) playUiClick();
                return;
            }
        }


        if (inPanel) return;
    }

    mouseDown = true;

    if (gameState === 'menu') {
        if (menuPage === 'main') {
            const charBtn = getSelectCharacterButton();
            const btn = getSelectCursorButton();
            const ecb = getEncyclopediaButton();
            const mcb = getMapConfigButton();
            const acb = getAudioConfigButton();
            const ftb = getFogToggleButton();
            const pb  = getPerfButton();
            const fpb = getFpsToggleButton();
            const dtb = getDevTestButton();
            const dcb = getDevCheatButton();
            if (mouseX >= charBtn.x && mouseX <= charBtn.x + charBtn.w && mouseY >= charBtn.y && mouseY <= charBtn.y + charBtn.h) {
                playUiClick();
                menuPage = 'characters';
            } else if (mouseX >= ecb.x && mouseX <= ecb.x + ecb.w && mouseY >= ecb.y && mouseY <= ecb.y + ecb.h) {
                playUiClick();
                menuPage = 'encyclopedia';
                encyclopediaTab = 'enemies';
                encyclopediaScroll = 0;
            } else if (mouseX >= mcb.x && mouseX <= mcb.x + mcb.w && mouseY >= mcb.y && mouseY <= mcb.y + mcb.h) {
                playUiClick();
                menuPage = 'mapConfig';
            } else if (mouseX >= acb.x && mouseX <= acb.x + acb.w && mouseY >= acb.y && mouseY <= acb.y + acb.h) {
                playUiClick();
                menuPage = 'audioConfig';
            } else if (mouseX >= pb.x && mouseX <= pb.x + pb.w && mouseY >= pb.y && mouseY <= pb.y + pb.h) {
                playUiClick();
                showPerfGuide = !showPerfGuide;
            } else if (mouseX >= fpb.x && mouseX <= fpb.x + fpb.w && mouseY >= fpb.y && mouseY <= fpb.y + fpb.h) {
                playUiClick();
                showFpsCounter = !showFpsCounter;
            } else if (mouseX >= dtb.x && mouseX <= dtb.x + dtb.w && mouseY >= dtb.y && mouseY <= dtb.y + dtb.h) {
                playUiClick();
                menuPage = 'devTestConfig';
            } else if (mouseX >= dcb.x && mouseX <= dcb.x + dcb.w && mouseY >= dcb.y && mouseY <= dcb.y + dcb.h) {
                playUiClick();
                devCheatMenuEnabled = !devCheatMenuEnabled;
                if (!devCheatMenuEnabled) showCheatMenu = false;
            } else if (mouseX >= ftb.x && mouseX <= ftb.x + ftb.w && mouseY >= ftb.y && mouseY <= ftb.y + ftb.h) {
                playUiClick();
                fogEnabled = !fogEnabled;
            } else if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                playUiClick();
                menuPage = 'cursors';
            } else {
                playUiClick();
                startGame();
            }
        } else if (menuPage === 'characters') {
            const back = getCharacterBackButton();
            if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                playUiClick();
                menuPage = 'main';
            } else {
                const cards = getCharacterCards();
                for (let i = 0; i < cards.length; i++) {
                    const c = cards[i];
                    if (mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h) {
                        playUiClick();
                        selectedCharacter = i;
                        break;
                    }
                }
            }
        } else if (menuPage === 'cursors') {
            const back = getBackButton();
            if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                playUiClick();
                menuPage = 'main';
            } else {
                const boxes = getCursorBoxes();
                for (let i = 0; i < boxes.length; i++) {
                    const b = boxes[i];
                    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
                        playUiClick();
                        selectedCursor = i;
                        break;
                    }
                }
            }
        } else if (menuPage === 'mapConfig') {
            const shapeButtons = getMapShapeButtons();
            const shapes = ['circle', 'rectangle', 'hexagon'];
            for (let i = 0; i < shapeButtons.length; i++) {
                const b = shapeButtons[i];
                if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
                    playUiClick();
                    mapShape = shapes[i];
                    return;
                }
            }
            const panel = getCharacterPanel();
            const contentY = panel.y + 110;
            const lineHeight = 70;
            const previewH = 190;
            const previewY = contentY + lineHeight * 2 + 64;
            const back = getMapConfigBackButton(previewY + previewH);
            if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                playUiClick();
                menuPage = 'main';
            }
        } else if (menuPage === 'audioConfig') {
            const back = getAudioConfigBackButton();
            if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                playUiClick();
                menuPage = 'main';
            }
        } else if (menuPage === 'devTestConfig') {
            const controls = getDevTestConfigControls();

            if (mouseX >= controls.toggle.x && mouseX <= controls.toggle.x + controls.toggle.w && mouseY >= controls.toggle.y && mouseY <= controls.toggle.y + controls.toggle.h) {
                playUiClick();
                devTestMode = !devTestMode;
                return;
            }

            if (mouseX >= controls.minus.x && mouseX <= controls.minus.x + controls.minus.w && mouseY >= controls.minus.y && mouseY <= controls.minus.y + controls.minus.h) {
                playUiClick();
                devTestWaveLimit = Math.max(1, devTestWaveLimit - 1);
                devTestWaveSelect.value = String(devTestWaveLimit);
                return;
            }

            if (mouseX >= controls.plus.x && mouseX <= controls.plus.x + controls.plus.w && mouseY >= controls.plus.y && mouseY <= controls.plus.y + controls.plus.h) {
                playUiClick();
                devTestWaveLimit = Math.min(WAVES_PER_LEVEL, devTestWaveLimit + 1);
                devTestWaveSelect.value = String(devTestWaveLimit);
                return;
            }

            for (const chip of controls.chips) {
                if (mouseX >= chip.x && mouseX <= chip.x + chip.w && mouseY >= chip.y && mouseY <= chip.y + chip.h) {
                    playUiClick();
                    devTestWaveLimit = chip.wave;
                    devTestWaveSelect.value = String(devTestWaveLimit);
                    return;
                }
            }

            if (mouseX >= controls.back.x && mouseX <= controls.back.x + controls.back.w && mouseY >= controls.back.y && mouseY <= controls.back.y + controls.back.h) {
                playUiClick();
                menuPage = 'main';
            }
        } else if (menuPage === 'encyclopedia') {
            const back = getEncyclopediaBackButton();
            const tabs = getEncyclopediaTabButtons();
            const filterButton = getEncyclopediaFilterButtonAt(mouseX, mouseY);
            if (filterButton) {
                playUiClick();
                encyclopediaRarityFilter = filterButton.rarity;
                encyclopediaScroll = 0;
            } else if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                playUiClick();
                menuPage = 'main';
            } else if (mouseX >= tabs.enemies.x && mouseX <= tabs.enemies.x + tabs.enemies.w && mouseY >= tabs.enemies.y && mouseY <= tabs.enemies.y + tabs.enemies.h) {
                playUiClick();
                encyclopediaTab = 'enemies';
                encyclopediaScroll = 0;
            } else if (mouseX >= tabs.items.x && mouseX <= tabs.items.x + tabs.items.w && mouseY >= tabs.items.y && mouseY <= tabs.items.y + tabs.items.h) {
                playUiClick();
                encyclopediaTab = 'items';
                encyclopediaScroll = 0;
            }
        }
    } else if (gameState === 'gameOver') {
        playUiClick();
        gameState = 'menu';
        menuPage  = 'main';
    } else if (gameState === 'win') {
        playUiClick();
        gameState = 'menu';
        menuPage  = 'main';
    } else if (gameState === 'levelUp') {
        const zones = getLevelUpZones();
        for (let i = 0; i < 3; i++) {
            const z = zones.cards[i];
            if (mouseX >= z.x && mouseX <= z.x + z.w && mouseY >= z.y && mouseY <= z.y + z.h) {
                playUiClick();
                applyUpgradeChoice(i);
                return;
            }
        }
        const s = zones.skip;
        if (mouseX >= s.x && mouseX <= s.x + s.w && mouseY >= s.y && mouseY <= s.y + s.h) {
            playUiClick();
            gameState = 'playing';
        }
    }
});

window.addEventListener('touchstart', () => {
    unlockAudioIfNeeded();
    if (gameState === 'splash') startSplashTransition();
}, { passive: true });

// Update Map Config Sliders keeps the game logic moving.
function updateMapConfigSliders() {
    if (gameState !== 'menu' || menuPage !== 'mapConfig' || !mouseDown) return;

    const sizeSlider = getMapSizeSlider();
    const opacitySlider = getMapOpacitySlider();
    const sliderHandleRadius = 6;

    if (mouseY >= sizeSlider.y - sliderHandleRadius && mouseY <= sizeSlider.y + sliderHandleRadius &&
        mouseX >= sizeSlider.x - sliderHandleRadius && mouseX <= sizeSlider.x + sizeSlider.w + sliderHandleRadius) {
        const handleX = (mouseX - sizeSlider.x) / sizeSlider.w;
        mapSize = Math.max(0.5, Math.min(2.0, 0.5 + handleX * 1.5));
    } else if (mouseY >= opacitySlider.y - sliderHandleRadius && mouseY <= opacitySlider.y + sliderHandleRadius &&
        mouseX >= opacitySlider.x - sliderHandleRadius && mouseX <= opacitySlider.x + opacitySlider.w + sliderHandleRadius) {
        const handleX = (mouseX - opacitySlider.x) / opacitySlider.w;
        mapOpacity = Math.max(0.1, Math.min(1.0, 0.1 + handleX * 0.9));
    }
}

function updateAudioConfigSliders() {
    if (gameState !== 'menu' || menuPage !== 'audioConfig' || !mouseDown) return;

    const musicSlider = getAudioMusicSlider();
    const sfxSlider = getAudioSfxSlider();
    const sliderHandleRadius = 6;

    if (mouseY >= musicSlider.y - sliderHandleRadius && mouseY <= musicSlider.y + sliderHandleRadius &&
        mouseX >= musicSlider.x - sliderHandleRadius && mouseX <= musicSlider.x + musicSlider.w + sliderHandleRadius) {
        const handleX = (mouseX - musicSlider.x) / musicSlider.w;
        setMusicVolume(Math.max(0.0, Math.min(1.0, handleX)));
    } else if (mouseY >= sfxSlider.y - sliderHandleRadius && mouseY <= sfxSlider.y + sliderHandleRadius &&
        mouseX >= sfxSlider.x - sliderHandleRadius && mouseX <= sfxSlider.x + sfxSlider.w + sliderHandleRadius) {
        const handleX = (mouseX - sfxSlider.x) / sfxSlider.w;
        setSfxVolume(Math.max(0.0, Math.min(1.0, handleX)));
    }
}

