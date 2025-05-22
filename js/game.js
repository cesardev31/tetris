// Constantes del juego
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Colores mejorados con gradientes
const COLORS = [
  "rgba(0,0,0,0)", // vacío
  "#00FFFF", // I - Cyan
  "#0066FF", // J - Blue
  "#FF8800", // L - Orange
  "#FFFF00", // O - Yellow
  "#00FF66", // S - Green
  "#AA00FF", // T - Purple
  "#FF3366", // Z - Red
];

const GLOW_COLORS = [
  "rgba(0,0,0,0)",
  "rgba(0,255,255,0.8)",
  "rgba(0,102,255,0.8)",
  "rgba(255,136,0,0.8)",
  "rgba(255,255,0,0.8)",
  "rgba(0,255,102,0.8)",
  "rgba(170,0,255,0.8)",
  "rgba(255,51,102,0.8)",
];

// Formas de las piezas
const PIECES = [
  [], // vacío
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // J
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // O
  [
    [4, 4],
    [4, 4],
  ],
  // S
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  // T
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // Z
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
];

// Variables del juego
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let gameStarted = false;
let dropTime = 0;
let dropInterval = 1000;
let animationId = null;

// Elementos del DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

// Crear estrellas de fondo
function createStars() {
  const starsContainer = document.getElementById("stars");
  for (let i = 0; i < 100; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.width = Math.random() * 3 + 1 + "px";
    star.style.height = star.style.width;
    star.style.animationDelay = Math.random() * 2 + "s";
    star.style.animationDuration = Math.random() * 3 + 1 + "s";
    starsContainer.appendChild(star);
  }
}

// Inicializar el tablero
function initBoard() {
  board = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    board.push(new Array(BOARD_WIDTH).fill(0));
  }
}

// Generar pieza aleatoria
function randomPiece() {
  const pieceIndex = Math.floor(Math.random() * 7) + 1;
  return {
    shape: PIECES[pieceIndex],
    x:
      Math.floor(BOARD_WIDTH / 2) -
      Math.floor(PIECES[pieceIndex][0].length / 2),
    y: 0,
    type: pieceIndex,
  };
}

// Función auxiliar para convertir hex a RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : "255, 255, 255";
}

// Dibujar un bloque con efectos mejorados
function drawBlock(ctx, x, y, type, ghost = false) {
  if (type === 0) return;

  const blockX = x * BLOCK_SIZE;
  const blockY = y * BLOCK_SIZE;

  // Efecto de resplandor
  ctx.shadowColor = GLOW_COLORS[type];
  ctx.shadowBlur = ghost ? 5 : 15;

  // Gradiente para el bloque
  const gradient = ctx.createLinearGradient(
    blockX,
    blockY,
    blockX + BLOCK_SIZE,
    blockY + BLOCK_SIZE
  );
  gradient.addColorStop(0, COLORS[type]);
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(1, COLORS[type]);

  ctx.fillStyle = ghost ? `rgba(${hexToRgb(COLORS[type])}, 0.3)` : gradient;
  ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);

  // Borde con efecto 3D
  if (!ghost) {
    // Luz superior izquierda
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(blockX, blockY + BLOCK_SIZE);
    ctx.lineTo(blockX, blockY);
    ctx.lineTo(blockX + BLOCK_SIZE, blockY);
    ctx.stroke();

    // Sombra inferior derecha
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.beginPath();
    ctx.moveTo(blockX + BLOCK_SIZE, blockY);
    ctx.lineTo(blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
    ctx.lineTo(blockX, blockY + BLOCK_SIZE);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

// Dibujar pieza fantasma
function drawGhostPiece(piece) {
  const ghostPiece = { ...piece };
  while (isValidPosition(ghostPiece, 0, 1)) {
    ghostPiece.y++;
  }

  for (let y = 0; y < ghostPiece.shape.length; y++) {
    for (let x = 0; x < ghostPiece.shape[y].length; x++) {
      if (ghostPiece.shape[y][x]) {
        drawBlock(
          ctx,
          ghostPiece.x + x,
          ghostPiece.y + y,
          ghostPiece.type,
          true
        );
      }
    }
  }
}

// Dibujar el tablero
function drawBoard() {
  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "rgba(0, 0, 20, 0.9)");
  gradient.addColorStop(1, "rgba(0, 20, 40, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Líneas de la cuadrícula
  ctx.strokeStyle = "rgba(0, 100, 200, 0.3)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= BOARD_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= BOARD_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(canvas.width, y * BLOCK_SIZE);
    ctx.stroke();
  }

  // Dibujar bloques del tablero
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (board[y][x]) {
        drawBlock(ctx, x, y, board[y][x]);
      }
    }
  }
}

// Dibujar la pieza actual
function drawPiece(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        drawBlock(ctx, piece.x + x, piece.y + y, piece.type);
      }
    }
  }
}

// Dibujar la siguiente pieza
function drawNextPiece() {
  // Fondo con gradiente
  const gradient = nextCtx.createLinearGradient(
    0,
    0,
    nextCanvas.width,
    nextCanvas.height
  );
  gradient.addColorStop(0, "rgba(0, 0, 30, 0.9)");
  gradient.addColorStop(1, "rgba(0, 30, 60, 0.9)");
  nextCtx.fillStyle = gradient;
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (nextPiece) {
    const offsetX = (nextCanvas.width - nextPiece.shape[0].length * 20) / 2;
    const offsetY = (nextCanvas.height - nextPiece.shape.length * 20) / 2;

    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          // Efecto de resplandor
          nextCtx.shadowColor = GLOW_COLORS[nextPiece.type];
          nextCtx.shadowBlur = 10;

          nextCtx.fillStyle = COLORS[nextPiece.type];
          nextCtx.fillRect(offsetX + x * 20, offsetY + y * 20, 20, 20);

          nextCtx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          nextCtx.lineWidth = 1;
          nextCtx.strokeRect(offsetX + x * 20, offsetY + y * 20, 20, 20);

          nextCtx.shadowBlur = 0;
        }
      }
    }
  }
}

// Verificar si una posición es válida
function isValidPosition(piece, dx, dy) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + dx;
        const newY = piece.y + y + dy;

        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Rotar pieza
function rotatePiece(piece) {
  const newShape = [];
  for (let i = 0; i < piece.shape[0].length; i++) {
    newShape.push([]);
    for (let j = piece.shape.length - 1; j >= 0; j--) {
      newShape[i].push(piece.shape[j][i]);
    }
  }

  const newPiece = {
    ...piece,
    shape: newShape,
  };

  // Verificar si la rotación es válida
  if (isValidPosition(newPiece, 0, 0)) {
    return newPiece;
  }

  // Intentar wall kick
  for (let offset of [-1, 1, -2, 2]) {
    if (isValidPosition(newPiece, offset, 0)) {
      newPiece.x += offset;
      return newPiece;
    }
  }

  return piece;
}

// Mover pieza
function movePiece(dx, dy) {
  if (!gameRunning || gamePaused) return;

  if (isValidPosition(currentPiece, dx, dy)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    return true;
  }
  return false;
}

// Fijar pieza en el tablero
function lockPiece() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        const boardY = currentPiece.y + y;
        const boardX = currentPiece.x + x;
        if (boardY >= 0) {
          board[boardY][boardX] = currentPiece.type;
        }
      }
    }
  }
}

// Verificar y limpiar líneas completas
function clearLines() {
  let linesCleared = 0;

  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell !== 0)) {
      // Eliminar la línea
      board.splice(y, 1);
      // Agregar nueva línea vacía al principio
      board.unshift(new Array(BOARD_WIDTH).fill(0));
      linesCleared++;
      y++; // Revisar la misma posición nuevamente
    }
  }

  if (linesCleared > 0) {
    // Actualizar puntuación
    const points = [0, 100, 300, 500, 800][linesCleared];
    score += points * level;
    lines += linesCleared;

    // Actualizar nivel
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);

    // Actualizar UI
    document.getElementById("score").textContent = score;
    document.getElementById("lines").textContent = lines;
    document.getElementById("level").textContent = level;
  }
}

// Verificar game over
function checkGameOver() {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (board[0][x] !== 0) {
      return true;
    }
  }
  return false;
}

// Caída instantánea
function hardDrop() {
  if (!gameRunning || gamePaused) return;

  while (movePiece(0, 1)) {}
  lockPiece();
  clearLines();

  if (checkGameOver()) {
    gameOver();
  } else {
    spawnPiece();
  }
}

// Spawnear nueva pieza
function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  drawNextPiece();

  if (!isValidPosition(currentPiece, 0, 0)) {
    gameOver();
  }
}

// Game over
function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOverScreen").classList.remove("hidden");
}

// Reiniciar juego
function restartGame() {
  initBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;

  document.getElementById("score").textContent = "0";
  document.getElementById("lines").textContent = "0";
  document.getElementById("level").textContent = "1";

  document.getElementById("gameOverScreen").classList.add("hidden");
  gameStarted = true;
  gameRunning = true;
  gamePaused = false;

  nextPiece = randomPiece();
  spawnPiece();
  gameLoop();
}

// Volver al menú principal
function backToMenu() {
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.getElementById("gameContainer").classList.add("hidden");
  document.getElementById("mainMenu").classList.remove("hidden");
  gameStarted = false;
  gameRunning = false;
  cancelAnimationFrame(animationId);
}

// Iniciar juego
function startGame() {
  document.getElementById("mainMenu").classList.add("hidden");
  document.getElementById("gameContainer").classList.remove("hidden");
  restartGame();
}

// Pausar/Reanudar juego
function togglePause() {
  if (!gameStarted) return;

  gamePaused = !gamePaused;
  const pauseBtn = document.querySelector(".pause-btn");
  pauseBtn.textContent = gamePaused ? "REANUDAR" : "PAUSA";

  if (!gamePaused) {
    gameLoop();
  }
}

// Bucle principal del juego
function gameLoop(timestamp) {
  if (!gameRunning || gamePaused) return;

  if (!dropTime) dropTime = timestamp;
  const deltaTime = timestamp - dropTime;

  if (deltaTime > dropInterval) {
    if (!movePiece(0, 1)) {
      lockPiece();
      clearLines();

      if (checkGameOver()) {
        gameOver();
        return;
      }

      spawnPiece();
    }
    dropTime = timestamp;
  }

  // Dibujar
  drawBoard();
  //drawGhostPiece(currentPiece);
  drawPiece(currentPiece);

  animationId = requestAnimationFrame(gameLoop);
}

// Controles de teclado
document.addEventListener("keydown", (e) => {
  if (!gameStarted) return;

  switch (e.key) {
    case "ArrowLeft":
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      movePiece(1, 0);
      break;
    case "ArrowDown":
      movePiece(0, 1);
      break;
    case "ArrowUp":
      currentPiece = rotatePiece(currentPiece);
      break;
    case " ":
      hardDrop();
      break;
    case "p":
    case "P":
      togglePause();
      break;
  }
});

// Controles táctiles para móviles
function initTouchControls() {
  const touchControls = document.createElement("div");
  touchControls.className = "touch-controls";
  touchControls.innerHTML = `
    <button id="rotateBtn">↻</button>
    <button id="leftBtn">←</button>
    <button id="downBtn">↓</button>
    <button id="rightBtn">→</button>
    <button id="dropBtn">⇓</button>
  `;
  document.body.appendChild(touchControls);

  // Eventos táctiles
  document.getElementById("rotateBtn").addEventListener("click", () => {
    if (gameStarted && !gamePaused) {
      currentPiece = rotatePiece(currentPiece);
    }
  });

  document.getElementById("leftBtn").addEventListener("click", () => {
    if (gameStarted && !gamePaused) {
      movePiece(-1, 0);
    }
  });

  document.getElementById("rightBtn").addEventListener("click", () => {
    if (gameStarted && !gamePaused) {
      movePiece(1, 0);
    }
  });

  document.getElementById("downBtn").addEventListener("click", () => {
    if (gameStarted && !gamePaused) {
      movePiece(0, 1);
    }
  });

  document.getElementById("dropBtn").addEventListener("click", () => {
    if (gameStarted && !gamePaused) {
      hardDrop();
    }
  });
}

// Inicializar
function init() {
  createStars();
  initBoard();
  initTouchControls();
}

// Exportar funciones necesarias
window.startGame = startGame;
window.restartGame = restartGame;
window.backToMenu = backToMenu;
window.togglePause = togglePause;

// Iniciar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", init);
