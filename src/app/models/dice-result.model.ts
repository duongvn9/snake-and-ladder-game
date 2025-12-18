/**
 * DiceResult model representing the outcome of a dice roll
 */
export interface DiceResult {
  /** First dice value (1-6) */
  dice1: number;
  
  /** Second dice value (1-6) */
  dice2: number;
  
  /** Total of both dice */
  total: number;
  
  /** ID of the player who rolled the dice */
  rollerId: string;
  
  /** ID of the target player who receives the result */
  targetId: string;
  
  /** Timestamp of the roll */
  timestamp: Date;
}

/**
 * Error thrown when dice value is invalid
 */
export class InvalidDiceValueError extends Error {
  constructor(value: number) {
    super(`Invalid dice value: ${value}. Must be between 1 and 6.`);
    this.name = 'InvalidDiceValueError';
  }
}

/**
 * Validate a dice value
 * @param value - Dice value to validate
 * @throws InvalidDiceValueError if value is not between 1 and 6
 */
export function validateDiceValue(value: number): void {
  if (value < 1 || value > 6) {
    throw new InvalidDiceValueError(value);
  }
}

/**
 * Calculate the total of two dice values
 * @param dice1 - First dice value
 * @param dice2 - Second dice value
 * @returns Sum of both dice
 */
export function calculateDiceTotal(dice1: number, dice2: number): number {
  validateDiceValue(dice1);
  validateDiceValue(dice2);
  return dice1 + dice2;
}

/**
 * Factory function to create a dice result
 * @param dice1 - First dice value (1-6)
 * @param dice2 - Second dice value (1-6)
 * @param rollerId - ID of the player who rolled
 * @param targetId - ID of the target player
 * @returns A new DiceResult object
 * @throws InvalidDiceValueError if any dice value is invalid
 */
export function createDiceResult(
  dice1: number,
  dice2: number,
  rollerId: string,
  targetId: string
): DiceResult {
  validateDiceValue(dice1);
  validateDiceValue(dice2);
  
  return {
    dice1,
    dice2,
    total: dice1 + dice2,
    rollerId,
    targetId,
    timestamp: new Date()
  };
}
