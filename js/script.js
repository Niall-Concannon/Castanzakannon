// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Sprites
const playerSprite = new Image();
playerSprite.src = 'assets/sprites/player_placeholder.png';

const wallSprite = new Image();
wallSprite.src = 'assets/sprites/wall_placeholder.png';

const floorSprite = new Image();
floorSprite.src = 'assets/sprites/floor_placeholder.png';

const enemySprites = {
    basic: new Image(),
    fast:  new Image(),
    tank:  new Image()
};
enemySprites.basic.src = 'assets/sprites/enemy_basic_placeholder.png';
enemySprites.fast.src  = 'assets/sprites/enemy_fast_placeholder.png';
enemySprites.tank.src  = 'assets/sprites/enemy_tank_placeholder.png';

const projectileSprite = new Image();
projectileSprite.src = 'assets/sprites/projectile_placeholder.png';

const pickupXpSprite = new Image();
pickupXpSprite.src = 'assets/sprites/pickup_xp_placeholder.png';

// TODO: replace with actual cursor image path
const cursorSprite = new Image();
// cursorSprite.src = 'assets/sprites/cursor.png';    // Uncomment and set path when cursor sprite is ready

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
        color: "green"
    },
    fast: {
        hp: 2,
        size: 12,
        speed: 3.5,
        color: "yellow"
    },
    tank: {
        hp: 8,
        size: 20,
        speed: 1.2,
        color: "red"
    }
};

// Game state
let keys = {};
let camera = { x: 0, y: 0 };
let mapTiles = [];
let frameCount = 0;
let gameState = "menu";
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
    facing: 1, // 1 = right, -1 = left
    shootCooldown: 0,
    weaponAngle: 0,
    hp: 100, // current hp
    maxHp: 100,
    invulnTimer: 0,
    xp: 0,
    xpToNextLevel: 100,
    level: 1
};

// Input handling
// KEYBOARD
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true; // true when key is pressed

    if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === "menu" || gameState === "gameOver") {
            startGame();
        } else {
            playerDash();
        }
    }
});

window.addEventListener('keyup', e => { 
    keys[e.key.toLowerCase()] = false; // false when key is released
});

// MOUSE
window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener("mousedown", () => {
    mouseDown = true;
    if (gameState === "menu" || gameState === "gameOver") startGame(); // if mouse clicks then start the game (TEMPORARY)
});

window.addEventListener("mouseup", () => {
    mouseDown = false
});

// Map generation
function generateMap() {
    mapTiles = [];

    // Create empty map with border walls
    for (let i = 0; i < MAP_H; i++) {
        mapTiles[i] = []; // new row

        for (let j = 0; j < MAP_W; j++) {
            // Border walls - 2 tiles thick
            if (j < 2 || j >= MAP_W - 2 || i < 2 || i >= MAP_H - 2) {
                mapTiles[i][j] = 1; // Wall
            } else {
                mapTiles[i][j] = 0; // Empty tile
            }
        }
    }
    
    // Random interior walls
    const numStructures = 64;

    for (let i = 0; i < numStructures; i++) {
        // Structure starting point - range is 6 tiles from edge both sides
        const structureX = 6 + Math.floor(Math.random() * (MAP_W - 14));
        const structureY = 6 + Math.floor(Math.random() * (MAP_H - 14));

        // Structure size - 3 to 6 tiles
        const structureW = 3 + Math.floor(Math.random() * 4);
        const structureH = 3 + Math.floor(Math.random() * 4);
        
        // 50% chance for solid block or L-shape
        if (Math.random() > 0.5) { // Solid block
            for (let j = structureY; j < structureY + structureH && j < MAP_H - 2; j++) {
                for (let k = structureX; k < structureX + structureW && k < MAP_W - 2; k++) {
                    mapTiles[j][k] = 1;
                }
            }
        } else { // L-shape
            for (let j = structureY; j < structureY + structureH && j < MAP_H - 2; j++) {
                mapTiles[j][structureX] = 1; // Vertical part
            }
            for (let k = structureX; k < structureX + structureW && k < MAP_W - 2; k++) {
                mapTiles[structureY][k] = 1; // Horizontal part
            }
        }
    }
    
    // Clear spawn area
    const spawnX = Math.floor(MAP_W / 2);
    const spawnY = Math.floor(MAP_H / 2);

    // Clear 11x11 area around spawn point
    for (let i = spawnY - 5; i <= spawnY + 5; i++) {
        for (let j = spawnX - 5; j <= spawnX + 5; j++) {
            if (i >= 0 && i < MAP_H && j >= 0 && j < MAP_W) { // Check boundaries just in case
                mapTiles[i][j] = 0; // 0 = empty tile
            }
        }
    }

    buildNavGrid(); // Rebuild nav grid whenever the map changes
}

// Build a flat boolean grid for BFS pathfinding (0 = open, 1 = wall)
function buildNavGrid() {
    navGrid = new Uint8Array(MAP_W * MAP_H);
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            navGrid[y * MAP_W + x] = mapTiles[y][x] === 1 ? 1 : 0;
        }
    }
}

// BFS from world pos (fromX,fromY) to (toX,toY). Returns array of world-space waypoints (tile centres).
function findPath(fromX, fromY, toX, toY) {
    const sx = Math.floor(fromX / TILE);
    const sy = Math.floor(fromY / TILE);
    const gx = Math.floor(toX / TILE);
    const gy = Math.floor(toY / TILE);

    if (sx === gx && sy === gy) return [];

    // prev stores the index of each tile's parent, -1 for start, -2 for unvisited
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

        // 4-directional neighbours
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

    // Reconstruct as world-space tile-centre coords, excluding start tile
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

// Check wall collision
function wallCollision(x, y, size) {
    // Players hit box
    const leftTile = Math.floor((x - size) / TILE);
    const topTile = Math.floor((y - size) / TILE);
    const rightTile = Math.floor((x + size) / TILE);
    const bottomTile = Math.floor((y + size) / TILE);
    
    // Look at all tiles the player is touching and check if any are walls
    for (let tileY = topTile; tileY <= bottomTile; tileY++) {
        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
            if (tileY >= 0 && tileY < MAP_H && tileX >= 0 && tileX < MAP_W && mapTiles[tileY] && mapTiles[tileY][tileX] === 1) {
                return true; // Collision detected
            }
        }
    }
    return false;
}

// Dash mechanic
function playerDash() {
    if (player.dashing || player.dashCooldown > 0) return;
    
    // Dash direction
    let dirX = 0, dirY = 0;
    if (keys['w'] || keys['arrowup']) dirY = -1;
    if (keys['s'] || keys['arrowdown']) dirY = 1;
    if (keys['a'] || keys['arrowleft']) dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX = 1;
    
    if (dirX === 0 && dirY === 0) dirX = player.facing; // No input then dash in facing direction
    
    // Normalise direction so diagonal isnt faster than straight
    const normalise = Math.hypot(dirX, dirY);
    player.dashDirX = dirX / normalise;
    player.dashDirY = dirY / normalise;

    player.dashing = true;
    player.dashTime = DASH_DURATION;
    player.dashCooldown = 120; // 2 seconds at 60fps
}

// Shooting mechanic
function playerShoot() {
    if (!mouseDown || player.shootCooldown > 0) return;
    player.shootCooldown = 10; // Every 10 frames

    projectiles.push({ // add to an projectile array
        x: player.x,
        y: player.y,
        velocityX: Math.cos(player.weaponAngle) * 12, // 12 is projectile speed
        velocityY: Math.sin(player.weaponAngle) * 12,
        size: 5,
        framesLeft: 80 // LAG PREVENTION
    });
}

// Spawn enemy
function spawnEnemy(type) {
    const enemy = ENEMY_TYPES[type];
    
    let enemyX, enemyY, tries = 0;

    // Loop to find position is within 300px of player, not in wall and not tried over 60 times (infinite loop prevention)
    do {
        // Find position 5 tiles from edge to avoid spawning in walls
        enemyX = (5 + Math.floor(Math.random() * (MAP_W - 10))) * TILE;
        enemyY = (5 + Math.floor(Math.random() * (MAP_H - 10))) * TILE;
        tries++;
    } while ((Math.hypot(enemyX - player.x, enemyY - player.y) < 300 || wallCollision(enemyX, enemyY, 14)) && tries < 60);

    // Add enemies to array
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
        path: [],
        pathTimer: Math.floor(Math.random() * 60) // stagger so all enemies don't BFS on the same frame
    });
}

// Start game
function startGame() {
    generateMap();
    
    pickups = [];
    enemies = [];
    for (let i = 0; i < MAX_ENEMIES; i++) {
        const types = ["basic", "fast", "tank"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        spawnEnemy(randomType);
    }

    player.x = (MAP_W * TILE) / 2;
    player.y = (MAP_H * TILE) / 2;
    player.hp = player.maxHp;
    score = 0;
    player.xp = 0;
    player.level = 1;
    gameState = "playing";
}

// Update player
function updatePlayer() {
    let dirX = 0, dirY = 0;

    if (keys['w'] || keys['arrowup']) dirY = -1;
    if (keys['s'] || keys['arrowdown']) dirY = 1;
    if (keys['a'] || keys['arrowleft']) dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX = 1;
    
    if (dirX !== 0) player.facing = dirX > 0 ? 1 : -1;
    
    // DASHING
    if (player.dashing) {
        player.dashTime--; // Reduce dash time

        if (player.dashTime <= 0) {
            player.dashing = false; // Stop dashing when time runs out
        } else {
            let newX = player.x + player.dashDirX * DASH_SPEED;
            let newY = player.y + player.dashDirY * DASH_SPEED;
            
            // Move if no collision
            if (!wallCollision(newX, player.y, player.size)) {
                player.x = newX;
            }
            if (!wallCollision(player.x, newY, player.size)) {
                player.y = newY;
            }
        }
    } else {// Normal movement
        // Normalise movement so diagonal isnt faster than straight
        const normalise = Math.hypot(dirX, dirY) || 1;
        const moveX = (dirX / normalise) * player.speed;
        const moveY = (dirY / normalise) * player.speed;
        
        // Move if no collision
        if (!wallCollision(player.x + moveX, player.y, player.size)) {
            player.x += moveX;
        }
        if (!wallCollision(player.x, player.y + moveY, player.size)) {
            player.y += moveY;
        }
    }
    
    // Keep player inside map bounds
    player.x = Math.max(TILE * 2, Math.min(MAP_W * TILE - TILE * 2, player.x));
    player.y = Math.max(TILE * 2, Math.min(MAP_H * TILE - TILE * 2, player.y));
    
    // Update cooldowns
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.invulnTimer > 0) player.invulnTimer--;

    // Enemy collision
    for (let e of enemies) {
        if (!e.alive) continue; // skip dead enemies

        if (player.invulnTimer <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
            player.hp = Math.max(0, player.hp - 10);
            player.invulnTimer = 60;
        }
    }

    if (player.hp <= 0) {
        lastScore = score;
        gameState = "gameOver";
    }

    // Calculate angle from player center to mouse position
    player.weaponAngle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);

    playerShoot();
}

// Cast a ray in world space - returns true if the straight line between two points is wall-free
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

// Update enemies
function updateEnemies() {
    for (let e of enemies) {
        if (!e.alive) continue;

        // --- PATH REFRESH ---
        if (e.pathTimer > 0) {
            e.pathTimer--;
        } else {
            e.path = findPath(e.x, e.y, player.x, player.y);
            e.pathTimer = 60;
        }

        // --- TARGET SELECTION ---
        // If we have direct line of sight to the player, ditch the grid and go straight
        let targetX, targetY;
        if (hasLineOfSight(e.x, e.y, player.x, player.y, e.size)) {
            targetX = player.x;
            targetY = player.y;
            e.path = []; // clear stale path so we don't snap back to grid next frame
        } else if (e.path.length > 0) {
            // Advance past waypoints already reached
            while (e.path.length > 1 && Math.hypot(e.path[0].x - e.x, e.path[0].y - e.y) < TILE * 0.55) {
                e.path.shift();
            }
            // Look-ahead: skip to the furthest waypoint we can see directly
            for (let wi = e.path.length - 1; wi > 0; wi--) {
                if (hasLineOfSight(e.x, e.y, e.path[wi].x, e.path[wi].y, e.size)) {
                    e.path.splice(0, wi); // drop all waypoints before the visible one
                    break;
                }
            }
            targetX = e.path[0].x;
            targetY = e.path[0].y;
        } else {
            targetX = player.x;
            targetY = player.y;
        }

        // --- MOVEMENT ---
        const angle = Math.atan2(targetY - e.y, targetX - e.x);
        const mx = Math.cos(angle) * e.speed;
        const my = Math.sin(angle) * e.speed;

        if (!wallCollision(e.x + mx, e.y, e.size)) e.x += mx;
        if (!wallCollision(e.x, e.y + my, e.size)) e.y += my;

        // --- SEPARATION: push apart enemies that overlap ---
        for (let other of enemies) {
            if (other === e || !other.alive) continue;
            const dx = e.x - other.x;
            const dy = e.y - other.y;
            const dist = Math.hypot(dx, dy);
            const minDist = e.size + other.size;
            if (dist < minDist && dist > 0) {
                const overlap = (minDist - dist) * 0.5;
                const nx = dx / dist;
                const ny = dy / dist;
                const pushX = nx * overlap;
                const pushY = ny * overlap;
                if (!wallCollision(e.x + pushX, e.y, e.size)) e.x += pushX;
                if (!wallCollision(e.x, e.y + pushY, e.size)) e.y += pushY;
                if (!wallCollision(other.x - pushX, other.y, other.size)) other.x -= pushX;
                if (!wallCollision(other.x, other.y - pushY, other.size)) other.y -= pushY;
            }
        }

        if (e.hitFlash > 0) e.hitFlash--;
    }
}

// Update projectiles
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.framesLeft--; // reduce frames left for projectile (LAG PREVENTION)

        // if projectile hits wall or runs out of time then remove it
        if (wallCollision(p.x, p.y, p.size) || p.framesLeft <= 0) {
            projectiles.splice(i, 1); // remove projectile from array
            continue;
        }

        // Check collision with enemies
        for (let e of enemies) {
            if (!e.alive) continue;

            // distance between enemy and projectile - if less than sum of their sizes then hit
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) {
                e.hp--;
                e.hitFlash = 8;
                if (e.hp <= 0) // dead
                { 
                    e.alive = false;
                    score++;

                    // Spawn pickups
                    pickups.push({
                        x: e.x,
                        y: e.y,
                        size: 10,
                        type: "xp" // Might change later for different pickup types
                    });

                    const types = ["basic", "fast", "tank"];
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    spawnEnemy(randomType);
                }

                projectiles.splice(i, 1); // remove projectile from array
                break;
            }
        }
    }
}

// Update pickups
function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];

        // Check collision with player
        if (Math.hypot(player.x - p.x, player.y - p.y) < player.size + p.size) {

            // type of pickup - currently only xp but can add more types later
            if (p.type === "xp") {
                player.xp += 5;

                // Level up
                if (player.xp >= player.xpToNextLevel)
                {
                    player.xp -= player.xpToNextLevel;
                    player.level++;
                }
            }

            // Remove pickup
            pickups.splice(i, 1);
        }
    }
}

// Update camera
function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

// World to screen coordinates
function toScreen(x, y) {
    return {
        x: x - camera.x,
        y: y - camera.y
    };
}

// Draw map
function drawMap() {
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            // Convert world coordinates to screen coordinates
            const s = toScreen(x * TILE, y * TILE);
            
            // Skip if off-screen (performance optimization)
            if (s.x < -TILE || s.x > canvas.width || s.y < -TILE || s.y > canvas.height) {
                continue;
            }
            
            if (mapTiles[y][x] === 1) {
                ctx.drawImage(wallSprite, s.x, s.y, TILE, TILE);
            } else {
                ctx.drawImage(floorSprite, s.x, s.y, TILE, TILE);
            }
        }
    }
}

// Draw player
function drawPlayer() {
    const s = toScreen(player.x, player.y);
    const size = player.size * 2;

    ctx.save();

    // Flash white when dashing //placeholder effect
    if (player.dashing) {
        ctx.filter = 'brightness(3)';
    }

    // Flip sprite horizontally when facing left
    if (player.facing === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(playerSprite, -(s.x + player.size), s.y - player.size, size, size);
    } else {
        ctx.drawImage(playerSprite, s.x - player.size, s.y - player.size, size, size);
    }

    ctx.restore();
}

// Draw enemies
function drawEnemies() {
    for (let e of enemies) {
        if (!e.alive) continue; // Skip dead enemies

        const s = toScreen(e.x, e.y);
        const size = e.size * 2;
        const sprite = enemySprites[e.type];
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

// Draw projectiles
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

// Draw pickups
function drawPickups() {
    for (let p of pickups) {
        const s = toScreen(p.x, p.y);
        ctx.drawImage(pickupXpSprite, s.x - p.size, s.y - p.size, p.size * 2, p.size * 2);
    }
}

// Draw UI
function drawUI() {
    const padding = 20;
    const panelWidth = 240;
    const panelHeight = 180;
    const barWidth = 200;

    // Background Panel
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(padding - 12, padding - 12, panelWidth, panelHeight);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "lightgray";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding - 12, padding - 12, panelWidth, panelHeight);

    ctx.textAlign = "left";

    // Level
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Level " + player.level, padding, padding + 5);

    // Score
    ctx.font = "14px Arial";
    ctx.fillStyle = "lightgray";
    ctx.fillText("Score: " + score, padding, padding + 25);

    // HP
    const hpY = padding + 45;

    ctx.fillStyle = "black";
    ctx.fillRect(padding, hpY, barWidth, 22);

    const hpPercent = player.hp / player.maxHp;

    let hpColor;
    if (hpPercent > 0.6) hpColor = "mediumseagreen";
    else if (hpPercent > 0.3) hpColor = "gold";
    else hpColor = "crimson";

    ctx.fillStyle = hpColor;
    ctx.fillRect(padding, hpY, barWidth * hpPercent, 22);

    ctx.strokeStyle = "white";
    ctx.strokeRect(padding, hpY, barWidth, 22);

    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    ctx.fillText(
        player.hp + " / " + player.maxHp,
        padding + 8,
        hpY + 15
    );

    // XP
    const xpY = hpY + 34;

    ctx.fillStyle = "black";
    ctx.fillRect(padding, xpY, barWidth, 14);

    ctx.fillStyle = "deepskyblue";
    ctx.fillRect(
        padding,
        xpY,
        barWidth * (player.xp / player.xpToNextLevel),
        14
    );

    ctx.strokeStyle = "white";
    ctx.strokeRect(padding, xpY, barWidth, 14);

    ctx.fillStyle = "lightgray";
    ctx.font = "11px monospace";
    ctx.fillText(
        player.xp + " / " + player.xpToNextLevel,
        padding + 6,
        xpY + 11
    );

    // Dash Cooldown
    const dashY = xpY + 30;

    ctx.font = "13px Arial";
    ctx.fillStyle = player.dashCooldown > 0 ? "salmon" : "lightgreen";

    const dashText = player.dashCooldown > 0
        ? "Dash: " + (player.dashCooldown / 60).toFixed(1) + "s"
        : "Dash Ready";

    ctx.fillText(dashText, padding, dashY);

    // Instructions
    const tutorialY = dashY + 22;

    ctx.font = "12px Arial";
    ctx.fillStyle = "silver";
    ctx.fillText("Move: WASD / Arrows", padding, tutorialY);
    ctx.fillText("Shoot: Mouse Click", padding, tutorialY + 16);
    ctx.fillText("Dash: Space", padding, tutorialY + 32);

    // Position info (for debugging)
    ctx.font = "12px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(
        "X: " + Math.floor(player.x) +
        "  Y: " + Math.floor(player.y),
        20,
        canvas.height - 20
    );
}

// Draw menu - TEMPORARY DESIGN
function drawMenu() {
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Title
    ctx.fillStyle = "white";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Castanzakannon", canvasW / 2, canvasH / 2 - 60);

    // Instructions
    ctx.font = "20px Arial";
    ctx.fillStyle = "silver";
    ctx.fillText("Press ENTER or Click to Start", canvasW / 2, canvasH / 2);
}

// Draw game over screen
function drawGameOver() {
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // "Game Over"
    ctx.fillStyle = "crimson";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvasW / 2, canvasH / 2 - 60);

    // Score
    ctx.font = "28px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + lastScore, canvasW / 2, canvasH / 2 - 10);

    // Restart instructions
    ctx.font = "20px Arial";
    ctx.fillStyle = "silver";
    ctx.fillText("Press ENTER or Click to Restart", canvasW / 2, canvasH / 2 + 40);
}

// Main game loop
function gameLoop() {
    frameCount++; // Frame count for time (LATER USE)
    
    // Clear screen
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    } else {
        // Update
        updatePlayer();
        updateEnemies();
        updateProjectiles();
        updatePickups();
        updateCamera();
        
        // Draw
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

// Initialize and start
function drawCursor() {
    if (!cursorSprite.complete || !cursorSprite.src) return;

    // TODO: adjust hotspot offset to match the cursor image's tip point
    const hotspotX = 0; // pixels from left edge of image to the tip
    const hotspotY = 0; // pixels from top edge of image to the tip
    const width = 32;   // display width
    const height = 32;  // display height

    ctx.drawImage(cursorSprite, mouseX - hotspotX, mouseY - hotspotY, width, height);
}

// Initialize and start
generateMap();
gameLoop();