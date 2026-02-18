// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Constants
const TILE = 48;
const MAP_W = 80;
const MAP_H = 60;
const DASH_SPEED = 16;
const DASH_DURATION = 15; // Quick 0.25 second dash

// Game state
let keys = {};
let camera = { x: 0, y: 0 };
let mapTiles = [];
let frameCount = 0;

// Player object
let player = {
    x: MAP_W * TILE / 2,
    y: MAP_H * TILE / 2,
    size: 20,
    speed: 4.55,
    color: '#4444ff',
    dashing: false,
    dashTime: 0,
    dashDirX: 0,
    dashDirY: 0,
    dashCooldown: 0,
    facing: 1
};

// Input handling
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') { // Spacebar for dash
        e.preventDefault();
        playerDash();
    }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Map generation
function generateMap() {
    mapTiles = [];
    for (let y = 0; y < MAP_H; y++) {
        mapTiles[y] = [];
        for (let x = 0; x < MAP_W; x++) {
            mapTiles[y][x] = 0; // Empty tile
        }
    }
    
    // Border walls
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (x < 2 || x >= MAP_W-2 || y < 2 || y >= MAP_H-2) {
                mapTiles[y][x] = 1;
            }
        }
    }
    
    // Random interior walls
    const numStructures = 8;
    for (let s = 0; s < numStructures; s++) {
        const sx = 6 + Math.floor(Math.random() * (MAP_W - 14));
        const sy = 6 + Math.floor(Math.random() * (MAP_H - 14));
        const sw = 3 + Math.floor(Math.random() * 4);
        const sh = 3 + Math.floor(Math.random() * 4);
        
        if (Math.random() > 0.5) {
            // Solid block
            for (let y = sy; y < sy + sh && y < MAP_H-2; y++) {
                for (let x = sx; x < sx + sw && x < MAP_W-2; x++) {
                    mapTiles[y][x] = 1;
                }
            }
        } else {
            // L-shape
            for (let y = sy; y < sy + sh && y < MAP_H-2; y++) {
                mapTiles[y][sx] = 1;
            }
            for (let x = sx; x < sx + sw && x < MAP_W-2; x++) {
                mapTiles[sy][x] = 1;
            }
        }
    }
    
    // Clear spawn area
    const spX = Math.floor(MAP_W / 2);
    const spY = Math.floor(MAP_H / 2);
    for (let y = spY - 5; y <= spY + 5; y++) {
        for (let x = spX - 5; x <= spX + 5; x++) {
            if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) {
                mapTiles[y][x] = 0;
            }
        }
    }
}

// Check wall collision
function isInWall(x, y, size) {
    const tx1 = Math.floor((x - size) / TILE);
    const ty1 = Math.floor((y - size) / TILE);
    const tx2 = Math.floor((x + size) / TILE);
    const ty2 = Math.floor((y + size) / TILE);
    
    for (let ty = ty1; ty <= ty2; ty++) {
        for (let tx = tx1; tx <= tx2; tx++) {
            if (ty >= 0 && ty < MAP_H && tx >= 0 && tx < MAP_W && mapTiles[ty] && mapTiles[ty][tx] === 1) {
                return true; // Collision detected
            }
        }
    }
    return false;
}

// Dash mechanic
function playerDash() {
    if (player.dashing || player.dashCooldown > 0) return;
    
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;
    
    if (dx === 0 && dy === 0) dx = player.facing; // Dash forward if no input
    
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    player.dashDirX = dx / mag;
    player.dashDirY = dy / mag;
    player.dashing = true;
    player.dashTime = DASH_DURATION;
    player.dashCooldown = 120; // 2 seconds at 60fps
}

// Update player
function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;
    
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
    
    if (player.dashing) {
        // Dash movement
        player.dashTime--;
        if (player.dashTime <= 0) {
            player.dashing = false;
        } else {
            let newX = player.x + player.dashDirX * DASH_SPEED;
            let newY = player.y + player.dashDirY * DASH_SPEED;
            
            if (!isInWall(newX, player.y, player.size)) {
                player.x = newX;
            }
            if (!isInWall(player.x, newY, player.size)) {
                player.y = newY;
            }
        }
    } else {
        // Normal movement
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        const moveX = (dx / mag) * player.speed;
        const moveY = (dy / mag) * player.speed;
        
        if (!isInWall(player.x + moveX, player.y, player.size)) {
            player.x += moveX;
        }
        if (!isInWall(player.x, player.y + moveY, player.size)) {
            player.y += moveY;
        }
    }
    
    // Keep player inside map bounds
    player.x = Math.max(TILE * 2, Math.min(MAP_W * TILE - TILE * 2, player.x));
    player.y = Math.max(TILE * 2, Math.min(MAP_H * TILE - TILE * 2, player.y));
    
    // Update cooldowns
    if (player.dashCooldown > 0) player.dashCooldown--;
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
            const s = toScreen(x * TILE, y * TILE);
            
            // Skip if off-screen
            if (s.x < -TILE || s.x > canvas.width || s.y < -TILE || s.y > canvas.height) {
                continue;
            }
            
            if (mapTiles[y][x] === 1) {
                // Wall
                ctx.fillStyle = '#555';
                ctx.fillRect(s.x, s.y, TILE, TILE);
                ctx.strokeStyle = '#444';
                ctx.strokeRect(s.x, s.y, TILE, TILE);
            } else {
                // Floor
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(s.x, s.y, TILE, TILE);
            }
        }
    }
}

// Draw player
function drawPlayer() {
    const s = toScreen(player.x, player.y);
    
    // Draw player as square
    ctx.fillStyle = player.dashing ? '#88ff88' : player.color;
    ctx.fillRect(s.x - player.size, s.y - player.size, player.size * 2, player.size * 2);
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x - player.size, s.y - player.size, player.size * 2, player.size * 2);
    
    // Direction indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(s.x + player.facing * 8, s.y - 3, 8, 6);
}

// Draw UI
function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    // Instructions
    ctx.fillText('WASD / Arrow Keys - Move', 10, 25);
    ctx.fillText('SPACE - Dash', 10, 50);
    
    // Dash cooldown
    const cooldownText = player.dashCooldown > 0 
        ? 'Dash: ' + (player.dashCooldown / 60).toFixed(1) + 's' 
        : 'Dash: Ready';
    ctx.fillText(cooldownText, 10, 75);
    
    // Position info (for debugging)
    ctx.fillText('X: ' + Math.floor(player.x) + ' Y: ' + Math.floor(player.y), 10, canvas.height - 10);
}

// Main game loop
function gameLoop() {
    frameCount++;
    
    // Clear screen
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update
    updatePlayer();
    updateCamera();
    
    // Draw
    drawMap();
    drawPlayer();
    drawUI();
    
    requestAnimationFrame(gameLoop);
}

// Initialize and start
generateMap();
gameLoop();