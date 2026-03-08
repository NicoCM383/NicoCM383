/**
 * Tetris Game Engine
 * A professional Tetris game implementation with advanced visual effects and mechanics
 * Built in native JavaScript without external libraries
 */

/**
 * Particle class for explosion effects
 * Manages lifecycle of visual particles including position, velocity, and opacity
 */
class Particle {
  /**
   * Creates a new particle instance
   * @param {number} x - X-coordinate position
   * @param {number} y - Y-coordinate position
   * @param {string} color - Particle color in hex format
   * @param {number} [radius] - Particle size (default: random 2-7)
   * @param {number} [speedX] - Horizontal velocity (default: random -2.5 to 2.5)
   * @param {number} [speedY] - Vertical velocity (default: random -5 to 5)
   * @param {number} [alpha] - Opacity level 0-1 (default: 1)
   */
  constructor(x, y, color, radius, speedX, speedY, alpha) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius !== undefined ? radius : Math.random() * 5 + 2;
    this.speedX = speedX !== undefined ? speedX : (Math.random() - 0.5) * 5;
    this.speedY = speedY !== undefined ? speedY : (Math.random() - 0.5) * 10;
    this.alpha = alpha !== undefined ? alpha : 1;
  }

  /**
   * Draws the particle on the canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    ctx.beginPath();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /**
   * Updates particle position and alpha
   * Called each frame to animate the particle
   */
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.05;
  }
}

/**
 * TetrisGame class - Main game engine
 * Manages all game logic, rendering, and user input
 */
class TetrisGame {
  /**
   * Tetromino definitions with colors
   * Each piece has a matrix representation and associated color
   */
  static PIECES = [
    { matrix: [[1, 1, 1, 1]], color: '#00FFFF' },           // I - Cyan
    { matrix: [[1, 1], [1, 1]], color: '#FFFF00' },         // O - Yellow
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#800080' },   // T - Purple
    { matrix: [[0, 1, 1], [1, 1, 0]], color: '#00FF00' },   // S - Green
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#FF0000' },   // Z - Red
    { matrix: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' },   // J - Blue
    { matrix: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' }    // L - Orange
  ];

  /**
   * Creates a new TetrisGame instance
   * @param {HTMLCanvasElement} canvas - Main game board canvas
   * @param {HTMLCanvasElement} nextPieceCanvas - Preview canvas for next piece
   */
  constructor(canvas, nextPieceCanvas) {
    this.canvas = canvas;
    this.nextPieceCanvas = nextPieceCanvas;
    this.ctx = canvas.getContext('2d');
    this.nextCtx = nextPieceCanvas.getContext('2d');

    // Board dimensions
    this.rows = 20;
    this.cols = 10;
    this.blockSize = Math.floor(canvas.width / this.cols);

    // Initialize game state
    this.state = {
      board: this.createEmptyBoard(this.rows, this.cols),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      level: 1,
      lines: 0,
      paused: false,
      gameOver: false,
      particles: [],
      lastDropTime: 0,
      dropInterval: 1000,
      animationId: null
    };

    // Create initial pieces
    this.state.nextPiece = this.createPiece();
    this.spawnNewPiece();

    // Setup keyboard controls
    this.setupKeyboardControls();

    // Bind gameLoop to this instance
    this.gameLoop = this.gameLoop.bind(this);
  }

  /**
   * Creates an empty board matrix
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @returns {Array} 2D array filled with null
   */
  createEmptyBoard(rows, cols) {
    const board = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push(null);
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Creates a new random tetromino piece
   * @returns {Object} Piece object with matrix, position, and color
   */
  createPiece() {
    const pieceIndex = Math.floor(Math.random() * TetrisGame.PIECES.length);
    const pieceTemplate = TetrisGame.PIECES[pieceIndex];

    // Deep copy the matrix to avoid reference issues
    const matrix = pieceTemplate.matrix.map(row => [...row]);

    return {
      matrix: matrix,
      x: Math.floor((this.cols - matrix[0].length) / 2),
      y: 0,
      color: pieceTemplate.color
    };
  }

  /**
   * Spawns a new piece and checks for game over
   */
  spawnNewPiece() {
    this.state.currentPiece = this.state.nextPiece;
    this.state.nextPiece = this.createPiece();

    // Check for game over
    if (!this.isValidPosition(this.state.currentPiece, 0, 0)) {
      this.state.gameOver = true;
    }
  }

  /**
   * Creates a particle explosion effect at specified position
   * @param {number} x - X-coordinate (pixel position)
   * @param {number} y - Y-coordinate (pixel position)
   * @param {string} color - Particle color
   */
  createParticleExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.state.particles.push(new Particle(x, y, color));
    }
  }

  /**
   * Checks if a piece position is valid
   * @param {Object} piece - Piece object to check
   * @param {number} offsetX - X offset from current position
   * @param {number} offsetY - Y offset from current position
   * @returns {boolean} True if position is valid
   */
  isValidPosition(piece, offsetX, offsetY) {
    const matrix = piece.matrix;
    const newX = piece.x + offsetX;
    const newY = piece.y + offsetY;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          const boardX = newX + col;
          const boardY = newY + row;

          // Check horizontal boundaries
          if (boardX < 0 || boardX >= this.cols) {
            return false;
          }

          // Check bottom boundary
          if (boardY >= this.rows) {
            return false;
          }

          // Check collision with existing blocks (only if within board)
          if (boardY >= 0 && this.state.board[boardY][boardX] !== null) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Moves the current piece by the specified offset
   * @param {number} dx - Horizontal offset
   * @param {number} dy - Vertical offset
   * @returns {boolean} True if move was successful
   */
  movePiece(dx, dy) {
    if (this.state.paused || this.state.gameOver) {
      return false;
    }

    if (this.isValidPosition(this.state.currentPiece, dx, dy)) {
      this.state.currentPiece.x += dx;
      this.state.currentPiece.y += dy;
      return true;
    }

    // If moving down and collision occurs, lock the piece
    if (dy > 0) {
      this.lockPiece();
      this.clearLines();
      this.spawnNewPiece();
      return false;
    }

    return false;
  }

  /**
   * Locks the current piece into the board matrix
   */
  lockPiece() {
    const piece = this.state.currentPiece;
    const matrix = piece.matrix;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          const boardY = piece.y + row;
          const boardX = piece.x + col;

          if (boardY >= 0 && boardY < this.rows && boardX >= 0 && boardX < this.cols) {
            this.state.board[boardY][boardX] = piece.color;
          }

          // Game over if piece locks above visible area
          if (boardY < 0) {
            this.state.gameOver = true;
          }
        }
      }
    }
  }

  /**
   * Rotates the current piece 90 degrees clockwise
   */
  rotatePiece() {
    if (this.state.paused || this.state.gameOver) {
      return;
    }

    const piece = this.state.currentPiece;
    const matrix = piece.matrix;
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Create rotated matrix
    const rotated = [];
    for (let i = 0; i < cols; i++) {
      rotated.push([]);
      for (let j = 0; j < rows; j++) {
        rotated[i].push(matrix[rows - 1 - j][i]);
      }
    }

    // Store original matrix
    const originalMatrix = piece.matrix;

    // Apply rotation
    piece.matrix = rotated;

    // Check if rotated position is valid
    if (!this.isValidPosition(piece, 0, 0)) {
      // Revert rotation if invalid
      piece.matrix = originalMatrix;
    }
  }

  /**
   * Clears completed lines and updates score
   */
  clearLines() {
    let linesCleared = 0;

    for (let row = this.rows - 1; row >= 0; row--) {
      const isLineFull = this.state.board[row].every(cell => cell !== null);

      if (isLineFull) {
        // Create particle explosions for each block in the line
        for (let col = 0; col < this.cols; col++) {
          const pixelX = col * this.blockSize + this.blockSize / 2;
          const pixelY = row * this.blockSize + this.blockSize / 2;
          this.createParticleExplosion(pixelX, pixelY, this.state.board[row][col]);
        }

        // Remove the line
        this.state.board.splice(row, 1);

        // Add empty line at top
        const emptyRow = [];
        for (let i = 0; i < this.cols; i++) {
          emptyRow.push(null);
        }
        this.state.board.unshift(emptyRow);

        linesCleared++;
        row++; // Check same row again (since rows shifted down)
      }
    }

    if (linesCleared > 0) {
      // Calculate score based on lines cleared
      const scoreTable = { 1: 100, 2: 300, 3: 500, 4: 800 };
      this.state.score += scoreTable[linesCleared] || linesCleared * 100;
      this.state.lines += linesCleared;

      // Update level
      this.state.level = Math.floor(this.state.score / 1000) + 1;

      // Update drop interval based on level
      this.updateDropInterval();
    }
  }

  /**
   * Updates drop interval based on current level
   */
  updateDropInterval() {
    const level = this.state.level;
    if (level === 1) {
      this.state.dropInterval = 1000;
    } else if (level === 2) {
      this.state.dropInterval = 850;
    } else if (level === 3) {
      this.state.dropInterval = 700;
    } else if (level === 4) {
      this.state.dropInterval = 550;
    } else if (level === 5) {
      this.state.dropInterval = 400;
    } else {
      this.state.dropInterval = Math.max(100, 400 - (level - 5) * 50);
    }
  }

  /**
   * Calculates the ghost piece position (where piece would land)
   * @returns {number} Y-coordinate of ghost piece
   */
  calculateGhostPosition() {
    const piece = this.state.currentPiece;
    let ghostY = 0;

    while (this.isValidPosition(piece, 0, ghostY + 1)) {
      ghostY++;
    }

    return piece.y + ghostY;
  }

  /**
   * Performs a hard drop (instantly drops piece to bottom)
   */
  hardDrop() {
    if (this.state.paused || this.state.gameOver) {
      return;
    }

    let dropDistance = 0;
    while (this.isValidPosition(this.state.currentPiece, 0, 1)) {
      this.state.currentPiece.y++;
      dropDistance++;
    }

    // Award points for hard drop
    this.state.score += dropDistance * 2;

    this.lockPiece();
    this.clearLines();
    this.spawnNewPiece();
  }

  /**
   * Updates all particles and removes dead ones
   */
  updateParticles() {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      this.state.particles[i].update();
      if (this.state.particles[i].alpha <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draws a single block on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Grid X position
   * @param {number} y - Grid Y position
   * @param {string} color - Block color
   * @param {number} [alpha] - Opacity (default: 1)
   */
  drawBlock(ctx, x, y, color, alpha = 1) {
    const pixelX = x * this.blockSize;
    const pixelY = y * this.blockSize;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(pixelX, pixelY, this.blockSize, this.blockSize);

    // 3D effect - lighter top/left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(pixelX, pixelY, this.blockSize, 3);
    ctx.fillRect(pixelX, pixelY, 3, this.blockSize);

    // 3D effect - darker bottom/right
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(pixelX, pixelY + this.blockSize - 3, this.blockSize, 3);
    ctx.fillRect(pixelX + this.blockSize - 3, pixelY, 3, this.blockSize);

    ctx.globalAlpha = 1;
  }

  /**
   * Draws the game board including all elements
   */
  drawBoard() {
    // Clear canvas with background color
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.cols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.blockSize, 0);
      this.ctx.lineTo(x * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.rows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.blockSize);
      this.ctx.lineTo(this.canvas.width, y * this.blockSize);
      this.ctx.stroke();
    }

    // Draw ghost piece
    if (this.state.currentPiece && !this.state.gameOver) {
      const ghostY = this.calculateGhostPosition();
      const piece = this.state.currentPiece;
      for (let row = 0; row < piece.matrix.length; row++) {
        for (let col = 0; col < piece.matrix[row].length; col++) {
          if (piece.matrix[row][col]) {
            this.drawBlock(this.ctx, piece.x + col, ghostY + row, piece.color, 0.3);
          }
        }
      }
    }

    // Draw locked blocks on board
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.state.board[row] && this.state.board[row][col]) {
          this.drawBlock(this.ctx, col, row, this.state.board[row][col]);
        }
      }
    }

    // Draw current piece
    if (this.state.currentPiece && !this.state.gameOver) {
      const piece = this.state.currentPiece;
      for (let row = 0; row < piece.matrix.length; row++) {
        for (let col = 0; col < piece.matrix[row].length; col++) {
          if (piece.matrix[row][col]) {
            const blockY = piece.y + row;
            if (blockY >= 0) {
              this.drawBlock(this.ctx, piece.x + col, blockY, piece.color);
            }
          }
        }
      }
    }

    // Draw particles
    for (const particle of this.state.particles) {
      particle.draw(this.ctx);
    }

    // Draw pause overlay
    if (this.state.paused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }

    // Draw game over overlay
    if (this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '20px Arial';
      this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }

  /**
   * Draws the next piece preview
   */
  drawNextPiece() {
    // Clear preview canvas
    this.nextCtx.fillStyle = '#1a1a2e';
    this.nextCtx.fillRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);

    if (!this.state.nextPiece) return;

    const piece = this.state.nextPiece;
    const previewBlockSize = 25;
    const offsetX = (this.nextPieceCanvas.width - piece.matrix[0].length * previewBlockSize) / 2;
    const offsetY = (this.nextPieceCanvas.height - piece.matrix.length * previewBlockSize) / 2;

    for (let row = 0; row < piece.matrix.length; row++) {
      for (let col = 0; col < piece.matrix[row].length; col++) {
        if (piece.matrix[row][col]) {
          const pixelX = offsetX + col * previewBlockSize;
          const pixelY = offsetY + row * previewBlockSize;
          this.nextCtx.fillStyle = piece.color;
          this.nextCtx.fillRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
          
          // 3D effect
          this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          this.nextCtx.fillRect(pixelX, pixelY, previewBlockSize, 2);
          this.nextCtx.fillRect(pixelX, pixelY, 2, previewBlockSize);
          this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.nextCtx.fillRect(pixelX, pixelY + previewBlockSize - 2, previewBlockSize, 2);
          this.nextCtx.fillRect(pixelX + previewBlockSize - 2, pixelY, 2, previewBlockSize);
        }
      }
    }
  }

  /**
   * Sets up keyboard controls for the game
   */
  setupKeyboardControls() {
    const handler = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.movePiece(-1, 0);
          break;
        case 'ArrowRight':
          this.movePiece(1, 0);
          break;
        case 'ArrowDown':
          this.movePiece(0, 1);
          break;
        case 'ArrowUp':
          this.rotatePiece();
          break;
        case ' ':
          this.hardDrop();
          break;
        case 'p':
        case 'P':
          if (!this.state.gameOver) {
            this.state.paused = !this.state.paused;
          }
          break;
        case 'r':
        case 'R':
          if (this.state.gameOver) {
            this.restart();
          }
          break;
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handler);
    }

    this.keyboardHandler = handler;
  }

  /**
   * Main game loop
   * @param {number} [timestamp] - Current timestamp from requestAnimationFrame
   */
  gameLoop(timestamp = 0) {
    if (!this.state.paused && !this.state.gameOver) {
      // Auto drop piece based on interval
      if (timestamp - this.state.lastDropTime >= this.state.dropInterval) {
        this.movePiece(0, 1);
        this.state.lastDropTime = timestamp;
      }

      // Update particles
      this.updateParticles();
    }

    // Draw everything
    this.drawBoard();
    this.drawNextPiece();

    // Continue loop
    if (typeof requestAnimationFrame !== 'undefined') {
      this.state.animationId = requestAnimationFrame(this.gameLoop);
    }
  }

  /**
   * Starts the game
   */
  start() {
    this.state.lastDropTime = performance.now();
    this.gameLoop(performance.now());
  }

  /**
   * Restarts the game
   */
  restart() {
    // Cancel existing animation
    if (this.state.animationId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.state.animationId);
    }

    // Reset state
    this.state = {
      board: this.createEmptyBoard(this.rows, this.cols),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      level: 1,
      lines: 0,
      paused: false,
      gameOver: false,
      particles: [],
      lastDropTime: 0,
      dropInterval: 1000,
      animationId: null
    };

    // Create new pieces
    this.state.nextPiece = this.createPiece();
    this.spawnNewPiece();

    // Start new game
    this.start();
  }
}

// Export for testing (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Particle, TetrisGame };
}
