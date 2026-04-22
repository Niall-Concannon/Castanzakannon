// Shared coordinate and camera helpers are kept here.




// To Screen keeps the game logic moving.
function toScreen(x, y) {
    return { x: Math.round(x - camera.x), y: Math.round(y - camera.y) };
}

// Update Camera keeps the game logic moving.
function updateCamera(alpha) {
    const a  = alpha ?? 1;
    const px = (player.prevX ?? player.x) + (player.x - (player.prevX ?? player.x)) * a;
    const py = (player.prevY ?? player.y) + (player.y - (player.prevY ?? player.y)) * a;
    camera.x = px - canvas.width  / 2;
    camera.y = py - canvas.height / 2;

    if (screenShake > 0) {
    const shake = screenShake * 0.8;
    camera.x += (Math.random() - 0.5) * shake;
    camera.y += (Math.random() - 0.5) * shake;
    screenShake--;
}
}

// Save Prev Positions keeps the game logic moving.
function savePrevPositions() {
    player.prevX = player.x;
    player.prevY = player.y;
    for (const e of enemies)     { e.prevX = e.x; e.prevY = e.y; }
    for (const p of projectiles) { p.prevX = p.x; p.prevY = p.y; }
    for (const p of enemyProjectiles) { p.prevX = p.x; p.prevY = p.y; }
    for (const t of tumorTurrets) { t.prevX = t.x; t.prevY = t.y; }
    for (const p of pickups)     { p.prevX = p.x; p.prevY = p.y; }
    for (const chest of chests)  { chest.prevX = chest.x; chest.prevY = chest.y; }
}

