import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DiceDisplay Component
 * 
 * Hiển thị kết quả xúc xắc với text display đồng nhất cho tất cả giá trị.
 * 
 * Usage:
 * ```html
 * <app-dice-display [value]="diceResult"></app-dice-display>
 * ```
 */
@Component({
  selector: 'app-dice-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dice-display dice-text">
      <div class="dice-number">{{ value }}</div>
    </div>
  `,
  styles: [`
    .dice-display {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
    }

    .dice-text {
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .dice-number {
      font-size: 32px;
      font-weight: bold;
      color: #333;
      user-select: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dice-display {
        width: 50px;
        height: 50px;
      }

      .dice-number {
        font-size: 26px;
      }
    }
  `]
})
export class DiceDisplayComponent {
  @Input() value: number = 1;
}
