import { v4 as uuidv4 } from 'uuid';
import { Player } from './player.model';
import { SnakeOrLadder } from './snake-or-ladder.model';
import { Team } from './team.model';
import { MapType } from '../constants/fixed-map.constant';

/**
 * DiceConfiguration model representing dice settings
 */
export interface DiceConfiguration {
  /** Maximum points on the dice (minimum 1, default 12) */
  maxPoints: number;
  /** Pending max points to be applied in the next round (null if no pending change) */
  pendingMaxPoints?: number | null;
}

/**
 * GameState model representing the complete state of the game
 */
export interface GameState {
  /** Unique identifier for this game session */
  gameId: string;
  
  /** Array of all players in the game */
  players: Player[];
  
  /** Array of all teams in the game */
  teams: Team[];
  
  /** Array of all snakes and ladders on the board */
  snakesAndLadders: SnakeOrLadder[];
  
  /** Type of map used: 'random' or 'fixed' */
  mapType: MapType;
  
  /** ID of the player who is currently rolling the dice */
  currentDiceRollerId: string;
  
  /** ID of the selected target player (null if not yet selected) */
  selectedTargetId: string | null;
  
  /** Result of the last dice roll (null if no roll yet) */
  lastDiceResult: number | null;
  
  /** Dice configuration */
  diceConfig: DiceConfiguration;
  
  /** Current round number (increments when all players have rolled once) */
  currentRound: number;
  
  /** Number of turns completed in the current round */
  turnsInCurrentRound: number;
  
  /** Whether the game has started */
  isGameStarted: boolean;
  
  /** Whether the game has finished */
  isGameFinished: boolean;
  
  /** ID of the player whose token should be shown on the board (null to hide token) */
  showTokenForPlayerId: string | null;
  
  /** Special winning positions (default includes position 16 for 16th anniversary) */
  winningPositions: number[];
  
  /** Timestamp when the game was created */
  createdAt: Date;
  
  /** Timestamp of the last state update */
  lastUpdatedAt: Date;
}

/**
 * Error thrown when player count validation fails
 */
export class InvalidPlayerCountError extends Error {
  constructor(count: number) {
    super(`Invalid player count: ${count}. Must be at least 2.`);
    this.name = 'InvalidPlayerCountError';
  }
}

/**
 * Error thrown when position validation fails
 */
export class InvalidPositionError extends Error {
  constructor(position: number) {
    super(`Invalid position: ${position}. Must be between 0 and 100.`);
    this.name = 'InvalidPositionError';
  }
}

/**
 * Validate player count
 * @param count - Number of players
 * @throws InvalidPlayerCountError if count is less than 2
 */
export function validatePlayerCount(count: number): void {
  if (count < 2) {
    throw new InvalidPlayerCountError(count);
  }
}

/**
 * Validate position on the board
 * @param position - Position to validate
 * @throws InvalidPositionError if position is not between 0 and 100
 */
export function validatePosition(position: number): void {
  if (position < 0 || position > 100) {
    throw new InvalidPositionError(position);
  }
}

/**
 * Factory function to create initial game state
 * @param players - Array of players
 * @param snakesAndLadders - Array of snakes and ladders
 * @param teams - Array of teams (optional for backward compatibility)
 * @param winningPositions - Array of special winning positions (default includes 16)
 * @param mapType - Type of map used: 'random' or 'fixed' (default: 'random')
 * @returns A new GameState object
 */
export function createInitialGameState(
  players: Player[],
  snakesAndLadders: SnakeOrLadder[],
  teams: Team[] = [],
  winningPositions: number[] = [16],
  mapType: MapType = 'random'
): GameState {
  validatePlayerCount(players.length);
  
  const now = new Date();
  
  // Ensure position 16 is always included (Requirements 13.1)
  const finalWinningPositions = winningPositions.includes(16) 
    ? [...winningPositions] 
    : [16, ...winningPositions];
  
  return {
    gameId: uuidv4(),
    players,
    teams,
    snakesAndLadders,
    mapType,
    currentDiceRollerId: players[0]?.id || '',
    selectedTargetId: null,
    lastDiceResult: null,
    diceConfig: { maxPoints: 12, pendingMaxPoints: null }, // Default to 12
    currentRound: 1,
    turnsInCurrentRound: 0,
    isGameStarted: false,
    isGameFinished: false,
    showTokenForPlayerId: null,
    winningPositions: finalWinningPositions.sort((a, b) => a - b),
    createdAt: now,
    lastUpdatedAt: now
  };
}
