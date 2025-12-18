import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Notification types supported by the notification service
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/**
 * Notification interface representing a single notification
 */
export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  createdAt: Date;
}

/**
 * Configuration options for showing a notification
 */
export interface NotificationOptions {
  type?: NotificationType;
  duration?: number; // in milliseconds
}

/**
 * NotificationService manages toast/snackbar notifications
 * Features:
 * - Support for success, info, warning, error types
 * - Auto-dismiss after configurable timeout (default 3s)
 * - Queue multiple notifications
 * - Position at top-right
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly DEFAULT_DURATION = 3000; // 3 seconds
  private readonly MAX_NOTIFICATIONS = 5; // Maximum visible notifications

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private timeoutMap = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {}

  /**
   * Show a notification with the given message and options
   * @param message - The message to display
   * @param options - Optional configuration (type, duration)
   * @returns The notification ID
   */
  show(message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      message,
      type: options.type || 'info',
      duration: options.duration || this.DEFAULT_DURATION,
      createdAt: new Date()
    };

    this.addNotification(notification);
    this.scheduleRemoval(notification);

    return notification.id;
  }

  /**
   * Show a success notification
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds
   */
  success(message: string, duration?: number): string {
    return this.show(message, { type: 'success', duration });
  }

  /**
   * Show an info notification
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds
   */
  info(message: string, duration?: number): string {
    return this.show(message, { type: 'info', duration });
  }

  /**
   * Show a warning notification
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds
   */
  warning(message: string, duration?: number): string {
    return this.show(message, { type: 'warning', duration });
  }

  /**
   * Show an error notification
   * @param message - The message to display
   * @param duration - Optional duration in milliseconds
   */
  error(message: string, duration?: number): string {
    return this.show(message, { type: 'error', duration: duration || 5000 }); // Errors stay longer
  }

  /**
   * Manually dismiss a notification by ID
   * @param id - The notification ID to dismiss
   */
  dismiss(id: string): void {
    this.removeNotification(id);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    // Clear all timeouts
    this.timeoutMap.forEach((timeout) => clearTimeout(timeout));
    this.timeoutMap.clear();
    
    // Clear all notifications
    this.notificationsSubject.next([]);
  }

  /**
   * Get current notifications
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  private addNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    
    // If we've reached max notifications, remove the oldest one
    let updated = [...current];
    if (updated.length >= this.MAX_NOTIFICATIONS) {
      const oldest = updated[0];
      this.clearTimeout(oldest.id);
      updated = updated.slice(1);
    }
    
    updated.push(notification);
    this.notificationsSubject.next(updated);
  }

  private removeNotification(id: string): void {
    this.clearTimeout(id);
    const current = this.notificationsSubject.value;
    const updated = current.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
  }

  private scheduleRemoval(notification: Notification): void {
    const timeout = setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration);
    
    this.timeoutMap.set(notification.id, timeout);
  }

  private clearTimeout(id: string): void {
    const timeout = this.timeoutMap.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutMap.delete(id);
    }
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
