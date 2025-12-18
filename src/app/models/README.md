# Game Models

This directory contains all the core data models and interfaces for the DL 16 Years Teambuilding Snake and Ladder Game.

## Models Overview

### Player Model (`player.model.ts`)
Represents a game participant with the following properties:
- `id`: Unique identifier (UUID)
- `name`: Player's display name
- `color`: HSL color string for visual identification
- `position`: Current position on the board (0-100)
- `isFinished`: Whether the player has completed the game
- `finishTime`: Optional timestamp when player finished
- `turnOrder`: Order in the sorted player list

**Factory Functions:**
- `createPlayer()`: Creates a single player with validation
- `createPlayers()`: Creates multiple players from an array of names
- `generatePlayerColor()`: Generates distinct HSL colors for players

**Validation:**
- Player names cannot be empty or whitespace-only
- Player names must be unique (case-insensitive)

### SnakeOrLadder Model (`snake-or-ladder.model.ts`)
Represents special board elements (snakes and ladders):
- `id`: Unique identifier (UUID)
- `type`: Either 'snake' or 'ladder'
- `startPosition`: Head (snake) or Bottom (ladder)
- `endPosition`: Tail (snake) or Top (ladder)

**Factory Functions:**
- `createSnake()`: Creates a snake with validation
- `createLadder()`: Creates a ladder with validation

**Validation:**
- Snakes: `startPosition` must be greater than `endPosition`
- Ladders: `startPosition` must be less than `endPosition`
- Start positions must be unique across all snakes and ladders

### GameState Model (`game-state.model.ts`)
Represents the complete state of the game:
- `gameId`: Unique game session identifier
- `players`: Array of all players
- `snakesAndLadders`: Array of all board elements
- `currentDiceRollerId`: ID of current dice roller
- `selectedTargetId`: ID of selected target player (nullable)
- `lastDiceResult`: Last dice roll result (nullable)
- `isGameStarted`: Game start status
- `isGameFinished`: Game completion status
- `createdAt`: Game creation timestamp
- `lastUpdatedAt`: Last update timestamp

**Factory Functions:**
- `createInitialGameState()`: Creates initial game state

**Validation:**
- Player count must be at least 2
- Positions must be between 0 and 100

### DiceResult Model (`dice-result.model.ts`)
Represents the outcome of a dice roll:
- `dice1`: First dice value (1-6)
- `dice2`: Second dice value (1-6)
- `total`: Sum of both dice
- `rollerId`: ID of player who rolled
- `targetId`: ID of target player
- `timestamp`: Roll timestamp

**Factory Functions:**
- `createDiceResult()`: Creates a dice result with validation
- `calculateDiceTotal()`: Calculates and validates dice total

**Validation:**
- Dice values must be between 1 and 6

## Error Classes

Each model includes custom error classes for validation failures:

### Player Model Errors
- `InvalidPlayerNameError`: Thrown when player name is empty or invalid
- `DuplicatePlayerNameError`: Thrown when player name already exists

### SnakeOrLadder Model Errors
- `InvalidSnakeError`: Thrown when snake validation fails
- `InvalidLadderError`: Thrown when ladder validation fails
- `DuplicateStartPositionError`: Thrown when start position is already used

### GameState Model Errors
- `InvalidPlayerCountError`: Thrown when player count is less than 2
- `InvalidPositionError`: Thrown when position is not between 0 and 100

### DiceResult Model Errors
- `InvalidDiceValueError`: Thrown when dice value is not between 1 and 6

## Usage Examples

### Creating Players
```typescript
import { createPlayers } from './models';

const players = createPlayers(['Alice', 'Bob', 'Charlie']);
// Each player gets a unique color and starts at position 0
```

### Creating Snakes and Ladders
```typescript
import { createSnake, createLadder } from './models';

const elements: SnakeOrLadder[] = [];
const snake = createSnake(95, 13, elements); // Head at 95, tail at 13
elements.push(snake);

const ladder = createLadder(4, 25, elements); // Bottom at 4, top at 25
elements.push(ladder);
```

### Creating Game State
```typescript
import { createInitialGameState, createPlayers } from './models';

const players = createPlayers(['Alice', 'Bob']);
const snakesAndLadders = []; // Generate these separately
const gameState = createInitialGameState(players, snakesAndLadders);
```

### Rolling Dice
```typescript
import { createDiceResult } from './models';

const result = createDiceResult(3, 5, rollerId, targetId);
console.log(result.total); // 8
```

## Type Safety

All models are fully typed with TypeScript interfaces and include:
- Strict null checks
- Immutable data patterns (use spread operators for updates)
- Comprehensive JSDoc documentation
- Factory functions for safe object creation
- Validation functions to ensure data integrity

## Testing

Models include validation logic that should be tested with:
- Unit tests for individual validation functions
- Property-based tests for invariants (using fast-check)
- Integration tests for factory functions

See the design document for specific correctness properties that must be validated.
