// =============================================================================
//  CANVAS SETUP
// =============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.willChange     = 'transform';
canvas.style.transform      = 'translateZ(0)';
canvas.style.imageRendering = 'pixelated';
document.body.style.background = '#000';
document.body.style.overflow   = 'hidden';


// =============================================================================
//  CONSTANTS
// =============================================================================

const TILE          = 48;
const MAP_W         = 80;
const MAP_H         = 60;
const TILE_FLOOR    = 0;
const TILE_WALL     = 1;
const TILE_CORNER_NW = 2;
const TILE_CORNER_NE = 3;
const TILE_CORNER_SW = 4;
const TILE_CORNER_SE = 5;
const WALL_FACE_HEIGHT = 14;
const CORNER_RAIL_INSET = 12;
const DASH_SPEED    = 16;
const DASH_DURATION = 15;
const DASH_WALL_STUCK_DAMAGE = 20;
const MAX_ACTIVE_ENEMIES = 50;
const WAVES_PER_LEVEL = 5;
const WAVE_BASE_ENEMIES = 50;
const WAVE_STEP_ENEMIES = 25;
const WAVE_CLEAR_DELAY_FRAMES = 45;
const WAVE_START_SPAWN_DELAY_FRAMES = 5;
const WAVE_BASE_SPAWNS_PER_SECOND = 6;
const WAVE_SPAWN_RATE_STEP = 1;
const MAX_ARENA_LEVELS = 5;
const SPAWN_RING_INSET = 70;
const ENEMY_OFFSCREEN_DESPAWN_FRAMES = 150;
const ENEMY_OFFSCREEN_MARGIN = 120;
const RAIL_RADIUS   = 52;
const GUN_W         = 48;
const GUN_H         = 18;

const FIXED_STEP = 1000 / 60;
const SPLASH_FADE_DURATION_MS = 1500;

const ENEMY_TYPES = {
    basic: { hp: 3, size: 14, speed: 2,   color: 'green',  animSpeed: 10 },
    fast:  { hp: 2, size: 12, speed: 3.5, color: 'yellow', animSpeed: 6  },
    tank:  { hp: 8, size: 20, speed: 1.2, color: 'red',    animSpeed: 14 },
};

// ── ENEMY VARIANT STATS ──────────────────────────────────────────────────────
// Each variant (a, b, c, d) has unique hp and speed multipliers
// base = Level 1, a = Level 2, b = Level 3, c = Level 4, d = Level 5
const ENEMY_VARIANT_STATS = {
    base: { basic: { hp: 3, speed: 2 },      fast: { hp: 2, speed: 3.5 },   tank: { hp: 8, speed: 1.2 } },
    a:    { basic: { hp: 4, speed: 2.2 },    fast: { hp: 3, speed: 3.8 },   tank: { hp: 10, speed: 1.3 } },
    b:    { basic: { hp: 5, speed: 2.4 },    fast: { hp: 3, speed: 4.1 },   tank: { hp: 12, speed: 1.4 } },
    c:    { basic: { hp: 6, speed: 2.6 },    fast: { hp: 4, speed: 4.4 },   tank: { hp: 14, speed: 1.5 } },
    d:    { basic: { hp: 7, speed: 2.8 },    fast: { hp: 4, speed: 4.7 },   tank: { hp: 16, speed: 1.6 } },
};

// ── MUZZLE FLASH SETTINGS ─────────────────────────────────────────────────────
const MUZZLE_LIFE      = 6;    // frames the flash lives
const MUZZLE_SPARKS    = 5;    // number of sparks per shot
const SHOOT_COOLDOWN   = 5;    // frames between shots (was 10)
const BULLET_SPREAD    = 0.10; // max random angle offset in radians (~±6°)

const XP_PICKUP_BASE_VALUE = 5;
const XP_ATTRACT_RADIUS    = 150;
const XP_ATTRACT_SPEED     = 3;
const TANK_XP_MULTIPLIER   = 1.5;

const XP_PICKUP_VARIANTS = {
    green: { shadow: '#39ff14', rgb: '57,255,20'  },
    blue:  { shadow: '#31b6ff', rgb: '49,182,255' },
};

// Vial layout
const VSRC_W = 72,  VSRC_H = 220;
const VCORK_H = 16, VCORK_Y1 = 2,  VCORK_Y2 = VCORK_Y1 + VCORK_H;
const VNECK_W = 24, VNECK_Y1 = VCORK_Y2, VNECK_Y2 = VNECK_Y1 + 28;
const VSHOULDER_Y1 = VNECK_Y2,  VSHOULDER_Y2 = VSHOULDER_Y1 + 18;
const VBODY_W = 56, VBODY_Y1 = VSHOULDER_Y2, VBODY_Y2 = VSRC_H - 5;
const VBRAD = 10,   VCX = VSRC_W / 2;
const VIAL_SCALE = 0.88;
const VIAL_W = VSRC_W * VIAL_SCALE;
const VIAL_H = VSRC_H * VIAL_SCALE;

// ── SANDEVISTAN DASH TRAIL SETTINGS ──────────────────────────────────────────
const TRAIL_LENGTH   = 7;    // distinct afterimage steps
const TRAIL_INTERVAL = 2;    // record every N physics frames
const TRAIL_LIFETIME = 38;   // frames a ghost stays visible after dash ends

// Neon Sandevistan palette — oldest ghost first, newest last
const SANDEV_COLORS = [
    { r: 255, g: 0,   b: 255 },   // magenta
    { r: 180, g: 0,   b: 255 },   // violet
    { r: 0,   g: 80,  b: 255 },   // electric blue
    { r: 0,   g: 220, b: 255 },   // cyan
    { r: 0,   g: 255, b: 160 },   // neon green
    { r: 255, g: 220, b: 0   },   // yellow
    { r: 255, g: 80,  b: 0   },   // orange  (freshest / closest to player)
];

// Persistent offscreen canvas for silhouette tinting — allocated once
const _tintCanvas = document.createElement('canvas');
_tintCanvas.width  = 128;
_tintCanvas.height = 128;
const _tintCtx = _tintCanvas.getContext('2d');


// =============================================================================
//  SPRITES
// =============================================================================

const img = src => Object.assign(new Image(), { src });

function imgWithFallback(sources) {
    const sprite = new Image();
    let index = 0;

    const tryNext = () => {
        if (index >= sources.length) return;
        sprite.src = sources[index++];
    };

    sprite.addEventListener('error', tryNext);
    tryNext();
    return sprite;
}

function createCharacterSprites(index = 1) {
    if (index === 1) {
        return {
            idle:  img('assets/sprites/player_idle.png'),
            walk1: img('assets/sprites/player_walk1.png'),
            walk2: img('assets/sprites/player_walk2.png'),
        };
    }

    const n = String(index);
    return {
        idle:  imgWithFallback([`assets/sprites/player${n}_idle.png`,  `assets/sprites/player_idle${n}.png`]),
        walk1: imgWithFallback([`assets/sprites/player${n}_walk1.png`, `assets/sprites/player_walk1${n}.png`]),
        walk2: imgWithFallback([`assets/sprites/player${n}_walk2.png`, `assets/sprites/player_walk2${n}.png`]),
    };
}

const CHARACTER_LOADOUTS = [
    { name: 'Kannon Prime', speed: 4.0, maxHp: 100, xpGainMult: 1.00, lifestealOnKill: 0.00, dashCharges: 1, dashDistanceMult: 1.00, dashRechargeFrames: 120, dashPhasesWalls: false, sprites: createCharacterSprites(1) },
    { name: 'Ghost Runner', speed: 5.2, maxHp: 70,  xpGainMult: 1.00, lifestealOnKill: 0.00, dashCharges: 1, dashDistanceMult: 1.00, dashRechargeFrames: 120, dashPhasesWalls: false, sprites: createCharacterSprites(2) },
    { name: 'Gambit',       speed: 4.0, maxHp: 50,  xpGainMult: 1.45, lifestealOnKill: 0.00, dashCharges: 1, dashDistanceMult: 1.00, dashRechargeFrames: 120, dashPhasesWalls: false, sprites: createCharacterSprites(3) },
    { name: 'Chunkster',    speed: 3.1, maxHp: 170, xpGainMult: 1.00, lifestealOnKill: 0.04, dashCharges: 1, dashDistanceMult: 1.00, dashRechargeFrames: 120, dashPhasesWalls: false, sprites: createCharacterSprites(4) },
    { name: 'Dasher',       speed: 4.0, maxHp: 60,  xpGainMult: 1.00, lifestealOnKill: 0.00, dashCharges: 2, dashDistanceMult: 0.72, dashRechargeFrames: 90,  dashPhasesWalls: true,  sprites: createCharacterSprites(5) },
];

const fallbackPlayerSprites = CHARACTER_LOADOUTS[0].sprites;

function getSelectedCharacter() {
    return CHARACTER_LOADOUTS[selectedCharacter] ?? CHARACTER_LOADOUTS[0];
}

function getPlayerSprite(frame) {
    const loadout = getSelectedCharacter();
    const sprite  = loadout.sprites[frame] ?? loadout.sprites.idle;
    if (sprite?.complete && sprite.naturalWidth) return sprite;
    return fallbackPlayerSprites[frame] ?? fallbackPlayerSprites.idle;
}

const gunSprites = {
    idle:  img('assets/sprites/guns/gun_idle.png'),
    shoot: img('assets/sprites/guns/gun_shoot.png'),
};

const wallSprite         = img('assets/sprites/wall_placeholder.png');
const wallFaceSprite     = img('assets/sprites/wall_face_placeholder.png');
const cornerFaceSprite   = img('assets/sprites/wall_corner_face_placeholder.png');
const floorSprite        = img('assets/sprites/floor_placeholder.png');
const projectileSprite   = img('assets/sprites/projectile_placeholder.png');
const pickupXpSprite     = img('assets/sprites/pickup_xp_placeholder.png');
const pickupXpBlueSprite = img('assets/sprites/pickup_xp_blue_placeholder.png');

const ENEMY_SPRITE_PATHS = {
    basic: ['assets/sprites/enemies/enemy_basic_frame1.png', 'assets/sprites/enemies/enemy_basic_frame2.png', 'assets/sprites/enemies/enemy_basic_frame3.png'],
    fast:  ['assets/sprites/enemies/enemy_fast_frame1.png',  'assets/sprites/enemies/enemy_fast_frame2.png',  'assets/sprites/enemies/enemy_fast_frame3.png' ],
    tank:  ['assets/sprites/enemies/enemy_tank_frame1.png',  'assets/sprites/enemies/enemy_tank_frame2.png',  'assets/sprites/enemies/enemy_tank_frame3.png' ],
};

const ENEMY_LEVEL_VARIANTS = {
    1: 'base',
    2: 'a',
    3: 'b',
    4: 'c',
    5: 'd',
};

function createEnemySpriteSet(variant) {
    const set = {};
    for (const [type, paths] of Object.entries(ENEMY_SPRITE_PATHS)) {
        set[type] = paths.map(src => {
            if (variant === 'base') return img(src);
            const filename = src.split('/').pop();
            // Transform filename: enemy_basic_frame1.png -> enemy_a_basic_frame1.png
            const variantFilename = filename.replace('enemy_', `enemy_${variant}_`);
            return imgWithFallback([`assets/sprites/enemies/${variant}/${variantFilename}`, src]);
        });
    }
    return set;
}

const enemySpriteSets = {
    base: createEnemySpriteSet('base'),
    a: createEnemySpriteSet('a'),
    b: createEnemySpriteSet('b'),
    c: createEnemySpriteSet('c'),
    d: createEnemySpriteSet('d'),
};

function getEnemyVariantForLevel(level) {
    return ENEMY_LEVEL_VARIANTS[level] ?? 'base';
}

function getEnemySpritesForCurrentLevel() {
    const variant = getEnemyVariantForLevel(currentArenaLevel);
    return enemySpriteSets[variant] ?? enemySpriteSets.base;
}

function getEnemySpriteFrames(type) {
    const activeSet = getEnemySpritesForCurrentLevel();
    return activeSet[type] ?? enemySpriteSets.base[type];
}

const cursorSprites = [
    { name: 'Crosshair',  img: img('assets/sprites/cursors/cursor_crosshair.png')  },
    { name: 'Reticle',    img: img('assets/sprites/cursors/cursor_reticle.png')    },
    { name: 'Scope',      img: img('assets/sprites/cursors/cursor_scope.png')      },
    { name: 'Skull',      img: img('assets/sprites/cursors/cursor_skull.png')      },
    { name: 'Tactical',   img: img('assets/sprites/cursors/cursor_tactical.png')   },
    { name: 'Neon Arrow', img: img('assets/sprites/cursors/cursor_neon_arrow.png') },
];

// UI sprites
const xpBarBgSprite      = img('assets/sprites/ui/ui_xpbar_bg.png');
const xpBarFillSprite    = img('assets/sprites/ui/ui_xpbar_fill.png');
const xpBarFrameSprite   = img('assets/sprites/ui/ui_xpbar_frame.png');
const xpBarGlowSprite    = img('assets/sprites/ui/ui_xpbar_glow.png');
const lvlCardBgSprite    = img('assets/sprites/ui/ui_levelup_card_bg.png');
const lvlSkipBgSprite    = img('assets/sprites/ui/ui_levelup_skip_bg.png');
const vialFrameSprite    = img('assets/sprites/ui/ui_vial_frame.png');
const vialBgSprite       = img('assets/sprites/ui/ui_vial_bg.png');
const vialGlowHpSprite   = img('assets/sprites/ui/ui_vial_glow_hp.png');
const vialGlowDashSprite = img('assets/sprites/ui/ui_vial_glow_dash.png');
const vialBubblesSprite  = img('assets/sprites/ui/ui_vial_bubbles.png');

const splashImage = img('assets/sprites/ui/intro.png');
const menuBackgroundImage = img('assets/sprites/ui/menu.png');

const MAP_THEME_SPRITES = {
    1: {
        floor: floorSprite,
        wall: wallSprite,
        wallFace: wallFaceSprite,
        cornerFace: cornerFaceSprite,
    },
    2: {
        floor: imgWithFallback(['assets/sprites/level2/floor_level2.png', 'assets/sprites/floor_placeholder.png']),
        wall: imgWithFallback(['assets/sprites/level2/wall_level2.png', 'assets/sprites/wall_placeholder.png']),
        wallFace: imgWithFallback(['assets/sprites/level2/wall_face_level2.png', 'assets/sprites/wall_face_placeholder.png']),
        cornerFace: imgWithFallback(['assets/sprites/level2/wall_corner_face_level2.png', 'assets/sprites/wall_corner_face_placeholder.png']),
    },
    3: {
        floor: imgWithFallback(['assets/sprites/level3/floor_level3.png', 'assets/sprites/floor_placeholder.png']),
        wall: imgWithFallback(['assets/sprites/level3/wall_level3.png', 'assets/sprites/wall_placeholder.png']),
        wallFace: imgWithFallback(['assets/sprites/level3/wall_face_level3.png', 'assets/sprites/wall_face_placeholder.png']),
        cornerFace: imgWithFallback(['assets/sprites/level3/wall_corner_face_level3.png', 'assets/sprites/wall_corner_face_placeholder.png']),
    },
    4: {
        floor: imgWithFallback(['assets/sprites/level4/floor_level4.png', 'assets/sprites/floor_placeholder.png']),
        wall: imgWithFallback(['assets/sprites/level4/wall_level4.png', 'assets/sprites/wall_placeholder.png']),
        wallFace: imgWithFallback(['assets/sprites/level4/wall_face_level4.png', 'assets/sprites/wall_face_placeholder.png']),
        cornerFace: imgWithFallback(['assets/sprites/level4/wall_corner_face_level4.png', 'assets/sprites/wall_corner_face_placeholder.png']),
    },
    5: {
        floor: imgWithFallback(['assets/sprites/level5/floor_level5.png', 'assets/sprites/floor_placeholder.png']),
        wall: imgWithFallback(['assets/sprites/level5/wall_level5.png', 'assets/sprites/wall_placeholder.png']),
        wallFace: imgWithFallback(['assets/sprites/level5/wall_face_level5.png', 'assets/sprites/wall_face_placeholder.png']),
        cornerFace: imgWithFallback(['assets/sprites/level5/wall_corner_face_level5.png', 'assets/sprites/wall_corner_face_placeholder.png']),
    },
};

const MAP_THEME_TINT = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
};


// =============================================================================
//  GAME STATE
// =============================================================================

let fogEnabled     = true;
let keys           = {};
let camera         = { x: 0, y: 0 };
let mapTiles       = [];
let frameCount     = 0;
let gameState      = 'splash';
let menuPage       = 'main';
let selectedCursor = 0;
let selectedCharacter = 0;
let characterHoverAnim = CHARACTER_LOADOUTS.map(() => 0);
let mouseX         = 0;
let mouseY         = 0;
let mouseDown      = false;
let projectiles    = [];
let enemies        = [];
let pickups        = [];
let muzzleFlashes  = [];
let navGrid        = [];
let lastLevelDied  = 1;
let levelUpMenuHover = -1;
let xpBarFlash     = 0;
let lastTimestamp  = 0;
let accumulator    = 0;
let renderAlpha    = 1;
let fps            = 0;
let showPerfGuide  = false;
let showFpsCounter = true;
let splashFadeTimerMs = 0;
let devTestMode    = false;
let currentArenaLevel = 1;
let currentWave = 1;
let enemiesRemainingInWave = 0;
let enemiesToSpawn = 0;
let waveClearTimer = 0;
let waveSpawnDelayFrames = 0;
let enemySpawnBudget = 0;
let currentMapThemeId = 1;
let currentMapTheme = MAP_THEME_SPRITES[1];

// ── DASH TRAIL ────────────────────────────────────────────────────────────────
// Each entry: { x, y, flipX, age }
let dashTrail  = [];
let trailTimer = 0;

const fogCanvas = document.createElement('canvas');
const fogCtx    = fogCanvas.getContext('2d');

let player = {
    x: MAP_W * TILE / 2,    y: MAP_H * TILE / 2,
    prevX: MAP_W * TILE / 2, prevY: MAP_H * TILE / 2,
    size: 20, speed: 4, color: 'blue',
    dashing: false, dashTime: 0,
    dashDirX: 0, dashDirY: 0,
    dashCooldown: 0, facing: 1,
    dashCharges: 1, dashMaxCharges: 1,
    dashDistanceMult: 1,
    dashPhasesWalls: false,
    dashRechargeFrames: 120,
    shootCooldown: 0, weaponAngle: 0,
    hp: 100, maxHp: 100, invulnTimer: 0,
    xpGainMult: 1,
    lifestealOnKill: 0,
    xp: 0, xpToNextLevel: 100, level: 1,
};

let playerAnim = {
    frame:      'idle',
    timer:      0,
    walkToggle: false,
    idleTimer:  0,
    dashFrame:  'dash_h',
    dashFlipX:  false,
};

function startSplashTransition() {
    if (gameState !== 'splash') return;
    gameState = 'splashTransition';
    splashFadeTimerMs = 0;
}


// =============================================================================
//  INPUT
// =============================================================================

window.addEventListener('keydown', e => {
    if (gameState === 'splash') {
        startSplashTransition();
        return;
    }

    if (gameState === 'splashTransition') {
        return;
    }

    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Escape' && gameState === 'menu' && (menuPage === 'cursors' || menuPage === 'characters')) {
        menuPage = 'main';
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if      (gameState === 'menu'    && menuPage === 'main') startGame();
        else if (gameState === 'gameOver') { gameState = 'menu'; menuPage = 'main'; }
        else if (gameState === 'win')      { gameState = 'menu'; menuPage = 'main'; }
        else if (gameState === 'levelUp')  gameState = 'playing';
        else if (gameState === 'playing')  playerDash();
    }
});

window.addEventListener('keyup',     e  => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e  => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mouseup',   () => { mouseDown = false; });

window.addEventListener('mousedown', () => {
    if (gameState === 'splash') {
        startSplashTransition();
        return;
    }

    if (gameState === 'splashTransition') {
        return;
    }

    mouseDown = true;

    if (gameState === 'menu') {
        if (menuPage === 'main') {
            const charBtn = getSelectCharacterButton();
            const btn = getSelectCursorButton();
            const ftb = getFogToggleButton();
            const pb  = getPerfButton();
            const fpb = getFpsToggleButton();
            const dtb = getDevTestButton();
            if (mouseX >= charBtn.x && mouseX <= charBtn.x + charBtn.w && mouseY >= charBtn.y && mouseY <= charBtn.y + charBtn.h) {
                menuPage = 'characters';
            } else if (mouseX >= pb.x && mouseX <= pb.x + pb.w && mouseY >= pb.y && mouseY <= pb.y + pb.h) {
                showPerfGuide = !showPerfGuide;
            } else if (mouseX >= fpb.x && mouseX <= fpb.x + fpb.w && mouseY >= fpb.y && mouseY <= fpb.y + fpb.h) {
                showFpsCounter = !showFpsCounter;
            } else if (mouseX >= dtb.x && mouseX <= dtb.x + dtb.w && mouseY >= dtb.y && mouseY <= dtb.y + dtb.h) {
                devTestMode = !devTestMode;
            } else if (mouseX >= ftb.x && mouseX <= ftb.x + ftb.w && mouseY >= ftb.y && mouseY <= ftb.y + ftb.h) {
                fogEnabled = !fogEnabled;
            } else if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                menuPage = 'cursors';
            } else {
                startGame();
            }
        } else if (menuPage === 'characters') {
            const back = getCharacterBackButton();
            if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                menuPage = 'main';
            } else {
                const cards = getCharacterCards();
                for (let i = 0; i < cards.length; i++) {
                    const c = cards[i];
                    if (mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h) {
                        selectedCharacter = i;
                        break;
                    }
                }
            }
        } else if (menuPage === 'cursors') {
            const back = getBackButton();
            if (mouseX >= back.x && mouseX <= back.x + back.w && mouseY >= back.y && mouseY <= back.y + back.h) {
                menuPage = 'main';
            } else {
                const boxes = getCursorBoxes();
                for (let i = 0; i < boxes.length; i++) {
                    const b = boxes[i];
                    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
                        selectedCursor = i;
                        break;
                    }
                }
            }
        }
    } else if (gameState === 'gameOver') {
        gameState = 'menu';
        menuPage  = 'main';
    } else if (gameState === 'win') {
        gameState = 'menu';
        menuPage  = 'main';
    } else if (gameState === 'levelUp') {
        const zones = getLevelUpZones();
        for (let i = 0; i < 3; i++) {
            const z = zones.cards[i];
            if (mouseX >= z.x && mouseX <= z.x + z.w && mouseY >= z.y && mouseY <= z.y + z.h) {
                gameState = 'playing';
                return;
            }
        }
        const s = zones.skip;
        if (mouseX >= s.x && mouseX <= s.x + s.w && mouseY >= s.y && mouseY <= s.y + s.h) {
            gameState = 'playing';
        }
    }
});

window.addEventListener('touchstart', () => {
    if (gameState === 'splash') startSplashTransition();
}, { passive: true });


// =============================================================================
//  MAP
// =============================================================================

function generateMap() {
    mapTiles = [];
    for (let i = 0; i < MAP_H; i++) {
        mapTiles[i] = [];
        for (let j = 0; j < MAP_W; j++) {
            mapTiles[i][j] = (j < 2 || j >= MAP_W - 2 || i < 2 || i >= MAP_H - 2) ? TILE_WALL : TILE_FLOOR;
        }
    }

    for (let i = 0; i < 64; i++) {
        const sx = 6 + Math.floor(Math.random() * (MAP_W - 14));
        const sy = 6 + Math.floor(Math.random() * (MAP_H - 14));
        const sw = 3 + Math.floor(Math.random() * 4);
        const sh = 3 + Math.floor(Math.random() * 4);

        if (Math.random() > 0.5) {
            for (let j = sy; j < sy + sh && j < MAP_H - 2; j++)
                for (let k = sx; k < sx + sw && k < MAP_W - 2; k++)
                    mapTiles[j][k] = TILE_WALL;
        } else {
            for (let j = sy; j < sy + sh && j < MAP_H - 2; j++) mapTiles[j][sx] = TILE_WALL;
            for (let k = sx; k < sx + sw && k < MAP_W - 2; k++) mapTiles[sy][k] = TILE_WALL;
        }
    }

    // Clear spawn area
    const cx = Math.floor(MAP_W / 2), cy = Math.floor(MAP_H / 2);
    for (let i = cy - 5; i <= cy + 5; i++)
        for (let j = cx - 5; j <= cx + 5; j++)
            if (i >= 0 && i < MAP_H && j >= 0 && j < MAP_W) mapTiles[i][j] = TILE_FLOOR;

    applyCornerTiles();

    buildNavGrid();
}

function isSolidTileType(tileType) {
    return tileType !== TILE_FLOOR;
}

function isSolidTileAt(tx, ty) {
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
    return isSolidTileType(mapTiles[ty]?.[tx] ?? TILE_FLOOR);
}

function applyCornerTiles() {
    const next = mapTiles.map(row => row.slice());

    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (mapTiles[y][x] !== TILE_WALL) continue;

            const n = mapTiles[y - 1][x] === TILE_WALL;
            const s = mapTiles[y + 1][x] === TILE_WALL;
            const w = mapTiles[y][x - 1] === TILE_WALL;
            const e = mapTiles[y][x + 1] === TILE_WALL;

            if (n && w && !s && !e) next[y][x] = TILE_CORNER_NW;
            else if (n && e && !s && !w) next[y][x] = TILE_CORNER_NE;
            else if (s && w && !n && !e) next[y][x] = TILE_CORNER_SW;
            else if (s && e && !n && !w) next[y][x] = TILE_CORNER_SE;
        }
    }

    mapTiles = next;
}

function buildNavGrid() {
    navGrid = new Uint8Array(MAP_W * MAP_H);
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const tileType = mapTiles[y][x];
            if (tileType === TILE_WALL) {
                navGrid[y * MAP_W + x] = 1;
                continue;
            }

            // Corner rail tiles are partially open, so keep them navigable.
            navGrid[y * MAP_W + x] = 0;
        }
    }
}

function getNavWaypointForTile(tx, ty) {
    const tileType = mapTiles[ty]?.[tx] ?? TILE_FLOOR;
    let fx = 0.5, fy = 0.5;

    // Bias waypoints away from solid triangle halves inside corner tiles.
    if (tileType === TILE_CORNER_NW) { fx = 0.74; fy = 0.74; }
    else if (tileType === TILE_CORNER_NE) { fx = 0.26; fy = 0.74; }
    else if (tileType === TILE_CORNER_SW) { fx = 0.74; fy = 0.26; }
    else if (tileType === TILE_CORNER_SE) { fx = 0.26; fy = 0.26; }

    return { x: tx * TILE + TILE * fx, y: ty * TILE + TILE * fy };
}

function findPath(fromX, fromY, toX, toY) {
    const sx = Math.floor(fromX / TILE), sy = Math.floor(fromY / TILE);
    const gx = Math.floor(toX  / TILE), gy = Math.floor(toY  / TILE);
    if (sx === gx && sy === gy) return [];

    const prev     = new Int32Array(MAP_W * MAP_H).fill(-2);
    const startIdx = sy * MAP_W + sx;
    const goalIdx  = gy * MAP_W + gx;
    prev[startIdx] = -1;

    const queue = [startIdx];
    let qi = 0, found = false;

    while (qi < queue.length) {
        const cur = queue[qi++];
        const cy2 = Math.floor(cur / MAP_W), cx2 = cur % MAP_W;

        for (const ni of [
            cx2 > 0        ? cur - 1      : -1,
            cx2 < MAP_W-1  ? cur + 1      : -1,
            cy2 > 0        ? cur - MAP_W  : -1,
            cy2 < MAP_H-1  ? cur + MAP_W  : -1,
        ]) {
            if (ni === -1 || navGrid[ni] !== 0 || prev[ni] !== -2) continue;
            prev[ni] = cur;
            if (ni === goalIdx) { found = true; break; }
            queue.push(ni);
        }
        if (found) break;
    }

    if (!found) return [];

    const path = [];
    let idx = goalIdx;
    while (prev[idx] !== -1) {
        const tx = idx % MAP_W;
        const ty = Math.floor(idx / MAP_W);
        path.unshift(getNavWaypointForTile(tx, ty));
        idx = prev[idx];
    }
    return path;
}

function wallCollision(x, y, size) {
    const l = Math.floor((x - size) / TILE), t = Math.floor((y - size) / TILE);
    const r = Math.floor((x + size) / TILE), b = Math.floor((y + size) / TILE);

    const samples = [
        [0, 0],
        [ size, 0], [-size, 0], [0,  size], [0, -size],
        [ size * 0.75,  size * 0.75],
        [ size * 0.75, -size * 0.75],
        [-size * 0.75,  size * 0.75],
        [-size * 0.75, -size * 0.75],
    ];

    for (let ty = t; ty <= b; ty++) {
        for (let tx = l; tx <= r; tx++) {
            if (ty < 0 || ty >= MAP_H || tx < 0 || tx >= MAP_W) continue;
            const tileType = mapTiles[ty]?.[tx] ?? TILE_FLOOR;
            if (!isSolidTileType(tileType)) continue;

            const tileX = tx * TILE;
            const tileY = ty * TILE;
            for (const [ox, oy] of samples) {
                if (pointInsideSolidTile(x + ox, y + oy, tileX, tileY, tileType)) return true;
            }
        }
    }

    return false;
}

function findNearestFreePosition(x, y, size, maxTileRadius = 24) {
    if (!wallCollision(x, y, size)) return { x, y };

    const startTx = Math.floor(x / TILE);
    const startTy = Math.floor(y / TILE);

    for (let radius = 1; radius <= maxTileRadius; radius++) {
        let best = null;
        let bestDistSq = Infinity;

        for (let ty = startTy - radius; ty <= startTy + radius; ty++) {
            for (let tx = startTx - radius; tx <= startTx + radius; tx++) {
                if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) continue;
                if (Math.max(Math.abs(tx - startTx), Math.abs(ty - startTy)) !== radius) continue;

                const wp = getNavWaypointForTile(tx, ty);
                const candidates = [
                    wp,
                    { x: tx * TILE + TILE * 0.5, y: ty * TILE + TILE * 0.5 },
                    { x: tx * TILE + TILE * 0.35, y: ty * TILE + TILE * 0.35 },
                    { x: tx * TILE + TILE * 0.65, y: ty * TILE + TILE * 0.35 },
                    { x: tx * TILE + TILE * 0.35, y: ty * TILE + TILE * 0.65 },
                    { x: tx * TILE + TILE * 0.65, y: ty * TILE + TILE * 0.65 },
                ];

                for (const c of candidates) {
                    if (wallCollision(c.x, c.y, size)) continue;
                    const dx = c.x - x;
                    const dy = c.y - y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < bestDistSq) {
                        bestDistSq = distSq;
                        best = c;
                    }
                }
            }
        }

        if (best) return best;
    }

    return null;
}

function rescuePlayerFromWall() {
    const safePos = findNearestFreePosition(player.x, player.y, player.size);
    if (!safePos) return;

    player.x = safePos.x;
    player.y = safePos.y;
    player.prevX = safePos.x;
    player.prevY = safePos.y;
    player.hp = Math.max(0, player.hp - DASH_WALL_STUCK_DAMAGE);
}

function pointInsideSolidTile(px, py, tileX, tileY, tileType) {
    const lx = px - tileX;
    const ly = py - tileY;
    if (lx < 0 || lx > TILE || ly < 0 || ly > TILE) return false;

    if (tileType === TILE_WALL) return true;
    if (tileType === TILE_CORNER_NW) return lx + ly <= TILE - CORNER_RAIL_INSET;
    if (tileType === TILE_CORNER_NE) return lx >= ly + CORNER_RAIL_INSET;
    if (tileType === TILE_CORNER_SW) return lx + CORNER_RAIL_INSET <= ly;
    if (tileType === TILE_CORNER_SE) return lx + ly >= TILE + CORNER_RAIL_INSET;

    return false;
}

function getTopPolygon(tileType) {
    if (tileType === TILE_CORNER_NW) return [{ x: 0, y: 0 }, { x: TILE, y: 0 }, { x: 0, y: TILE }];
    if (tileType === TILE_CORNER_NE) return [{ x: 0, y: 0 }, { x: TILE, y: 0 }, { x: TILE, y: TILE }];
    if (tileType === TILE_CORNER_SW) return [{ x: 0, y: 0 }, { x: 0, y: TILE }, { x: TILE, y: TILE }];
    if (tileType === TILE_CORNER_SE) return [{ x: TILE, y: 0 }, { x: TILE, y: TILE }, { x: 0, y: TILE }];
    return [{ x: 0, y: 0 }, { x: TILE, y: 0 }, { x: TILE, y: TILE }, { x: 0, y: TILE }];
}

function drawWallFace(sx, sy, ax, ay, bx, by, depth, sprite, shade) {
    // Quad vertices: top-edge (ax,ay)->(bx,by), extruded straight down by depth.
    const x0 = sx + ax, y0 = sy + ay;
    const x1 = sx + bx, y1 = sy + by;
    const x2 = sx + bx, y2 = sy + by + depth;
    const x3 = sx + ax, y3 = sy + ay + depth;

    // Texture pass
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.clip();
    drawMapSprite(sprite, sx, sy, TILE, TILE + depth);
    ctx.restore();

    // Shade overlay
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.restore();
}

function drawWallFaceCorner(sx, sy, ax, ay, bx, by, depth, sprite, shade) {
    // Same as drawWallFace, but kept separate so corner tuning can be isolated.
    const x0 = sx + ax, y0 = sy + ay;
    const x1 = sx + bx, y1 = sy + by;
    const x2 = sx + bx, y2 = sy + by + depth;
    const x3 = sx + ax, y3 = sy + ay + depth;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.clip();
    drawMapSprite(sprite, sx, sy, TILE, TILE + depth);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.restore();
}

function drawWallTileWithFaces(tileX, tileY, tileType) {
    const s  = toScreen(tileX * TILE, tileY * TILE);
    const FH = WALL_FACE_HEIGHT;
    const T  = TILE;
    const I  = CORNER_RAIL_INSET;

    // Faces (drawn first, underneath top surface)
    const southOpen = !isSolidTileAt(tileX, tileY + 1);

    switch (tileType) {
        case TILE_WALL:
            // Single south face along the bottom edge.
            if (southOpen)
                drawWallFace(s.x, s.y, 0, T, T, T, FH, currentMapTheme.wallFace, 'rgba(0,0,0,0.32)');
            break;

        case TILE_CORNER_NW:
            // Full diagonal face (restored): (T, 0) -> (0, T).
            drawWallFaceCorner(s.x, s.y, T, 0, 0, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;

        case TILE_CORNER_NE:
            // Full diagonal face (restored): (0, 0) -> (T, T).
            drawWallFaceCorner(s.x, s.y, 0, 0, T, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;

        case TILE_CORNER_SW:
            // Full south strip (restored): (0, T) -> (T, T).
            if (southOpen)
                drawWallFaceCorner(s.x, s.y, 0, T, T, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;

        case TILE_CORNER_SE:
            // Full south strip (restored): (0, T) -> (T, T).
            if (southOpen)
                drawWallFaceCorner(s.x, s.y, 0, T, T, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;
    }

    // Top surface (drawn on top)
    const top = getTopPolygon(tileType);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.x + top[0].x, s.y + top[0].y);
    for (let i = 1; i < top.length; i++) ctx.lineTo(s.x + top[i].x, s.y + top[i].y);
    ctx.closePath();
    ctx.clip();
    drawMapSprite(currentMapTheme.wall, s.x, s.y, T, T);
    ctx.restore();
}

function drawMapSprite(sprite, x, y, w, h) {
    ctx.drawImage(sprite, x, y, w, h);
    const tint = MAP_THEME_TINT[currentMapThemeId];
    if (!tint) return;
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
}

function drawMap() {
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const s = toScreen(x * TILE, y * TILE);
            if (s.x < -TILE || s.x > canvas.width || s.y < -TILE || s.y > canvas.height) continue;
            drawMapSprite(currentMapTheme.floor, s.x, s.y, TILE, TILE);
        }
    }

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const s = toScreen(x * TILE, y * TILE);
            if (s.x < -TILE || s.x > canvas.width || s.y < -(TILE + WALL_FACE_HEIGHT) || s.y > canvas.height) continue;
            const tileType = mapTiles[y][x];
            if (!isSolidTileType(tileType)) continue;
            drawWallTileWithFaces(x, y, tileType);
        }
    }
}


// =============================================================================
//  PLAYER
// =============================================================================

function startGame() {
    showPerfGuide = false;
    currentArenaLevel = 1;
    currentWave = 1;
    enemiesRemainingInWave = 0;
    enemiesToSpawn = 0;
    waveClearTimer = 0;
    setMapThemeForCurrentLevel();
    generateMap();
    pickups       = [];
    enemies       = [];
    muzzleFlashes = [];
    dashTrail     = [];
    trailTimer = 0;

    player.x     = (MAP_W * TILE) / 2;
    player.y     = (MAP_H * TILE) / 2;
    player.prevX = player.x;
    player.prevY = player.y;
    const chosen = getSelectedCharacter();
    player.speed = chosen.speed;
    player.maxHp = chosen.maxHp;
    player.xpGainMult = chosen.xpGainMult ?? 1;
    player.lifestealOnKill = chosen.lifestealOnKill ?? 0;
    player.dashMaxCharges = Math.max(1, chosen.dashCharges ?? 1);
    player.dashCharges = player.dashMaxCharges;
    player.dashDistanceMult = chosen.dashDistanceMult ?? 1;
    player.dashPhasesWalls = chosen.dashPhasesWalls ?? false;
    player.dashRechargeFrames = Math.max(1, chosen.dashRechargeFrames ?? 120);
    player.dashCooldown = 0;
    player.hp    = player.maxHp;
    player.xp    = 0;
    player.level = 1;
    gameState    = 'playing';
    lastTimestamp = 0;
    accumulator   = 0;
    startWave(1);
}

function setMapThemeForCurrentLevel() {
    currentMapThemeId = Math.max(1, Math.min(MAX_ARENA_LEVELS, currentArenaLevel));
    currentMapTheme = MAP_THEME_SPRITES[currentMapThemeId] ?? MAP_THEME_SPRITES[1];
}

function getWaveEnemyTotal(waveNumber) {
    if (devTestMode) return 1;
    return WAVE_BASE_ENEMIES + (waveNumber - 1) * WAVE_STEP_ENEMIES;
}

function startWave(waveNumber) {
    currentWave = waveNumber;
    enemiesRemainingInWave = getWaveEnemyTotal(currentWave);
    enemiesToSpawn = enemiesRemainingInWave;
    waveClearTimer = 0;
    waveSpawnDelayFrames = WAVE_START_SPAWN_DELAY_FRAMES;
    enemySpawnBudget = 0;
}

function getAliveEnemyCount() {
    let alive = 0;
    for (const e of enemies) if (e.alive) alive++;
    return alive;
}

function updateWaveSpawner() {
    if (waveSpawnDelayFrames > 0) {
        waveSpawnDelayFrames--;
        return;
    }

    const spawnsPerSecond = WAVE_BASE_SPAWNS_PER_SECOND + (currentWave - 1) * WAVE_SPAWN_RATE_STEP;
    enemySpawnBudget += spawnsPerSecond * (FIXED_STEP / 1000);
    let alive = getAliveEnemyCount();
    while (enemySpawnBudget >= 1 && enemiesToSpawn > 0 && alive < MAX_ACTIVE_ENEMIES) {
        spawnEnemy(pickRandomEnemyType());
        enemiesToSpawn--;
        enemySpawnBudget--;
        alive++;
    }
}

function updateWaveProgression() {
    const alive = getAliveEnemyCount();
    if (enemiesRemainingInWave > 0 || enemiesToSpawn > 0 || alive > 0) {
        waveClearTimer = 0;
        return;
    }

    waveClearTimer++;
    if (waveClearTimer < WAVE_CLEAR_DELAY_FRAMES) return;
    waveClearTimer = 0;

    if (currentWave < WAVES_PER_LEVEL) {
        startWave(currentWave + 1);
        return;
    }

    if (currentArenaLevel >= MAX_ARENA_LEVELS) {
        gameState = 'win';
        return;
    }

    currentArenaLevel++;
    setMapThemeForCurrentLevel();
    generateMap();

    enemies = [];
    pickups = [];
    projectiles = [];
    muzzleFlashes = [];
    dashTrail = [];
    trailTimer = 0;

    player.x = (MAP_W * TILE) / 2;
    player.y = (MAP_H * TILE) / 2;
    player.prevX = player.x;
    player.prevY = player.y;

    startWave(1);
}

function cleanupDeadEnemies() {
    enemies = enemies.filter(e => e.alive);
}

function playerDash() {
    if (player.dashing || player.dashCharges <= 0) return;

    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup'])    dirY = -1;
    if (keys['s'] || keys['arrowdown'])  dirY =  1;
    if (keys['a'] || keys['arrowleft'])  dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX =  1;
    if (dirX === 0 && dirY === 0) dirX = player.facing;

    const n = Math.hypot(dirX, dirY);
    player.dashDirX    = dirX / n;
    player.dashDirY    = dirY / n;
    player.dashing     = true;
    player.dashTime    = DASH_DURATION;
    player.dashCharges--;
    if (player.dashCharges < player.dashMaxCharges && player.dashCooldown <= 0) {
        player.dashCooldown = player.dashRechargeFrames;
    }

    // Seed the trail fresh on each new dash
    dashTrail  = [];
    trailTimer = 0;
}

function playerShoot() {
    if (!mouseDown || player.shootCooldown > 0) return;
    player.shootCooldown = SHOOT_COOLDOWN;

    // Bloom: small random angle offset per shot
    const spread = (Math.random() - 0.5) * BULLET_SPREAD;
    const angle  = player.weaponAngle + spread;

    const gunX = player.x + Math.cos(player.weaponAngle) * RAIL_RADIUS;
    const gunY = player.y + Math.sin(player.weaponAngle) * RAIL_RADIUS;

    // Bullet spawns slightly forward from gun center so it clears the barrel
    const barrelTip = 22;
    const bx = gunX + Math.cos(angle) * barrelTip;
    const by = gunY + Math.sin(angle) * barrelTip;

    projectiles.push({
        x: bx, y: by, prevX: bx, prevY: by,
        velocityX: Math.cos(angle) * 12,
        velocityY: Math.sin(angle) * 12,
        size: 5, framesLeft: 80,
    });

    // Spawn muzzle flash at the barrel tip (world coords)
    const sparks = [];
    for (let i = 0; i < MUZZLE_SPARKS; i++) {
        const sa = angle + (Math.random() - 0.5) * 1.4;  // wide cone
        sparks.push({
            vx:   Math.cos(sa) * (2.5 + Math.random() * 4),
            vy:   Math.sin(sa) * (2.5 + Math.random() * 4),
            len:  3 + Math.random() * 5,
        });
    }
    muzzleFlashes.push({ x: bx, y: by, angle, age: 0, sparks });
}

function updatePlayer() {
    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup'])    dirY = -1;
    if (keys['s'] || keys['arrowdown'])  dirY =  1;
    if (keys['a'] || keys['arrowleft'])  dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX =  1;

    if (player.dashing) {
        player.dashTime--;
        if (player.dashTime <= 0) {
            player.dashing = false;
        } else {
            const dashSpeed = DASH_SPEED * player.dashDistanceMult;
            const nx = player.x + player.dashDirX * dashSpeed;
            const ny = player.y + player.dashDirY * dashSpeed;
            if (player.dashPhasesWalls) {
                player.x = nx;
                player.y = ny;
            } else {
                if (!wallCollision(nx,      player.y, player.size)) player.x = nx;
                if (!wallCollision(player.x, ny,      player.size)) player.y = ny;
            }

            // Record a trail ghost every TRAIL_INTERVAL frames
            if (trailTimer <= 0) {
                dashTrail.push({
                    x:     player.x,
                    y:     player.y,
                    flipX: player.facing === -1,
                    age:   0,
                });
                if (dashTrail.length > TRAIL_LENGTH) dashTrail.shift();
                trailTimer = TRAIL_INTERVAL;
            }
            trailTimer--;
        }
    } else {
        const n  = Math.hypot(dirX, dirY) || 1;
        const mx = (dirX / n) * player.speed;
        const my = (dirY / n) * player.speed;
        const canMoveX = !wallCollision(player.x + mx, player.y,      player.size);
        const canMoveY = !wallCollision(player.x,      player.y + my, player.size);
        if (canMoveX) player.x += mx;
        if (canMoveY) player.y += my;

        // If fully blocked while moving diagonally, slide along obstacle tangent.
        if (!canMoveX && !canMoveY && (dirX !== 0 || dirY !== 0)) {
            const angle = Math.atan2(dirY, dirX);
            const slide = player.speed * 0.95;
            const px = -Math.sin(angle);
            const py =  Math.cos(angle);

            const c1x = player.x + px * slide;
            const c1y = player.y + py * slide;
            const c2x = player.x - px * slide;
            const c2y = player.y - py * slide;

            const c1ok = !wallCollision(c1x, c1y, player.size);
            const c2ok = !wallCollision(c2x, c2y, player.size);

            if (c1ok || c2ok) {
                if (!c2ok) {
                    player.x = c1x; player.y = c1y;
                } else if (!c1ok) {
                    player.x = c2x; player.y = c2y;
                } else {
                    // Prefer whichever side continues the intended move direction best.
                    const d1 = (c1x - player.x) * mx + (c1y - player.y) * my;
                    const d2 = (c2x - player.x) * mx + (c2y - player.y) * my;
                    if (d1 >= d2) {
                        player.x = c1x; player.y = c1y;
                    } else {
                        player.x = c2x; player.y = c2y;
                    }
                }
            }
        }
    }

    player.x = Math.max(TILE * 2, Math.min(MAP_W * TILE - TILE * 2, player.x));
    player.y = Math.max(TILE * 2, Math.min(MAP_H * TILE - TILE * 2, player.y));

    if (player.dashPhasesWalls && !player.dashing && wallCollision(player.x, player.y, player.size)) {
        rescuePlayerFromWall();
    }

    if (player.dashCharges < player.dashMaxCharges) {
        if (player.dashCooldown > 0) player.dashCooldown--;
        if (player.dashCooldown <= 0) {
            player.dashCharges++;
            player.dashCooldown = player.dashCharges < player.dashMaxCharges ? player.dashRechargeFrames : 0;
        }
    }
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.invulnTimer   > 0) player.invulnTimer--;

    // Age-out trail ghosts when not dashing
    if (!player.dashing) {
        for (const g of dashTrail) g.age++;
        dashTrail = dashTrail.filter(g => g.age < TRAIL_LIFETIME);
    }

    for (const e of enemies) {
        if (!e.alive) continue;
        if (player.invulnTimer <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
            player.hp = Math.max(0, player.hp - 10);
            player.invulnTimer = 60;
        }
    }

    if (player.hp <= 0) { lastLevelDied = player.level; gameState = 'gameOver'; }

    player.weaponAngle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
    playerShoot();
    updatePlayerAnim();
}

function updatePlayerAnim() {
    const moving = keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
                   keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];

    player.facing = Math.cos(player.weaponAngle) >= 0 ? 1 : -1;

    if (player.dashing) {
        playerAnim.frame    = 'walk1';
        playerAnim.dashFlipX = player.dashDirX < 0;
    } else if (moving) {
        playerAnim.timer--;
        if (playerAnim.timer <= 0) {
            playerAnim.walkToggle = !playerAnim.walkToggle;
            playerAnim.timer = 10;
        }
        playerAnim.frame = playerAnim.walkToggle ? 'walk1' : 'walk2';
    } else {
        playerAnim.frame = 'idle';
    }
}


// =============================================================================
//  SANDEVISTAN DASH TRAIL
//  Each ghost is a solid-colour silhouette of the idle sprite — no texture,
//  just the shape filled with a vivid neon hue + matching outer glow.
// =============================================================================

/**
 * Render `sprite` as a flat colour silhouette into `_tintCanvas`.
 * Alpha channel is preserved; every opaque pixel becomes `color`.
 */
function buildSilhouette(sprite, dw, dh, flipX, color) {
    // Grow the tint canvas if needed
    if (_tintCanvas.width < dw || _tintCanvas.height < dh) {
        _tintCanvas.width  = Math.max(_tintCanvas.width,  dw);
        _tintCanvas.height = Math.max(_tintCanvas.height, dh);
    }

    _tintCtx.clearRect(0, 0, dw, dh);

    // Step 1: draw the sprite (gives us its alpha mask)
    _tintCtx.save();
    if (flipX) {
        _tintCtx.translate(dw, 0);
        _tintCtx.scale(-1, 1);
    }
    _tintCtx.drawImage(sprite, 0, 0, dw, dh);
    _tintCtx.restore();

    // Step 2: flood-fill the colour over every pixel that has alpha > 0
    _tintCtx.globalCompositeOperation = 'source-in';
    _tintCtx.fillStyle = color;
    _tintCtx.fillRect(0, 0, dw, dh);
    _tintCtx.globalCompositeOperation = 'source-over';
}

function drawDashTrail() {
    if (dashTrail.length === 0) return;

    const total   = dashTrail.length;
    // Use the same display size as the idle sprite in drawPlayer (size * 2)
    const size    = player.size * 2;
    const ghostSprite = getPlayerSprite('idle');
    if (!ghostSprite.complete || !ghostSprite.naturalWidth) return;

    for (let i = 0; i < total; i++) {
        const g    = dashTrail[i];
        const life = 1 - g.age / TRAIL_LIFETIME;
        if (life <= 0) continue;

        // t: 0 = oldest ghost, 1 = newest ghost (closest to current player pos)
        const t = i / Math.max(total - 1, 1);

        // Pick colour — spread evenly across the SANDEV_COLORS palette
        const ci  = Math.min(Math.floor(t * SANDEV_COLORS.length), SANDEV_COLORS.length - 1);
        const col = SANDEV_COLORS[ci];
        const colorStr = `rgb(${col.r},${col.g},${col.b})`;

        // Silhouette alpha: newer = more opaque; fades as ghost ages post-dash
        const baseAlpha = 0.35 + t * 0.55;   // 0.35 (oldest) → 0.90 (newest)
        const alpha     = baseAlpha * life;

        const sc = toScreen(g.x, g.y);

        // ── 1. OUTER GLOW ─────────────────────────────────────────────────────
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

        // ── 2. COLOURED SILHOUETTE ────────────────────────────────────────────
        const dw = size, dh = size;
        buildSilhouette(ghostSprite, dw, dh, g.flipX, colorStr);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(_tintCanvas, 0, 0, dw, dh, sc.x - dw / 2, sc.y - dh / 2, dw, dh);
        ctx.restore();

        // ── 3. THIN BRIGHT RIM ────────────────────────────────────────────────
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


// =============================================================================
//  MUZZLE FLASH
// =============================================================================

function drawMuzzleFlashes() {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        const f    = muzzleFlashes[i];
        f.age++;
        if (f.age >= MUZZLE_LIFE) { muzzleFlashes.splice(i, 1); continue; }

        const life = 1 - f.age / MUZZLE_LIFE;
        const sc   = toScreen(f.x, f.y);

        ctx.save();

        // ── Core flash blob ────────────────────────────────────────────────────
        const flashR = 10 * life;
        const flashG = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, flashR);
        flashG.addColorStop(0,   `rgba(255,240,180,${life})`);
        flashG.addColorStop(0.4, `rgba(255,140,30,${life * 0.85})`);
        flashG.addColorStop(1,   `rgba(255,80,0,0)`);
        ctx.fillStyle = flashG;
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, flashR, 0, Math.PI * 2);
        ctx.fill();

        // ── Forward cone flare ─────────────────────────────────────────────────
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

        // ── Sparks ─────────────────────────────────────────────────────────────
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

            // Bright tip dot
            ctx.fillStyle = `rgba(255,240,180,${sparkAlpha})`;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.5 * life, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}


// =============================================================================
//  DRAW PLAYER
// =============================================================================

function drawPlayer() {
    // ── Draw trail FIRST (behind player) ──
    drawDashTrail();

    const rx = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const ry = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const s  = toScreen(rx, ry);
    const size = player.size * 2;

    const flickering = player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0;
    const bodySprite = getPlayerSprite(playerAnim.frame);
    const flipX      = player.dashing ? playerAnim.dashFlipX : player.facing === -1;

    ctx.save();
    if (flickering) ctx.globalAlpha = 0.35;
    if (flipX) {
        ctx.translate(s.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(bodySprite, -size / 2, s.y - size / 2, size, size);
    } else {
        ctx.drawImage(bodySprite, s.x - size / 2, s.y - size / 2, size, size);
    }
    ctx.restore();

    // Rail ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, RAIL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,180,180,0.18)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();
    ctx.restore();

    // Gun
    const angle      = player.weaponAngle;
    const gunScreenX = s.x + Math.cos(angle) * RAIL_RADIUS;
    const gunScreenY = s.y + Math.sin(angle) * RAIL_RADIUS;
    const isFiring   = mouseDown && player.shootCooldown > 2;
    const gunSprite  = isFiring ? gunSprites.shoot : gunSprites.idle;

    ctx.save();
    if (flickering) ctx.globalAlpha = 0.35;
    ctx.translate(gunScreenX, gunScreenY);
    ctx.rotate(angle);
    if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);
    ctx.drawImage(gunSprite, -GUN_W / 2, -GUN_H / 2, GUN_W, GUN_H);
    ctx.restore();

    drawMuzzleFlashes();
}


// =============================================================================
//  ENEMIES
// =============================================================================

function spawnEnemy(type) {
    const enemy = { alive: true };
    recycleEnemy(enemy, type);
    enemies.push(enemy);
}

function pickRandomEnemyType() {
    const types = ['basic', 'fast', 'tank'];
    return types[Math.floor(Math.random() * types.length)];
}

function getEnemySpawnPosition(wallSize) {
    const minRadius = Math.min(canvas.width, canvas.height) * 0.5 + SPAWN_RING_INSET;
    const maxRadius = Math.max(canvas.width, canvas.height) * 0.7 + SPAWN_RING_INSET;

    for (let tries = 0; tries < 90; tries++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const ex = player.x + Math.cos(angle) * radius;
        const ey = player.y + Math.sin(angle) * radius;

        if (ex < TILE * 2 || ex > MAP_W * TILE - TILE * 2 || ey < TILE * 2 || ey > MAP_H * TILE - TILE * 2) continue;
        if (wallCollision(ex, ey, wallSize)) continue;
        if (Math.hypot(ex - player.x, ey - player.y) < Math.min(canvas.width, canvas.height) * 0.42) continue;

        return { x: ex, y: ey };
    }

    const fallback = findNearestFreePosition(player.x + TILE * 6, player.y, wallSize, 30);
    if (fallback) return fallback;

    return { x: player.x + TILE * 4, y: player.y + TILE * 4 };
}

function recycleEnemy(e, type = pickRandomEnemyType()) {
    const spec = ENEMY_TYPES[type];
    const variant = getEnemyVariantForLevel(currentArenaLevel);
    const variantStats = ENEMY_VARIANT_STATS[variant]?.[type] || spec;
    const hp = variantStats.hp ?? spec.hp;
    const speed = variantStats.speed ?? spec.speed;
    const wallSize = type === 'tank' ? spec.size * 0.8 : spec.size;
    const spawnPos = getEnemySpawnPosition(wallSize);

    e.x = spawnPos.x;
    e.y = spawnPos.y;
    e.prevX = spawnPos.x;
    e.prevY = spawnPos.y;
    e.hp = hp;
    e.maxHp = hp;
    e.size = spec.size;
    e.wallSize = wallSize;
    e.speed = speed;
    e.color = spec.color;
    e.hitFlash = 0;
    e.hpBarTimer = 0;
    e.alive = true;
    e.type = type;
    e.animFrame = 0;
    e.animTimer = Math.floor(Math.random() * spec.animSpeed);
    e.path = [];
    e.pathTimer = Math.floor(Math.random() * 30);
    e.offscreenFrames = 0;
}

function getEnemyRecycleDistance() {
    return Math.hypot(canvas.width, canvas.height) * 1.1;
}

function isEnemyOffscreenFromPlayer(e) {
    const dx = Math.abs(e.x - player.x);
    const dy = Math.abs(e.y - player.y);
    const maxDx = canvas.width / 2 + ENEMY_OFFSCREEN_MARGIN;
    const maxDy = canvas.height / 2 + ENEMY_OFFSCREEN_MARGIN;
    return dx > maxDx || dy > maxDy;
}

function hasLineOfSight(x1, y1, x2, y2, size) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist === 0) return true;
    const steps = Math.ceil(dist / (TILE * 0.4));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        if (wallCollision(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, size)) return false;
    }
    return true;
}

function moveEnemyToward(e, tx, ty, step) {
    const baseAngle = Math.atan2(ty - e.y, tx - e.x);
    // ── CORNER RAIL STEERING ─────────────────────────────────────────────────
    // Expanded steering offsets to navigate around corners smoothly
    const steerOffsets = [
        0,                              // straight
        0.2, -0.2, 0.4, -0.4,          // fine-grained diagonals
        0.6, -0.6, 0.8, -0.8,          // medium angles
        1.0, -1.0, 1.2, -1.2,          // wide angles
        1.4, -1.4, 1.57, -1.57         // extreme/perpendicular (helps round corners)
    ];
    let bestMove = null;

    for (const offset of steerOffsets) {
        const angle = baseAngle + offset;
        const mx = Math.cos(angle) * step;
        const my = Math.sin(angle) * step;

        // ── RAIL LOGIC: Try diagonal movement first, then fallback to axis-aligned ─
        const canMoveDiagonally = !wallCollision(e.x + mx, e.y + my, e.wallSize);
        const canMoveX = !wallCollision(e.x + mx, e.y, e.wallSize);
        const canMoveY = !wallCollision(e.x, e.y + my, e.wallSize);
        
        if (!canMoveDiagonally && !canMoveX && !canMoveY) continue;

        // Prefer diagonal movement, fall back to single axes for corner rounding
        let nx, ny, moveQuality;
        if (canMoveDiagonally) {
            nx = e.x + mx;
            ny = e.y + my;
            moveQuality = 1.0;  // Full movement is best
        } else {
            nx = e.x + (canMoveX ? mx : 0);
            ny = e.y + (canMoveY ? my : 0);
            moveQuality = 0.7;  // Partial movement is valid but penalized
        }

        const dist = Math.hypot(tx - nx, ty - ny);
        const anglePenalty = Math.abs(offset) * 3;
        const score = dist + anglePenalty - moveQuality * 5;  // Bonus for full diagonal moves

        if (!bestMove || score < bestMove.score) {
            bestMove = { nx, ny, score };
        }
    }

    if (!bestMove) return false;

    e.x = bestMove.nx;
    e.y = bestMove.ny;
    return true;
}

function updateEnemies() {
    // Sandevistan: enemies slow during player dash
    const sanSlowMult = player.dashing ? 0.15 : 1.0;

    for (const e of enemies) {
        if (!e.alive) continue;

        if (isEnemyOffscreenFromPlayer(e)) {
            e.offscreenFrames = (e.offscreenFrames ?? 0) + 1;
        } else {
            e.offscreenFrames = 0;
        }

        if (e.offscreenFrames >= ENEMY_OFFSCREEN_DESPAWN_FRAMES) {
            recycleEnemy(e);
            continue;
        }

        if (Math.hypot(player.x - e.x, player.y - e.y) > getEnemyRecycleDistance() * 1.35) {
            recycleEnemy(e);
            continue;
        }

        if (e.pathTimer > 0) {
            e.pathTimer--;
        } else {
            e.path = findPath(e.x, e.y, player.x, player.y);
            e.pathTimer = 60;
        }

        let tx, ty;
        if (hasLineOfSight(e.x, e.y, player.x, player.y, e.wallSize)) {
            tx = player.x; ty = player.y; e.path = [];
        } else if (e.path.length > 0) {
            while (e.path.length > 1 && Math.hypot(e.path[0].x - e.x, e.path[0].y - e.y) < TILE * 0.55) {
                e.path.shift();
            }
            for (let wi = e.path.length - 1; wi > 0; wi--) {
                if (hasLineOfSight(e.x, e.y, e.path[wi].x, e.path[wi].y, e.wallSize)) {
                    e.path.splice(0, wi);
                    break;
                }
            }
            tx = e.path[0].x; ty = e.path[0].y;
        } else {
            tx = player.x; ty = player.y;
        }

        const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        const distMult = Math.min(4.0, 1.0 + Math.max(0, distToPlayer - 500) / 350);
        const speedMult = distMult * sanSlowMult;

        const moved = moveEnemyToward(e, tx, ty, e.speed * speedMult);
        if (!moved) {
            e.path = [];
            e.pathTimer = 0;
        }

        // Separation
        for (const o of enemies) {
            if (o === e || !o.alive) continue;
            const dx = e.x - o.x, dy = e.y - o.y;
            const dist = Math.hypot(dx, dy), md = e.size + o.size;
            if (dist < md && dist > 0) {
                const ov = (md - dist) * 0.5, nx = dx / dist, ny = dy / dist;
                if (!wallCollision(e.x + nx * ov, e.y,               e.wallSize)) e.x += nx * ov;
                if (!wallCollision(e.x,            e.y + ny * ov,     e.wallSize)) e.y += ny * ov;
                if (!wallCollision(o.x - nx * ov, o.y,               o.wallSize ?? o.size)) o.x -= nx * ov;
                if (!wallCollision(o.x,            o.y - ny * ov,     o.wallSize ?? o.size)) o.y -= ny * ov;
            }
        }

        if (e.hitFlash  > 0) e.hitFlash--;
        if (e.hpBarTimer > 0) e.hpBarTimer--;

        e.animTimer--;
        if (e.animTimer <= 0) {
            const frames = getEnemySpriteFrames(e.type);
            const frameCount = Math.max(1, frames.length);
            e.animFrame = (e.animFrame + 1) % frameCount;
            e.animTimer = ENEMY_TYPES[e.type].animSpeed;
        }
    }
}

function drawEnemies() {
    const innerR = 120, outerR = 420;

    for (const e of enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (fogEnabled && dist >= outerR) continue;

        const alpha = fogEnabled && dist > innerR ? 1 - (dist - innerR) / (outerR - innerR) : 1;
        const rx  = (e.prevX ?? e.x) + (e.x - (e.prevX ?? e.x)) * renderAlpha;
        const ry  = (e.prevY ?? e.y) + (e.y - (e.prevY ?? e.y)) * renderAlpha;
        const sc  = toScreen(rx, ry);
        const sz  = e.size * 2;
        const frames = getEnemySpriteFrames(e.type);
        const sprite = frames[e.animFrame % Math.max(1, frames.length)] ?? frames[0];

        ctx.save();
        ctx.globalAlpha = alpha;
        if (e.hitFlash > 0) ctx.filter = 'brightness(10)';

        if (player.x < e.x) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -(sc.x + e.size), sc.y - e.size, sz, sz);
        } else {
            ctx.drawImage(sprite, sc.x - e.size, sc.y - e.size, sz, sz);
        }
        ctx.restore();

        if (alpha > 0.15 && e.hpBarTimer > 0) {
            const bw = e.size * 2, bh = 4, hf = e.hp / e.maxHp;
            const bx = sc.x - bw / 2, by = sc.y - e.size - 12;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'black';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = hf > 0.5 ? 'green' : hf > 0.25 ? 'yellow' : 'red';
            ctx.fillRect(bx, by, bw * hf, bh);
            ctx.strokeStyle = 'white';
            ctx.lineWidth   = 1;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.restore();
        }
    }
}


// =============================================================================
//  PROJECTILES
// =============================================================================

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.framesLeft--;

        if (wallCollision(p.x, p.y, p.size) || p.framesLeft <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        for (const e of enemies) {
            if (!e.alive) continue;
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) {
                e.hp--;
                e.hitFlash   = 8;
                e.hpBarTimer = 120;

                if (e.hp <= 0) {
                    e.alive = false;
                    enemiesRemainingInWave = Math.max(0, enemiesRemainingInWave - 1);
                    if (player.lifestealOnKill > 0 && player.hp > 0) {
                        const heal = Math.max(1, Math.round(player.maxHp * player.lifestealOnKill));
                        player.hp = Math.min(player.maxHp, player.hp + heal);
                    }
                    const variant = e.type === 'tank' ? 'blue' : 'green';
                    pickups.push({
                        x: e.x, y: e.y, prevX: e.x, prevY: e.y,
                        vx: 0, vy: 0,
                        size: variant === 'blue' ? 15 : 10,
                        type: 'xp', variant,
                        value: XP_PICKUP_BASE_VALUE * (variant === 'blue' ? TANK_XP_MULTIPLIER : 1),
                    });
                }

                projectiles.splice(i, 1);
                break;
            }
        }
    }
}

function drawProjectiles() {
    for (const p of projectiles) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const sc  = toScreen(prx, pry);
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(Math.atan2(p.velocityY, p.velocityX));
        ctx.drawImage(projectileSprite, -p.size, -p.size, p.size * 2, p.size * 2);
        ctx.restore();
    }
}


// =============================================================================
//  PICKUPS
// =============================================================================

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (!p.vx)    p.vx    = 0;
        if (!p.vy)    p.vy    = 0;
        if (!p.trail) p.trail = [];
        if (!p.variant) p.variant = 'green';
        if (!p.value)   p.value   = XP_PICKUP_BASE_VALUE * (p.variant === 'blue' ? TANK_XP_MULTIPLIER : 1);

        const dist = Math.hypot(player.x - p.x, player.y - p.y);

        if (dist < XP_ATTRACT_RADIUS && dist > 0) {
            const pull = XP_ATTRACT_SPEED * (1 - dist / XP_ATTRACT_RADIUS) + 0.5;
            p.vx += (player.x - p.x) / dist * pull * 0.15;
            p.vy += (player.y - p.y) / dist * pull * 0.15;
            const sp = Math.hypot(p.vx, p.vy);
            if (sp > XP_ATTRACT_SPEED) { p.vx = (p.vx / sp) * XP_ATTRACT_SPEED; p.vy = (p.vy / sp) * XP_ATTRACT_SPEED; }
            if (p.type === 'xp' && frameCount % 2 === 0) p.trail.push({ x: p.x, y: p.y, age: 0 });
        } else {
            p.vx *= 0.85;
            p.vy *= 0.85;
        }

        for (let t = p.trail.length - 1; t >= 0; t--) {
            p.trail[t].age++;
            if (p.trail[t].age > 12) p.trail.splice(t, 1);
        }

        p.x += p.vx;
        p.y += p.vy;

        if (dist < player.size + p.size) {
            if (p.type === 'xp') {
                player.xp += p.value * player.xpGainMult;
                xpBarFlash  = 12;
                if (player.xp >= player.xpToNextLevel) {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                    gameState = 'levelUp';
                }
            }
            pickups.splice(i, 1);
        }
    }
}

function drawPickups() {
    for (const p of pickups) {
        const prx = (p.prevX ?? p.x) + (p.x - (p.prevX ?? p.x)) * renderAlpha;
        const pry = (p.prevY ?? p.y) + (p.y - (p.prevY ?? p.y)) * renderAlpha;
        const sc  = toScreen(prx, pry);
        const variant = XP_PICKUP_VARIANTS[p.variant] ?? XP_PICKUP_VARIANTS.green;

        // Trail dots
        if (p.type === 'xp' && p.trail?.length) {
            for (const t of p.trail) {
                const ts   = toScreen(t.x, t.y);
                const life = 1 - t.age / 12;
                const r    = p.size * 0.55 * life;
                ctx.save();
                ctx.globalAlpha  = life * 0.7;
                ctx.shadowColor  = variant.shadow;
                ctx.shadowBlur   = 6 * life;
                ctx.fillStyle    = `rgba(${variant.rgb},${life * 0.85})`;
                ctx.beginPath();
                ctx.arc(ts.x, ts.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        if (p.type === 'xp') {
            const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.04);
            ctx.save();

            // Halo glow
            const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, p.size * 3.5 * pulse);
            halo.addColorStop(0,   `rgba(${variant.rgb},0.35)`);
            halo.addColorStop(0.5, `rgba(${variant.rgb},0.12)`);
            halo.addColorStop(1,   `rgba(${variant.rgb},0)`);
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, p.size * 3.5 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = variant.shadow;
            ctx.shadowBlur  = 18 * pulse;

            const sprite = p.variant === 'blue' ? pickupXpBlueSprite : pickupXpSprite;
            if (sprite.complete && sprite.naturalWidth) {
                ctx.drawImage(sprite, sc.x - p.size, sc.y - p.size, p.size * 2, p.size * 2);
            } else {
                ctx.fillStyle = variant.shadow;
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else {
            ctx.drawImage(pickupXpSprite, sc.x - p.size, sc.y - p.size, p.size * 2, p.size * 2);
        }
    }
}


// =============================================================================
//  UI — VIALS
// =============================================================================

function vialInteriorPath(sc) {
    const ncx = VCX * sc, nW2 = (VNECK_W / 2) * sc;
    const nY1 = VNECK_Y1 * sc, nY2 = VNECK_Y2 * sc;
    const sY1 = VSHOULDER_Y1 * sc, sY2 = VSHOULDER_Y2 * sc;
    const bW2 = (VBODY_W / 2) * sc;
    const bX1 = (VCX - VBODY_W / 2) * sc, bX2 = (VCX + VBODY_W / 2) * sc;
    const bY1 = VBODY_Y1 * sc, bY2 = VBODY_Y2 * sc, br = VBRAD * sc;

    ctx.rect(ncx - nW2, nY1, nW2 * 2, nY2 - nY1);
    ctx.moveTo(ncx - nW2, sY1); ctx.lineTo(ncx + nW2, sY1); ctx.lineTo(bX2, sY2); ctx.lineTo(bX1, sY2); ctx.closePath();
    ctx.moveTo(bX1 + br, bY1); ctx.lineTo(bX2 - br, bY1); ctx.arcTo(bX2, bY1, bX2, bY1 + br, br);
    ctx.lineTo(bX2, bY2 - br); ctx.arcTo(bX2, bY2, bX2 - br, bY2, br);
    ctx.lineTo(bX1 + br, bY2); ctx.arcTo(bX1, bY2, bX1, bY2 - br, br);
    ctx.lineTo(bX1, bY1 + br); ctx.arcTo(bX1, bY1, bX1 + br, bY1, br); ctx.closePath();
}

function drawVial(screenX, screenY, fillPercent, colors, glowSprite, label, valueText = '') {
    const sc = VIAL_SCALE;
    const W  = VSRC_W * sc, H = VSRC_H * sc;
    const GW = (VSRC_W + 40) * sc, GH = (VSRC_H + 40) * sc;
    const gp = 0.75 + 0.25 * Math.sin(frameCount * 0.04);

    ctx.save();
    ctx.globalAlpha = gp * 0.85;
    ctx.drawImage(glowSprite, screenX - 20 * sc, screenY - 20 * sc, GW, GH);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.drawImage(vialBgSprite, 0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    vialInteriorPath(sc);
    ctx.clip();

    const lat = VSHOULDER_Y1 * sc, lab = VBODY_Y2 * sc;
    const lh  = (lab - lat) * Math.max(0, Math.min(1, fillPercent));
    const lty = lab - lh;
    const wA  = 3.5 * sc, wF = 0.10 / sc, wP = frameCount * 0.055;
    const w2F = wF * 1.6,  w2P = frameCount * 0.038;
    const bx1s = (VCX - VBODY_W / 2 - 2) * sc, bx2s = (VCX + VBODY_W / 2 + 2) * sc;

    const lg = ctx.createLinearGradient(0, lty, 0, lab);
    lg.addColorStop(0,   colors.top);
    lg.addColorStop(0.4, colors.mid);
    lg.addColorStop(1,   colors.bot);
    ctx.fillStyle = lg;

    ctx.beginPath();
    ctx.moveTo(bx1s, lty);
    for (let x = bx1s; x <= bx2s; x += 1) {
        ctx.lineTo(x, lty + Math.sin(x * wF + wP) * wA + Math.sin(x * w2F + w2P) * wA * 0.45);
    }
    ctx.lineTo(bx2s, lab + 4); ctx.lineTo(bx1s, lab + 4); ctx.closePath(); ctx.fill();

    const sg = ctx.createLinearGradient(0, lty, 0, lty + 18 * sc);
    sg.addColorStop(0, 'rgba(255,255,255,0.22)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(bx1s, lty);
    for (let x = bx1s; x <= bx2s; x += 1) {
        ctx.lineTo(x, lty + Math.sin(x * wF + wP) * wA + Math.sin(x * w2F + w2P) * wA * 0.45);
    }
    ctx.lineTo(bx2s, lty + 18 * sc); ctx.lineTo(bx1s, lty + 18 * sc); ctx.closePath(); ctx.fill();

    if (fillPercent > 0.08 && vialBubblesSprite.complete && vialBubblesSprite.naturalWidth) {
        const bf = Math.floor(frameCount / 7) % 4;
        ctx.globalAlpha = 0.45 * fillPercent;
        ctx.drawImage(vialBubblesSprite, bf * VSRC_W, 0, VSRC_W, VSRC_H, 0, 0, W, H);
        ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.drawImage(vialFrameSprite, 0, 0, W, H);

    if (colors.bot === '#660008' && fillPercent < 0.25) {
        const fl = 0.12 + 0.12 * Math.sin(frameCount * 0.35);
        ctx.save();
        ctx.beginPath();
        vialInteriorPath(sc);
        ctx.clip();
        ctx.fillStyle = `rgba(255,0,0,${fl})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    ctx.textAlign  = 'center';
    ctx.font       = `bold ${Math.round(13 * sc)}px Arial`;
    ctx.shadowColor = 'black';
    ctx.shadowBlur  = 5;
    ctx.fillStyle   = 'rgba(220,220,255,0.92)';
    ctx.fillText(label, W / 2, H + 18 * sc);

    if (valueText) {
        ctx.font       = `bold ${Math.round(12 * sc)}px Arial`;
        ctx.fillStyle  = 'rgba(245,245,255,0.95)';
        ctx.fillText(valueText, W / 2, H + 34 * sc);
    }

    ctx.shadowBlur  = 0;
    ctx.restore();
}

function drawVials() {
    const lp = 12, tp = 18, gap = 12;
    const hpY   = tp;
    const dashY = tp;
    const hpX   = lp;
    const dashX = lp + VIAL_W + gap;
    const hf    = player.hp / player.maxHp;

    const hc = hf > 0.5
        ? { top: '#ff8888', mid: '#dd2222', bot: '#660008' }
        : hf > 0.25
        ? { top: '#ffcc44', mid: '#dd7700', bot: '#883300' }
        : { top: '#ff6633', mid: '#cc2200', bot: '#660008' };

    const hpValue = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    drawVial(hpX, hpY, hf, hc, vialGlowHpSprite, '❤  HP', hpValue);

    const baseCharges = player.dashCharges;
    const hasPartial = player.dashCharges < player.dashMaxCharges;
    const partial = hasPartial ? Math.max(0, Math.min(1, 1 - player.dashCooldown / player.dashRechargeFrames)) : 0;
    const df = Math.max(0, Math.min(1, (baseCharges + partial) / player.dashMaxCharges));
    const dr = player.dashCharges > 0;
    const dc = dr
        ? { top: '#88ffff', mid: '#22aaff', bot: '#0030bb' }
        : { top: '#44aadd', mid: '#1060cc', bot: '#001888' };

    const dashValue = `${player.dashCharges}/${player.dashMaxCharges}`;
    drawVial(dashX, dashY, df, dc, vialGlowDashSprite, '⚡ DASH', dashValue);

    if (dr) {
        const ra = 0.55 + 0.45 * Math.abs(Math.sin(frameCount * 0.07));
        ctx.save();
        ctx.globalAlpha = ra;
        ctx.fillStyle   = '#00ffff';
        ctx.font        = `bold ${Math.round(11 * VIAL_SCALE)}px Arial`;
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 8;
        ctx.fillText('READY', dashX + VIAL_W / 2, dashY - 6);
        ctx.restore();
    }
}


// =============================================================================
//  UI — XP BAR
// =============================================================================

function drawXpBar() {
    if (xpBarFlash > 0) xpBarFlash--;

    const DW  = 560, DH = Math.round(DW * 28 / 620), RAD = Math.round(7 * DW / 620);
    const bx  = canvas.width / 2 - DW / 2;
    const by  = canvas.height - DH - 22;
    const xf  = Math.min(player.xp / player.xpToNextLevel, 1);
    const fw  = Math.floor(xf * DW);
    const t   = frameCount * 0.04;
    const flash   = xpBarFlash > 0;
    const pulse   = flash ? 1.0 : 0.6 + 0.4 * Math.sin(t * 1.3);
    const shimmer = Math.sin(t * 2.1) * 0.5 + 0.5;

    function clipRounded(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }

    ctx.drawImage(xpBarBgSprite, bx, by, DW, DH);

    if (fw > 1) {
        ctx.save();
        clipRounded(bx, by, fw, DH, RAD);
        ctx.clip();
        ctx.filter = `brightness(${flash ? 1 + xpBarFlash * 0.07 : 1})`;
        ctx.drawImage(xpBarFillSprite, bx, by, DW, DH);
        ctx.filter = 'none';

        const ig = ctx.createRadialGradient(bx + fw, by + DH / 2, 0, bx + fw, by + DH / 2, DH * (1.6 + pulse * 0.8));
        ig.addColorStop(0,   `rgba(180,255,80,${0.55 * pulse})`);
        ig.addColorStop(0.4, `rgba(100,255,30,${0.3  * pulse})`);
        ig.addColorStop(1,   'rgba(30,180,0,0)');
        ctx.fillStyle = ig;
        ctx.fillRect(bx, by, fw, DH);

        const sg = ctx.createLinearGradient(bx + shimmer * fw - DW * 0.06, 0, bx + shimmer * fw + DW * 0.06, 0);
        sg.addColorStop(0,   'rgba(255,255,200,0)');
        sg.addColorStop(0.5, `rgba(255,255,220,${0.22 * pulse})`);
        sg.addColorStop(1,   'rgba(255,255,200,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(bx, by, fw, DH);

        const tg = ctx.createLinearGradient(0, by, 0, by + DH * 0.45);
        tg.addColorStop(0, `rgba(220,255,140,${0.45 * pulse})`);
        tg.addColorStop(1, 'rgba(100,220,30,0)');
        ctx.fillStyle = tg;
        ctx.fillRect(bx, by, fw, DH);
        ctx.restore();
    }

    ctx.drawImage(xpBarFrameSprite, bx, by, DW, DH);

    ctx.save();
    ctx.textAlign  = 'center';
    ctx.font       = 'bold 15px Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur  = 7;
    ctx.fillStyle   = '#d8ff50';
    ctx.fillText(`Level  ${player.level}`, canvas.width / 2, by - 6);
    ctx.font       = 'bold 12px Arial';
    ctx.shadowBlur  = 5;
    ctx.fillStyle   = 'rgba(255,255,255,0.88)';
    const xt = Number.isInteger(player.xp) ? player.xp : player.xp.toFixed(1);
    ctx.fillText(`${xt} / ${player.xpToNextLevel} XP`, canvas.width / 2, by + DH / 2 + 4);
    ctx.restore();
}


// =============================================================================
//  UI — HUD OVERLAY
// =============================================================================

function drawUI() {
    if (showFpsCounter) {
        ctx.save();
        ctx.textAlign  = 'center';
        ctx.font       = 'bold 13px monospace';
        ctx.fillStyle  = '#ffffff';
        ctx.shadowColor = 'black';
        ctx.shadowBlur  = 4;
        ctx.fillText(fps + ' FPS', canvas.width / 2, 18);
        ctx.restore();
    }

    if (devTestMode) {
        ctx.save();
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#9df4ff';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText('DEV TEST MODE: 1 ENEMY PER WAVE', 20, 22);
        ctx.restore();
    }

    // Coords
    ctx.save();
    ctx.font      = '10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('X: ' + Math.floor(player.x) + '  Y: ' + Math.floor(player.y), 20, canvas.height - 20);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 6;
    const waveLabel = `Level ${currentArenaLevel}  Wave ${currentWave}/${WAVES_PER_LEVEL}`;
    const alive = getAliveEnemyCount();
    const remainingNow = Math.max(0, enemiesRemainingInWave - alive);
    ctx.fillText(waveLabel, canvas.width - 22, 26);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffd26a';
    ctx.fillText(`Enemies Remaining: ${enemiesRemainingInWave}`, canvas.width - 22, 48);
    ctx.fillStyle = 'rgba(220,220,220,0.9)';
    ctx.fillText(`To Spawn: ${remainingNow > 0 ? remainingNow : 0}`, canvas.width - 22, 68);
    ctx.restore();

    drawVials();
    drawXpBar();
}

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

        // Smooth projectile lighting in fog: bright core that fades out softly.
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


// =============================================================================
//  MENU & SCREENS
// =============================================================================

function getPerfButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 174, w: 160, h: 36 }; }
function getFpsToggleButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 222, w: 160, h: 36 }; }
function getDevTestButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 270, w: 160, h: 36 }; }
function getFogToggleButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 126, w: 160, h: 36 }; }
function getSelectCursorButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 78,  w: 160, h: 36 }; }
function getSelectCharacterButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 30, w: 160, h: 36 }; }
function getBackButton()         { return { x: canvas.width / 2 - 60, y: canvas.height / 2 + 150, w: 120, h: 36 }; }

function getCharacterPanel() {
    const w = Math.min(1100, canvas.width - 60);
    const h = Math.min(560, canvas.height - 90);
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2 + 14;
    return { x, y, w, h };
}

function getCursorBoxes() {
    const bs = 52, gap = 12;
    const tw = cursorSprites.length * (bs + gap) - gap;
    const sx = canvas.width / 2 - tw / 2;
    const sy = canvas.height / 2 + 50;
    return cursorSprites.map((_, i) => ({ x: sx + i * (bs + gap), y: sy, w: bs, h: bs }));
}

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

function getCharacterBackButton() {
    const cards = getCharacterCards();
    const cardBottom = cards[0].y + cards[0].h;
    const y = Math.min(canvas.height - 50, cardBottom + 18);
    return { x: canvas.width / 2 - 70, y, w: 140, h: 38 };
}

function getCharacterPreviewSprite(loadout) {
    const idle = loadout.sprites.idle;
    if (idle?.complete && idle.naturalWidth) return idle;
    return fallbackPlayerSprites.idle;
}

function getLevelUpZones() {
    const CW = 200, CH = 270, GAP = 24;
    const totalW = CW * 3 + GAP * 2;
    const startX = canvas.width / 2 - totalW / 2;
    const cardY  = canvas.height / 2 - CH / 2 - 30;
    const cards  = [0, 1, 2].map(i => ({ x: startX + i * (CW + GAP), y: cardY, w: CW, h: CH }));
    const skipW  = 200, skipH = 54;
    return { cards, skip: { x: canvas.width / 2 - skipW / 2, y: cardY + CH + 22, w: skipW, h: skipH } };
}

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
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(bx, by, boxW, 3);
    ctx.textAlign  = 'center';
    ctx.font       = 'bold 15px Arial';
    ctx.fillStyle  = '#ddd';
    ctx.shadowBlur = 0;
    ctx.fillText('GPU Acceleration  —  ' + browserNames[browser] + ' detected', canvas.width / 2, by + 30);
    ctx.font      = '13px Arial';
    ctx.fillStyle = '#777';
    ctx.fillText('Follow these steps for a smoother experience:', canvas.width / 2, by + 52);
    ctx.strokeStyle = '#333';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(bx + PAD, by + 64);
    ctx.lineTo(bx + boxW - PAD, by + 64);
    ctx.stroke();
    ctx.textAlign  = 'left';
    ctx.font       = '13px monospace';
    ctx.fillStyle  = '#bbb';
    list.forEach((line, i) => ctx.fillText(line, bx + PAD, by + 82 + i * LH));
    ctx.textAlign = 'center';
    ctx.font      = '11px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText('Click Performance Guide again to close', canvas.width / 2, by + boxH - 12);
    ctx.restore();
}

function drawSplash() {
    ctx.fillStyle = '#000';
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

function drawBlackFade(alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, alpha))})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

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
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const menuShade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    menuShade.addColorStop(0, 'rgba(0,0,0,0.2)');
    menuShade.addColorStop(0.65, 'rgba(0,0,0,0.35)');
    menuShade.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = menuShade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (menuPage === 'main') {
        ctx.fillStyle  = '#ffffff';
        ctx.font       = 'bold 64px Arial';
        ctx.textAlign  = 'center';
        ctx.fillText('Castanzakannon', canvas.width / 2, canvas.height / 2 - 80);
        ctx.font       = '20px Arial';
        ctx.fillStyle  = '#ffffff';
        ctx.fillText('Press ENTER or Click to Start', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font       = '15px Arial';
        ctx.fillStyle  = '#d6d6d6';
        ctx.fillText('Selected Character: ' + getSelectedCharacter().name, canvas.width / 2, canvas.height / 2 + 6);

        const charBtn = getSelectCharacterButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(charBtn.x, charBtn.y, charBtn.w, charBtn.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(charBtn.x, charBtn.y, charBtn.w, charBtn.h);
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('Select Character  >', charBtn.x + charBtn.w / 2, charBtn.y + charBtn.h / 2 + 6);

        const btn = getSelectCursorButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('Select Cursor  >', btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);

        // Fog toggle button
        const ftb = getFogToggleButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(ftb.x, ftb.y, ftb.w, ftb.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(ftb.x, ftb.y, ftb.w, ftb.h);
        const pillW = 34, pillH = 18, pillY = ftb.y + (ftb.h - pillH) / 2;
        const pillX = ftb.x + 8;
        ctx.fillStyle = fogEnabled ? '#4a4a4a' : '#1f1f1f';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fill();
        const knobX = fogEnabled ? pillX + pillW - pillH / 2 - 2 : pillX + pillH / 2 + 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(knobX, pillY + pillH / 2, pillH / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '14px Arial';
        ctx.textAlign   = 'left';
        ctx.fillText('Fog: ' + (fogEnabled ? 'ON' : 'OFF'), ftb.x + pillW + 16, ftb.y + ftb.h / 2 + 5);

        // Graphics tutorial button
        const pb = getPerfButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '13px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('Graphics Tutorial', pb.x + pb.w / 2, pb.y + pb.h / 2 + 5);

        // FPS counter toggle button
        const fpb = getFpsToggleButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(fpb.x, fpb.y, fpb.w, fpb.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(fpb.x, fpb.y, fpb.w, fpb.h);
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '13px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('FPS Counter: ' + (showFpsCounter ? 'ON' : 'OFF'), fpb.x + fpb.w / 2, fpb.y + fpb.h / 2 + 5);

        // Dev test mode button
        const dtb = getDevTestButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(dtb.x, dtb.y, dtb.w, dtb.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(dtb.x, dtb.y, dtb.w, dtb.h);
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '13px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('Dev Test: ' + (devTestMode ? 'ON' : 'OFF'), dtb.x + dtb.w / 2, dtb.y + dtb.h / 2 + 5);

        if (showPerfGuide) drawPerfGuide();
    } else if (menuPage === 'characters') {
        const panel = getCharacterPanel();
        ctx.fillStyle = 'rgba(0,0,0,0.93)';
        ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

        ctx.fillStyle = '#ffffff';
        ctx.font      = 'bold 38px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Select Character', canvas.width / 2, panel.y + 46);
        ctx.font      = '16px Arial';
        ctx.fillStyle = '#d8d8d8';
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

            ctx.fillStyle = isSel ? '#131313' : '#0a0a0a';
            ctx.fillRect(drawX, drawY, drawW, drawH);

            ctx.strokeStyle = isSel ? '#ffffff' : isHover ? '#e6e6e6' : '#6b6b6b';
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
            ctx.fillStyle = isSel ? '#ffffff' : '#e0e0e0';
            ctx.fillText(loadout.name, drawX + drawW / 2, nameY);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#bfbfbf';
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
                ctx.fillStyle = '#ffffff';
                ctx.fillText('ACTIVE', drawX + drawW / 2, drawY + 16);
            }
        }

        const back = getCharacterBackButton();
        ctx.fillStyle   = '#000000';
        ctx.fillRect(back.x, back.y, back.w, back.h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.strokeRect(back.x, back.y, back.w, back.h);
        ctx.fillStyle   = '#ffffff';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
    } else {
        ctx.fillStyle = 'white';
        ctx.font      = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Select Cursor', canvas.width / 2, canvas.height / 2 - 80);

        const boxes = getCursorBoxes();
        for (let i = 0; i < cursorSprites.length; i++) {
            const b   = boxes[i];
            const sel = i === selectedCursor;
            ctx.fillStyle   = sel ? 'lightblue' : 'black';
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.drawImage(cursorSprites[i].img, b.x + 4, b.y + 4, b.w - 8, b.h - 8);
            ctx.strokeStyle = sel ? 'red'   : 'grey';
            ctx.lineWidth   = sel ? 2       : 1;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle   = sel ? 'white' : 'silver';
            ctx.font        = '11px Arial';
            ctx.textAlign   = 'center';
            ctx.fillText(cursorSprites[i].name, b.x + b.w / 2, b.y + b.h + 14);
        }

        const back = getBackButton();
        ctx.fillStyle   = '#222';
        ctx.fillRect(back.x, back.y, back.w, back.h);
        ctx.strokeStyle = 'grey';
        ctx.lineWidth   = 1;
        ctx.strokeRect(back.x, back.y, back.w, back.h);
        ctx.fillStyle   = 'silver';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('<  Back', back.x + back.w / 2, back.y + back.h / 2 + 6);
    }

    drawCursor();
}

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
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur  = 22;
    ctx.fillStyle   = '#fff8c0';
    ctx.fillText('LEVEL UP!', canvas.width / 2, canvas.height / 2 - 270);
    ctx.font        = '18px Arial';
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = 'rgba(200,220,255,0.85)';
    ctx.fillText('Choose an upgrade  —  or skip', canvas.width / 2, canvas.height / 2 - 235);
    ctx.restore();

    const { cards, skip } = getLevelUpZones();
    levelUpMenuHover = -1;
    for (let i = 0; i < 3; i++) {
        const c = cards[i];
        if (mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h) levelUpMenuHover = i;
    }
    if (mouseX >= skip.x && mouseX <= skip.x + skip.w && mouseY >= skip.y && mouseY <= skip.y + skip.h) levelUpMenuHover = 3;

    const LABELS = ['Upgrade Slot 1', 'Upgrade Slot 2', 'Upgrade Slot 3'];
    const ICONS  = ['❶', '❷', '❸'];

    for (let i = 0; i < 3; i++) {
        const c     = cards[i];
        const hover = levelUpMenuHover === i;
        const pulse = 0.85 + 0.15 * Math.sin(frameCount * 0.06 + i * 1.1);

        ctx.save();
        if (hover) { ctx.shadowColor = '#88aaff'; ctx.shadowBlur = 28; ctx.globalAlpha = pulse; }
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
        ctx.font         = 'bold 14px Arial';
        ctx.fillStyle    = hover ? '#ddeeff' : '#aabbcc';
        ctx.fillText(LABELS[i], c.x + c.w / 2, c.y + 78);
        ctx.font         = '12px Arial';
        ctx.fillStyle    = 'rgba(160,170,190,0.6)';
        ctx.fillText('—  coming soon  —',  c.x + c.w / 2, c.y + 140);
        ctx.fillText('Upgrade details',     c.x + c.w / 2, c.y + 162);
        ctx.fillText('will appear here',    c.x + c.w / 2, c.y + 180);
        ctx.restore();
    }

    const sh = levelUpMenuHover === 3;
    const sp = 0.85 + 0.15 * Math.sin(frameCount * 0.06);
    ctx.save();
    if (sh) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 16; ctx.globalAlpha = sp; }
    ctx.drawImage(lvlSkipBgSprite, skip.x, skip.y, skip.w, skip.h);
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 16px Arial';
    ctx.fillStyle   = sh ? '#ffffff' : 'rgba(200,200,200,0.85)';
    ctx.fillText('Skip  ›', skip.x + skip.w / 2, skip.y + skip.h / 2 + 6);
    ctx.restore();
}

function drawGameOver() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'crimson';
    ctx.font      = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font      = '28px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('You reached Level ' + lastLevelDied, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font      = '20px Arial';
    ctx.fillStyle = 'silver';
    ctx.fillText('Press ENTER or Click to return to Menu', canvas.width / 2, canvas.height / 2 + 40);
}

function drawWinScreen() {
    ctx.fillStyle = '#08120a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#98ff98';
    ctx.font      = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN', canvas.width / 2, canvas.height / 2 - 60);

    ctx.font      = '26px Arial';
    ctx.fillStyle = '#d8ffd8';
    ctx.fillText('All 5 levels cleared', canvas.width / 2, canvas.height / 2 - 12);

    ctx.font      = '20px Arial';
    ctx.fillStyle = 'silver';
    ctx.fillText('Press ENTER or Click to return to Menu', canvas.width / 2, canvas.height / 2 + 38);
}

function drawCursor() {
    const sp = cursorSprites[selectedCursor].img;
    if (!sp.complete || !sp.naturalWidth) return;
    ctx.drawImage(sp, mouseX, mouseY, 32, 32);
}


// =============================================================================
//  UTILITIES
// =============================================================================

function toScreen(x, y) {
    return { x: Math.round(x - camera.x), y: Math.round(y - camera.y) };
}

function updateCamera(alpha) {
    const a  = alpha ?? 1;
    const px = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * a;
    const py = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * a;
    camera.x = px - canvas.width  / 2;
    camera.y = py - canvas.height / 2;
}

function savePrevPositions() {
    player.prevX = player.x;
    player.prevY = player.y;
    for (const e of enemies)     { e.prevX = e.x; e.prevY = e.y; }
    for (const p of projectiles) { p.prevX = p.x; p.prevY = p.y; }
    for (const p of pickups)     { p.prevX = p.x; p.prevY = p.y; }
}


// =============================================================================
//  GAME LOOP
// =============================================================================

function gameLoop(timestamp) {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const dt = Math.min(timestamp - lastTimestamp, 100);
    lastTimestamp = timestamp;

    fps = dt > 0 ? Math.round(1000 / dt) : fps;

    ctx.fillStyle = '#1a1a1a';
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
    if (gameState === 'menu')     { drawMenu();     requestAnimationFrame(gameLoop); return; }
    if (gameState === 'gameOver') { drawGameOver(); requestAnimationFrame(gameLoop); return; }
    if (gameState === 'win')      { drawWinScreen(); requestAnimationFrame(gameLoop); return; }

    if (gameState === 'playing') {
        accumulator += dt;
        while (accumulator >= FIXED_STEP) {
            savePrevPositions();
            updatePlayer();
            updateWaveSpawner();
            updateEnemies();
            updateProjectiles();
            cleanupDeadEnemies();
            updateWaveProgression();
            updatePickups();
            frameCount++;
            accumulator -= FIXED_STEP;
        }
        renderAlpha = accumulator / FIXED_STEP;
    } else {
        // levelUp — logic frozen, animations still run
        frameCount++;
        renderAlpha = 1;
    }

    updateCamera(renderAlpha);
    drawMap();
    if (fogEnabled) drawVisibilityMask();
    drawPlayer();
    drawEnemies();
    drawProjectiles();
    drawPickups();
    drawUI();
    if (gameState === 'levelUp') drawLevelUpMenu();
    drawCursor();

    requestAnimationFrame(gameLoop);
}

generateMap();
requestAnimationFrame(gameLoop);