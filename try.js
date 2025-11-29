
// Game variables - Optimized for performance
let gameActive = false;
let gamePaused = false;
let score = 0;
let highScore = 0;
let selectedCharacter = 1;
let characterElement;
let gameArea;
let gameLoopId;
let lastTimestamp = 0;
let frameCount = 0;

// Physics variables
let gravity = 0.5;
let velocity = 0;
let characterY = 0;
let characterX = 0;

// Game objects
let obstacles = [];
let obstacleSpeed = 2.5;
let obstacleFrequency = 180;
let lastObstacleX = 0;

// Audio and state
let collisionSoundPlayed = false;
let musicEnabled = true;
let dialoguePlayed = false;

// Performance monitoring
let fps = 0;
let lastFpsUpdate = 0;
let frameTimes = [];

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowEndDevice = isMobile && (/Android [2-4]|iOS [1-9]_|iPhone [1-4]/i.test(navigator.userAgent));

// DOM Elements
const startScreen = document.getElementById('startScreen');
const characterScreen = document.getElementById('characterScreen');
const gameScreen = document.getElementById('gameScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const playButton = document.getElementById('playButton');
const backButton = document.getElementById('backButton');
const restartButton = document.getElementById('restartButton');
const menuButton = document.getElementById('menuButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const quitButton = document.getElementById('quitButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScore = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScore');
const characterElements = document.querySelectorAll('.character');
const musicToggle = document.getElementById('musicToggle');
const gameMusicToggle = document.getElementById('gameMusicToggle');

// Audio Elements
const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const collisionSound = document.getElementById('collisionSound');
const dialogue1 = document.getElementById('dialogue1');

// Initialize game
function init() {
    console.log('Initializing game... Mobile:', isMobile, 'LowEnd:', isLowEndDevice);
    
    // Load saved data
    highScore = parseInt(localStorage.getItem('flappyFirePoleHighScore')) || 0;
    selectedCharacter = parseInt(localStorage.getItem('flappyFirePoleCharacter')) || 1;
    musicEnabled = localStorage.getItem('flappyFirePoleMusic') !== 'false';
    
    updateMusicButton();
    setupEventListeners();
    initializeAudio();
    setupImageErrorHandling();
    
    // Adjust for device capabilities
    adjustForDevicePerformance();
    
    // Pre-select character
    const savedCharacter = document.querySelector(`.character[data-character="${selectedCharacter}"]`);
    if (savedCharacter) {
        savedCharacter.classList.add('selected');
    }
}

function adjustForDevicePerformance() {
    if (isLowEndDevice) {
        // Ultra-low settings for very old devices
        obstacleSpeed = 2;
        obstacleFrequency = 200;
        gravity = 0.4;
    } else if (isMobile) {
        // Standard mobile settings
        obstacleSpeed = 2.5;
        obstacleFrequency = 180;
        gravity = 0.45;
    } else {
        // Desktop settings
        obstacleSpeed = 3;
        obstacleFrequency = 120;
        gravity = 0.5;
    }
}

function setupEventListeners() {
    // Button events
    playButton.addEventListener('click', showCharacterScreen);
    backButton.addEventListener('click', showStartScreen);
    restartButton.addEventListener('click', restartGame);
    menuButton.addEventListener('click', showStartScreen);
    pauseButton.addEventListener('click', pauseGame);
    resumeButton.addEventListener('click', resumeGame);
    quitButton.addEventListener('click', quitToMenu);
    
    // Music controls
    musicToggle.addEventListener('click', toggleMusic);
    gameMusicToggle.addEventListener('click', toggleMusic);
    
    // Character selection
    characterElements.forEach(char => {
        char.addEventListener('click', () => {
            characterElements.forEach(c => c.classList.remove('selected'));
            char.classList.add('selected');
            selectedCharacter = parseInt(char.getAttribute('data-character'));
            localStorage.setItem('flappyFirePoleCharacter', selectedCharacter);
            startGame();
        });
    });
    
    // Game controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Mobile touch controls
    if (isMobile) {
        setupMobileControls();
    } else {
        document.addEventListener('click', handleTap);
    }
    
    // Performance and visibility events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
}

function setupMobileControls() {
    // Full screen tap for jump
    gameScreen.addEventListener('touchstart', handleMobileTap, { passive: false });
    
    // Prevent default touch behaviors
    document.addEventListener('touchmove', function(e) {
        if (gameActive && !gamePaused) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

function handleMobileTap(e) {
    e.preventDefault();
    if (gameActive && gameScreen.classList.contains('active') && !gamePaused) {
        jump();
    }
}

function setupImageErrorHandling() {
    const characterImages = document.querySelectorAll('.character-img');
    characterImages.forEach(img => {
        img.onerror = function() {
            const placeholder = document.createElement('div');
            placeholder.className = 'character-img-placeholder';
            placeholder.textContent = 'Char ' + this.parentElement.getAttribute('data-character');
            this.parentElement.replaceChild(placeholder, this);
        };
    });
}

function initializeAudio() {
    backgroundMusic.volume = 0.3;
    jumpSound.volume = 0.2;
    collisionSound.volume = 0.4;
    dialogue1.volume = 0.5;
    
    // Mobile audio optimization
    if (isMobile) {
        backgroundMusic.preload = 'auto';
        jumpSound.preload = 'auto';
        collisionSound.preload = 'auto';
        dialogue1.preload = 'auto';
    }
}

// Screen management functions
function showStartScreen() {
    hideAllScreens();
    startScreen.classList.add('active');
    stopBackgroundMusic();
    resetGameState();
}

function showCharacterScreen() {
    hideAllScreens();
    characterScreen.classList.add('active');
}

function showGameScreen() {
    hideAllScreens();
    gameScreen.classList.add('active');
}

function showPauseScreen() {
    hideAllScreens();
    pauseScreen.classList.add('active');
}

function showGameOverScreen() {
    hideAllScreens();
    gameOverScreen.classList.add('active');
    finalScore.textContent = `Final Score: ${score}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    
    if (!dialoguePlayed && musicEnabled) {
        playCharacterDialogue();
        dialoguePlayed = true;
    }
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
}

function resetGameState() {
    dialoguePlayed = false;
    gamePaused = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

// Game core functions
function startGame() {
    showGameScreen();
    
    // Reset game state
    gameActive = true;
    gamePaused = false;
    score = 0;
    velocity = 0;
    frameCount = 0;
    lastTimestamp = 0;
    obstacles = [];
    lastObstacleX = 0;
    collisionSoundPlayed = false;
    dialoguePlayed = false;
    
    scoreDisplay.textContent = `Score: ${score}`;
    
    // Set up game area
    setupGameArea();
    
    // Create character
    createCharacterElement();
    
    // Set initial position
    characterX = gameArea.offsetWidth * 0.2;
    characterY = gameArea.offsetHeight / 2;
    updateCharacterPosition();
    
    // Start optimized game loop
    lastTimestamp = performance.now();
    gameLoopId = requestAnimationFrame(optimizedGameLoop);
    
    // Start music
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

function setupGameArea() {
    gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';
    
    // Create minimal ground and ceiling
    const ground = document.createElement('div');
    ground.className = 'ground';
    gameArea.appendChild(ground);
    
    const ceiling = document.createElement('div');
    ceiling.className = 'ceiling';
    gameArea.appendChild(ceiling);
}

function createCharacterElement() {
    characterElement = document.createElement('div');
    characterElement.className = 'character-element';
    
    if (selectedCharacter === 1) {
        const img = new Image();
        img.onload = function() {
            characterElement.style.backgroundImage = `url('amit.png')`;
            characterElement.classList.remove('placeholder');
        };
        img.onerror = function() {
            characterElement.textContent = `C${selectedCharacter}`;
            characterElement.classList.add('placeholder');
        };
        img.src = 'amit.png';
    } else {
        characterElement.textContent = `C${selectedCharacter}`;
        characterElement.classList.add('placeholder');
    }
    
    gameArea.appendChild(characterElement);
}

// Optimized Game Loop with frame rate control
function optimizedGameLoop(timestamp) {
    if (!gameActive || gamePaused) return;
    
    // Calculate delta time for consistent physics
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Limit frame rate on mobile to save battery and improve performance
    if (isMobile && deltaTime < 16) { // ~60fps
        gameLoopId = requestAnimationFrame(optimizedGameLoop);
        return;
    }
    
    frameCount++;
    
    // Apply physics
    velocity += gravity * (deltaTime / 16); // Normalize to 60fps
    characterY += velocity;
    
    // Update character
    updateCharacterPosition();
    
    // Generate obstacles (less frequent on slow devices)
    if (frameCount - lastObstacleX > obstacleFrequency) {
        createOptimizedObstacle();
        lastObstacleX = frameCount;
    }
    
    // Move obstacles
    moveObstacles();
    
    // Check collisions
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Continue game loop
    gameLoopId = requestAnimationFrame(optimizedGameLoop);
}

function updateCharacterPosition() {
    // Boundary checking
    if (characterY < 20) {
        characterY = 20;
        velocity = 0;
        if (!collisionSoundPlayed) {
            playCollisionSound();
            collisionSoundPlayed = true;
        }
    } else if (characterY > gameArea.offsetHeight - 20 - characterElement.offsetHeight) {
        characterY = gameArea.offsetHeight - 20 - characterElement.offsetHeight;
        velocity = 0;
        if (!collisionSoundPlayed) {
            playCollisionSound();
            collisionSoundPlayed = true;
        }
    }
    
    // Apply rotation
    let rotation = Math.min(Math.max(velocity * 2, -25), 25);
    
    // Update transform for hardware acceleration
    characterElement.style.transform = `translate3d(${characterX}px, ${characterY}px, 0) rotate(${rotation}deg)`;
}

function createOptimizedObstacle() {
    const gapHeight = isMobile ? 160 : 180;
    const minGapPosition = 80;
    const maxGapPosition = gameArea.offsetHeight - gapHeight - 80;
    const gapPosition = Math.random() * (maxGapPosition - minGapPosition) + minGapPosition;
    
    // Create top pole
    const topPole = document.createElement('div');
    topPole.className = 'fire-pole top';
    topPole.style.height = `${gapPosition}px`;
    topPole.style.transform = `translate3d(${gameArea.offsetWidth}px, 0, 0)`;
    
    const topPoleBody = document.createElement('div');
    topPoleBody.className = 'fire-pole-body';
    topPole.appendChild(topPoleBody);
    gameArea.appendChild(topPole);
    
    // Create bottom pole
    const bottomPole = document.createElement('div');
    bottomPole.className = 'fire-pole bottom';
    bottomPole.style.height = `${gameArea.offsetHeight - gapPosition - gapHeight}px`;
    bottomPole.style.transform = `translate3d(${gameArea.offsetWidth}px, 0, 0)`;
    
    const bottomPoleBody = document.createElement('div');
    bottomPoleBody.className = 'fire-pole-body';
    bottomPole.appendChild(bottomPoleBody);
    gameArea.appendChild(bottomPole);
    
    obstacles.push({
        top: topPole,
        bottom: bottomPole,
        x: gameArea.offsetWidth,
        gapPosition: gapPosition,
        gapHeight: gapHeight,
        passed: false
    });
}

function moveObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= obstacleSpeed;
        
        // Use transform3d for hardware acceleration
        obstacle.top.style.transform = `translate3d(${obstacle.x}px, 0, 0)`;
        obstacle.bottom.style.transform = `translate3d(${obstacle.x}px, 0, 0)`;
        
        // Score update
        if (!obstacle.passed && obstacle.x + 50 < characterX) {
            obstacle.passed = true;
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }
        
        // Remove off-screen obstacles
        if (obstacle.x < -50) {
            if (obstacle.top.parentNode) {
                gameArea.removeChild(obstacle.top);
            }
            if (obstacle.bottom.parentNode) {
                gameArea.removeChild(obstacle.bottom);
            }
            obstacles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Quick boundary check
    if (characterY <= 20 || characterY >= gameArea.offsetHeight - 20 - characterElement.offsetHeight) {
        return true;
    }
    
    // Optimized collision detection with simpler math
    const charRight = characterX + characterElement.offsetWidth;
    const charBottom = characterY + characterElement.offsetHeight;
    
    for (const obstacle of obstacles) {
        const poleRight = obstacle.x + 50;
        
        // Quick AABB test
        if (charRight > obstacle.x && characterX < poleRight) {
            // Check top pole collision
            if (charBottom > 0 && characterY < obstacle.gapPosition) {
                if (!collisionSoundPlayed) {
                    playCollisionSound();
                    collisionSoundPlayed = true;
                }
                return true;
            }
            
            // Check bottom pole collision
            const bottomPoleTop = obstacle.gapPosition + obstacle.gapHeight;
            if (characterY < gameArea.offsetHeight && charBottom > bottomPoleTop) {
                if (!collisionSoundPlayed) {
                    playCollisionSound();
                    collisionSoundPlayed = true;
                }
                return true;
            }
        }
    }
    
    return false;
}

// Input handlers
function handleKeyPress(e) {
    if (e.code === 'Space' && gameActive && !gamePaused) {
        e.preventDefault();
        jump();
    } else if (e.code === 'Escape' && gameActive) {
        e.preventDefault();
        gamePaused ? resumeGame() : pauseGame();
    }
}

function handleTap(e) {
    if (gameActive && gameScreen.classList.contains('active') && !gamePaused) {
        jump();
    }
}

function jump() {
    velocity = isMobile ? -7 : -9;
    playJumpSound();
}

// Game state management
function pauseGame() {
    if (!gameActive || gamePaused) return;
    
    gamePaused = true;
    cancelAnimationFrame(gameLoopId);
    stopBackgroundMusic();
    showPauseScreen();
}

function resumeGame() {
    if (!gameActive || !gamePaused) return;
    
    gamePaused = false;
    showGameScreen();
    lastTimestamp = performance.now();
    gameLoopId = requestAnimationFrame(optimizedGameLoop);
    
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

function quitToMenu() {
    gameActive = false;
    gamePaused = false;
    cancelAnimationFrame(gameLoopId);
    showStartScreen();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(gameLoopId);
    stopBackgroundMusic();
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyFirePoleHighScore', highScore);
    }
    
    // Small delay for smooth transition
    setTimeout(showGameOverScreen, 500);
}

function restartGame() {
    startGame();
}

// Audio functions
function toggleMusic() {
    musicEnabled = !musicEnabled;
    localStorage.setItem('flappyFirePoleMusic', musicEnabled);
    updateMusicButton();
    
    if (musicEnabled && gameScreen.classList.contains('active') && !gamePaused) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

function updateMusicButton() {
    const text = musicEnabled ? 'Music: ON' : 'Music: OFF';
    if (musicToggle) musicToggle.textContent = text;
    if (gameMusicToggle) gameMusicToggle.textContent = musicEnabled ? '🔊' : '🔇';
}

function playBackgroundMusic() {
    if (!musicEnabled) return;
    try {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => console.log("Background music play failed:", e));
    } catch (e) {
        console.log("Background music error:", e);
    }
}

function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function playJumpSound() {
    if (!musicEnabled) return;
    try {
        jumpSound.currentTime = 0;
        jumpSound.play().catch(e => console.log("Jump sound play failed:", e));
    } catch (e) {
        console.log("Jump sound error:", e);
    }
}

function playCollisionSound() {
    if (!musicEnabled) return;
    try {
        collisionSound.currentTime = 0;
        collisionSound.play().catch(e => console.log("Collision sound play failed:", e));
    } catch (e) {
        console.log("Collision sound error:", e);
    }
}

function playCharacterDialogue() {
    if (!musicEnabled) return;
    try {
        dialogue1.currentTime = 0;
        dialogue1.play().catch(e => console.log("Dialogue play failed:", e));
    } catch (e) {
        console.log("Dialogue error:", e);
    }
}

// Performance and visibility handlers
function handleVisibilityChange() {
    if (document.hidden && gameActive && !gamePaused) {
        pauseGame();
    }
}

function handleWindowBlur() {
    if (gameActive && !gamePaused) {
        pauseGame();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', init);

// Prevent default touch behaviors
document.addEventListener('touchstart', function(e) {
    if (e.target.tagName !== 'BUTTON') {
        e.preventDefault();
    }
}, { passive: false });

// Force garbage collection on game over (where possible)
function forceCleanup() {
    if (window.gc) {
        window.gc();
    }
    obstacles = [];
}
