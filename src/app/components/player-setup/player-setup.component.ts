import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {GameService} from '../../services/game.service';
import {StorageService} from '../../services/storage.service';
import {NotificationService} from '../../services/notification.service';
import {generateSnakesAndLadders} from '../../utils/board-layout.util';
import {InvalidPlayerNameError, DuplicatePlayerNameError} from '../../models/player.model';
import {InvalidPlayerCountError} from '../../models/game-state.model';
import {Team, AVAILABLE_COLORS, createTeams, InvalidTeamCountError} from '../../models/team.model';
import {DEMO_PLAYERS, DEMO_TEAM_COUNT, DEMO_PLAYER_COUNT} from '../../constants/demo-data.constant';
import {MapType, FIXED_MAP_CONFIG, DEFAULT_MAP_TYPE} from '../../constants/fixed-map.constant';

interface PlayerNameInput {
    name: string;
    teamId: string;
    error: string | null;
    order: number | null; // Thứ tự chơi do người dùng nhập
}

@Component({
    selector: 'app-player-setup',
    imports: [
        CommonModule, FormsModule
    ],
    templateUrl: './player-setup.component.html',
    styleUrl: './player-setup.component.scss'
})
export class PlayerSetupComponent implements OnInit { 
    // Step 1: Player count and team configuration
    playerCount : number = 2;
    playerCountError : string | null = null;
    showPlayerNameForm : boolean = false;

    // Team configuration
    teamCount: number = 2;
    teamCountError: string | null = null;
    teams: Team[] = [];
    availableColors = AVAILABLE_COLORS;

    // Step 2: Player names input
    playerNames : PlayerNameInput[] = [];
    generalError : string | null = null;

    // Minimum/Maximum constraints
    readonly MIN_PLAYERS = 2;
    readonly MIN_TEAMS = 2;
    readonly MAX_TEAMS = 8;

    // Winning positions configuration (Requirements 13.1, 13.2)
    additionalWinningPositions: number[] = [];
    newWinningPosition: number | null = null;
    winningPositionError: string | null = null;

    // Map type selection (Requirements 6.1.1, 6.1.2)
    mapType: MapType = DEFAULT_MAP_TYPE;

    constructor(
        private gameService: GameService,
        private storageService: StorageService,
        private notificationService: NotificationService,
        private router: Router
    ) {}

    ngOnInit(): void { // Check if there's a saved game state
        const savedState = this.storageService.loadGameState();
        if (savedState && savedState.isGameStarted) { // Navigate to game screen if game already started
            this.router.navigate(['/game']);
        }
    }

    /**
   * Validate player count input
   */
    validatePlayerCount(): boolean {
        this.playerCountError = null;

        if (!this.playerCount || this.playerCount<this.MIN_PLAYERS) {
      this.playerCountError = `Số lượng người chơi phải ít nhất ${this.MIN_PLAYERS}.`;
      return false;
    }

    if (!Number.isInteger(this.playerCount)) {
      this.playerCountError = 'Số lượng người chơi phải là số nguyên.';
      return false;
    }

    return true;
  }

  /**
   * Validate team count input
   */
  validateTeamCount(): boolean {
    this.teamCountError = null;

    if (!this.teamCount || this.teamCount < this.MIN_TEAMS) {
      this.teamCountError = `Số lượng team phải ít nhất ${this.MIN_TEAMS}.`;
      return false;
    }

    if (this.teamCount > this.MAX_TEAMS) {
      this.teamCountError = `Số lượng team tối đa là ${this.MAX_TEAMS}.`;
      return false;
    }

    if (!Number.isInteger(this.teamCount)) {
      this.teamCountError = 'Số lượng team phải là số nguyên.';
      return false;
    }

    return true;
  }

  /**
   * Generate teams based on team count
   */
  generateTeams(): void {
    try {
      this.teams = createTeams(this.teamCount);
    } catch (error) {
      if (error instanceof InvalidTeamCountError) {
        this.teamCountError = error.message;
      }
    }
  }

  /**
   * Check if a color is already used by another team
   */
  isColorUsed(colorValue: string, excludeTeamId: string): boolean {
    return this.teams.some(team => team.color === colorValue && team.id !== excludeTeamId);
  }

  /**
   * Select a color for a team
   */
  selectTeamColor(teamId: string, colorValue: string): void {
    if (this.isColorUsed(colorValue, teamId)) {
      return; // Color already in use
    }

    const teamIndex = this.teams.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      this.teams[teamIndex] = {
        ...this.teams[teamIndex],
        color: colorValue
      };
    }
  }

  /**
   * Get team index for display
   */
  getTeamIndex(teamId: string): number {
    return this.teams.findIndex(t => t.id === teamId);
  }

  /**
   * Get team by ID
   */
  getTeamById(teamId: string): Team | undefined {
    return this.teams.find(t => t.id === teamId);
  }

  /**
   * Handle player count submission
   */
  onPlayerCountSubmit(): void {
    if (!this.validatePlayerCount()) {
      return;
    }

    if (!this.validateTeamCount()) {
      return;
    }

    // Generate teams
    this.generateTeams();

    // Generate player name input fields with default team assignment
    const defaultTeamId = this.teams.length > 0 ? this.teams[0].id : '';
    this.playerNames = Array.from({ length: this.playerCount }, () => ({
      name: '', 
      teamId: defaultTeamId,
      error: null,
      order: null
    }));

    this.showPlayerNameForm = true;
  }

    /**
   * Go back to player count input
   */
    goBackToPlayerCount(): void {
        this.showPlayerNameForm = false;
        this.playerNames = [];
        this.teams = [];
        this.generalError = null;
    }

    /**
   * Validate a single player name
   */
    validatePlayerName(index : number): boolean {
        const input = this.playerNames[index];
        input.error = null;

        const trimmedName = input.name.trim();

        // Check if name is empty
        if (! trimmedName) {
            input.error = 'Tên không được để trống.';
            return false;
        }

        // Check for duplicates
        const duplicateIndex = this.playerNames.findIndex((p, i) => i !== index && p.name.trim().toLowerCase() === trimmedName.toLowerCase());

        if (duplicateIndex !== -1) {
            input.error = `Tên trùng với người chơi ${
                duplicateIndex + 1
            }.`;
            return false;
        }

        return true;
    }

    /**
   * Validate all player names
   */
    validateAllPlayerNames(): boolean {
        this.generalError = null;
        let isValid = true;

        // Validate each name
        for (let i = 0; i < this.playerNames.length; i++) {
            if (!this.validatePlayerName(i)) {
                isValid = false;
            }
        }

        // Check if all names are filled
        const emptyCount = this.playerNames.filter(p => !p.name.trim()).length;
        if (emptyCount > 0) {
            this.generalError = `Vui lòng nhập tên cho tất cả ${
                this.playerCount
            } người chơi.`;
            isValid = false;
        }

        // Check for duplicate orders
        if (this.hasDuplicateOrders()) {
            this.generalError = 'Có thứ tự chơi bị trùng. Vui lòng kiểm tra lại.';
            isValid = false;
        }

        return isValid;
    }

    /**
   * Handle player names form submission
   */
    onPlayerNamesSubmit(): void {
        if (!this.validateAllPlayerNames()) {
            return;
        }

        try { 
            // Sort players by order before starting game
            this.sortPlayersByOrder();

            // Extract names and team assignments from input
            const playerData = this.playerNames.map(p => ({
              name: p.name.trim(),
              teamId: p.teamId
            }));

            // Initialize players using GameService with team information
            const players = this.gameService.initializePlayersWithTeams(
              this.playerCount, 
              playerData, 
              this.teams
            );

            // Generate snakes and ladders based on map type (Requirements 6.1.3)
            const snakesAndLadders = this.mapType === 'fixed' 
              ? [...FIXED_MAP_CONFIG] // Use fixed map configuration
              : generateSnakesAndLadders(); // Use random generation

            // Get all winning positions (Requirements 13.7)
            const winningPositions = this.allWinningPositions;

            // Initialize game state with teams, winning positions, and map type
            this.gameService.initializeGame(players, snakesAndLadders, this.teams, winningPositions, this.mapType);

            // Mark game as started
            const currentState = this.gameService.getCurrentState();
            if (currentState) {
                const updatedState = {
                    ... currentState,
                    isGameStarted: true
                };
                this.gameService.setState(updatedState);

                // Save to storage (save the updated state, not the old one)
                this.storageService.saveGameState(updatedState);
            }

            // Navigate to game screen
            this.router.navigate(['/game']);

        } catch (error) {
            let errorMessage: string;
            if (error instanceof InvalidPlayerNameError) {
                errorMessage = error.message;
            } else if (error instanceof DuplicatePlayerNameError) {
                errorMessage = error.message;
            } else if (error instanceof InvalidPlayerCountError) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Đã xảy ra lỗi khi khởi tạo game. Vui lòng thử lại.';
                console.error('Error initializing game:', error);
            }
            this.generalError = errorMessage;
            this.notificationService.error(errorMessage);
        }
    }

    /**
   * Handle input blur event for validation
   */
    onPlayerNameBlur(index : number): void {
        this.validatePlayerName(index);
    }

    /**
   * Clear error when user starts typing
   */
    onPlayerNameInput(index : number): void {
        this.playerNames[index].error = null;
        this.generalError = null;
    }

    // ============ Winning Positions Methods (Requirements 13.2, 13.3, 13.8) ============

    /**
     * Check if a winning position is valid
     * - Must be between 1 and total players
     * - Must not be 16 if playerCount >= 16 (already default)
     * - Must not be duplicate
     */
    isValidWinningPosition(): boolean {
        const pos = this.newWinningPosition;
        if (pos === null || pos === undefined) return false;
        if (!Number.isInteger(pos)) return false;
        if (pos < 1 || pos > this.playerCount) return false;
        // Only block 16 if it's already a default (playerCount >= 16)
        if (pos === 16 && this.playerCount >= 16) return false;
        if (this.additionalWinningPositions.includes(pos)) return false;
        return true;
    }

    /**
     * Add a new winning position
     */
    addWinningPosition(): void {
        this.winningPositionError = null;

        if (this.newWinningPosition === null || this.newWinningPosition === undefined) {
            this.winningPositionError = 'Vui lòng nhập vị trí.';
            return;
        }

        if (!Number.isInteger(this.newWinningPosition)) {
            this.winningPositionError = 'Vị trí phải là số nguyên.';
            return;
        }

        if (this.newWinningPosition < 1 || this.newWinningPosition > this.playerCount) {
            this.winningPositionError = `Vị trí phải từ 1 đến ${this.playerCount}.`;
            return;
        }

        // Only block 16 if it's already a default (playerCount >= 16)
        if (this.newWinningPosition === 16 && this.playerCount >= 16) {
            this.winningPositionError = 'Vị trí 16 đã là vị trí chiến thắng mặc định.';
            return;
        }

        if (this.additionalWinningPositions.includes(this.newWinningPosition)) {
            this.winningPositionError = 'Vị trí này đã được thêm.';
            return;
        }

        this.additionalWinningPositions.push(this.newWinningPosition);
        this.additionalWinningPositions.sort((a, b) => a - b);
        this.newWinningPosition = null;
        this.winningPositionError = null;
    }

    /**
     * Remove a winning position
     */
    removeWinningPosition(pos: number): void {
        this.additionalWinningPositions = this.additionalWinningPositions.filter(p => p !== pos);
    }

    /**
     * Get all winning positions (including default 16 if applicable)
     */
    get allWinningPositions(): number[] {
        // Only include position 16 if there are at least 16 players
        const positions = this.playerCount >= 16 
            ? [16, ...this.additionalWinningPositions]
            : [...this.additionalWinningPositions];
        return positions.sort((a, b) => a - b);
    }

    /**
     * Check if position 16 should be shown as default
     */
    get showDefault16(): boolean {
        return this.playerCount >= 16;
    }

    /**
     * Clear winning position input error when typing
     */
    onWinningPositionInput(): void {
        this.winningPositionError = null;
    }

    // ============ Demo Data Methods (Requirements 14.1, 14.2, 14.3) ============

    /**
     * Insert demo data for testing
     * - Creates 7 teams if not already present
     * - Fills in 34 player names with pre-assigned teams
     */
    insertDemoData(): void {
        // Set player count and team count from demo data
        this.playerCount = DEMO_PLAYER_COUNT;
        this.teamCount = DEMO_TEAM_COUNT;

        // Generate teams
        this.generateTeams();

        // Create player name inputs with demo data (order = null, user will set it)
        this.playerNames = DEMO_PLAYERS.map(demoPlayer => ({
            name: demoPlayer.name,
            teamId: this.teams[demoPlayer.teamIndex]?.id || this.teams[0].id,
            error: null,
            order: null
        }));

        // Show the player name form
        this.showPlayerNameForm = true;

        // Clear any errors
        this.generalError = null;
        this.playerCountError = null;
        this.teamCountError = null;

        // Show notification
        this.notificationService.success(`Đã thêm ${DEMO_PLAYER_COUNT} người chơi vào ${DEMO_TEAM_COUNT} teams.`);
    }

    // ============ Player Management Methods ============

    /**
     * Add a new player
     */
    addPlayer(): void {
        const defaultTeamId = this.teams.length > 0 ? this.teams[0].id : '';
        this.playerNames.push({
            name: '',
            teamId: defaultTeamId,
            error: null,
            order: null
        });
        this.playerCount = this.playerNames.length;
    }

    /**
     * Remove a player
     */
    removePlayer(index: number): void {
        if (this.playerNames.length <= this.MIN_PLAYERS) {
            this.notificationService.warning(`Cần ít nhất ${this.MIN_PLAYERS} người chơi`);
            return;
        }
        
        this.playerNames.splice(index, 1);
        this.playerCount = this.playerNames.length;
    }

    /**
     * Sort players by order before starting game
     * Players with order are sorted first, then players without order
     */
    sortPlayersByOrder(): void {
        this.playerNames.sort((a, b) => {
            // Both have order - sort by order
            if (a.order !== null && b.order !== null) {
                return a.order - b.order;
            }
            // Only a has order - a comes first
            if (a.order !== null && b.order === null) {
                return -1;
            }
            // Only b has order - b comes first
            if (a.order === null && b.order !== null) {
                return 1;
            }
            // Neither has order - keep original order
            return 0;
        });
    }

    /**
     * Check if a player's order is duplicated with another player
     */
    isDuplicateOrder(index: number): boolean {
        const currentOrder = this.playerNames[index].order;
        if (currentOrder === null) {
            return false;
        }
        return this.playerNames.some((p, i) => i !== index && p.order === currentOrder);
    }

    /**
     * Check if there are any duplicate orders
     */
    hasDuplicateOrders(): boolean {
        const orders = this.playerNames
            .map(p => p.order)
            .filter(o => o !== null);
        return new Set(orders).size !== orders.length;
    }
}
