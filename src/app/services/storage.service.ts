import {Injectable} from '@angular/core';
import {GameState} from '../models/game-state.model';

/**
 * Error thrown when localStorage is not available
 */
export class StorageNotAvailableError extends Error {
    constructor() {
        super('localStorage is not available in this browser.');
        this.name = 'StorageNotAvailableError';
    }
}

/**
 * Error thrown when game state is corrupted
 */
export class CorruptedStateError extends Error {
    constructor(reason : string) {
        super(`Cannot restore game state: ${reason}`);
        this.name = 'CorruptedStateError';
    }
}

/**
 * Interface for game history entry
 */
export interface GameHistoryEntry {
    turnNumber: number;
    rollerId: string;
    targetId: string;
    diceResult: [number, number];
    fromPosition: number;
    toPosition: number;
    timestamp: Date;
}

/**
 * Interface for serialized game history entry (for export)
 */
export interface SerializedGameHistoryEntry {
    turnNumber: number;
    rollerId: string;
    targetId: string;
    diceResult: [number, number];
    fromPosition: number;
    toPosition: number;
    timestamp: string;
}

/**
 * Interface for JSON file export format
 */
export interface GameExportData {
    gameId: string;
    exportedAt: string;
    players: any[];
    snakesAndLadders: any[];
    gameHistory: SerializedGameHistoryEntry[];
    currentState: GameState;
}

/**
 * StorageService handles game state persistence using localStorage and JSON file export
 */
@Injectable({providedIn: 'root'})
export class StorageService {
    private readonly STORAGE_KEY = 'dl-game-state';
    private readonly VERSION_KEY = 'dl-game-version';
    private readonly CURRENT_VERSION = '1.0.0';
    private isStorageAvailable = false;

    constructor() {
        this.isStorageAvailable = this.checkStorageAvailability();
    }

    /**
   * Check if localStorage is available
   * @returns true if localStorage is available, false otherwise
   */
    private checkStorageAvailability(): boolean {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    /**
   * Save game state to localStorage
   * @param state - Game state to save
   */
    saveGameState(state : GameState): void {
        if (!this.isStorageAvailable) {
            console.warn('localStorage is not available. Game state will not be persisted.');
            return;
        }
        
        try { // Convert dates to ISO strings for JSON serialization
            const serializedState = this.serializeState(state);

            // Save to localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializedState));
            localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
        } catch (error) {
            // Handle quota exceeded or other localStorage errors gracefully
            console.error('Failed to save game state to localStorage:', error);
            // Don't throw - allow game to continue without persistence
        }
    }

    /**
   * Load game state from localStorage
   * @returns GameState if found and valid, null otherwise
   * @throws CorruptedStateError if state is corrupted
   */
    loadGameState(): GameState | null {
        if (!this.isStorageAvailable) {
            return null;
        }
        
        try {
            const savedState = localStorage.getItem(this.STORAGE_KEY);
            const savedVersion = localStorage.getItem(this.VERSION_KEY);

            if (! savedState) {
                return null;
            }

            // Check version compatibility
            if (savedVersion !== this.CURRENT_VERSION) {
                console.warn(`Game state version mismatch. Expected ${
                    this.CURRENT_VERSION
                }, got ${savedVersion}`);
                // Could implement migration logic here in the future
            }

            // Parse and deserialize state
            const parsedState = JSON.parse(savedState);
            const deserializedState = this.deserializeState(parsedState);

            // Validate state structure
            this.validateState(deserializedState);

            return deserializedState;
        } catch (error) {
            if (error instanceof CorruptedStateError) {
                throw error;
            }

            // If parsing or validation fails, clear corrupted state
            console.error('Failed to load game state:', error);
            this.clearGameState();
            throw new CorruptedStateError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
   * Clear game state from localStorage
   */
    clearGameState(): void {
        if (!this.isStorageAvailable) {
            return;
        }
        
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.VERSION_KEY);
        } catch (error) {
            console.error('Failed to clear game state:', error);
            // Don't throw - this is a cleanup operation
        }
    }

    /**
   * Serialize game state for storage (convert Dates to strings)
   * @param state - Game state to serialize
   * @returns Serialized state object
   */
    private serializeState(state : GameState): any {
        return {
            ...state,
            createdAt: state.createdAt.toISOString(),
            lastUpdatedAt: state.lastUpdatedAt.toISOString(),
            players: state.players.map(player => ({
                ...player,
                finishTime: player.finishTime ? player.finishTime.toISOString() : undefined
            }))
        };
    }

    /**
   * Deserialize game state from storage (convert strings to Dates)
   * @param data - Serialized state data
   * @returns Deserialized GameState
   */
    private deserializeState(data : any): GameState {
        return {
            ...data,
            createdAt: new Date(data.createdAt),
            lastUpdatedAt: new Date(data.lastUpdatedAt),
            // Ensure new fields have default values for backward compatibility
            currentRound: data.currentRound ?? 1,
            turnsInCurrentRound: data.turnsInCurrentRound ?? 0,
            teams: data.teams ?? [], // Default to empty array for backward compatibility
            diceConfig: {
                maxPoints: data.diceConfig?.maxPoints ?? 12,
                pendingMaxPoints: data.diceConfig?.pendingMaxPoints ?? null
            },
            players: data.players.map(
                (player : any) => ({
                    ...player,
                    teamId: player.teamId ?? undefined,
                    teamColor: player.teamColor ?? undefined,
                    finishTime: player.finishTime ? new Date(player.finishTime) : undefined
                })
            )
        };
    }

    /**
   * Validate game state structure
   * @param state - State to validate
   * @throws CorruptedStateError if state is invalid
   */
    private validateState(state : any): void { // Check required fields
        if (!state.gameId || typeof state.gameId !== 'string') {
            throw new CorruptedStateError('Missing or invalid gameId');
        }

        if (!Array.isArray(state.players)) {
            throw new CorruptedStateError('Missing or invalid players array');
        }

        if (!Array.isArray(state.snakesAndLadders)) {
            throw new CorruptedStateError('Missing or invalid snakesAndLadders array');
        }

        if (typeof state.isGameStarted !== 'boolean') {
            throw new CorruptedStateError('Missing or invalid isGameStarted');
        }

        if (typeof state.isGameFinished !== 'boolean') {
            throw new CorruptedStateError('Missing or invalid isGameFinished');
        }

        if (!(state.createdAt instanceof Date) || isNaN(state.createdAt.getTime())) {
            throw new CorruptedStateError('Invalid createdAt date');
        }

        if (!(state.lastUpdatedAt instanceof Date) || isNaN(state.lastUpdatedAt.getTime())) {
            throw new CorruptedStateError('Invalid lastUpdatedAt date');
        }

        // Validate players
        for (const player of state.players) {
            if (! player.id || ! player.name || typeof player.position !== 'number') {
                throw new CorruptedStateError('Invalid player data');
            }
        }
    }

    /**
     * Export game state to a downloadable JSON file
     * @param state - Game state to export
     * @param gameHistory - Optional game history entries
     */
    exportToFile(state : GameState, gameHistory : GameHistoryEntry[] = []): void {
        try { // Create export data with metadata
            const exportData: GameExportData = {
                gameId: state.gameId,
                exportedAt: new Date().toISOString(),
                players: state.players.map(player => ({
                    id: player.id,
                    name: player.name,
                    color: player.color,
                    position: player.position,
                    isFinished: player.isFinished,
                    finishTime: player.finishTime ? player.finishTime.toISOString() : null,
                    turnOrder: player.turnOrder
                })),
                snakesAndLadders: state.snakesAndLadders.map(element => ({id: element.id, type: element.type, startPosition: element.startPosition, endPosition: element.endPosition})),
                gameHistory: gameHistory.map(entry => ({
                    ...entry,
                    timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
                })),
                currentState: this.serializeState(state)
            };

            // Convert to JSON string with pretty formatting
            const jsonString = JSON.stringify(exportData, null, 2);

            // Create blob and download link
            const blob = new Blob([jsonString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);

            // Create temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `dl-game-${
                state.gameId
            }-${
                Date.now()
            }.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export game state to file:', error);
            throw new Error('Failed to export game data to file');
        }
    }
}
