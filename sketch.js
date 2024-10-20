let player1, player2;
let platforms = [];
let gravity = 0.6;
let platformWidth = 100;
let platformHeight = 20;
let platformSpacing = 100;
let worldHeight = 3000;
let goalHeight = -2000;
let groundHeight = 20;
let jumpAcceleration = -12;
let attackCooldownTime = 1000;  // Cooldown time in milliseconds (1 second)
let attackDisplacement = 50;    // Base displacement amount for attacks
let dividerWidth = 20;  // Width of the divider between the two views
let gameState = "menu";  // Track game state (menu, playing, endgame)
let startButton;
let player1NameInput, player2NameInput;
let player1Name = "Player 1", player2Name = "Player 2";
let player1Wins = 0, player2Wins = 0; // Track player wins/losses


let player1Animations = {};
let player2Animations = {};

function preload() {
  // Load animations for player 1
  player1Animations.standing = loadImage("player-1-sprites/standing.png");
  player1Animations.running = [loadImage("player-1-sprites/running/tile000.png"), loadImage("player-1-sprites/running/tile001.png"), loadImage("player-1-sprites/running/tile002.png"), loadImage("player-1-sprites/running/tile003.png")];
  player1Animations.jumping = loadImage("player-1-sprites/jumping/tile001.png")
  player1Animations.attacking = [loadImage("player-1-sprites/attacking/tile000.png"), loadImage("player-1-sprites/attacking/tile001.png"), loadImage("player-1-sprites/attacking/tile002.png"), loadImage("player-1-sprites/attacking/tile003.png"), loadImage("player-1-sprites/attacking/tile004.png")];

  // Load animations for player 2
  player2Animations.standing = loadImage("player-2-sprites/standing.png");
  player2Animations.running = [loadImage("player-2-sprites/running/tile000.png"), loadImage("player-2-sprites/running/tile001.png"), loadImage("player-2-sprites/running/tile002.png"), loadImage("player-2-sprites/running/tile003.png")];
  player2Animations.jumping = loadImage("player-2-sprites/jumping/tile001.png")
  player2Animations.attacking = [loadImage("player-2-sprites/attacking/tile000.png"), loadImage("player-2-sprites/attacking/tile001.png"), loadImage("player-2-sprites/attacking/tile002.png"), loadImage("player-2-sprites/attacking/tile003.png"), loadImage("player-2-sprites/attacking/tile004.png")];
}


function setup() {
  createCanvas(820, 800); // Increase the width for the divider (800 + 20px divider)

  // Create input fields and start button for the main menu
  player1NameInput = createInput("Player 1");
  player1NameInput.position(width / 4 - 60, height / 2 - 100);

  player2NameInput = createInput("Player 2");
  player2NameInput.position(3 * width / 4 - 60, height / 2 - 100);

  startButton = createButton('Start Game');
  startButton.position(width / 2 - 40, height / 2);
  startButton.mousePressed(startGame);
}

function startGame() {
  // Set player names from input fields
  player1Name = player1NameInput.value();
  player2Name = player2NameInput.value();

  // Hide input fields and start button
  player1NameInput.hide();
  player2NameInput.hide();
  startButton.hide();

  // Create two players
  player1 = new Player(150, worldHeight - 50, 'red', 65, 68, 87, 'Z', player1Animations); // A, D, W for movement, Z for attack
  player2 = new Player(650, worldHeight - 50, 'blue', LEFT_ARROW, RIGHT_ARROW, UP_ARROW, '/', player2Animations); // Arrow keys for movement, / for attack

  generateInitialPlatforms();
  gameState = "playing";
}

function draw() {
  if (gameState === "menu") {
    background(150);
    textSize(32);
    fill(0);
    textAlign(CENTER, CENTER);
    text("Enter Player Names and Press Start", width / 2, height / 4);
  } else if (gameState === "playing") {
    background(200);

    player1.update(player2);
    player2.update(player1);

    displayPlayerView(player1, 0);                 // Left view for Player 1
    displayPlayerView(player2, width / 2 + dividerWidth); // Right view for Player 2

    drawDivider();

    // Check if either player wins
    if (player1.y < goalHeight || player2.y < goalHeight) {
      if (player1.y < goalHeight) {
        player1Wins++;
      } else {
        player2Wins++;
      }
      gameState = "endgame";
    }

    // Generate new platforms as players move upward
    generateNewPlatforms();
  } else if (gameState === "endgame") {
    displayEndScreen();
  }
}

function displayPlayerView(player, offsetX) {
  push();
  translate(offsetX, 0);           // Move to either the left or right side of the canvas
  let offsetY = height / 2 - player.y;  // Center the player's view vertically
  translate(0, offsetY);           // Scroll the view based on player's position

  for (let platform of platforms) {
    platform.display();
  }

  fill(100);
  rect(0, worldHeight - groundHeight, width / 2 - dividerWidth / 2, groundHeight); // Adjust for split screen (half width minus divider)

  // Draw the player
  player.display();
  pop();
}

function drawDivider() {
  fill(0); // Black divider
  rect(width / 2 - dividerWidth / 2, 0, dividerWidth, height);
}

function generateInitialPlatforms() {
  let y = worldHeight - 100;
  for (let i = 0; i < 20; i++) {
    let x = random(50, width / 2 - platformWidth - dividerWidth / 2 - 50);
    platforms.push(new Platform(x, y, platformWidth, platformHeight));
    y -= platformSpacing;
  }
}

function generateNewPlatforms() {
  // Get the highest platform in the world
  let highestPlatformY = platforms.reduce((min, platform) => Math.min(min, platform.y), Infinity);

  // If the highest platform is below the players, generate a new one
  if (highestPlatformY > player1.y - height || highestPlatformY > player2.y - height) {
    let newX = random(50, width / 2 - platformWidth - dividerWidth / 2 - 50);
    let newY = highestPlatformY - platformSpacing;
    platforms.push(new Platform(newX, newY, platformWidth, platformHeight));
  }
}

class Player {
  constructor(x, y, color, leftKey, rightKey, jumpKey, attackKey, animations) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.color = color;
    this.speed = 5;
    this.velocityY = 0;
    this.isJumping = false; // Prevent double jumps
    this.leftKey = leftKey;
    this.rightKey = rightKey;
    this.jumpKey = jumpKey;
    this.attackKey = attackKey;  // Attack key (Z or /)
    this.attackCooldown = 0; // Track cooldown timer
    this.freezeTime = 0;  // Track how long the player is frozen for
    this.animations = animations;
    this.currentAnimation = "standing"; // Initial animation
    this.animationFrame = 0;
  }

  update() {
    if (this.freezeTime <= 0) {
      // Horizontal movement
      if (keyIsDown(this.leftKey)) {
        this.x -= this.speed;
        this.currentAnimation = "running"; // Switch to running animation

      } else if (keyIsDown(this.rightKey)) {
        this.x += this.speed;
        this.currentAnimation = "running"; // Switch to running animation

      } else {
        this.currentAnimation = "standing"; // Switch to standing when no movement
      }
    } else {
      // Reduce freeze timer
      this.freezeTime -= deltaTime;
    }

    // Apply gravity
    this.velocityY += gravity;

    // Collision detection with platforms and the ground
    let onPlatform = false;
    for (let platform of platforms) {
      if (this.x + this.width > platform.x && this.x < platform.x + platform.width) {
        // Check if player is on top of the platform
        if (this.y + this.height <= platform.y && this.y + this.height + this.velocityY > platform.y) {
          this.y = platform.y - this.height;
          this.velocityY = 0;
          this.isJumping = false;
          onPlatform = true;
          break;
        }
        // Check if player is below the platform
        else if (this.y >= platform.y + platform.height && this.y + this.velocityY < platform.y + platform.height) {
          this.y = platform.y + platform.height;
          this.velocityY = 0;
        }
        // Check if player is colliding from the sides
        else if (this.y + this.height > platform.y && this.y < platform.y + platform.height) {
          if (this.x < platform.x) {
            this.x = platform.x - this.width;
          } else {
            this.x = platform.x + platform.width;
          }
        }
      }
    }

    // Apply vertical movement after collision checks
    this.y += this.velocityY;

    // Stop falling through the ground
    if (this.y >= worldHeight - this.height) {
      this.y = worldHeight - this.height;
      this.velocityY = 0;
      this.isJumping = false;
    }

    if (this.isJumping) {
      this.currentAnimation = "jumping";
    }


    // Reduce cooldown timer if it's active
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
      if (this.attackCooldown < 0) {
        this.attackCooldown = 0;
      }
    }

    // Ensure the player stays within their screen
    this.x = constrain(this.x, 0, width / 2 - dividerWidth / 2 - this.width);
  }

  attack(otherPlayer) {
    // Only allow attack if cooldown is 0
    if (this.attackCooldown === 0) {
      // Randomly displace the other player on the x-axis
      this.currentAnimation = "attacking";

      let displacement = random(-this.attackPower, this.attackPower);  // Use attackPower which can be boosted by power-ups
      otherPlayer.x += displacement;

      // Ensure the displaced player stays within their screen
      if (otherPlayer.x < 0) otherPlayer.x = 0;
      if (otherPlayer.x + otherPlayer.width > width / 2 - dividerWidth / 2) {
        otherPlayer.x = width / 2 - dividerWidth / 2 - otherPlayer.width;
      }

      // Start the cooldown
      this.attackCooldown = attackCooldownTime;
    }
  }

  display() {
    let currentImage;

    if (this.currentAnimation === 'running') {
      currentImage = this.animations.running[this.animationFrame % this.animations.running.length];
      if (frameCount % 5 === 0) { // Change frame every 5 frames
        this.animationFrame++;
      }
    } else if (this.currentAnimation === 'jumping') {
      currentImage = this.animations.jumping;
    } else if (this.currentAnimation === 'attacking') {
      currentImage = this.animations.attacking[this.animationFrame % this.animations.attacking.length];
      if (frameCount % 5 === 0) {
        this.animationFrame++;
      }
    } else {
      currentImage = this.animations.standing;
    }

    image(currentImage, this.x, this.y, this.width, this.height);
  }
}

class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  display() {
    fill(0, 150, 0);
    rect(this.x, this.y, this.width, this.height);
  }
}

function displayEndScreen() {
  background(150);
  textSize(32);
  fill(0);
  textAlign(CENTER, CENTER);
  text("Game Over!", width / 2, height / 4);

  textSize(24);
  text(`${player1Name} Wins: ${player1Wins}`, width / 2, height / 2 - 50);
  text(`${player2Name} Wins: ${player2Wins}`, width / 2, height / 2 + 50);

  textSize(16);
  text("Press 'R' to restart", width / 2, height * 0.75);
}

function keyPressed() {
  if (gameState === "playing") {
    // Player 1 jump (W key)
    if (keyCode === 87 && !player1.isJumping) {
      player1.velocityY = jumpAcceleration;
      player1.isJumping = true;
    }

    // Player 2 jump (Up Arrow)
    if (keyCode === UP_ARROW && !player2.isJumping) {
      player2.velocityY = jumpAcceleration;
      player2.isJumping = true;
    }

    // Player 1 attack (Z key)
    if (keyCode === 90) {
      player1.attack(player2);
    }

    // Player 2 attack (/ key)
    if (keyCode === 191) {
      player2.attack(player1);
    }
  } else if (gameState === "endgame" && keyCode === 82) { // 'R' key to restart
    resetGame();
  }
}

function resetGame() {
  gameState = "menu";
  player1Wins = 0;
  player2Wins = 0;
  player1NameInput.show();
  player2NameInput.show();
  startButton.show();
}