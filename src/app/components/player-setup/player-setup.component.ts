import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {GameService} from '../../services/game.service';
import {StorageService} from '../../services/storage.service';
import {NotificationService} from '../../services/notification.service';
import {generateSnakesAndLadders, generateBoardLayout, BoardCell} from '../../utils/board-layout.util';
import {SnakeOrLadder} from '../../models/snake-or-ladder.model';
import {InvalidPlayerNameError, DuplicatePlayerNameError} from '../../models/player.model';
import {InvalidPlayerCountError} from '../../models/game-state.model';
import {Team, AVAILABLE_COLORS, createTeams, InvalidTeamCountError} from '../../models/team.model';
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
    private _mapType: MapType = DEFAULT_MAP_TYPE;
    
    get mapType(): MapType {
        return this._mapType;
    }
    
    set mapType(value: MapType) {
        if (this._mapType !== value) {
            this._mapType = value;
            // Reset preview when map type changes
            this.previewSnakesAndLadders = [];
        }
    }

    // Map preview modal
    showMapPreview: boolean = false;
    previewBoardLayout: BoardCell[] = [];
    previewSnakesAndLadders: SnakeOrLadder[] = [];
    previewBoardRows: BoardCell[][] = [];

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
        // Reset preview map when going back
        this.previewSnakesAndLadders = [];
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
            // Use previewed map if available, otherwise generate new one
            let snakesAndLadders: SnakeOrLadder[];
            if (this.mapType === 'fixed') {
              snakesAndLadders = [...FIXED_MAP_CONFIG];
            } else {
              // Use previewed random map if available, otherwise generate new
              snakesAndLadders = this.previewSnakesAndLadders.length > 0 
                ? [...this.previewSnakesAndLadders]
                : generateSnakesAndLadders();
            }

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

    // ============ Map Preview Methods ============

    /**
     * Open map preview modal
     */
    openMapPreview(): void {
        // Generate board layout
        this.previewBoardLayout = generateBoardLayout();
        this.previewBoardRows = this.getPreviewBoardRows();
        
        // Generate snakes and ladders based on map type
        if (this.mapType === 'fixed') {
            this.previewSnakesAndLadders = [...FIXED_MAP_CONFIG];
        } else {
            this.previewSnakesAndLadders = generateSnakesAndLadders();
        }
        
        this.showMapPreview = true;
    }

    /**
     * Close map preview modal
     */
    closeMapPreview(): void {
        this.showMapPreview = false;
    }

    /**
     * Regenerate random map for preview
     */
    regenerateRandomMap(): void {
        if (this.mapType === 'random') {
            this.previewSnakesAndLadders = generateSnakesAndLadders();
        }
    }

    /**
     * Get board rows for preview display
     */
    getPreviewBoardRows(): BoardCell[][] {
        const rows: BoardCell[][] = [];
        for (let y = 9; y >= 0; y--) {
            const rowCells = this.previewBoardLayout
                .filter(cell => cell.y === y)
                .sort((a, b) => a.x - b.x);
            rows.push(rowCells);
        }
        return rows;
    }

    /**
     * Get cell color for preview
     */
    getPreviewCellColor(cell: BoardCell): string {
        const isEven = (cell.x + cell.y) % 2 === 0;
        return isEven ? '#f0e6d2' : '#d4c4a8';
    }

    /**
     * Get cell position for preview
     */
    getPreviewCellPosition(cellNumber: number): { x: number; y: number } | null {
        const cell = this.previewBoardLayout.find(c => c.number === cellNumber);
        return cell ? { x: cell.x, y: cell.y } : null;
    }

    /**
     * Get SVG path for snake or ladder in preview
     */
    getPreviewPath(element: SnakeOrLadder): string {
        const startPos = this.getPreviewCellPosition(element.startPosition);
        const endPos = this.getPreviewCellPosition(element.endPosition);
        
        if (!startPos || !endPos) return '';
        
        const startX = (startPos.x + 0.5) * 10;
        const startY = (9 - startPos.y + 0.5) * 10;
        const endX = (endPos.x + 0.5) * 10;
        const endY = (9 - endPos.y + 0.5) * 10;
        
        if (element.type === 'ladder') {
            return `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
            const hashCode = element.id.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            const normalizedHash = (hashCode % 100) / 100;
            const controlX = (startX + endX) / 2 + (normalizedHash - 0.5) * 10;
            const controlY = (startY + endY) / 2 + ((hashCode % 50) / 50 - 0.5) * 10;
            return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
        }
    }

    /**
     * Get ladder count for preview legend
     */
    getPreviewLadderCount(): number {
        return this.previewSnakesAndLadders.filter(e => e.type === 'ladder').length;
    }

    /**
     * Get snake count for preview legend
     */
    getPreviewSnakeCount(): number {
        return this.previewSnakesAndLadders.filter(e => e.type === 'snake').length;
    }
}
