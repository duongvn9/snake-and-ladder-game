import { v4 as uuidv4 } from 'uuid';

/**
 * Team model representing a group of players with a shared color
 */
export interface Team {
  /** Unique identifier for the team */
  id: string;
  /** Team display name */
  name: string;
  /** Team color (hex format) */
  color: string;
}

/**
 * Available colors for teams
 */
export const AVAILABLE_COLORS = [
  { name: 'Đỏ', value: '#C41E3A' },
  { name: 'Xanh navy', value: '#1D3557' },
  { name: 'Vàng nghệ', value: '#FFB703' },
  { name: 'Xanh lá', value: '#28A745' },
  { name: 'Tím đậm', value: '#7209B7' },
  { name: 'Cam cháy', value: '#FB8500' },
  { name: 'Hồng sen', value: '#F72585' },
  { name: 'Xanh xám', value: '#457B9D' },
];

/**
 * Error thrown when team count validation fails
 */
export class InvalidTeamCountError extends Error {
  constructor(count: number) {
    super(`Invalid team count: ${count}. Must be between 2 and 8.`);
    this.name = 'InvalidTeamCountError';
  }
}

/**
 * Error thrown when duplicate team color is detected
 */
export class DuplicateTeamColorError extends Error {
  constructor(color: string) {
    super(`Team color "${color}" is already in use.`);
    this.name = 'DuplicateTeamColorError';
  }
}

/**
 * Validate team count
 * @param count - Number of teams
 * @throws InvalidTeamCountError if count is not between 2 and 8
 */
export function validateTeamCount(count: number): void {
  if (count < 2 || count > 8) {
    throw new InvalidTeamCountError(count);
  }
}

/**
 * Check for duplicate team colors
 * @param color - Color to check
 * @param existingTeams - Array of existing teams
 * @param excludeTeamId - Optional team ID to exclude from check (for editing)
 * @throws DuplicateTeamColorError if color already exists
 */
export function checkDuplicateTeamColor(
  color: string,
  existingTeams: Team[],
  excludeTeamId?: string
): void {
  const isDuplicate = existingTeams.some(
    team => team.color === color && team.id !== excludeTeamId
  );
  
  if (isDuplicate) {
    throw new DuplicateTeamColorError(color);
  }
}

/**
 * Factory function to create a new team
 * @param name - Team name
 * @param color - Team color (hex format)
 * @param existingTeams - Array of existing teams (for duplicate check)
 * @returns A new Team object
 * @throws DuplicateTeamColorError if color already exists
 */
export function createTeam(
  name: string,
  color: string,
  existingTeams: Team[] = []
): Team {
  // Check for duplicate colors
  checkDuplicateTeamColor(color, existingTeams);
  
  return {
    id: uuidv4(),
    name: name.trim(),
    color
  };
}

/**
 * Factory function to create multiple teams with default colors
 * @param count - Number of teams to create
 * @returns Array of Team objects
 * @throws InvalidTeamCountError if count is not between 2 and 8
 */
export function createTeams(count: number): Team[] {
  validateTeamCount(count);
  
  const teams: Team[] = [];
  
  for (let i = 0; i < count; i++) {
    const color = AVAILABLE_COLORS[i % AVAILABLE_COLORS.length];
    teams.push({
      id: uuidv4(),
      name: `Team ${i + 1}`,
      color: color.value
    });
  }
  
  return teams;
}
