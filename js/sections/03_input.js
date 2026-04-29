// all the key/mouse/touch event listeners and their input handling


// step thru the weapons in a direction (+1 or -1) and return the next one thats unlocked
// gives up after looping all the way around so it doesnt freeze
function findNextUnlockedWeaponIndex(startIndex, step) {
    if (!Array.isArray(WEAPON_LOADOUTS) || WEAPON_LOADOUTS.length === 0) return 0;
    const count = WEAPON_LOADOUTS.length;
    let index = typeof startIndex === 'number' ? startIndex : 0;
    for (let attempts = 0; attempts < count; attempts++) {
        index = (index + step + count) % count;
        if (typeof isWeaponUnlocked !== 'function' || isWeaponUnlocked(index)) {
            return index;
        }
    }
    return startIndex;
}




// big keyboard handler. checks game state and routes the key to whatever needs it
window.addEventListener('keydown', e => {
    unlockAudioIfNeeded();

    // if user is typing in the cloud auth box dont steal their key presses
    if (typeof isCloudAuthInputFocused === 'function' && isCloudAuthInputFocused()) {
        return;
    }

    // any key on splash kicks off the transition into the menu
    if (gameState === 'splash') {
        startSplashTransition();
        return;
    }

    if (gameState === 'splashTransition') {
        return;
    }

    // remember whats held down so movement can read it every frame
    keys[e.key.toLowerCase()] = true;

    // escape on any sub menu page just bounces back to the main menu page
    if (e.key === 'Escape' && gameState === 'menu' && (menuPage === 'cursors' || menuPage === 'characters' || menuPage === 'encyclopedia' || menuPage === 'mapConfig' || menuPage === 'audioConfig' || menuPage === 'devTestConfig')) {
        menuPage = 'main';
        playUiClick();
    }

    if (e.key === 'Escape' && gameState === 'weaponSelect') {
        gameState = 'menu';
        menuPage  = 'main';
        playUiClick();
        return;
    }

    // weapon select screen keys: A/D or arrows to move, space/enter to confirm
    if (gameState === 'weaponSelect') {
        if (e.key === 'ArrowLeft'  || e.key.toLowerCase() === 'a') {
            selectedWeaponIndex = findNextUnlockedWeaponIndex(selectedWeaponIndex, -1);
            playUiClick();
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            selectedWeaponIndex = findNextUnlockedWeaponIndex(selectedWeaponIndex, 1);
            playUiClick();
        } else if (e.key === ' ' || e.key === 'Enter') {
            if (typeof isWeaponUnlocked === 'function' && !isWeaponUnlocked(selectedWeaponIndex)) {
                playUiClick();
                return;
            }
            playUiClick();
            confirmWeaponAndStart();
        }
        return;
    }

    // escape while playing toggles pause, but if cheat menu is open it closes that first
    if (e.key === 'Escape' && gameState === 'playing') {
        if (showCheatMenu) {
            showCheatMenu = false;
            playUiClick();
            return;
        }
        gamePaused = !gamePaused;
        playUiClick();
    }

    if (e.key === 'Escape' && gameState === 'win') {
        playUiClick();
        gameState = 'menu';
        menuPage = 'main';
        return;
    }

    // space/enter does different things depending on current screen, also dash while playing
    if (e.key === ' ' || e.key === 'Enter') {
        if      (gameState === 'menu'    && menuPage === 'main') { playUiClick(); startGame(); }
        else if (gameState === 'gameOver') { playUiClick(); gameState = 'menu'; menuPage = 'main'; }
        else if (gameState === 'win')      { playUiClick(); startEndlessFromWin(); }
        else if (gameState === 'levelUp')  { playUiClick(); currentLevelUpChoices = []; gameState = 'playing'; }
        else if (gameState === 'playing')  playerDash();
    }

    // Q = railgun ult
    if (gameState === 'playing' && !gamePaused && e.key.toLowerCase() === 'q') {
        activateRailgunUlt();
    }

    // E = use the void totem if youre on top of one
    if (gameState === 'playing' && !gamePaused && e.key.toLowerCase() === 'e') {
        tryActivateVoidTotem();
    }

    // K toggles the dev cheat menu when its enabled
    if (gameState === 'playing' && devCheatMenuEnabled) {
        const lower = e.key.toLowerCase();
        if (lower === 'k') {
            showCheatMenu = !showCheatMenu;
            if (showCheatMenu) devCheatMenuTab = 'items';
            playUiClick();
            return;
        }
    }

    // 1/2/3 picks an upgrade card on the level up screen. delay stops accidental clicks
    if (gameState === 'levelUp' && levelUpInputDelay <= 0) {
        if (e.key === '1') { playUiClick(); applyUpgradeChoice(0); }
        if (e.key === '2') { playUiClick(); applyUpgradeChoice(1); }
        if (e.key === '3') { playUiClick(); applyUpgradeChoice(2); }
    }
});

// when a key is released mark it as not held
window.addEventListener('keyup',     e  => { keys[e.key.toLowerCase()] = false; });
// track the cursor and let any sliders being dragged update their values
window.addEventListener('mousemove', e  => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateMapConfigSliders();
    updateAudioConfigSliders();
    updatePauseMenuSliders();
});
window.addEventListener('mouseup',   () => { mouseDown = false; });
// scrolling the encyclopedia list. wheelStep handles different deltaMode values from browsers
window.addEventListener('wheel', e => {
    if (gameState !== 'menu' || menuPage !== 'encyclopedia') return;

    const entries = filterEncyclopediaEntries(getEncyclopediaEntriesForTab());
    const metrics = getEncyclopediaScrollMetrics(entries);
    if (metrics.maxScroll <= 0) return;

    const wheelStep = e.deltaMode === 1 ? 28 : e.deltaMode === 2 ? metrics.listH : 1;
    encyclopediaScroll = Math.min(metrics.maxScroll, Math.max(0, encyclopediaScroll + e.deltaY * wheelStep));
    e.preventDefault();
}, { passive: false });

// big mouse click handler. checks the cursor against every UI button thats currently visible
window.addEventListener('mousedown', e => {
    // ignore clicks inside the cloud auth/dev/audio panels, those have their own DOM handlers
    if (cloudAuthPanel.contains(e.target)) return;
    if (typeof cloudAuthToggleButton !== 'undefined' && cloudAuthToggleButton.contains(e.target)) return;
    if (devTestWaveControl.contains(e.target)) return;
    if (audioControlPanel.contains(e.target)) {
        unlockAudioIfNeeded();
        return;
    }

    mouseDown = true;

    unlockAudioIfNeeded();

    if (gameState === 'splash') {
        startSplashTransition();
        return;
    }

    if (gameState === 'splashTransition') {
        return;
    }

    // cheat menu click handling, close button, tabs, then the entries grid
    if (gameState === 'playing' && showCheatMenu) {
        const zones = getCheatMenuZones();
        const inPanel = mouseX >= zones.panel.x && mouseX <= zones.panel.x + zones.panel.w && mouseY >= zones.panel.y && mouseY <= zones.panel.y + zones.panel.h;

        if (mouseX >= zones.close.x && mouseX <= zones.close.x + zones.close.w && mouseY >= zones.close.y && mouseY <= zones.close.y + zones.close.h) {
            playUiClick();
            showCheatMenu = false;
            return;
        }

        for (const tabName of ['items', 'upgrades']) {
            const tab = zones.tabs[tabName];
            if (mouseX >= tab.x && mouseX <= tab.x + tab.w && mouseY >= tab.y && mouseY <= tab.y + tab.h) {
                devCheatMenuTab = tabName;
                playUiClick();
                return;
            }
        }

        for (const cell of zones.entries) {
            if (mouseX >= cell.x && mouseX <= cell.x + cell.w && mouseY >= cell.y && mouseY <= cell.y + cell.h) {
                if (cell.entry.apply()) playUiClick();
                return;
            }
        }


        if (inPanel) return;
    }

    // weapon select screen, click a card to pick it, click again to confirm
    if (gameState === 'weaponSelect') {
        const cards = getWeaponSelectCards();
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            if (mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h) {
                if (typeof isWeaponUnlocked === 'function' && !isWeaponUnlocked(i)) {
                    playUiClick();
                    return;
                }
                if (selectedWeaponIndex === i) {
                    // already selected so a second click confirms
                    playUiClick();
                    confirmWeaponAndStart();
                } else {
                    selectedWeaponIndex = i;
                    playUiClick();
                }
                return;
            }
        }
        const btn = getWeaponSelectConfirmButton();
        if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
            if (typeof isWeaponUnlocked === 'function' && !isWeaponUnlocked(selectedWeaponIndex)) {
                playUiClick();
                return;
            }
            playUiClick();
            confirmWeaponAndStart();
            return;
        }
        return;
    }

    // pause menu, resume button, main menu button, sliders are dragged separately
    if (gamePaused && gameState === 'playing') {
        const lay = getPauseMenuLayout();
        const rb  = lay.resumeBtn;
        const mb  = lay.menuBtn;

        if (mouseX >= rb.x && mouseX <= rb.x + rb.w && mouseY >= rb.y && mouseY <= rb.y + rb.h) {
            gamePaused = false;
            playUiClick();
            return;
        }
        if (mouseX >= mb.x && mouseX <= mb.x + mb.w && mouseY >= mb.y && mouseY <= mb.y + mb.h) {
            gamePaused = false;
            gameState  = 'menu';
            menuPage   = 'main';
            playUiClick();
            return;
        }
        // still let sliders work, the mousemove handler reads mouseDown
        return;
    }

    // huge block for menu clicks. each menu page has its own set of buttons to hit-test
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
                if (!devCheatMenuEnabled) {
                    showCheatMenu = false;
                } else {
                    showCheatMenu = true;
                    devCheatMenuTab = 'items';
                }
            } else if (mouseX >= ftb.x && mouseX <= ftb.x + ftb.w && mouseY >= ftb.y && mouseY <= ftb.y + ftb.h) {
                playUiClick();
                fogEnabled = !fogEnabled;
            } else if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                playUiClick();
                menuPage = 'cursors';
            } else {
                // clicked anywhere else on main menu means start the game
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
                        if (typeof isCharacterUnlocked === 'function' && !isCharacterUnlocked(i)) {
                            playUiClick();
                            break;
                        }
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
            const filterButton = encyclopediaTab === 'achievements' ? null : getEncyclopediaFilterButtonAt(mouseX, mouseY);
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
            } else if (mouseX >= tabs.achievements.x && mouseX <= tabs.achievements.x + tabs.achievements.w && mouseY >= tabs.achievements.y && mouseY <= tabs.achievements.y + tabs.achievements.h) {
                playUiClick();
                encyclopediaTab = 'achievements';
                encyclopediaScroll = 0;
            }
        }
    } else if (gameState === 'gameOver') {
        playUiClick();
        gameState = 'menu';
        menuPage  = 'main';
    } else if (gameState === 'win') {
        const buttons = getWinScreenButtons();
        const clickedEndless = mouseX >= buttons.endless.x && mouseX <= buttons.endless.x + buttons.endless.w && mouseY >= buttons.endless.y && mouseY <= buttons.endless.y + buttons.endless.h;
        const clickedMenu = mouseX >= buttons.menu.x && mouseX <= buttons.menu.x + buttons.menu.w && mouseY >= buttons.menu.y && mouseY <= buttons.menu.y + buttons.menu.h;
        if (clickedEndless) {
            playUiClick();
            startEndlessFromWin();
        } else if (clickedMenu) {
            playUiClick();
            gameState = 'menu';
            menuPage  = 'main';
        }
    } else if (gameState === 'levelUp' && levelUpInputDelay <= 0) {
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

// touch on splash also kicks off the splash transition (mobile support)
window.addEventListener('touchstart', () => {
    unlockAudioIfNeeded();
    if (gameState === 'splash') startSplashTransition();
}, { passive: true });

// drags the map size + opacity sliders on the map config menu while mouse is held
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

// same idea but for the music + sfx sliders on the audio config menu
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

// drags the music + sfx sliders that show up in the pause menu
function updatePauseMenuSliders() {
    if (!gamePaused || gameState !== 'playing' || !mouseDown) return;

    const lay = getPauseMenuLayout();
    const hr  = 7;
    const ms  = lay.musicSlider;
    const ss  = lay.sfxSlider;

    if (mouseY >= ms.y - hr && mouseY <= ms.y + hr &&
        mouseX >= ms.x - hr && mouseX <= ms.x + ms.w + hr) {
        setMusicVolume(Math.max(0, Math.min(1, (mouseX - ms.x) / ms.w)));
    } else if (mouseY >= ss.y - hr && mouseY <= ss.y + hr &&
               mouseX >= ss.x - hr && mouseX <= ss.x + ss.w + hr) {
        setSfxVolume(Math.max(0, Math.min(1, (mouseX - ss.x) / ss.w)));
    }
}
