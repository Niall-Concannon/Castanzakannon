// =============================================================================
//  CANVAS SETUP
// =============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;


// =============================================================================
//  CONSTANTS
// =============================================================================

const TILE          = 48;
const MAP_W         = 80;
const MAP_H         = 60;
const DASH_SPEED    = 16;
const DASH_DURATION = 15;
const MAX_ENEMIES   = 20;
const RAIL_RADIUS   = 52;
const GUN_W         = 48;
const GUN_H         = 18;

const FIXED_STEP = 1000 / 60;

const ENEMY_TYPES = {
    basic: { hp: 3, size: 14, speed: 2,   color: 'green',  animSpeed: 10 },
    fast:  { hp: 2, size: 12, speed: 3.5, color: 'yellow', animSpeed: 6  },
    tank:  { hp: 8, size: 20, speed: 1.2, color: 'red',    animSpeed: 14 },
};

// Dash sprite canvas size (48px units) and character anchor point
const DASH_SPRITE_META = {
    dash_h:  { cw: 100, ch:  48, cx: 76, cy: 24 },
    dash_u:  { cw:  48, ch: 100, cx: 24, cy: 24 },
    dash_d:  { cw:  48, ch: 100, cx: 24, cy: 76 },
    dash_ur: { cw:  84, ch:  84, cx: 63, cy: 21 },
    dash_dr: { cw:  84, ch:  84, cx: 63, cy: 63 },
};

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


// =============================================================================
//  SPRITES
// =============================================================================

const img = src => Object.assign(new Image(), { src });

const playerSprites = {
    idle:   img('assets/sprites/player_idle.png'),
    walk1:  img('assets/sprites/player_walk1.png'),
    walk2:  img('assets/sprites/player_walk2.png'),
    dash_h: img('assets/sprites/player_dash_h.png'),
    dash_u: img('assets/sprites/player_dash_u.png'),
    dash_d: img('assets/sprites/player_dash_d.png'),
    dash_ur:img('assets/sprites/player_dash_ur.png'),
    dash_dr:img('assets/sprites/player_dash_dr.png'),
};

const gunSprites = {
    idle:  img('assets/sprites/gun_idle.png'),
    shoot: img('assets/sprites/gun_shoot.png'),
};

const wallSprite        = img('assets/sprites/wall_placeholder.png');
const floorSprite       = img('assets/sprites/floor_placeholder.png');
const projectileSprite  = img('assets/sprites/projectile_placeholder.png');
const pickupXpSprite    = img('assets/sprites/pickup_xp_placeholder.png');

const ENEMY_SPRITE_PATHS = {
    basic: ['assets/sprites/enemies/enemy_basic_frame1.png', 'assets/sprites/enemies/enemy_basic_frame2.png', 'assets/sprites/enemies/enemy_basic_frame3.png'],
    fast:  ['assets/sprites/enemies/enemy_fast_frame1.png',  'assets/sprites/enemies/enemy_fast_frame2.png',  'assets/sprites/enemies/enemy_fast_frame3.png' ],
    tank:  ['assets/sprites/enemies/enemy_tank_frame1.png',  'assets/sprites/enemies/enemy_tank_frame2.png',  'assets/sprites/enemies/enemy_tank_frame3.png' ],
};
const enemySprites = {};
for (const [type, paths] of Object.entries(ENEMY_SPRITE_PATHS)) {
    enemySprites[type] = paths.map(src => img(src));
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


// =============================================================================
//  GAME STATE
// =============================================================================

let keys           = {};
let camera         = { x: 0, y: 0 };
let mapTiles       = [];
let frameCount     = 0;
let gameState      = 'menu';
let menuPage       = 'main';
let selectedCursor = 0;
let mouseX         = 0;
let mouseY         = 0;
let mouseDown      = false;
let projectiles    = [];
let enemies        = [];
let pickups        = [];
let navGrid        = [];
let score;
let lastScore      = 0;
let levelUpMenuHover = -1;
let xpBarFlash     = 0;
let lastTimestamp  = 0;
let accumulator    = 0;
let renderAlpha    = 1;

const fogCanvas = document.createElement('canvas');
const fogCtx    = fogCanvas.getContext('2d');

let player = {
    x: MAP_W * TILE / 2,    y: MAP_H * TILE / 2,
    prevX: MAP_W * TILE / 2, prevY: MAP_H * TILE / 2,
    size: 20, speed: 4, color: 'blue',
    dashing: false, dashTime: 0,
    dashDirX: 0, dashDirY: 0,
    dashCooldown: 0, facing: 1,
    shootCooldown: 0, weaponAngle: 0,
    hp: 100, maxHp: 100, invulnTimer: 0,
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


// =============================================================================
//  INPUT
// =============================================================================

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Escape' && gameState === 'menu' && menuPage === 'cursors') {
        menuPage = 'main';
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if      (gameState === 'menu'    && menuPage === 'main') startGame();
        else if (gameState === 'gameOver') { gameState = 'menu'; menuPage = 'main'; }
        else if (gameState === 'levelUp')  gameState = 'playing';
        else if (gameState === 'playing')  playerDash();
    }
});

window.addEventListener('keyup',     e  => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e  => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mouseup',   () => { mouseDown = false; });

window.addEventListener('mousedown', () => {
    mouseDown = true;

    if (gameState === 'menu') {
        if (menuPage === 'main') {
            const btn = getSelectCursorButton();
            if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                menuPage = 'cursors';
            } else {
                startGame();
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


// =============================================================================
//  MAP
// =============================================================================

function generateMap() {
    mapTiles = [];
    for (let i = 0; i < MAP_H; i++) {
        mapTiles[i] = [];
        for (let j = 0; j < MAP_W; j++) {
            mapTiles[i][j] = (j < 2 || j >= MAP_W - 2 || i < 2 || i >= MAP_H - 2) ? 1 : 0;
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
                    mapTiles[j][k] = 1;
        } else {
            for (let j = sy; j < sy + sh && j < MAP_H - 2; j++) mapTiles[j][sx] = 1;
            for (let k = sx; k < sx + sw && k < MAP_W - 2; k++) mapTiles[sy][k] = 1;
        }
    }

    // Clear spawn area
    const cx = Math.floor(MAP_W / 2), cy = Math.floor(MAP_H / 2);
    for (let i = cy - 5; i <= cy + 5; i++)
        for (let j = cx - 5; j <= cx + 5; j++)
            if (i >= 0 && i < MAP_H && j >= 0 && j < MAP_W) mapTiles[i][j] = 0;

    buildNavGrid();
}

function buildNavGrid() {
    navGrid = new Uint8Array(MAP_W * MAP_H);
    for (let y = 0; y < MAP_H; y++)
        for (let x = 0; x < MAP_W; x++)
            navGrid[y * MAP_W + x] = mapTiles[y][x] === 1 ? 1 : 0;
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
        path.unshift({ x: (idx % MAP_W) * TILE + TILE / 2, y: Math.floor(idx / MAP_W) * TILE + TILE / 2 });
        idx = prev[idx];
    }
    return path;
}

function wallCollision(x, y, size) {
    const l = Math.floor((x - size) / TILE), t = Math.floor((y - size) / TILE);
    const r = Math.floor((x + size) / TILE), b = Math.floor((y + size) / TILE);
    for (let ty = t; ty <= b; ty++)
        for (let tx = l; tx <= r; tx++)
            if (ty >= 0 && ty < MAP_H && tx >= 0 && tx < MAP_W && mapTiles[ty]?.[tx] === 1) return true;
    return false;
}

function drawMap() {
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const s = toScreen(x * TILE, y * TILE);
            if (s.x < -TILE || s.x > canvas.width || s.y < -TILE || s.y > canvas.height) continue;
            ctx.drawImage(mapTiles[y][x] === 1 ? wallSprite : floorSprite, s.x, s.y, TILE, TILE);
        }
    }
}


// =============================================================================
//  PLAYER
// =============================================================================

function startGame() {
    generateMap();
    pickups = [];
    enemies = [];

    for (let i = 0; i < MAX_ENEMIES; i++) {
        spawnEnemy(['basic', 'fast', 'tank'][Math.floor(Math.random() * 3)]);
    }

    player.x     = (MAP_W * TILE) / 2;
    player.y     = (MAP_H * TILE) / 2;
    player.prevX = player.x;
    player.prevY = player.y;
    player.hp    = player.maxHp;
    player.xp    = 0;
    player.level = 1;
    score        = 0;
    gameState    = 'playing';
    lastTimestamp = 0;
    accumulator   = 0;
}

function playerDash() {
    if (player.dashing || player.dashCooldown > 0) return;

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
    player.dashCooldown = 120;
}

function playerShoot() {
    if (!mouseDown || player.shootCooldown > 0) return;
    player.shootCooldown = 10;

    const gunX = player.x + Math.cos(player.weaponAngle) * RAIL_RADIUS;
    const gunY = player.y + Math.sin(player.weaponAngle) * RAIL_RADIUS;

    projectiles.push({
        x: gunX, y: gunY, prevX: gunX, prevY: gunY,
        velocityX: Math.cos(player.weaponAngle) * 12,
        velocityY: Math.sin(player.weaponAngle) * 12,
        size: 5, framesLeft: 80,
    });
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
            const nx = player.x + player.dashDirX * DASH_SPEED;
            const ny = player.y + player.dashDirY * DASH_SPEED;
            if (!wallCollision(nx,      player.y, player.size)) player.x = nx;
            if (!wallCollision(player.x, ny,      player.size)) player.y = ny;
        }
    } else {
        const n  = Math.hypot(dirX, dirY) || 1;
        const mx = (dirX / n) * player.speed;
        const my = (dirY / n) * player.speed;
        if (!wallCollision(player.x + mx, player.y,      player.size)) player.x += mx;
        if (!wallCollision(player.x,      player.y + my, player.size)) player.y += my;
    }

    player.x = Math.max(TILE * 2, Math.min(MAP_W * TILE - TILE * 2, player.x));
    player.y = Math.max(TILE * 2, Math.min(MAP_H * TILE - TILE * 2, player.y));

    if (player.dashCooldown  > 0) player.dashCooldown--;
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.invulnTimer   > 0) player.invulnTimer--;

    for (const e of enemies) {
        if (!e.alive) continue;
        if (player.invulnTimer <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
            player.hp = Math.max(0, player.hp - 10);
            player.invulnTimer = 60;
        }
    }

    if (player.hp <= 0) { lastScore = score; gameState = 'gameOver'; }

    player.weaponAngle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
    playerShoot();
    updatePlayerAnim();
}

function updatePlayerAnim() {
    const moving = keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
                   keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];

    player.facing = Math.cos(player.weaponAngle) >= 0 ? 1 : -1;

    if (player.dashing) {
        const adx  = Math.abs(player.dashDirX);
        const ady  = Math.abs(player.dashDirY);
        const diag = adx > 0.3 && ady > 0.3;

        let frame;
        if      (diag)    frame = player.dashDirY < 0 ? 'dash_ur' : 'dash_dr';
        else if (ady > adx) frame = player.dashDirY < 0 ? 'dash_u'  : 'dash_d';
        else                frame = 'dash_h';

        playerAnim.frame    = frame;
        playerAnim.dashFrame = frame;
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

function drawPlayer() {
    const rx = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * renderAlpha;
    const ry = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * renderAlpha;
    const s  = toScreen(rx, ry);
    const size = player.size * 2;

    const flickering = player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0;
    const bodySprite = playerSprites[playerAnim.frame] || playerSprites.idle;
    const isDash     = player.dashing || playerAnim.frame.startsWith('dash');
    const flipX      = isDash ? player.dashDirX < 0 : player.facing === -1;
    const scale      = size / 48;
    const meta       = DASH_SPRITE_META[playerAnim.frame];

    ctx.save();
    if (flickering) ctx.globalAlpha = 0.35;

    if (meta) {
        const dw = meta.cw * scale, dh = meta.ch * scale;
        const ox = meta.cx * scale, oy = meta.cy * scale;
        if (flipX) {
            ctx.translate(s.x, s.y);
            ctx.scale(-1, 1);
            ctx.drawImage(bodySprite, -ox, -oy, dw, dh);
        } else {
            ctx.drawImage(bodySprite, s.x - ox, s.y - oy, dw, dh);
        }
    } else {
        if (flipX) {
            ctx.translate(s.x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(bodySprite, -size / 2, s.y - size / 2, size, size);
        } else {
            ctx.drawImage(bodySprite, s.x - size / 2, s.y - size / 2, size, size);
        }
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
    const isFiring   = mouseDown && player.shootCooldown > 6;
    const gunSprite  = isFiring ? gunSprites.shoot : gunSprites.idle;

    ctx.save();
    if (flickering) ctx.globalAlpha = 0.35;
    ctx.translate(gunScreenX, gunScreenY);
    ctx.rotate(angle);
    if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);
    ctx.drawImage(gunSprite, -GUN_W / 2, -GUN_H / 2, GUN_W, GUN_H);
    ctx.restore();
}


// =============================================================================
//  ENEMIES
// =============================================================================

function spawnEnemy(type) {
    const e = ENEMY_TYPES[type];
    let ex, ey, tries = 0;
    do {
        ex = (5 + Math.floor(Math.random() * (MAP_W - 10))) * TILE;
        ey = (5 + Math.floor(Math.random() * (MAP_H - 10))) * TILE;
        tries++;
    } while ((Math.hypot(ex - player.x, ey - player.y) < 300 || wallCollision(ex, ey, 14)) && tries < 60);

    enemies.push({
        x: ex, y: ey, prevX: ex, prevY: ey,
        hp: e.hp, maxHp: e.hp, size: e.size,
        speed: e.speed, color: e.color,
        hitFlash: 0, hpBarTimer: 0, alive: true, type,
        animFrame: 0, animTimer: Math.floor(Math.random() * e.animSpeed),
        path: [], pathTimer: Math.floor(Math.random() * 60),
    });
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

function updateEnemies() {
    // Sandevistan: enemies slow during player dash
    const sanSlowMult = player.dashing ? 0.15 : 1.0;

    for (const e of enemies) {
        if (!e.alive) continue;

        if (e.pathTimer > 0) {
            e.pathTimer--;
        } else {
            e.path = findPath(e.x, e.y, player.x, player.y);
            e.pathTimer = 60;
        }

        let tx, ty;
        if (hasLineOfSight(e.x, e.y, player.x, player.y, e.size)) {
            tx = player.x; ty = player.y; e.path = [];
        } else if (e.path.length > 0) {
            while (e.path.length > 1 && Math.hypot(e.path[0].x - e.x, e.path[0].y - e.y) < TILE * 0.55) {
                e.path.shift();
            }
            for (let wi = e.path.length - 1; wi > 0; wi--) {
                if (hasLineOfSight(e.x, e.y, e.path[wi].x, e.path[wi].y, e.size)) {
                    e.path.splice(0, wi);
                    break;
                }
            }
            tx = e.path[0].x; ty = e.path[0].y;
        } else {
            tx = player.x; ty = player.y;
        }

        const offScreen = (e.x - camera.x) < -e.size || (e.x - camera.x) > canvas.width  + e.size ||
                          (e.y - camera.y) < -e.size || (e.y - camera.y) > canvas.height + e.size;
        const speedMult = (offScreen ? 3.0 : 1.0) * sanSlowMult;

        const angle = Math.atan2(ty - e.y, tx - e.x);
        const mx = Math.cos(angle) * e.speed * speedMult;
        const my = Math.sin(angle) * e.speed * speedMult;
        if (!wallCollision(e.x + mx, e.y,      e.size)) e.x += mx;
        if (!wallCollision(e.x,      e.y + my, e.size)) e.y += my;

        // Separation
        for (const o of enemies) {
            if (o === e || !o.alive) continue;
            const dx = e.x - o.x, dy = e.y - o.y;
            const dist = Math.hypot(dx, dy), md = e.size + o.size;
            if (dist < md && dist > 0) {
                const ov = (md - dist) * 0.5, nx = dx / dist, ny = dy / dist;
                if (!wallCollision(e.x + nx * ov, e.y,           e.size)) e.x += nx * ov;
                if (!wallCollision(e.x,            e.y + ny * ov, e.size)) e.y += ny * ov;
                if (!wallCollision(o.x - nx * ov, o.y,           o.size)) o.x -= nx * ov;
                if (!wallCollision(o.x,            o.y - ny * ov, o.size)) o.y -= ny * ov;
            }
        }

        if (e.hitFlash  > 0) e.hitFlash--;
        if (e.hpBarTimer > 0) e.hpBarTimer--;

        e.animTimer--;
        if (e.animTimer <= 0) {
            e.animFrame = (e.animFrame + 1) % enemySprites[e.type].length;
            e.animTimer = ENEMY_TYPES[e.type].animSpeed;
        }
    }
}

function drawEnemies() {
    const innerR = 120, outerR = 420;

    for (const e of enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist >= outerR) continue;

        const alpha = dist > innerR ? 1 - (dist - innerR) / (outerR - innerR) : 1;
        const rx  = (e.prevX ?? e.x) + (e.x - (e.prevX ?? e.x)) * renderAlpha;
        const ry  = (e.prevY ?? e.y) + (e.y - (e.prevY ?? e.y)) * renderAlpha;
        const sc  = toScreen(rx, ry);
        const sz  = e.size * 2;
        const sprite = enemySprites[e.type][e.animFrame];

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
                    score++;
                    const variant = e.type === 'tank' ? 'blue' : 'green';
                    pickups.push({
                        x: e.x, y: e.y, prevX: e.x, prevY: e.y,
                        vx: 0, vy: 0, size: 10, type: 'xp', variant,
                        value: XP_PICKUP_BASE_VALUE * (variant === 'blue' ? TANK_XP_MULTIPLIER : 1),
                    });
                    spawnEnemy(['basic', 'fast', 'tank'][Math.floor(Math.random() * 3)]);
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
                player.xp += p.value;
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
            const halo = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, p.size * 3.5 * pulse);
            halo.addColorStop(0,   `rgba(${variant.rgb},0.35)`);
            halo.addColorStop(0.5, `rgba(${variant.rgb},0.12)`);
            halo.addColorStop(1,   `rgba(${variant.rgb},0)`);
            ctx.fillStyle   = halo;
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, p.size * 3.5 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = variant.shadow;
            ctx.shadowBlur  = 18 * pulse;

            if (pickupXpSprite.complete && pickupXpSprite.naturalWidth) {
                ctx.drawImage(pickupXpSprite, sc.x - p.size, sc.y - p.size, p.size * 2, p.size * 2);
                if (p.variant === 'blue') {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = 'rgba(49,182,255,0.55)';
                    ctx.fillRect(sc.x - p.size, sc.y - p.size, p.size * 2, p.size * 2);
                    ctx.globalCompositeOperation = 'source-over';
                }
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

function drawVial(screenX, screenY, fillPercent, colors, glowSprite, label) {
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
    ctx.shadowBlur  = 0;
    ctx.restore();
}

function drawVials() {
    const lp = 22, tp = 170, gap = 30;
    const hpY   = tp;
    const dashY = tp + VIAL_H + gap;
    const hf    = player.hp / player.maxHp;

    const hc = hf > 0.5
        ? { top: '#ff8888', mid: '#dd2222', bot: '#660008' }
        : hf > 0.25
        ? { top: '#ffcc44', mid: '#dd7700', bot: '#883300' }
        : { top: '#ff6633', mid: '#cc2200', bot: '#660008' };

    drawVial(lp, hpY, hf, hc, vialGlowHpSprite, '❤  HP');

    const df = player.dashCooldown > 0 ? 1 - player.dashCooldown / 120 : 1;
    const dr = player.dashCooldown === 0;
    const dc = dr
        ? { top: '#88ffff', mid: '#22aaff', bot: '#0030bb' }
        : { top: '#44aadd', mid: '#1060cc', bot: '#001888' };

    drawVial(lp, dashY, df, dc, vialGlowDashSprite, '⚡ DASH');

    if (dr) {
        const ra = 0.55 + 0.45 * Math.abs(Math.sin(frameCount * 0.07));
        ctx.save();
        ctx.globalAlpha = ra;
        ctx.fillStyle   = '#00ffff';
        ctx.font        = `bold ${Math.round(11 * VIAL_SCALE)}px Arial`;
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 8;
        ctx.fillText('READY', lp + VIAL_W / 2, dashY - 6);
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
    const pad = 20, pw = 240, ph = 115;

    ctx.fillStyle  = 'black';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(pad - 12, pad - 12, pw, ph);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'lightgray';
    ctx.lineWidth   = 2;
    ctx.strokeRect(pad - 12, pad - 12, pw, ph);

    ctx.textAlign  = 'left';
    ctx.fillStyle  = 'white';
    ctx.font       = 'bold 18px Arial';
    ctx.fillText('Level ' + player.level, pad, pad + 5);
    ctx.font       = '14px Arial';
    ctx.fillStyle  = 'lightgray';
    ctx.fillText('Score: ' + score, pad, pad + 25);

    const tutY = pad + 44;
    ctx.font      = '12px Arial';
    ctx.fillStyle = 'silver';
    ctx.fillText('Move: WASD / Arrows', pad, tutY);
    ctx.fillText('Shoot: Mouse Click',  pad, tutY + 16);
    ctx.fillText('Dash: Space',         pad, tutY + 32);

    ctx.font      = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText('X: ' + Math.floor(player.x) + '  Y: ' + Math.floor(player.y), 20, canvas.height - 20);

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
        fogCtx.fillStyle = 'rgba(0,0,0,1)';
        fogCtx.beginPath();
        fogCtx.arc(ps.x, ps.y, Math.max(28, p.size * 7), 0, Math.PI * 2);
        fogCtx.fill();
    }
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.restore();

    ctx.drawImage(fogCanvas, 0, 0);
}


// =============================================================================
//  MENU & SCREENS
// =============================================================================

function getSelectCursorButton() { return { x: canvas.width / 2 - 80, y: canvas.height / 2 + 30,  w: 160, h: 36 }; }
function getBackButton()         { return { x: canvas.width / 2 - 60, y: canvas.height / 2 + 150, w: 120, h: 36 }; }

function getCursorBoxes() {
    const bs = 52, gap = 12;
    const tw = cursorSprites.length * (bs + gap) - gap;
    const sx = canvas.width / 2 - tw / 2;
    const sy = canvas.height / 2 + 50;
    return cursorSprites.map((_, i) => ({ x: sx + i * (bs + gap), y: sy, w: bs, h: bs }));
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

function drawMenu() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (menuPage === 'main') {
        ctx.fillStyle  = 'white';
        ctx.font       = 'bold 64px Arial';
        ctx.textAlign  = 'center';
        ctx.fillText('Castanzakannon', canvas.width / 2, canvas.height / 2 - 80);
        ctx.font       = '20px Arial';
        ctx.fillStyle  = 'silver';
        ctx.fillText('Press ENTER or Click to Start', canvas.width / 2, canvas.height / 2 - 20);

        const btn = getSelectCursorButton();
        ctx.fillStyle   = '#222';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = 'grey';
        ctx.lineWidth   = 1;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle   = 'silver';
        ctx.font        = '16px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText('Select Cursor  >', btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
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
    ctx.fillText('Score: ' + lastScore, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font      = '20px Arial';
    ctx.fillStyle = 'silver';
    ctx.fillText('Press ENTER or Click to return to Menu', canvas.width / 2, canvas.height / 2 + 40);
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
    return { x: x - camera.x, y: y - camera.y };
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

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu')     { drawMenu();     requestAnimationFrame(gameLoop); return; }
    if (gameState === 'gameOver') { drawGameOver(); requestAnimationFrame(gameLoop); return; }

    if (gameState === 'playing') {
        accumulator += dt;
        while (accumulator >= FIXED_STEP) {
            savePrevPositions();
            updatePlayer();
            updateEnemies();
            updateProjectiles();
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
    drawVisibilityMask();
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