// Phaser 3 Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false // Set to true to see physics bodies
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize the game
const game = new Phaser.Game(config);

// Game variables
let player;
let platforms;
let cursors;
let jumpKey;
let isJumping = false;
let distanceTraveled = 0;
let stepDistance = 40; // Distance between footsteps
let audioContext;
let musicPlaying = false;
let musicEnabled = true;
let musicKey;
let musicText;
let enemies;
let enemyKillZones;
let playerHealth = 3;
let maxHealth = 3;
let healthBar;
let healthBarBackground;
let healthText;
let currentLevel = 1;
let levelText;
let isTransitioning = false;
let sceneContext;
let currentMusicTimeout;
let brickBoxes;
let powerUps;
let hasGun = true; // Player always has gun now
let ammoCount = 10; // Starting ammo
let maxAmmo = 30; // Maximum ammo capacity
let bullets;
let gunIcon;
let ammoBar;
let ammoBarBackground;
let boss;
let bossHealthBar;
let bossHealthBarBg;
let bossHealthText;

function preload() {
    // We'll create graphics programmatically, so no assets to preload
    // In a real game, you'd load sprite sheets here:
    // this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
    // Store scene context for later use
    sceneContext = this;
    
    // Initialize audio context
    initAudio();
    
    // Create the player character
    createPlayer.call(this);
    
    // Create platforms
    createPlatforms.call(this);
    
    // Create enemies
    createEnemies.call(this);
    
    // Create boss (every 10 levels)
    if (currentLevel % 10 === 0) {
        createBoss.call(this);
    }
    
    // Create brick boxes
    createBrickBoxes.call(this);
    
    // Set up controls
    setupControls.call(this);
    
    // Enable collision between player and platforms
    this.physics.add.collider(player, platforms);
    
    // Enable collision between enemies and platforms
    this.physics.add.collider(enemies, platforms);
    
    // Add collision for touching enemy (with custom check for jump kills)
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    
    // Add collision for brick boxes with custom callback
    this.physics.add.collider(player, brickBoxes, null, checkBrickBoxBreak, this);
    
    // Add overlap for power-ups
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
    
    // Initialize bullets group
    bullets = this.physics.add.group();
    this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
    
    // Add boss-bullet collision if boss exists
    if (boss && boss.active) {
        this.physics.add.overlap(bullets, boss, bulletHitBoss, null, this);
    }
    
    // Enable mouse click for shooting
    this.input.on('pointerdown', shootGun, this);
    
    // Add some decorative clouds
    addClouds.call(this);
    
    // Create health bar UI
    createHealthBar.call(this);
    
    // Create level counter UI
    createLevelCounter.call(this);
    
    // Create music toggle UI
    createMusicToggleUI.call(this);
    
    // Create gun icon UI
    createGunUI.call(this);
}

function update() {
    // Handle player movement
    handlePlayerMovement.call(this);
    
    // Update animations based on player state
    updateAnimations.call(this);
    
    // Track footsteps
    trackFootsteps.call(this);
    
    // Update enemies
    updateEnemies.call(this);
    
    // Check for level transition (touching walls)
    checkLevelTransition.call(this);
}

function createPlayer() {
    // Create player sprite as a dinosaur
    const graphics = this.add.graphics();
    
    // Dinosaur body (main torso)
    graphics.fillStyle(0x4CAF50, 1); // Green color
    graphics.fillRoundedRect(8, 20, 24, 20, 4);
    
    // Dinosaur head
    graphics.fillStyle(0x66BB6A, 1);
    graphics.fillEllipse(20, 15, 16, 14);
    
    // Dinosaur snout
    graphics.fillStyle(0x81C784, 1);
    graphics.fillEllipse(28, 15, 8, 6);
    
    // Dinosaur tail
    graphics.fillStyle(0x4CAF50, 1);
    graphics.beginPath();
    graphics.moveTo(10, 30);
    graphics.lineTo(2, 35);
    graphics.lineTo(8, 38);
    graphics.closePath();
    graphics.fillPath();
    
    // Back spikes
    graphics.fillStyle(0x388E3C, 1);
    graphics.fillTriangle(15, 20, 18, 14, 21, 20); // Spike 1
    graphics.fillTriangle(21, 20, 24, 16, 27, 20); // Spike 2
    
    // Legs
    graphics.fillStyle(0x4CAF50, 1);
    graphics.fillRect(12, 38, 6, 10); // Back leg
    graphics.fillRect(22, 38, 6, 10); // Front leg
    
    // Feet
    graphics.fillStyle(0x388E3C, 1);
    graphics.fillEllipse(15, 48, 8, 4); // Back foot
    graphics.fillEllipse(25, 48, 8, 4); // Front foot
    
    // Eye
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(22, 13, 3);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(23, 13, 2); // Pupil
    
    // Nostril
    graphics.fillStyle(0x2E7D32, 1);
    graphics.fillCircle(30, 15, 1);
    
    graphics.generateTexture('player', 34, 50);
    graphics.destroy();
    
    // Create player sprite with physics
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);
    player.setScale(1.2); // Make the dinosaur slightly bigger
    
    // Create animations for the player
    createPlayerAnimations.call(this);
}

function createPlayerAnimations() {
    // Create idle animation
    this.anims.create({
        key: 'idle',
        frames: [{ key: 'player', frame: 0 }],
        frameRate: 10
    });
    
    // For walk animation, we'll create additional frames
    const walkGraphics = this.add.graphics();
    
    // Walking frame 1 (front leg forward)
    walkGraphics.clear();
    // Body
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.fillRoundedRect(8, 20, 24, 20, 4);
    // Head
    walkGraphics.fillStyle(0x66BB6A, 1);
    walkGraphics.fillEllipse(20, 15, 16, 14);
    // Snout
    walkGraphics.fillStyle(0x81C784, 1);
    walkGraphics.fillEllipse(28, 15, 8, 6);
    // Tail (swaying)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.beginPath();
    walkGraphics.moveTo(10, 30);
    walkGraphics.lineTo(2, 33);
    walkGraphics.lineTo(8, 38);
    walkGraphics.closePath();
    walkGraphics.fillPath();
    // Spikes
    walkGraphics.fillStyle(0x388E3C, 1);
    walkGraphics.fillTriangle(15, 20, 18, 14, 21, 20);
    walkGraphics.fillTriangle(21, 20, 24, 16, 27, 20);
    // Legs (front leg forward)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.fillRect(12, 40, 6, 8);
    walkGraphics.fillRect(22, 36, 6, 12);
    // Feet
    walkGraphics.fillStyle(0x388E3C, 1);
    walkGraphics.fillEllipse(15, 48, 8, 4);
    walkGraphics.fillEllipse(25, 48, 8, 4);
    // Eye
    walkGraphics.fillStyle(0xFFFFFF, 1);
    walkGraphics.fillCircle(22, 13, 3);
    walkGraphics.fillStyle(0x000000, 1);
    walkGraphics.fillCircle(23, 13, 2);
    // Nostril
    walkGraphics.fillStyle(0x2E7D32, 1);
    walkGraphics.fillCircle(30, 15, 1);
    walkGraphics.generateTexture('player-walk1', 34, 50);
    
    // Walking frame 2 (back leg forward)
    walkGraphics.clear();
    // Body
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.fillRoundedRect(8, 20, 24, 20, 4);
    // Head
    walkGraphics.fillStyle(0x66BB6A, 1);
    walkGraphics.fillEllipse(20, 15, 16, 14);
    // Snout
    walkGraphics.fillStyle(0x81C784, 1);
    walkGraphics.fillEllipse(28, 15, 8, 6);
    // Tail (swaying opposite)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.beginPath();
    walkGraphics.moveTo(10, 30);
    walkGraphics.lineTo(2, 37);
    walkGraphics.lineTo(8, 38);
    walkGraphics.closePath();
    walkGraphics.fillPath();
    // Spikes
    walkGraphics.fillStyle(0x388E3C, 1);
    walkGraphics.fillTriangle(15, 20, 18, 14, 21, 20);
    walkGraphics.fillTriangle(21, 20, 24, 16, 27, 20);
    // Legs (back leg forward)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.fillRect(12, 36, 6, 12);
    walkGraphics.fillRect(22, 40, 6, 8);
    // Feet
    walkGraphics.fillStyle(0x388E3C, 1);
    walkGraphics.fillEllipse(15, 48, 8, 4);
    walkGraphics.fillEllipse(25, 48, 8, 4);
    // Eye
    walkGraphics.fillStyle(0xFFFFFF, 1);
    walkGraphics.fillCircle(22, 13, 3);
    walkGraphics.fillStyle(0x000000, 1);
    walkGraphics.fillCircle(23, 13, 2);
    // Nostril
    walkGraphics.fillStyle(0x2E7D32, 1);
    walkGraphics.fillCircle(30, 15, 1);
    walkGraphics.generateTexture('player-walk2', 34, 50);
    
    // Walking frame 3 (middle stride)
    walkGraphics.clear();
    // Body (slightly bobbing down)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.fillRoundedRect(8, 21, 24, 20, 4);
    // Head (bobbing down slightly)
    walkGraphics.fillStyle(0x66BB6A, 1);
    walkGraphics.fillEllipse(20, 16, 16, 14);
    // Snout
    walkGraphics.fillStyle(0x81C784, 1);
    walkGraphics.fillEllipse(28, 16, 8, 6);
    // Tail (middle position)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.beginPath();
    walkGraphics.moveTo(10, 30);
    walkGraphics.lineTo(2, 35);
    walkGraphics.lineTo(8, 38);
    walkGraphics.closePath();
    walkGraphics.fillPath();
    // Spikes
    walkGraphics.fillStyle(0x388E3C, 1);
    walkGraphics.fillTriangle(15, 21, 18, 15, 21, 21);
    walkGraphics.fillTriangle(21, 21, 24, 17, 27, 21);
    // Legs (both down)
    walkGraphics.fillStyle(0x4CAF50, 1);
    walkGraphics.fillRect(12, 39, 6, 9);
    walkGraphics.fillRect(22, 39, 6, 9);
    // Feet
    walkGraphics.fillStyle(0x388E3C, 1);
    walkGraphics.fillEllipse(15, 48, 8, 4);
    walkGraphics.fillEllipse(25, 48, 8, 4);
    // Eye
    walkGraphics.fillStyle(0xFFFFFF, 1);
    walkGraphics.fillCircle(22, 14, 3);
    walkGraphics.fillStyle(0x000000, 1);
    walkGraphics.fillCircle(23, 14, 2);
    // Nostril
    walkGraphics.fillStyle(0x2E7D32, 1);
    walkGraphics.fillCircle(30, 16, 1);
    walkGraphics.generateTexture('player-walk3', 34, 50);
    
    walkGraphics.destroy();
    
    // Create walk animation with more frames for smoother movement
    this.anims.create({
        key: 'walk',
        frames: [
            { key: 'player' },
            { key: 'player-walk1' },
            { key: 'player-walk3' },
            { key: 'player-walk2' },
            { key: 'player' }
        ],
        frameRate: 12,
        repeat: -1
    });
    
    // Create jump animation (legs tucked)
    const jumpGraphics = this.add.graphics();
    // Body
    jumpGraphics.fillStyle(0x4CAF50, 1);
    jumpGraphics.fillRoundedRect(8, 22, 24, 18, 4);
    // Head (slightly up)
    jumpGraphics.fillStyle(0x66BB6A, 1);
    jumpGraphics.fillEllipse(20, 14, 16, 14);
    // Snout
    jumpGraphics.fillStyle(0x81C784, 1);
    jumpGraphics.fillEllipse(28, 14, 8, 6);
    // Tail (up)
    jumpGraphics.fillStyle(0x4CAF50, 1);
    jumpGraphics.beginPath();
    jumpGraphics.moveTo(10, 28);
    jumpGraphics.lineTo(4, 24);
    jumpGraphics.lineTo(8, 32);
    jumpGraphics.closePath();
    jumpGraphics.fillPath();
    // Spikes
    jumpGraphics.fillStyle(0x388E3C, 1);
    jumpGraphics.fillTriangle(15, 22, 18, 16, 21, 22);
    jumpGraphics.fillTriangle(21, 22, 24, 18, 27, 22);
    // Legs (tucked up)
    jumpGraphics.fillStyle(0x4CAF50, 1);
    jumpGraphics.fillRect(12, 38, 6, 8);
    jumpGraphics.fillRect(22, 38, 6, 8);
    // Feet
    jumpGraphics.fillStyle(0x388E3C, 1);
    jumpGraphics.fillEllipse(15, 46, 8, 4);
    jumpGraphics.fillEllipse(25, 46, 8, 4);
    // Eye (wide)
    jumpGraphics.fillStyle(0xFFFFFF, 1);
    jumpGraphics.fillCircle(22, 12, 4);
    jumpGraphics.fillStyle(0x000000, 1);
    jumpGraphics.fillCircle(23, 12, 2);
    // Nostril
    jumpGraphics.fillStyle(0x2E7D32, 1);
    jumpGraphics.fillCircle(30, 14, 1);
    jumpGraphics.generateTexture('player-jump', 34, 50);
    jumpGraphics.destroy();
    
    this.anims.create({
        key: 'jump',
        frames: [{ key: 'player-jump' }],
        frameRate: 10
    });
}

function createPlatforms() {
    if (!platforms) {
        platforms = this.physics.add.staticGroup();
    } else {
        platforms.clear(true, true); // Clear existing platforms
    }
    
    // Create ground platform texture if not already created
    if (!this.textures.exists('ground')) {
        const groundGraphics = this.add.graphics();
        groundGraphics.fillStyle(0x795548, 1);
        groundGraphics.fillRect(0, 0, 800, 50);
        groundGraphics.fillStyle(0x8BC34A, 1);
        groundGraphics.fillRect(0, 0, 800, 10);
        groundGraphics.lineStyle(2, 0x5D4037, 1);
        for (let i = 0; i < 800; i += 40) {
            groundGraphics.lineBetween(i, 10, i, 50);
        }
        groundGraphics.generateTexture('ground', 800, 50);
        groundGraphics.destroy();
    }
    
    // Add the ground
    const ground = platforms.create(400, 575, 'ground');
    ground.setScale(1).refreshBody();
    
    // Create floating platform texture if not already created
    if (!this.textures.exists('platform')) {
        const platformGraphics = this.add.graphics();
        platformGraphics.fillStyle(0x8D6E63, 1);
        platformGraphics.fillRect(0, 0, 200, 20);
        platformGraphics.fillStyle(0xA1887F, 1);
        platformGraphics.fillRect(0, 0, 200, 5);
        platformGraphics.generateTexture('platform', 200, 20);
        platformGraphics.destroy();
    }
    
    // Generate well-spaced floating platforms based on level
    const numPlatforms = Math.min(3 + currentLevel, 8); // More platforms each level, max 8
    
    // Divide the screen into zones for better distribution
    const placedPlatforms = [];
    const minDistance = 180; // Minimum distance between platforms
    
    let attempts = 0;
    while (placedPlatforms.length < numPlatforms && attempts < numPlatforms * 10) {
        attempts++;
        
        const x = 150 + Math.random() * 500; // Random x between 150-650
        const y = 150 + Math.random() * 250; // Random y between 150-400
        
        // Check if this position is far enough from other platforms
        let tooClose = false;
        for (let placed of placedPlatforms) {
            const distance = Math.sqrt(Math.pow(x - placed.x, 2) + Math.pow(y - placed.y, 2));
            if (distance < minDistance) {
                tooClose = true;
                break;
            }
        }
        
        if (!tooClose) {
            platforms.create(x, y, 'platform');
            placedPlatforms.push({ x, y });
        }
    }
}

function createEnemies() {
    // Create groups for enemies and their kill zones if they don't exist
    if (!enemies) {
        enemies = this.physics.add.group();
        enemyKillZones = this.physics.add.group();
    } else {
        // Clear existing enemies
        enemies.clear(true, true);
        enemyKillZones.clear(true, true);
    }
    
    // Don't spawn regular enemies on boss levels (every 10 levels)
    if (currentLevel % 10 === 0) {
        return; // Skip enemy spawning on boss levels
    }
    
    // Fewer enemies - 1-3 enemies max
    const numEnemies = Math.min(1 + Math.floor(currentLevel / 3), 3); // Max 3 enemies
    
    // Spawn enemies at random positions
    for (let i = 0; i < numEnemies; i++) {
        const x = 150 + Math.random() * 500; // Random x between 150-650
        const y = 500; // Start on ground
        createEvilTRex.call(this, x, y);
    }
}

function createBoss() {
    // Create giant T-Rex boss texture if not already created
    if (!this.textures.exists('boss-trex')) {
        const graphics = this.add.graphics();
        
        // Scale factor for boss (3x bigger)
        const scale = 3;
        
        // Evil dinosaur body (darker, reddish) - scaled up
        graphics.fillStyle(0x8B0000, 1); // Dark blood red
        graphics.fillRoundedRect(8*scale, 20*scale, 24*scale, 20*scale, 4*scale);
        
        // Head (angry red) - larger
        graphics.fillStyle(0xB71C1C, 1);
        graphics.fillEllipse(20*scale, 15*scale, 16*scale, 14*scale);
        
        // Snout (darker)
        graphics.fillStyle(0x8B0000, 1);
        graphics.fillEllipse(28*scale, 15*scale, 8*scale, 6*scale);
        
        // Tail - bigger
        graphics.fillStyle(0x8B0000, 1);
        graphics.beginPath();
        graphics.moveTo(10*scale, 30*scale);
        graphics.lineTo(2*scale, 35*scale);
        graphics.lineTo(8*scale, 38*scale);
        graphics.closePath();
        graphics.fillPath();
        
        // Evil spikes (black) - larger and more
        graphics.fillStyle(0x000000, 1);
        graphics.fillTriangle(15*scale, 20*scale, 18*scale, 14*scale, 21*scale, 20*scale);
        graphics.fillTriangle(21*scale, 20*scale, 24*scale, 16*scale, 27*scale, 20*scale);
        graphics.fillTriangle(12*scale, 22*scale, 14*scale, 18*scale, 16*scale, 22*scale);
        graphics.fillTriangle(9*scale, 24*scale, 11*scale, 20*scale, 13*scale, 24*scale);
        
        // Legs - thicker
        graphics.fillStyle(0x8B0000, 1);
        graphics.fillRect(12*scale, 38*scale, 6*scale, 10*scale);
        graphics.fillRect(22*scale, 38*scale, 6*scale, 10*scale);
        
        // Clawed feet (dark) - bigger
        graphics.fillStyle(0x000000, 1);
        graphics.fillEllipse(15*scale, 48*scale, 8*scale, 4*scale);
        graphics.fillEllipse(25*scale, 48*scale, 8*scale, 4*scale);
        
        // Evil eye (glowing red)
        graphics.fillStyle(0xFF0000, 1);
        graphics.fillCircle(22*scale, 13*scale, 4*scale);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(23*scale, 13*scale, 2*scale);
        
        // Angry eyebrow - thicker
        graphics.lineStyle(3, 0x000000, 1);
        graphics.lineBetween(19*scale, 11*scale, 24*scale, 10*scale);
        
        // Nostril
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(30*scale, 15*scale, 2*scale);
        
        // Sharp teeth - more teeth
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillTriangle(26*scale, 16*scale, 28*scale, 19*scale, 30*scale, 16*scale);
        graphics.fillTriangle(28*scale, 16*scale, 30*scale, 19*scale, 32*scale, 16*scale);
        graphics.fillTriangle(24*scale, 17*scale, 26*scale, 20*scale, 28*scale, 17*scale);
        
        graphics.generateTexture('boss-trex', 34*scale, 50*scale);
        graphics.destroy();
    }
    
    // Create the boss sprite
    boss = this.physics.add.sprite(400, 400, 'boss-trex');
    boss.setScale(1);
    boss.setBounce(0);
    boss.setCollideWorldBounds(true);
    boss.body.setSize(84, 135, true); // Larger hitbox
    
    // Boss properties
    boss.maxHealth = 20; // Takes 20 hits to defeat
    boss.health = 20;
    boss.isBoss = true;
    boss.enemySpeed = 60; // Slower than normal enemies
    boss.setVelocityX(boss.enemySpeed);
    
    // Enable collision with platforms
    this.physics.add.collider(boss, platforms);
    
    // Add collision with player (for damage)
    this.physics.add.overlap(player, boss, hitEnemy, null, this);
    
    // Store scene reference for bullet collision (set up after boss is created)
    // Collision with bullets will be handled by the bulletHitBoss function
    
    // Create boss health bar
    createBossHealthBar.call(this);
}

function createBrickBoxes() {
    // Create groups for brick boxes and power-ups if they don't exist
    if (!brickBoxes) {
        brickBoxes = this.physics.add.staticGroup();
        powerUps = this.physics.add.group();
    } else {
        // Clear existing boxes and power-ups
        brickBoxes.clear(true, true);
        powerUps.clear(true, true);
    }
    
    // Create mossy brick box texture if not already created
    if (!this.textures.exists('brick-box')) {
        const graphics = this.add.graphics();
        
        // Draw brick box (brown/gray with mossy green)
        graphics.fillStyle(0x8B4513, 1); // Brown base
        graphics.fillRect(0, 0, 40, 40);
        
        // Brick pattern
        graphics.lineStyle(2, 0x654321, 1);
        graphics.lineBetween(0, 20, 40, 20); // Horizontal line
        graphics.lineBetween(20, 0, 20, 20); // Vertical line (top half)
        graphics.lineBetween(10, 20, 10, 40); // Vertical line (bottom half)
        graphics.lineBetween(30, 20, 30, 40); // Vertical line (bottom half)
        
        // Add moss (green patches)
        graphics.fillStyle(0x4A7C59, 0.6); // Mossy green
        graphics.fillCircle(8, 8, 5);
        graphics.fillCircle(32, 12, 4);
        graphics.fillCircle(15, 32, 6);
        graphics.fillCircle(30, 30, 4);
        
        // Darker moss spots
        graphics.fillStyle(0x2E5C3F, 0.4);
        graphics.fillCircle(10, 10, 3);
        graphics.fillCircle(28, 28, 3);
        
        graphics.generateTexture('brick-box', 40, 40);
        graphics.destroy();
    }
    
    // Spawn 1-2 brick boxes per level at random positions
    const numBoxes = Math.min(1 + Math.floor(currentLevel / 3), 2);
    
    for (let i = 0; i < numBoxes; i++) {
        const x = 200 + Math.random() * 400; // Random x between 200-600
        const y = 200 + Math.random() * 200; // Random y between 200-400
        const box = brickBoxes.create(x, y, 'brick-box');
        box.refreshBody();
    }
}

function createEvilTRex(x, y) {
    // Create evil T-Rex texture if not already created
    if (!this.textures.exists('evil-trex')) {
        const graphics = this.add.graphics();
        
        // Evil dinosaur body (darker, reddish)
        graphics.fillStyle(0xC62828, 1); // Dark red
        graphics.fillRoundedRect(8, 20, 24, 20, 4);
        
        // Head (angry red)
        graphics.fillStyle(0xE53935, 1);
        graphics.fillEllipse(20, 15, 16, 14);
        
        // Snout (darker)
        graphics.fillStyle(0xC62828, 1);
        graphics.fillEllipse(28, 15, 8, 6);
        
        // Tail
        graphics.fillStyle(0xC62828, 1);
        graphics.beginPath();
        graphics.moveTo(10, 30);
        graphics.lineTo(2, 35);
        graphics.lineTo(8, 38);
        graphics.closePath();
        graphics.fillPath();
        
        // Evil spikes (black)
        graphics.fillStyle(0x212121, 1);
        graphics.fillTriangle(15, 20, 18, 14, 21, 20);
        graphics.fillTriangle(21, 20, 24, 16, 27, 20);
        graphics.fillTriangle(12, 22, 14, 18, 16, 22); // Extra spike
        
        // Legs
        graphics.fillStyle(0xC62828, 1);
        graphics.fillRect(12, 38, 6, 10);
        graphics.fillRect(22, 38, 6, 10);
        
        // Clawed feet (dark)
        graphics.fillStyle(0x212121, 1);
        graphics.fillEllipse(15, 48, 8, 4);
        graphics.fillEllipse(25, 48, 8, 4);
        
        // Evil eye (red with black pupil)
        graphics.fillStyle(0xFFEB3B, 1); // Yellow eye (menacing)
        graphics.fillCircle(22, 13, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(23, 13, 2);
        
        // Angry eyebrow
        graphics.lineStyle(2, 0x000000, 1);
        graphics.lineBetween(19, 11, 24, 10);
        
        // Nostril
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(30, 15, 1);
        
        // Sharp teeth
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillTriangle(26, 16, 28, 19, 30, 16);
        graphics.fillTriangle(28, 16, 30, 19, 32, 16);
        
        graphics.generateTexture('evil-trex', 34, 50);
        graphics.destroy();
    }
    
    // Create the enemy sprite
    const enemy = enemies.create(x, y, 'evil-trex');
    enemy.setScale(1.2);
    enemy.setBounce(0);
    enemy.setCollideWorldBounds(true);
    enemy.body.setSize(28, 45, true); // Smaller hitbox
    
    // Set enemy movement
    enemy.enemySpeed = 80;
    enemy.setVelocityX(enemy.enemySpeed);
    
    // Create kill zone (invisible area on top of enemy head)
    const killZone = enemyKillZones.create(x, y - 20, null);
    killZone.body.setSize(30, 10);
    killZone.setVisible(false);
    killZone.enemy = enemy; // Link to the enemy
    enemy.killZone = killZone; // Link back
}

function updateEnemies() {
    // Update each enemy's behavior
    enemies.children.entries.forEach(enemy => {
        // Make enemy patrol back and forth
        if (enemy.body.velocity.x > 0) {
            enemy.flipX = false;
        } else {
            enemy.flipX = true;
        }
        
        // Check if enemy hit a wall or edge
        if (enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.enemySpeed *= -1;
            enemy.setVelocityX(enemy.enemySpeed);
        }
        
        // Update kill zone position to follow enemy
        if (enemy.killZone) {
            enemy.killZone.x = enemy.x;
            enemy.killZone.y = enemy.y - 25;
        }
    });
    
    // Update boss if it exists
    if (boss && boss.active) {
        // Make boss patrol back and forth
        if (boss.body.velocity.x > 0) {
            boss.flipX = false;
        } else {
            boss.flipX = true;
        }
        
        // Check if boss hit a wall or edge
        if (boss.body.blocked.left || boss.body.blocked.right) {
            boss.enemySpeed *= -1;
            boss.setVelocityX(boss.enemySpeed);
        }
    }
}

function checkBrickBoxBreak(player, box) {
    // Check if player is landing on box from above
    // Player must be falling and touching from above
    if (player.body.touching.down && box.body.touching.up && player.body.velocity.y >= 0) {
        // Break the box after a tiny delay to let collision resolve
        sceneContext.time.delayedCall(10, () => {
            if (box.active) {
                breakBrickBox.call(sceneContext, box);
            }
        });
    }
    
    // Always allow the collision to happen
    return true;
}

function breakBrickBox(box) {
    // Play break sound
    playBoxBreakSound();
    
    // Create break particles effect
    for (let i = 0; i < 8; i++) {
        const particle = this.add.rectangle(
            box.x + (Math.random() - 0.5) * 20,
            box.y + (Math.random() - 0.5) * 20,
            8, 8, 0x8B4513
        );
        
        this.tweens.add({
            targets: particle,
            x: particle.x + (Math.random() - 0.5) * 100,
            y: particle.y + Math.random() * 100 + 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }
    
    // Spawn ammo power-up
    spawnAmmoPowerUp.call(this, box.x, box.y);
    
    // Destroy the box
    box.destroy();
}

function spawnAmmoPowerUp(x, y) {
    // Create ammo power-up texture if not already created
    if (!this.textures.exists('ammo-powerup')) {
        const graphics = this.add.graphics();
        
        // Draw a bullet box/ammo crate
        graphics.fillStyle(0x8B7355, 1); // Brown crate
        graphics.fillRect(4, 4, 24, 24);
        
        // Crate details
        graphics.lineStyle(2, 0x654321, 1);
        graphics.strokeRect(4, 4, 24, 24);
        graphics.lineBetween(16, 4, 16, 28); // Vertical line
        graphics.lineBetween(4, 16, 28, 16); // Horizontal line
        
        // Yellow bullets/ammo icon
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillCircle(12, 12, 3);
        graphics.fillCircle(20, 12, 3);
        graphics.fillCircle(12, 20, 3);
        graphics.fillCircle(20, 20, 3);
        
        graphics.generateTexture('ammo-powerup', 32, 32);
        graphics.destroy();
    }
    
    // Create the power-up sprite
    const powerUp = powerUps.create(x, y, 'ammo-powerup');
    powerUp.setBounce(0.3);
    powerUp.setVelocityY(-200); // Pop up from box
    powerUp.setCollideWorldBounds(true);
    powerUp.powerUpType = 'ammo'; // Tag it as ammo
    
    // Make it bob up and down
    this.tweens.add({
        targets: powerUp,
        y: powerUp.y - 10,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}

function collectPowerUp(player, powerUp) {
    if (powerUp.powerUpType === 'ammo' || powerUp.texture.key === 'ammo-powerup') {
        // Give player ammo (6 bullets per pickup)
        const ammoAmount = 6;
        ammoCount = Math.min(ammoCount + ammoAmount, maxAmmo); // Cap at max ammo
        updateGunUI();
        
        // Play collect sound
        playPowerUpSound();
        
        // Show message
        const pickupText = sceneContext.add.text(powerUp.x, powerUp.y - 30, '+' + ammoAmount + ' AMMO!', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        pickupText.setOrigin(0.5);
        
        sceneContext.tweens.add({
            targets: pickupText,
            y: pickupText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => pickupText.destroy()
        });
        
        // Destroy the power-up
        powerUp.destroy();
    }
}

function shootGun(pointer) {
    if (!hasGun || isTransitioning) return;
    
    // Check if player has ammo
    if (ammoCount <= 0) {
        // Play empty click sound
        playEmptyGunSound();
        return;
    }
    
    // Consume ammo
    ammoCount--;
    updateGunUI();
    
    // Create bullet texture if not already created
    if (!sceneContext.textures.exists('bullet')) {
        const graphics = sceneContext.add.graphics();
        graphics.fillStyle(0xFFFF00, 1); // Yellow bullet
        graphics.fillCircle(4, 4, 4);
        graphics.fillStyle(0xFFFFFF, 1); // White center
        graphics.fillCircle(4, 4, 2);
        graphics.generateTexture('bullet', 8, 8);
        graphics.destroy();
    }
    
    // Create bullet at player position
    const bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.setScale(1.5);
    
    // Calculate direction to mouse pointer
    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    
    // Set bullet velocity toward mouse
    const bulletSpeed = 600;
    bullet.setVelocity(
        Math.cos(angle) * bulletSpeed,
        Math.sin(angle) * bulletSpeed
    );
    
    // Destroy bullet after 2 seconds
    sceneContext.time.delayedCall(2000, () => {
        if (bullet.active) bullet.destroy();
    });
    
    // Play shoot sound
    playShootSound();
}

function bulletHitEnemy(bullet, enemy) {
    if (!enemy.active || enemy.isBoss) return; // Don't process boss here
    
    // Destroy bullet
    bullet.destroy();
    
    // Damage and destroy enemy
    playEnemyDefeatedSound();
    
    if (enemy.killZone) {
        enemy.killZone.destroy();
    }
    enemy.destroy();
}

function bulletHitBoss(bullet, bossEnemy) {
    if (!bossEnemy.active || !bossEnemy.isBoss) return;
    
    // Destroy bullet
    bullet.destroy();
    
    // Damage boss
    bossEnemy.health--;
    updateBossHealthBar();
    
    // Flash boss red when hit
    bossEnemy.setTint(0xff0000);
    sceneContext.time.delayedCall(100, () => {
        if (bossEnemy.active) {
            bossEnemy.clearTint();
        }
    });
    
    // Check if boss defeated
    if (bossEnemy.health <= 0) {
        defeatBoss(bossEnemy);
    }
}

function defeatBoss(bossEnemy) {
    // Play special boss defeat sound
    playBossDefeatedSound();
    
    // Spawn lots of ammo as reward
    for (let i = 0; i < 3; i++) {
        spawnAmmoPowerUp.call(sceneContext, 
            bossEnemy.x + (Math.random() - 0.5) * 100, 
            bossEnemy.y - 50 + i * 30
        );
    }
    
    // Show victory text
    const victoryText = sceneContext.add.text(400, 200, 'BOSS DEFEATED!', {
        fontSize: '48px',
        fontFamily: 'Arial',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    });
    victoryText.setOrigin(0.5);
    victoryText.setScrollFactor(0);
    
    sceneContext.tweens.add({
        targets: victoryText,
        scale: 1.2,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => victoryText.destroy()
    });
    
    // Destroy boss
    bossEnemy.destroy();
    
    // Remove boss health bar
    if (bossHealthBar) {
        bossHealthBar.destroy();
        bossHealthBar = null;
    }
    if (bossHealthBarBg) {
        bossHealthBarBg.destroy();
        bossHealthBarBg = null;
    }
    if (bossHealthText) {
        bossHealthText.destroy();
        bossHealthText = null;
    }
    boss = null;
}

function createBossHealthBar() {
    const barX = 300;
    const barY = 50;
    const barWidth = 200;
    const barHeight = 24;
    
    // Boss name text
    bossHealthText = this.add.text(400, 30, '👹 BOSS T-REX', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#FF0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    });
    bossHealthText.setOrigin(0.5);
    bossHealthText.setScrollFactor(0);
    
    // Create background bar
    bossHealthBarBg = this.add.graphics();
    bossHealthBarBg.fillStyle(0x8B0000, 1);
    bossHealthBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 6);
    bossHealthBarBg.setScrollFactor(0);
    
    // Create health bar
    bossHealthBar = this.add.graphics();
    updateBossHealthBar();
}

function updateBossHealthBar() {
    if (!bossHealthBar || !boss || !boss.active) return;
    
    const barX = 300;
    const barY = 50;
    const barWidth = 200;
    const barHeight = 24;
    
    // Calculate health percentage
    const healthPercent = boss.health / boss.maxHealth;
    const currentBarWidth = barWidth * healthPercent;
    
    // Clear and redraw health bar
    bossHealthBar.clear();
    
    // Red to orange gradient based on health
    let healthColor;
    if (healthPercent > 0.5) {
        healthColor = 0xFF4500; // Orange-red
    } else if (healthPercent > 0.25) {
        healthColor = 0xFF0000; // Red
    } else {
        healthColor = 0x8B0000; // Dark red
    }
    
    bossHealthBar.fillStyle(healthColor, 1);
    bossHealthBar.fillRoundedRect(barX, barY, currentBarWidth, barHeight, 6);
    bossHealthBar.setScrollFactor(0);
    
    // Add border
    bossHealthBar.lineStyle(3, 0xFFFFFF, 1);
    bossHealthBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 6);
}

function hitEnemy(player, enemy) {
    if (!enemy.active) return; // Enemy already dead
    
    // Check if player is jumping on enemy head (player above enemy and falling)
    const playerBottom = player.y + (player.body.height / 2);
    const enemyTop = enemy.y - (enemy.body.height / 2);
    
    // If player is falling and hitting from above, it's a jump kill/damage
    if (player.body.velocity.y > 0 && playerBottom < enemyTop + 15) {
        // Make player bounce up
        player.setVelocityY(-300);
        
        // Check if this is the boss
        if (enemy.isBoss) {
            // Damage boss
            enemy.health -= 2; // Jumping does 2 damage
            updateBossHealthBar();
            
            // Flash boss red
            enemy.setTint(0xff0000);
            sceneContext.time.delayedCall(100, () => {
                if (enemy.active) {
                    enemy.clearTint();
                }
            });
            
            // Play hit sound
            playEnemyDefeatedSound();
            
            // Check if boss defeated
            if (enemy.health <= 0) {
                defeatBoss(enemy);
            }
        } else {
            // Kill regular enemy
            playEnemyDefeatedSound();
            
            if (enemy.killZone) {
                enemy.killZone.destroy();
            }
            enemy.destroy();
        }
        
        return; // Don't hurt the player
    }
    
    // Check if player has invincibility frames (recently hit)
    if (player.invincible) return;
    
    // Otherwise, player got hit! Push them back
    if (player.x < enemy.x) {
        player.setVelocityX(-300);
    } else {
        player.setVelocityX(300);
    }
    player.setVelocityY(-200);
    
    // Reduce health
    playerHealth--;
    updateHealthBar.call(this);
    
    // Play hurt sound
    playHurtSound();
    
    // Add temporary invincibility (1 second)
    player.invincible = true;
    player.setAlpha(0.5); // Semi-transparent while invincible
    
    setTimeout(() => {
        if (player.active) {
            player.invincible = false;
            player.setAlpha(1); // Back to normal
        }
    }, 1000);
    
    // Check for game over
    if (playerHealth <= 0) {
        gameOver.call(this);
    }
}

function gameOver() {
    // Stop the game
    player.setVelocityX(0);
    player.setVelocityY(0);
    player.body.enable = false;
    
    // Display game over text
    const gameOverText = this.add.text(400, 250, 'GAME OVER', {
        fontSize: '64px',
        fontFamily: 'Arial',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    
    const restartText = this.add.text(400, 330, 'Refresh to Restart', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    restartText.setOrigin(0.5);
    restartText.setScrollFactor(0);
}

function setupControls() {
    // Arrow keys
    cursors = this.input.keyboard.createCursorKeys();
    
    // Space bar for jump
    jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // M key for music toggle
    musicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    musicKey.on('down', toggleMusic);
}

function handlePlayerMovement() {
    const moveSpeed = 200;
    
    // Handle left and right movement
    if (cursors.left.isDown) {
        player.setVelocityX(-moveSpeed);
        player.flipX = true; // Face left
    } else if (cursors.right.isDown) {
        player.setVelocityX(moveSpeed);
        player.flipX = false; // Face right
    } else {
        // Gradually slow down when no input
        player.setVelocityX(player.body.velocity.x * 0.9);
        
        // Stop completely if velocity is very low
        if (Math.abs(player.body.velocity.x) < 10) {
            player.setVelocityX(0);
        }
    }
    
    // Handle jumping
    const onGround = player.body.touching.down;
    
    if ((cursors.up.isDown || jumpKey.isDown) && onGround && !isJumping) {
        player.setVelocityY(-550);
        isJumping = true;
    }
    
    // Reset jump flag when player lands
    if (onGround && isJumping) {
        isJumping = false;
    }
}

function updateAnimations() {
    const onGround = player.body.touching.down;
    const moving = Math.abs(player.body.velocity.x) > 10;
    
    if (!onGround) {
        // In the air
        player.anims.play('jump', true);
    } else if (moving) {
        // Moving on ground
        player.anims.play('walk', true);
    } else {
        // Standing still
        player.anims.play('idle', true);
    }
}

function addClouds() {
    // Add some decorative clouds
    const cloudGraphics = this.add.graphics();
    cloudGraphics.fillStyle(0xFFFFFF, 0.8);
    
    // Create a cloud shape
    cloudGraphics.fillCircle(0, 0, 15);
    cloudGraphics.fillCircle(15, -5, 18);
    cloudGraphics.fillCircle(30, 0, 15);
    cloudGraphics.fillCircle(15, 5, 12);
    
    cloudGraphics.generateTexture('cloud', 45, 25);
    cloudGraphics.destroy();
    
    // Add clouds at different positions
    this.add.image(100, 80, 'cloud').setAlpha(0.7);
    this.add.image(300, 120, 'cloud').setAlpha(0.6).setScale(1.2);
    this.add.image(600, 60, 'cloud').setAlpha(0.8).setScale(0.9);
    this.add.image(700, 140, 'cloud').setAlpha(0.5).setScale(1.1);
}

function createHealthBar() {
    // Health bar position (top right corner)
    const barX = 650;
    const barY = 30;
    const barWidth = 120;
    const barHeight = 20;
    
    // Create health text label
    healthText = this.add.text(barX - 60, barY - 8, 'HEALTH:', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    healthText.setScrollFactor(0); // Fixed to camera
    
    // Create background bar (dark red)
    healthBarBackground = this.add.graphics();
    healthBarBackground.fillStyle(0x8B0000, 1);
    healthBarBackground.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    healthBarBackground.setScrollFactor(0); // Fixed to camera
    
    // Create health bar (bright red/green gradient based on health)
    healthBar = this.add.graphics();
    updateHealthBar.call(this);
}

function createLevelCounter() {
    // Level counter position (top left corner)
    levelText = this.add.text(20, 20, 'LEVEL: ' + currentLevel, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    });
    levelText.setScrollFactor(0); // Fixed to camera
}

function updateLevelCounter() {
    if (levelText) {
        levelText.setText('LEVEL: ' + currentLevel);
    }
}

function createMusicToggleUI() {
    // Music status position (bottom right corner)
    musicText = this.add.text(680, 560, 'MUSIC: ON [M]', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    musicText.setScrollFactor(0); // Fixed to camera
}

function createGunUI() {
    // Gun & Ammo display position (bottom left corner)
    gunIcon = this.add.text(20, 540, '🔫 AMMO', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    gunIcon.setScrollFactor(0); // Fixed to camera
    
    // Create ammo bar background
    ammoBarBackground = this.add.graphics();
    ammoBarBackground.fillStyle(0x333333, 1);
    ammoBarBackground.fillRoundedRect(20, 560, 120, 16, 4);
    ammoBarBackground.setScrollFactor(0);
    
    // Create ammo bar
    ammoBar = this.add.graphics();
    updateGunUI();
}

function updateGunUI() {
    if (!ammoBar) return;
    
    const barX = 20;
    const barY = 560;
    const barWidth = 120;
    const barHeight = 16;
    
    // Calculate ammo percentage
    const ammoPercent = Math.max(0, Math.min(ammoCount / maxAmmo, 1));
    const currentBarWidth = barWidth * ammoPercent;
    
    // Clear and redraw ammo bar
    ammoBar.clear();
    
    // Choose color based on ammo level
    let ammoColor;
    if (ammoPercent > 0.5) {
        ammoColor = 0x4CAF50; // Green (lots of ammo)
    } else if (ammoPercent > 0.25) {
        ammoColor = 0xFFA726; // Orange (medium ammo)
    } else if (ammoPercent > 0) {
        ammoColor = 0xF44336; // Red (low ammo)
    } else {
        ammoColor = 0x8B0000; // Dark red (empty)
    }
    
    ammoBar.fillStyle(ammoColor, 1);
    ammoBar.fillRoundedRect(barX, barY, currentBarWidth, barHeight, 4);
    ammoBar.setScrollFactor(0); // Fixed to camera
    
    // Add white border
    ammoBar.lineStyle(2, 0xFFFFFF, 1);
    ammoBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 4);
    
    // Update text with ammo count
    if (gunIcon) {
        gunIcon.setText('🔫 AMMO: ' + ammoCount + '/' + maxAmmo);
    }
}

function updateMusicUI() {
    if (musicText) {
        if (musicEnabled) {
            musicText.setText('MUSIC: ON [M]');
            musicText.setColor('#4CAF50'); // Green when on
        } else {
            musicText.setText('MUSIC: OFF [M]');
            musicText.setColor('#F44336'); // Red when off
        }
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    updateMusicUI();
    
    if (!musicEnabled) {
        // Stop music by clearing the timeout
        if (currentMusicTimeout) {
            clearTimeout(currentMusicTimeout);
            currentMusicTimeout = null;
        }
        musicPlaying = false;
    } else {
        // Restart music if it was off
        if (!musicPlaying) {
            playBackgroundMusic();
        }
    }
}

function updateHealthBar() {
    if (!healthBar) return;
    
    const barX = 650;
    const barY = 30;
    const barWidth = 120;
    const barHeight = 20;
    
    // Calculate health percentage
    const healthPercent = playerHealth / maxHealth;
    const currentBarWidth = barWidth * healthPercent;
    
    // Clear and redraw health bar
    healthBar.clear();
    
    // Choose color based on health level
    let healthColor;
    if (healthPercent > 0.6) {
        healthColor = 0x4CAF50; // Green (healthy)
    } else if (healthPercent > 0.3) {
        healthColor = 0xFFA726; // Orange (warning)
    } else {
        healthColor = 0xF44336; // Red (critical)
    }
    
    healthBar.fillStyle(healthColor, 1);
    healthBar.fillRoundedRect(barX, barY, currentBarWidth, barHeight, 4);
    healthBar.setScrollFactor(0); // Fixed to camera
    
    // Add white border
    healthBar.lineStyle(2, 0xFFFFFF, 1);
    healthBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 4);
}

function checkLevelTransition() {
    if (isTransitioning || !player.active) return;
    
    // Check if player is pushing against the left or right world boundary
    // Since player has setCollideWorldBounds(true), we check if they're blocked
    const touchingLeftWall = player.body.blocked.left && player.x < 50;
    const touchingRightWall = player.body.blocked.right && player.x > 750;
    
    if (touchingLeftWall || touchingRightWall) {
        isTransitioning = true;
        transitionToNewLevel.call(sceneContext);
    }
}

function transitionToNewLevel() {
    // Increment level
    currentLevel++;
    updateLevelCounter();
    
    // Play level complete sound
    playLevelCompleteSound();
    
    // Show level transition text
    const transitionText = this.add.text(400, 250, 'LEVEL ' + currentLevel, {
        fontSize: '48px',
        fontFamily: 'Arial',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    });
    transitionText.setOrigin(0.5);
    transitionText.setScrollFactor(0);
    transitionText.setAlpha(0);
    
    // Fade in text
    this.tweens.add({
        targets: transitionText,
        alpha: 1,
        duration: 300,
        ease: 'Power2'
    });
    
    // Reset player position to center
    player.setPosition(400, 300);
    player.setVelocity(0, 0);
    
    // Clear old boss health bar if it exists
    if (bossHealthBar) {
        bossHealthBar.destroy();
        bossHealthBar = null;
    }
    if (bossHealthBarBg) {
        bossHealthBarBg.destroy();
        bossHealthBarBg = null;
    }
    if (bossHealthText) {
        bossHealthText.destroy();
        bossHealthText = null;
    }
    boss = null;
    
    // Regenerate level
    createPlatforms.call(this);
    createEnemies.call(this);
    
    // Create boss on boss levels (every 10 levels)
    if (currentLevel % 10 === 0) {
        createBoss.call(this);
    }
    
    createBrickBoxes.call(this);
    
    // Re-enable collisions for new level
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    this.physics.add.collider(player, brickBoxes, null, checkBrickBoxBreak, this);
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
    this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
    
    // Add boss collisions if boss exists
    if (boss) {
        this.physics.add.overlap(bullets, boss, bulletHitBoss, null, this);
    }
    
    // Fade out text and end transition
    setTimeout(() => {
        this.tweens.add({
            targets: transitionText,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                transitionText.destroy();
                isTransitioning = false;
            }
        });
    }, 1500);
}

function initAudio() {
    // Initialize Web Audio API context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Start background music after a short delay
    setTimeout(() => {
        playBackgroundMusic();
    }, 500);
}

function playBackgroundMusic() {
    if (!audioContext || musicPlaying || !musicEnabled) return;
    musicPlaying = true;
    
    // Extended cute melody with more variation - a happy, playful tune
    const melody = [
        // Phrase 1: Opening theme
        { freq: 523.25, duration: 0.3 },  // C5
        { freq: 587.33, duration: 0.3 },  // D5
        { freq: 659.25, duration: 0.3 },  // E5
        { freq: 587.33, duration: 0.3 },  // D5
        { freq: 523.25, duration: 0.3 },  // C5
        { freq: 587.33, duration: 0.3 },  // D5
        { freq: 659.25, duration: 0.6 },  // E5 (longer)
        { freq: 0, duration: 0.2 },       // Rest
        
        // Phrase 2: Ascending melody
        { freq: 659.25, duration: 0.3 },  // E5
        { freq: 698.46, duration: 0.3 },  // F5
        { freq: 783.99, duration: 0.6 },  // G5 (longer)
        { freq: 0, duration: 0.2 },       // Rest
        
        // Phrase 3: Playful bounce
        { freq: 783.99, duration: 0.2 },  // G5
        { freq: 698.46, duration: 0.2 },  // F5
        { freq: 659.25, duration: 0.2 },  // E5
        { freq: 587.33, duration: 0.2 },  // D5
        { freq: 523.25, duration: 0.6 },  // C5 (longer)
        { freq: 0, duration: 0.3 },       // Rest
        
        // Phrase 4: NEW - Higher variation
        { freq: 659.25, duration: 0.3 },  // E5
        { freq: 783.99, duration: 0.3 },  // G5
        { freq: 880.00, duration: 0.4 },  // A5
        { freq: 783.99, duration: 0.2 },  // G5
        { freq: 659.25, duration: 0.3 },  // E5
        { freq: 698.46, duration: 0.5 },  // F5
        { freq: 0, duration: 0.3 },       // Rest
        
        // Phrase 5: NEW - Lower melody
        { freq: 392.00, duration: 0.3 },  // G4
        { freq: 440.00, duration: 0.3 },  // A4
        { freq: 493.88, duration: 0.3 },  // B4
        { freq: 523.25, duration: 0.4 },  // C5
        { freq: 587.33, duration: 0.3 },  // D5
        { freq: 0, duration: 0.3 },       // Rest
        
        // Phrase 6: NEW - Playful skip pattern
        { freq: 523.25, duration: 0.2 },  // C5
        { freq: 659.25, duration: 0.2 },  // E5
        { freq: 523.25, duration: 0.2 },  // C5
        { freq: 659.25, duration: 0.2 },  // E5
        { freq: 783.99, duration: 0.4 },  // G5
        { freq: 659.25, duration: 0.4 },  // E5
        { freq: 0, duration: 0.3 },       // Rest
        
        // Phrase 7: NEW - Descending cascade
        { freq: 880.00, duration: 0.25 },  // A5
        { freq: 783.99, duration: 0.25 },  // G5
        { freq: 698.46, duration: 0.25 },  // F5
        { freq: 659.25, duration: 0.25 },  // E5
        { freq: 587.33, duration: 0.3 },   // D5
        { freq: 523.25, duration: 0.7 },   // C5 (long ending)
        { freq: 0, duration: 0.5 },        // Rest
    ];
    
    let currentTime = audioContext.currentTime;
    
    // Play the melody
    melody.forEach((note) => {
        if (note.freq > 0) {
            playNote(note.freq, currentTime, note.duration, 0.08); // Quiet background volume
        }
        currentTime += note.duration;
    });
    
    // Loop the music
    const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
    currentMusicTimeout = setTimeout(() => {
        musicPlaying = false;
        playBackgroundMusic();
    }, totalDuration * 1000);
}

function playNote(frequency, startTime, duration, volume = 0.1) {
    if (!audioContext) return;
    
    // Create oscillator for the note
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure note sound (sine wave for soft, pleasant tone)
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Create ADSR envelope for natural sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02); // Attack
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.05); // Decay
    gainNode.gain.setValueAtTime(volume * 0.7, startTime + duration - 0.05); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release
    
    // Play the note
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function playFootstep() {
    if (!audioContext) return;
    
    // Create oscillator for footstep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure footstep sound (short, low thud)
    oscillator.type = 'sine';
    oscillator.frequency.value = 80; // Low frequency for thud sound
    
    // Create envelope for natural sound
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.15, now); // Start volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // Fade out
    
    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.1); // Very short sound
}

function playEnemyDefeatedSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play a descending "defeat" sound
    const frequencies = [800, 600, 400, 200];
    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.05);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.1);
    });
}

function playHurtSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play a harsh "ouch" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
}

function playLevelCompleteSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play an ascending "success" fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C (octave)
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.1);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
    });
}

function playBoxBreakSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play a "crunch" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
}

function playPowerUpSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play a "power-up" sound (rising arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C-E-G-C-E
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.05);
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
    });
}

function playShootSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play a "pew" laser sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
}

function playEmptyGunSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play a "click" sound for empty gun
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.value = 150;
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
}

function playBossDefeatedSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Play epic descending "victory" sound
    const notes = [1046.50, 987.77, 880.00, 783.99, 698.46, 659.25, 523.25]; // C-B-A-G-F-E-C
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.08);
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
    });
}

function trackFootsteps() {
    const onGround = player.body.touching.down;
    const moving = Math.abs(player.body.velocity.x) > 10;
    
    // Only track footsteps when moving on the ground
    if (moving && onGround) {
        // Add to distance traveled (absolute value to count both directions)
        distanceTraveled += Math.abs(player.body.velocity.x) * (1/60); // Approximate delta time
        
        // Play footstep sound when we've traveled far enough
        if (distanceTraveled >= stepDistance) {
            playFootstep();
            distanceTraveled = 0; // Reset counter
        }
    } else {
        // Reset distance when not walking
        distanceTraveled = 0;
    }
}
