import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification, NotificationType } from '../../services/notification.service';

/**
 * NotificationContainerComponent displays toast/snackbar notifications
 * Features:
 * - Positioned at top-right of the screen
 * - Supports success, info, warning, error types with different colors
 * - Auto-dismiss with animation
 * - Click to dismiss
 * - Queue multiple notifications
 */
@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container" aria-live="polite" aria-atomic="true">
      @for (notification of notifications; track notification.id) {
        <div 
          class="notification"
          [class]="'notification notification-' + notification.type"
          [attr.role]="notification.type === 'error' ? 'alert' : 'status'"
          (click)="dismiss(notification.id)"
          (keydown.enter)="dismiss(notification.id)"
          (keydown.space)="dismiss(notification.id)"
          tabindex="0">
          <div class="notification-icon">
            {{ getIcon(notification.type) }}
          </div>
          <div class="notification-content">
            <span class="notification-message">{{ notification.message }}</span>
          </div>
          <button 
            class="notification-close" 
            (click)="dismiss(notification.id); $event.stopPropagation()"
            aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
      pointer-events: none;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      pointer-events: auto;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      transition: transform 0.2s ease, opacity 0.2s ease;
      min-width: 280px;
    }

    .notification:hover {
      transform: translateX(-4px);
    }

    .notification-success {
      border-left: 4px solid #48bb78;
      background: linear-gradient(to right, #f0fff4, white);
    }

    .notification-info {
      border-left: 4px solid #4299e1;
      background: linear-gradient(to right, #ebf8ff, white);
    }

    .notification-warning {
      border-left: 4px solid #ed8936;
      background: linear-gradient(to right, #fffaf0, white);
    }

    .notification-error {
      border-left: 4px solid #f56565;
      background: linear-gradient(to right, #fff5f5, white);
    }

    .notification-icon {
      font-size: 1.25rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .notification-success .notification-icon {
      color: #48bb78;
    }

    .notification-info .notification-icon {
      color: #4299e1;
    }

    .notification-warning .notification-icon {
      color: #ed8936;
    }

    .notification-error .notification-icon {
      color: #f56565;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-message {
      font-size: 0.9rem;
      color: #2d3748;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .notification-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #a0aec0;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      flex-shrink: 0;
      transition: color 0.2s ease;
    }

    .notification-close:hover {
      color: #4a5568;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .notification-container {
        top: 8px;
        right: 8px;
        left: 8px;
        max-width: none;
      }

      .notification {
        min-width: auto;
      }
    }
  `]
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  getIcon(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'info':
        return 'ℹ';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  }
}
