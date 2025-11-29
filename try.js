// Game variables
let gameActive = false;
let gamePaused = false;
let score = 0;
let highScore = 0;
let selectedCharacter = 1;
let characterElement;
let gameArea;
let gameLoopId;
let gravity = 0.5;
let velocity = 0;
let characterY = 0;
let characterX = 0;
let obstacles = [];
let obstacleSpeed = 3;
let obstacleFrequency = 120;
let frameCount = 0;
let lastObstacleX = 0;
let collisionSoundPlayed = false;
let musicEnabled = true;
let dialoguePlayed = false;

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

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize game
function init() {
    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('flappyFirePoleHighScore')) || 0;
    
    // Load selected character from localStorage
    selectedCharacter = parseInt(localStorage.getItem('flappyFirePoleCharacter')) || 1;
    
    // Load music preference from localStorage
    musicEnabled = localStorage.getItem('flappyFirePoleMusic') !== 'false';
    updateMusicButton();
    
    // Set up event listeners
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
    
    // Set up game controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Mobile touch controls
    if (isMobile) {
        setupMobileControls();
    } else {
        document.addEventListener('click', handleTap);
    }
    
    // Pre-select the saved character
    const savedCharacter = document.querySelector(`.character[data-character="${selectedCharacter}"]`);
    if (savedCharacter) {
        savedCharacter.classList.add('selected');
    }
    
    // Initialize audio elements
    initializeAudio();
    
    // Handle image loading errors
    setupImageErrorHandling();
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
    backgroundMusic.volume = 0.4;
    jumpSound.volume = 0.3;
    collisionSound.volume = 0.5;
    dialogue1.volume = 0.6;
    
    // Mobile audio fix - preload and play on user interaction
    if (isMobile) {
        backgroundMusic.load();
        jumpSound.load();
        collisionSound.load();
        dialogue1.load();
    }
}

function showStartScreen() {
    hideAllScreens();
    startScreen.classList.add('active');
    stopBackgroundMusic();
    dialoguePlayed = false;
    gamePaused = false;
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
    startScreen.classList.remove('active');
    characterScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    pauseScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
}

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
    gameLoopId = requestAnimationFrame(gameLoop);
    
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

function quitToMenu() {
    gamePaused = false;
    gameActive = false;
    cancelAnimationFrame(gameLoopId);
    showStartScreen();
}

function startGame() {
    showGameScreen();
    
    // Reset game variables
    gameActive = true;
    gamePaused = false;
    score = 0;
    velocity = 0;
    frameCount = 0;
    obstacles = [];
    lastObstacleX = 0;
    collisionSoundPlayed = false;
    dialoguePlayed = false;
    
    scoreDisplay.textContent = `Score: ${score}`;
    
    // Set up game area
    gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';
    
    // Create ground and ceiling
    const ground = document.createElement('div');
    ground.className = 'ground';
    gameArea.appendChild(ground);
    
    const ceiling = document.createElement('div');
    ceiling.className = 'ceiling';
    gameArea.appendChild(ceiling);
    
    // Create character
    createCharacterElement();
    
    // Set initial character position
    characterX = gameArea.offsetWidth * 0.2;
    characterY = gameArea.offsetHeight / 2;
    updateCharacterPosition();
    
    // Adjust for mobile
    if (isMobile) {
        obstacleSpeed = 2.5;
        obstacleFrequency = 150;
    }
    
    // Start game loop
    gameLoopId = requestAnimationFrame(gameLoop);
    
    // Start background music if enabled
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

function createCharacterElement() {
    characterElement = document.createElement('div');
    characterElement.className = 'character-element';
    
    // For character 1, use amit.png
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
        // For other characters, use placeholder
        characterElement.textContent = `C${selectedCharacter}`;
        characterElement.classList.add('placeholder');
    }
    
    gameArea.appendChild(characterElement);
}

function gameLoop() {
    if (!gameActive || gamePaused) return;
    
    frameCount++;
    
    // Apply gravity
    velocity += gravity;
    characterY += velocity;
    
    // Update character position
    updateCharacterPosition();
    
    // Generate obstacles
    if (frameCount - lastObstacleX > obstacleFrequency) {
        createObstacle();
        lastObstacleX = frameCount;
    }
    
    // Move obstacles
    moveObstacles();
    
    // Check for collisions
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Continue game loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateCharacterPosition() {
    // Keep character within bounds
    if (characterY < 25) {
        characterY = 25;
        velocity = 0;
        if (!collisionSoundPlayed) {
            playCollisionSound();
            collisionSoundPlayed = true;
        }
    } else if (characterY > gameArea.offsetHeight - 25 - characterElement.offsetHeight) {
        characterY = gameArea.offsetHeight - 25 - characterElement.offsetHeight;
        velocity = 0;
        if (!collisionSoundPlayed) {
            playCollisionSound();
            collisionSoundPlayed = true;
        }
    }
    
    // Apply rotation based on velocity
    let rotation = Math.min(Math.max(velocity * 3, -30), 30);
    characterElement.style.transform = `rotate(${rotation}deg)`;
    
    // Update position
    characterElement.style.left = `${characterX}px`;
    characterElement.style.top = `${characterY}px`;
}

function createObstacle() {
    const gapHeight = isMobile ? 180 : 200;
    const minGapPosition = 100;
    const maxGapPosition = gameArea.offsetHeight - gapHeight - 100;
    const gapPosition = Math.random() * (maxGapPosition - minGapPosition) + minGapPosition;
    
    // Create top fire pole
    const topPole = document.createElement('div');
    topPole.className = 'fire-pole top';
    topPole.style.height = `${gapPosition}px`;
    topPole.style.left = `${gameArea.offsetWidth}px`;
    
    const topPoleBody = document.createElement('div');
    topPoleBody.className = 'fire-pole-body';
    topPoleBody.style.height = '100%';
    topPole.appendChild(topPoleBody);
    gameArea.appendChild(topPole);
    
    // Create bottom fire pole
    const bottomPole = document.createElement('div');
    bottomPole.className = 'fire-pole bottom';
    bottomPole.style.height = `${gameArea.offsetHeight - gapPosition - gapHeight}px`;
    bottomPole.style.left = `${gameArea.offsetWidth}px`;
    
    const bottomPoleBody = document.createElement('div');
    bottomPoleBody.className = 'fire-pole-body';
    bottomPoleBody.style.height = '100%';
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
        
        obstacle.top.style.left = `${obstacle.x}px`;
        obstacle.bottom.style.left = `${obstacle.x}px`;
        
        if (!obstacle.passed && obstacle.x + 60 < characterX) {
            obstacle.passed = true;
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }
        
        if (obstacle.x < -60) {
            gameArea.removeChild(obstacle.top);
            gameArea.removeChild(obstacle.bottom);
            obstacles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (characterY <= 25 || characterY >= gameArea.offsetHeight - 25 - characterElement.offsetHeight) {
        return true;
    }
    
    for (const obstacle of obstacles) {
        const characterRect = {
            left: characterX,
            right: characterX + characterElement.offsetWidth,
            top: characterY,
            bottom: characterY + characterElement.offsetHeight
        };
        
        const topPoleRect = {
            left: obstacle.x,
            right: obstacle.x + 60,
            top: 0,
            bottom: obstacle.gapPosition
        };
        
        const bottomPoleRect = {
            left: obstacle.x,
            right: obstacle.x + 60,
            top: obstacle.gapPosition + obstacle.gapHeight,
            bottom: gameArea.offsetHeight
        };
        
        if (characterRect.right > topPoleRect.left && 
            characterRect.left < topPoleRect.right && 
            characterRect.bottom > topPoleRect.top && 
            characterRect.top < topPoleRect.bottom) {
            if (!collisionSoundPlayed) {
                playCollisionSound();
                collisionSoundPlayed = true;
            }
            return true;
        }
        
        if (characterRect.right > bottomPoleRect.left && 
            characterRect.left < bottomPoleRect.right && 
            characterRect.bottom > bottomPoleRect.top && 
            characterRect.top < bottomPoleRect.bottom) {
            if (!collisionSoundPlayed) {
                playCollisionSound();
                collisionSoundPlayed = true;
            }
            return true;
        }
    }
    
    return false;
}

function handleKeyPress(e) {
    if (e.code === 'Space' && gameActive && !gamePaused) {
        e.preventDefault();
        jump();
    } else if (e.code === 'Escape' && gameActive) {
        e.preventDefault();
        if (gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

function handleTap(e) {
    if (gameActive && gameScreen.classList.contains('active') && !gamePaused) {
        jump();
    }
}

function jump() {
    velocity = isMobile ? -8 : -10;
    playJumpSound();
}

function gameOver() {
    gameActive = false;
    gamePaused = false;
    cancelAnimationFrame(gameLoopId);
    stopBackgroundMusic();
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyFirePoleHighScore', highScore);
    }
    
    setTimeout(showGameOverScreen, 800);
}

function restartGame() {
    startGame();
}

function playBackgroundMusic() {
    if (!musicEnabled) return;
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(e => console.log("Background music play failed:", e));
}

function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function playJumpSound() {
    if (!musicEnabled) return;
    jumpSound.currentTime = 0;
    jumpSound.play().catch(e => console.log("Jump sound play failed:", e));
}

function playCollisionSound() {
    if (!musicEnabled) return;
    collisionSound.currentTime = 0;
    collisionSound.play().catch(e => console.log("Collision sound play failed:", e));
}

function playCharacterDialogue() {
    if (!musicEnabled) return;
    
    let dialogue = dialogue1;
    
    dialogue.currentTime = 0;
    dialogue.play().catch(e => console.log("Dialogue play failed:", e));
}

// Initialize the game when the page loads
window.addEventListener('load', init);

// Prevent scrolling on mobile
document.addEventListener('touchmove', function(e) {
    if (gameActive) {
        e.preventDefault();
    }
}, { passive: false });

// Handle visibility change (when app goes to background)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && gameActive && !gamePaused) {
        pauseGame();
    }
});
