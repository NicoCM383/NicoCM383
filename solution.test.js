/**
 * Comprehensive test suite for Tetris Game Engine
 * Tests both Particle and TetrisGame classes with complex scenarios
 */

const { Particle, TetrisGame } = require('./solution');

// ================== GLOBAL MOCKS SETUP ==================

// Mock DOM elements
global.document = {
  getElementById: jest.fn((id) => {
    if (id === 'tetris-board' || id === 'next-piece-canvas') {
      return {
        width: 300,
        height: 600,
        getContext: jest.fn(() => ({
          fillRect: jest.fn(),
          clearRect: jest.fn(),
          beginPath: jest.fn(),
          arc: jest.fn(),
          fill: jest.fn(),
          stroke: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          globalAlpha: 1,
          font: '',
          textAlign: '',
          fillText: jest.fn(),
        })),
      };
    }
    return null;
  }),
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

// Mock browser APIs
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});
global.cancelAnimationFrame = jest.fn();
global.performance = { now: jest.fn(() => Date.now()) };
global.KeyboardEvent = class KeyboardEvent {
  constructor(type, options) {
    this.type = type;
    this.key = options.key;
  }
};

// ================== PARTICLE CLASS TESTS ==================

describe('Particle Class', () => {
  describe('Constructor', () => {
    test('constructor sets initial properties correctly with all parameters', () => {
      const particle = new Particle(10, 20, '#ff0000', 5, 2, -3, 0.8);
      expect(particle.x).toBe(10);
      expect(particle.y).toBe(20);
      expect(particle.color).toBe('#ff0000');
      expect(particle.radius).toBe(5);
      expect(particle.speedX).toBe(2);
      expect(particle.speedY).toBe(-3);
      expect(particle.alpha).toBe(0.8);
    });

    test('constructor uses default random values when optional parameters not provided', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const particle = new Particle(0, 0, '#000');
      expect(particle.radius).toBeCloseTo(4.5); // 0.5 * 5 + 2
      expect(particle.speedX).toBeCloseTo(0);   // (0.5 - 0.5) * 5
      expect(particle.speedY).toBeCloseTo(0);   // (0.5 - 0.5) * 10
      expect(particle.alpha).toBe(1);
      Math.random.mockRestore();
    });

    test('constructor handles edge case random values at boundaries', () => {
      // Test minimum random value (0)
      jest.spyOn(Math, 'random').mockReturnValue(0);
      let particle = new Particle(100, 100, '#ffffff');
      expect(particle.radius).toBeCloseTo(2);      // 0 * 5 + 2
      expect(particle.speedX).toBeCloseTo(-2.5);   // (0 - 0.5) * 5
      expect(particle.speedY).toBeCloseTo(-5);     // (0 - 0.5) * 10
      Math.random.mockRestore();

      // Test maximum random value (close to 1)
      jest.spyOn(Math, 'random').mockReturnValue(0.999);
      particle = new Particle(100, 100, '#ffffff');
      expect(particle.radius).toBeCloseTo(6.995);  // 0.999 * 5 + 2
      expect(particle.speedX).toBeCloseTo(2.495);  // (0.999 - 0.5) * 5
      expect(particle.speedY).toBeCloseTo(4.99);   // (0.999 - 0.5) * 10
      Math.random.mockRestore();
    });

    test('constructor correctly handles zero values for optional parameters', () => {
      const particle = new Particle(50, 50, '#00ff00', 0, 0, 0, 0);
      expect(particle.radius).toBe(0);
      expect(particle.speedX).toBe(0);
      expect(particle.speedY).toBe(0);
      expect(particle.alpha).toBe(0);
    });

    test('constructor handles negative coordinate values', () => {
      const particle = new Particle(-100, -200, '#0000ff', 3, -5, -10, 0.5);
      expect(particle.x).toBe(-100);
      expect(particle.y).toBe(-200);
      expect(particle.speedX).toBe(-5);
      expect(particle.speedY).toBe(-10);
    });
  });

  describe('Update Method', () => {
    test('update modifies position and alpha correctly', () => {
      const particle = new Particle(0, 0, '#fff', 1, 2, 3, 0.9);
      particle.update();
      expect(particle.x).toBe(2);
      expect(particle.y).toBe(3);
      expect(particle.alpha).toBeCloseTo(0.85);
    });

    test('update handles negative velocities correctly', () => {
      const particle = new Particle(100, 100, '#fff', 1, -5, -10, 1);
      particle.update();
      expect(particle.x).toBe(95);
      expect(particle.y).toBe(90);
      expect(particle.alpha).toBeCloseTo(0.95);
    });

    test('particle alpha can become negative after many updates', () => {
      const particle = new Particle(0, 0, '#000', 1, 0, 0, 0.1);
      particle.update();
      expect(particle.alpha).toBeCloseTo(0.05);
      particle.update();
      expect(particle.alpha).toBeCloseTo(0);
      particle.update();
      expect(particle.alpha).toBeCloseTo(-0.05);
    });

    test('update accumulates position changes over multiple calls', () => {
      const particle = new Particle(0, 0, '#fff', 1, 3, 4, 1);
      for (let i = 0; i < 10; i++) {
        particle.update();
      }
      expect(particle.x).toBe(30);
      expect(particle.y).toBe(40);
      expect(particle.alpha).toBeCloseTo(0.5);
    });

    test('update with zero velocity only changes alpha', () => {
      const particle = new Particle(50, 50, '#fff', 1, 0, 0, 1);
      particle.update();
      expect(particle.x).toBe(50);
      expect(particle.y).toBe(50);
      expect(particle.alpha).toBeCloseTo(0.95);
    });
  });

  describe('Draw Method', () => {
    test('draw calls canvas context methods with correct parameters', () => {
      const mockCtx = {
        beginPath: jest.fn(),
        fillStyle: '',
        arc: jest.fn(),
        fill: jest.fn(),
      };
      let globalAlphaValue = 1;
      const setGlobalAlpha = jest.fn((value) => { globalAlphaValue = value; });
      Object.defineProperty(mockCtx, 'globalAlpha', {
        get() { return globalAlphaValue; },
        set: setGlobalAlpha,
      });

      const particle = new Particle(50, 60, '#00ff00', 7, 0, 0, 0.6);
      particle.draw(mockCtx);

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(setGlobalAlpha).toHaveBeenCalledWith(0.6);
      expect(mockCtx.fillStyle).toBe('#00ff00');
      expect(mockCtx.arc).toHaveBeenCalledWith(50, 60, 7, 0, Math.PI * 2);
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(setGlobalAlpha).toHaveBeenCalledWith(1);
    });

    test('draw resets globalAlpha to 1 after drawing', () => {
      const mockCtx = {
        beginPath: jest.fn(),
        fillStyle: '',
        arc: jest.fn(),
        fill: jest.fn(),
        globalAlpha: 1,
      };

      const particle = new Particle(0, 0, '#fff', 5, 0, 0, 0.3);
      particle.draw(mockCtx);

      expect(mockCtx.globalAlpha).toBe(1);
    });

    test('draw handles particles with zero alpha', () => {
      const mockCtx = {
        beginPath: jest.fn(),
        fillStyle: '',
        arc: jest.fn(),
        fill: jest.fn(),
        globalAlpha: 1,
      };

      const particle = new Particle(0, 0, '#fff', 5, 0, 0, 0);
      expect(() => particle.draw(mockCtx)).not.toThrow();
    });

    test('draw correctly renders particle at floating point positions', () => {
      const mockCtx = {
        beginPath: jest.fn(),
        fillStyle: '',
        arc: jest.fn(),
        fill: jest.fn(),
        globalAlpha: 1,
      };

      const particle = new Particle(15.7, 23.4, '#ff0000', 3.5, 0, 0, 0.8);
      particle.draw(mockCtx);

      expect(mockCtx.arc).toHaveBeenCalledWith(15.7, 23.4, 3.5, 0, Math.PI * 2);
    });
  });
});

// ================== TETRIS GAME CLASS TESTS ==================

describe('TetrisGame Class', () => {
  let mockCanvas, mockNextCanvas, game;

  beforeEach(() => {
    mockCanvas = {
      width: 300,
      height: 600,
      getContext: jest.fn(() => ({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        globalAlpha: 1,
        font: '',
        textAlign: '',
        fillText: jest.fn(),
      })),
    };
    mockNextCanvas = {
      width: 120,
      height: 120,
      getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        fillStyle: '',
        globalAlpha: 1,
      })),
    };
    document.getElementById.mockImplementation((id) => {
      if (id === 'tetris-board') return mockCanvas;
      if (id === 'next-piece-canvas') return mockNextCanvas;
      return null;
    });
    jest.spyOn(Math, 'random').mockReturnValue(0);
    game = new TetrisGame(mockCanvas, mockNextCanvas);
  });

  afterEach(() => {
    Math.random.mockRestore();
  });

  describe('Constructor and Initialization', () => {
    test('constructor initializes game state with correct dimensions', () => {
      expect(game.state.board.length).toBe(20);
      expect(game.state.board[0].length).toBe(10);
      expect(game.state.currentPiece).toBeDefined();
      expect(game.state.nextPiece).toBeDefined();
      expect(game.state.score).toBe(0);
      expect(game.state.level).toBe(1);
      expect(game.state.paused).toBe(false);
      expect(game.state.gameOver).toBe(false);
      expect(game.state.particles).toEqual([]);
    });

    test('constructor creates independent board rows (no reference sharing)', () => {
      game.state.board[0][0] = '#ff0000';
      expect(game.state.board[1][0]).toBeNull();
      expect(game.state.board[0][0]).toBe('#ff0000');
    });

    test('constructor initializes drop interval correctly', () => {
      expect(game.state.dropInterval).toBe(1000);
    });

    test('constructor creates current and next pieces', () => {
      expect(game.state.currentPiece).not.toBeNull();
      expect(game.state.nextPiece).not.toBeNull();
      expect(game.state.currentPiece.matrix).toBeDefined();
      expect(game.state.currentPiece.color).toBeDefined();
    });

    test('board dimensions match canvas size', () => {
      expect(game.rows).toBe(20);
      expect(game.cols).toBe(10);
      expect(game.blockSize).toBe(30); // 300 / 10
    });
  });

  describe('createEmptyBoard Method', () => {
    test('creates board with correct dimensions', () => {
      const board = game.createEmptyBoard(15, 8);
      expect(board.length).toBe(15);
      expect(board[0].length).toBe(8);
    });

    test('creates board filled with null values', () => {
      const board = game.createEmptyBoard(5, 5);
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          expect(board[row][col]).toBeNull();
        }
      }
    });

    test('creates independent row arrays', () => {
      const board = game.createEmptyBoard(3, 3);
      board[0][0] = '#ff0000';
      expect(board[1][0]).toBeNull();
    });
  });

  describe('createPiece Method', () => {
    test('creates piece with valid matrix', () => {
      const piece = game.createPiece();
      expect(piece.matrix).toBeDefined();
      expect(Array.isArray(piece.matrix)).toBe(true);
    });

    test('creates piece with valid color', () => {
      const piece = game.createPiece();
      expect(piece.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test('creates piece at centered x position', () => {
      const piece = game.createPiece();
      const expectedX = Math.floor((10 - piece.matrix[0].length) / 2);
      expect(piece.x).toBe(expectedX);
    });

    test('creates piece at y position 0', () => {
      const piece = game.createPiece();
      expect(piece.y).toBe(0);
    });
  });

  describe('createParticleExplosion Method', () => {
    test('adds exactly twenty particles to state', () => {
      expect(game.state.particles.length).toBe(0);
      game.createParticleExplosion(100, 200, '#ff0000');
      expect(game.state.particles.length).toBe(20);
    });

    test('all particles are Particle instances', () => {
      game.createParticleExplosion(100, 200, '#ff0000');
      game.state.particles.forEach(particle => {
        expect(particle).toBeInstanceOf(Particle);
      });
    });

    test('particles have correct color', () => {
      game.createParticleExplosion(50, 50, '#00ff00');
      game.state.particles.forEach(particle => {
        expect(particle.color).toBe('#00ff00');
      });
    });

    test('multiple explosions accumulate particles', () => {
      game.createParticleExplosion(100, 100, '#ff0000');
      game.createParticleExplosion(200, 200, '#00ff00');
      expect(game.state.particles.length).toBe(40);
    });

    test('particles are created at correct position', () => {
      game.createParticleExplosion(150, 250, '#0000ff');
      game.state.particles.forEach(particle => {
        expect(particle.x).toBe(150);
        expect(particle.y).toBe(250);
      });
    });
  });

  describe('isValidPosition Method', () => {
    test('returns true for valid initial position', () => {
      const result = game.isValidPosition(game.state.currentPiece, 0, 0);
      expect(result).toBe(true);
    });

    test('returns false when piece exceeds left boundary', () => {
      const piece = { matrix: [[1]], x: 0, y: 5, color: '#fff' };
      expect(game.isValidPosition(piece, -1, 0)).toBe(false);
    });

    test('returns false when piece exceeds right boundary', () => {
      const piece = { matrix: [[1]], x: 9, y: 5, color: '#fff' };
      expect(game.isValidPosition(piece, 1, 0)).toBe(false);
    });

    test('returns false when piece exceeds bottom boundary', () => {
      const piece = { matrix: [[1]], x: 5, y: 19, color: '#fff' };
      expect(game.isValidPosition(piece, 0, 1)).toBe(false);
    });

    test('returns false when colliding with existing block', () => {
      game.state.board[10][5] = '#ff0000';
      const piece = { matrix: [[1]], x: 5, y: 9, color: '#fff' };
      expect(game.isValidPosition(piece, 0, 1)).toBe(false);
    });

    test('allows pieces to be above visible area (y < 0)', () => {
      const piece = { matrix: [[1]], x: 5, y: -1, color: '#fff' };
      expect(game.isValidPosition(piece, 0, 0)).toBe(true);
    });
  });

  describe('movePiece Method', () => {
    test('returns true when movement is valid', () => {
      const initialX = game.state.currentPiece.x;
      const moved = game.movePiece(1, 0);
      expect(moved).toBe(true);
      expect(game.state.currentPiece.x).toBe(initialX + 1);
    });

    test('returns false when collision with wall occurs', () => {
      game.state.currentPiece.x = 9;
      const moved = game.movePiece(1, 0);
      expect(moved).toBe(false);
    });

    test('locks piece when moving down into collision', () => {
      game.state.currentPiece.y = 19;
      const moved = game.movePiece(0, 1);
      expect(moved).toBe(false);
      const hasBlock = game.state.board.some(row => row.some(cell => cell !== null));
      expect(hasBlock).toBe(true);
    });

    test('returns false when paused', () => {
      game.state.paused = true;
      const moved = game.movePiece(1, 0);
      expect(moved).toBe(false);
    });

    test('returns false when game over', () => {
      game.state.gameOver = true;
      const moved = game.movePiece(1, 0);
      expect(moved).toBe(false);
    });

    test('moves piece left correctly', () => {
      game.state.currentPiece.x = 5;
      game.movePiece(-1, 0);
      expect(game.state.currentPiece.x).toBe(4);
    });

    test('moves piece down correctly', () => {
      game.state.currentPiece.y = 5;
      game.movePiece(0, 1);
      expect(game.state.currentPiece.y).toBe(6);
    });
  });

  describe('rotatePiece Method', () => {
    test('does not rotate when collision prevents it', () => {
      // Place a T-piece near the right wall where rotation would cause collision
      game.state.currentPiece = {
        matrix: [[1], [1], [1], [1]], // Vertical I-piece
        x: 9,
        y: 5,
        color: '#00FFFF'
      };
      const originalMatrix = JSON.stringify(game.state.currentPiece.matrix);
      game.rotatePiece();
      // The rotated I-piece would be [[1,1,1,1]] which extends beyond x=9
      expect(JSON.stringify(game.state.currentPiece.matrix)).toBe(originalMatrix);
    });

    test('does not rotate when paused', () => {
      game.state.paused = true;
      const originalMatrix = JSON.stringify(game.state.currentPiece.matrix);
      game.rotatePiece();
      expect(JSON.stringify(game.state.currentPiece.matrix)).toBe(originalMatrix);
    });

    test('does not rotate when game over', () => {
      game.state.gameOver = true;
      const originalMatrix = JSON.stringify(game.state.currentPiece.matrix);
      game.rotatePiece();
      expect(JSON.stringify(game.state.currentPiece.matrix)).toBe(originalMatrix);
    });

    test('rotates I-piece correctly', () => {
      // I-piece is [[1,1,1,1]]
      game.state.currentPiece = {
        matrix: [[1, 1, 1, 1]],
        x: 3,
        y: 5,
        color: '#00FFFF'
      };
      game.rotatePiece();
      expect(game.state.currentPiece.matrix.length).toBe(4);
      expect(game.state.currentPiece.matrix[0].length).toBe(1);
    });

    test('four rotations return to original orientation', () => {
      game.state.currentPiece = {
        matrix: [[0, 1, 0], [1, 1, 1]],
        x: 3,
        y: 5,
        color: '#800080'
      };
      const originalMatrix = JSON.stringify(game.state.currentPiece.matrix);
      game.rotatePiece();
      game.rotatePiece();
      game.rotatePiece();
      game.rotatePiece();
      expect(JSON.stringify(game.state.currentPiece.matrix)).toBe(originalMatrix);
    });
  });

  describe('clearLines Method', () => {
    test('clears single full line and adds score', () => {
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(100);
    });

    test('creates particle explosions when clearing lines', () => {
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.particles.length).toBeGreaterThan(0);
    });

    test('clearing multiple lines awards bonus points', () => {
      for (let x = 0; x < 10; x++) {
        game.state.board[18][x] = '#ff0000';
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(300); // Double line bonus
    });

    test('cleared rows are replaced with empty rows', () => {
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.board[0].every(cell => cell === null)).toBe(true);
    });

    test('does not clear incomplete lines', () => {
      for (let x = 0; x < 9; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(0);
    });

    test('updates lines counter', () => {
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.lines).toBe(1);
    });
  });

  describe('Level Progression', () => {
    test('level increases after reaching 1000 points', () => {
      game.state.score = 950;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.level).toBe(2);
    });

    test('level 2 has faster drop interval', () => {
      game.state.score = 900;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.level).toBe(2);
      expect(game.state.dropInterval).toBe(850);
    });

    test('level 3 drop interval is correct', () => {
      game.state.score = 1900;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.level).toBe(3);
      expect(game.state.dropInterval).toBe(700);
    });

    test('level 4 drop interval is correct', () => {
      game.state.score = 2900;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.level).toBe(4);
      expect(game.state.dropInterval).toBe(550);
    });

    test('level 5 drop interval is correct', () => {
      game.state.score = 3900;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.level).toBe(5);
      expect(game.state.dropInterval).toBe(400);
    });

    test('level 6+ has minimum drop interval of 100ms', () => {
      game.state.score = 9900;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.dropInterval).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Keyboard Controls', () => {
    test('ArrowLeft triggers movePiece(-1, 0)', () => {
      const movePieceSpy = jest.spyOn(game, 'movePiece');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      eventHandler({ key: 'ArrowLeft' });
      expect(movePieceSpy).toHaveBeenCalledWith(-1, 0);
      movePieceSpy.mockRestore();
    });

    test('ArrowRight triggers movePiece(1, 0)', () => {
      const movePieceSpy = jest.spyOn(game, 'movePiece');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      eventHandler({ key: 'ArrowRight' });
      expect(movePieceSpy).toHaveBeenCalledWith(1, 0);
      movePieceSpy.mockRestore();
    });

    test('ArrowDown triggers movePiece(0, 1)', () => {
      const movePieceSpy = jest.spyOn(game, 'movePiece');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      eventHandler({ key: 'ArrowDown' });
      expect(movePieceSpy).toHaveBeenCalledWith(0, 1);
      movePieceSpy.mockRestore();
    });

    test('ArrowUp triggers rotatePiece', () => {
      const rotatePieceSpy = jest.spyOn(game, 'rotatePiece');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      eventHandler({ key: 'ArrowUp' });
      expect(rotatePieceSpy).toHaveBeenCalled();
      rotatePieceSpy.mockRestore();
    });

    test('Space triggers hardDrop', () => {
      const hardDropSpy = jest.spyOn(game, 'hardDrop');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      eventHandler({ key: ' ' });
      expect(hardDropSpy).toHaveBeenCalled();
      hardDropSpy.mockRestore();
    });

    test('P key toggles pause state', () => {
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      
      expect(game.state.paused).toBe(false);
      eventHandler({ key: 'p' });
      expect(game.state.paused).toBe(true);
      eventHandler({ key: 'p' });
      expect(game.state.paused).toBe(false);
    });

    test('P key (uppercase) toggles pause state', () => {
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      
      eventHandler({ key: 'P' });
      expect(game.state.paused).toBe(true);
    });

    test('R key does not restart when game is not over', () => {
      const restartSpy = jest.spyOn(game, 'restart');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      
      game.state.gameOver = false;
      eventHandler({ key: 'r' });
      expect(restartSpy).not.toHaveBeenCalled();
      restartSpy.mockRestore();
    });

    test('R key restarts when game is over', () => {
      const restartSpy = jest.spyOn(game, 'restart');
      let eventHandler;
      document.addEventListener = jest.fn((event, handler) => {
        if (event === 'keydown') eventHandler = handler;
      });
      game.setupKeyboardControls();
      
      game.state.gameOver = true;
      eventHandler({ key: 'r' });
      expect(restartSpy).toHaveBeenCalled();
      restartSpy.mockRestore();
    });
  });

  describe('Ghost Piece', () => {
    test('calculateGhostPosition returns position at bottom', () => {
      game.state.currentPiece = {
        matrix: [[1]],
        x: 5,
        y: 0,
        color: '#fff'
      };
      const ghostY = game.calculateGhostPosition();
      expect(ghostY).toBe(19);
    });

    test('calculateGhostPosition accounts for existing blocks', () => {
      game.state.board[15][5] = '#ff0000';
      game.state.currentPiece = {
        matrix: [[1]],
        x: 5,
        y: 0,
        color: '#fff'
      };
      const ghostY = game.calculateGhostPosition();
      expect(ghostY).toBe(14);
    });
  });

  describe('Hard Drop', () => {
    test('hardDrop moves piece to bottom instantly', () => {
      game.state.currentPiece = {
        matrix: [[1]],
        x: 5,
        y: 0,
        color: '#fff'
      };
      game.hardDrop();
      expect(game.state.board[19][5]).toBe('#fff');
    });

    test('hardDrop awards bonus points', () => {
      game.state.currentPiece = {
        matrix: [[1]],
        x: 5,
        y: 0,
        color: '#fff'
      };
      game.state.score = 0;
      game.hardDrop();
      expect(game.state.score).toBeGreaterThan(0);
    });

    test('hardDrop does nothing when paused', () => {
      game.state.paused = true;
      const initialY = game.state.currentPiece.y;
      game.hardDrop();
      expect(game.state.currentPiece.y).toBe(initialY);
    });

    test('hardDrop does nothing when game over', () => {
      game.state.gameOver = true;
      const initialY = game.state.currentPiece.y;
      game.hardDrop();
      expect(game.state.currentPiece.y).toBe(initialY);
    });
  });

  describe('Particle Management', () => {
    test('updateParticles removes particles with alpha <= 0', () => {
      const particle = new Particle(0, 0, '#fff', 1, 0, 0, 0.04);
      game.state.particles.push(particle);
      game.updateParticles();
      expect(game.state.particles.length).toBe(0);
    });

    test('updateParticles updates all particles', () => {
      const particle1 = new Particle(0, 0, '#fff', 1, 1, 1, 1);
      const particle2 = new Particle(10, 10, '#fff', 1, 2, 2, 1);
      game.state.particles.push(particle1, particle2);
      game.updateParticles();
      expect(particle1.x).toBe(1);
      expect(particle2.x).toBe(12);
    });

    test('updateParticles keeps particles with alpha > 0', () => {
      const particle = new Particle(0, 0, '#fff', 1, 0, 0, 0.5);
      game.state.particles.push(particle);
      game.updateParticles();
      expect(game.state.particles.length).toBe(1);
    });
  });

  describe('Drawing Methods', () => {
    test('drawBoard does not throw errors', () => {
      expect(() => game.drawBoard()).not.toThrow();
    });

    test('drawNextPiece does not throw errors', () => {
      expect(() => game.drawNextPiece()).not.toThrow();
    });

    test('drawBoard handles paused state', () => {
      game.state.paused = true;
      expect(() => game.drawBoard()).not.toThrow();
    });

    test('drawBoard handles game over state', () => {
      game.state.gameOver = true;
      expect(() => game.drawBoard()).not.toThrow();
    });

    test('drawBlock does not throw errors', () => {
      const mockCtx = game.ctx;
      expect(() => game.drawBlock(mockCtx, 0, 0, '#ff0000')).not.toThrow();
    });

    test('drawBlock handles alpha parameter', () => {
      const mockCtx = game.ctx;
      expect(() => game.drawBlock(mockCtx, 0, 0, '#ff0000', 0.5)).not.toThrow();
    });
  });

  describe('Game Loop', () => {
    test('gameLoop does not throw errors', () => {
      expect(() => game.gameLoop(0)).not.toThrow();
    });

    test('gameLoop updates particles', () => {
      const particle = new Particle(0, 0, '#fff', 1, 1, 1, 0.5);
      game.state.particles.push(particle);
      game.gameLoop(0);
      expect(particle.x).toBe(1);
    });

    test('gameLoop auto-drops piece when interval elapsed', () => {
      game.state.lastDropTime = 0;
      game.state.dropInterval = 100;
      const initialY = game.state.currentPiece.y;
      game.gameLoop(200);
      expect(game.state.currentPiece.y).toBe(initialY + 1);
    });

    test('gameLoop does not drop piece when paused', () => {
      game.state.paused = true;
      game.state.lastDropTime = 0;
      game.state.dropInterval = 100;
      const initialY = game.state.currentPiece.y;
      game.gameLoop(200);
      expect(game.state.currentPiece.y).toBe(initialY);
    });
  });

  describe('Start and Restart', () => {
    test('start initializes lastDropTime', () => {
      game.start();
      expect(game.state.lastDropTime).toBeDefined();
    });

    test('restart resets game state', () => {
      game.state.score = 1000;
      game.state.level = 5;
      game.state.gameOver = true;
      game.restart();
      expect(game.state.score).toBe(0);
      expect(game.state.level).toBe(1);
      expect(game.state.gameOver).toBe(false);
    });

    test('restart creates new board', () => {
      game.state.board[10][5] = '#ff0000';
      game.restart();
      expect(game.state.board[10][5]).toBeNull();
    });

    test('restart creates new pieces', () => {
      const oldPiece = game.state.currentPiece;
      game.restart();
      expect(game.state.currentPiece).toBeDefined();
    });

    test('restart clears particles', () => {
      game.createParticleExplosion(100, 100, '#ff0000');
      game.restart();
      expect(game.state.particles.length).toBe(0);
    });
  });

  describe('Lock Piece', () => {
    test('lockPiece transfers piece to board', () => {
      game.state.currentPiece = {
        matrix: [[1]],
        x: 5,
        y: 10,
        color: '#ff0000'
      };
      game.lockPiece();
      expect(game.state.board[10][5]).toBe('#ff0000');
    });

    test('lockPiece triggers game over when piece above board', () => {
      game.state.currentPiece = {
        matrix: [[1]],
        x: 5,
        y: -1,
        color: '#ff0000'
      };
      game.lockPiece();
      expect(game.state.gameOver).toBe(true);
    });

    test('lockPiece handles multi-block pieces', () => {
      game.state.currentPiece = {
        matrix: [[1, 1], [1, 1]],
        x: 4,
        y: 10,
        color: '#FFFF00'
      };
      game.lockPiece();
      expect(game.state.board[10][4]).toBe('#FFFF00');
      expect(game.state.board[10][5]).toBe('#FFFF00');
      expect(game.state.board[11][4]).toBe('#FFFF00');
      expect(game.state.board[11][5]).toBe('#FFFF00');
    });
  });

  describe('Scoring System', () => {
    test('single line scores 100 points', () => {
      game.state.score = 0;
      for (let x = 0; x < 10; x++) {
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(100);
    });

    test('double lines score 300 points', () => {
      game.state.score = 0;
      for (let x = 0; x < 10; x++) {
        game.state.board[18][x] = '#ff0000';
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(300);
    });

    test('triple lines score 500 points', () => {
      game.state.score = 0;
      for (let x = 0; x < 10; x++) {
        game.state.board[17][x] = '#ff0000';
        game.state.board[18][x] = '#ff0000';
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(500);
    });

    test('tetris (4 lines) scores 800 points', () => {
      game.state.score = 0;
      for (let x = 0; x < 10; x++) {
        game.state.board[16][x] = '#ff0000';
        game.state.board[17][x] = '#ff0000';
        game.state.board[18][x] = '#ff0000';
        game.state.board[19][x] = '#ff0000';
      }
      game.clearLines();
      expect(game.state.score).toBe(800);
    });
  });

  describe('PIECES Static Property', () => {
    test('contains 7 tetromino types', () => {
      expect(TetrisGame.PIECES.length).toBe(7);
    });

    test('each piece has matrix and color', () => {
      TetrisGame.PIECES.forEach(piece => {
        expect(piece.matrix).toBeDefined();
        expect(piece.color).toBeDefined();
        expect(Array.isArray(piece.matrix)).toBe(true);
      });
    });

    test('I-piece has correct shape', () => {
      const iPiece = TetrisGame.PIECES[0];
      expect(iPiece.matrix).toEqual([[1, 1, 1, 1]]);
      expect(iPiece.color).toBe('#00FFFF');
    });

    test('O-piece has correct shape', () => {
      const oPiece = TetrisGame.PIECES[1];
      expect(oPiece.matrix).toEqual([[1, 1], [1, 1]]);
      expect(oPiece.color).toBe('#FFFF00');
    });
  });
});
