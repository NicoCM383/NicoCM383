/**
 * Test suite for Tetris Game Engine
 * Tests Particle and TetrisGame classes core functionality
 */

const { Particle, TetrisGame } = require('./solution');

// ================== GLOBAL MOCKS SETUP ==================

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

global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});
global.cancelAnimationFrame = jest.fn();
global.performance = { now: jest.fn(() => Date.now()) };

// ================== PARTICLE CLASS TESTS ==================

describe('Particle Class', () => {
  test('constructor sets properties with all parameters', () => {
    const particle = new Particle(10, 20, '#ff0000', 5, 2, -3, 0.8);
    expect(particle.x).toBe(10);
    expect(particle.y).toBe(20);
    expect(particle.color).toBe('#ff0000');
    expect(particle.radius).toBe(5);
    expect(particle.speedX).toBe(2);
    expect(particle.speedY).toBe(-3);
    expect(particle.alpha).toBe(0.8);
  });

  test('constructor uses default random values when not provided', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const particle = new Particle(0, 0, '#000');
    expect(particle.radius).toBeCloseTo(4.5);
    expect(particle.speedX).toBeCloseTo(0);
    expect(particle.speedY).toBeCloseTo(0);
    expect(particle.alpha).toBe(1);
    Math.random.mockRestore();
  });

  test('update modifies position and alpha correctly', () => {
    const particle = new Particle(0, 0, '#fff', 1, 2, 3, 0.9);
    particle.update();
    expect(particle.x).toBe(2);
    expect(particle.y).toBe(3);
    expect(particle.alpha).toBeCloseTo(0.85);
  });

  test('particle alpha can become negative after many updates', () => {
    const particle = new Particle(0, 0, '#000', 1, 0, 0, 0.1);
    particle.update();
    particle.update();
    particle.update();
    expect(particle.alpha).toBeCloseTo(-0.05);
  });

  test('draw calls canvas context methods correctly', () => {
    const mockCtx = {
      beginPath: jest.fn(),
      fillStyle: '',
      arc: jest.fn(),
      fill: jest.fn(),
    };
    let globalAlphaValue = 1;
    Object.defineProperty(mockCtx, 'globalAlpha', {
      get() { return globalAlphaValue; },
      set(value) { globalAlphaValue = value; },
    });

    const particle = new Particle(50, 60, '#00ff00', 7, 0, 0, 0.6);
    particle.draw(mockCtx);

    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalledWith(50, 60, 7, 0, Math.PI * 2);
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.globalAlpha).toBe(1);
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

  test('constructor initializes game state correctly', () => {
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

  test('createEmptyBoard creates independent rows', () => {
    const board = game.createEmptyBoard(5, 5);
    board[0][0] = '#ff0000';
    expect(board[1][0]).toBeNull();
  });

  test('createPiece returns piece with matrix and color', () => {
    const piece = game.createPiece();
    expect(piece.matrix).toBeDefined();
    expect(piece.color).toBeDefined();
    expect(piece.y).toBe(0);
  });

  test('createParticleExplosion adds 20 particles', () => {
    game.createParticleExplosion(100, 200, '#ff0000');
    expect(game.state.particles.length).toBe(20);
    expect(game.state.particles[0]).toBeInstanceOf(Particle);
  });

  test('isValidPosition validates boundaries correctly', () => {
    expect(game.isValidPosition(game.state.currentPiece, 0, 0)).toBe(true);
    const piece = { matrix: [[1]], x: 0, y: 5, color: '#fff' };
    expect(game.isValidPosition(piece, -1, 0)).toBe(false);
    expect(game.isValidPosition(piece, 0, 15)).toBe(false);
  });

  test('movePiece returns true for valid movement', () => {
    const initialX = game.state.currentPiece.x;
    expect(game.movePiece(1, 0)).toBe(true);
    expect(game.state.currentPiece.x).toBe(initialX + 1);
  });

  test('movePiece returns false when paused or gameOver', () => {
    game.state.paused = true;
    expect(game.movePiece(1, 0)).toBe(false);
    game.state.paused = false;
    game.state.gameOver = true;
    expect(game.movePiece(1, 0)).toBe(false);
  });

  test('movePiece locks piece when moving down into collision', () => {
    game.state.currentPiece.y = 19;
    game.movePiece(0, 1);
    const hasBlock = game.state.board.some(row => row.some(cell => cell !== null));
    expect(hasBlock).toBe(true);
  });

  test('rotatePiece rotates and reverts on collision', () => {
    game.state.currentPiece = {
      matrix: [[1], [1], [1], [1]],
      x: 9,
      y: 5,
      color: '#00FFFF'
    };
    const originalMatrix = JSON.stringify(game.state.currentPiece.matrix);
    game.rotatePiece();
    expect(JSON.stringify(game.state.currentPiece.matrix)).toBe(originalMatrix);
  });

  test('clearLines removes full rows and updates score', () => {
    for (let x = 0; x < 10; x++) {
      game.state.board[19][x] = '#ff0000';
    }
    game.clearLines();
    expect(game.state.score).toBe(100);
    expect(game.state.particles.length).toBeGreaterThan(0);
  });

  test('clearLines awards bonus points for multiple lines', () => {
    for (let x = 0; x < 10; x++) {
      game.state.board[18][x] = '#ff0000';
      game.state.board[19][x] = '#ff0000';
    }
    game.clearLines();
    expect(game.state.score).toBe(300);
  });

  test('level increases after 1000 points', () => {
    game.state.score = 950;
    for (let x = 0; x < 10; x++) {
      game.state.board[19][x] = '#ff0000';
    }
    game.clearLines();
    expect(game.state.level).toBe(2);
    expect(game.state.dropInterval).toBe(850);
  });

  test('calculateGhostPosition returns correct position', () => {
    game.state.currentPiece = { matrix: [[1]], x: 5, y: 0, color: '#fff' };
    expect(game.calculateGhostPosition()).toBe(19);
  });

  test('hardDrop moves piece to bottom and awards points', () => {
    game.state.currentPiece = { matrix: [[1]], x: 5, y: 0, color: '#fff' };
    game.state.score = 0;
    game.hardDrop();
    expect(game.state.board[19][5]).toBe('#fff');
    expect(game.state.score).toBeGreaterThan(0);
  });

  test('hardDrop does nothing when paused', () => {
    game.state.paused = true;
    const initialY = game.state.currentPiece.y;
    game.hardDrop();
    expect(game.state.currentPiece.y).toBe(initialY);
  });

  test('updateParticles removes dead particles', () => {
    const particle = new Particle(0, 0, '#fff', 1, 0, 0, 0.04);
    game.state.particles.push(particle);
    game.updateParticles();
    expect(game.state.particles.length).toBe(0);
  });

  test('keyboard controls trigger correct actions', () => {
    const movePieceSpy = jest.spyOn(game, 'movePiece');
    let eventHandler;
    document.addEventListener = jest.fn((event, handler) => {
      if (event === 'keydown') eventHandler = handler;
    });
    game.setupKeyboardControls();
    
    eventHandler({ key: 'ArrowLeft' });
    expect(movePieceSpy).toHaveBeenCalledWith(-1, 0);
    
    eventHandler({ key: 'ArrowRight' });
    expect(movePieceSpy).toHaveBeenCalledWith(1, 0);
    
    movePieceSpy.mockRestore();
  });

  test('P key toggles pause state', () => {
    let eventHandler;
    document.addEventListener = jest.fn((event, handler) => {
      if (event === 'keydown') eventHandler = handler;
    });
    game.setupKeyboardControls();
    
    eventHandler({ key: 'p' });
    expect(game.state.paused).toBe(true);
    eventHandler({ key: 'p' });
    expect(game.state.paused).toBe(false);
  });

  test('drawBoard and drawNextPiece do not throw', () => {
    expect(() => game.drawBoard()).not.toThrow();
    expect(() => game.drawNextPiece()).not.toThrow();
  });

  test('gameLoop auto-drops piece when interval elapsed', () => {
    game.state.lastDropTime = 0;
    game.state.dropInterval = 100;
    const initialY = game.state.currentPiece.y;
    game.gameLoop(200);
    expect(game.state.currentPiece.y).toBe(initialY + 1);
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

  test('lockPiece transfers piece to board', () => {
    game.state.currentPiece = { matrix: [[1]], x: 5, y: 10, color: '#ff0000' };
    game.lockPiece();
    expect(game.state.board[10][5]).toBe('#ff0000');
  });

  test('lockPiece triggers game over when above board', () => {
    game.state.currentPiece = { matrix: [[1]], x: 5, y: -1, color: '#ff0000' };
    game.lockPiece();
    expect(game.state.gameOver).toBe(true);
  });

  test('scoring system awards correct points', () => {
    // Test triple
    game.state.score = 0;
    for (let x = 0; x < 10; x++) {
      game.state.board[17][x] = '#ff0000';
      game.state.board[18][x] = '#ff0000';
      game.state.board[19][x] = '#ff0000';
    }
    game.clearLines();
    expect(game.state.score).toBe(500);

    // Test tetris
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

  test('PIECES contains 7 tetromino types', () => {
    expect(TetrisGame.PIECES.length).toBe(7);
    TetrisGame.PIECES.forEach(piece => {
      expect(piece.matrix).toBeDefined();
      expect(piece.color).toBeDefined();
    });
  });
});
