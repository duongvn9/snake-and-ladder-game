/**
 * Board layout utilities for generating the game board
 */

import { SnakeOrLadder, createSnake, createLadder } from '../models/snake-or-ladder.model';

/**
 * Represents a cell on the game board
 */
export interface BoardCell {
  /** Cell number (1-100) */
  number: number;
  
  /** X coordinate (0-9, column index) */
  x: number;
  
  /** Y coordinate (0-9, row index from bottom) */
  y: number;
}

/**
 * Error thrown when board size is invalid
 */
export class InvalidBoardSizeError extends Error {
  constructor(size: number) {
    super(`Invalid board size: ${size}. Must be 100.`);
    this.name = 'InvalidBoardSizeError';
  }
}

/**
 * Generate board layout with 100 cells in zigzag pattern
 * 
 * The board follows the classic Snakes and Ladders layout:
 * - 10x10 grid (100 cells)
 * - Numbers go from 1 (bottom-left) to 100 (top-left)
 * - Zigzag pattern: left-to-right on odd rows, right-to-left on even rows
 * 
 * Example layout:
 * ```
 * 100 99  98  97  96  95  94  93  92  91  (row 9, y=9)
 * 81  82  83  84  85  86  87  88  89  90  (row 8, y=8)
 * 80  79  78  77  76  75  74  73  72  71  (row 7, y=7)
 * 61  62  63  64  65  66  67  68  69  70  (row 6, y=6)
 * ...
 * 20  19  18  17  16  15  14  13  12  11  (row 1, y=1)
 * 1   2   3   4   5   6   7   8   9   10  (row 0, y=0)
 * ```
 * 
 * @returns Array of 100 BoardCell objects with zigzag numbering
 * @throws InvalidBoardSizeError if the generated board doesn't have exactly 100 cells
 */
export function generateBoardLayout(): BoardCell[] {
  const cells: BoardCell[] = [];
  const BOARD_SIZE = 100;
  const GRID_SIZE = 10;
  
  for (let cellNumber = 1; cellNumber <= BOARD_SIZE; cellNumber++) {
    // Calculate which row this cell is in (0-9, from bottom)
    const row = Math.floor((cellNumber - 1) / GRID_SIZE);
    
    // Calculate position within the row (0-9)
    const positionInRow = (cellNumber - 1) % GRID_SIZE;
    
    // Determine x coordinate based on zigzag pattern
    // Even rows (0, 2, 4, 6, 8): left to right
    // Odd rows (1, 3, 5, 7, 9): right to left
    const x = row % 2 === 0 
      ? positionInRow 
      : GRID_SIZE - 1 - positionInRow;
    
    cells.push({
      number: cellNumber,
      x,
      y: row
    });
  }
  
  // Validate that we generated exactly 100 cells
  if (cells.length !== BOARD_SIZE) {
    throw new InvalidBoardSizeError(cells.length);
  }
  
  return cells;
}

/**
 * Get cell by number
 * @param cellNumber - Cell number (1-100)
 * @param boardLayout - Board layout array
 * @returns BoardCell or undefined if not found
 */
export function getCellByNumber(
  cellNumber: number,
  boardLayout: BoardCell[]
): BoardCell | undefined {
  return boardLayout.find(cell => cell.number === cellNumber);
}

/**
 * Get cell by coordinates
 * @param x - X coordinate (0-9)
 * @param y - Y coordinate (0-9)
 * @param boardLayout - Board layout array
 * @returns BoardCell or undefined if not found
 */
export function getCellByCoordinates(
  x: number,
  y: number,
  boardLayout: BoardCell[]
): BoardCell | undefined {
  return boardLayout.find(cell => cell.x === x && cell.y === y);
}

/**
 * Configuration for generating snakes and ladders
 */
export interface SnakesAndLaddersConfig {
  /** Total number of snakes and ladders to generate (default: 14) */
  count?: number;
  
  /** Minimum distance between start and end positions (default: 10) */
  minDistance?: number;
  
  /** Maximum distance between start and end positions (default: 40) */
  maxDistance?: number;
}

/**
 * Generate random snakes and ladders with no overlapping start positions
 * 
 * This function generates a configurable number of snakes and ladders
 * randomly placed on the board. It ensures:
 * - No two elements share the same start position
 * - Snakes have head > tail (validated by createSnake)
 * - Ladders have bottom < top (validated by createLadder)
 * - Elements don't start or end at position 1 or 100
 * - No overlapping start positions (validated by factory functions)
 * 
 * @param config - Configuration object for generation
 * @returns Array of SnakeOrLadder objects
 */
export function generateSnakesAndLadders(
  config: SnakesAndLaddersConfig = {}
): SnakeOrLadder[] {
  const {
    count = 14,
    minDistance = 10,
    maxDistance = 40
  } = config;
  
  const elements: SnakeOrLadder[] = [];
  const usedEndPositions = new Set<number>();
  
  // Positions 1 and 100 are reserved (start and end of game)
  const MIN_POSITION = 2;
  const MAX_POSITION = 99;
  
  // Generate approximately equal numbers of snakes and ladders
  const numSnakes = Math.floor(count / 2);
  const numLadders = count - numSnakes;
  
  // Generate snakes
  for (let i = 0; i < numSnakes; i++) {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Snake head should be in upper portion of board
      const head = getRandomInt(MIN_POSITION + minDistance, MAX_POSITION);
      
      // Skip if head position is already used as an end position
      if (usedEndPositions.has(head)) {
        continue;
      }
      
      // Calculate tail position (must be lower than head)
      const distance = getRandomInt(minDistance, Math.min(maxDistance, head - MIN_POSITION));
      const tail = head - distance;
      
      // Skip if tail is invalid or already used
      if (tail < MIN_POSITION || usedEndPositions.has(tail)) {
        continue;
      }
      
      try {
        // Use factory function which validates and checks for duplicate start positions
        const snake = createSnake(head, tail, elements);
        elements.push(snake);
        usedEndPositions.add(tail);
        break;
      } catch {
        // If creation fails (duplicate start position), try again
        continue;
      }
    }
  }
  
  // Generate ladders
  for (let i = 0; i < numLadders; i++) {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Ladder bottom should be in lower portion of board
      const bottom = getRandomInt(MIN_POSITION, MAX_POSITION - minDistance);
      
      // Skip if bottom position is already used as an end position
      if (usedEndPositions.has(bottom)) {
        continue;
      }
      
      // Calculate top position (must be higher than bottom)
      const distance = getRandomInt(minDistance, Math.min(maxDistance, MAX_POSITION - bottom));
      const top = bottom + distance;
      
      // Skip if top is invalid or already used
      if (top > MAX_POSITION || usedEndPositions.has(top)) {
        continue;
      }
      
      try {
        // Use factory function which validates and checks for duplicate start positions
        const ladder = createLadder(bottom, top, elements);
        elements.push(ladder);
        usedEndPositions.add(top);
        break;
      } catch {
        // If creation fails (duplicate start position), try again
        continue;
      }
    }
  }
  
  return elements;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
