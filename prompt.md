# Tetris Game Engine - Implementation Specification

## Overview
Implement a Tetris game engine in native JavaScript with particle effects, ghost piece visualization, collision detection, and level progression. No external libraries allowed.

## Particle Class
Manages explosion effect particles for line clear visual feedback.

### Constructor Parameters
- `x`, `y` (number): Position coordinates (required)
- `color` (string): Hex color format (required)
- `radius` (optional): Size, defaults to `Math.random() * 5 + 2`
- `speedX` (optional): Horizontal velocity, defaults to `(Math.random() - 0.5) * 5`
- `speedY` (optional): Vertical velocity, defaults to `(Math.random() - 0.5) * 10`
- `alpha` (optional): Opacity 0-1, defaults to `1`

### Methods
- **`update()`**: Updates position (`x += speedX`, `y += speedY`), reduces alpha by `0.05`
- **`draw(ctx)`**: Renders particle using `beginPath()`, `arc()`, `fill()`, manages `globalAlpha`

## TetrisGame Class
Orchestrates the complete game lifecycle with Canvas rendering.

### Constructor
- `canvas`: Main game board canvas (300×600 pixels)
- `nextPieceCanvas`: Preview canvas (120×120 pixels)

### Game State (`this.state`)
```javascript
{ board: Array[20][10], currentPiece, nextPiece, score: 0, level: 1, 
  lines: 0, paused: false, gameOver: false, particles: [], 
  lastDropTime: 0, dropInterval: 1000 }
```

### Tetromino Pieces (7 types)
I (cyan), O (yellow), T (purple), S (green), Z (red), J (blue), L (orange)

### Core Methods
- **`createEmptyBoard(rows, cols)`**: Returns 2D array with `null`, independent row arrays
- **`createPiece()`**: Returns random piece `{matrix, x, y, color}`, centered at top
- **`createParticleExplosion(x, y, color)`**: Creates 20 Particle instances
- **`isValidPosition(piece, offsetX, offsetY)`**: Validates position within boundaries
- **`movePiece(dx, dy)`**: Moves piece, returns false if paused/gameOver/invalid
- **`lockPiece()`**: Transfers piece to board matrix, checks game over
- **`rotatePiece()`**: Rotates 90° clockwise, reverts if invalid
- **`clearLines()`**: Removes full rows, creates explosions, updates score/level
- **`calculateGhostPosition()`**: Returns y-coordinate where piece would land
- **`updateParticles()`**: Updates and removes dead particles (alpha <= 0)
- **`drawBoard()`**: Renders board, ghost piece, current piece, particles
- **`drawNextPiece()`**: Renders next piece preview
- **`setupKeyboardControls()`**: ArrowKeys for movement, Space for hard drop, P for pause
- **`hardDrop()`**: Drops piece instantly, awards bonus points
- **`gameLoop(timestamp)`**: Main loop with auto-drop and rendering
- **`start()`**: Initializes and starts game loop
- **`restart()`**: Resets state and starts new game

### Level Progression
Level increases every 1000 points. Drop interval: 1000ms (L1) → 850ms (L2) → 700ms (L3) → 550ms (L4) → 400ms (L5) → min 100ms

### Scoring
Single: 100, Double: 300, Triple: 500, Tetris: 800, Hard drop: 2 per cell

## Export
```javascript
module.exports = { Particle, TetrisGame };
```
