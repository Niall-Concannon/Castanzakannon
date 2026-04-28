// Canvas setup, shared constants, and sprite loading live in this file.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.willChange = 'transform';
canvas.style.transform = 'translateZ(0)';
canvas.style.imageRendering = 'pixelated';
document.body.style.background = '#000000';
document.body.style.overflow = 'hidden';

const devTestWaveControl = document.createElement('div');
devTestWaveControl.id = 'devTestWaveControl';

const devTestWaveLabel = document.createElement('label');
devTestWaveLabel.id = 'devTestWaveLabel';
devTestWaveLabel.htmlFor = 'devTestWaveSelect';
devTestWaveLabel.textContent = 'Dev Waves';

const devTestWaveSelect = document.createElement('select');
devTestWaveSelect.id = 'devTestWaveSelect';
devTestWaveSelect.setAttribute('aria-label', 'Dev Test Wave Count');

devTestWaveControl.appendChild(devTestWaveLabel);
devTestWaveControl.appendChild(devTestWaveSelect);
document.body.appendChild(devTestWaveControl);

const audioControlPanel = document.createElement('div');
audioControlPanel.id = 'audioControlPanel';

const musicVolumeLabel = document.createElement('label');
musicVolumeLabel.id = 'musicVolumeLabel';
musicVolumeLabel.htmlFor = 'musicVolumeSlider';

const musicVolumeSlider = document.createElement('input');
musicVolumeSlider.type = 'range';
musicVolumeSlider.id = 'musicVolumeSlider';
musicVolumeSlider.min = '0';
musicVolumeSlider.max = '100';
musicVolumeSlider.step = '1';
musicVolumeSlider.setAttribute('aria-label', 'Music Volume');

const sfxVolumeLabel = document.createElement('label');
sfxVolumeLabel.id = 'sfxVolumeLabel';
sfxVolumeLabel.htmlFor = 'sfxVolumeSlider';

const sfxVolumeSlider = document.createElement('input');
sfxVolumeSlider.type = 'range';
sfxVolumeSlider.id = 'sfxVolumeSlider';
sfxVolumeSlider.min = '0';
sfxVolumeSlider.max = '100';
sfxVolumeSlider.step = '1';
sfxVolumeSlider.setAttribute('aria-label', 'Game Audio Volume');

audioControlPanel.appendChild(musicVolumeLabel);
audioControlPanel.appendChild(musicVolumeSlider);
audioControlPanel.appendChild(sfxVolumeLabel);
audioControlPanel.appendChild(sfxVolumeSlider);
document.body.appendChild(audioControlPanel);






const TILE          = 48;
const MAP_W         = 80;
const MAP_H         = 60;
const TILE_FLOOR    = 0;
const TILE_WALL     = 1;
const TILE_CORNER_NW = 2;
const TILE_CORNER_NE = 3;
const TILE_CORNER_SW = 4;
const TILE_CORNER_SE = 5;
const TILE_SAUSAGE_WALL = 6;
const WALL_FACE_HEIGHT = 14;
const CORNER_RAIL_INSET = 12;
const SAUSAGE_INSET = 16;
const SAUSAGE_RAIL_INSET = 0;
const TUMOR_TURRETS_LEVEL5 = 12;
const TUMOR_SIZE = 20;
const TUMOR_HP = 14;
const TUMOR_RANGE = 760;
const TUMOR_CHARGE_FRAMES = 80;
const TUMOR_COOLDOWN_FRAMES = 30;
const TUMOR_SHOOT_ANIM_FRAMES = 12;
const TUMOR_PROJECTILE_SPEED = 6;
const TUMOR_PROJECTILE_SIZE = 16;
const TUMOR_PROJECTILE_DAMAGE = 12;
const TUMOR_PROJECTILE_FRAMES = 170;
const SNIPER_RANGE = 620;
const SNIPER_MIN_RANGE = 300;
const SNIPER_CHARGE_FRAMES = 62;
const SNIPER_COOLDOWN_FRAMES = 68;
const SNIPER_SHOOT_ANIM_FRAMES = 10;
const SNIPER_PROJECTILE_SPEED = 13.5;
const SNIPER_PROJECTILE_SIZE = 11;
const SNIPER_PROJECTILE_DAMAGE = 8;
const SNIPER_PROJECTILE_FRAMES = 170;
const VOID_BOSS_TRIGGER_RADIUS = 34;
const VOID_BOSS_XP_REWARDS = {
    1: 120,
    2: 180,
    3: 250,
    4: 330,
    5: 420,
};
const NECROMANCER_BOSS_XP_REWARDS = {
    1: 130,
    2: 190,
    3: 265,
    4: 350,
    5: 445,
};
const VOID_BURST_DASH_LOCK_FRAMES = 480;
const VOID_MAIN_PROJECTILE_SPEED = 10.2;
const VOID_MAIN_PROJECTILE_SIZE = 12;
const VOID_MAIN_PROJECTILE_DAMAGE = 15;
const VOID_MAIN_PROJECTILE_FRAMES = 180;
const VOID_BURST_PROJECTILE_SPEED = 14.8;
const VOID_BURST_PROJECTILE_SIZE = 20;
const VOID_BURST_PROJECTILE_DAMAGE = 19;
const VOID_BURST_PROJECTILE_FRAMES = 140;
const VOID_SPIKE_PROJECTILE_SPEED = 9.4;
const VOID_SPIKE_PROJECTILE_SIZE = 12;
const VOID_SPIKE_PROJECTILE_DAMAGE = 12;
const VOID_SPIKE_PROJECTILE_FRAMES = 95;
const VOID_SKULL_PROJECTILE_SPEED = 4.2;
const VOID_SKULL_PROJECTILE_SIZE = 14;
const VOID_SKULL_PROJECTILE_DAMAGE = 11;
const VOID_SKULL_PROJECTILE_FRAMES = 210;
const VOID_WAVE_AOE_DAMAGE = 24;
const VOID_WAVE_AOE_MAX_RADIUS = 170;
const VOID_WAVE_AOE_FRAMES = 54;
const NECROMANCER_BOLT_PROJECTILE_SPEED = 8.8;
const NECROMANCER_BOLT_PROJECTILE_SIZE = 13;
const NECROMANCER_BOLT_PROJECTILE_DAMAGE = 30;
const NECROMANCER_BOLT_PROJECTILE_FRAMES = 160;
const NECROMANCER_ORB_PROJECTILE_SPEED = 6.6;
const NECROMANCER_ORB_PROJECTILE_SIZE = 20;
const NECROMANCER_ORB_PROJECTILE_DAMAGE = 30;
const NECROMANCER_ORB_PROJECTILE_FRAMES = 320;
const NECROMANCER_RIFT_PROJECTILE_SPEED = 10;
const NECROMANCER_RIFT_PROJECTILE_SIZE = 12;
const NECROMANCER_RIFT_PROJECTILE_DAMAGE = 15;
const NECROMANCER_RIFT_PROJECTILE_FRAMES = 110;
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
const SPAWN_CLEAR_RADIUS = 4;
const SPAWN_RING_INSET = 70;
const ENEMY_OFFSCREEN_DESPAWN_FRAMES = 150;
const ENEMY_OFFSCREEN_MARGIN = 120;
const LEVEL1_POT_CLUSTER_COUNT = 45;
const LEVEL1_POT_SINGLE_COUNT = 62;
const LEVEL1_POT_BORDER_COUNT = 54;
const LEVEL1_POT_MIN_GAP_TILES = 0;
const LEVEL1_POT_SPAWN_BUFFER = SPAWN_CLEAR_RADIUS + 2;
const LEVEL1_SKULL_CANDLE_COUNT = 18;
const LEVEL1_SKULL_CANDLE_MIN_GAP_TILES = 6;
const LEVEL1_SKULL_CANDLE_POT_MIN_GAP_TILES = 6;
const LEVEL4_MUSHROOM_CLUSTER_COUNT = 20;
const LEVEL4_MUSHROOM_SINGLE_COUNT = 45;
const LEVEL4_MUSHROOM_MIN_GAP_TILES = 1;
const LEVEL4_MUSHROOM_SPAWN_BUFFER = SPAWN_CLEAR_RADIUS + 2;
const RAIL_RADIUS = 52;
const GUN_W = 48;
const GUN_H = 18;

const FIXED_STEP = 1000 / 60;
const SPLASH_FADE_DURATION_MS = 1500;
const MENU_TITLE_FONT_FAMILY = '"Orbitron", "Segoe UI", sans-serif';
const MENU_UI_FONT_FAMILY = '"Rajdhani", "Trebuchet MS", sans-serif';
const MENU_TEXT_COLORS = {
    title: '#f4d27c',
    titleShadow: 'rgba(255, 176, 71, 0.28)',
    subtitle: '#e1edf8',
    selectedCharacter: '#bfe9d4',
    loadoutHeader: '#90d7ff',
    systemHeader: '#ffd58c',
};

// ── Weapon Loadouts ─────────────────────────────────────────────────────────
const WEAPON_LOADOUTS = [
    {
        id: 'assault_rifle',
        name: 'Assault Rifle',
        spritePath: 'assets/sprites/guns/assault_rifle.png',
        accentColor: '#4fc3f7',
        tagline: 'Balanced all-rounder',
        stats: {
            'Damage':    '★★★☆☆',
            'Fire Rate': '★★★☆☆',
            'Ammo':      '★★★☆☆',
            'Range':     '★★★☆☆',
        },
        description: 'The standard loadout. Solid in every category with no glaring weaknesses.',
        apply(p) {
            p.weaponType      = 'assault_rifle';
            p.bulletDamage    = 1;
            p.fireRateMult    = 1;
            p.weaponSpread    = 0.10;
            p.weaponPellets   = 1;
            p.weaponSpeed     = 12;
            p.weaponFrames    = 80;
            p.weaponAmmoMax   = 120;
            p.weaponAmmoRegen = 12;
            p.weaponShotCost  = 1;
        },
    },
    {
        id: 'smg',
        name: 'SMG',
        spritePath: 'assets/sprites/guns/smg.png',
        accentColor: '#a5d6a7',
        tagline: 'Rapid fire spray',
        stats: {
            'Damage':    '★★☆☆☆',
            'Fire Rate': '★★★★★',
            'Ammo':      '★★★★☆',
            'Range':     '★★☆☆☆',
        },
        description: 'Blazing fire rate with decent ammo. Low damage per shot but shreds at close range.',
        apply(p) {
            p.weaponType      = 'smg';
            p.bulletDamage    = 0.6;
            p.fireRateMult    = 2.2;
            p.weaponSpread    = 0.18;
            p.weaponPellets   = 1;
            p.weaponSpeed     = 11;
            p.weaponFrames    = 60;
            p.weaponAmmoMax   = 140;
            p.weaponAmmoRegen = 7;
            p.weaponShotCost  = 1;
        },
    },
    {
        id: 'shotgun',
        name: 'Shotgun',
        spritePath: 'assets/sprites/guns/shotgun.png',
        accentColor: '#ff7043',
        tagline: 'Devastating close-range burst',
        stats: {
            'Damage':    '★★★★★',
            'Fire Rate': '★★☆☆☆',
            'Ammo':      '★★☆☆☆',
            'Range':     '★★☆☆☆',
        },
        description: 'Fires a wide spread of pellets. Punishing up close, weak at range.',
        apply(p) {
            p.weaponType      = 'shotgun';
            p.bulletDamage    = 1.1;
            p.fireRateMult    = 0.5;
            p.weaponSpread    = 0.55;
            p.weaponPellets   = 7;
            p.weaponSpeed     = 10;
            p.weaponFrames    = 55;
            p.weaponAmmoMax   = 80;
            p.weaponAmmoRegen = 18;
            p.weaponShotCost  = 5;
        },
    },
    {
        id: 'sniper',
        name: 'Sniper Rifle',
        spritePath: 'assets/sprites/guns/sniper.png',
        accentColor: '#b39ddb',
        tagline: 'High-power precision shot',
        stats: {
            'Damage':    '★★★★★',
            'Fire Rate': '★☆☆☆☆',
            'Ammo':      '★★★☆☆',
            'Range':     '★★★★★',
        },
        description: 'Slow but deadly. Each shot hits hard and pierces the first enemy it strikes.',
        apply(p) {
            p.weaponType      = 'sniper';
            p.bulletDamage    = 5.0;
            p.fireRateMult    = 0.28;
            p.weaponSpread    = 0.0;
            p.weaponPellets   = 1;
            p.weaponSpeed     = 18;
            p.weaponFrames    = 160;
            p.weaponAmmoMax   = 8;
            p.weaponAmmoRegen = 6;
            p.weaponShotCost  = 1;
            p.projectilePierce = Math.max(p.projectilePierce ?? 0, 3);
        },
    },
    {
        id: 'necromancer_staff',
        name: 'Necromancer Staff',
        spritePath: 'assets/sprites/guns/necromancer_staff.png',
        accentColor: '#5ae6b0',
        tagline: 'Bouncing snake bolts',
        stats: {
            'Damage':    '★★★☆☆',
            'Fire Rate': '★☆☆☆☆',
            'Ammo':      '★★★☆☆',
            'Range':     '★★★★☆',
        },
        description: 'Each shot is a snake that hops between enemies. 25% chance to instead loose a void parasite that bounces farther and slows what it hits.',
        apply(p) {
            p.weaponType      = 'necromancer_staff';
            p.bulletDamage    = 1.8;
            p.fireRateMult    = 0.45;
            p.weaponSpread    = 0.06;
            p.weaponPellets   = 1;
            p.weaponSpeed     = NECRO_SNAKE_PROJECTILE_SPEED;
            p.weaponFrames    = NECRO_SNAKE_PROJECTILE_FRAMES;
            p.weaponAmmoMax   = 15;
            p.weaponAmmoRegen = 14;
            p.weaponShotCost  = 1;
        },
    },
    {
        id: 'void_sword',
        name: 'Void Sword',
        spritePath: 'assets/sprites/swords/void_tip_TOP.png',
        accentColor: '#b388ff',
        tagline: 'Piston-blade melee',
        stats: {
            'Damage':    '★★★★☆',
            'Fire Rate': '★★★☆☆',
            'Ammo':      '∞',
            'Range':     '★★☆☆☆',
        },
        description: 'Hold to extend a void blade along your aim. Projectile items grow its length and reach. Strikes once per extension.',
        apply(p) {
            p.weaponType      = 'void_sword';
            p.bulletDamage    = 2.0;
            p.fireRateMult    = 1;
            p.weaponSpread    = 0;
            p.weaponPellets   = 1;
            p.weaponSpeed     = 0;
            p.weaponFrames    = 0;
            p.weaponAmmoMax   = 1;
            p.weaponAmmoRegen = 1;
            p.weaponShotCost  = 0;
        },
    },
];

// Necromancer Staff tuning
const NECRO_SNAKE_PROJECTILE_SPEED = 9;
const NECRO_SNAKE_PROJECTILE_FRAMES = 220;
const NECRO_SNAKE_PROJECTILE_SIZE = 7;
const NECRO_SNAKE_BOUNCES = 3;
const VOID_SNAKE_BOUNCES = 6;
const VOID_SNAKE_CHANCE = 0.25;
const SNAKE_BOUNCE_RANGE = 360;
const VOID_SNAKE_SLOW_FRAMES = 90;
const VOID_SNAKE_SLOW_MULT = 0.55;

// Void Sword tuning
const VOID_SWORD_BASE_MID_SEGMENTS = 2;
const VOID_SWORD_BLADE_THICKNESS = 26;
const VOID_SWORD_BOT_LEN = 24;
const VOID_SWORD_MID_LEN = 28;
const VOID_SWORD_TOP_LEN = 32;
const VOID_SWORD_RETRACT_SPEED_MULT = 3;
const AUDIO_STORAGE_KEYS = {
    music: 'castanza_music_volume',
    sfx: 'castanza_sfx_volume',
};
const MUSIC_TRACK_PATHS = [
    'assets/audio/music/Axis+Mundi.mp3',
    'assets/audio/music/Black+Light.mp3',
    'assets/audio/music/Semantic+Satiation.mp3',
];
const LASER_SHOT_PATHS = [
    'assets/audio/sfx/freesound_community-single-gunshot-54-40780.mp3',
    'freesound_community-single-gunshot-54-40780.mp3',
    'assets/audio/sfx/laser_ak.mp3',
    'laser_ak.mp3',
];
const LASER_POOL_SIZE = 8;
const LASER_VOLUME_MULT = 0.35;
const SHOTGUN_SHOT_PATHS = [
    'assets/audio/sfx/ElevenLabs_shotgun_fire_sfx_for_game.mp3',
    'ElevenLabs_shotgun_fire_sfx_for_game.mp3',
    'assets/audio/sfx/laser_ak.mp3',
    'laser_ak.mp3',
];
const SHOTGUN_POOL_SIZE = 6;
const SHOTGUN_VOLUME_MULT = 0.5;
const SMG_SHOT_PATHS = [
    'assets/audio/sfx/moniker_subriquet-gunshot_smg_shot_1-203471.mp3',
    'moniker_subriquet-gunshot_smg_shot_1-203471.mp3',
    'assets/audio/sfx/laser_ak.mp3',
    'laser_ak.mp3',
];
const SMG_POOL_SIZE = 8;
const SMG_VOLUME_MULT = 0.4;
const SNIPER_SHOT_PATHS = [
    'assets/audio/sfx/freesound_community-m1-garand-rifle-80192.mp3',
    'freesound_community-m1-garand-rifle-80192.mp3',
    'assets/audio/sfx/laser_ak.mp3',
    'laser_ak.mp3',
];
const SNIPER_POOL_SIZE = 4;
const SNIPER_VOLUME_MULT = 0.6;
const SNIPER_PING_PATHS = [
    'assets/audio/sfx/u_awm9pwrwxi-m1-garand-clip-ejection-sound-214386.mp3',
    'u_awm9pwrwxi-m1-garand-clip-ejection-sound-214386.mp3',
];
const SNIPER_PING_VOLUME_MULT = 1.0;
const SNIPER_PING_DELAY_FRAMES = Math.max(1, Math.round(200 / FIXED_STEP));
const SNIPER_RELOAD_MIN_FRAMES = Math.round(3000 / FIXED_STEP);
const SNIPER_AMMO_PIERCE_PROGRESS_STEP = 0.08;
const SNIPER_MAX_PROJECTILE_PIERCE = 10;
const DASH_PATHS = [
    'assets/audio/sfx/dash_glass3.mp3',
    'dash_glass3.mp3',
];
const DASH_POOL_SIZE = 4;
const DASH_PLAY_LAYERS = 2;
const AMMO_PICKUP_PATHS = [
    'assets/audio/sfx/demonic_announcer_max_ammo_bo.mp3',
    'demonic_announcer_max_ammo_bo.mp3',
    'assets/audio/sfx/ammo_pickup.mp3',
    'ammo_pickup.mp3',
    'assets/audio/sfx/exp_orb.mp3',
    'exp_orb.mp3',
];
const AMMO_PICKUP_POOL_SIZE = 4;
const AMMO_PICKUP_VOLUME_MULT = 1.9;
const HEAL_PICKUP_PATHS = [
    'assets/audio/sfx/health-potion.mp3',
    'assets/audio/sfx/health_potion.mp3',
    'health-potion.mp3',
    'health_potion.mp3',
    'assets/audio/sfx/exp_orb.mp3',
    'exp_orb.mp3',
];
const HEAL_PICKUP_POOL_SIZE = 4;
const HEAL_PICKUP_VOLUME_MULT = 1.35;
const INSTAKILL_PICKUP_PATHS = [
    'assets/audio/sfx/Voicy_InstaKill Sound Effect.mp3',
    'Voicy_InstaKill Sound Effect.mp3',
    'assets/audio/sfx/instakill.mp3',
    'assets/audio/sfx/insta_kill.mp3',
    'assets/audio/sfx/insta-kill.mp3',
    'instakill.mp3',
    'insta_kill.mp3',
    'insta-kill.mp3',
    'assets/audio/sfx/exp_orb.mp3',
    'exp_orb.mp3',
];
const INSTAKILL_PICKUP_POOL_SIZE = 4;
const INSTAKILL_PICKUP_VOLUME_MULT = 1.3;
const UI_CLICK_PATHS = [
    'assets/audio/sfx/ui_click.mp3',
    'ui_click.mp3',
];
const EXP_ORB_PATHS = [
    'assets/audio/sfx/exp_orb.mp3',
    'exp_orb.mp3',
];
const UI_CLICK_POOL_SIZE = 4;
const EXP_ORB_POOL_SIZE = 4;
const AMMO_MAX = 120;

const AMMO_REGEN_STOP = 60;
const AMMO_REGEN_INTERVAL_FRAMES = 12;
const AMMO_REGEN_MIN_INTERVAL_FRAMES = 2;

const AMMO_REGEN_ACCEL_PER_SEC = 0.55;
const AMMO_SHOT_COST = 1;
const AMMO_POWERUP_DURATION_FRAMES = Math.round(10000 / FIXED_STEP);

const AMMO_DROP_CHANCE = 0.01;
const AMMO_PICKUP_VALUE_MIN = 10;
const AMMO_PICKUP_VALUE_MAX = 18;
const AMMO_PICKUP_WORLD_SIZE = 13;
const AMMO_PICKUP_DRAW_SCALE = 1.35;
const HEAL_DROP_CHANCE = 0.01;
const HEAL_PICKUP_WORLD_SIZE = 12;
const HEAL_PICKUP_DRAW_SCALE = 1.28;
const HEAL_OVER_TIME_DURATION_FRAMES = Math.round(2500 / FIXED_STEP);
const HEAL_OVER_TIME_MIN_PER_FRAME = 0.35;
const INSTAKILL_DROP_CHANCE = 0.01;
const INSTAKILL_PICKUP_WORLD_SIZE = 12;
const INSTAKILL_PICKUP_DRAW_SCALE = 1.28;
const INSTAKILL_DURATION_FRAMES = Math.round(5000 / FIXED_STEP);

const ENEMY_TYPES = {
    basic: { hp: 3, size: 14, speed: 2,   color: '#00ff00', animSpeed: 10 },
    fast:  { hp: 2, size: 12, speed: 3.5, color: '#ffff00', animSpeed: 6  },
    tank:  { hp: 8, size: 20, speed: 1.2, color: '#ff0000', animSpeed: 14 },
    sniper:{ hp: 3, size: 18, speed: 1.55, color: '#ff8a2b', animSpeed: 9 },
    void_sniper: { hp: 84, size: 34, speed: 2.25, color: '#8f5dff', animSpeed: 8 },
    necromancer: { hp: 92, size: 36, speed: 1.95, color: '#4fd39f', animSpeed: 8 },
};




const ENEMY_VARIANT_STATS = {

    base: { basic: { hp: 3, speed: 2 },      fast: { hp: 2, speed: 3.5 },   tank: { hp: 8, speed: 1.2 },  sniper: { hp: 3, speed: 1.55, projectileDamage: 8, chargeFrames: 62, cooldownFrames: 68 } },
    a:    { basic: { hp: 5, speed: 2.2 },    fast: { hp: 3, speed: 3.8 },   tank: { hp: 11, speed: 1.3 }, sniper: { hp: 4, speed: 1.7, projectileDamage: 8, chargeFrames: 58, cooldownFrames: 62 } },
    b:    { basic: { hp: 7, speed: 2.4 },    fast: { hp: 4, speed: 4.1 },   tank: { hp: 14, speed: 1.4 }, sniper: { hp: 5, speed: 1.9, projectileDamage: 8, chargeFrames: 54, cooldownFrames: 56 } },
    c:    { basic: { hp: 9, speed: 2.6 },    fast: { hp: 5, speed: 4.4 },   tank: { hp: 17, speed: 1.5 }, sniper: { hp: 6, speed: 2.05, projectileDamage: 8, chargeFrames: 50, cooldownFrames: 50 } },
    d:    { basic: { hp: 11, speed: 2.8 },    fast: { hp: 6, speed: 4.7 },   tank: { hp: 20, speed: 1.6 }, sniper: { hp: 7, speed: 2.2, projectileDamage: 8, chargeFrames: 46, cooldownFrames: 46 } },
};


const MUZZLE_LIFE      = 6;
const MUZZLE_SPARKS    = 5;
const SHOOT_COOLDOWN   = 5;
const BULLET_SPREAD    = 0.10;
const MIN_SHOOT_COOLDOWN = 1;

const RAILGUN_ULT_COOLDOWN_FRAMES = Math.round(30000 / FIXED_STEP);
const RAILGUN_ULT_RANGE = 1800;
const RAILGUN_BEAM_LIFE_FRAMES = 9;

const UPGRADE_RARITY_WEIGHTS = {

    common: 42,
    uncommon: 28,
    rare: 16,
    epic: 8,
    legendary: 4,
    mythical: 1,
};

const LEVEL_UPGRADES = [
    {
        id: 'fleet_footing',
        rarity: 'common',
        title: 'Fleet Footing',
        detail: '+4% move speed',
        apply: () => {
            player.speed = Math.min(11.2, player.speed * 1.04);
        },
    },
    {
        id: 'magnet_core',
        rarity: 'common',
        title: 'Magnet Core',
        detail: '+10% XP pickup radius',
        apply: () => {
            player.xpAttractMult = Math.min(4.2, player.xpAttractMult * 1.10);
        },
    },
    {
        id: 'scavenger_rounds',
        rarity: 'common',
        title: 'Scavenger Rounds',
        detail: '+6% ammo regen speed',
        apply: () => {
            if (grantSniperAmmoPierceBonus()) return;
            player.ammoRegenMult = Math.min(4.2, player.ammoRegenMult * 1.06);
        },
    },
    {
        id: 'steady_trigger',
        rarity: 'uncommon',
        title: 'Steady Trigger',
        detail: '+9% fire rate',
        apply: () => {
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.09);
        },
    },
    {
        id: 'reinforced_vitals',
        rarity: 'uncommon',
        title: 'Reinforced Vitals',
        detail: '+7 max HP, heal 5',
        apply: () => {
            player.maxHp += 7;
            player.hp = Math.min(player.maxHp, player.hp + 5);
        },
    },
    {
        id: 'ballistic_lining',
        rarity: 'uncommon',
        title: 'Ballistic Lining',
        detail: '-4% damage taken',
        apply: () => {
            player.damageTakenMult = Math.max(0.28, player.damageTakenMult * 0.96);
        },
    },
    {
        id: 'rapid_fire',
        rarity: 'rare',
        title: 'Rapid Fire',
        detail: '+16% fire rate',
        apply: () => {
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.16);
        },
    },
    {
        id: 'high_cal_rounds',
        rarity: 'rare',
        title: 'High-Cal Rounds',
        detail: '+0.7 bullet damage',
        apply: () => {
            player.bulletDamage = Math.min(34, player.bulletDamage + 0.7);
        },
    },
    {
        id: 'juggernaut_frame',
        rarity: 'rare',
        title: 'Juggernaut Frame',
        detail: '-7% damage taken, +8 max HP',
        apply: () => {
            player.damageTakenMult = Math.max(0.28, player.damageTakenMult * 0.93);
            player.maxHp += 8;
            player.hp = Math.min(player.maxHp, player.hp + 8);
        },
    },
    {
        id: 'vampire_teeth',
        rarity: 'epic',
        title: 'Vampire Teeth',
        detail: '+1% lifesteal on kill',
        apply: () => {
            player.lifestealOnKill = Math.min(0.32, player.lifestealOnKill + 0.01);
        },
    },
    {
        id: 'overclock_dash',
        rarity: 'epic',
        title: 'Overclock Dash',
        detail: '+1 dash charge, -7% dash cooldown',
        apply: () => {
            player.dashMaxCharges = Math.min(6, player.dashMaxCharges + 1);
            player.dashCharges = Math.min(player.dashMaxCharges, player.dashCharges + 1);
            player.dashRechargeFrames = Math.max(18, Math.round(player.dashRechargeFrames * 0.93));
        },
    },
    {
        id: 'vital_surge',
        rarity: 'epic',
        title: 'Vital Surge',
        detail: '+14 max HP and heal 18 HP',
        apply: () => {
            player.maxHp += 14;
            player.hp = Math.min(player.maxHp, player.hp + 18);
        },
    },
    {
        id: 'doom_protocol',
        rarity: 'legendary',
        title: 'Doom Protocol',
        detail: '+2 bullet damage, +10% fire rate',
        apply: () => {
            player.bulletDamage = Math.min(34, player.bulletDamage + 2);
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.10);
        },
    },
    {
        id: 'adamant_plate',
        rarity: 'legendary',
        title: 'Adamant Plate',
        detail: '-10% damage taken, +21 max HP',
        apply: () => {
            player.damageTakenMult = Math.max(0.22, player.damageTakenMult * 0.90);
            player.maxHp += 21;
            player.hp = Math.min(player.maxHp, player.hp + 13);
        },
    },
    {
        id: 'mythical_physiology',
        rarity: 'mythical',
        title: 'Mythical Physiology',
        detail: '+24 max HP, +1 damage, +6% speed',
        apply: () => {
            player.maxHp += 24;
            player.hp = Math.min(player.maxHp, player.hp + 19);
            player.bulletDamage = Math.min(34, player.bulletDamage + 1);
            player.speed = Math.min(11.8, player.speed * 1.06);
        },
    },
];

const ITEM_RARITY_WEIGHTS = {
    common: 44,
    uncommon: 30,
    rare: 16,
    epic: 8,
    legendary: 4,
    mythical: 1,
};

const CHEST_WORLD_SIZE = 16;
const CHEST_DRAW_SCALE = 1.65;

const ITEM_DEFINITIONS = [
    {
        id: 'iron_shards', rarity: 'common', title: 'Iron Shards',
        detail: '+0.3 bullet damage', maxStacks: 12,
        apply: () => { player.bulletDamage = Math.min(34, player.bulletDamage + 0.3); },
    },
    {
        id: 'runner_wrap', rarity: 'common', title: 'Runner Wrap',
        detail: '+2% move speed', maxStacks: 12,
        apply: () => { player.speed = Math.min(11.8, player.speed * 1.02); },
    },
    {
        id: 'vial_mesh', rarity: 'common', title: 'Vial Mesh',
        detail: '+4 max HP', maxStacks: 14,
        apply: () => { player.maxHp += 4; player.hp = Math.min(player.maxHp, player.hp + 3); },
    },
    {
        id: 'ammo_pouch', rarity: 'common', title: 'Ammo Pouch',
        detail: '+6% ammo regen speed', maxStacks: 10,
        apply: () => {
            if (grantSniperAmmoPierceBonus()) return;
            player.ammoRegenMult = Math.min(5, player.ammoRegenMult * 1.06);
        },
    },
    {
        id: 'paper_shield', rarity: 'common', title: 'Paper Shield',
        detail: '+1 shield charge', maxStacks: 6,
        apply: () => {
            player.shieldMax = Math.min(6, (player.shieldMax ?? 0) + 1);
            player.shieldCharges = Math.min(player.shieldMax, (player.shieldCharges ?? 0) + 1);
        },
    },
    {
        id: 'copper_jacket', rarity: 'uncommon', title: 'Copper Jacket',
        detail: '-2% damage taken', maxStacks: 10,
        apply: () => { player.damageTakenMult = Math.max(0.22, player.damageTakenMult * 0.98); },
    },
    {
        id: 'drill_mag', rarity: 'uncommon', title: 'Drill Mag',
        detail: '+4% fire rate', maxStacks: 10,
        apply: () => { player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.04); },
    },
    {
        id: 'orb_compass', rarity: 'uncommon', title: 'Orb Compass',
        detail: '+7% XP pull radius', maxStacks: 8,
        apply: () => { player.xpAttractMult = Math.min(4.2, player.xpAttractMult * 1.07); },
    },
    {
        id: 'kinetic_cell', rarity: 'uncommon', title: 'Kinetic Cell',
        detail: '+1 shield charge and faster shield recharge', maxStacks: 6,
        apply: () => {
            player.shieldMax = Math.min(8, (player.shieldMax ?? 0) + 1);
            player.shieldCharges = Math.min(player.shieldMax, (player.shieldCharges ?? 0) + 1);
            player.shieldRegenCooldown = Math.max(90, Math.round(player.shieldRegenCooldown * 0.95));
        },
    },
    {
        id: 'splitter_rounds', rarity: 'uncommon', title: 'Splitter Rounds',
        detail: '+1 bullet pierce', maxStacks: 6,
        apply: () => { player.projectilePierce = Math.min(4, (player.projectilePierce ?? 0) + 1); },
    },
    {
        id: 'predator_lens', rarity: 'uncommon', title: 'Predator Lens',
        detail: '+3% crit chance', maxStacks: 8,
        apply: () => { player.critChance = Math.min(0.75, (player.critChance ?? 0) + 0.03); },
    },
    {
        id: 'dash_coil', rarity: 'rare', title: 'Dash Coil',
        detail: '-4% dash recharge', maxStacks: 8,
        apply: () => { player.dashRechargeFrames = Math.max(14, Math.round(player.dashRechargeFrames * 0.96)); },
    },
    {
        id: 'blood_etching', rarity: 'rare', title: 'Blood Etching',
        detail: '+0.5% lifesteal on kill', maxStacks: 8,
        apply: () => { player.lifestealOnKill = Math.min(0.32, player.lifestealOnKill + 0.005); },
    },
    {
        id: 'chain_relay', rarity: 'rare', title: 'Chain Relay',
        detail: 'Shots can chain lightning to a nearby foe', maxStacks: 8,
        apply: () => { player.chainLightningChance = Math.min(0.5, (player.chainLightningChance ?? 0) + 0.06); },
    },
    {
        id: 'blast_powder', rarity: 'rare', title: 'Blast Powder',
        detail: 'Bullets explode on impact', maxStacks: 8,
        apply: () => { player.explosionRadius = Math.min(140, (player.explosionRadius ?? 0) + 12); },
    },
    {
        id: 'cleaving_ailment', rarity: 'rare', title: 'Cleaving Ailment',
        detail: '+12% damage to low-health enemies', maxStacks: 8,
        apply: () => { player.executeBonusMult = Math.min(2, (player.executeBonusMult ?? 1) + 0.12); },
    },
    {
        id: 'ghost_fiber', rarity: 'epic', title: 'Ghost Fiber',
        detail: '+6% speed, +6% fire rate', maxStacks: 5,
        apply: () => {
            player.speed = Math.min(11.8, player.speed * 1.06);
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.06);
        },
    },
    {
        id: 'leviathan_ink', rarity: 'legendary', title: 'Leviathan Ink',
        detail: '+1 damage, +14 max HP', maxStacks: 4,
        apply: () => {
            player.bulletDamage = Math.min(34, player.bulletDamage + 1);
            player.maxHp += 14;
            player.hp = Math.min(player.maxHp, player.hp + 10);
        },
    },
    {
        id: 'godframe_scrap', rarity: 'mythical', title: 'Godframe Scrap',
        detail: '-9% damage taken, +2 damage', maxStacks: 2,
        apply: () => {
            player.damageTakenMult = Math.max(0.2, player.damageTakenMult * 0.91);
            player.bulletDamage = Math.min(34, player.bulletDamage + 2);
        },
    },
];

const ITEM_PLACEHOLDER_NAMES = {
    iron_shards: 'Iron Shards',
    runner_wrap: 'Runner Wrap',
    vial_mesh: 'Vial Mesh',
    ammo_pouch: 'Ammo Pouch',
    paper_shield: 'Paper Shield',
    copper_jacket: 'Copper Jacket',
    drill_mag: 'Drill Mag',
    orb_compass: 'Orb Compass',
    kinetic_cell: 'Kinetic Cell',
    splitter_rounds: 'Splitter Rounds',
    predator_lens: 'Predator Lens',
    dash_coil: 'Dash Coil',
    blood_etching: 'Blood Etching',
    chain_relay: 'Chain Relay',
    blast_powder: 'Blast Powder',
    cleaving_ailment: 'Cleaving Ailment',
    ghost_fiber: 'Ghost Fiber',
    leviathan_ink: 'Leviathan Ink',
    godframe_scrap: 'Godframe Scrap',
};

const UNIQUE_ITEM_DEFINITIONS = [
    {
        id: 'boss_crown', rarity: 'rare', title: 'Boss Crown',
        detail: '+1 dash charge and +8 max HP', maxStacks: 1,
        apply: () => {
            player.dashMaxCharges = Math.min(6, player.dashMaxCharges + 1);
            player.dashCharges = Math.min(player.dashMaxCharges, player.dashCharges + 1);
            player.maxHp += 8;
            player.hp = Math.min(player.maxHp, player.hp + 7);
        },
    },
    {
        id: 'chrono_shell', rarity: 'legendary', title: 'Chrono Shell',
        detail: 'Unlock AoE pulse around player', maxStacks: 4,
        apply: () => {
            if (player.aoePulseDamage <= 0) {
                player.aoePulseDamage = 1;
                player.aoePulseRadius = 120;
                player.aoePulseIntervalFrames = 40;
                player.aoePulseTimer = 10;
            } else {
                player.aoePulseDamage = Math.min(12, player.aoePulseDamage + 0.5);
                player.aoePulseRadius = Math.min(260, player.aoePulseRadius + 12);
                player.aoePulseIntervalFrames = Math.max(16, player.aoePulseIntervalFrames - 1);
                player.aoePulseTimer = Math.min(player.aoePulseTimer, player.aoePulseIntervalFrames);
            }
        },
    },
    {
        id: 'overkill_matrix', rarity: 'epic', title: 'Overkill Matrix',
        detail: '+1 extra shot and +5% fire rate', maxStacks: 4,
        apply: () => {
            player.extraShots = Math.min(3, (player.extraShots ?? 0) + 1);
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.05);
        },
    },
    {
        id: 'soul_harvester', rarity: 'epic', title: 'Soul Harvester',
        detail: 'Kills restore HP and ammo', maxStacks: 4,
        apply: () => {
            player.killHealFlat = Math.min(5, (player.killHealFlat ?? 0) + 1);
            if (grantSniperAmmoPierceBonus()) return;
            player.killAmmoFlat = Math.min(4, (player.killAmmoFlat ?? 0) + 1);
        },
    },
    {
        id: 'voltaic_core', rarity: 'epic', title: 'Voltaic Core',
        detail: '+6% chain chance and stronger chain damage', maxStacks: 4,
        apply: () => {
            player.chainLightningChance = Math.min(0.65, (player.chainLightningChance ?? 0) + 0.06);
            player.chainLightningDamageMult = Math.min(0.85, (player.chainLightningDamageMult ?? 0.55) + 0.05);
        },
    },
    {
        id: 'shield_matrix', rarity: 'epic', title: 'Shield Matrix',
        detail: '+2 shield charges and faster recharge', maxStacks: 4,
        apply: () => {
            player.shieldMax = Math.min(10, (player.shieldMax ?? 0) + 2);
            player.shieldCharges = Math.min(player.shieldMax, (player.shieldCharges ?? 0) + 2);
            player.shieldRegenCooldown = Math.max(60, Math.round(player.shieldRegenCooldown * 0.90));
        },
    },
    {
        id: 'mythic_railgun_core', rarity: 'mythical', title: 'Mythic Railgun Core',
        detail: 'Unlock Q railgun and +3 railgun damage', maxStacks: 1,
        apply: () => {
            player.hasRailgunUlt = true;
            player.railgunUltDamage = Math.min(50, player.railgunUltDamage + 3);
            player.railgunUltCooldownFrames = RAILGUN_ULT_COOLDOWN_FRAMES;
            player.railgunUltCooldown = Math.min(player.railgunUltCooldown, RAILGUN_ULT_COOLDOWN_FRAMES);
        },
    },
    {
        id: 'sunflare_module', rarity: 'legendary', title: 'Sunflare Module',
        detail: 'Aura damage around you every second', maxStacks: 3,
        apply: () => {
            player.auraDamage = Math.min(12, (player.auraDamage ?? 0) + 2);
            player.auraRadius = Math.min(220, (player.auraRadius ?? 120) + 12);
        },
    },
    {
        id: 'phoenix_feather', rarity: 'legendary', title: 'Phoenix Feather',
        detail: 'Revive once with a burst heal', maxStacks: 1,
        apply: () => { player.reviveCharges = Math.min(1, (player.reviveCharges ?? 0) + 1); },
    },
    {
        id: 'war_machine', rarity: 'legendary', title: 'War Machine',
        detail: '+1 extra shot, +9% fire rate, +3% crit chance', maxStacks: 2,
        apply: () => {
            player.extraShots = Math.min(3, (player.extraShots ?? 0) + 1);
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.09);
            player.critChance = Math.min(0.75, (player.critChance ?? 0) + 0.03);
        },
    },
    {
        id: 'blackhole_core', rarity: 'legendary', title: 'Blackhole Core',
        detail: 'Powerful aura that drains nearby enemies', maxStacks: 2,
        apply: () => {
            player.auraDamage = Math.min(16, (player.auraDamage ?? 0) + 4);
            player.auraRadius = Math.min(240, (player.auraRadius ?? 120) + 18);
        },
    },
    {
        id: 'soul_battery', rarity: 'epic', title: 'Soul Battery',
        detail: '+1% lifesteal and +7% fire rate', maxStacks: 3,
        apply: () => {
            player.lifestealOnKill = Math.min(0.24, player.lifestealOnKill + 0.01);
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.07);
        },
    },
    {
        id: 'warden_plating', rarity: 'legendary', title: 'Warden Plating',
        detail: '-7% damage taken and +24 max HP', maxStacks: 2,
        apply: () => {
            player.damageTakenMult = Math.max(0.22, player.damageTakenMult * 0.93);
            player.maxHp += 24;
            player.hp = Math.min(player.maxHp, player.hp + 16);
        },
    },
    {
        id: 'warp_tendon', rarity: 'epic', title: 'Warp Tendon',
        detail: '+9% speed and -9% dash recharge', maxStacks: 2,
        apply: () => {
            player.speed = Math.min(11.8, player.speed * 1.09);
            player.dashRechargeFrames = Math.max(14, Math.round(player.dashRechargeFrames * 0.91));
        },
    },
    {
        id: 'recycler_spine', rarity: 'epic', title: 'Recycler Spine',
        detail: 'Kills restore shield and extra ammo', maxStacks: 2,
        apply: () => {
            if (grantSniperAmmoPierceBonus()) {
                player.killShieldFlat = Math.min(2, (player.killShieldFlat ?? 0) + 1);
                return;
            }
            player.killAmmoFlat = Math.min(4, (player.killAmmoFlat ?? 0) + 1);
            player.killShieldFlat = Math.min(2, (player.killShieldFlat ?? 0) + 1);
        },
    },
    {
        id: 'kingmaker_core', rarity: 'mythical', title: 'Kingmaker Core',
        detail: '+2 damage, +12% fire rate, +14 max HP', maxStacks: 1,
        apply: () => {
            player.bulletDamage = Math.min(34, player.bulletDamage + 2);
            player.fireRateMult = Math.min(4.8, player.fireRateMult * 1.12);
            player.maxHp += 14;
            player.hp = Math.min(player.maxHp, player.hp + 12);
        },
    },
    {
        id: 'apocalypse_engine', rarity: 'mythical', title: 'Apocalypse Engine',
        detail: 'Bullets pierce, chain, and explode', maxStacks: 1,
        apply: () => {
            player.projectilePierce = Math.min(5, (player.projectilePierce ?? 0) + 1);
            player.explosionRadius = Math.min(120, (player.explosionRadius ?? 0) + 16);
            player.chainLightningChance = Math.min(0.70, (player.chainLightningChance ?? 0) + 0.10);
            player.chainLightningDamageMult = Math.min(0.85, (player.chainLightningDamageMult ?? 0.55) + 0.06);
        },
    },
    {
        id: 'celestial_heart', rarity: 'mythical', title: 'Celestial Heart',
        detail: '+2 shield charges, revive once, big heal', maxStacks: 1,
        apply: () => {
            player.shieldMax = Math.min(10, (player.shieldMax ?? 0) + 2);
            player.shieldCharges = Math.min(player.shieldMax, (player.shieldCharges ?? 0) + 2);
            player.reviveCharges = Math.min(1, (player.reviveCharges ?? 0) + 1);
            player.maxHp += 32;
            player.hp = Math.min(player.maxHp, player.hp + 28);
        },
    },
    {
        id: 'singularity_seed', rarity: 'mythical', title: 'Singularity Seed',
        detail: 'Massive aura damage and stronger low-health damage', maxStacks: 1,
        apply: () => {
            player.auraDamage = Math.min(24, (player.auraDamage ?? 0) + 6);
            player.auraRadius = Math.min(280, (player.auraRadius ?? 120) + 32);
            player.executeBonusMult = Math.min(1.8, (player.executeBonusMult ?? 1) + 0.20);
        },
    },
];

const UNIQUE_PLACEHOLDER_NAMES = {
    boss_crown: 'Boss Crown',
    chrono_shell: 'Chrono Shell',
    overkill_matrix: 'Overkill Matrix',
    soul_harvester: 'Soul Harvester',
    voltaic_core: 'Voltaic Core',
    shield_matrix: 'Shield Matrix',
    mythic_railgun_core: 'Mythic Railgun Core',
    sunflare_module: 'Sunflare Module',
    phoenix_feather: 'Phoenix Feather',
    war_machine: 'War Machine',
    blackhole_core: 'Blackhole Core',
    soul_battery: 'Soul Battery',
    warden_plating: 'Warden Plating',
    warp_tendon: 'Warp Tendon',
    recycler_spine: 'Recycler Spine',
    kingmaker_core: 'Kingmaker Core',
    apocalypse_engine: 'Apocalypse Engine',
    celestial_heart: 'Celestial Heart',
    singularity_seed: 'Singularity Seed',
};

const XP_PICKUP_BASE_VALUE = 5;
const XP_ATTRACT_RADIUS    = 450;
const XP_ATTRACT_SPEED     = 10;
const TANK_XP_MULTIPLIER   = 1.5;

const XP_PICKUP_VARIANTS = {
    green: { shadow: '#39ff14', rgb: '57,255,20'  },
    blue:  { shadow: '#31b6ff', rgb: '49,182,255' },
};


const VSRC_W = 72,  VSRC_H = 220;
const VCORK_H = 16, VCORK_Y1 = 2,  VCORK_Y2 = VCORK_Y1 + VCORK_H;
const VNECK_W = 24, VNECK_Y1 = VCORK_Y2, VNECK_Y2 = VNECK_Y1 + 28;
const VSHOULDER_Y1 = VNECK_Y2,  VSHOULDER_Y2 = VSHOULDER_Y1 + 18;
const VBODY_W = 56, VBODY_Y1 = VSHOULDER_Y2, VBODY_Y2 = VSRC_H - 5;
const VBRAD = 10,   VCX = VSRC_W / 2;
const VIAL_SCALE = 0.88;
const VIAL_W = VSRC_W * VIAL_SCALE;
const VIAL_H = VSRC_H * VIAL_SCALE;


const TRAIL_LENGTH   = 7;
const TRAIL_INTERVAL = 2;
const TRAIL_LIFETIME = 38;


const SANDEV_COLORS = [
    { r: 255, g: 0,   b: 255 },
    { r: 180, g: 0,   b: 255 },
    { r: 0,   g: 80,  b: 255 },
    { r: 0,   g: 220, b: 255 },
    { r: 0,   g: 255, b: 160 },
    { r: 255, g: 220, b: 0   },
    { r: 255, g: 80,  b: 0   },
];


const _tintCanvas = document.createElement('canvas');
_tintCanvas.width  = 128;
_tintCanvas.height = 128;
const _tintCtx = _tintCanvas.getContext('2d');






const img = src => Object.assign(new Image(), { src });

// Tries each image source until one loads.
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

// Builds the character sprite set with a fallback path for each frame.
function createCharacterSprites(index = 1) {
    const n = String(index);
    return {
        idle:  imgWithFallback([
            `assets/sprites/players/${n}/idle.png`,
            `assets/sprites/players/player${n}_idle.png`,
            `assets/sprites/players/player_idle${n}.png`,
            'assets/sprites/players/1/idle.png',
        ]),
        walk1: imgWithFallback([
            `assets/sprites/players/${n}/walk1.png`,
            `assets/sprites/players/player${n}_walk1.png`,
            `assets/sprites/players/player_walk1${n}.png`,
            'assets/sprites/players/1/walk1.png',
        ]),
        walk2: imgWithFallback([
            `assets/sprites/players/${n}/walk2.png`,
            `assets/sprites/players/player${n}_walk2.png`,
            `assets/sprites/players/player_walk2${n}.png`,
            'assets/sprites/players/1/walk2.png',
        ]),
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

// Returns the currently selected character loadout.
function getSelectedCharacter() {
    if (typeof normalizeSelectedCharacter === 'function') {
        normalizeSelectedCharacter();
    }
    return CHARACTER_LOADOUTS[selectedCharacter] ?? CHARACTER_LOADOUTS[0];
}

// Picks the current player sprite and falls back if the image is not ready.
function getPlayerSprite(frame) {
    const loadout = getSelectedCharacter();
    const sprite  = loadout.sprites[frame] ?? loadout.sprites.idle;
    if (sprite?.complete && sprite.naturalWidth) return sprite;
    return fallbackPlayerSprites[frame] ?? fallbackPlayerSprites.idle;
}

const weaponGunSprites = {
    assault_rifle: {
        idle:  img('assets/sprites/guns/assault_rifle.png'),
        shoot: img('assets/sprites/guns/assault_rifleshoot.png'),
    },
    smg: {
        idle:  img('assets/sprites/guns/smg.png'),
        shoot: img('assets/sprites/guns/smgshoot.png'),
    },
    shotgun: {
        idle:  img('assets/sprites/guns/shotgun.png'),
        shoot: img('assets/sprites/guns/shotgunshoot.png'),
    },
    sniper: {
        idle:  img('assets/sprites/guns/sniper.png'),
        shoot: img('assets/sprites/guns/snipershoot.png'),
    },
    necromancer_staff: {
        idle:  img('assets/sprites/guns/necromancer_staff.png'),
        shoot: img('assets/sprites/guns/necro_staff_shoot.png'),
    },
};

const necroSnakeProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/necromancers_snake_bullet.png',
    'assets/sprites/projectiles/projectile_necromancer.png',
    'assets/sprites/projectiles/projectile.png',
]);
const voidSnakeProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/void_bearers_parasite.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);

const voidSwordSprites = {
    bot: img('assets/sprites/swords/void_tip_BOT.png'),
    mid: img('assets/sprites/swords/void_tip_MID.png'),
    top: img('assets/sprites/swords/void_tip_TOP.png'),
};

// Weapon select card sprites — loaded once at startup
const weaponSelectSprites = WEAPON_LOADOUTS.map(w => imgWithFallback([
    w.spritePath,
    'assets/sprites/guns/assault_rifle.png',
]));

const wallSprite         = img('assets/sprites/levels/level1/wall.png');
const wallFaceSprite     = img('assets/sprites/levels/level1/wall_face.png');
const cornerFaceSprite   = img('assets/sprites/levels/level1/wall_corner_face.png');
const floorSprite        = img('assets/sprites/levels/level1/floor1.png');
const floorVariants      = [
    img('assets/sprites/levels/level1/floor1.png'),
    img('assets/sprites/levels/level1/floor2.png'),
    img('assets/sprites/levels/level1/floor3.png'),
    img('assets/sprites/levels/level1/floor4.png'),
];
const projectileSprite   = img('assets/sprites/projectiles/projectile.png');
const enemyProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/tumor_projectile.png',
    'assets/sprites/projectiles/projectile.png',
]);
const sniperProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/projectile_sniper.png',
    'assets/sprites/projectiles/tumor_projectile.png',
    'assets/sprites/projectiles/projectile.png',
]);
const sniperProjectileSprites = {
    base: imgWithFallback(['assets/sprites/projectiles/projectile_sniper.png', 'assets/sprites/projectiles/projectile.png']),
    a: imgWithFallback(['assets/sprites/projectiles/projectile_a_sniper.png', 'assets/sprites/projectiles/projectile_sniper.png', 'assets/sprites/projectiles/projectile.png']),
    b: imgWithFallback(['assets/sprites/projectiles/projectile_b_sniper.png', 'assets/sprites/projectiles/projectile_sniper.png', 'assets/sprites/projectiles/projectile.png']),
    c: imgWithFallback(['assets/sprites/projectiles/projectile_c_sniper.png', 'assets/sprites/projectiles/projectile_sniper.png', 'assets/sprites/projectiles/projectile.png']),
    d: imgWithFallback(['assets/sprites/projectiles/projectile_d_sniper.png', 'assets/sprites/projectiles/projectile_sniper.png', 'assets/sprites/projectiles/projectile.png']),
};

const voidProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const necromancerProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/projectile_necromancer.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const voidBurstProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/void_proj_burst.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const necromancerBurstProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/necro_proj_burst.png',
    'assets/sprites/projectiles/void_proj_burst.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const voidSkullProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/void_proj_skull.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const necromancerSkullProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/necro_proj_skull.png',
    'assets/sprites/projectiles/void_proj_skull.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const voidSpikeProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/void_proj_spike.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const necromancerSpikeProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/necro_proj_spike.png',
    'assets/sprites/projectiles/void_proj_spike.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const bossShotgunProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/boss_proj_shotgun.png',
    'assets/sprites/projectiles/void_proj_spike.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const bossStreamProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/boss_proj_stream.png',
    'assets/sprites/projectiles/necro_proj_spike.png',
    'assets/sprites/projectiles/projectile_necromancer.png',
    'assets/sprites/projectiles/projectile.png',
]);
const bossHomingProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/boss_proj_homing.png',
    'assets/sprites/projectiles/void_proj_skull.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const waterBossSpriteFrames = [
    imgWithFallback([
        'assets/sprites/enemies/base/water_boss_frame1.png',
        'assets/sprites/enemies/base/enemy_boss_frame1.png',
        'assets/sprites/enemies/base/enemy_tank_frame1.png',
    ]),
    imgWithFallback([
        'assets/sprites/enemies/base/water_boss_frame2.png',
        'assets/sprites/enemies/base/enemy_boss_frame2.png',
        'assets/sprites/enemies/base/enemy_tank_frame2.png',
    ]),
    imgWithFallback([
        'assets/sprites/enemies/base/water_boss_frame3.png',
        'assets/sprites/enemies/base/enemy_boss_frame3.png',
        'assets/sprites/enemies/base/enemy_tank_frame3.png',
    ]),
];
const waterWaveAoeFrames = [
    imgWithFallback(['assets/sprites/projectiles/water_wave_aoe_frame1.png', 'assets/sprites/projectiles/void_wave_aoe_frame1.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/water_wave_aoe_frame2.png', 'assets/sprites/projectiles/void_wave_aoe_frame2.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/water_wave_aoe_frame3.png', 'assets/sprites/projectiles/void_wave_aoe_frame3.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/water_wave_aoe_frame4.png', 'assets/sprites/projectiles/void_wave_aoe_frame4.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/water_wave_aoe_frame5.png', 'assets/sprites/projectiles/void_wave_aoe_frame5.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/water_wave_aoe_frame6.png', 'assets/sprites/projectiles/void_wave_aoe_frame6.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
];
const waterShotProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/water_proj_shot.png',
    'assets/sprites/projectiles/necro_proj_spike.png',
    'assets/sprites/projectiles/void_proj_spike.png',
    'assets/sprites/projectiles/projectile.png',
]);
const waterHomingProjectileSprite = imgWithFallback([
    'assets/sprites/projectiles/water_proj_homing.png',
    'assets/sprites/projectiles/void_proj_skull.png',
    'assets/sprites/projectiles/projectile_void.png',
    'assets/sprites/projectiles/projectile.png',
]);
const voidWaveAoeFrames = [
    imgWithFallback(['assets/sprites/projectiles/void_wave_aoe_frame1.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/void_wave_aoe_frame2.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/void_wave_aoe_frame3.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/void_wave_aoe_frame4.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/void_wave_aoe_frame5.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/void_wave_aoe_frame6.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
];
const necromancerWaveAoeFrames = [
    imgWithFallback(['assets/sprites/projectiles/necro_wave_aoe_frame1.png', 'assets/sprites/projectiles/void_wave_aoe_frame1.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/necro_wave_aoe_frame2.png', 'assets/sprites/projectiles/void_wave_aoe_frame2.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/necro_wave_aoe_frame3.png', 'assets/sprites/projectiles/void_wave_aoe_frame3.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/necro_wave_aoe_frame4.png', 'assets/sprites/projectiles/void_wave_aoe_frame4.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/necro_wave_aoe_frame5.png', 'assets/sprites/projectiles/void_wave_aoe_frame5.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
    imgWithFallback(['assets/sprites/projectiles/necro_wave_aoe_frame6.png', 'assets/sprites/projectiles/void_wave_aoe_frame6.png', 'assets/sprites/projectiles/projectile_void.png', 'assets/sprites/projectiles/projectile.png']),
];

const sniperTeleportFrames = [
    img('assets/sprites/enemies/special/teleport_frame1.png'),
    img('assets/sprites/enemies/special/teleport_frame2.png'),
    img('assets/sprites/enemies/special/teleport_frame3.png'),
    img('assets/sprites/enemies/special/teleport_frame4.png'),
    img('assets/sprites/enemies/special/teleport_frame5.png'),
    img('assets/sprites/enemies/special/teleport_frame6.png'),
];

function getSniperProjectileSpriteForLevel() {
    const variant = getEnemyVariantForLevel(currentArenaLevel);
    return sniperProjectileSprites[variant] ?? sniperProjectileSprites.base;
}
const tumorIdleSprite = imgWithFallback([
    'assets/sprites/enemies/base/tumor_idle.png',
    'assets/sprites/levels/level5/egg_wall.png',
]);
const tumorShootSprite = imgWithFallback([
    'assets/sprites/enemies/base/tumor_shoot.png',
    'assets/sprites/levels/level5/egg_face.png',
    'assets/sprites/levels/level5/egg_wall.png',
]);
const pickupXpSprite     = img('assets/sprites/pickups/pickup_xp.png');
const pickupXpBlueSprite = img('assets/sprites/pickups/pickup_xp_blue.png');
const pickupAmmoSprite = imgWithFallback([
    'assets/sprites/pickups/pickup_ammo.png',
    'assets/sprites/pickups/pickup_xp.png',
]);
const pickupHealSprite = imgWithFallback([
    'assets/sprites/pickups/pickup_heal.png',
    'assets/sprites/pickups/pickup_xp.png',
]);
const pickupInstaKillSprite = imgWithFallback([
    'assets/sprites/pickups/pickup_instakill.png',
    'assets/sprites/pickups/pickup_xp.png',
]);
const pickupChestSprite = imgWithFallback([
    'assets/sprites/pickups/chest_green.png',
    'assets/sprites/pickups/unique_green.png',
]);
const itemPlaceholderSprite = imgWithFallback([
    'assets/sprites/pickups/item_black.png',
    'assets/sprites/pickups/pickup_xp.png',
]);
const uniquePlaceholderSprite = imgWithFallback([
    'assets/sprites/pickups/unique_green.png',
    'assets/sprites/pickups/item_black.png',
]);
const voidTotemSprite = imgWithFallback([
    'assets/sprites/enemies/special/cyber_totem.png',
    'assets/sprites/pickups/chest_green.png',
]);
const necromancerTotemSprite = imgWithFallback([
    'assets/sprites/enemies/special/necro_totem.png',
    'assets/sprites/enemies/special/cyber_totem.png',
    'assets/sprites/pickups/chest_green.png',
]);
const necromancerAuraOutlineSprite = imgWithFallback([
    'assets/sprites/enemies/special/necro_heal_aura.png',
    'assets/sprites/pickups/unique_green.png',
]);

const ENEMY_SPRITE_PATHS = {
    basic: ['assets/sprites/enemies/base/enemy_basic_frame1.png', 'assets/sprites/enemies/base/enemy_basic_frame2.png', 'assets/sprites/enemies/base/enemy_basic_frame3.png'],
    fast:  ['assets/sprites/enemies/base/enemy_fast_frame1.png',  'assets/sprites/enemies/base/enemy_fast_frame2.png',  'assets/sprites/enemies/base/enemy_fast_frame3.png' ],
    tank:  ['assets/sprites/enemies/base/enemy_tank_frame1.png',  'assets/sprites/enemies/base/enemy_tank_frame2.png',  'assets/sprites/enemies/base/enemy_tank_frame3.png' ],
    sniper:['assets/sprites/enemies/base/enemy_sniper_frame1.png','assets/sprites/enemies/base/enemy_sniper_frame2.png','assets/sprites/enemies/base/enemy_sniper_frame3.png','assets/sprites/enemies/base/enemy_sniper_frame4.png'],
    void_sniper: ['assets/sprites/enemies/special/enemy_void_sniper_frame1.png','assets/sprites/enemies/special/enemy_void_sniper_frame2.png','assets/sprites/enemies/special/enemy_void_sniper_frame3.png','assets/sprites/enemies/special/enemy_void_sniper_frame4.png'],
    necromancer: ['assets/sprites/enemies/special/enemy_necromancer_frame1.png','assets/sprites/enemies/special/enemy_necromancer_frame2.png','assets/sprites/enemies/special/enemy_necromancer_frame3.png','assets/sprites/enemies/special/enemy_necromancer_frame4.png'],
};

const NECROMANCER_MINION_SPRITE_PATHS = {
    fast: [
        'assets/sprites/enemies/special/necro_minion_fast_frame1.png',
        'assets/sprites/enemies/special/necro_minion_fast_frame2.png',
        'assets/sprites/enemies/special/necro_minion_fast_frame3.png',
    ],
    sniper: [
        'assets/sprites/enemies/special/necro_minion_sniper_frame1.png',
        'assets/sprites/enemies/special/necro_minion_sniper_frame2.png',
        'assets/sprites/enemies/special/necro_minion_sniper_frame3.png',
        'assets/sprites/enemies/special/necro_minion_sniper_frame4.png',
    ],
    tank: [
        'assets/sprites/enemies/special/necro_minion_tank_frame1.png',
        'assets/sprites/enemies/special/necro_minion_tank_frame2.png',
        'assets/sprites/enemies/special/necro_minion_tank_frame3.png',
    ],
};

const NECROMANCER_MINION_SPRITES = {
    fast: NECROMANCER_MINION_SPRITE_PATHS.fast.map((src, i) => imgWithFallback([src, ENEMY_SPRITE_PATHS.fast[i]])),
    sniper: NECROMANCER_MINION_SPRITE_PATHS.sniper.map((src, i) => imgWithFallback([src, ENEMY_SPRITE_PATHS.sniper[i]])),
    tank: NECROMANCER_MINION_SPRITE_PATHS.tank.map((src, i) => imgWithFallback([src, ENEMY_SPRITE_PATHS.tank[i]])),
};

const ENEMY_LEVEL_VARIANTS = {
    1: 'base',
    2: 'a',
    4: 'c',
    5: 'd',
};

// Builds the enemy sprite set for one map variant.
function createEnemySpriteSet(variant) {
    const set = {};
    for (const [type, paths] of Object.entries(ENEMY_SPRITE_PATHS)) {
        set[type] = paths.map(src => {
            if (variant === 'base') return img(src);
            const filename = src.split('/').pop();

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

const BOSS_NAME_OPTIONS = [
    'Ember Titan',
    'Cinder Warden',
    'Molten Crown',
    'Solar Tyrant',
];

const BOSS_ENEMY_SPRITE_FRAMES = [
    imgWithFallback([
        'assets/sprites/enemies/base/enemy_boss_frame1.png',
        'assets/sprites/enemies/base/enemy_tank_frame1.png',
    ]),
    imgWithFallback([
        'assets/sprites/enemies/base/enemy_boss_frame2.png',
        'assets/sprites/enemies/base/enemy_tank_frame2.png',
    ]),
    imgWithFallback([
        'assets/sprites/enemies/base/enemy_boss_frame3.png',
        'assets/sprites/enemies/base/enemy_tank_frame3.png',
    ]),
];
const NECROMANCER_BOSS_SPRITE_FRAMES = [
    imgWithFallback([
        'assets/sprites/enemies/special/enemy_necromancer_frame1.png',
        'assets/sprites/enemies/special/enemy_void_sniper_frame1.png',
        'assets/sprites/enemies/base/enemy_tank_frame1.png',
    ]),
    imgWithFallback([
        'assets/sprites/enemies/special/enemy_necromancer_frame2.png',
        'assets/sprites/enemies/special/enemy_void_sniper_frame2.png',
        'assets/sprites/enemies/base/enemy_tank_frame2.png',
    ]),
    imgWithFallback([
        'assets/sprites/enemies/special/enemy_necromancer_frame3.png',
        'assets/sprites/enemies/special/enemy_void_sniper_frame3.png',
        'assets/sprites/enemies/base/enemy_tank_frame3.png',
    ]),
];

// Returns a boss name based on the current index.
function getBossName(index = 0) {
    return BOSS_NAME_OPTIONS[index % BOSS_NAME_OPTIONS.length];
}

// Maps the arena level to its enemy variant.
function getEnemyVariantForLevel(level) {
    return ENEMY_LEVEL_VARIANTS[level] ?? 'base';
}

// Returns the active enemy sprite set for the current level.
function getEnemySpritesForCurrentLevel() {
    const variant = getEnemyVariantForLevel(currentArenaLevel);
    return enemySpriteSets[variant] ?? enemySpriteSets.base;
}

// Looks up the animation frames for one enemy type.
function getEnemySpriteFrames(type) {
    const activeSet = getEnemySpritesForCurrentLevel();
    return activeSet[type] ?? enemySpriteSets.base[type];
}

const ITEM_PLACEHOLDER_SPRITES = Object.fromEntries(ITEM_DEFINITIONS.map(def => [
    def.id,
    imgWithFallback([
        `assets/sprites/pickups/items/${def.id}_green.png`,
        'assets/sprites/pickups/unique_green.png',
    ]),
]));

const UNIQUE_PLACEHOLDER_SPRITES = Object.fromEntries(UNIQUE_ITEM_DEFINITIONS.map(def => [
    def.id,
    imgWithFallback([
        `assets/sprites/pickups/uniques/${def.id}_green.png`,
        'assets/sprites/pickups/unique_green.png',
    ]),
]));

const cursorSprites = [
    { name: 'Crosshair',  img: img('assets/sprites/cursors/cursor_crosshair.png')  },
    { name: 'Reticle',    img: img('assets/sprites/cursors/cursor_reticle.png')    },
    { name: 'Scope',      img: img('assets/sprites/cursors/cursor_scope.png')      },
    { name: 'Skull',      img: img('assets/sprites/cursors/cursor_skull.png')      },
    { name: 'Tactical',   img: img('assets/sprites/cursors/cursor_tactical.png')   },
    { name: 'Neon Arrow', img: img('assets/sprites/cursors/cursor_neon_arrow.png') },
];


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
const ammoBarBgSprite = imgWithFallback([
    'assets/sprites/ui/ui_ammobar_bg.png',
    'assets/sprites/ui/ui_xpbar_bg.png',
]);
const ammoBarFillSprite = imgWithFallback([
    'assets/sprites/ui/ui_ammobar_fill.png',
    'assets/sprites/ui/ui_xpbar_fill.png',
]);
const ammoBarFrameSprite = imgWithFallback([
    'assets/sprites/ui/ui_ammobar_frame.png',
    'assets/sprites/ui/ui_xpbar_frame.png',
]);
const ammoBarGlowSprite = imgWithFallback([
    'assets/sprites/ui/ui_ammobar_glow.png',
    'assets/sprites/ui/ui_xpbar_glow.png',
]);

const splashImage = img('assets/sprites/ui/intro.png');
const menuBackgroundImage = img('assets/sprites/ui/menu.png');
const menuButtonSprites = {
    selectCharacter: img('assets/sprites/buttons/selectcharacter.png'),
    selectCursor: img('assets/sprites/buttons/selectcursor.png'),
    encyclopedia: img('assets/sprites/buttons/encyclopedia.png'),
    mapConfig: img('assets/sprites/buttons/map.png'),
    audioConfig: img('assets/sprites/buttons/audio.png'),
    fogOn: img('assets/sprites/buttons/fogOn.png'),
    fogOff: img('assets/sprites/buttons/fogOff.png'),
    graphicsTutorial: img('assets/sprites/buttons/GraphicsTutorial.png'),
    fpsOn: img('assets/sprites/buttons/fpsCountOn.png'),
    fpsOff: img('assets/sprites/buttons/fpsCountOff.png'),
    devTestOn: img('assets/sprites/buttons/devTestOn.png'),
    devTestOff: img('assets/sprites/buttons/devTestOff.png'),
    devCheatsOn: img('assets/sprites/buttons/devCheatsOn.png'),
    devCheatsOff: img('assets/sprites/buttons/DevCheatsOff.png'),
};

const MAP_THEME_SPRITES = {
    1: {
        floor: floorSprite,
        floorVariants: floorVariants,
        wall: wallSprite,
        wallFace: wallFaceSprite,
        cornerFace: cornerFaceSprite,
        pots: [
            imgWithFallback(['assets/sprites/levels/level1/pot1_clay_pixel.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level1/pot2_urn_pixel.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level1/pot3_vase_pixel.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level1/potD_sandy_pixel.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level1/potE_orange_pixel.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level1/potF_ochre_pixel.png', 'assets/sprites/levels/level1/wall.png']),
        ],
        skullCandles: [
            imgWithFallback([
                'assets/sprites/levels/level1/skull_candle_pixel.png',
                'assets/sprites/levels/level1/skull_cangle_pixel.png',
                'assets/sprites/levels/level1/skull_with_candle_pixel.png',
                'assets/sprites/levels/level1/wall.png',
            ]),
        ],
    },
    2: {
        floor: imgWithFallback(['assets/sprites/levels/level2/floor_level2.png', 'assets/sprites/levels/level1/floor1.png']),
        wall: imgWithFallback(['assets/sprites/levels/level2/wall_level2.png', 'assets/sprites/levels/level1/wall.png']),
        wallFace: imgWithFallback(['assets/sprites/levels/level2/wall_face_level2.png', 'assets/sprites/levels/level1/wall_face.png']),
        cornerFace: imgWithFallback(['assets/sprites/levels/level2/wall_corner_face_level2.png', 'assets/sprites/levels/level1/wall_corner_face.png']),
    },
    3: {
        floor: imgWithFallback(['assets/sprites/levels/level3/floor_level3.png', 'assets/sprites/levels/level1/floor1.png']),
        wall: imgWithFallback(['assets/sprites/levels/level3/wall_level3.png', 'assets/sprites/levels/level1/wall.png']),
        wallFace: imgWithFallback(['assets/sprites/levels/level3/wall_face_level3.png', 'assets/sprites/levels/level1/wall_face.png']),
        cornerFace: imgWithFallback(['assets/sprites/levels/level3/wall_corner_face_level3.png', 'assets/sprites/levels/level1/wall_corner_face.png']),
    },
    4: {
        floor: imgWithFallback(['assets/sprites/levels/level4/floor_level4.png', 'assets/sprites/levels/level1/floor1.png']),
        wall: imgWithFallback(['assets/sprites/levels/level4/wall_level4.png', 'assets/sprites/levels/level1/wall.png']),
        wallFace: imgWithFallback(['assets/sprites/levels/level4/wall_face_level4.png', 'assets/sprites/levels/level1/wall_face.png']),
        cornerFace: imgWithFallback(['assets/sprites/levels/level4/wall_corner_face_level4.png', 'assets/sprites/levels/level1/wall_corner_face.png']),
        mushroomTrees: [
            imgWithFallback(['assets/sprites/levels/level4/mushroom_tree_2a.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level4/mushroom_tree_2b.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level4/mushroom_tree_3a.png', 'assets/sprites/levels/level1/wall.png']),
            imgWithFallback(['assets/sprites/levels/level4/mushroom_tree_3b.png', 'assets/sprites/levels/level1/wall.png']),
        ],
    },
    5: {
        floor: imgWithFallback(['assets/sprites/levels/level5/floor_level5.png', 'assets/sprites/levels/level1/floor1.png']),
        wall: imgWithFallback(['assets/sprites/levels/level5/wall_level5.png', 'assets/sprites/levels/level1/wall.png']),
        wallFace: imgWithFallback(['assets/sprites/levels/level5/wall_face_level5.png', 'assets/sprites/levels/level1/wall_face.png']),
        cornerFace: imgWithFallback(['assets/sprites/levels/level5/wall_corner_face_level5.png', 'assets/sprites/levels/level1/wall_corner_face.png']),
        sausageWall: imgWithFallback(['assets/sprites/levels/level5/sausage_wall.png', 'assets/sprites/levels/level5/sausage.png', 'assets/sprites/levels/level5/wall_level5.png', 'assets/sprites/levels/level1/wall.png']),
        sausageFace: imgWithFallback(['assets/sprites/levels/level5/sausage_face.png', 'assets/sprites/levels/level5/sausage_wall.png', 'assets/sprites/levels/level5/wall_face_level5.png', 'assets/sprites/levels/level1/wall_face.png']),
        eggWall: imgWithFallback(['assets/sprites/levels/level5/egg_wall.png', 'assets/sprites/levels/level5/sausage_wall.png', 'assets/sprites/levels/level5/wall_level5.png', 'assets/sprites/levels/level1/wall.png']),
        eggFace: imgWithFallback(['assets/sprites/levels/level5/egg_face.png', 'assets/sprites/levels/level5/sausage_face.png', 'assets/sprites/levels/level5/wall_face_level5.png', 'assets/sprites/levels/level1/wall_face.png']),
    },
    special: {
        floor: imgWithFallback(['assets/sprites/levels/special/boss_floor.png', 'assets/sprites/levels/level1/floor1.png']),
        wall: imgWithFallback(['assets/sprites/levels/special/boss_wall.png', 'assets/sprites/levels/level1/wall.png']),
        wallFace: imgWithFallback(['assets/sprites/levels/special/boss_wall_rune.png', 'assets/sprites/levels/level1/wall_face.png']),
        cornerFace: imgWithFallback(['assets/sprites/levels/special/boss_wall_top.png', 'assets/sprites/levels/level1/wall_corner_face.png']),
    },
    necromancer: {
        floor: imgWithFallback(['assets/sprites/levels/special/necro_floor.png', 'assets/sprites/levels/special/boss_floor.png', 'assets/sprites/levels/level1/floor1.png']),
        wall: imgWithFallback(['assets/sprites/levels/special/necro_wall.png', 'assets/sprites/levels/special/boss_wall.png', 'assets/sprites/levels/level1/wall.png']),
        wallFace: imgWithFallback(['assets/sprites/levels/special/necro_wall_rune.png', 'assets/sprites/levels/special/boss_wall_rune.png', 'assets/sprites/levels/level1/wall_face.png']),
        cornerFace: imgWithFallback(['assets/sprites/levels/special/necro_wall_top.png', 'assets/sprites/levels/special/boss_wall_top.png', 'assets/sprites/levels/level1/wall_corner_face.png']),
    },
};

const MAP_THEME_TINT = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    necromancer: 'rgba(26, 85, 54, 0.22)',
};

