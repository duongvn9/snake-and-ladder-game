import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState, createInitialGameState, validatePlayerCount, validatePosition } from '../models/game-state.model';
import { Player, createPlayers, generatePlayerColor } from '../models/player.model';
import { SnakeOrLadder } from '../models/snake-or-ladder.model';
import { Team } from '../models/team.model';
import { MapType } from '../constants/fixed-map.constant';
import { v4 as uuidv4 } from 'uuid';

/**
 * GameService manages the game state and provides methods for game operations
 */
@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly stateSubject: BehaviorSubject<GameState | null>;
  public readonly state$: Observable<GameState | null>;

  constructor() {
    this.stateSubject = new BehaviorSubject<GameState | null>(null);
    this.state$ = this.stateSubject.asObservable();
  }

  /**
   * Get the current game state
   */
  getCurrentState(): GameState | null {
    return this.stateSubject.value;
  }

  /**
   * Update the game state immutably
   * @param updater - Function that takes current state and returns new state
   */
  private updateState(updater: (state: GameState) => GameState): void {
    const currentState = this.stateSubject.value;
    if (!currentState) {
      throw new Error('Cannot update state: game not initialized');
    }

    const newState: GameState = {
      ...updater(currentState),
      lastUpdatedAt: new Date()
    };

    this.stateSubject.next(newState);
  }

  /**
   * Initialize players for the game
   * @param count - Number of players (must be >= 2)
   * @param names - Array of player names
   * @returns Array of created players
   * @throws InvalidPlayerCountError if count < 2
   * @throws InvalidPlayerNameError if any name is invalid
   * @throws DuplicatePlayerNameError if any name is duplicated
   */
  initializePlayers(count: number, names: string[]): Player[] {
    // Validate player count
    validatePlayerCount(count);

    // Validate that names array matches count
    if (names.length !== count) {
      throw new Error(`Expected ${count} names, but received ${names.length}`);
    }

    // Create players with validation (turnOrder is already set by index in createPlayers)
    const players = createPlayers(names);

    return players;
  }

  /**
   * Initialize players for the game with team assignments
   * @param count - Number of players (must be >= 2)
   * @param playerData - Array of player data with name and teamId
   * @param teams - Array of teams
   * @returns Array of created players with team colors
   * @throws InvalidPlayerCountError if count < 2
   * @throws InvalidPlayerNameError if any name is invalid
   * @throws DuplicatePlayerNameError if any name is duplicated
   */
  initializePlayersWithTeams(
    count: number, 
    playerData: { name: string; teamId: string }[], 
    teams: Team[]
  ): Player[] {
    // Validate player count
    validatePlayerCount(count);

    // Validate that playerData array matches count
    if (playerData.length !== count) {
      throw new Error(`Expected ${count} players, but received ${playerData.length}`);
    }

    // Create a map of team IDs to colors for quick lookup
    const teamColorMap = new Map<string, string>();
    teams.forEach(team => {
      teamColorMap.set(team.id, team.color);
    });

    // Create players with team colors
    const players: Player[] = [];
    const seenNames = new Set<string>();

    playerData.forEach((data, index) => {
      const trimmedName = data.name.trim();
      const normalizedName = trimmedName.toLowerCase();

      // Check for empty name
      if (!trimmedName) {
        throw new Error(`Player name cannot be empty.`);
      }

      // Check for duplicate names
      if (seenNames.has(normalizedName)) {
        throw new Error(`Player name "${trimmedName}" already exists.`);
      }
      seenNames.add(normalizedName);

      // Get team color
      const teamColor = teamColorMap.get(data.teamId) || generatePlayerColor(index, count);

      players.push({
        id: uuidv4(),
        name: trimmedName,
        color: teamColor, // Use team color as main color
        teamId: data.teamId,
        teamColor: teamColor,
        position: 0, // Start at position 0 (before the board)
        isFinished: false,
        turnOrder: index
      });
    });

    // Return players in original input order (turnOrder already set by index)
    return players;
  }

  /**
   * Validate player count
   * @param count - Number of players
   * @throws InvalidPlayerCountError if count < 2
   */
  validatePlayerCount(count: number): void {
    validatePlayerCount(count);
  }

  /**
   * Generate colors for a given number of players
   * @param count - Number of players
   * @returns Array of HSL color strings
   */
  generatePlayerColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(generatePlayerColor(i, count));
    }
    return colors;
  }

  /**
   * Sort players alphabetically by name
   * @param players - Array of players to sort
   * @returns Sorted array of players
   */
  private sortPlayersByName(players: Player[]): Player[] {
    return [...players].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }

  /**
   * Roll a single dice and return the result
   * @returns Single dice value (1 to maxPoints from current configuration)
   */
  rollDice(): number {
    const state = this.getCurrentState();
    if (!state) {
      throw new Error('Cannot roll dice: game not initialized');
    }

    const maxPoints = state.diceConfig.maxPoints;
    return Math.floor(Math.random() * maxPoints) + 1;
  }

  /**
   * Move a player by a given number of steps
   * @param playerId - ID of the player to move
   * @param steps - Number of steps to move
   */
  movePlayer(playerId: string, steps: number): void {
    this.updateState(state => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        throw new Error(`Player with ID ${playerId} not found`);
      }

      const player = state.players[playerIndex];
      const newPosition = player.position + steps;

      // Don't move beyond position 100
      const finalPosition = newPosition > 100 ? player.position : newPosition;

      // Validate position
      validatePosition(finalPosition);

      // Create updated player
      const updatedPlayer: Player = {
        ...player,
        position: finalPosition
      };

      // Create new players array with updated player
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      return {
        ...state,
        players: updatedPlayers
      };
    });
  }

  /**
   * Check if a position has a snake or ladder
   * @param position - Position to check
   * @returns SnakeOrLadder if found, null otherwise
   */
  checkSnakeOrLadder(position: number): SnakeOrLadder | null {
    const state = this.getCurrentState();
    if (!state) {
      return null;
    }

    return state.snakesAndLadders.find(
      element => element.startPosition === position
    ) || null;
  }

  /**
   * Apply a special move (snake or ladder) to a player
   * @param playerId - ID of the player
   * @param special - SnakeOrLadder element to apply
   */
  applySpecialMove(playerId: string, special: SnakeOrLadder): void {
    this.updateState(state => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        throw new Error(`Player with ID ${playerId} not found`);
      }

      const player = state.players[playerIndex];

      // Move player to end position of snake/ladder
      const updatedPlayer: Player = {
        ...player,
        position: special.endPosition
      };

      // Create new players array with updated player
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      return {
        ...state,
        players: updatedPlayers
      };
    });
  }

  /**
   * Move to the next turn
   */
  nextTurn(): void {
    this.updateState(state => {
      // Get active players (not finished)
      const activePlayers = state.players.filter(p => !p.isFinished);
      
      if (activePlayers.length === 0) {
        // No active players, game should be finished
        return state;
      }

      // Sort active players by turn order
      const sortedActivePlayers = [...activePlayers].sort(
        (a, b) => a.turnOrder - b.turnOrder
      );

      // Find current roller index
      const currentIndex = sortedActivePlayers.findIndex(
        p => p.id === state.currentDiceRollerId
      );

      // Get next player (circular)
      const nextIndex = (currentIndex + 1) % sortedActivePlayers.length;
      const nextRollerId = sortedActivePlayers[nextIndex].id;

      // Track turns in current round
      let newTurnsInCurrentRound = (state.turnsInCurrentRound ?? 0) + 1;
      let newCurrentRound = state.currentRound ?? 1;
      let newDiceConfig = { ...state.diceConfig };

      // Check if a new round is starting (all active players have rolled)
      if (newTurnsInCurrentRound >= activePlayers.length) {
        newTurnsInCurrentRound = 0;
        newCurrentRound += 1;

        // Apply pending dice configuration at the start of a new round
        if (newDiceConfig.pendingMaxPoints !== null && newDiceConfig.pendingMaxPoints !== undefined) {
          newDiceConfig = {
            maxPoints: newDiceConfig.pendingMaxPoints,
            pendingMaxPoints: null
          };
        }
      }

      return {
        ...state,
        currentDiceRollerId: nextRollerId,
        selectedTargetId: null, // Reset target selection
        lastDiceResult: null, // Reset dice result for new turn
        turnsInCurrentRound: newTurnsInCurrentRound,
        currentRound: newCurrentRound,
        diceConfig: newDiceConfig
      };
    });
  }

  /**
   * Get the current dice roller
   * @returns Current roller player or null if not found
   */
  getCurrentRoller(): Player | null {
    const state = this.getCurrentState();
    if (!state) {
      return null;
    }

    return state.players.find(p => p.id === state.currentDiceRollerId) || null;
  }

  /**
   * Check if a player has won (reached position 100)
   * @param playerId - ID of the player to check
   * @returns true if player has won, false otherwise
   */
  checkWinCondition(playerId: string): boolean {
    const state = this.getCurrentState();
    if (!state) {
      return false;
    }

    const player = state.players.find(p => p.id === playerId);
    return player ? player.position === 100 : false;
  }

  /**
   * Mark a player as finished
   * @param playerId - ID of the player to mark as finished
   */
  markPlayerFinished(playerId: string): void {
    this.updateState(state => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        throw new Error(`Player with ID ${playerId} not found`);
      }

      const player = state.players[playerIndex];

      // Only mark as finished if at position 100
      if (player.position !== 100) {
        throw new Error(`Player ${player.name} is not at position 100`);
      }

      // Create updated player with finish time
      const updatedPlayer: Player = {
        ...player,
        isFinished: true,
        finishTime: new Date()
      };

      // Create new players array with updated player
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      return {
        ...state,
        players: updatedPlayers
      };
    });
  }

  /**
   * Check if the game has ended (all players finished)
   * @returns true if all players are finished, false otherwise
   */
  checkGameEnd(): boolean {
    const state = this.getCurrentState();
    if (!state || state.players.length === 0) {
      return false;
    }

    return state.players.every(p => p.isFinished);
  }

  /**
   * Initialize a new game with players and snakes/ladders
   * @param players - Array of players
   * @param snakesAndLadders - Array of snakes and ladders
   * @param teams - Array of teams (optional for backward compatibility)
   * @param winningPositions - Array of special winning positions (default includes 16)
   * @param mapType - Type of map used: 'random' or 'fixed' (default: 'random')
   */
  initializeGame(
    players: Player[], 
    snakesAndLadders: SnakeOrLadder[], 
    teams: Team[] = [],
    winningPositions: number[] = [16],
    mapType: MapType = 'random'
  ): void {
    const initialState = createInitialGameState(players, snakesAndLadders, teams, winningPositions, mapType);
    this.stateSubject.next(initialState);
  }

  /**
   * Set the game state (for restoration from storage)
   * @param state - Game state to set
   */
  setState(state: GameState): void {
    this.stateSubject.next(state);
  }

  /**
   * Set the selected target player
   * @param targetId - ID of the target player
   */
  setSelectedTarget(targetId: string): void {
    this.updateState(state => {
      // Validate that target player exists and is not finished
      const targetPlayer = state.players.find(p => p.id === targetId);
      if (!targetPlayer) {
        throw new Error(`Target player with ID ${targetId} not found`);
      }
      if (targetPlayer.isFinished) {
        throw new Error(`Cannot select finished player ${targetPlayer.name} as target`);
      }

      return {
        ...state,
        selectedTargetId: targetId
      };
    });
  }

  /**
   * Update dice configuration
   * @param maxPoints - Maximum points for the dice (must be >= 1)
   * @throws Error if maxPoints is less than 1
   */
  updateDiceConfig(maxPoints: number): void {
    if (!this.validateMaxPoints(maxPoints)) {
      throw new Error(`Invalid max points: ${maxPoints}. Must be at least 1.`);
    }

    this.updateState(state => ({
      ...state,
      diceConfig: { ...state.diceConfig, maxPoints }
    }));
  }

  /**
   * Update dice configuration with pending value for next round
   * @param maxPoints - Maximum points for the dice (must be >= 1)
   * @throws Error if maxPoints is less than 1
   */
  updateDiceConfigPending(maxPoints: number): void {
    if (!this.validateMaxPoints(maxPoints)) {
      throw new Error(`Invalid max points: ${maxPoints}. Must be at least 1.`);
    }

    this.updateState(state => ({
      ...state,
      diceConfig: { 
        ...state.diceConfig, 
        pendingMaxPoints: maxPoints 
      }
    }));
  }

  /**
   * Apply pending dice configuration (called at the start of a new round)
   */
  applyPendingDiceConfig(): void {
    this.updateState(state => {
      if (state.diceConfig.pendingMaxPoints !== null && state.diceConfig.pendingMaxPoints !== undefined) {
        return {
          ...state,
          diceConfig: {
            maxPoints: state.diceConfig.pendingMaxPoints,
            pendingMaxPoints: null
          }
        };
      }
      return state;
    });
  }

  /**
   * Validate max points value
   * @param maxPoints - Maximum points to validate
   * @returns true if valid, false otherwise
   */
  validateMaxPoints(maxPoints: number): boolean {
    return Number.isInteger(maxPoints) && maxPoints >= 1;
  }

  /**
   * Get current dice configuration
   * @returns Current DiceConfiguration or null if game not initialized
   */
  getDiceConfig(): { maxPoints: number } | null {
    const state = this.getCurrentState();
    return state ? state.diceConfig : null;
  }

  /**
   * Reset the game service
   */
  reset(): void {
    this.stateSubject.next(null);
  }

  /**
   * Set the player whose token should be shown on the board
   * @param playerId - ID of the player to show token for, or null to hide
   */
  setShowTokenForPlayer(playerId: string | null): void {
    this.updateState(state => {
      // If playerId is provided, validate that the player exists
      if (playerId !== null) {
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
          throw new Error(`Player with ID ${playerId} not found`);
        }
      }

      return {
        ...state,
        showTokenForPlayerId: playerId
      };
    });
  }

  /**
   * Get the player whose token should be shown
   * @returns Player object or null if no token should be shown
   */
  getShowTokenPlayer(): Player | null {
    const state = this.getCurrentState();
    if (!state || !state.showTokenForPlayerId) {
      return null;
    }

    return state.players.find(p => p.id === state.showTokenForPlayerId) || null;
  }
}
