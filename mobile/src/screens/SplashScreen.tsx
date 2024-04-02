import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

const SplashScreen: React.FC = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={["#10b981", "#059669", "#047857"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>₦</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>InvestNaija</Text>
        <Text style={styles.tagline}>Your Smart Investment Partner</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View style={styles.loadingDot1} />
          <Animated.View style={styles.loadingDot2} />
          <Animated.View style={styles.loadingDot3} />
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  logoText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#ffffff",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 50,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
  loadingDot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    marginHorizontal: 4,
  },
  loadingDot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 4,
  },
  loadingDot3: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  version: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    position: "absolute",
    bottom: -100,
  },
});

export default SplashScreen;
