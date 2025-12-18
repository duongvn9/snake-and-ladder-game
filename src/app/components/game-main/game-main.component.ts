import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { StorageService, CorruptedStateError } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';
import { GameState } from '../../models/game-state.model';
import { Player } from '../../models/player.model';
import { DiceRollerListComponent } from '../dice-roller-list/dice-roller-list.component';
import { BoardComponent } from '../board/board.component';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import { DiceDisplayComponent } from '../dice-display/dice-display.component';
import { ErrorBoundaryComponent } from '../error-boundary/error-boundary.component';

@Component({
  selector: 'app-game-main',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DiceRollerListComponent,
    BoardComponent,
    LeaderboardComponent,
    DiceDisplayComponent,
    ErrorBoundaryComponent
  ],
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss']
})
export class GameMainComponent implements OnInit, OnDestroy {
  @ViewChild(BoardComponent) boardComponent!: BoardComponent;

  gameState: GameState | null = null;
  currentRoller: Player | null = null;
  selectedTarget: Player | null = null;
  
  // Loading and error states
  isLoading = true;
  hasError = false;
  errorMessage = '';
  errorDetails = '';
  
  isRolling = false;
  showDiceAnimation = false;
  lastDiceResult: number | null = null;
  showDiceResult = false;
  
  showResetConfirmation = false;
  isGameFinished = false;

  // Dice Configuration Modal state
  showConfigModal = false;
  configMaxPoints: number = 6;
  currentMaxPoints: number = 6;
  pendingMaxPoints: number | null = null;
  currentRound: number = 1;
  configValidationError: string = '';
  configSuccessMessage: string = '';
  private configMessageTimeout?: ReturnType<typeof setTimeout>;

  // Ladder Choice Modal state (Requirements 12.2)
  showLadderChoiceModal = false;
  currentLadder: { startPosition: number; endPosition: number } | null = null;
  private ladderChoiceResolver: ((climbLadder: boolean) => void) | null = null;
  ladderChoicePlayerName: string = '';
  
  // Timer states
  ladderCountdown: number = 0;
  diceRollCountdown: number = 0;
  diceRollTimeExpired: boolean = false; // Flag to show "Hết giờ" message
  private ladderTimerInterval?: ReturnType<typeof setInterval>;
  private diceRollTimerInterval?: ReturnType<typeof setInterval>;
  private readonly LADDER_CHOICE_TIMEOUT = 5; // 5 seconds for ladder choice
  private readonly DICE_ROLL_TIMEOUT = 15; // 15 seconds for dice roll

  // Finish Modal state
  showFinishModal = false;
  finishPlayerName: string = '';
  finishPlayerRank: number = 0;
  finishIsSpecialWin: boolean = false;
  private finishModalTimeout?: ReturnType<typeof setTimeout>;

  private stateSubscription?: Subscription;

  constructor(
    private gameService: GameService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private router: Router
  ) {}


  ngOnInit(): void {
    // Subscribe to game state changes
    this.stateSubscription = this.gameService.state$.subscribe(state => {
      this.gameState = state;
      if (state) {
        this.updateFromState(state);
      }
    });

    // Try to restore game state from localStorage
    this.restoreGameState();
  }

  /**
   * Restore game state from localStorage
   * Handles CorruptedStateError by clearing state and redirecting to setup
   * Redirects to setup if no state exists
   */
  private async restoreGameState(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Small delay to show loading state (improves perceived performance)
      await this.delay(300);
      
      const savedState = this.storageService.loadGameState();
      
      if (savedState) {
        // State exists and is valid - restore it
        // Reset selectedTargetId to null on page load for fresh target selection
        const restoredState: GameState = {
          ...savedState,
          selectedTargetId: null,
          lastUpdatedAt: new Date()
        };
        this.gameService.setState(restoredState);
        this.isLoading = false;
      } else {
        // No state exists - redirect to setup
        this.router.navigate(['/setup']);
      }
    } catch (error) {
      this.isLoading = false;
      
      if (error instanceof CorruptedStateError) {
        // Handle corrupted state - show error boundary
        console.error('Game state is corrupted:', error.message);
        this.hasError = true;
        this.errorMessage = 'Dữ liệu game bị hỏng và không thể khôi phục.';
        this.errorDetails = error.message;
        this.notificationService.error('Dữ liệu game bị lỗi.');
      } else {
        // Handle other unexpected errors
        console.error('Unexpected error restoring game state:', error);
        this.hasError = true;
        this.errorMessage = 'Có lỗi không mong muốn xảy ra khi tải game.';
        this.errorDetails = error instanceof Error ? error.message : String(error);
        this.notificationService.error('Có lỗi xảy ra.');
      }
    }
  }

  /**
   * Handle retry from error boundary
   */
  onErrorRetry(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.errorDetails = '';
    this.restoreGameState();
  }

  /**
   * Handle reset from error boundary
   */
  onErrorReset(): void {
    this.storageService.clearGameState();
    this.gameService.reset();
    this.router.navigate(['/setup']);
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
    this.clearLadderTimer();
    this.clearDiceRollTimer();
  }

  /**
   * Clear ladder choice timer
   */
  private clearLadderTimer(): void {
    if (this.ladderTimerInterval) {
      clearInterval(this.ladderTimerInterval);
      this.ladderTimerInterval = undefined;
    }
    this.ladderCountdown = 0;
  }

  /**
   * Clear dice roll timer
   */
  private clearDiceRollTimer(): void {
    if (this.diceRollTimerInterval) {
      clearInterval(this.diceRollTimerInterval);
      this.diceRollTimerInterval = undefined;
    }
    this.diceRollCountdown = 0;
    this.diceRollTimeExpired = false;
  }

  /**
   * Start ladder choice countdown timer (5 seconds)
   * Auto-climbs ladder when time runs out
   */
  private startLadderTimer(): void {
    this.clearLadderTimer();
    this.ladderCountdown = this.LADDER_CHOICE_TIMEOUT;
    
    this.ladderTimerInterval = setInterval(() => {
      this.ladderCountdown--;
      if (this.ladderCountdown <= 0) {
        this.clearLadderTimer();
        // Auto accept ladder when time runs out
        if (this.ladderChoiceResolver) {
          this.ladderChoiceResolver(true);
        }
      }
    }, 1000);
  }

  /**
   * Start dice roll countdown timer (10 seconds)
   * Shows "Hết giờ" message with blinking clock when time runs out (no auto-roll)
   */
  private startDiceRollTimer(): void {
    this.clearDiceRollTimer();
    this.diceRollCountdown = this.DICE_ROLL_TIMEOUT;
    this.diceRollTimeExpired = false;
    
    this.diceRollTimerInterval = setInterval(() => {
      this.diceRollCountdown--;
      if (this.diceRollCountdown <= 0) {
        // Stop timer and show "Hết giờ" message (no restart)
        if (this.diceRollTimerInterval) {
          clearInterval(this.diceRollTimerInterval);
          this.diceRollTimerInterval = undefined;
        }
        this.diceRollTimeExpired = true;
      }
    }, 1000);
  }

  private updateFromState(state: GameState): void {
    const previousSelectedTarget = this.selectedTarget;
    
    this.currentRoller = state.players.find(p => p.id === state.currentDiceRollerId) || null;
    this.selectedTarget = state.selectedTargetId 
      ? state.players.find(p => p.id === state.selectedTargetId) || null 
      : null;
    this.lastDiceResult = state.lastDiceResult;
    this.isGameFinished = state.isGameFinished;
    
    // Update dice configuration modal state
    this.currentMaxPoints = state.diceConfig.maxPoints;
    this.pendingMaxPoints = state.diceConfig.pendingMaxPoints ?? null;
    this.currentRound = state.currentRound ?? 1;
    
    // Initialize configMaxPoints if not modified
    if (this.configMaxPoints === 6 || this.configMaxPoints === this.currentMaxPoints) {
      this.configMaxPoints = this.currentMaxPoints;
    }
    
    // Start dice roll timer when target is auto-selected and game is active
    if (!previousSelectedTarget && this.selectedTarget && 
        !this.isRolling && !this.isGameFinished && 
        this.diceRollCountdown === 0 && state.isGameStarted) {
      this.startDiceRollTimer();
    }
  }

  get canRollDice(): boolean {
    return !this.isRolling && 
           this.selectedTarget !== null && 
           !this.isGameFinished &&
           this.gameState?.isGameStarted === true;
  }

  async onRollDice(): Promise<void> {
    if (!this.canRollDice || !this.selectedTarget || !this.gameState) {
      return;
    }

    // Clear dice roll timer when rolling starts
    this.clearDiceRollTimer();
    
    this.isRolling = true;
    this.showDiceResult = false;

    try {
      this.showDiceAnimation = true;
      await this.delay(1000);
      
      const diceResult = this.gameService.rollDice();
      this.lastDiceResult = diceResult;
      
      this.showDiceAnimation = false;
      this.showDiceResult = true;
      
      this.updateLastDiceResult(diceResult);
      
      const targetPlayer = this.selectedTarget;
      const fromPosition = targetPlayer.position;
      const toPosition = Math.min(fromPosition + diceResult, 100);
      
      // Show dice roll notification
      this.notificationService.info(`${targetPlayer.name} tung được ${diceResult}`);
      
      // Check if position + diceResult > 100 (overshoot)
      if (fromPosition + diceResult > 100) {
        // Show overshoot notification (Requirements 11.1, 11.2)
        this.notificationService.warning(
          `${targetPlayer.name} vượt quá 100 điểm! Cần đúng ${100 - fromPosition} để về đích. Đứng yên tại ô ${fromPosition}.`,
          5000
        );
        // Player position remains unchanged (Requirements 11.3)
        // Still show token at current position after dice roll
        this.gameService.setShowTokenForPlayer(targetPlayer.id);
      } else if (toPosition !== fromPosition) {
        this.gameService.movePlayer(targetPlayer.id, diceResult);
        
        if (this.boardComponent) {
          await this.boardComponent.animateTokenMovement(
            { id: targetPlayer.id, name: targetPlayer.name, color: targetPlayer.color },
            fromPosition,
            toPosition
          );
        }
        
        const special = this.gameService.checkSnakeOrLadder(toPosition);
        if (special) {
          if (special.type === 'snake') {
            // Show snake notification BEFORE sliding (Requirements 12.1)
            this.notificationService.warning(
              `🐍 ${targetPlayer.name} đứng vào ô đầu rắn! Sẽ bị trượt từ ô ${special.startPosition} xuống ô ${special.endPosition}`,
              4000
            );
            
            // Apply the snake move
            this.gameService.applySpecialMove(targetPlayer.id, special);
            
            // Animate the snake slide
            if (this.boardComponent) {
              await this.boardComponent.animateSpecialMove(
                { id: targetPlayer.id, name: targetPlayer.name, color: targetPlayer.color },
                special
              );
            }
          } else {
            // Ladder - will be handled by ladder choice modal (Requirements 12.2)
            await this.handleLadderChoice(targetPlayer, special);
          }
        }
        
        // Show token at final position after animation ends (Requirements 7.1)
        this.gameService.setShowTokenForPlayer(targetPlayer.id);
        
        if (this.gameService.checkWinCondition(targetPlayer.id)) {
          this.gameService.markPlayerFinished(targetPlayer.id);
          
          // Calculate rank for the finished player
          const currentState = this.gameService.getCurrentState();
          const finishedPlayers = currentState?.players.filter(p => p.isFinished) || [];
          const rank = finishedPlayers.length;
          
          // Check if this is a winning position (Requirements 13.6)
          const winningPositions = currentState?.winningPositions || [16];
          const isWinningPosition = winningPositions.includes(rank);
          
          // Show finish modal
          await this.showFinishCelebration(targetPlayer.name, rank, isWinningPosition);
          
          if (this.gameService.checkGameEnd()) {
            this.isGameFinished = true;
          }
        }
      }
      
      const finalState = this.gameService.getCurrentState();
      if (finalState) {
        this.storageService.saveGameState(finalState);
      }
      
      this.gameService.nextTurn();
      
      const stateAfterTurn = this.gameService.getCurrentState();
      if (stateAfterTurn) {
        this.storageService.saveGameState(stateAfterTurn);
      }
      
      // Start dice roll timer for next turn (10 seconds countdown)
      if (!this.isGameFinished) {
        this.startDiceRollTimer();
      }
      
    } catch (error) {
      console.error('Error during dice roll:', error);
      this.notificationService.error('Có lỗi xảy ra khi tung xúc xắc');
    } finally {
      this.isRolling = false;
      this.showDiceAnimation = false;
    }
  }

  private updateLastDiceResult(result: number): void {
    const state = this.gameService.getCurrentState();
    if (state) {
      this.gameService.setState({
        ...state,
        lastDiceResult: result,
        lastUpdatedAt: new Date()
      });
    }
  }

  onTargetSelected(targetId: string): void {
    // Target selection is now handled by the LeaderboardComponent
    if (targetId && this.gameState) {
      // Show token at the selected target's position (Requirements 7.2)
      this.gameService.setShowTokenForPlayer(targetId);
      
      this.gameService.setSelectedTarget(targetId);
      const state = this.gameService.getCurrentState();
      if (state) {
        this.storageService.saveGameState(state);
      }
    }
  }

  showResetDialog(): void {
    this.showResetConfirmation = true;
  }

  cancelReset(): void {
    this.showResetConfirmation = false;
  }

  confirmReset(): void {
    this.storageService.clearGameState();
    this.gameService.reset();
    this.showResetConfirmation = false;
    this.router.navigate(['/setup']);
  }

  /**
   * Handle ladder choice when player lands on ladder bottom (Requirements 12.2, 12.3, 12.4)
   * Shows modal and waits for user choice with 5s countdown
   */
  private async handleLadderChoice(player: Player, ladder: { startPosition: number; endPosition: number; type: string; id: string }): Promise<void> {
    this.ladderChoicePlayerName = player.name;
    this.currentLadder = { startPosition: ladder.startPosition, endPosition: ladder.endPosition };
    this.showLadderChoiceModal = true;
    
    // Start 5 second countdown timer
    this.startLadderTimer();

    // Wait for user choice or timeout
    const climbLadder = await new Promise<boolean>((resolve) => {
      this.ladderChoiceResolver = resolve;
    });

    this.showLadderChoiceModal = false;
    this.currentLadder = null;
    this.ladderChoicePlayerName = '';
    this.ladderChoiceResolver = null;
    this.clearLadderTimer();

    if (climbLadder) {
      // User chose to climb (Requirements 12.3)
      this.notificationService.success(
        `🪜 ${player.name} chọn leo thang! Từ ô ${ladder.startPosition} lên ô ${ladder.endPosition}`,
        4000
      );
      
      // Apply the ladder move
      this.gameService.applySpecialMove(player.id, ladder as any);
      
      // Animate the ladder climb (Requirements 12.5)
      if (this.boardComponent) {
        await this.boardComponent.animateSpecialMove(
          { id: player.id, name: player.name, color: player.color },
          ladder as any
        );
      }
    } else {
      // User chose to stay (Requirements 12.4)
      this.notificationService.info(
        `${player.name} chọn ở lại tại ô ${ladder.startPosition}`,
        3000
      );
      // No animation needed when staying (Requirements 12.5)
    }
  }

  /**
   * Handle user accepting to climb the ladder
   */
  onAcceptLadder(): void {
    this.clearLadderTimer();
    if (this.ladderChoiceResolver) {
      this.ladderChoiceResolver(true);
    }
  }

  /**
   * Handle user declining to climb the ladder
   */
  onDeclineLadder(): void {
    this.clearLadderTimer();
    if (this.ladderChoiceResolver) {
      this.ladderChoiceResolver(false);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get diceAnimationPath(): string {
    return 'dice.gif';
  }

  get restartIconPath(): string {
    return 'restart.svg';
  }

  get dlLogoPath(): string {
    return 'DL-logo.svg';
  }

  openConfigModal(): void {
    this.showConfigModal = true;
    this.configValidationError = '';
    this.configSuccessMessage = '';
    // Reset to current value when opening modal
    this.configMaxPoints = this.currentMaxPoints;
  }

  closeConfigModal(): void {
    this.showConfigModal = false;
    this.configValidationError = '';
    this.configSuccessMessage = '';
    if (this.configMessageTimeout) {
      clearTimeout(this.configMessageTimeout);
    }
  }

  isValidModalConfig(): boolean {
    // Clear previous validation error
    this.configValidationError = '';

    // Check if maxPoints is a valid number
    if (!this.configMaxPoints || isNaN(this.configMaxPoints)) {
      this.configValidationError = 'Vui lòng nhập số điểm hợp lệ';
      return false;
    }

    // Check if maxPoints is an integer
    if (!Number.isInteger(this.configMaxPoints)) {
      this.configValidationError = 'Số điểm phải là số nguyên';
      return false;
    }

    // Check if maxPoints is at least 1
    if (this.configMaxPoints < 1) {
      this.configValidationError = 'Số điểm phải lớn hơn hoặc bằng 1';
      return false;
    }

    // Check if value is different from current and pending
    if (this.configMaxPoints === this.currentMaxPoints && this.pendingMaxPoints === null) {
      this.configValidationError = 'Giá trị mới phải khác giá trị hiện tại';
      return false;
    }

    if (this.pendingMaxPoints !== null && this.configMaxPoints === this.pendingMaxPoints) {
      this.configValidationError = 'Giá trị mới phải khác giá trị đang chờ áp dụng';
      return false;
    }

    return true;
  }

  applyConfigFromModal(): void {
    // Clear previous messages
    this.configValidationError = '';
    this.configSuccessMessage = '';

    // Validate configuration
    if (!this.isValidModalConfig()) {
      return;
    }

    try {
      // Update dice configuration with pending value for next round
      this.gameService.updateDiceConfigPending(this.configMaxPoints);
      
      // Show success notification
      this.notificationService.success(`Cấu hình xúc xắc 1-${this.configMaxPoints} sẽ áp dụng từ round ${this.currentRound + 1}`);
      
      // Also show inline success message
      this.configSuccessMessage = `Cấu hình sẽ áp dụng từ round ${this.currentRound + 1}!`;
      
      // Clear success message after 5 seconds
      if (this.configMessageTimeout) {
        clearTimeout(this.configMessageTimeout);
      }
      this.configMessageTimeout = setTimeout(() => {
        this.configSuccessMessage = '';
      }, 5000);

      // Save state
      const state = this.gameService.getCurrentState();
      if (state) {
        this.storageService.saveGameState(state);
      }

    } catch (error) {
      // Show error notification and inline message
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật cấu hình';
      this.notificationService.error(errorMessage);
      this.configValidationError = errorMessage;
    }
  }

  /**
   * Apply dice configuration immediately for the next roll
   */
  applyConfigImmediate(): void {
    // Clear previous messages
    this.configValidationError = '';
    this.configSuccessMessage = '';

    // Validate configuration
    if (!this.isValidModalConfig()) {
      return;
    }

    try {
      // Update dice configuration immediately
      this.gameService.updateDiceConfig(this.configMaxPoints);
      
      // Show success notification
      this.notificationService.success(`Xúc xắc đã được cấu hình: 1-${this.configMaxPoints} (áp dụng ngay)`);
      
      // Also show inline success message
      this.configSuccessMessage = `Cấu hình đã áp dụng ngay! Xúc xắc: 1-${this.configMaxPoints}`;
      
      // Update local state
      this.currentMaxPoints = this.configMaxPoints;
      
      // Clear success message after 5 seconds
      if (this.configMessageTimeout) {
        clearTimeout(this.configMessageTimeout);
      }
      this.configMessageTimeout = setTimeout(() => {
        this.configSuccessMessage = '';
      }, 5000);

      // Save state
      const state = this.gameService.getCurrentState();
      if (state) {
        this.storageService.saveGameState(state);
      }

    } catch (error) {
      // Show error notification and inline message
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật cấu hình';
      this.notificationService.error(errorMessage);
      this.configValidationError = errorMessage;
    }
  }

  /**
   * Show finish celebration modal
   */
  private showFinishCelebration(playerName: string, rank: number, isSpecialWin: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.finishPlayerName = playerName;
      this.finishPlayerRank = rank;
      this.finishIsSpecialWin = isSpecialWin;
      this.showFinishModal = true;

      // Auto close after 4 seconds
      this.finishModalTimeout = setTimeout(() => {
        this.closeFinishModal();
        resolve();
      }, 4000);
    });
  }

  /**
   * Close finish modal
   */
  closeFinishModal(): void {
    this.showFinishModal = false;
    if (this.finishModalTimeout) {
      clearTimeout(this.finishModalTimeout);
    }
  }
}
