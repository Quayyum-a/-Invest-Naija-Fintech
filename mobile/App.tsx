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
// Commit 418 - 1752188032
// December commit 2 - 1752189165
// December commit 4 - 1752189165
// December commit 14 - 1752189166
// December commit 16 - 1752189166
// December commit 31 - 1752189169
// December commit 48 - 1752189175
// December commit 54 - 1752189177
// December commit 60 - 1752189179
// December commit 93 - 1752189188
// December commit 96 - 1752189189
// 2023 commit 3 - 1752189198
// 2023 commit 30 - 1752189204
// 2023 commit 31 - 1752189204
// 2023 commit 53 - 1752189214
// 2023 commit 56 - 1752189214
// 2023 commit 72 - 1752189220
// 2023 commit 87 - 1752189224
// 2023 commit 92 - 1752189225
// 2023 commit 101 - 1752189225
// 2023 commit 133 - 1752189234
// 2023 commit 151 - 1752189237
// 2023 commit 165 - 1752189242
// 2023 commit 169 - 1752189243
// 2023 commit 184 - 1752189245
// 2023 commit 195 - 1752189248
// 2023 commit 206 - 1752189249
// 2023 commit 209 - 1752189250
// 2023 commit 215 - 1752189250
// 2023 commit 227 - 1752189253
// 2023 commit 247 - 1752189256
// 2023 commit 249 - 1752189257
// 2023 commit 251 - 1752189257
// 2023 commit 273 - 1752189259
// 2023 commit 278 - 1752189260
// 2023 commit 280 - 1752189260
// 2023 commit 289 - 1752189262
// 2023 commit 299 - 1752189264
// 2023 commit 305 - 1752189265
// 2023 commit 319 - 1752189268
// 2023 commit 324 - 1752189269
// December commit 7 - 1752189481
// December commit 14 - 1752189482
// December commit 27 - 1752189484
// December commit 31 - 1752189485
// December commit 34 - 1752189486
// December commit 47 - 1752189488
// December commit 55 - 1752189489
// December commit 57 - 1752189490
// December commit 59 - 1752189490
// December commit 68 - 1752189492
// December commit 71 - 1752189492
// December commit 82 - 1752189494
// December commit 86 - 1752189495
// December commit 93 - 1752189496
// December commit 96 - 1752189496
// December commit 112 - 1752189497
// December commit 118 - 1752189498
// December commit 119 - 1752189498
// Past year commit 1 - 1752189503
// Past year commit 6 - 1752189503
// Past year commit 8 - 1752189504
// Past year commit 15 - 1752189504
// Past year commit 18 - 1752189505
// Past year commit 19 - 1752189505
// Past year commit 34 - 1752189507
// Past year commit 42 - 1752189509
// Past year commit 43 - 1752189509
// Past year commit 59 - 1752189511
// Past year commit 69 - 1752189512
// Past year commit 73 - 1752189512
// Past year commit 78 - 1752189513
// Past year commit 83 - 1752189513
// Past year commit 94 - 1752189515
// Past year commit 97 - 1752189516
// Past year commit 101 - 1752189516
// Past year commit 103 - 1752189516
// Past year commit 117 - 1752189517
// Past year commit 127 - 1752189519
// Past year commit 129 - 1752189520
// Past year commit 140 - 1752189521
// Past year commit 158 - 1752189523
// Past year commit 163 - 1752189524
// Past year commit 171 - 1752189526
// Past year commit 193 - 1752189528
// Past year commit 196 - 1752189529
// Past year commit 211 - 1752189531
// Past year commit 260 - 1752189537
// Past year commit 276 - 1752189538
// Past year commit 299 - 1752189542
// Past year commit 307 - 1752189542
// Past year commit 314 - 1752189543
// Past year commit 317 - 1752189543
// Past year commit 318 - 1752189543
// Past year commit 319 - 1752189543
// Past year commit 324 - 1752189545
// Past year commit 326 - 1752189545
// Past year commit 327 - 1752189545
// Past year commit 334 - 1752189545
