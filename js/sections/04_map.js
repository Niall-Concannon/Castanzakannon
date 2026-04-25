// Map generation pathing and wall collision logic live here.




// Generate Map keeps the game logic moving.
function generateMap() {
    levelDecorations = [];
    mapTiles = [];
    for (let i = 0; i < MAP_H; i++) {
        mapTiles[i] = [];
        for (let j = 0; j < MAP_W; j++) {
            mapTiles[i][j] = (j < 2 || j >= MAP_W - 2 || i < 2 || i >= MAP_H - 2) ? TILE_WALL : TILE_FLOOR;
        }
    }

    const normalWallAttempts = currentArenaLevel === 5 ? 50 : 64;
    for (let i = 0; i < normalWallAttempts; i++) {
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

    clearSpawnArea();


    resetTumorTurrets();

    if (currentArenaLevel === 5) {
        placeLevel5SausageWalls();
        placeLevel5TumorTurrets();
    }

    applyCornerTiles();

    clearSpawnArea();

    if (currentArenaLevel === 4) {
        placeLevel4MushroomTrees();
    }

    buildNavGrid();
}

// Generate Void Boss Room keeps the game logic moving.
function generateVoidBossRoom() {
    levelDecorations = [];
    mapTiles = [];
    for (let y = 0; y < MAP_H; y++) {
        mapTiles[y] = [];
        for (let x = 0; x < MAP_W; x++) {
            const onOuterBorder = x < 2 || x >= MAP_W - 2 || y < 2 || y >= MAP_H - 2;
            const onArenaBorder = x < 12 || x >= MAP_W - 12 || y < 10 || y >= MAP_H - 10;
            mapTiles[y][x] = (onOuterBorder || onArenaBorder) ? TILE_WALL : TILE_FLOOR;
        }
    }

    const cx = Math.floor(MAP_W / 2);
    const cy = Math.floor(MAP_H / 2);
    for (let y = cy - 3; y <= cy + 3; y++) {
        for (let x = cx - 4; x <= cx + 4; x++) {
            if (y < 2 || y >= MAP_H - 2 || x < 2 || x >= MAP_W - 2) continue;
            mapTiles[y][x] = TILE_FLOOR;
        }
    }

    tumorTurrets = [];
    buildNavGrid();
}

// Is Level4 Decoration Tile Valid keeps the game logic moving.
function isLevel4DecorationTileValid(tx, ty) {
    if (!isInteriorTile(tx, ty)) return false;
    if (mapTiles[ty]?.[tx] !== TILE_FLOOR) return false;

    const cx = Math.floor(MAP_W / 2);
    const cy = Math.floor(MAP_H / 2);
    if (Math.abs(tx - cx) <= LEVEL4_MUSHROOM_SPAWN_BUFFER && Math.abs(ty - cy) <= LEVEL4_MUSHROOM_SPAWN_BUFFER) {
        return false;
    }

    for (const deco of levelDecorations) {
        const dx = deco.tx - tx;
        const dy = deco.ty - ty;
        if (Math.abs(dx) <= LEVEL4_MUSHROOM_MIN_GAP_TILES && Math.abs(dy) <= LEVEL4_MUSHROOM_MIN_GAP_TILES) return false;
    }

    return true;
}

// Try Place Level4 Mushroom Tree keeps the game logic moving.
function tryPlaceLevel4MushroomTree(tx, ty) {
    if (!isLevel4DecorationTileValid(tx, ty)) return false;

    const variantIndex = Math.floor(Math.random() * 4);
    const wallTall = variantIndex >= 2 ? 3 : 2;
    const drawHeight = wallTall * TILE;
    const drawWidth = wallTall === 3 ? 90 : 72;
    const jitterX = Math.round((Math.random() - 0.5) * 14);
    const jitterY = Math.round((Math.random() - 0.5) * 10);

    levelDecorations.push({
        type: 'mushroomTree',
        variantIndex,
        wallTall,
        drawWidth,
        drawHeight,
        tx,
        ty,
        x: tx * TILE + TILE * 0.5 + jitterX,
        y: ty * TILE + TILE * 0.5 + jitterY,
    });

    return true;
}

// Place Level4 Mushroom Trees keeps the game logic moving.
function placeLevel4MushroomTrees() {
    const clusterAttempts = LEVEL4_MUSHROOM_CLUSTER_COUNT * 8;
    let clustersPlaced = 0;

    for (let i = 0; i < clusterAttempts && clustersPlaced < LEVEL4_MUSHROOM_CLUSTER_COUNT; i++) {
        const cx = 4 + Math.floor(Math.random() * (MAP_W - 8));
        const cy = 4 + Math.floor(Math.random() * (MAP_H - 8));
        if (!isLevel4DecorationTileValid(cx, cy)) continue;

        let plantedInCluster = 0;
        const clusterSize = 5 + Math.floor(Math.random() * 6);
        for (let j = 0; j < clusterSize; j++) {
            const tx = cx + Math.floor(Math.random() * 7) - 3;
            const ty = cy + Math.floor(Math.random() * 7) - 3;
            if (tryPlaceLevel4MushroomTree(tx, ty)) plantedInCluster++;
        }

        if (plantedInCluster > 0) clustersPlaced++;
    }

    const singleAttempts = LEVEL4_MUSHROOM_SINGLE_COUNT * 6;
    let singlesPlaced = 0;
    for (let i = 0; i < singleAttempts && singlesPlaced < LEVEL4_MUSHROOM_SINGLE_COUNT; i++) {
        const tx = 4 + Math.floor(Math.random() * (MAP_W - 8));
        const ty = 4 + Math.floor(Math.random() * (MAP_H - 8));
        if (tryPlaceLevel4MushroomTree(tx, ty)) singlesPlaced++;
    }

    levelDecorations.sort((a, b) => a.y - b.y);
}

// Clear Spawn Area keeps the game logic moving.
function clearSpawnArea(radius = SPAWN_CLEAR_RADIUS) {
    const cx = Math.floor(MAP_W / 2);
    const cy = Math.floor(MAP_H / 2);

    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) continue;
            mapTiles[y][x] = TILE_FLOOR;
        }
    }

    if (!tumorTurrets.length) return;

    tumorTurrets = tumorTurrets.filter(t => {
        const tx = Math.floor(t.x / TILE);
        const ty = Math.floor(t.y / TILE);
        return Math.abs(tx - cx) > radius || Math.abs(ty - cy) > radius;
    });
}

// Reset Tumor Turrets keeps the game logic moving.
function resetTumorTurrets() {
    tumorTurrets = [];
}

// Is Interior Tile keeps the game logic moving.
function isInteriorTile(tx, ty) {
    return tx >= 2 && tx < MAP_W - 2 && ty >= 2 && ty < MAP_H - 2;
}

// Chain Cell At keeps the game logic moving.
function chainCellAt(originX, originY, dx, dy, step) {
    return { x: originX + dx * step, y: originY + dy * step };
}

// Distance Score To Nearest Solid keeps the game logic moving.
function distanceScoreToNearestSolid(tx, ty, maxRadius = 14) {
    if (!isInteriorTile(tx, ty)) return 0;

    for (let r = 1; r <= maxRadius; r++) {
        for (let y = ty - r; y <= ty + r; y++) {
            for (let x = tx - r; x <= tx + r; x++) {
                if (!isInteriorTile(x, y)) continue;
                if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) continue;
                if (mapTiles[y][x] !== TILE_FLOOR) return r;
            }
        }
    }

    return maxRadius;
}

// Can Place Sausage Chain keeps the game logic moving.
function canPlaceSausageChain(originX, originY, dx, dy, len, minGap) {
    for (let step = 0; step < len; step++) {
        const cell = chainCellAt(originX, originY, dx, dy, step);
        if (!isInteriorTile(cell.x, cell.y)) return false;

        for (let y = cell.y - minGap; y <= cell.y + minGap; y++) {
            for (let x = cell.x - minGap; x <= cell.x + minGap; x++) {
                if (!isInteriorTile(x, y)) continue;
                if (mapTiles[y][x] !== TILE_FLOOR) return false;
            }
        }
    }

    return true;
}

// Place Sausage Chain keeps the game logic moving.
function placeSausageChain(originX, originY, dx, dy, len) {
    for (let step = 0; step < len; step++) {
        const cell = chainCellAt(originX, originY, dx, dy, step);
        mapTiles[cell.y][cell.x] = TILE_SAUSAGE_WALL;
    }
}

// Place Level5 Sausage Walls keeps the game logic moving.
function placeLevel5SausageWalls() {
    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
    ];

    const targetChains = 10;
    const minGap = 3;
    const candidateChecks = 140;
    const maxPlacementRounds = 120;
    let placed = 0;

    for (let round = 0; round < maxPlacementRounds && placed < targetChains; round++) {
        let best = null;
        let bestScore = -1;


        for (let i = 0; i < candidateChecks; i++) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const len = 5 + Math.floor(Math.random() * 7);
            const startX = 4 + Math.floor(Math.random() * (MAP_W - 8));
            const startY = 4 + Math.floor(Math.random() * (MAP_H - 8));
            const end = chainCellAt(startX, startY, dir.dx, dir.dy, len - 1);
            if (!isInteriorTile(end.x, end.y)) continue;
            if (!canPlaceSausageChain(startX, startY, dir.dx, dir.dy, len, minGap)) continue;

            let score = Infinity;
            for (let step = 0; step < len; step++) {
                const cell = chainCellAt(startX, startY, dir.dx, dir.dy, step);
                score = Math.min(score, distanceScoreToNearestSolid(cell.x, cell.y));
            }

            if (score > bestScore) {
                bestScore = score;
                best = { startX, startY, dx: dir.dx, dy: dir.dy, len };
            }
        }

        if (!best) continue;
        placeSausageChain(best.startX, best.startY, best.dx, best.dy, best.len);
        placed++;
    }
}

// Has Solid Tile Within keeps the game logic moving.
function hasSolidTileWithin(tx, ty, radius) {
    for (let y = ty - radius; y <= ty + radius; y++) {
        for (let x = tx - radius; x <= tx + radius; x++) {
            if (!isInteriorTile(x, y)) continue;
            if (mapTiles[y][x] !== TILE_FLOOR) return true;
        }
    }
    return false;
}

// Can Place Tumor Turret At keeps the game logic moving.
function canPlaceTumorTurretAt(tx, ty) {
    if (!isInteriorTile(tx, ty)) return false;
    if (mapTiles[ty][tx] !== TILE_FLOOR) return false;

    const cx = Math.floor(MAP_W / 2);
    const cy = Math.floor(MAP_H / 2);
    if (Math.abs(tx - cx) <= 5 && Math.abs(ty - cy) <= 5) return false;

    const wx = tx * TILE + TILE * 0.5;
    const wy = ty * TILE + TILE * 0.5;
    for (const t of tumorTurrets) {
        if (Math.hypot(t.x - wx, t.y - wy) < TILE * 2.1) return false;
    }

    return !hasSolidTileWithin(tx, ty, 1);
}

// Place Level5 Tumor Turrets keeps the game logic moving.
function placeLevel5TumorTurrets() {
    const maxAttempts = 800;

    for (let attempt = 0; attempt < maxAttempts && tumorTurrets.length < TUMOR_TURRETS_LEVEL5; attempt++) {
        const tx = 4 + Math.floor(Math.random() * (MAP_W - 8));
        const ty = 4 + Math.floor(Math.random() * (MAP_H - 8));
        if (!canPlaceTumorTurretAt(tx, ty)) continue;

        const x = tx * TILE + TILE * 0.5;
        const y = ty * TILE + TILE * 0.5;
        const preload = Math.floor(Math.random() * TUMOR_CHARGE_FRAMES * 0.55);

        tumorTurrets.push({
            x,
            y,
            prevX: x,
            prevY: y,
            size: TUMOR_SIZE,
            hp: TUMOR_HP,
            maxHp: TUMOR_HP,
            chargeFrames: preload,
            cooldownFrames: 0,
            shootAnimFrames: 0,
            hitFlash: 0,
            hpBarTimer: 0,
            alive: true,
        });
    }
}

// Is Solid Tile Type keeps the game logic moving.
function isSolidTileType(tileType) {
    return tileType !== TILE_FLOOR;
}

// Is Solid Tile At keeps the game logic moving.
function isSolidTileAt(tx, ty) {
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
    return isSolidTileType(mapTiles[ty]?.[tx] ?? TILE_FLOOR);
}

// Is Sausage Wall Tile At keeps the game logic moving.
function isSausageWallTileAt(tx, ty) {
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
    return mapTiles[ty]?.[tx] === TILE_SAUSAGE_WALL;
}

// Is Sausage Wall Vertical At keeps the game logic moving.
function isSausageWallVerticalAt(tx, ty) {
    const north = isSausageWallTileAt(tx, ty - 1);
    const south = isSausageWallTileAt(tx, ty + 1);
    const west = isSausageWallTileAt(tx - 1, ty);
    const east = isSausageWallTileAt(tx + 1, ty);
    return (north || south) && !(west || east);
}

// Apply Corner Tiles keeps the game logic moving.
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

// Build Nav Grid keeps the game logic moving.
function buildNavGrid() {
    navGrid = new Uint8Array(MAP_W * MAP_H);
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const tileType = mapTiles[y][x];
            if (tileType === TILE_WALL || tileType === TILE_SAUSAGE_WALL) {

                navGrid[y * MAP_W + x] = 1;
                continue;
            }


            navGrid[y * MAP_W + x] = 0;
        }
    }
}

// Get Nav Waypoint For Tile keeps the game logic moving.
function getNavWaypointForTile(tx, ty) {
    const tileType = mapTiles[ty]?.[tx] ?? TILE_FLOOR;
    let fx = 0.5, fy = 0.5;


    if (tileType === TILE_CORNER_NW) { fx = 0.74; fy = 0.74; }
    else if (tileType === TILE_CORNER_NE) { fx = 0.26; fy = 0.74; }
    else if (tileType === TILE_CORNER_SW) { fx = 0.74; fy = 0.26; }
    else if (tileType === TILE_CORNER_SE) { fx = 0.26; fy = 0.26; }

    return { x: tx * TILE + TILE * fx, y: ty * TILE + TILE * fy };
}

// Find Path keeps the game logic moving.
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

// Wall Collision keeps the game logic moving.
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

// Find Nearest Free Position keeps the game logic moving.
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

// Rescue Player From Wall keeps the game logic moving.
function rescuePlayerFromWall() {
    const safePos = findNearestFreePosition(player.x, player.y, player.size);
    if (!safePos) return;

    player.x = safePos.x;
    player.y = safePos.y;
    player.prevX = safePos.x;
    player.prevY = safePos.y;
    applyPlayerDamage(DASH_WALL_STUCK_DAMAGE);
}

// Point Inside Solid Tile keeps the game logic moving.
function pointInsideSolidTile(px, py, tileX, tileY, tileType) {
    const lx = px - tileX;
    const ly = py - tileY;
    if (lx < 0 || lx > TILE || ly < 0 || ly > TILE) return false;

    if (tileType === TILE_WALL) return true;
    if (tileType === TILE_SAUSAGE_WALL) {
        const tx = Math.floor(tileX / TILE);
        const ty = Math.floor(tileY / TILE);
        const vertical = isSausageWallVerticalAt(tx, ty);
        const cx = TILE / 2;
        const stripMin = cx - SAUSAGE_INSET + SAUSAGE_RAIL_INSET;
        const stripMax = cx + SAUSAGE_INSET - SAUSAGE_RAIL_INSET;
        if (vertical) return lx >= stripMin && lx <= stripMax;
        return ly >= stripMin && ly <= stripMax;
    }
    if (tileType === TILE_CORNER_NW) return lx + ly <= TILE - CORNER_RAIL_INSET;
    if (tileType === TILE_CORNER_NE) return lx >= ly + CORNER_RAIL_INSET;
    if (tileType === TILE_CORNER_SW) return lx + CORNER_RAIL_INSET <= ly;
    if (tileType === TILE_CORNER_SE) return lx + ly >= TILE + CORNER_RAIL_INSET;

    return false;
}

// Get Top Polygon keeps the game logic moving.
function getTopPolygon(tileType) {
    if (tileType === TILE_CORNER_NW) return [{ x: 0, y: 0 }, { x: TILE, y: 0 }, { x: 0, y: TILE }];
    if (tileType === TILE_CORNER_NE) return [{ x: 0, y: 0 }, { x: TILE, y: 0 }, { x: TILE, y: TILE }];
    if (tileType === TILE_CORNER_SW) return [{ x: 0, y: 0 }, { x: 0, y: TILE }, { x: TILE, y: TILE }];
    if (tileType === TILE_CORNER_SE) return [{ x: TILE, y: 0 }, { x: TILE, y: TILE }, { x: 0, y: TILE }];
    return [{ x: 0, y: 0 }, { x: TILE, y: 0 }, { x: TILE, y: TILE }, { x: 0, y: TILE }];
}

// Draw Wall Face keeps the game logic moving.
function drawWallFace(sx, sy, ax, ay, bx, by, depth, sprite, shade) {

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

// Draw Wall Face Corner keeps the game logic moving.
function drawWallFaceCorner(sx, sy, ax, ay, bx, by, depth, sprite, shade) {

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

// Draw Wall Face Oriented keeps the game logic moving.
function drawWallFaceOriented(sx, sy, ax, ay, bx, by, depth, sprite, shade, rotate90 = false) {
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

    if (rotate90) {
        ctx.translate(sx + TILE / 2, sy + (TILE + depth) / 2);
        ctx.rotate(Math.PI / 2);
        drawMapSprite(sprite, -TILE / 2, -(TILE + depth) / 2, TILE, TILE + depth);
    } else {
        drawMapSprite(sprite, sx, sy, TILE, TILE + depth);
    }
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

// Draw Wall Tile With Faces keeps the game logic moving.
function drawWallTileWithFaces(tileX, tileY, tileType) {
    const s  = toScreen(tileX * TILE, tileY * TILE);
    const FH = WALL_FACE_HEIGHT;
    const T  = TILE;
    const I  = CORNER_RAIL_INSET;
    const sausageInset = SAUSAGE_INSET;
    const sausageFaceDepth = Math.max(8, FH - 4);


    const southOpen = !isSolidTileAt(tileX, tileY + 1);

    switch (tileType) {
        case TILE_WALL:

            if (southOpen)
                drawWallFace(s.x, s.y, 0, T, T, T, FH, currentMapTheme.wallFace, 'rgba(0,0,0,0.32)');
            break;

        case TILE_SAUSAGE_WALL:
            {
            const isVertical = isSausageWallVerticalAt(tileX, tileY);
                const cx = T / 2;
                const stripMin = cx - sausageInset;
                const stripMax = cx + sausageInset;

                if (southOpen) {
                    const sausageFaceSprite = currentMapTheme.sausageFace ?? currentMapTheme.wallFace;
                    if (isVertical) {
                        drawWallFaceOriented(
                            s.x,
                            s.y,
                            stripMin,
                            T,
                            stripMax,
                            T,
                            sausageFaceDepth,
                            sausageFaceSprite,
                            'rgba(0,0,0,0.32)',
                            true
                        );
                    } else {
                        drawWallFaceOriented(
                            s.x,
                            s.y,
                            0,
                            stripMax,
                            T,
                            stripMax,
                            sausageFaceDepth,
                            sausageFaceSprite,
                            'rgba(0,0,0,0.32)'
                        );
                    }
                }
            }
            break;

        case TILE_CORNER_NW:

            drawWallFaceCorner(s.x, s.y, T, 0, 0, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;

        case TILE_CORNER_NE:

            drawWallFaceCorner(s.x, s.y, 0, 0, T, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;

        case TILE_CORNER_SW:

            if (southOpen)
                drawWallFaceCorner(s.x, s.y, 0, T, T, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;

        case TILE_CORNER_SE:

            if (southOpen)
                drawWallFaceCorner(s.x, s.y, 0, T, T, T, FH, currentMapTheme.cornerFace, 'rgba(0,0,0,0.2)');
            break;
    }


    const top = getTopPolygon(tileType);
    if (tileType === TILE_SAUSAGE_WALL) {
        const isVertical = isSausageWallVerticalAt(tileX, tileY);
        const cx = T / 2;
        const stripMin = cx - sausageInset;
        const stripMax = cx + sausageInset;

        top.length = 0;
        if (isVertical) {
            top.push(
                { x: stripMin, y: 0 },
                { x: stripMax, y: 0 },
                { x: stripMax, y: T },
                { x: stripMin, y: T }
            );
        } else {
            top.push(
                { x: 0, y: stripMin },
                { x: T, y: stripMin },
                { x: T, y: stripMax },
                { x: 0, y: stripMax }
            );
        }
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.x + top[0].x, s.y + top[0].y);
    for (let i = 1; i < top.length; i++) ctx.lineTo(s.x + top[i].x, s.y + top[i].y);
    ctx.closePath();
    ctx.clip();
    const topSprite = tileType === TILE_SAUSAGE_WALL
        ? (currentMapTheme.sausageWall ?? currentMapTheme.wall)
        : currentMapTheme.wall;
    if (tileType === TILE_SAUSAGE_WALL) {
        const isVertical = isSausageWallVerticalAt(tileX, tileY);

        if (isVertical) {
            ctx.translate(s.x + T / 2, s.y + T / 2);
            ctx.rotate(Math.PI / 2);
            drawMapSprite(topSprite, -T / 2, -T / 2, T, T);
        } else {
            drawMapSprite(topSprite, s.x, s.y, T, T);
        }
    } else {
        drawMapSprite(topSprite, s.x, s.y, T, T);
    }
    ctx.restore();
}

// Draw Map Sprite keeps the game logic moving.
function drawMapSprite(sprite, x, y, w, h) {
    ctx.drawImage(sprite, x, y, w, h);
    const tint = MAP_THEME_TINT[currentMapThemeId];
    if (!tint) return;
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
}

// Draw Level Decorations keeps the game logic moving.
function drawLevelDecorations() {
    if (!levelDecorations.length) return;

    const mushrooms = currentMapTheme.mushroomTrees;
    if (!mushrooms || !mushrooms.length) return;

    for (const deco of levelDecorations) {
        if (deco.type !== 'mushroomTree') continue;
        const sprite = mushrooms[deco.variantIndex % mushrooms.length];
        if (!sprite) continue;

        const width = deco.drawWidth ?? (deco.wallTall === 3 ? 90 : 72);
        const height = deco.drawHeight ?? (deco.wallTall * TILE);
        const worldX = deco.x - width * 0.5;
        const worldY = deco.y - height + TILE * 0.5;
        const s = toScreen(worldX, worldY);
        const sx = Math.round(s.x);
        const sy = Math.round(s.y);

        if (sx > canvas.width + width || sx < -width || sy > canvas.height + height || sy < -height) continue;
        drawMapSprite(sprite, sx, sy, width, height);
    }
}

// Draw Map keeps the game logic moving.
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


    drawLevelDecorations();
}

