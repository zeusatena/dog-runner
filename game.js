const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 300;

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

let dog, bullets, obstacles, keys, score, gameOver;
let gravity = 1.2;
let frame = 0;
let worldRecord = 0;
let personalRecord = 0;

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

function startGame() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  resetGame();
  update();
}

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && dog.grounded && !gameOver) {
    dog.vy = dog.jumpPower;
    dog.grounded = false;
  }
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

function update() {
  if (gameOver) return;

  frame++;
  score += 0.1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  if (keys['ArrowRight']) dog.x += 5;
  if (keys['ArrowLeft']) dog.x -= 5;
  dog.x = Math.max(0, Math.min(canvas.width - dog.width, dog.x));

  dog.vy += gravity;
  dog.y += dog.vy;
  if (dog.y >= canvas.height - dog.height - 20) {
    dog.y = canvas.height - dog.height - 20;
    dog.vy = 0;
    dog.grounded = true;
  }

  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

  if (gameOver) {
    ctx.save();
    ctx.translate(dog.x + dog.width / 2, dog.y + dog.height / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(dogImg, -dog.width / 2, -dog.height / 2, dog.width, dog.height);
    ctx.restore();
  } else {
    ctx.drawImage(dogImg, dog.x, dog.y, dog.width, dog.height);
  }

  ctx.fillStyle = 'orange';
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
    b.x += b.speed;
  });
  bullets = bullets.filter(b => b.x < canvas.width);

  obstacles.forEach(ob => {
    ctx.drawImage(ob.image, ob.x, ob.y, ob.width, ob.height);
    ob.x -= ob.speed;
  });
  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);

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

        // Save score to backend with wallet address
        if (typeof userAddress === 'string') {
          saveScoreToDatabase(userAddress, final);
        }
      }
    }
  });

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

  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + Math.floor(score), canvas.width - 180, 30);
  ctx.fillText('Lives: ' + dog.lives, 10, 30);

  if (frame % 100 === 0) spawnObstacle();

  requestAnimationFrame(update);
}

// Funzione per salvare il punteggio nel database
function saveScoreToDatabase(address, score) {
  fetch('https://dog-runner-1.onrender.com/api/save-score', {  // Backend su Render
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, score })
  })
  .then(res => res.json())
  .then(data => console.log('✅ Score saved:', data))
  .catch(err => console.error('❌ Error saving score:', err));
}

// Funzione per recuperare i record dal database
function fetchRecords() {
  const url = `https://dog-runner-1.onrender.com/api/get-records?address=${userAddress}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      worldRecord = data.worldRecord;
      personalRecord = data.personalRecord;
      updateHUD();  // Update the HUD after fetching records
    })
    .catch(err => {
      console.error('❌ Error fetching records:', err);
    });
}

// Funzione per aggiornare l'HUD (score, lives, world record, personal record)
function updateHUD() {
  const worldRecordText = `World Record: ${worldRecord}`;
  const personalRecordText = `Your Record: ${personalRecord}`;
  const scoreText = `Score: ${Math.floor(score)}`;
  const livesText = `Lives: ${dog.lives}`;

  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';

  // Display the world record, personal record, and score in the top right
  ctx.fillText(worldRecordText, canvas.width - 180, 30); // World Record
  ctx.fillText(personalRecordText, canvas.width - 180, 60); // Personal Record
  ctx.fillText(scoreText, canvas.width - 180, 90); // Score
  ctx.fillText(livesText, 10, 30); // Lives, display at top left
}