import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationService } from "../services/NotificationService";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "transaction" | "security" | "promotion" | "system";
  data?: any;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  pushEnabled: boolean;

  // Actions
  initializeNotifications: () => Promise<void>;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setPushEnabled: (enabled: boolean) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      pushEnabled: false,

      initializeNotifications: async () => {
        try {
          // Request permissions
          const hasPermission = await NotificationService.requestPermissions();
          set({ pushEnabled: hasPermission });

          // Load notifications from server
          // In a real app, you'd fetch from your API
          const storedNotifications =
            await AsyncStorage.getItem("notifications");
          if (storedNotifications) {
            const notifications = JSON.parse(storedNotifications);
            const unreadCount = notifications.filter(
              (n: Notification) => !n.read,
            ).length;
            set({ notifications, unreadCount });
          }
        } catch (error) {
          console.error("Notification initialization error:", error);
        }
      },

      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        };

        const { notifications } = get();
        const updatedNotifications = [notification, ...notifications].slice(
          0,
          100,
        ); // Keep only last 100
        const unreadCount = updatedNotifications.filter((n) => !n.read).length;

        set({
          notifications: updatedNotifications,
          unreadCount,
        });

        // Save to AsyncStorage
        AsyncStorage.setItem(
          "notifications",
          JSON.stringify(updatedNotifications),
        );
      },

      markAsRead: (notificationId: string) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        );
        const unreadCount = updatedNotifications.filter((n) => !n.read).length;

        set({
          notifications: updatedNotifications,
          unreadCount,
        });

        // Save to AsyncStorage
        AsyncStorage.setItem(
          "notifications",
          JSON.stringify(updatedNotifications),
        );
      },

      markAllAsRead: () => {
        const { notifications } = get();
        const updatedNotifications = notifications.map((n) => ({
          ...n,
          read: true,
        }));

        set({
          notifications: updatedNotifications,
          unreadCount: 0,
        });

        // Save to AsyncStorage
        AsyncStorage.setItem(
          "notifications",
          JSON.stringify(updatedNotifications),
        );
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });

        // Clear from AsyncStorage
        AsyncStorage.removeItem("notifications");
      },

      setPushEnabled: async (enabled: boolean) => {
        try {
          if (enabled) {
            const hasPermission =
              await NotificationService.requestPermissions();
            if (hasPermission) {
              await NotificationService.registerForPushNotifications();
              set({ pushEnabled: true });
              await AsyncStorage.setItem("push_enabled", "true");
            }
          } else {
            await NotificationService.unregisterFromPushNotifications();
            set({ pushEnabled: false });
            await AsyncStorage.setItem("push_enabled", "false");
          }
        } catch (error) {
          console.error("Push notification setup error:", error);
        }
      },

      requestPermissions: async () => {
        try {
          const hasPermission = await NotificationService.requestPermissions();
          set({ pushEnabled: hasPermission });
          return hasPermission;
        } catch (error) {
          console.error("Permission request error:", error);
          return false;
        }
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        pushEnabled: state.pushEnabled,
      }),
    },
  ),
);
