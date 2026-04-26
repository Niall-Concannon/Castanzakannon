// Menu screens selection panels and encyclopedia views live here.




// Get Main Menu Layout keeps the game logic moving.
function getMainMenuLayout() {
    const buttonW = Math.min(380, Math.max(280, Math.floor(canvas.width * 0.27)));
    const buttonH = Math.min(68, Math.max(52, Math.floor(canvas.height * 0.08)));
    const rowGap = Math.max(10, Math.floor(buttonH * 0.22));
    const colGap = Math.max(44, Math.floor(buttonW * 0.18));
    const leftX = Math.floor(canvas.width / 2 - buttonW - colGap / 2);
    const rightX = Math.floor(canvas.width / 2 + colGap / 2);
    const topY = Math.floor(canvas.height / 2 + 12);
    const rightTopY = topY;
    const headerY = topY - 16;
    const mk = (x, y) => ({ x, y, w: buttonW, h: buttonH });

    return {
        leftHeader: { x: leftX + buttonW / 2, y: headerY, text: 'Loadout' },
        rightHeader: { x: rightX + buttonW / 2, y: headerY, text: 'System & Dev' },
        buttons: {
            selectCharacter: mk(leftX, topY),
            selectCursor: mk(leftX, topY + (buttonH + rowGap)),
            encyclopedia: mk(leftX, topY + (buttonH + rowGap) * 2),
            mapConfig: mk(leftX, topY + (buttonH + rowGap) * 3),
            audioConfig: mk(leftX, topY + (buttonH + rowGap) * 4),
            fogToggle: mk(rightX, rightTopY),
            graphicsTutorial: mk(rightX, rightTopY + (buttonH + rowGap)),
            fpsToggle: mk(rightX, rightTopY + (buttonH + rowGap) * 2),
            devTest: mk(rightX, rightTopY + (buttonH + rowGap) * 3),
            devCheat: mk(rightX, rightTopY + (buttonH + rowGap) * 4),
        },
    };
}

// Get Perf Button keeps the game logic moving.
function getPerfButton() {
    return getMainMenuLayout().buttons.graphicsTutorial;
}
// Get Fps Toggle Button keeps the game logic moving.
function getFpsToggleButton() {
    return getMainMenuLayout().buttons.fpsToggle;
}
// Get Dev Test Button keeps the game logic moving.
function getDevTestButton() {
    return getMainMenuLayout().buttons.devTest;
}
// Get Dev Cheat Button keeps the game logic moving.
function getDevCheatButton() {
    return getMainMenuLayout().buttons.devCheat;
}
// Get Map Config Button keeps the game logic moving.
function getMapConfigButton() {
    return getMainMenuLayout().buttons.mapConfig;
}
// Get Audio Config Button keeps the game logic moving.
function getAudioConfigButton() {
    return getMainMenuLayout().buttons.audioConfig;
}
// Get Dev Test Wave Control Rect keeps the game logic moving.
function getDevTestWaveControlRect() {
    const anchor = getDevCheatButton();
    return { x: anchor.x, y: anchor.y + anchor.h + 8, w: anchor.w, h: 28 };
}
// Get Fog Toggle Button keeps the game logic moving.
function getFogToggleButton() {
    return getMainMenuLayout().buttons.fogToggle;
}
// Get Select Cursor Button keeps the game logic moving.
function getSelectCursorButton() {
    return getMainMenuLayout().buttons.selectCursor;
}
// Get Select Character Button keeps the game logic moving.
function getSelectCharacterButton() {
    return getMainMenuLayout().buttons.selectCharacter;
}
// Get Encyclopedia Button keeps the game logic moving.
function getEncyclopediaButton() {
    return getMainMenuLayout().buttons.encyclopedia;
}
// Get Back Button keeps the game logic moving.
function getBackButton() {
    return { x: canvas.width / 2 - 60, y: canvas.height / 2 + 150, w: 120, h: 36 };
}
// Get Encyclopedia Panel keeps the game logic moving.
function getEncyclopediaPanel() {
    const w = Math.min(1140, canvas.width - 70);
    const h = Math.min(620, canvas.height - 84);
    return {
        x: canvas.width / 2 - w / 2,
        y: canvas.height / 2 - h / 2,
        w,
        h,
    };
}

// Get Encyclopedia Tab Buttons keeps the game logic moving.
function getEncyclopediaTabButtons() {
    const panel = getEncyclopediaPanel();
    const tabY = panel.y + 72;
    return {
        enemies: { x: panel.x + 26, y: tabY, w: 150, h: 34 },
        items: { x: panel.x + 190, y: tabY, w: 150, h: 34 },
    };
}

// Get Encyclopedia Back Button keeps the game logic moving.
function getEncyclopediaBackButton() {
    const panel = getEncyclopediaPanel();
    return { x: panel.x + panel.w / 2 - 72, y: panel.y + panel.h - 50, w: 144, h: 34 };
}

const ENCYCLOPEDIA_RARITY_FILTERS = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];

// Get Encyclopedia Filter Buttons keeps the game logic moving.
function getEncyclopediaFilterButtons() {
    const panel = getEncyclopediaPanel();
    const listX = panel.x + 26;
    const topY = panel.y + 102;
    const gap = 8;
    const buttonW = Math.floor((panel.w - 52 - gap * (ENCYCLOPEDIA_RARITY_FILTERS.length - 1)) / ENCYCLOPEDIA_RARITY_FILTERS.length);
    return ENCYCLOPEDIA_RARITY_FILTERS.map((rarity, index) => ({
        rarity,
        x: listX + index * (buttonW + gap),
        y: topY,
        w: buttonW,
        h: 28,
    }));
}

// Get Encyclopedia Entries For Tab keeps the game logic moving.
function getEncyclopediaEntriesForTab() {
    return encyclopediaTab === 'enemies' ? getEncyclopediaEnemyEntries() : getEncyclopediaItemEntries();
}

// Get Encyclopedia Scroll Metrics keeps the game logic moving.
function getEncyclopediaScrollMetrics(entries) {
    const panel = getEncyclopediaPanel();
    const listX = panel.x + 26;
    const listY = panel.y + 144;
    const listW = panel.w - 52;
    const listH = panel.h - 220;
    const isEnemies = encyclopediaTab === 'enemies';
    const cols = isEnemies ? 1 : 2;
    const entryH = isEnemies ? 78 : 92;
    const gap = 10;
    const rows = entries.length > 0 ? Math.ceil(entries.length / cols) : 0;
    const contentH = rows > 0 ? rows * entryH + Math.max(0, rows - 1) * gap : 0;
    const maxScroll = Math.max(0, contentH - listH);

    return { panel, listX, listY, listW, listH, entryH, gap, contentH, maxScroll, cols };
}

// Filter Encyclopedia Entries keeps the game logic moving.
function filterEncyclopediaEntries(entries) {
    if (encyclopediaRarityFilter === 'all') return entries;
    return entries.filter(entry => entry.rarity === encyclopediaRarityFilter);
}

// Get Encyclopedia Enemy Entries keeps the game logic moving.
function getEncyclopediaEnemyEntries() {
    const entries = [];
    const nameMap = { basic: 'Basic', fast: 'Fast', tank: 'Tank', sniper: 'Sniper' };

    for (const [id, base] of Object.entries(ENEMY_TYPES)) {
        const lvl1 = ENEMY_VARIANT_STATS.base?.[id] ?? { hp: base.hp, speed: base.speed };
        const lvl5 = ENEMY_VARIANT_STATS.d?.[id] ?? ENEMY_VARIANT_STATS.base?.[id] ?? { hp: base.hp, speed: base.speed };
        const frames = getEnemySpriteFrames(id);
        const isSniper = id === 'sniper';
        const rarity = isSniper ? 'uncommon' : 'common';
        const extraText = isSniper
            ? `Projectile DMG ${lvl1.projectileDamage ?? SNIPER_PROJECTILE_DAMAGE} -> ${lvl5.projectileDamage ?? SNIPER_PROJECTILE_DAMAGE}  Range ${SNIPER_RANGE}`
            : `Level 5 scaling: HP ${lvl5.hp}  SPD ${lvl5.speed.toFixed(1)}`;
        entries.push({
            title: `${nameMap[id] ?? id} Enemy`,
            rarity,
            detail: `Base HP ${base.hp}  SPD ${base.speed.toFixed(1)}  Size ${base.size}`,
            extra: extraText,
            icon: frames?.[0] ?? null,
            iconFrames: frames,
            kind: 'enemy',
        });
    }

    entries.push({
        title: 'Tumor Turret',
        rarity: 'epic',
        detail: `HP ${TUMOR_HP}  Range ${TUMOR_RANGE}  Projectile DMG ${TUMOR_PROJECTILE_DAMAGE}`,
        extra: `Charge ${Math.round(TUMOR_CHARGE_FRAMES * FIXED_STEP)}ms  Cooldown ${Math.round(TUMOR_COOLDOWN_FRAMES * FIXED_STEP)}ms`,
        icon: tumorIdleSprite,
        iconFrames: [tumorIdleSprite, tumorShootSprite],
        kind: 'enemy',
    });

    const bossTank = ENEMY_VARIANT_STATS.d?.tank ?? ENEMY_TYPES.tank;
    entries.push({
        title: `Boss - ${getBossName(currentArenaLevel + currentWave)}`,
        rarity: 'legendary',
        detail: `HP x9.5 of tank variant (about ${Math.round((bossTank.hp ?? 16) * 9.5)})`,
        extra: `Names: ${BOSS_NAME_OPTIONS.join(' / ')}`,
        icon: BOSS_ENEMY_SPRITE_FRAMES[0] ?? null,
        iconFrames: BOSS_ENEMY_SPRITE_FRAMES,
        kind: 'enemy',
    });

    return entries;
}

// Get Encyclopedia Item Entries keeps the game logic moving.
function getEncyclopediaItemEntries() {
    const items = ITEM_DEFINITIONS.map(def => ({
        title: ITEM_PLACEHOLDER_NAMES[def.id] ?? def.title,
        subtitle: def.title,
        rarity: def.rarity,
        detail: def.detail,
        extra: `Item  |  Max stacks ${def.maxStacks ?? 1}`,
        icon: ITEM_PLACEHOLDER_SPRITES[def.id] ?? uniquePlaceholderSprite,
        kind: 'item',
    }));

    const uniques = UNIQUE_ITEM_DEFINITIONS.map(def => ({
        title: UNIQUE_PLACEHOLDER_NAMES[def.id] ?? def.title,
        subtitle: def.title,
        rarity: def.rarity,
        detail: def.detail,
        extra: `Unique  |  Max stacks ${def.maxStacks ?? 1}`,
        icon: UNIQUE_PLACEHOLDER_SPRITES[def.id] ?? uniquePlaceholderSprite,
        kind: 'unique',
    }));

    return [...items, ...uniques].sort((a, b) => a.title.localeCompare(b.title));
}

// Get Encyclopedia Filter Button At keeps the game logic moving.
function getEncyclopediaFilterButtonAt(x, y) {
    const buttons = getEncyclopediaFilterButtons();
    for (const button of buttons) {
        if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
            return button;
        }
    }
    return null;
}

// Draw Encyclopedia Menu keeps the game logic moving.
function drawEncyclopediaMenu() {
    const panel = getEncyclopediaPanel();
    const tabs = getEncyclopediaTabButtons();
    const back = getEncyclopediaBackButton();
    const filterButtons = getEncyclopediaFilterButtons();

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(8,8,8,0.95)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.76)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Encyclopedia', canvas.width / 2, panel.y + 46);
    ctx.font = '15px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('Enemy and item reference', canvas.width / 2, panel.y + 66);

    const isEnemies = encyclopediaTab === 'enemies';
    const enemyHover = mouseX >= tabs.enemies.x && mouseX <= tabs.enemies.x + tabs.enemies.w && mouseY >= tabs.enemies.y && mouseY <= tabs.enemies.y + tabs.enemies.h;
    const itemHover = mouseX >= tabs.items.x && mouseX <= tabs.items.x + tabs.items.w && mouseY >= tabs.items.y && mouseY <= tabs.items.y + tabs.items.h;

    const drawTab = (tab, active, hover, label) => {
        ctx.fillStyle = active ? 'rgba(255,255,255,0.22)' : hover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(tab.x, tab.y, tab.w, tab.h);
        ctx.strokeStyle = active ? '#ff0000' : 'rgba(210,220,235,0.5)';
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(tab.x, tab.y, tab.w, tab.h);
        ctx.fillStyle = active ? '#ff0000' : '#ff0000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, tab.x + tab.w / 2, tab.y + 22);
    };

    drawTab(tabs.enemies, isEnemies, enemyHover, 'Enemies');
    drawTab(tabs.items, !isEnemies, itemHover, 'Items');

    for (const button of filterButtons) {
        const active = encyclopediaRarityFilter === button.rarity;
        ctx.fillStyle = active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)';
        ctx.fillRect(button.x, button.y, button.w, button.h);
        ctx.strokeStyle = active ? '#ff0000' : 'rgba(210,220,235,0.38)';
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(button.x, button.y, button.w, button.h);
        ctx.fillStyle = active ? '#ff0000' : '#ff0000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(button.rarity === 'all' ? 'All' : button.rarity, button.x + button.w / 2, button.y + 19);
    }

    const entries = filterEncyclopediaEntries(getEncyclopediaEntriesForTab());
    const { listX, listY, listW, listH, entryH, gap, maxScroll } = getEncyclopediaScrollMetrics(entries);
    encyclopediaScroll = Math.min(maxScroll, Math.max(0, encyclopediaScroll));

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, listH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY, listW, listH);
    ctx.clip();

    const entryWidth = listW - 12;
    const iconSize = isEnemies ? 54 : 50;
    const slotPad = 10;
    const rowStep = entryH + gap;
    let hoveredEntry = null;
    const encyclopediaAnimTick = Math.floor((performance.now?.() ?? Date.now()) / 120);

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const row = Math.floor(i / (isEnemies ? 1 : 2));
        const col = isEnemies ? 0 : (i % 2);
        const cardW = isEnemies ? entryWidth : Math.floor((entryWidth - gap) / 2);
        const x = listX + 6 + col * (cardW + gap);
        const y = listY + row * rowStep - encyclopediaScroll;
        if (y + entryH < listY || y > listY + listH) continue;

        const hover = mouseX >= x && mouseX <= x + cardW && mouseY >= y && mouseY <= y + entryH;
        if (hover) hoveredEntry = { entry, x, y };

        ctx.fillStyle = hover ? 'rgba(255,255,255,0.15)' : (i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)');
        ctx.fillRect(x, y, cardW, entryH);
        ctx.strokeStyle = hover ? getRarityUiColor(entry.rarity) : 'rgba(255,255,255,0.16)';
        ctx.lineWidth = hover ? 2 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, entryH - 1);

        const iconX = x + slotPad;
        const iconY = y + (entryH - iconSize) / 2;
        const iconFrames = entry.iconFrames;
        const icon = iconFrames?.length ? iconFrames[encyclopediaAnimTick % iconFrames.length] : entry.icon;
        if (icon?.complete && icon.naturalWidth) {
            ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = entry.kind === 'enemy' ? '#ff0000' : entry.kind === 'unique' ? '#ff0000' : '#ff0000';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
        }

        ctx.fillStyle = getRarityUiColor(entry.rarity);
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(entry.title, iconX + iconSize + 14, y + 24);

        ctx.fillStyle = '#ff0000';
        ctx.font = '11px Arial';
        ctx.fillText(entry.detail, iconX + iconSize + 14, y + 44);

        ctx.fillStyle = 'rgba(210,220,235,0.86)';
        ctx.fillText(entry.extra, iconX + iconSize + 14, y + 61);
    }

    ctx.restore();

    if (maxScroll > 0) {
        const trackX = listX + listW - 10;
        const trackH = listH;
        const totalRows = entries.length > 0 ? Math.ceil(entries.length / (isEnemies ? 1 : 2)) : 0;
        const totalContentH = totalRows > 0 ? totalRows * entryH + Math.max(0, totalRows - 1) * gap : 0;
        const thumbH = Math.max(34, Math.round(trackH * (listH / Math.max(1, totalContentH))));
        const thumbY = listY + Math.round((encyclopediaScroll / maxScroll) * (trackH - thumbH));

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(trackX, listY, 4, trackH);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(trackX - 1, thumbY, 6, thumbH);
    }

    const backHover = mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h;
    ctx.fillStyle = backHover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(back.x, back.y, back.w, back.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(back.x, back.y, back.w, back.h);
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('<  Back', back.x + back.w / 2, back.y + 22);
}

// Sync Dev Test Wave Control keeps the game logic moving.
function syncDevTestWaveControl() {
    devTestWaveControl.style.display = 'none';
}

function getDevTestConfigControls() {
    const panel = getCharacterPanel();
    const toggleW = 320;
    const toggleH = 46;
    const toggle = { x: canvas.width / 2 - toggleW / 2, y: panel.y + 132, w: toggleW, h: toggleH };

    const rowY = toggle.y + 76;
    const valueW = 180;
    const stepW = 48;
    const stepH = 40;
    const value = { x: canvas.width / 2 - valueW / 2, y: rowY, w: valueW, h: stepH };
    const minus = { x: value.x - stepW - 12, y: rowY, w: stepW, h: stepH };
    const plus = { x: value.x + valueW + 12, y: rowY, w: stepW, h: stepH };

    const chipW = 56;
    const chipH = 34;
    const chipGap = 10;
    const totalW = WAVES_PER_LEVEL * chipW + Math.max(0, WAVES_PER_LEVEL - 1) * chipGap;
    const startX = canvas.width / 2 - totalW / 2;
    const chipY = rowY + 64;
    const chips = [];
    for (let i = 1; i <= WAVES_PER_LEVEL; i++) {
        chips.push({ wave: i, x: startX + (i - 1) * (chipW + chipGap), y: chipY, w: chipW, h: chipH });
    }

    const back = { x: canvas.width / 2 - 70, y: panel.y + panel.h - 54, w: 140, h: 38 };
    return { panel, toggle, minus, plus, value, chips, back };
}

function drawDevTestConfigScreen() {
    const controls = getDevTestConfigControls();
    const { panel, toggle, minus, plus, value, chips, back } = controls;

    ctx.fillStyle = 'rgba(0,0,0,0.93)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = MENU_TEXT_COLORS.title;
    ctx.fillText('Dev Test Settings', canvas.width / 2, panel.y + 46);
    ctx.font = '16px Arial';
    ctx.fillStyle = MENU_TEXT_COLORS.subtitle;
    ctx.fillText('Configure test mode without off-screen controls', canvas.width / 2, panel.y + 74);

    ctx.fillStyle = devTestMode ? '#1f5f2f' : '#5f1f1f';
    ctx.fillRect(toggle.x, toggle.y, toggle.w, toggle.h);
    ctx.strokeStyle = devTestMode ? '#3fd46c' : '#d45a5a';
    ctx.lineWidth = 2;
    ctx.strokeRect(toggle.x, toggle.y, toggle.w, toggle.h);
    ctx.fillStyle = '#e1edf8';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Dev Test: ' + (devTestMode ? 'ON' : 'OFF'), toggle.x + toggle.w / 2, toggle.y + toggle.h / 2 + 6);

    ctx.fillStyle = '#e1edf8';
    ctx.font = '17px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Wave Limit', value.x, value.y - 14);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(value.x, value.y, value.w, value.h);
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 1;
    ctx.strokeRect(value.x, value.y, value.w, value.h);
    ctx.fillStyle = '#e1edf8';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(String(devTestWaveLimit), value.x + value.w / 2, value.y + value.h / 2 + 6);

    const drawStep = (rect, label) => {
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = '#e1edf8';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 7);
    };
    drawStep(minus, '-');
    drawStep(plus, '+');

    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText('Quick Pick', canvas.width / 2, chips[0].y - 10);
    for (const chip of chips) {
        const selected = chip.wave === devTestWaveLimit;
        ctx.fillStyle = selected ? '#4a9eff' : '#202020';
        ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
        ctx.strokeStyle = selected ? '#8fc0ff' : '#606060';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(chip.x, chip.y, chip.w, chip.h);
        ctx.fillStyle = '#e1edf8';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(String(chip.wave), chip.x + chip.w / 2, chip.y + chip.h / 2 + 5);
    }

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(back.x, back.y, back.w, back.h);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.strokeRect(back.x, back.y, back.w, back.h);
    ctx.fillStyle = '#e1edf8';
    ctx.font = '16px Arial';
    ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
}

// Get Character Panel keeps the game logic moving.
function getCharacterPanel() {
    const w = Math.min(1100, canvas.width - 60);
    const h = Math.min(560, canvas.height - 90);
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2 + 14;
    return { x, y, w, h };
}

// Get Cursor Boxes keeps the game logic moving.
function getCursorBoxes() {
    const bs = 52, gap = 12;
    const tw = cursorSprites.length * (bs + gap) - gap;
    const sx = canvas.width / 2 - tw / 2;
    const sy = canvas.height / 2 + 50;
    return cursorSprites.map((_, i) => ({ x: sx + i * (bs + gap), y: sy, w: bs, h: bs }));
}

// Get Character Cards keeps the game logic moving.
function getCharacterCards() {
    const panel = getCharacterPanel();
    const gap = 14;
    const innerPad = 24;
    const usableW = panel.w - innerPad * 2;
    const cardW = Math.min(168, Math.max(120, Math.floor((usableW - gap * 4) / 5)));
    const cardH = Math.min(292, Math.max(228, Math.round(cardW * 1.7)));
    const totalW = cardW * 5 + gap * 4;
    const startX = canvas.width / 2 - totalW / 2;
    const y = panel.y + 92;
    return CHARACTER_LOADOUTS.map((_, i) => ({ x: startX + i * (cardW + gap), y, w: cardW, h: cardH }));
}

// Get Character Back Button keeps the game logic moving.
function getCharacterBackButton() {
    const cards = getCharacterCards();
    const cardBottom = cards[0].y + cards[0].h;
    const y = Math.min(canvas.height - 50, cardBottom + 18);
    return { x: canvas.width / 2 - 70, y, w: 140, h: 38 };
}

// Get Character Preview Sprite keeps the game logic moving.
function getCharacterPreviewSprite(loadout) {
    const idle = loadout.sprites.idle;
    if (idle?.complete && idle.naturalWidth) return idle;
    return fallbackPlayerSprites.idle;
}

// Get Level Up Zones keeps the game logic moving.
function getLevelUpZones() {
    const CW = 200, CH = 270, GAP = 24;
    const totalW = CW * 3 + GAP * 2;
    const startX = canvas.width / 2 - totalW / 2;
    const cardY  = canvas.height / 2 - CH / 2 - 30;
    const cards  = [0, 1, 2].map(i => ({ x: startX + i * (CW + GAP), y: cardY, w: CW, h: CH }));
    const skipW  = 200, skipH = 54;
    return { cards, skip: { x: canvas.width / 2 - skipW / 2, y: cardY + CH + 22, w: skipW, h: skipH } };
}

// Draw Perf Guide keeps the game logic moving.
function drawPerfGuide() {
    const ua = navigator.userAgent;
    let browser = 'chrome';
    if (/Edg\//.test(ua))          browser = 'edge';
    else if (/Firefox/.test(ua))    browser = 'firefox';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'safari';

    const steps = {
        chrome:  [
            '1.  Open a new tab and go to:  chrome://settings',
            '2.  Search for "graphics" in the search bar',
            '3.  Find "Use graphics acceleration when available"',
            '4.  Toggle it ON  (if already on, you are all set!)',
            '5.  Click the Relaunch button to restart Chrome',
        ],
        edge:    [
            '1.  Open a new tab and go to:  edge://settings',
            '2.  Click "System and performance" in the left sidebar',
            '3.  Find "Use graphics acceleration when available"',
            '4.  Toggle it ON  (if already on, you are all set!)',
            '5.  Click the Restart button to apply changes',
        ],
        firefox: [
            '1.  Open a new tab and go to:  about:preferences',
            '2.  Scroll down to the Performance section',
            '3.  Uncheck "Use recommended performance settings"',
            '4.  Check "Use hardware acceleration when available"',
            '5.  Restart Firefox for changes to take effect',
        ],
        safari:  [
            'Safari uses GPU acceleration automatically.',
            'For best performance keep macOS fully up to date.',
            'Quit and reopen Safari if you notice slowness.',
        ],
    };

    const browserNames = { chrome: 'Google Chrome', edge: 'Microsoft Edge', firefox: 'Mozilla Firefox', safari: 'Safari' };
    const list = steps[browser];
    const PAD = 28, LH = 28;
    const boxW = 540, boxH = 88 + list.length * LH + 36;
    const bx = canvas.width  / 2 - boxW / 2;
    const by = canvas.height / 2 - boxH / 2 - 60;

    ctx.save();
    ctx.fillStyle = 'rgba(22,22,22,0.97)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(bx, by, boxW, 3);
    ctx.textAlign  = 'center';
    ctx.font       = 'bold 15px Arial';
    ctx.fillStyle  = '#ff0000';
    ctx.shadowBlur = 0;
    ctx.fillText('GPU Acceleration  â€”  ' + browserNames[browser] + ' detected', canvas.width / 2, by + 30);
    ctx.font      = '13px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('Follow these steps for a smoother experience:', canvas.width / 2, by + 52);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(bx + PAD, by + 64);
    ctx.lineTo(bx + boxW - PAD, by + 64);
    ctx.stroke();
    ctx.textAlign  = 'left';
    ctx.font       = '13px monospace';
    ctx.fillStyle  = '#ff0000';
    list.forEach((line, i) => ctx.fillText(line, bx + PAD, by + 82 + i * LH));
    ctx.textAlign = 'center';
    ctx.font      = '11px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('Click Performance Guide again to close', canvas.width / 2, by + boxH - 12);
    ctx.restore();
}

// Draw Map Config Screen keeps the game logic moving.
function drawMapConfigScreen() {
    const panel = getCharacterPanel();
    ctx.fillStyle = 'rgba(0,0,0,0.93)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = MENU_TEXT_COLORS.title;
    ctx.fillText('Map Settings', canvas.width / 2, panel.y + 46);
    ctx.font = '16px Arial';
    ctx.fillStyle = MENU_TEXT_COLORS.subtitle;
    ctx.fillText('Customize your arena', canvas.width / 2, panel.y + 74);

    const contentY = panel.y + 110;
    const sliderWidth = 280;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const lineHeight = 70;

    // Map Size
    ctx.textAlign = 'left';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#e1edf8';
    ctx.fillText('Map Size:', sliderX, contentY);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText((mapSize * 100).toFixed(0) + '%', sliderX + sliderWidth + 12, contentY);
    drawSlider(sliderX, contentY + 12, sliderWidth, mapSize, 0.5, 2.0, getMapSizeSlider());

    // Map Opacity
    ctx.textAlign = 'left';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#e1edf8';
    ctx.fillText('Opacity:', sliderX, contentY + lineHeight);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText((mapOpacity * 100).toFixed(0) + '%', sliderX + sliderWidth + 12, contentY + lineHeight);
    drawSlider(sliderX, contentY + lineHeight + 12, sliderWidth, mapOpacity, 0.1, 1.0, getMapOpacitySlider());

    // Map Shape
    ctx.textAlign = 'left';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#e1edf8';
    ctx.fillText('Shape:', sliderX, contentY + lineHeight * 2);
    const shapeButtons = getMapShapeButtons();
    const shapes = ['circle', 'rectangle', 'hexagon'];
    for (let i = 0; i < shapes.length; i++) {
        const b = shapeButtons[i];
        const selected = mapShape === shapes[i];
        ctx.fillStyle = selected ? '#4a9eff' : '#404040';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = selected ? '#4a9eff' : '#606060';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#e1edf8';
        ctx.fillText(shapes[i].charAt(0).toUpperCase() + shapes[i].slice(1), b.x + b.w / 2, b.y + b.h / 2 + 5);
    }

    const previewW = 320;
    const previewH = 190;
    const previewX = canvas.width / 2 - previewW / 2;
    const previewY = contentY + lineHeight * 2 + 64;
    drawMapConfigMinimapPreview(previewX, previewY, previewW, previewH);

    const back = getMapConfigBackButton(previewY + previewH);
    ctx.fillStyle   = '#0a0a0a';
    ctx.fillRect(back.x, back.y, back.w, back.h);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth   = 1;
    ctx.strokeRect(back.x, back.y, back.w, back.h);
    ctx.fillStyle   = '#e1edf8';
    ctx.font        = '16px Arial';
    ctx.textAlign   = 'center';
    ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
}

function getMapConfigBackButton(previewBottomY) {
    const panel = getCharacterPanel();
    const w = 140;
    const h = 38;
    const y = Math.min(panel.y + panel.h - h - 14, previewBottomY + 12);
    return { x: canvas.width / 2 - w / 2, y, w, h };
}

function drawMapConfigMinimapPreview(x, y, w, h) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText('Minimap Preview', x + w / 2, y - 10);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    const baseW = Math.min(260, w - 36);
    const baseH = Math.min(220, h - 36);
    const previewMapW = Math.max(70, Math.round(baseW * mapSize * 0.5));
    const previewMapH = Math.max(60, Math.round(baseH * mapSize * 0.5));
    const mmX = x + (w - previewMapW) / 2;
    const mmY = y + (h - previewMapH) / 2;
    const mmCenterX = mmX + previewMapW / 2;
    const mmCenterY = mmY + previewMapH / 2;
    const mmRadius = Math.min(previewMapW, previewMapH) * 0.5 - 1;

    function tracePreviewShape() {
        if (mapShape === 'circle') {
            ctx.arc(mmCenterX, mmCenterY, mmRadius, 0, Math.PI * 2);
            return;
        }
        if (mapShape === 'hexagon') {
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i + Math.PI / 6;
                const px = mmCenterX + mmRadius * Math.cos(angle);
                const py = mmCenterY + mmRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            return;
        }
        ctx.rect(mmX, mmY, previewMapW, previewMapH);
    }

    ctx.save();
    ctx.globalAlpha = mapOpacity;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    tracePreviewShape();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    tracePreviewShape();
    ctx.clip();

    ctx.fillStyle = '#808080';
    for (let gy = 0; gy < 12; gy++) {
        for (let gx = 0; gx < 16; gx++) {
            if ((gx + gy) % 5 === 0) {
                const tx = mmX + (gx / 16) * previewMapW;
                const ty = mmY + (gy / 12) * previewMapH;
                ctx.fillRect(tx, ty, Math.max(2, previewMapW / 24), Math.max(2, previewMapH / 18));
            }
        }
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mmCenterX, mmCenterY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = mapOpacity;
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    ctx.beginPath();
    tracePreviewShape();
    ctx.stroke();
    ctx.restore();
}

function drawAudioConfigScreen() {
    const panel = getCharacterPanel();
    ctx.fillStyle = 'rgba(0,0,0,0.93)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = MENU_TEXT_COLORS.title;
    ctx.fillText('Audio Settings', canvas.width / 2, panel.y + 46);
    ctx.font = '16px Arial';
    ctx.fillStyle = MENU_TEXT_COLORS.subtitle;
    ctx.fillText('Adjust music and SFX volume', canvas.width / 2, panel.y + 74);

    const contentY = panel.y + 148;
    const sliderWidth = 340;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const lineHeight = 96;

    ctx.textAlign = 'left';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#e1edf8';
    ctx.fillText('Music Volume:', sliderX, contentY);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText(Math.round(musicVolume * 100) + '%', sliderX + sliderWidth + 14, contentY);
    drawSlider(sliderX, contentY + 14, sliderWidth, musicVolume, 0.0, 1.0, getAudioMusicSlider());

    ctx.textAlign = 'left';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#e1edf8';
    ctx.fillText('Game Audio Volume:', sliderX, contentY + lineHeight);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText(Math.round(sfxVolume * 100) + '%', sliderX + sliderWidth + 14, contentY + lineHeight);
    drawSlider(sliderX, contentY + lineHeight + 14, sliderWidth, sfxVolume, 0.0, 1.0, getAudioSfxSlider());

    const back = getAudioConfigBackButton();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(back.x, back.y, back.w, back.h);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.strokeRect(back.x, back.y, back.w, back.h);
    ctx.fillStyle = '#e1edf8';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
}

// Draw Slider keeps the game logic moving.
function drawSlider(x, y, width, currentValue, min, max, sliderRect) {
    const normalizedValue = (currentValue - min) / (max - min);
    const handleX = x + normalizedValue * width;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x, y - 2, width, 4);
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(x, y - 4, normalizedValue * width, 8);

    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.arc(handleX, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Get Map Size Slider keeps the game logic moving.
function getMapSizeSlider() {
    const panel = getCharacterPanel();
    const sliderWidth = 280;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const contentY = panel.y + 110;
    return { x: sliderX, y: contentY + 12, w: sliderWidth, h: 8 };
}

// Get Map Opacity Slider keeps the game logic moving.
function getMapOpacitySlider() {
    const panel = getCharacterPanel();
    const sliderWidth = 280;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const contentY = panel.y + 110;
    const lineHeight = 70;
    return { x: sliderX, y: contentY + lineHeight + 12, w: sliderWidth, h: 8 };
}

// Get Map Shape Buttons keeps the game logic moving.
function getMapShapeButtons() {
    const panel = getCharacterPanel();
    const sliderWidth = 280;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const contentY = panel.y + 110;
    const lineHeight = 70;
    const buttonW = (sliderWidth - 16) / 3;
    const y = contentY + lineHeight * 2 + 12;
    return [
        { x: sliderX, y, w: buttonW, h: 40 },
        { x: sliderX + buttonW + 8, y, w: buttonW, h: 40 },
        { x: sliderX + (buttonW + 8) * 2, y, w: buttonW, h: 40 },
    ];
}

function getAudioMusicSlider() {
    const panel = getCharacterPanel();
    const sliderWidth = 340;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const contentY = panel.y + 148;
    return { x: sliderX, y: contentY + 14, w: sliderWidth, h: 8 };
}

function getAudioSfxSlider() {
    const panel = getCharacterPanel();
    const sliderWidth = 340;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const contentY = panel.y + 148;
    const lineHeight = 96;
    return { x: sliderX, y: contentY + lineHeight + 14, w: sliderWidth, h: 8 };
}

function getAudioConfigBackButton() {
    const panel = getCharacterPanel();
    const w = 140;
    const h = 38;
    return { x: canvas.width / 2 - w / 2, y: panel.y + panel.h - h - 16, w, h };
}

// Draw Splash keeps the game logic moving.
// ── Weapon Select Screen ──────────────────────────────────────────────────

function getWeaponSelectCards() {
    const count  = WEAPON_LOADOUTS.length;
    const cardW  = Math.min(200, Math.floor((canvas.width * 0.82) / count));
    const cardH  = Math.min(310, Math.floor(canvas.height * 0.54));
    const gap    = Math.max(12, Math.floor(cardW * 0.09));
    const totalW = count * cardW + (count - 1) * gap;
    const startX = Math.floor(canvas.width / 2 - totalW / 2);
    const startY = Math.floor(canvas.height / 2 - cardH / 2 + 24);
    return WEAPON_LOADOUTS.map((_, i) => ({
        x: startX + i * (cardW + gap),
        y: startY,
        w: cardW,
        h: cardH,
    }));
}

function getWeaponSelectConfirmButton() {
    const w = 220, h = 48;
    return { x: Math.floor(canvas.width / 2 - w / 2), y: Math.floor(canvas.height * 0.85), w, h };
}

function drawWeaponSelectScreen() {
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.96)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines for atmosphere
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40)  { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 40)  { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    // Title
    ctx.save();
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.font        = `bold 38px ${MENU_UI_FONT_FAMILY}`;
    ctx.fillStyle   = MENU_TEXT_COLORS.title;
    ctx.shadowColor = MENU_TEXT_COLORS.titleShadow;
    ctx.shadowBlur  = 18;
    ctx.fillText('CHOOSE YOUR WEAPON', canvas.width / 2, canvas.height * 0.12);
    ctx.shadowBlur  = 0;
    ctx.font        = `14px ${MENU_UI_FONT_FAMILY}`;
    ctx.fillStyle   = 'rgba(180,210,255,0.55)';
    ctx.fillText('Click a card to select  ·  Enter or Click Confirm to start', canvas.width / 2, canvas.height * 0.12 + 30);
    ctx.restore();

    const cards = getWeaponSelectCards();

    for (let i = 0; i < WEAPON_LOADOUTS.length; i++) {
        const w      = WEAPON_LOADOUTS[i];
        const c      = cards[i];
        const sel    = i === selectedWeaponIndex;
        const hov    = mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h;
        const accent = w.accentColor;
        const pulse  = 0.82 + 0.18 * Math.sin(frameCount * 0.07 + i * 1.2);

        ctx.save();

        // Card glow
        if (sel) {
            ctx.shadowColor = accent;
            ctx.shadowBlur  = 28 * pulse;
        } else if (hov) {
            ctx.shadowColor = accent;
            ctx.shadowBlur  = 12;
        }

        // Card background
        ctx.fillStyle = sel ? `rgba(20,24,36,0.97)` : (hov ? `rgba(16,20,30,0.95)` : `rgba(10,12,20,0.92)`);
        ctx.fillRect(c.x, c.y, c.w, c.h);

        // Border
        ctx.strokeStyle = sel ? accent : (hov ? `rgba(180,200,255,0.35)` : `rgba(80,90,120,0.4)`);
        ctx.lineWidth   = sel ? 2.5 : 1.5;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        ctx.shadowBlur  = 0;

        // Selected top bar
        if (sel) {
            ctx.fillStyle = accent;
            ctx.fillRect(c.x, c.y, c.w, 4);
        }

        // Weapon sprite image — drawn with correct aspect ratio, centred in the image area
        const areaW  = Math.floor(c.w * 0.80);
        const areaH  = Math.floor(c.h * 0.22);
        const areaX  = c.x + Math.floor((c.w - areaW) / 2);
        const areaY  = c.y + Math.floor(c.h * 0.06);
        const sprite = weaponSelectSprites[i];
        if (sprite && sprite.complete && sprite.naturalWidth) {
            const aspect = sprite.naturalWidth / sprite.naturalHeight;
            let dw = areaW, dh = areaW / aspect;
            if (dh > areaH) { dh = areaH; dw = areaH * aspect; }
            const dx = areaX + Math.floor((areaW - dw) / 2);
            const dy = areaY + Math.floor((areaH - dh) / 2);
            ctx.save();
            if (sel) { ctx.shadowColor = accent; ctx.shadowBlur = 14 * pulse; }
            ctx.drawImage(sprite, dx, dy, dw, dh);
            ctx.restore();
        } else {
            // No sprite — draw nothing (fallback gun_idle will load via imgWithFallback)
        }

        // Weapon name
        const nameY = c.y + Math.floor(c.h * 0.36);
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = `bold ${Math.floor(c.w * 0.115)}px ${MENU_UI_FONT_FAMILY}`;
        ctx.fillStyle    = sel ? accent : '#e1edf8';
        ctx.fillText(w.name, c.x + c.w / 2, nameY);

        // Tagline
        ctx.font      = `${Math.floor(c.w * 0.075)}px ${MENU_UI_FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(160,185,220,0.7)';
        ctx.fillText(w.tagline, c.x + c.w / 2, nameY + Math.floor(c.h * 0.075));

        // Divider
        const divY = c.y + Math.floor(c.h * 0.49);
        ctx.strokeStyle = sel ? `${accent}55` : 'rgba(255,255,255,0.08)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(c.x + 14, divY);
        ctx.lineTo(c.x + c.w - 14, divY);
        ctx.stroke();

        // Stats
        const statKeys = Object.keys(w.stats);
        const statAreaH = c.h * 0.34;
        const statH     = statAreaH / statKeys.length;
        const statY0    = divY + 4;
        for (let s = 0; s < statKeys.length; s++) {
            const sy = statY0 + s * statH + statH * 0.5;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.font         = `${Math.floor(c.w * 0.072)}px ${MENU_UI_FONT_FAMILY}`;
            ctx.fillStyle    = 'rgba(160,185,220,0.7)';
            ctx.fillText(statKeys[s], c.x + 12, sy);
            ctx.textAlign    = 'right';
            ctx.font         = `${Math.floor(c.w * 0.08)}px serif`;
            ctx.fillStyle    = sel ? accent : 'rgba(200,220,255,0.6)';
            ctx.fillText(w.stats[statKeys[s]], c.x + c.w - 10, sy);
        }

        // Selected badge
        if (sel) {
            const badgeH = 20;
            const badgeY = c.y + c.h - badgeH - 6;
            ctx.fillStyle    = accent;
            ctx.fillRect(c.x + 14, badgeY, c.w - 28, badgeH);
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.font         = `bold ${Math.floor(c.w * 0.082)}px ${MENU_UI_FONT_FAMILY}`;
            ctx.fillStyle    = '#000';
            ctx.fillText('SELECTED', c.x + c.w / 2, badgeY + badgeH / 2);
        }

        ctx.restore();
    }

    // Confirm button
    const btn       = getWeaponSelectConfirmButton();
    const btnHov    = mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h;
    const selAccent = WEAPON_LOADOUTS[selectedWeaponIndex].accentColor;

    ctx.save();
    ctx.shadowColor = selAccent;
    ctx.shadowBlur  = btnHov ? 22 : 10;
    ctx.fillStyle   = btnHov ? selAccent : `rgba(20,24,36,0.97)`;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = selAccent;
    ctx.lineWidth   = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.shadowBlur  = 0;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 18px ${MENU_UI_FONT_FAMILY}`;
    ctx.fillStyle    = btnHov ? '#000' : selAccent;
    ctx.fillText('▶  Confirm & Start', btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();

    // Back hint
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `13px ${MENU_UI_FONT_FAMILY}`;
    ctx.fillStyle    = 'rgba(140,160,190,0.45)';
    ctx.fillText('Esc — Back to Menu  ·  ← → Arrow Keys to navigate', canvas.width / 2, btn.y + btn.h + 22);
    ctx.restore();

    drawCursor();
}

function drawSplash() {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (splashImage.complete && splashImage.naturalWidth) {
        const iw = splashImage.naturalWidth;
        const ih = splashImage.naturalHeight;
        const scale = Math.max(canvas.width / iw, canvas.height / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        ctx.drawImage(splashImage, dx, dy, dw, dh);
    }

    const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
    vignette.addColorStop(0, 'rgba(0,0,0,0.08)');
    vignette.addColorStop(0.6, 'rgba(0,0,0,0.25)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pulse = 0.55 + 0.45 * Math.sin(performance.now() * 0.004);
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = `rgba(255,255,255,${pulse})`;
    ctx.fillText('PRESS ANY BUTTON TO CONTINUE', canvas.width / 2, canvas.height - 72);
}

// Draw Black Fade keeps the game logic moving.
function drawBlackFade(alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, alpha))})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Draw Menu Sprite Button keeps the game logic moving.
function drawMenuSpriteButton(rect, sprite, fallbackLabel, fallbackFont = '13px Arial') {
    if (sprite?.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, rect.x, rect.y, rect.w, rect.h);
        return;
    }

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#ff0000';
    ctx.font = fallbackFont;
    ctx.textAlign = 'center';
    ctx.fillText(fallbackLabel, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5);
}

// Draw Menu keeps the game logic moving.
function drawMenu() {
    if (menuBackgroundImage.complete && menuBackgroundImage.naturalWidth) {
        const iw = menuBackgroundImage.naturalWidth;
        const ih = menuBackgroundImage.naturalHeight;
        const scale = Math.max(canvas.width / iw, canvas.height / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        ctx.drawImage(menuBackgroundImage, dx, dy, dw, dh);
    } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const menuShade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    menuShade.addColorStop(0, 'rgba(0,0,0,0.2)');
    menuShade.addColorStop(0.65, 'rgba(0,0,0,0.35)');
    menuShade.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = menuShade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (menuPage === 'main') {
        ctx.font       = `800 64px ${MENU_TITLE_FONT_FAMILY}`;
        ctx.textAlign  = 'center';
        ctx.fillStyle  = MENU_TEXT_COLORS.title;
        ctx.shadowColor = MENU_TEXT_COLORS.titleShadow;
        ctx.shadowBlur = 18;
        ctx.fillText('Castanzakannon', canvas.width / 2, canvas.height / 2 - 136);
        ctx.font       = `600 21px ${MENU_UI_FONT_FAMILY}`;
        ctx.fillStyle  = MENU_TEXT_COLORS.subtitle;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 8;
        ctx.fillText('Press ENTER or Click to Start', canvas.width / 2, canvas.height / 2 - 100);
        ctx.font       = `600 17px ${MENU_UI_FONT_FAMILY}`;
        ctx.fillStyle  = MENU_TEXT_COLORS.selectedCharacter;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.fillText('Selected Character: ' + getSelectedCharacter().name, canvas.width / 2, canvas.height / 2 - 74);
        ctx.shadowBlur = 0;

        const mainLayout = getMainMenuLayout();
        ctx.font = `700 19px ${MENU_UI_FONT_FAMILY}`;
        ctx.fillStyle = MENU_TEXT_COLORS.loadoutHeader;
        ctx.fillText(mainLayout.leftHeader.text, mainLayout.leftHeader.x, mainLayout.leftHeader.y);
        ctx.fillStyle = MENU_TEXT_COLORS.systemHeader;
        ctx.fillText(mainLayout.rightHeader.text, mainLayout.rightHeader.x, mainLayout.rightHeader.y);

        const charBtn = getSelectCharacterButton();
        drawMenuSpriteButton(charBtn, menuButtonSprites.selectCharacter, 'Select Character  >', `600 16px ${MENU_UI_FONT_FAMILY}`);

        const btn = getSelectCursorButton();
        drawMenuSpriteButton(btn, menuButtonSprites.selectCursor, 'Select Cursor  >', `600 16px ${MENU_UI_FONT_FAMILY}`);

        const ecb = getEncyclopediaButton();
        drawMenuSpriteButton(ecb, menuButtonSprites.encyclopedia, 'Encyclopedia  >', `600 16px ${MENU_UI_FONT_FAMILY}`);

        const mcb = getMapConfigButton();
        drawMenuSpriteButton(mcb, menuButtonSprites.mapConfig, 'Map Settings  >', `600 16px ${MENU_UI_FONT_FAMILY}`);

        const acb = getAudioConfigButton();
        drawMenuSpriteButton(acb, menuButtonSprites.audioConfig, 'Audio Settings  >', `600 16px ${MENU_UI_FONT_FAMILY}`);


        const ftb = getFogToggleButton();
        drawMenuSpriteButton(ftb, fogEnabled ? menuButtonSprites.fogOn : menuButtonSprites.fogOff, 'Fog: ' + (fogEnabled ? 'ON' : 'OFF'), `600 14px ${MENU_UI_FONT_FAMILY}`);


        const pb = getPerfButton();
        drawMenuSpriteButton(pb, menuButtonSprites.graphicsTutorial, 'Graphics Tutorial', `600 14px ${MENU_UI_FONT_FAMILY}`);


        const fpb = getFpsToggleButton();
        drawMenuSpriteButton(fpb, showFpsCounter ? menuButtonSprites.fpsOn : menuButtonSprites.fpsOff, 'FPS Counter: ' + (showFpsCounter ? 'ON' : 'OFF'), `600 14px ${MENU_UI_FONT_FAMILY}`);


        const dtb = getDevTestButton();
        drawMenuSpriteButton(dtb, devTestMode ? menuButtonSprites.devTestOn : menuButtonSprites.devTestOff, 'Dev Test  >', `600 14px ${MENU_UI_FONT_FAMILY}`);


        const dcb = getDevCheatButton();
        drawMenuSpriteButton(dcb, devCheatMenuEnabled ? menuButtonSprites.devCheatsOn : menuButtonSprites.devCheatsOff, 'Dev Cheats: ' + (devCheatMenuEnabled ? 'ON' : 'OFF'), `600 14px ${MENU_UI_FONT_FAMILY}`);

        if (showPerfGuide) drawPerfGuide();
    } else if (menuPage === 'characters') {
        const panel = getCharacterPanel();
        ctx.fillStyle = 'rgba(0,0,0,0.93)';
        ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

        ctx.fillStyle = MENU_TEXT_COLORS.title;
        ctx.font      = 'bold 38px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Select Character', canvas.width / 2, panel.y + 46);
        ctx.font      = '16px Arial';
        ctx.fillStyle = MENU_TEXT_COLORS.subtitle;
        ctx.fillText('Chunkster and Dasher are now live with unique passives', canvas.width / 2, panel.y + 74);

        const cards = getCharacterCards();
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            const loadout = CHARACTER_LOADOUTS[i];
            const isSel = i === selectedCharacter;
            const isHover = mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h;

            const targetHover = isHover ? 1 : 0;
            characterHoverAnim[i] += (targetHover - characterHoverAnim[i]) * 0.25;
            const hoverT = characterHoverAnim[i];
            const scale = 1 + hoverT * 0.08;
            const drawW = c.w * scale;
            const drawH = c.h * scale;
            const drawX = c.x + (c.w - drawW) / 2;
            const drawY = c.y + (c.h - drawH) / 2;

            ctx.fillStyle = isSel ? '#1a1a1a' : '#0a0a0a';
            ctx.fillRect(drawX, drawY, drawW, drawH);

            ctx.strokeStyle = isSel ? '#4a9eff' : isHover ? '#2a7eff' : '#404040';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.strokeRect(drawX, drawY, drawW, drawH);

            if (isSel) {
                ctx.save();
                ctx.shadowColor = 'rgba(255,255,255,0.5)';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = 'rgba(255,255,255,0.65)';
                ctx.strokeRect(drawX + 1, drawY + 1, drawW - 2, drawH - 2);
                ctx.restore();
            }

            const prev = getCharacterPreviewSprite(loadout);
            const size = Math.min(drawW * 0.72, drawH * 0.45);
            const px = drawX + drawW / 2 - size / 2;
            const py = drawY + 20;
            ctx.drawImage(prev, px, py, size, size);

            const nameY = drawY + drawH - 88;
            const spdY  = drawY + drawH - 60;
            const hpY   = drawY + drawH - 44;
            const xpY   = drawY + drawH - 28;
            const tagY  = drawY + drawH - 12;

            ctx.textAlign = 'center';
            ctx.font = 'bold 13px Arial';
            ctx.fillStyle = isSel ? MENU_TEXT_COLORS.selectedCharacter : '#e1edf8';
            ctx.fillText(loadout.name, drawX + drawW / 2, nameY);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#c0c0c0';
            ctx.fillText(`SPD ${loadout.speed.toFixed(1)}`, drawX + drawW / 2, spdY);
            ctx.fillText(`HP ${loadout.maxHp}`, drawX + drawW / 2, hpY);
            ctx.fillText(`XP x${loadout.xpGainMult.toFixed(2)}`, drawX + drawW / 2, xpY);
            if ((loadout.lifestealOnKill ?? 0) > 0) {
                ctx.fillText(`LS ${Math.round(loadout.lifestealOnKill * 100)}%`, drawX + drawW / 2, tagY);
            } else {
                ctx.fillText(`DASH ${loadout.dashCharges ?? 1}x`, drawX + drawW / 2, tagY);
            }

            if (isSel) {
                ctx.font = 'bold 11px Arial';
                ctx.fillStyle = '#4a9eff';
                ctx.fillText('ACTIVE', drawX + drawW / 2, drawY + 16);
            }
        }

        const back = getCharacterBackButton();
        ctx.fillStyle   = '#0a0a0a';
        ctx.fillRect(back.x, back.y, back.w, back.h);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth   = 1;
        ctx.strokeRect(back.x, back.y, back.w, back.h);
        ctx.fillStyle   = '#e1edf8';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
    } else if (menuPage === 'cursors') {
        ctx.fillStyle = '#ffffff';
        ctx.font      = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Select Cursor', canvas.width / 2, canvas.height / 2 - 80);

        const boxes = getCursorBoxes();
        for (let i = 0; i < cursorSprites.length; i++) {
            const b   = boxes[i];
            const sel = i === selectedCursor;
            ctx.fillStyle   = sel ? '#add8e6' : '#000000';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.drawImage(cursorSprites[i].img, b.x + 4, b.y + 4, b.w - 8, b.h - 8);
            ctx.strokeStyle = sel ? '#ff0000'   : '#808080';
            ctx.lineWidth   = sel ? 2       : 1;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle   = sel ? '#ffffff' : '#c0c0c0';
            ctx.font        = '11px Arial';
            ctx.textAlign   = 'center';
            ctx.fillText(cursorSprites[i].name, b.x + b.w / 2, b.y + b.h + 14);
        }

        const back = getBackButton();
        ctx.fillStyle   = '#ff0000';
        ctx.fillRect(back.x, back.y, back.w, back.h);
        ctx.strokeStyle = '#808080';
        ctx.lineWidth   = 1;
        ctx.strokeRect(back.x, back.y, back.w, back.h);
        ctx.fillStyle   = '#c0c0c0';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
    } else if (menuPage === 'mapConfig') {
        drawMapConfigScreen();
    } else if (menuPage === 'audioConfig') {
        drawAudioConfigScreen();
    } else if (menuPage === 'devTestConfig') {
        drawDevTestConfigScreen();
    } else if (menuPage === 'encyclopedia') {
        drawEncyclopediaMenu();
    }

    drawCursor();
}

// Draw Level Up Menu keeps the game logic moving.
function drawLevelUpMenu() {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vig = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.85
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 42px Arial';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur  = 22;
    ctx.fillStyle   = '#ff0000';
    ctx.fillText('LEVEL UP!', canvas.width / 2, canvas.height / 2 - 270);
    ctx.font        = '18px Arial';
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = 'rgba(200,220,255,0.85)';
    ctx.fillText('Choose a stat boost or skip', canvas.width / 2, canvas.height / 2 - 235);
    ctx.restore();

    const { cards, skip } = getLevelUpZones();
    levelUpMenuHover = -1;
    for (let i = 0; i < 3; i++) {
        const c = cards[i];
        if (mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h) levelUpMenuHover = i;
    }
    if (mouseX >= skip.x && mouseX <= skip.x + skip.w && mouseY >= skip.y && mouseY <= skip.y + skip.h) levelUpMenuHover = 3;

    const ICONS  = ['I', 'II', 'III'];

    for (let i = 0; i < 3; i++) {
        const c     = cards[i];
        const choice = currentLevelUpChoices[i] ?? LEVEL_UPGRADES[i] ?? null;
        const hover = levelUpMenuHover === i;
        const pulse = 0.85 + 0.15 * Math.sin(frameCount * 0.06 + i * 1.1);

        ctx.save();
        if (hover) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 28; ctx.globalAlpha = pulse; }
        ctx.drawImage(lvlCardBgSprite, c.x, c.y, c.w, c.h);

        if (hover) {
            ctx.strokeStyle = `rgba(140,180,255,${pulse})`;
            ctx.lineWidth   = 2;
            const r = 14;
            ctx.beginPath();
            ctx.moveTo(c.x + r, c.y); ctx.lineTo(c.x + c.w - r, c.y); ctx.arcTo(c.x + c.w, c.y, c.x + c.w, c.y + r, r);
            ctx.lineTo(c.x + c.w, c.y + c.h - r); ctx.arcTo(c.x + c.w, c.y + c.h, c.x + c.w - r, c.y + c.h, r);
            ctx.lineTo(c.x + r, c.y + c.h); ctx.arcTo(c.x, c.y + c.h, c.x, c.y + c.h - r, r);
            ctx.lineTo(c.x, c.y + r); ctx.arcTo(c.x, c.y, c.x + r, c.y, r);
            ctx.closePath(); ctx.stroke();
        }

        ctx.globalAlpha  = 1;
        ctx.shadowBlur   = 0;
        ctx.textAlign    = 'center';
        ctx.font         = '44px Arial';
        ctx.fillText(ICONS[i], c.x + c.w / 2, c.y + 42);
        const rarityColor = getRarityUiColor(choice?.rarity);
        const level = choice ? getUpgradeLevel(choice.id) : 0;
        ctx.font         = 'bold 14px Arial';
        ctx.fillStyle    = hover ? '#ff0000' : '#ff0000';
        ctx.fillText(`Choice ${i + 1}`, c.x + c.w / 2, c.y + 78);
        ctx.font         = 'bold 16px Arial';
        ctx.fillStyle    = hover ? '#ff0000' : rarityColor;
        ctx.fillText(choice?.title ?? 'Upgrade', c.x + c.w / 2, c.y + 124);
        ctx.font         = '12px Arial';
        ctx.fillStyle    = 'rgba(160,170,190,0.6)';
        ctx.fillText(choice?.detail ?? 'No upgrade info', c.x + c.w / 2, c.y + 162);
        ctx.fillStyle = rarityColor;
        ctx.fillText((choice?.rarity ?? 'common').toUpperCase(), c.x + c.w / 2, c.y + 184);
        ctx.fillStyle = 'rgba(210,220,240,0.78)';
        ctx.fillText(`Current Lv ${level}`, c.x + c.w / 2, c.y + 202);
        ctx.fillText('Click or press 1/2/3', c.x + c.w / 2, c.y + 220);
        ctx.restore();
    }

    const sh = levelUpMenuHover === 3;
    const sp = 0.85 + 0.15 * Math.sin(frameCount * 0.06);
    ctx.save();
    if (sh) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 16; ctx.globalAlpha = sp; }
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(skip.x, skip.y, skip.w, skip.h);
    ctx.strokeStyle = sh ? 'rgba(255,0,0,0.9)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(skip.x, skip.y, skip.w, skip.h);
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 16px Arial';
    ctx.fillStyle   = sh ? '#ff0000' : 'rgba(200,200,200,0.85)';
    ctx.fillText('Skip', skip.x + skip.w / 2, skip.y + skip.h / 2 + 6);
    ctx.restore();

    drawUpgradeHud();
}

// Draw Game Over keeps the game logic moving.
function drawGameOver() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#dc143c';
    ctx.font      = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font      = '28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('You reached Level ' + lastLevelDied, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font      = '20px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText('Press ENTER or Click to return to Menu', canvas.width / 2, canvas.height / 2 + 40);
}

// Draw Win Screen keeps the game logic moving.
function drawWinScreen() {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0000';
    ctx.font      = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN', canvas.width / 2, canvas.height / 2 - 60);

    ctx.font      = '26px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('All 5 levels cleared', canvas.width / 2, canvas.height / 2 - 12);

    ctx.font      = '20px Arial';
    ctx.fillStyle = '#c0c0c0';
    ctx.fillText('Press ENTER or Click to return to Menu', canvas.width / 2, canvas.height / 2 + 38);
}

// Draw Cursor keeps the game logic moving.
function drawCursor() {
    const sp = cursorSprites[selectedCursor].img;
    if (!sp.complete || !sp.naturalWidth) return;
    ctx.drawImage(sp, mouseX, mouseY, 32, 32);
}

