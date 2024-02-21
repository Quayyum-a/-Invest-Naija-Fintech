import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

const RequestMoneyScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>💰 Request Money</Text>
        <Text style={styles.description}>Request payment from contacts</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  description: { fontSize: 16, color: "#6b7280", textAlign: "center" },
});

export default RequestMoneyScreen;
