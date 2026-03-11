// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player animation sprites
// Directional aim suffixes: _r (right), _diag_up, _u (up), _diag_dn (down)
// Base frames: idle, idle2, walk1, walk2, shoot + dash directionals
const playerSprites = {};
const ANIM_BASES  = ['idle', 'idle2', 'walk1', 'walk2', 'shoot'];
const AIM_DIRS    = ['r', 'diag_up', 'u', 'diag_dn'];
const DASH_FRAMES = ['dash_h', 'dash_u', 'dash_d', 'dash_ur', 'dash_dr'];

for (const base of ANIM_BASES) {
    for (const dir of AIM_DIRS) {
        const key = `${base}_${dir}`;
        playerSprites[key] = new Image();
        playerSprites[key].src = `assets/sprites/player_${base}_${dir}.png`;
    }
}
for (const d of DASH_FRAMES) {
    playerSprites[d] = new Image();
    playerSprites[d].src = `assets/sprites/player_${d}.png`;
}

// Player animation state
let playerAnim = {
    frame: 'idle',      // current sprite key
    timer: 0,           // frames until next step cycle
    walkToggle: false,  // alternates walk1/walk2
    idleTimer: 0,       // counter for idle breath cycle
};

const wallSprite = new Image();
wallSprite.src = 'assets/sprites/wall_placeholder.png';

const floorSprite = new Image();
floorSprite.src = 'assets/sprites/floor_placeholder.png';

// Enemy animation frames — each array is the sequence of sprites played in order, looping.
// Add or remove frame paths here; the rest of the code handles cycling automatically.
// animSpeed (in ENEMY_TYPES below) controls how many game-frames each sprite frame is held for.
const ENEMY_SPRITE_PATHS = {
    basic: [
        'assets/sprites/enemy_basic_frame1.png',
        'assets/sprites/enemy_basic_frame2.png',
        'assets/sprites/enemy_basic_frame3.png',
    ],
    fast: [
        'assets/sprites/enemy_fast_frame1.png',
        'assets/sprites/enemy_fast_frame2.png',
        'assets/sprites/enemy_fast_frame3.png',
    ],
    tank: [
        'assets/sprites/enemy_tank_frame1.png',
        'assets/sprites/enemy_tank_frame2.png',
        'assets/sprites/enemy_tank_frame3.png',
    ]
};

// Pre-load every frame for every type
const enemySprites = {};
for (const [type, paths] of Object.entries(ENEMY_SPRITE_PATHS)) {
    enemySprites[type] = paths.map(src => {
        const img = new Image();
        img.src = src;
        return img;
    });
}

const projectileSprite = new Image();
projectileSprite.src = 'assets/sprites/projectile_placeholder.png';

const pickupXpSprite = new Image();
pickupXpSprite.src = 'assets/sprites/pickup_xp_placeholder.png';

const cursorSprites = [
    { name: 'Crosshair',  img: Object.assign(new Image(), { src: 'assets/sprites/cursor_crosshair.png'  }) },
    { name: 'Reticle',    img: Object.assign(new Image(), { src: 'assets/sprites/cursor_reticle.png'    }) },
    { name: 'Scope',      img: Object.assign(new Image(), { src: 'assets/sprites/cursor_scope.png'      }) },
    { name: 'Skull',      img: Object.assign(new Image(), { src: 'assets/sprites/cursor_skull.png'      }) },
    { name: 'Tactical',   img: Object.assign(new Image(), { src: 'assets/sprites/cursor_tactical.png'   }) },
    { name: 'Neon Arrow', img: Object.assign(new Image(), { src: 'assets/sprites/cursor_neon_arrow.png' }) },
];

// ─────────────────────────────────────────────────────────────────────────────
//  VIAL UI SPRITES & GEOMETRY
//  These must match the dimensions used in gen_vials2.py exactly.
// ─────────────────────────────────────────────────────────────────────────────
const vialFrameSprite   = Object.assign(new Image(), { src: 'assets/sprites/ui_vial_frame.png'    });
const vialBgSprite      = Object.assign(new Image(), { src: 'assets/sprites/ui_vial_bg.png'       });
const vialGlowHpSprite  = Object.assign(new Image(), { src: 'assets/sprites/ui_vial_glow_hp.png'  });
const vialGlowDashSprite= Object.assign(new Image(), { src: 'assets/sprites/ui_vial_glow_dash.png'});
const vialBubblesSprite = Object.assign(new Image(), { src: 'assets/sprites/ui_vial_bubbles.png'  });

// Vial source dimensions (pixel size of the PNG)
const VSRC_W = 72, VSRC_H = 220;

// Bottle geometry — mirrors gen_vials2.py constants
const VCORK_W = 22, VCORK_H = 16, VCORK_Y1 = 2;
const VCORK_Y2 = VCORK_Y1 + VCORK_H;
const VNECK_W = 24;
const VNECK_Y1 = VCORK_Y2, VNECK_Y2 = VNECK_Y1 + 28;
const VSHOULDER_Y1 = VNECK_Y2, VSHOULDER_Y2 = VSHOULDER_Y1 + 18;
const VBODY_W = 56;
const VBODY_Y1 = VSHOULDER_Y2, VBODY_Y2 = VSRC_H - 5;
const VBRAD = 10;          // body corner radius
const VCX   = VSRC_W / 2; // centre-x in source coords

// Display scale: how much bigger to render the vials on screen
const VIAL_SCALE = 0.88;
const VIAL_W = VSRC_W  * VIAL_SCALE;   // ~63px
const VIAL_H = VSRC_H  * VIAL_SCALE;   // ~194px

// ─────────────────────────────────────────────────────────────────────────────

// Constants - pixels
const TILE = 48;
const MAP_W = 80;
const MAP_H = 60;
const DASH_SPEED = 16;
const DASH_DURATION = 15; // 0.25 second dash
const MAX_ENEMIES = 20;
const ENEMY_TYPES = {
    basic: {
        hp: 3,
        size: 14,
        speed: 2,
        color: "green",
        animSpeed: 10
    },
    fast: {
        hp: 2,
        size: 12,
        speed: 3.5,
        color: "yellow",
        animSpeed: 6
    },
    tank: {
        hp: 8,
        size: 20,
        speed: 1.2,
        color: "red",
        animSpeed: 14
    }
};

// Game state
let keys = {};
let camera = { x: 0, y: 0 };
let mapTiles = [];
let frameCount = 0;
let gameState = "menu";
let menuPage = "main"; // "main" or "cursors"
let selectedCursor = 0;
let mouseX = 0, mouseY = 0, mouseDown = false;
let projectiles = [];
let enemies = [];
let score, lastScore = 0;
let pickups = [];
let navGrid = [];

// Player object
let player = {
    x: MAP_W * TILE / 2,
    y: MAP_H * TILE / 2,
    size: 20,
    speed: 4,
    color: 'blue',
    dashing: false,
    dashTime: 0,
    dashDirX: 0,
    dashDirY: 0,
    dashCooldown: 0,
    facing: 1,
    shootCooldown: 0,
    weaponAngle: 0,
    hp: 100,
    maxHp: 100,
    invulnTimer: 0,
    xp: 0,
    xpToNextLevel: 100,
    level: 1,
    dashTrail: []
};

// Input handling
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Escape') {
        if (gameState === "menu" && menuPage === "cursors") {
            menuPage = "main";
        }
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === "menu" && menuPage === "main") {
            startGame();
        } else if (gameState === "gameOver") {
            gameState = "menu";
            menuPage = "main";
        } else if (gameState === "playing") {
            playerDash();
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener("mousedown", () => {
    mouseDown = true;
    if (gameState === "menu") {
        if (menuPage === "main") {
            const btn = getSelectCursorButton();
            if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                menuPage = "cursors";
            } else {
                startGame();
            }
        } else if (menuPage === "cursors") {
            const backBtn = getBackButton();
            if (mouseX >= backBtn.x && mouseX <= backBtn.x + backBtn.w && mouseY >= backBtn.y && mouseY <= backBtn.y + backBtn.h) {
                menuPage = "main";
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
    } else if (gameState === "gameOver") {
        gameState = "menu";
        menuPage = "main";
    }
});

window.addEventListener("mouseup", () => {
    mouseDown = false;
});

// Map generation
function generateMap() {
    mapTiles = [];

    for (let i = 0; i < MAP_H; i++) {
        mapTiles[i] = [];
        for (let j = 0; j < MAP_W; j++) {
            if (j < 2 || j >= MAP_W - 2 || i < 2 || i >= MAP_H - 2) {
                mapTiles[i][j] = 1;
            } else {
                mapTiles[i][j] = 0;
            }
        }
    }

    const numStructures = 64;
    for (let i = 0; i < numStructures; i++) {
        const structureX = 6 + Math.floor(Math.random() * (MAP_W - 14));
        const structureY = 6 + Math.floor(Math.random() * (MAP_H - 14));
        const structureW = 3 + Math.floor(Math.random() * 4);
        const structureH = 3 + Math.floor(Math.random() * 4);

        if (Math.random() > 0.5) {
            for (let j = structureY; j < structureY + structureH && j < MAP_H - 2; j++) {
                for (let k = structureX; k < structureX + structureW && k < MAP_W - 2; k++) {
                    mapTiles[j][k] = 1;
                }
            }
        } else {
            for (let j = structureY; j < structureY + structureH && j < MAP_H - 2; j++) {
                mapTiles[j][structureX] = 1;
            }
            for (let k = structureX; k < structureX + structureW && k < MAP_W - 2; k++) {
                mapTiles[structureY][k] = 1;
            }
        }
    }

    const spawnX = Math.floor(MAP_W / 2);
    const spawnY = Math.floor(MAP_H / 2);
    for (let i = spawnY - 5; i <= spawnY + 5; i++) {
        for (let j = spawnX - 5; j <= spawnX + 5; j++) {
            if (i >= 0 && i < MAP_H && j >= 0 && j < MAP_W) {
                mapTiles[i][j] = 0;
            }
        }
    }

    buildNavGrid();
}

function buildNavGrid() {
    navGrid = new Uint8Array(MAP_W * MAP_H);
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            navGrid[y * MAP_W + x] = mapTiles[y][x] === 1 ? 1 : 0;
        }
    }
}

function findPath(fromX, fromY, toX, toY) {
    const sx = Math.floor(fromX / TILE);
    const sy = Math.floor(fromY / TILE);
    const gx = Math.floor(toX / TILE);
    const gy = Math.floor(toY / TILE);

    if (sx === gx && sy === gy) return [];

    const prev = new Int32Array(MAP_W * MAP_H).fill(-2);
    const startIdx = sy * MAP_W + sx;
    const goalIdx  = gy * MAP_W + gx;
    prev[startIdx] = -1;

    const queue = [startIdx];
    let qi = 0;
    let found = false;

    while (qi < queue.length) {
        const cur = queue[qi++];
        const cy = Math.floor(cur / MAP_W);
        const cx = cur % MAP_W;

        const neighbours = [
            cx > 0         ? cur - 1     : -1,
            cx < MAP_W - 1 ? cur + 1     : -1,
            cy > 0         ? cur - MAP_W : -1,
            cy < MAP_H - 1 ? cur + MAP_W : -1
        ];

        for (const ni of neighbours) {
            if (ni === -1) continue;
            if (navGrid[ni] !== 0) continue;
            if (prev[ni] !== -2) continue;
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
        const ty = Math.floor(idx / MAP_W);
        const tx = idx % MAP_W;
        path.unshift({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
        idx = prev[idx];
    }
    return path;
}

function wallCollision(x, y, size) {
    const leftTile   = Math.floor((x - size) / TILE);
    const topTile    = Math.floor((y - size) / TILE);
    const rightTile  = Math.floor((x + size) / TILE);
    const bottomTile = Math.floor((y + size) / TILE);

    for (let tileY = topTile; tileY <= bottomTile; tileY++) {
        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
            if (tileY >= 0 && tileY < MAP_H && tileX >= 0 && tileX < MAP_W &&
                mapTiles[tileY] && mapTiles[tileY][tileX] === 1) {
                return true;
            }
        }
    }
    return false;
}

function playerDash() {
    if (player.dashing || player.dashCooldown > 0) return;

    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup'])    dirY = -1;
    if (keys['s'] || keys['arrowdown'])  dirY = 1;
    if (keys['a'] || keys['arrowleft'])  dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX = 1;

    if (dirX === 0 && dirY === 0) dirX = player.facing;

    const normalise = Math.hypot(dirX, dirY);
    player.dashDirX = dirX / normalise;
    player.dashDirY = dirY / normalise;

    player.dashing = true;
    player.dashTime = DASH_DURATION;
    player.dashCooldown = 120;
}

function playerShoot() {
    if (!mouseDown || player.shootCooldown > 0) return;
    player.shootCooldown = 10;

    projectiles.push({
        x: player.x,
        y: player.y,
        velocityX: Math.cos(player.weaponAngle) * 12,
        velocityY: Math.sin(player.weaponAngle) * 12,
        size: 5,
        framesLeft: 80
    });
}

function spawnEnemy(type) {
    const enemy = ENEMY_TYPES[type];

    let enemyX, enemyY, tries = 0;
    do {
        enemyX = (5 + Math.floor(Math.random() * (MAP_W - 10))) * TILE;
        enemyY = (5 + Math.floor(Math.random() * (MAP_H - 10))) * TILE;
        tries++;
    } while ((Math.hypot(enemyX - player.x, enemyY - player.y) < 300 ||
              wallCollision(enemyX, enemyY, 14)) && tries < 60);

    enemies.push({
        x: enemyX,
        y: enemyY,
        hp: enemy.hp,
        size: enemy.size,
        speed: enemy.speed,
        color: enemy.color,
        hitFlash: 0,
        alive: true,
        type: type,
        animFrame: 0,
        animTimer: Math.floor(Math.random() * ENEMY_TYPES[type].animSpeed),
        path: [],
        pathTimer: Math.floor(Math.random() * 60)
    });
}

function startGame() {
    generateMap();

    pickups = [];
    enemies = [];
    for (let i = 0; i < MAX_ENEMIES; i++) {
        const types = ["basic", "fast", "tank"];
        spawnEnemy(types[Math.floor(Math.random() * types.length)]);
    }

    player.x = (MAP_W * TILE) / 2;
    player.y = (MAP_H * TILE) / 2;
    player.hp = player.maxHp;
    score = 0;
    player.xp = 0;
    player.level = 1;
    gameState = "playing";
}

function updatePlayer() {
    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup'])    dirY = -1;
    if (keys['s'] || keys['arrowdown'])  dirY = 1;
    if (keys['a'] || keys['arrowleft'])  dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX = 1;

    if (dirX !== 0) player.facing = dirX > 0 ? 1 : -1;

    if (player.dashing) {
        player.dashTime--;

        if (player.dashTime % 2 === 0) {
            player.dashTrail.push({ x: player.x, y: player.y, age: 0 });
        }

        if (player.dashTime <= 0) {
            player.dashing = false;
        } else {
            let newX = player.x + player.dashDirX * DASH_SPEED;
            let newY = player.y + player.dashDirY * DASH_SPEED;
            if (!wallCollision(newX, player.y, player.size)) player.x = newX;
            if (!wallCollision(player.x, newY, player.size)) player.y = newY;
        }
    } else {
        const normalise = Math.hypot(dirX, dirY) || 1;
        const moveX = (dirX / normalise) * player.speed;
        const moveY = (dirY / normalise) * player.speed;
        if (!wallCollision(player.x + moveX, player.y, player.size)) player.x += moveX;
        if (!wallCollision(player.x, player.y + moveY, player.size)) player.y += moveY;
    }

    player.x = Math.max(TILE * 2, Math.min(MAP_W * TILE - TILE * 2, player.x));
    player.y = Math.max(TILE * 2, Math.min(MAP_H * TILE - TILE * 2, player.y));

    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.invulnTimer > 0) player.invulnTimer--;

    for (let e of enemies) {
        if (!e.alive) continue;
        if (player.invulnTimer <= 0 &&
            Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
            player.hp = Math.max(0, player.hp - 10);
            player.invulnTimer = 60;
        }
    }

    if (player.hp <= 0) {
        lastScore = score;
        gameState = "gameOver";
    }

    player.weaponAngle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
    playerShoot();
    updatePlayerAnim();
}

function hasLineOfSight(x1, y1, x2, y2, size) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist === 0) return true;
    const steps = Math.ceil(dist / (TILE * 0.4));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        if (wallCollision(cx, cy, size)) return false;
    }
    return true;
}

function updateEnemies() {
    for (let e of enemies) {
        if (!e.alive) continue;

        if (e.pathTimer > 0) {
            e.pathTimer--;
        } else {
            e.path = findPath(e.x, e.y, player.x, player.y);
            e.pathTimer = 60;
        }

        let targetX, targetY;
        if (hasLineOfSight(e.x, e.y, player.x, player.y, e.size)) {
            targetX = player.x;
            targetY = player.y;
            e.path = [];
        } else if (e.path.length > 0) {
            while (e.path.length > 1 &&
                   Math.hypot(e.path[0].x - e.x, e.path[0].y - e.y) < TILE * 0.55) {
                e.path.shift();
            }
            for (let wi = e.path.length - 1; wi > 0; wi--) {
                if (hasLineOfSight(e.x, e.y, e.path[wi].x, e.path[wi].y, e.size)) {
                    e.path.splice(0, wi);
                    break;
                }
            }
            targetX = e.path[0].x;
            targetY = e.path[0].y;
        } else {
            targetX = player.x;
            targetY = player.y;
        }

        // Off-screen enemies move much faster so the player can't kite forever.
        const esx = e.x - camera.x;
        const esy = e.y - camera.y;
        const offScreen = esx < -e.size || esx > canvas.width  + e.size ||
                          esy < -e.size || esy > canvas.height + e.size;
        const speedMult = offScreen ? 3.0 : 1.0;

        const angle = Math.atan2(targetY - e.y, targetX - e.x);
        const mx = Math.cos(angle) * e.speed * speedMult;
        const my = Math.sin(angle) * e.speed * speedMult;
        if (!wallCollision(e.x + mx, e.y, e.size)) e.x += mx;
        if (!wallCollision(e.x, e.y + my, e.size)) e.y += my;

        for (let other of enemies) {
            if (other === e || !other.alive) continue;
            const dx = e.x - other.x;
            const dy = e.y - other.y;
            const dist = Math.hypot(dx, dy);
            const minDist = e.size + other.size;
            if (dist < minDist && dist > 0) {
                const overlap = (minDist - dist) * 0.5;
                const nx = dx / dist, ny = dy / dist;
                const pushX = nx * overlap, pushY = ny * overlap;
                if (!wallCollision(e.x + pushX, e.y, e.size)) e.x += pushX;
                if (!wallCollision(e.x, e.y + pushY, e.size)) e.y += pushY;
                if (!wallCollision(other.x - pushX, other.y, other.size)) other.x -= pushX;
                if (!wallCollision(other.x, other.y - pushY, other.size)) other.y -= pushY;
            }
        }

        if (e.hitFlash > 0) e.hitFlash--;

        e.animTimer--;
        if (e.animTimer <= 0) {
            e.animFrame = (e.animFrame + 1) % enemySprites[e.type].length;
            e.animTimer = ENEMY_TYPES[e.type].animSpeed;
        }
    }
}

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

        for (let e of enemies) {
            if (!e.alive) continue;
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) {
                e.hp--;
                e.hitFlash = 8;
                if (e.hp <= 0) {
                    e.alive = false;
                    score++;
                    pickups.push({ x: e.x, y: e.y, vx: 0, vy: 0, size: 10, type: "xp" });
                    const types = ["basic", "fast", "tank"];
                    spawnEnemy(types[Math.floor(Math.random() * types.length)]);
                }
                projectiles.splice(i, 1);
                break;
            }
        }
    }
}

const XP_ATTRACT_RADIUS = 150;
const XP_ATTRACT_SPEED  = 3;

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (p.vx === undefined) { p.vx = 0; p.vy = 0; }

        const dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < XP_ATTRACT_RADIUS && dist > 0) {
            const pull = XP_ATTRACT_SPEED * (1 - dist / XP_ATTRACT_RADIUS) + 0.5;
            p.vx += (player.x - p.x) / dist * pull * 0.15;
            p.vy += (player.y - p.y) / dist * pull * 0.15;
            const speed = Math.hypot(p.vx, p.vy);
            if (speed > XP_ATTRACT_SPEED) {
                p.vx = (p.vx / speed) * XP_ATTRACT_SPEED;
                p.vy = (p.vy / speed) * XP_ATTRACT_SPEED;
            }
        } else {
            p.vx *= 0.85;
            p.vy *= 0.85;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (dist < player.size + p.size) {
            if (p.type === "xp") {
                player.xp += 5;
                if (player.xp >= player.xpToNextLevel) {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                }
            }
            pickups.splice(i, 1);
        }
    }
}

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

function toScreen(x, y) {
    return { x: x - camera.x, y: y - camera.y };
}

function drawMap() {
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const s = toScreen(x * TILE, y * TILE);
            if (s.x < -TILE || s.x > canvas.width || s.y < -TILE || s.y > canvas.height) continue;

            if (mapTiles[y][x] === 1) {
                ctx.drawImage(wallSprite, s.x, s.y, TILE, TILE);
            } else {
                ctx.drawImage(floorSprite, s.x, s.y, TILE, TILE);
            }
        }
    }
}

function updatePlayerAnim() {
    const moving = keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
                   keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
    const shooting = mouseDown && player.shootCooldown > 6;

    const wa = player.weaponAngle;
    const facingRight = Math.cos(wa) >= 0;
    player.facing = facingRight ? 1 : -1;
    const normAngle = facingRight ? wa : (wa > 0 ? Math.PI - wa : -Math.PI - wa);
    const absV = Math.abs(normAngle);
    let aimDir;
    if      (absV < Math.PI / 8)       aimDir = 'r';
    else if (absV < Math.PI * 3 / 8)   aimDir = normAngle < 0 ? 'diag_up' : 'diag_dn';
    else                               aimDir = normAngle < 0 ? 'u'        : 'diag_dn';

    if (player.dashing) {
        const dx = player.dashDirX, dy = player.dashDirY;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        const diag = adx > 0.3 && ady > 0.3;
        if (diag) {
            playerAnim.frame = dy < 0 ? 'dash_ur' : 'dash_dr';
        } else if (ady > adx) {
            playerAnim.frame = dy < 0 ? 'dash_u' : 'dash_d';
        } else {
            playerAnim.frame = 'dash_h';
        }
        playerAnim.timer = 0;
    } else if (shooting) {
        playerAnim.frame = `shoot_${aimDir}`;
        playerAnim.timer = 8;
    } else if (moving) {
        playerAnim.timer--;
        if (playerAnim.timer <= 0) {
            playerAnim.walkToggle = !playerAnim.walkToggle;
            playerAnim.timer = 10;
        }
        playerAnim.frame = `${playerAnim.walkToggle ? 'walk1' : 'walk2'}_${aimDir}`;
    } else {
        playerAnim.idleTimer = (playerAnim.idleTimer + 1) % 70;
        playerAnim.frame = `${playerAnim.idleTimer < 35 ? 'idle' : 'idle2'}_${aimDir}`;
    }
}

function drawPlayer() {
    const s = toScreen(player.x, player.y);
    const size = player.size * 2;

    // Glow trail
    player.dashTrail = player.dashTrail.filter(p => p.age < 8);
    for (const p of player.dashTrail) {
        p.age++;
        const ps = toScreen(p.x, p.y);
        const alpha = 1 - p.age / 8;
        const radius = size * 0.35 * (1 - p.age / 10);
        const colors = ['#00eeff', '#7060ff', '#ff40ff'];
        const col = colors[Math.floor(p.age / 4) % colors.length];
        ctx.save();
        ctx.globalAlpha = alpha * 0.55;
        ctx.beginPath();
        ctx.arc(ps.x, ps.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }

    const frame  = playerAnim.frame;
    const sprite = playerSprites[frame] || playerSprites['idle_r'];
    const isDash = player.dashing || frame.startsWith('dash');

    ctx.save();
    if (player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.35;
    }

    if (isDash) {
        const dx = player.dashDirX, dy = player.dashDirY;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        const diag  = adx > 0.3 && ady > 0.3;
        const horiz = adx >= ady && !diag;
        const flipX = player.facing === -1;
        const flipDiagX = dx < 0;
        const sc = size / 48;

        if (horiz) {
            const sw = 100 * sc, anchorX = 76 * sc;
            if (flipX) {
                ctx.translate(s.x, 0); ctx.scale(-1, 1);
                ctx.drawImage(sprite, -anchorX, s.y - player.size, sw, size);
            } else {
                ctx.drawImage(sprite, s.x - anchorX, s.y - player.size, sw, size);
            }
        } else if (ady > adx && !diag) {
            const sh = 100 * sc;
            if (dy < 0) {
                ctx.drawImage(sprite, s.x - player.size, s.y - 24 * sc, size, sh);
            } else {
                ctx.drawImage(sprite, s.x - player.size, s.y - 76 * sc, size, sh);
            }
        } else {
            const sd = 84 * sc, anchorX = 60 * sc;
            if (flipDiagX) {
                ctx.translate(s.x, 0); ctx.scale(-1, 1);
                ctx.drawImage(sprite, -anchorX, s.y - (dy < 0 ? 24 : 60) * sc, sd, sd);
            } else {
                ctx.drawImage(sprite, s.x - anchorX, s.y - (dy < 0 ? 24 : 60) * sc, sd, sd);
            }
        }
    } else if (player.facing === -1) {
        ctx.translate(s.x, 0); ctx.scale(-1, 1);
        ctx.drawImage(sprite, -player.size, s.y - player.size, size, size);
    } else {
        ctx.drawImage(sprite, s.x - player.size, s.y - player.size, size, size);
    }

    ctx.restore();
}

function drawEnemies() {
    for (let e of enemies) {
        if (!e.alive) continue;
        const s = toScreen(e.x, e.y);
        const size = e.size * 2;
        const sprite = enemySprites[e.type][e.animFrame];
        const facingLeft = player.x < e.x;

        ctx.save();
        if (e.hitFlash > 0) ctx.filter = 'brightness(10)';
        if (facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -(s.x + e.size), s.y - e.size, size, size);
        } else {
            ctx.drawImage(sprite, s.x - e.size, s.y - e.size, size, size);
        }
        ctx.restore();
    }
}

function drawProjectiles() {
    for (let p of projectiles) {
        const s = toScreen(p.x, p.y);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(p.velocityY, p.velocityX));
        ctx.drawImage(projectileSprite, -p.size, -p.size, p.size * 2, p.size * 2);
        ctx.restore();
    }
}

function drawPickups() {
    for (let p of pickups) {
        const s = toScreen(p.x, p.y);
        if (p.type === "xp") {
            const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.04);
            ctx.save();
            const haloRadius = p.size * 3.5 * pulse;
            const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloRadius);
            halo.addColorStop(0,   'rgba(57, 255, 20, 0.35)');
            halo.addColorStop(0.5, 'rgba(57, 255, 20, 0.12)');
            halo.addColorStop(1,   'rgba(57, 255, 20, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(s.x, s.y, haloRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur  = 18 * pulse;
            if (pickupXpSprite.complete && pickupXpSprite.naturalWidth > 0) {
                ctx.drawImage(pickupXpSprite, s.x - p.size, s.y - p.size, p.size * 2, p.size * 2);
            } else {
                ctx.fillStyle = '#39ff14';
                ctx.beginPath();
                ctx.arc(s.x, s.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else {
            ctx.drawImage(pickupXpSprite, s.x - p.size, s.y - p.size, p.size * 2, p.size * 2);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  VIAL DRAWING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds the bottle interior shape to the current canvas path (already inside
 * ctx.save/restore and translated to vial top-left origin).
 * Used for both clipping and hit-testing.
 * All coordinates are in *source* space (VSRC_W × VSRC_H), scaled via `sc`.
 */
function vialInteriorPath(sc) {
    const ncx = VCX * sc;
    const nW2  = (VNECK_W / 2) * sc;
    const nY1  = VNECK_Y1 * sc;
    const nY2  = VNECK_Y2 * sc;
    const sY1  = VSHOULDER_Y1 * sc;
    const sY2  = VSHOULDER_Y2 * sc;
    const bW2  = (VBODY_W / 2) * sc;
    const bX1  = (VCX - VBODY_W / 2) * sc;
    const bX2  = (VCX + VBODY_W / 2) * sc;
    const bY1  = VBODY_Y1 * sc;
    const bY2  = VBODY_Y2 * sc;
    const br   = VBRAD * sc;

    // Neck rectangle
    ctx.rect(ncx - nW2, nY1, nW2 * 2, nY2 - nY1);

    // Shoulder trapezoid
    ctx.moveTo(ncx - nW2, sY1);
    ctx.lineTo(ncx + nW2, sY1);
    ctx.lineTo(bX2,        sY2);
    ctx.lineTo(bX1,        sY2);
    ctx.closePath();

    // Body rounded rectangle
    ctx.moveTo(bX1 + br, bY1);
    ctx.lineTo(bX2 - br, bY1);
    ctx.arcTo(bX2, bY1,  bX2, bY1 + br, br);
    ctx.lineTo(bX2, bY2 - br);
    ctx.arcTo(bX2, bY2,  bX2 - br, bY2, br);
    ctx.lineTo(bX1 + br, bY2);
    ctx.arcTo(bX1, bY2,  bX1, bY2 - br, br);
    ctx.lineTo(bX1, bY1 + br);
    ctx.arcTo(bX1, bY1,  bX1 + br, bY1, br);
    ctx.closePath();
}

/**
 * Draw a single animated potion vial.
 *
 * @param {number} screenX     - top-left x on screen
 * @param {number} screenY     - top-left y on screen
 * @param {number} fillPercent - 0..1 how full the liquid is
 * @param {object} colors      - { top, mid, bot } CSS colour strings for liquid gradient
 * @param {Image}  glowSprite  - the coloured glow PNG
 * @param {string} label       - text drawn beneath
 */
function drawVial(screenX, screenY, fillPercent, colors, glowSprite, label) {
    const sc   = VIAL_SCALE;          // source → screen scale
    const W    = VSRC_W  * sc;        // screen vial width
    const H    = VSRC_H  * sc;        // screen vial height

    const GW   = (VSRC_W  + 40) * sc;
    const GH   = (VSRC_H  + 40) * sc;

    // ── 1. Outer glow ───────────────────────────────────────────────────────
    const glowPulse = 0.75 + 0.25 * Math.sin(frameCount * 0.04);
    ctx.save();
    ctx.globalAlpha = glowPulse * 0.85;
    ctx.drawImage(glowSprite, screenX - 20 * sc, screenY - 20 * sc, GW, GH);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.translate(screenX, screenY);

    // ── 2. Dark background (empty vial interior) ────────────────────────────
    ctx.drawImage(vialBgSprite, 0, 0, W, H);

    // ── 3. Liquid fill (clipped to bottle interior) ─────────────────────────
    ctx.save();
    ctx.beginPath();
    vialInteriorPath(sc);
    ctx.clip();

    // liquid top Y in screen coords (clamped so it doesn't exceed the neck)
    const liqAreaTop    = VSHOULDER_Y1 * sc;
    const liqAreaBottom = VBODY_Y2     * sc;
    const liqHeight     = (liqAreaBottom - liqAreaTop) * Math.max(0, Math.min(1, fillPercent));
    const liqTopY       = liqAreaBottom - liqHeight;

    // Wave parameters
    const wAmp   = 3.5 * sc;
    const wFreq  = 0.10 / sc;
    const wPhase = frameCount * 0.055;
    const w2Freq = wFreq * 1.6;
    const w2Phase= frameCount * 0.038;

    // Liquid gradient
    const liqGrad = ctx.createLinearGradient(0, liqTopY, 0, liqAreaBottom);
    liqGrad.addColorStop(0,   colors.top);
    liqGrad.addColorStop(0.4, colors.mid);
    liqGrad.addColorStop(1,   colors.bot);

    ctx.fillStyle = liqGrad;
    ctx.beginPath();
    const bodyX1s = (VCX - VBODY_W / 2 - 2) * sc;
    const bodyX2s = (VCX + VBODY_W / 2 + 2) * sc;

    ctx.moveTo(bodyX1s, liqTopY);
    for (let x = bodyX1s; x <= bodyX2s; x += 1) {
        const y = liqTopY
                + Math.sin(x * wFreq  + wPhase)  * wAmp
                + Math.sin(x * w2Freq + w2Phase) * wAmp * 0.45;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(bodyX2s, liqAreaBottom + 4);
    ctx.lineTo(bodyX1s, liqAreaBottom + 4);
    ctx.closePath();
    ctx.fill();

    // Liquid sheen: brighter strip near the wave surface
    const sheenGrad = ctx.createLinearGradient(0, liqTopY, 0, liqTopY + 18 * sc);
    sheenGrad.addColorStop(0,   'rgba(255,255,255,0.22)');
    sheenGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.moveTo(bodyX1s, liqTopY);
    for (let x = bodyX1s; x <= bodyX2s; x += 1) {
        const y = liqTopY
                + Math.sin(x * wFreq  + wPhase)  * wAmp
                + Math.sin(x * w2Freq + w2Phase) * wAmp * 0.45;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(bodyX2s, liqTopY + 18 * sc);
    ctx.lineTo(bodyX1s, liqTopY + 18 * sc);
    ctx.closePath();
    ctx.fill();

    // Bubbles sprite-sheet (4 frames, cycled)
    if (fillPercent > 0.08 && vialBubblesSprite.complete && vialBubblesSprite.naturalWidth > 0) {
        const bubFrame  = Math.floor(frameCount / 7) % 4;
        const bubSrcX   = bubFrame * VSRC_W;
        ctx.globalAlpha = 0.45 * fillPercent;
        ctx.drawImage(vialBubblesSprite, bubSrcX, 0, VSRC_W, VSRC_H, 0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    ctx.restore(); // remove clip

    // ── 4. Glass frame overlay ──────────────────────────────────────────────
    ctx.drawImage(vialFrameSprite, 0, 0, W, H);

    // ── 5. Low-HP flicker: red tint when nearly empty ───────────────────────
    if (colors.bot === '#660008' && fillPercent < 0.25) {
        const flicker = 0.12 + 0.12 * Math.sin(frameCount * 0.35);
        ctx.save();
        ctx.beginPath();
        vialInteriorPath(sc);
        ctx.clip();
        ctx.fillStyle = `rgba(255,0,0,${flicker})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    // ── 6. Label beneath the vial ───────────────────────────────────────────
    ctx.textAlign  = 'center';
    ctx.font       = `bold ${Math.round(13 * sc)}px Arial`;
    ctx.shadowColor = 'black';
    ctx.shadowBlur  = 5;
    ctx.fillStyle  = 'rgba(220,220,255,0.92)';
    ctx.fillText(label, W / 2, H + 18 * sc);
    ctx.shadowBlur  = 0;

    ctx.restore(); // undo translate
}

/**
 * Draw both vials (HP + Dash) stacked vertically on the left side of the screen.
 * Called from drawUI().
 */
function drawVials() {
    const leftPad  = 22;   // distance from left edge of screen
    const topPad   = 170;  // start below the info panel
    const gap      = 30;   // vertical gap between the two vials (includes label space)

    const startX   = leftPad;
    const hpY      = topPad;
    const dashY    = topPad + VIAL_H + gap;

    // ── HP vial ──────────────────────────────────────────────────────────────
    const hpFill = player.hp / player.maxHp;
    const hpColors = hpFill > 0.5
        ? { top: '#ff8888', mid: '#dd2222', bot: '#660008' }
        : hpFill > 0.25
            ? { top: '#ffcc44', mid: '#dd7700', bot: '#883300' }
            : { top: '#ff6633', mid: '#cc2200', bot: '#660008' };

    drawVial(startX, hpY, hpFill, hpColors, vialGlowHpSprite, '❤  HP');

    // ── Dash vial ────────────────────────────────────────────────────────────
    const dashFill  = player.dashCooldown > 0 ? 1 - player.dashCooldown / 120 : 1;
    const dashReady = player.dashCooldown === 0;
    const dashColors = dashReady
        ? { top: '#88ffff', mid: '#22aaff', bot: '#0030bb' }
        : { top: '#44aadd', mid: '#1060cc', bot: '#001888' };

    drawVial(startX, dashY, dashFill, dashColors, vialGlowDashSprite, '⚡ DASH');

    // "READY" flash above the dash vial when fully recharged
    if (dashReady) {
        const readyAlpha = 0.55 + 0.45 * Math.abs(Math.sin(frameCount * 0.07));
        ctx.save();
        ctx.globalAlpha  = readyAlpha;
        ctx.fillStyle    = '#00ffff';
        ctx.font         = `bold ${Math.round(11 * VIAL_SCALE)}px Arial`;
        ctx.textAlign    = 'center';
        ctx.shadowColor  = '#00ffff';
        ctx.shadowBlur   = 8;
        ctx.fillText('READY', startX + VIAL_W / 2, dashY - 6);
        ctx.restore();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN UI  (left panel: level / score / xp / instructions)
// ─────────────────────────────────────────────────────────────────────────────
function drawUI() {
    const padding    = 20;
    const panelWidth = 240;
    const barWidth   = 200;

    // Measure how tall the panel needs to be (no HP/dash rows any more)
    // Level + Score + XP bar + instructions = ~130px
    const panelHeight = 150;

    // Background panel
    ctx.fillStyle  = "black";
    ctx.globalAlpha = 0.55;
    ctx.fillRect(padding - 12, padding - 12, panelWidth, panelHeight);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "lightgray";
    ctx.lineWidth   = 2;
    ctx.strokeRect(padding - 12, padding - 12, panelWidth, panelHeight);

    ctx.textAlign = "left";

    // Level
    ctx.fillStyle = "white";
    ctx.font      = "bold 18px Arial";
    ctx.fillText("Level " + player.level, padding, padding + 5);

    // Score
    ctx.font      = "14px Arial";
    ctx.fillStyle = "lightgray";
    ctx.fillText("Score: " + score, padding, padding + 25);

    // XP bar
    const xpY = padding + 40;
    ctx.fillStyle = "black";
    ctx.fillRect(padding, xpY, barWidth, 14);
    ctx.fillStyle = "deepskyblue";
    ctx.fillRect(padding, xpY, barWidth * (player.xp / player.xpToNextLevel), 14);
    ctx.strokeStyle = "white";
    ctx.lineWidth   = 1;
    ctx.strokeRect(padding, xpY, barWidth, 14);
    ctx.fillStyle  = "lightgray";
    ctx.font       = "11px monospace";
    ctx.fillText(player.xp + " / " + player.xpToNextLevel, padding + 6, xpY + 11);

    // Instructions
    const tutY = xpY + 28;
    ctx.font      = "12px Arial";
    ctx.fillStyle = "silver";
    ctx.fillText("Move: WASD / Arrows", padding, tutY);
    ctx.fillText("Shoot: Mouse Click",  padding, tutY + 16);
    ctx.fillText("Dash: Space",          padding, tutY + 32);

    // Debug position (bottom-left)
    ctx.font      = "12px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(
        "X: " + Math.floor(player.x) + "  Y: " + Math.floor(player.y),
        20, canvas.height - 20
    );

    // ── Right-side vials ─────────────────────────────────────────────────────
    drawVials();
}

// ─────────────────────────────────────────────────────────────────────────────
//  MENU HELPERS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function getSelectCursorButton() {
    const w = 160, h = 36;
    return { x: canvas.width / 2 - w / 2, y: canvas.height / 2 + 30, w, h };
}

function getBackButton() {
    const w = 120, h = 36;
    return { x: canvas.width / 2 - w / 2, y: canvas.height / 2 + 150, w, h };
}

function getCursorBoxes() {
    const boxSize = 52, gap = 12;
    const totalW  = cursorSprites.length * (boxSize + gap) - gap;
    const startX  = canvas.width / 2 - totalW / 2;
    const startY  = canvas.height / 2 + 50;
    return cursorSprites.map((_, i) => ({
        x: startX + i * (boxSize + gap), y: startY, w: boxSize, h: boxSize
    }));
}

function drawMenu() {
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (menuPage === "main") {
        ctx.fillStyle  = "white";
        ctx.font       = "bold 64px Arial";
        ctx.textAlign  = "center";
        ctx.fillText("Castanzakannon", canvasW / 2, canvasH / 2 - 80);

        ctx.font      = "20px Arial";
        ctx.fillStyle = "silver";
        ctx.fillText("Press ENTER or Click to Start", canvasW / 2, canvasH / 2 - 20);

        const btn = getSelectCursorButton();
        ctx.fillStyle   = "#222";
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = "grey";
        ctx.lineWidth   = 1;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle  = "silver";
        ctx.font       = "16px Arial";
        ctx.textAlign  = "center";
        ctx.fillText("Select Cursor  >", btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);

    } else if (menuPage === "cursors") {
        ctx.fillStyle  = "white";
        ctx.font       = "bold 40px Arial";
        ctx.textAlign  = "center";
        ctx.fillText("Select Cursor", canvasW / 2, canvasH / 2 - 80);

        const boxes = getCursorBoxes();
        for (let i = 0; i < cursorSprites.length; i++) {
            const b = boxes[i];
            const isSelected = i === selectedCursor;
            ctx.fillStyle   = isSelected ? "lightblue" : "black";
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.drawImage(cursorSprites[i].img, b.x + 4, b.y + 4, b.w - 8, b.h - 8);
            ctx.strokeStyle = isSelected ? "red" : "grey";
            ctx.lineWidth   = isSelected ? 2 : 1;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle  = isSelected ? "white" : "silver";
            ctx.font       = "11px Arial";
            ctx.textAlign  = "center";
            ctx.fillText(cursorSprites[i].name, b.x + b.w / 2, b.y + b.h + 14);
        }

        const backBtn = getBackButton();
        ctx.fillStyle   = "#222";
        ctx.fillRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
        ctx.strokeStyle = "grey";
        ctx.lineWidth   = 1;
        ctx.strokeRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
        ctx.fillStyle  = "silver";
        ctx.font       = "16px Arial";
        ctx.textAlign  = "center";
        ctx.fillText("<  Back", backBtn.x + backBtn.w / 2, backBtn.y + backBtn.h / 2 + 6);
    }

    drawCursor();
}

function drawGameOver() {
    const canvasW = canvas.width, canvasH = canvas.height;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.fillStyle  = "crimson";
    ctx.font       = "bold 64px Arial";
    ctx.textAlign  = "center";
    ctx.fillText("GAME OVER", canvasW / 2, canvasH / 2 - 60);

    ctx.font      = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + lastScore, canvasW / 2, canvasH / 2 - 10);

    ctx.font      = "20px Arial";
    ctx.fillStyle = "silver";
    ctx.fillText("Press ENTER or Click to return to Menu", canvasW / 2, canvasH / 2 + 40);
}

// Main game loop
function gameLoop() {
    frameCount++;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    } else {
        updatePlayer();
        updateEnemies();
        updateProjectiles();
        updatePickups();
        updateCamera();

        drawMap();
        drawPlayer();
        drawEnemies();
        drawProjectiles();
        drawPickups();
        drawUI();
        drawCursor();
    }
    requestAnimationFrame(gameLoop);
}

function drawCursor() {
    const sprite = cursorSprites[selectedCursor].img;
    if (!sprite.complete || !sprite.naturalWidth) return;
    ctx.drawImage(sprite, mouseX, mouseY, 32, 32);
}

generateMap();
gameLoop();