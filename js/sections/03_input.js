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

    if (e.key === 'Escape' && gameState === 'menu' && (menuPage === 'cursors' || menuPage === 'characters' || menuPage === 'encyclopedia')) {
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
window.addEventListener('mousemove', e  => { mouseX = e.clientX; mouseY = e.clientY; });
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
            } else if (mouseX >= pb.x && mouseX <= pb.x + pb.w && mouseY >= pb.y && mouseY <= pb.y + pb.h) {
                playUiClick();
                showPerfGuide = !showPerfGuide;
            } else if (mouseX >= fpb.x && mouseX <= fpb.x + fpb.w && mouseY >= fpb.y && mouseY <= fpb.y + fpb.h) {
                playUiClick();
                showFpsCounter = !showFpsCounter;
            } else if (mouseX >= dtb.x && mouseX <= dtb.x + dtb.w && mouseY >= dtb.y && mouseY <= dtb.y + dtb.h) {
                playUiClick();
                devTestMode = !devTestMode;
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

