import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { ApiService } from "../../services/ApiService";
import { LoadingSpinner } from "../../components/LoadingSpinner";

const { width } = Dimensions.get("window");

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balanceResponse, transactionsResponse, portfolioResponse] =
        await Promise.all([
          ApiService.getWalletBalance(),
          ApiService.getTransactions(1, 5),
          ApiService.getPortfolio(),
        ]);

      if (balanceResponse.success) {
        setBalance(balanceResponse.data?.balance || 0);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data?.transactions || []);
      }

      if (portfolioResponse.success) {
        setInvestments(portfolioResponse.data?.investments || []);
      }
    } catch (error) {
      console.error("Dashboard data loading error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const quickActions = [
    {
      title: "Send Money",
      icon: "💸",
      color: "#3b82f6",
      onPress: () => navigation.navigate("SendMoney" as never),
    },
    {
      title: "Request Money",
      icon: "💰",
      color: "#10b981",
      onPress: () => navigation.navigate("RequestMoney" as never),
    },
    {
      title: "Pay Bills",
      icon: "⚡",
      color: "#f59e0b",
      onPress: () => navigation.navigate("BillPayment" as never),
    },
    {
      title: "Buy Airtime",
      icon: "📱",
      color: "#8b5cf6",
      onPress: () => navigation.navigate("BuyAirtime" as never),
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={60} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>
              {user?.firstName || "Welcome back"}
            </Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={["#10b981", "#059669"]}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity>
              <Text style={styles.eyeIcon}>👁️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceFooter}>
            <TouchableOpacity
              style={styles.balanceButton}
              onPress={() => navigation.navigate("Wallet" as never)}
            >
              <Text style={styles.balanceButtonText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={action.onPress}
              >
                <LinearGradient
                  colors={[`${action.color}20`, `${action.color}10`]}
                  style={styles.actionIcon}
                >
                  <Text style={styles.actionEmoji}>{action.icon}</Text>
                </LinearGradient>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Transactions" as never)}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            transactions.slice(0, 3).map((transaction: any, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>
                    {transaction.type === "credit" ? "💰" : "💸"}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {transaction.description || "Transaction"}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === "credit" ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent transactions</Text>
            </View>
          )}
        </View>

        {/* Investment Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Investments</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Portfolio" as never)}
            >
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.investmentCards}>
            <TouchableOpacity
              style={styles.investmentCard}
              onPress={() => navigation.navigate("Investment" as never)}
            >
              <LinearGradient
                colors={["#3b82f620", "#3b82f610"]}
                style={styles.investmentCardContent}
              >
                <Text style={styles.investmentEmoji}>📈</Text>
                <Text style={styles.investmentTitle}>Start Investing</Text>
                <Text style={styles.investmentDescription}>
                  Begin with ₦1,000
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.investmentCard}
              onPress={() => navigation.navigate("Crypto" as never)}
            >
              <LinearGradient
                colors={["#f59e0b20", "#f59e0b10"]}
                style={styles.investmentCardContent}
              >
                <Text style={styles.investmentEmoji}>₿</Text>
                <Text style={styles.investmentTitle}>Crypto</Text>
                <Text style={styles.investmentDescription}>
                  Buy & sell crypto
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    color: "#6b7280",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  eyeIcon: {
    fontSize: 20,
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  balanceFooter: {
    alignItems: "flex-start",
  },
  balanceButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  balanceButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  seeAllText: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 16,
    alignItems: "center",
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  transactionDate: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
  },
  investmentCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  investmentCard: {
    width: (width - 60) / 2,
  },
  investmentCardContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  investmentEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  investmentDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});

export default DashboardScreen;
