import React, { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import messaging from "@react-native-firebase/messaging";
import { QueryClient, QueryClientProvider } from "react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";

// Stores
import { useAuthStore } from "./src/stores/authStore";
import { useNotificationStore } from "./src/stores/notificationStore";

// Screens
import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import BiometricSetupScreen from "./src/screens/auth/BiometricSetupScreen";

// Main App Screens
import DashboardScreen from "./src/screens/main/DashboardScreen";
import WalletScreen from "./src/screens/main/WalletScreen";
import TransactionsScreen from "./src/screens/main/TransactionsScreen";
import PortfolioScreen from "./src/screens/main/PortfolioScreen";
import ProfileScreen from "./src/screens/main/ProfileScreen";

// Transaction Screens
import SendMoneyScreen from "./src/screens/transactions/SendMoneyScreen";
import RequestMoneyScreen from "./src/screens/transactions/RequestMoneyScreen";
import BillPaymentScreen from "./src/screens/transactions/BillPaymentScreen";
import BuyAirtimeScreen from "./src/screens/transactions/BuyAirtimeScreen";

// Investment Screens
import InvestmentScreen from "./src/screens/investments/InvestmentScreen";
import CryptoScreen from "./src/screens/investments/CryptoScreen";
import LoansScreen from "./src/screens/loans/LoansScreen";

// Services
import { NotificationService } from "./src/services/NotificationService";
import { BiometricService } from "./src/services/BiometricService";
import { ApiService } from "./src/services/ApiService";

// Components
import { LoadingSpinner } from "./src/components/LoadingSpinner";
import { TabBarIcon } from "./src/components/TabBarIcon";

// Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  BiometricSetup: undefined;
  SendMoney: undefined;
  RequestMoney: undefined;
  BillPayment: undefined;
  BuyAirtime: undefined;
  Investment: undefined;
  Crypto: undefined;
  Loans: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Wallet: undefined;
  Transactions: undefined;
  Portfolio: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const queryClient = new QueryClient();

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            name={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          height: Platform.OS === "ios" ? 90 : 70,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ tabBarLabel: "Wallet" }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarLabel: "Activity" }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ tabBarLabel: "Invest" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isAuthenticated, initializeAuth, user } = useAuthStore();
  const { initializeNotifications } = useNotificationStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Request permissions
      await requestPermissions();

      // Initialize services
      await Promise.all([
        initializeAuth(),
        initializeNotifications(),
        NotificationService.initialize(),
        BiometricService.initialize(),
      ]);

      // Check if user has seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      setShowOnboarding(!hasSeenOnboarding);

      // Setup push notifications
      await setupPushNotifications();

      // Set device info for analytics
      const deviceId = await DeviceInfo.getUniqueId();
      const deviceInfo = {
        id: deviceId,
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
      };

      console.log("App initialized with device:", deviceInfo);
    } catch (error) {
      console.error("App initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.USE_BIOMETRIC,
          PermissionsAndroid.PERMISSIONS.USE_FINGERPRINT,
        ]);

        console.log("Permission grants:", grants);
      } catch (error) {
        console.error("Permission request error:", error);
      }
    }
  };

  const setupPushNotifications = async () => {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // Get FCM token
        const fcmToken = await messaging().getToken();
        console.log("FCM Token:", fcmToken);

        // Register token with backend
        if (user?.id && fcmToken) {
          await ApiService.registerDeviceToken(
            Platform.OS as "ios" | "android",
            fcmToken,
          );
        }

        // Handle background messages
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log("Message handled in the background!", remoteMessage);
        });

        // Handle foreground messages
        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
          console.log("Foreground message:", remoteMessage);

          // Show local notification
          NotificationService.showLocalNotification({
            title: remoteMessage.notification?.title || "InvestNaija",
            body: remoteMessage.notification?.body || "New notification",
            data: remoteMessage.data,
          });
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error("Push notification setup error:", error);
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              animation: "slide_from_right",
            }}
          >
            {showOnboarding ? (
              <Stack.Screen name="Onboarding">
                {() => (
                  <OnboardingScreen onComplete={handleOnboardingComplete} />
                )}
              </Stack.Screen>
            ) : !isAuthenticated ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen
                  name="BiometricSetup"
                  component={BiometricSetupScreen}
                />
              </>
            ) : (
              <>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen
                  name="SendMoney"
                  component={SendMoneyScreen}
                  options={{
                    headerShown: true,
                    title: "Send Money",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="RequestMoney"
                  component={RequestMoneyScreen}
                  options={{
                    headerShown: true,
                    title: "Request Money",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="BillPayment"
                  component={BillPaymentScreen}
                  options={{
                    headerShown: true,
                    title: "Pay Bills",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="BuyAirtime"
                  component={BuyAirtimeScreen}
                  options={{
                    headerShown: true,
                    title: "Buy Airtime",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="Investment"
                  component={InvestmentScreen}
                  options={{
                    headerShown: true,
                    title: "Investments",
                  }}
                />
                <Stack.Screen
                  name="Crypto"
                  component={CryptoScreen}
                  options={{
                    headerShown: true,
                    title: "Cryptocurrency",
                  }}
                />
                <Stack.Screen
                  name="Loans"
                  component={LoansScreen}
                  options={{
                    headerShown: true,
                    title: "Loans",
                  }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});

export default App;
// Commit 12 - 1752188001
// Commit 14 - 1752188001
// Commit 44 - 1752188004
// Commit 47 - 1752188004
// Commit 49 - 1752188005
// Commit 59 - 1752188006
// Commit 64 - 1752188006
// Commit 67 - 1752188007
// Commit 94 - 1752188008
// Commit 104 - 1752188009
// Commit 105 - 1752188009
// Commit 112 - 1752188009
// Commit 124 - 1752188010
// Commit 131 - 1752188011
// Commit 138 - 1752188012
// Commit 143 - 1752188012
// Commit 156 - 1752188013
// Commit 176 - 1752188014
// Commit 179 - 1752188014
// Commit 202 - 1752188016
// Commit 233 - 1752188018
// Commit 237 - 1752188018
// Commit 270 - 1752188020
// Commit 271 - 1752188020
// Commit 313 - 1752188023
// Commit 325 - 1752188024
// Commit 330 - 1752188024
// Commit 351 - 1752188028
// Commit 368 - 1752188029
// Commit 369 - 1752188029
// Commit 384 - 1752188030
// Commit 395 - 1752188031
// Commit 407 - 1752188032
// Commit 416 - 1752188032
