import ReactNativeBiometrics from "react-native-biometrics";
import TouchID from "react-native-touch-id";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export enum BiometricType {
  TouchID = "TouchID",
  FaceID = "FaceID",
  Fingerprint = "Fingerprint",
  None = "None",
}

interface BiometricAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

class BiometricServiceClass {
  private rnBiometrics = new ReactNativeBiometrics();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if biometrics are available
      const { available, biometryType } =
        await this.rnBiometrics.isSensorAvailable();
      console.log("Biometric availability:", { available, biometryType });

      this.isInitialized = true;
    } catch (error) {
      console.error("Biometric service initialization error:", error);
    }
  }

  async isBiometricAvailable(): Promise<{
    available: boolean;
    type: BiometricType;
  }> {
    try {
      const { available, biometryType } =
        await this.rnBiometrics.isSensorAvailable();

      if (!available) {
        return { available: false, type: BiometricType.None };
      }

      // Map biometry types
      switch (biometryType) {
        case ReactNativeBiometrics.TouchID:
          return { available: true, type: BiometricType.TouchID };
        case ReactNativeBiometrics.FaceID:
          return { available: true, type: BiometricType.FaceID };
        case ReactNativeBiometrics.Biometrics:
          return { available: true, type: BiometricType.Fingerprint };
        default:
          return { available: false, type: BiometricType.None };
      }
    } catch (error) {
      console.error("Biometric availability check error:", error);
      return { available: false, type: BiometricType.None };
    }
  }

  async authenticateWithBiometrics(
    reason?: string,
  ): Promise<BiometricAuthResult> {
    try {
      const { available } = await this.isBiometricAvailable();

      if (!available) {
        return {
          success: false,
          error: "Biometric authentication is not available on this device",
        };
      }

      // Try with react-native-biometrics first
      try {
        const { success } = await this.rnBiometrics.simplePrompt({
          promptMessage: reason || "Authenticate to access your account",
          cancelButtonText: "Cancel",
        });

        return { success };
      } catch (error: any) {
        if (error.message?.includes("User cancel")) {
          return { success: false, cancelled: true };
        }

        // Fallback to TouchID library for iOS
        if (Platform.OS === "ios") {
          return await this.authenticateWithTouchID(reason);
        }

        throw error;
      }
    } catch (error: any) {
      console.error("Biometric authentication error:", error);
      return {
        success: false,
        error: error.message || "Biometric authentication failed",
      };
    }
  }

  private async authenticateWithTouchID(
    reason?: string,
  ): Promise<BiometricAuthResult> {
    try {
      const optionalConfigObject = {
        title: "Authentication Required",
        subTitle: reason || "Authenticate to access your account",
        imageColor: "#10b981",
        imageErrorColor: "#ef4444",
        sensorDescription: "Touch sensor",
        sensorErrorDescription: "Failed",
        cancelText: "Cancel",
        fallbackLabel: "Use Passcode",
        unifiedErrors: false,
        passcodeFallback: false,
      };

      await TouchID.authenticate("", optionalConfigObject);
      return { success: true };
    } catch (error: any) {
      if (error.name === "UserCancel") {
        return { success: false, cancelled: true };
      }

      return {
        success: false,
        error: error.message || "TouchID authentication failed",
      };
    }
  }

  async createBiometricKeys(): Promise<{
    success: boolean;
    publicKey?: string;
  }> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();

      if (!keysExist) {
        const { publicKey } = await this.rnBiometrics.createKeys();
        return { success: true, publicKey };
      }

      return { success: true };
    } catch (error) {
      console.error("Biometric key creation error:", error);
      return { success: false };
    }
  }

  async deleteBiometricKeys(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();

      if (keysExist) {
        await this.rnBiometrics.deleteKeys();
      }

      return true;
    } catch (error) {
      console.error("Biometric key deletion error:", error);
      return false;
    }
  }

  async createSignature(
    payload: string,
  ): Promise<{ success: boolean; signature?: string }> {
    try {
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage: "Sign in with biometrics",
        payload,
      });

      return { success, signature };
    } catch (error) {
      console.error("Biometric signature creation error:", error);
      return { success: false };
    }
  }

  async enableBiometricLogin(): Promise<boolean> {
    try {
      const { available, type } = await this.isBiometricAvailable();

      if (!available) {
        Alert.alert(
          "Biometric Not Available",
          "Biometric authentication is not available on this device.",
        );
        return false;
      }

      const result = await this.authenticateWithBiometrics(
        `Enable ${type} login for quick access to your account`,
      );

      if (result.success) {
        await this.createBiometricKeys();
        await AsyncStorage.setItem("biometric_enabled", "true");
        return true;
      } else if (!result.cancelled) {
        Alert.alert(
          "Authentication Failed",
          result.error || "Unable to enable biometric login",
        );
      }

      return false;
    } catch (error) {
      console.error("Enable biometric login error:", error);
      return false;
    }
  }

  async disableBiometricLogin(): Promise<boolean> {
    try {
      await this.deleteBiometricKeys();
      await AsyncStorage.setItem("biometric_enabled", "false");
      return true;
    } catch (error) {
      console.error("Disable biometric login error:", error);
      return false;
    }
  }

  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem("biometric_enabled");
      return enabled === "true";
    } catch (error) {
      console.error("Check biometric login status error:", error);
      return false;
    }
  }

  getBiometricDisplayName(type: BiometricType): string {
    switch (type) {
      case BiometricType.TouchID:
        return "Touch ID";
      case BiometricType.FaceID:
        return "Face ID";
      case BiometricType.Fingerprint:
        return "Fingerprint";
      default:
        return "Biometric";
    }
  }
}

export const BiometricService = new BiometricServiceClass();
