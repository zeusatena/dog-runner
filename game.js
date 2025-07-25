import { checkWalletConnection, getUserAddress } from './wallet.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 300;

// Preload images for the game
const dogImg = new Image();
dogImg.src = 'dog_sprite_flipped.png';
const bgImg = new Image();
bgImg.src = 'background_sprite_flipped.png';
const carImg = new Image();
carImg.src = 'car_animated.gif';
const bikeImg = new Image();
bikeImg.src = 'bike_sprite_flipped.png';
const catImg = new Image();
catImg.src = 'cat_sprite_flipped.png';

// Game state variables
let dog, bullets, obstacles, keys, score, gameOver;
let gravity = 1.2;
let frame = 0;
let worldRecord = 0;
let personalRecord = 0;

// Resets the game state for a new run
function resetGame() {
  dog = {
    x: 100,
    y: 0,
    width: 60,
    height: 60,
    vy: 0,
    jumpPower: -18,
    grounded: false,
    lives: 3
  };
  bullets = [];
  obstacles = [];
  keys = {};
  score = 0;
  frame = 0;
  gameOver = false;
}

// Starts the game: hide UI screens, fetch records, reset and enter main loop
async function startGame() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';

  // Fetch world and personal records
  await fetchRecords();

  // Reset game and kick off the update loop
  resetGame();
  update();
}

// Listen for key presses and handle movement/shooting
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  // Jump on Space if grounded
  if (e.code === 'Space' && dog.grounded && !gameOver) {
    dog.vy = dog.jumpPower;
    dog.grounded = false;
  }
  // Shoot bullet on Z
  if ((e.key === 'z' || e.key === 'Z') && !gameOver) {
    bullets.push({
      x: dog.x + dog.width,
      y: dog.y + dog.height / 2,
      width: 10,
      height: 4,
      speed: 10
    });
  }
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Spawns random obstacles (car, bike, cat) at the right edge
function spawnObstacle() {
  const types = [
    { img: carImg, width: 90, height: 60, type: 'car' },
    { img: bikeImg, width: 40, height: 40, type: 'bike' },
    { img: catImg, width: 40, height: 40, type: 'cat' }
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  obstacles.push({
    x: canvas.width,
    y: canvas.height - type.height - 20,
    width: type.width,
    height: type.height,
    speed: 6,
    image: type.img,
    kind: type.type
  });
}

// Fetches the world and personal record from the backend
async function fetchRecords() {
  const address = getUserAddress();
  if (!address) return;
  try {
    const response = await fetch(`https://dog-runner-1.onrender.com/api/get-records?address=${address}`);
    const data = await response.json();
    worldRecord = data.worldRecord;
    personalRecord = data.personalRecord;
    console.log('Fetched records:', worldRecord, personalRecord);
  } catch (err) {
    console.error('Error fetching records:', err);
  }
}

// Main game loop: update positions, handle collisions, and redraw
function update() {
  if (gameOver) return;

  frame++;
  score += 0.1;

  // Clear and draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Horizontal movement
  if (keys['ArrowRight']) dog.x += 5;
  if (keys['ArrowLeft']) dog.x -= 5;
  dog.x = Math.max(0, Math.min(canvas.width - dog.width, dog.x));

  // Vertical movement (gravity)
  dog.vy += gravity;
  dog.y += dog.vy;
  if (dog.y >= canvas.height - dog.height - 20) {
    dog.y = canvas.height - dog.height - 20;
    dog.vy = 0;
    dog.grounded = true;
  }

  // Draw ground
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

  // Draw dog (flip on game over)
  if (gameOver) {
    ctx.save();
    ctx.translate(dog.x + dog.width / 2, dog.y + dog.height / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(dogImg, -dog.width / 2, -dog.height / 2, dog.width, dog.height);
    ctx.restore();
  } else {
    ctx.drawImage(dogImg, dog.x, dog.y, dog.width, dog.height);
  }

  // Draw and move bullets
  ctx.fillStyle = 'orange';
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
    b.x += b.speed;
  });
  bullets = bullets.filter(b => b.x < canvas.width);

  // Draw and move obstacles
  obstacles.forEach(ob => {
    ctx.drawImage(ob.image, ob.x, ob.y, ob.width, ob.height);
    ob.x -= ob.speed;
  });
  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);

  // Check collision between dog and obstacles
  obstacles.forEach((ob, i) => {
    if (
      dog.x < ob.x + ob.width &&
      dog.x + dog.width > ob.x &&
      dog.y < ob.y + ob.height &&
      dog.y + dog.height > ob.y
    ) {
      obstacles.splice(i, 1);
      dog.lives -= 1;
      if (dog.lives <= 0) {
        gameOver = true;
        const final = Math.floor(score);
        document.getElementById('finalScore').textContent = final;
        document.getElementById('gameOverScreen').style.display = 'flex';

        // Save final score to backend
        const address = getUserAddress();
        if (address) saveScoreToDatabase(address, final);
      }
    }
  });

  // Check collision between bullets and cats
  bullets.forEach((b, j) => {
    obstacles.forEach((ob, i) => {
      if (
        ob.kind === 'cat' &&
        b.x < ob.x + ob.width &&
        b.x + b.width > ob.x &&
        b.y < ob.y + ob.height &&
        b.y + b.height > ob.y
      ) {
        bullets.splice(j, 1);
        obstacles.splice(i, 1);
        score += 10;
      }
    });
  });

  // Draw HUD: records, score, lives
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`World Record: ${worldRecord}`, canvas.width - 180, 60);
  ctx.fillText(`Personal Record: ${personalRecord}`, canvas.width - 180, 90);
  ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width - 180, 30);
  ctx.fillText(`Lives: ${dog.lives}`, 10, 30);

  // Spawn new obstacles periodically
  if (frame % 100 === 0) spawnObstacle();

  requestAnimationFrame(update);
}

// Sends final score to backend service
function saveScoreToDatabase(address, score) {
  fetch('https://dog-runner-1.onrender.com/api/save-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, score })
  })
    .then(res => res.json())
    .then(data => console.log('✅ Score saved:', data))
    .catch(err => console.error('❌ Error saving score:', err));
}

// Initializes the game: wallet connection, fetch records, start
async function tryStartGame() {
  const connected = await checkWalletConnection();
  if (!connected) return;
  await fetchRecords();
  resetGame();
  startGame();
}

// Attach event listeners to start/retry buttons
document.getElementById('startButton').addEventListener('click', tryStartGame);
document.getElementById('retryButton').addEventListener('click', tryStartGame);