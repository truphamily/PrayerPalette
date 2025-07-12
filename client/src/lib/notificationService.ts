import type { UserReminderSettings } from "@shared/schema";

export class NotificationService {
  private static instance: NotificationService;
  private intervalIds: NodeJS.Timeout[] = [];
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return "denied";
    }

    return await Notification.requestPermission();
  }

  private showNotification(title: string, options?: NotificationOptions) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const notification = new Notification(title, {
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      ...options,
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    // Focus app when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  private createReminderNotification() {
    const messages = [
      "Time for prayer! 🙏",
      "Take a moment to connect with God",
      "Your prayer time is here",
      "Remember to pray today",
      "God is waiting to hear from you",
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    this.showNotification("Prayer Reminder", {
      body: randomMessage,
      tag: "prayer-reminder",
      requireInteraction: false,
    });
  }

  private calculateNextReminderTime(timeString: string, timezone?: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    
    // Use timezone if provided, otherwise use local timezone
    const targetTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get current time in the target timezone
    const now = new Date();
    const todayInTargetTz = new Date().toLocaleDateString('en-CA', { timeZone: targetTimezone });
    
    // Create reminder time for today in target timezone
    const reminderTimeStr = `${todayInTargetTz}T${timeString}:00`;
    
    // Convert to local time by creating date and adjusting for timezone difference
    let reminderTime = new Date(reminderTimeStr);
    
    // Adjust for timezone difference
    if (timezone) {
      const localTime = new Date().toLocaleString('sv-SE', { timeZone: timezone });
      const utcTime = new Date().toLocaleString('sv-SE', { timeZone: 'UTC' });
      const timezoneOffsetMs = new Date(localTime).getTime() - new Date(utcTime).getTime();
      reminderTime = new Date(reminderTime.getTime() - timezoneOffsetMs + new Date().getTimezoneOffset() * 60000);
    }

    // If the time has already passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    return reminderTime;
  }

  private scheduleReminder(timeString: string, timezone?: string) {
    const nextReminderTime = this.calculateNextReminderTime(timeString, timezone);
    const now = new Date();
    const msUntilReminder = nextReminderTime.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      this.createReminderNotification();
      // Schedule the next occurrence (24 hours later)
      this.scheduleReminder(timeString, timezone);
    }, msUntilReminder);

    this.intervalIds.push(timeoutId as any);
  }

  initialize(settings: UserReminderSettings) {
    this.clearAllReminders();

    if (!settings.enableReminders || !settings.reminderTimes?.length) {
      return;
    }

    // Request permission if needed and enabled
    if (settings.enableBrowserNotifications) {
      this.requestPermission();
    }

    // Schedule all reminder times
    settings.reminderTimes.forEach(timeString => {
      this.scheduleReminder(timeString, settings.timezone);
    });

    this.isInitialized = true;
    console.log(`Scheduled ${settings.reminderTimes.length} prayer reminders`);
  }

  clearAllReminders() {
    this.intervalIds.forEach(id => clearTimeout(id));
    this.intervalIds = [];
    this.isInitialized = false;
  }

  updateSettings(settings: UserReminderSettings) {
    this.initialize(settings);
  }

  isSupported(): boolean {
    return "Notification" in window;
  }

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  // Test notification (useful for settings)
  testNotification() {
    if (this.getPermissionStatus() === "granted") {
      this.showNotification("Test Notification", {
        body: "Prayer reminders are working correctly!",
        tag: "test-notification",
      });
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Initialize service when settings are available
export function initializeNotifications(settings: UserReminderSettings) {
  notificationService.initialize(settings);
}