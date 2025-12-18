import { v4 as uuidv4 } from 'uuid';

/**
 * Player model representing a game participant
 */
export interface Player {
  /** Unique identifier for the player */
  id: string;
  
  /** Player's display name */
  name: string;
  
  /** Player's color (HSL string format or hex from team) */
  color: string;
  
  /** Team ID the player belongs to (optional for backward compatibility) */
  teamId?: string;
  
  /** Team color (hex format, derived from team) */
  teamColor?: string;
  
  /** Current position on the board (0-100) */
  position: number;
  
  /** Whether the player has finished the game */
  isFinished: boolean;
  
  /** Timestamp when the player finished (if finished) */
  finishTime?: Date;
  
  /** Turn order in the sorted player list */
  turnOrder: number;
}

/**
 * Error thrown when player name validation fails
 */
export class InvalidPlayerNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlayerNameError';
  }
}

/**
 * Error thrown when duplicate player name is detected
 */
export class DuplicatePlayerNameError extends Error {
  constructor(name: string) {
    super(`Player name "${name}" already exists.`);
    this.name = 'DuplicatePlayerNameError';
  }
}

/**
 * Generate a distinct HSL color for a player based on their index
 * @param index - The player's index in the list
 * @param total - Total number of players
 * @returns HSL color string
 */
export function generatePlayerColor(index: number, total: number): string {
  const hue = (index * 360) / total;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Validate player name
 * @param name - Player name to validate
 * @throws InvalidPlayerNameError if name is empty or only whitespace
 */
export function validatePlayerName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new InvalidPlayerNameError('Player name cannot be empty.');
  }
}

/**
 * Check for duplicate player names
 * @param name - Name to check
 * @param existingPlayers - Array of existing players
 * @throws DuplicatePlayerNameError if name already exists
 */
export function checkDuplicatePlayerName(name: string, existingPlayers: Player[]): void {
  const normalizedName = name.trim().toLowerCase();
  const isDuplicate = existingPlayers.some(
    player => player.name.trim().toLowerCase() === normalizedName
  );
  
  if (isDuplicate) {
    throw new DuplicatePlayerNameError(name);
  }
}

/**
 * Factory function to create a new player
 * @param name - Player's name
 * @param index - Player's index in the list (for color generation)
 * @param total - Total number of players (for color generation)
 * @param existingPlayers - Array of existing players (for duplicate check)
 * @returns A new Player object
 * @throws InvalidPlayerNameError if name is invalid
 * @throws DuplicatePlayerNameError if name already exists
 */
export function createPlayer(
  name: string,
  index: number,
  total: number,
  existingPlayers: Player[] = []
): Player {
  // Validate name
  validatePlayerName(name);
  
  // Check for duplicates
  checkDuplicatePlayerName(name, existingPlayers);
  
  // Create and return player
  return {
    id: uuidv4(),
    name: name.trim(),
    color: generatePlayerColor(index, total),
    position: 0, // Start at position 0 (before the board)
    isFinished: false,
    turnOrder: index
  };
}

/**
 * Factory function to create multiple players
 * @param names - Array of player names
 * @returns Array of Player objects
 * @throws InvalidPlayerNameError if any name is invalid
 * @throws DuplicatePlayerNameError if any name is duplicated
 */
export function createPlayers(names: string[]): Player[] {
  const players: Player[] = [];
  const total = names.length;
  
  names.forEach((name, index) => {
    const player = createPlayer(name, index, total, players);
    players.push(player);
  });
  
  return players;
}
