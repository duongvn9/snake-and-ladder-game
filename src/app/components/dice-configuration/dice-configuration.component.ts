import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dice-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dice-configuration.component.html',
  styleUrl: './dice-configuration.component.scss'
})
export class DiceConfigurationComponent implements OnInit, OnDestroy {
  maxPoints: number = 12; // Default value
  currentMaxPoints: number = 12;
  isRolling: boolean = false;
  validationError: string = '';
  successMessage: string = '';
  
  private stateSubscription?: Subscription;
  private messageTimeout?: any;

  constructor(
    private gameService: GameService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to game state to get current dice configuration
    this.stateSubscription = this.gameService.state$.subscribe(state => {
      if (state) {
        this.currentMaxPoints = state.diceConfig.maxPoints;
        // Initialize input with current value if not modified
        if (this.maxPoints === 12 || this.maxPoints === this.currentMaxPoints) {
          this.maxPoints = this.currentMaxPoints;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
  }

  /**
   * Validate if the current configuration is valid
   * @returns true if valid, false otherwise
   */
  isValidConfig(): boolean {
    // Clear previous validation error
    this.validationError = '';

    // Check if maxPoints is a valid number
    if (!this.maxPoints || isNaN(this.maxPoints)) {
      this.validationError = 'Vui lòng nhập số điểm hợp lệ';
      return false;
    }

    // Check if maxPoints is an integer
    if (!Number.isInteger(this.maxPoints)) {
      this.validationError = 'Số điểm phải là số nguyên';
      return false;
    }

    // Check if maxPoints is at least 1
    if (this.maxPoints < 1) {
      this.validationError = 'Số điểm phải lớn hơn hoặc bằng 1';
      return false;
    }

    // Check if value is different from current
    if (this.maxPoints === this.currentMaxPoints) {
      this.validationError = 'Giá trị mới phải khác giá trị hiện tại';
      return false;
    }

    return true;
  }

  /**
   * Apply the new dice configuration
   */
  applyConfig(): void {
    // Clear previous messages
    this.validationError = '';
    this.successMessage = '';

    // Validate configuration
    if (!this.isValidConfig()) {
      return;
    }

    try {
      // Update dice configuration in game service
      this.gameService.updateDiceConfig(this.maxPoints);
      
      // Show success notification
      this.notificationService.success(`Xúc xắc đã được cấu hình: 1-${this.maxPoints}`);
      
      // Also show inline success message
      this.successMessage = `Cấu hình đã được áp dụng! Xúc xắc sẽ có giá trị 1-${this.maxPoints} cho lượt tung tiếp theo.`;
      
      // Clear success message after 5 seconds
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout);
      }
      this.messageTimeout = setTimeout(() => {
        this.successMessage = '';
      }, 5000);

    } catch (error) {
      // Show error notification and inline message
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật cấu hình';
      this.notificationService.error(errorMessage);
      this.validationError = errorMessage;
    }
  }

  /**
   * Set isRolling state (to be called from parent component during dice roll)
   * @param rolling - Whether dice is currently rolling
   */
  setRollingState(rolling: boolean): void {
    this.isRolling = rolling;
  }
}
