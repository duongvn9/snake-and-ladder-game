import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ErrorBoundaryComponent displays a fallback UI when errors occur
 * Features:
 * - Shows error message with icon
 * - Provides retry and reset options
 * - Accessible with proper ARIA attributes
 */
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-boundary" role="alert" aria-live="assertive">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">{{ title }}</h2>
        <p class="error-message">{{ message }}</p>
        
        @if (showDetails && details) {
          <details class="error-details">
            <summary>Chi tiết lỗi</summary>
            <pre>{{ details }}</pre>
          </details>
        }
        
        <div class="error-actions">
          @if (showRetry) {
            <button class="btn btn-primary" (click)="onRetry()">
              🔄 Thử lại
            </button>
          }
          @if (showReset) {
            <button class="btn btn-secondary" (click)="onReset()">
              🏠 Về trang chủ
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-boundary {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      padding: 2rem;
      background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
      border-radius: 12px;
      border: 2px solid #fc8181;
    }

    .error-content {
      text-align: center;
      max-width: 500px;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      animation: shake 0.5s ease-in-out;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #c53030;
      margin: 0 0 0.75rem 0;
    }

    .error-message {
      font-size: 1rem;
      color: #742a2a;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .error-details {
      text-align: left;
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 8px;
      padding: 0.75rem;

      summary {
        cursor: pointer;
        font-weight: 500;
        color: #742a2a;
        padding: 0.5rem;
      }

      pre {
        margin: 0.5rem 0 0 0;
        padding: 0.75rem;
        background: #2d3748;
        color: #e2e8f0;
        border-radius: 4px;
        font-size: 0.8rem;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    @media (max-width: 480px) {
      .error-boundary {
        padding: 1.5rem;
        min-height: 250px;
      }

      .error-icon {
        font-size: 3rem;
      }

      .error-title {
        font-size: 1.25rem;
      }

      .error-message {
        font-size: 0.9rem;
      }

      .error-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ErrorBoundaryComponent {
  @Input() title = 'Đã xảy ra lỗi';
  @Input() message = 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại.';
  @Input() details?: string;
  @Input() showDetails = false;
  @Input() showRetry = true;
  @Input() showReset = true;

  @Output() retry = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }

  onReset(): void {
    this.reset.emit();
  }
}
