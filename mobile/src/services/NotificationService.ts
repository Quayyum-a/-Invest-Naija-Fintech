import messaging from "@react-native-firebase/messaging";
import PushNotification from "react-native-push-notification";
import { Platform, PermissionsAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocalNotification {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  vibrate?: boolean;
}

class NotificationServiceClass {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure local notifications
      PushNotification.configure({
        onRegister: (token) => {
          console.log("Local notification token:", token);
        },
        onNotification: (notification) => {
          console.log("Local notification received:", notification);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: Platform.OS === "ios",
      });

      // Create notification channels for Android
      if (Platform.OS === "android") {
        PushNotification.createChannel(
          {
            channelId: "investnaija-default",
            channelName: "InvestNaija Notifications",
            channelDescription: "Default notifications for InvestNaija app",
            soundName: "default",
            importance: 4,
            vibrate: true,
          },
          (created) => console.log("Notification channel created:", created),
        );

        PushNotification.createChannel(
          {
            channelId: "investnaija-transactions",
            channelName: "Transaction Alerts",
            channelDescription: "Transaction-related notifications",
            soundName: "default",
            importance: 4,
            vibrate: true,
          },
          (created) => console.log("Transaction channel created:", created),
        );

        PushNotification.createChannel(
          {
            channelId: "investnaija-security",
            channelName: "Security Alerts",
            channelDescription: "Security-related notifications",
            soundName: "default",
            importance: 5,
            vibrate: true,
          },
          (created) => console.log("Security channel created:", created),
        );
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Notification service initialization error:", error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
    } catch (error) {
      console.error("Permission request error:", error);
      return false;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn("Push notification permissions not granted");
        return null;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      console.log("FCM Token:", fcmToken);

      // Store token locally
      await AsyncStorage.setItem("fcm_token", fcmToken);

      // Listen for token refresh
      messaging().onTokenRefresh((token) => {
        console.log("FCM Token refreshed:", token);
        AsyncStorage.setItem("fcm_token", token);
        // Send updated token to your server
      });

      return fcmToken;
    } catch (error) {
      console.error("Push notification registration error:", error);
      return null;
    }
  }

  async unregisterFromPushNotifications(): Promise<void> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem("fcm_token");
    } catch (error) {
      console.error("Push notification unregistration error:", error);
    }
  }

  showLocalNotification(notification: LocalNotification): void {
    try {
      PushNotification.localNotification({
        title: notification.title,
        message: notification.body,
        playSound: true,
        soundName: notification.sound || "default",
        vibrate: notification.vibrate !== false,
        userInfo: notification.data || {},
        channelId: this.getChannelId(notification.data?.type),
      });
    } catch (error) {
      console.error("Local notification error:", error);
    }
  }

  scheduleNotification(notification: LocalNotification, date: Date): void {
    try {
      PushNotification.localNotificationSchedule({
        title: notification.title,
        message: notification.body,
        date,
        playSound: true,
        soundName: notification.sound || "default",
        vibrate: notification.vibrate !== false,
        userInfo: notification.data || {},
        channelId: this.getChannelId(notification.data?.type),
      });
    } catch (error) {
      console.error("Scheduled notification error:", error);
    }
  }

  cancelAllNotifications(): void {
    try {
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error("Cancel notifications error:", error);
    }
  }

  setBadgeNumber(number: number): void {
    try {
      if (Platform.OS === "ios") {
        PushNotification.setApplicationIconBadgeNumber(number);
      }
    } catch (error) {
      console.error("Set badge number error:", error);
    }
  }

  private getChannelId(type?: string): string {
    switch (type) {
      case "transaction":
        return "investnaija-transactions";
      case "security":
        return "investnaija-security";
      default:
        return "investnaija-default";
    }
  }

  // Predefined notification templates
  showTransactionNotification(
    amount: number,
    type: "credit" | "debit",
    description: string,
  ): void {
    const emoji = type === "credit" ? "💰" : "💸";
    this.showLocalNotification({
      title: `${emoji} Transaction Alert`,
      body: `${type === "credit" ? "Credit" : "Debit"} of ₦${amount.toLocaleString()} - ${description}`,
      data: { type: "transaction" },
    });
  }

  showSecurityNotification(message: string): void {
    this.showLocalNotification({
      title: "🔒 Security Alert",
      body: message,
      data: { type: "security" },
      vibrate: true,
    });
  }

  showInvestmentNotification(message: string): void {
    this.showLocalNotification({
      title: "📈 Investment Update",
      body: message,
      data: { type: "investment" },
    });
  }

  showPromotionNotification(title: string, message: string): void {
    this.showLocalNotification({
      title: `🎉 ${title}`,
      body: message,
      data: { type: "promotion" },
    });
  }
}

export const NotificationService = new NotificationServiceClass();
