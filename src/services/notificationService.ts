
import type { Reminder } from '../types';

class NotificationService {
  private notifiedReminderIds = new Set<string>();
  private inFlightReminderIds = new Set<string>();

  private serviceWorkerPromise: Promise<ServiceWorkerRegistration | null>;

  private readonly storageKey = 'smriti_notified_reminders_v1';

  constructor() {
    this.loadNotifiedIds();
    this.serviceWorkerPromise = this.initServiceWorker();
  }

  private loadNotifiedIds(): void {
    try {
      const saved = sessionStorage.getItem(this.storageKey);

      if (saved) {
        const ids: unknown = JSON.parse(saved);

        if (Array.isArray(ids)) {
          ids.forEach((id) => {
            if (typeof id === 'string') {
              this.notifiedReminderIds.add(id);
            }
          });
        }
      }
    } catch {
      // Continue without persisted notification history.
    }
  }

  private persistNotifiedIds(): void {
    try {
      sessionStorage.setItem(
        this.storageKey,
        JSON.stringify([...this.notifiedReminderIds])
      );
    } catch {
      // In-memory tracking remains available.
    }
  }

  private async initServiceWorker():
    Promise<ServiceWorkerRegistration | null> {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return null;
    }

    try {
      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.warn('Service worker registration failed:', error);
      return null;
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window
    );
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission():
    Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.warn('Permission request failed:', error);
      return 'denied';
    }
  }

  public async sendNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Optional Capacitor support for a future Android build.
    const capacitor = (window as any).Capacitor;

    if (
      capacitor &&
      typeof capacitor.isNativePlatform === 'function' &&
      capacitor.isNativePlatform()
    ) {
      try {
        const localNotifications =
          capacitor?.Plugins?.LocalNotifications;

        if (localNotifications) {
          await localNotifications.schedule({
            notifications: [{
              id: Math.floor(Math.random() * 2_000_000_000) + 1,
              title,
              body: options?.body || '',
              schedule: {
                at: new Date(Date.now() + 1000)
              }
            }]
          });

          return true;
        }
      } catch (error) {
        console.warn('Native notification failed:', error);
      }
    }

    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    
try {
  const registration = await this.serviceWorkerPromise;

  if (registration) {
    try {
      await registration.showNotification(title, {
        ...options,
        icon: options?.icon || '/favicon.ico',
        badge: options?.badge || '/favicon.ico',
      });

      return true;
    } catch (error) {
      console.warn(
        'Service worker notification failed; trying browser notification:',
        error
      );
    }
  }

  new Notification(title, {
    ...options,
    icon: options?.icon || '/favicon.ico',
  });

  return true;
} catch (error) {
  console.error('Desktop notification failed:', error);
  return false;
}

  }

  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  public checkDueReminders(reminders: Reminder[]): Reminder[] {
    if (
      !this.isSupported() ||
      Notification.permission !== 'granted'
    ) {
      return [];
    }

    const now = new Date();
    const today = this.getLocalDateString(now);

    const currentTime =
      `${String(now.getHours()).padStart(2, '0')}:` +
      `${String(now.getMinutes()).padStart(2, '0')}`;

    const newlyDue: Reminder[] = [];

    for (const reminder of reminders) {
      if (reminder.status === 'completed') continue;

      const dateIsDue = reminder.date <= today;

      const timeIsDue =
        !reminder.time ||
        reminder.date < today ||
        reminder.time <= currentTime;

      if (!dateIsDue || !timeIsDue) continue;

      // A changed date or time creates a new notification identity.
      const notificationId =
        `${reminder.id}:${reminder.date}:${reminder.time || 'anytime'}`;

      if (
        this.notifiedReminderIds.has(notificationId) ||
        this.inFlightReminderIds.has(notificationId)
      ) {
        continue;
      }

      this.inFlightReminderIds.add(notificationId);
      newlyDue.push(reminder);

      const body =
        reminder.description ||
        `Due ${reminder.date}` +
          (reminder.time ? ` at ${reminder.time}` : '');

      void this.sendNotification(`Reminder: ${reminder.title}`, {
        body,
        tag: `reminder-${reminder.id}`
      })
        .then((sent) => {
          // Record only successful notification attempts.
          if (sent) {
            this.notifiedReminderIds.add(notificationId);
            this.persistNotifiedIds();
          }
        })
        .finally(() => {
          this.inFlightReminderIds.delete(notificationId);
        });
    }

    return newlyDue;
  }
}

export const notificationService = new NotificationService();
