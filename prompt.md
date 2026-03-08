# Tetris Game Engine - Complex Implementation Specification

## Overview

This document specifies the requirements for implementing a professional Tetris game engine in native JavaScript without external libraries. The system must include advanced particle effects, ghost piece visualization, collision detection, level progression, and robust board management.

---

## Context

You are developing a sophisticated Tetris game engine that combines classic gameplay mechanics with modern visual effects. The engine must be built entirely in native JavaScript, utilizing the Canvas API for rendering. The implementation must handle all game states (playing, paused, game over), particle explosions for visual feedback, ghost piece previews for better UX, and progressive difficulty scaling.

---

## Technical Requirements

### 1. Particle System (Particle Class)

The `Particle` class manages individual explosion effect particles with the following specifications:

#### Constructor Parameters (with defaults)
- `x` (number): X-coordinate position (required)
- `y` (number): Y-coordinate position (required)
- `color` (string): Particle color in hex format (required)
- `radius` (number, optional): Particle size, defaults to `Math.random() * 5 + 2` (range: 2-7)
- `speedX` (number, optional): Horizontal velocity, defaults to `(Math.random() - 0.5) * 5` (range: -2.5 to 2.5)
- `speedY` (number, optional): Vertical velocity, defaults to `(Math.random() - 0.5) * 10` (range: -5 to 5)
- `alpha` (number, optional): Opacity level 0-1, defaults to `1`

#### Methods

**`update()`**
- Updates particle position: `x += speedX`, `y += speedY`
- Reduces alpha by `0.05` per frame
- No return value

**`draw(ctx)`**
- Renders particle on Canvas context
- Sets `globalAlpha` to particle's alpha value
- Draws filled arc at particle position with particle radius
- Resets `globalAlpha` to 1 after drawing
- Uses `beginPath()`, `arc()`, `fill()` Canvas methods

---

### 2. Tetris Game Engine (TetrisGame Class)

The `TetrisGame` class orchestrates the complete game lifecycle.

#### Constructor Parameters
- `canvas` (HTMLCanvasElement): Main game board canvas
- `nextPieceCanvas` (HTMLCanvasElement): Preview canvas for next piece

#### Game State Object (`this.state`)
```javascript
{
  board: Array[20][10],      // 20 rows × 10 columns, null = empty
  currentPiece: Object,      // {matrix, x, y, color}
  nextPiece: Object,         // {matrix, x, y, color}
  score: number,             // Current score
  level: number,             // Current level (starts at 1)
  lines: number,             // Total lines cleared
  paused: boolean,           // Pause state
  gameOver: boolean,         // Game over state
  particles: Array,          // Active Particle instances
  lastDropTime: number,      // Timestamp of last piece drop
  dropInterval: number       // Milliseconds between automatic drops
}
```

#### Tetromino Definitions
Seven standard pieces with distinct colors:
- **I-piece** (cyan): `[[1,1,1,1]]`
- **O-piece** (yellow): `[[1,1],[1,1]]`
- **T-piece** (purple): `[[0,1,0],[1,1,1]]`
- **S-piece** (green): `[[0,1,1],[1,1,0]]`
- **Z-piece** (red): `[[1,1,0],[0,1,1]]`
- **J-piece** (blue): `[[1,0,0],[1,1,1]]`
- **L-piece** (orange): `[[0,0,1],[1,1,1]]`

#### Methods

**`createEmptyBoard(rows, cols)`**
- Returns 2D array filled with `null`
- Must create independent row arrays (no reference sharing)

**`createPiece()`**
- Selects random tetromino type
- Returns piece object with matrix, initial position, and color
- Initial x position: centered on board
- Initial y position: 0 (top)

**`createParticleExplosion(x, y, color)`**
- Creates exactly 20 `Particle` instances at specified position
- Adds all particles to `state.particles` array
- Used for line clear visual feedback

**`isValidPosition(piece, offsetX, offsetY)`**
- Checks if piece at offset position is valid
- Returns `false` if any block:
  - Is outside board boundaries (x < 0, x >= 10, y >= 20)
  - Overlaps existing block in board matrix
- Returns `true` otherwise
- Must ignore blocks above the board (y < 0) for spawn checking

**`movePiece(dx, dy)`**
- Returns `false` immediately if `paused` or `gameOver`
- Attempts to move current piece by (dx, dy)
- If valid: updates piece position, returns `true`
- If invalid and `dy > 0`: locks piece, clears lines, spawns new piece
- If invalid otherwise: returns `false`

**`lockPiece()`**
- Transfers current piece blocks to board matrix
- Stores piece color at each block position
- Checks for game over (piece locked above visible area)

**`rotatePiece()`**
- Rotates piece matrix 90° clockwise
- Validates rotated position
- If invalid: reverts rotation (no wall kicks required)
- Rotation formula: `newMatrix[j][rows-1-i] = matrix[i][j]`

**`clearLines()`**
- Identifies all completely filled rows
- For each filled row:
  - Creates particle explosions at each block position
  - Removes row from board
  - Inserts empty row at top
- Updates score: `lines * 100`
- Updates level: `Math.floor(score / 1000) + 1`
- Updates drop interval based on level

**`calculateGhostPosition()`**
- Calculates where current piece would land if dropped
- Returns y-coordinate of ghost piece
- Used for ghost piece rendering

**`updateParticles()`**
- Calls `update()` on each particle
- Removes particles with `alpha <= 0`

**`drawBoard()`**
- Clears canvas with background color
- Draws grid pattern (optional)
- Renders ghost piece (semi-transparent)
- Renders locked blocks from board matrix
- Renders current piece
- Renders all active particles
- Must handle null checks for board cells

**`drawNextPiece()`**
- Clears next piece canvas
- Renders next piece centered in preview area

**`drawBlock(ctx, x, y, color, alpha = 1)`**
- Renders single block at grid position
- Applies 3D effect with lighter/darker borders
- Supports transparency via alpha parameter

**`setupKeyboardControls()`**
- Registers keydown event listener on document
- Key mappings:
  - ArrowLeft: `movePiece(-1, 0)`
  - ArrowRight: `movePiece(1, 0)`
  - ArrowDown: `movePiece(0, 1)`
  - ArrowUp: `rotatePiece()`
  - Space: Hard drop (move down until collision)
  - P/p: Toggle pause state
  - R/r: Restart game (when game over)

**`hardDrop()`**
- Moves piece down until collision
- Locks piece and clears lines
- Awards bonus points for hard drop

**`gameLoop(timestamp)`**
- Checks if paused or game over
- Calculates elapsed time since last drop
- If elapsed >= dropInterval: auto-drops piece
- Calls `updateParticles()`
- Calls `drawBoard()` and `drawNextPiece()`
- Requests next animation frame

**`start()`**
- Initializes game state
- Starts game loop via `requestAnimationFrame`

**`restart()`**
- Resets all game state to initial values
- Starts new game

---

### 3. Level Progression System

| Level | Drop Interval (ms) | Points Required |
|-------|-------------------|-----------------|
| 1     | 1000              | 0               |
| 2     | 850               | 1000            |
| 3     | 700               | 2000            |
| 4     | 550               | 3000            |
| 5     | 400               | 4000            |
| 6+    | max(100, 400-(level-5)*50) | level*1000 |

---

### 4. Scoring System

| Action | Points |
|--------|--------|
| Single line | 100 |
| Double (2 lines) | 300 |
| Triple (3 lines) | 500 |
| Tetris (4 lines) | 800 |
| Soft drop (per cell) | 1 |
| Hard drop (per cell) | 2 |

---

### 5. Board Dimensions

- **Main board**: 10 columns × 20 rows
- **Block size**: 30 pixels (configurable based on canvas)
- **Canvas size**: 300×600 pixels (default)
- **Preview canvas**: 120×120 pixels (default)

---

## Implementation Constraints

1. **No external libraries**: Pure JavaScript and Canvas API only
2. **No reference errors**: Board operations must create independent arrays
3. **Robust null handling**: All matrix operations must check for null/undefined
4. **State encapsulation**: All game state must be within `this.state` object
5. **Memory management**: Particles must be removed when alpha <= 0
6. **Frame independence**: Game loop must use delta time for consistent speed

---

## Export Requirements

```javascript
module.exports = { Particle, TetrisGame };
```

Both classes must be exported for testing purposes while maintaining browser compatibility.
