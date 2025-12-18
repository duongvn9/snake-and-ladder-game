import { v4 as uuidv4 } from 'uuid';

/**
 * SnakeOrLadder model representing special board elements
 */
export interface SnakeOrLadder {
  /** Unique identifier */
  id: string;
  
  /** Type of element */
  type: 'snake' | 'ladder';
  
  /** Starting position (head for snake, bottom for ladder) */
  startPosition: number;
  
  /** Ending position (tail for snake, top for ladder) */
  endPosition: number;
}

/**
 * Error thrown when snake validation fails
 */
export class InvalidSnakeError extends Error {
  constructor(startPosition: number, endPosition: number) {
    super(`Invalid snake: head (${startPosition}) must be greater than tail (${endPosition}).`);
    this.name = 'InvalidSnakeError';
  }
}

/**
 * Error thrown when ladder validation fails
 */
export class InvalidLadderError extends Error {
  constructor(startPosition: number, endPosition: number) {
    super(`Invalid ladder: bottom (${startPosition}) must be less than top (${endPosition}).`);
    this.name = 'InvalidLadderError';
  }
}

/**
 * Error thrown when duplicate start position is detected
 */
export class DuplicateStartPositionError extends Error {
  constructor(position: number) {
    super(`Duplicate start position: ${position} is already used by another snake or ladder.`);
    this.name = 'DuplicateStartPositionError';
  }
}

/**
 * Validate a snake
 * @param startPosition - Head position
 * @param endPosition - Tail position
 * @throws InvalidSnakeError if head is not greater than tail
 */
export function validateSnake(startPosition: number, endPosition: number): void {
  if (startPosition <= endPosition) {
    throw new InvalidSnakeError(startPosition, endPosition);
  }
}

/**
 * Validate a ladder
 * @param startPosition - Bottom position
 * @param endPosition - Top position
 * @throws InvalidLadderError if bottom is not less than top
 */
export function validateLadder(startPosition: number, endPosition: number): void {
  if (startPosition >= endPosition) {
    throw new InvalidLadderError(startPosition, endPosition);
  }
}

/**
 * Check for duplicate start positions
 * @param startPosition - Position to check
 * @param existingElements - Array of existing snakes and ladders
 * @throws DuplicateStartPositionError if position is already used
 */
export function checkDuplicateStartPosition(
  startPosition: number,
  existingElements: SnakeOrLadder[]
): void {
  const isDuplicate = existingElements.some(
    element => element.startPosition === startPosition
  );
  
  if (isDuplicate) {
    throw new DuplicateStartPositionError(startPosition);
  }
}

/**
 * Factory function to create a snake
 * @param startPosition - Head position (must be > endPosition)
 * @param endPosition - Tail position
 * @param existingElements - Array of existing snakes and ladders
 * @returns A new SnakeOrLadder object of type 'snake'
 * @throws InvalidSnakeError if validation fails
 * @throws DuplicateStartPositionError if start position is already used
 */
export function createSnake(
  startPosition: number,
  endPosition: number,
  existingElements: SnakeOrLadder[] = []
): SnakeOrLadder {
  validateSnake(startPosition, endPosition);
  checkDuplicateStartPosition(startPosition, existingElements);
  
  return {
    id: uuidv4(),
    type: 'snake',
    startPosition,
    endPosition
  };
}

/**
 * Factory function to create a ladder
 * @param startPosition - Bottom position (must be < endPosition)
 * @param endPosition - Top position
 * @param existingElements - Array of existing snakes and ladders
 * @returns A new SnakeOrLadder object of type 'ladder'
 * @throws InvalidLadderError if validation fails
 * @throws DuplicateStartPositionError if start position is already used
 */
export function createLadder(
  startPosition: number,
  endPosition: number,
  existingElements: SnakeOrLadder[] = []
): SnakeOrLadder {
  validateLadder(startPosition, endPosition);
  checkDuplicateStartPosition(startPosition, existingElements);
  
  return {
    id: uuidv4(),
    type: 'ladder',
    startPosition,
    endPosition
  };
}
