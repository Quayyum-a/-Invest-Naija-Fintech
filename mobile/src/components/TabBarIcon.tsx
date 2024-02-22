import React from "react";
import { View, Text } from "react-native";

interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

const iconMap: Record<string, string> = {
  Dashboard: "🏠",
  Wallet: "💳",
  Transactions: "📊",
  Portfolio: "📈",
  Profile: "👤",
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  focused,
  color,
  size,
}) => {
  const icon = iconMap[name] || "❓";

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          fontSize: focused ? size + 4 : size,
          opacity: focused ? 1 : 0.7,
        }}
      >
        {icon}
      </Text>
    </View>
  );
};
