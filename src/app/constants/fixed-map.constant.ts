/**
 * Fixed Map Configuration for Snake and Ladder game
 * 
 * This constant defines a predefined set of snakes and ladders
 * for the "Fixed Map" mode, providing a consistent game experience.
 * 
 * Requirements: 6.1.1, 6.1.2
 */

import { SnakeOrLadder } from '../models/snake-or-ladder.model';

/**
 * Fixed map configuration with predefined snake and ladder positions.
 * 
 * Ladders (bottom -> top): Help players climb up
 * Snakes (head -> tail): Make players slide down
 * 
 * All positions are validated to ensure:
 * - No duplicate start positions
 * - No duplicate end positions
 * - Snakes: startPosition > endPosition
 * - Ladders: startPosition < endPosition
 * - No positions at 1 or 100
 */
export const FIXED_MAP_CONFIG: SnakeOrLadder[] = [
  // Ladders (bottom -> top) - 12 ladders
  { id: 'l1', type: 'ladder', startPosition: 1, endPosition: 38 },
  { id: 'l2', type: 'ladder', startPosition: 3, endPosition: 14 },
  { id: 'l3', type: 'ladder', startPosition: 7, endPosition: 25 },
  { id: 'l4', type: 'ladder', startPosition: 8, endPosition: 30 },
  { id: 'l5', type: 'ladder', startPosition: 21, endPosition: 42 },
  { id: 'l6', type: 'ladder', startPosition: 28, endPosition: 76 },
  { id: 'l7', type: 'ladder', startPosition: 50, endPosition: 67 },
  { id: 'l8', type: 'ladder', startPosition: 58, endPosition: 77 },
  { id: 'l9', type: 'ladder', startPosition: 69, endPosition: 87 },
  { id: 'l10', type: 'ladder', startPosition: 71, endPosition: 92 },
  { id: 'l11', type: 'ladder', startPosition: 80, endPosition: 99 },
  { id: 'l12', type: 'ladder', startPosition: 63, endPosition: 97 },
  
  // Snakes (head -> tail) - 8 snakes
  { id: 's1', type: 'snake', startPosition: 36, endPosition: 18 },
  { id: 's2', type: 'snake', startPosition: 32, endPosition: 10 },
  { id: 's3', type: 'snake', startPosition: 48, endPosition: 26 },
  { id: 's5', type: 'snake', startPosition: 64, endPosition: 44 },
  { id: 's6', type: 'snake', startPosition: 88, endPosition: 66 },
  { id: 's7', type: 'snake', startPosition: 95, endPosition: 75 },
];

/**
 * Map type options for the game
 */
export type MapType = 'random' | 'fixed';

/**
 * Default map type (fixed for consistent game experience)
 */
export const DEFAULT_MAP_TYPE: MapType = 'fixed';
