import { useState, useEffect } from "react";
import { apiService } from "../lib/api";
import { toast } from "./use-toast";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  completed: boolean;
  progress: number;
  unlockedAt?: string;
}

interface UserLevel {
  current: number;
  title: string;
  xp: number;
  progressToNext: number;
  nextLevelXP: number;
  achievements: number;
  portfolioValue: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  value: number;
  achievements: number;
  avatar: string;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<{
    completed: Achievement[];
    inProgress: Achievement[];
    newlyUnlocked: Achievement[];
  }>({
    completed: [],
    inProgress: [],
    newlyUnlocked: [],
  });
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    try {
      const response = await apiService.getUserAchievements();
      if (response.success) {
        setAchievements(response.achievements);

        // Show newly unlocked achievements
        if (response.achievements.newlyUnlocked.length > 0) {
          response.achievements.newlyUnlocked.forEach(
            (achievement: Achievement) => {
              toast({
                title: "🎉 Achievement Unlocked!",
                description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
                duration: 5000,
              });
            },
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    }
  };

  const fetchUserLevel = async () => {
    try {
      const response = await apiService.getUserLevel();
      if (response.success) {
        setUserLevel(response.level);
      }
    } catch (error) {
      console.error("Failed to fetch user level:", error);
    }
  };

  const fetchLeaderboard = async (
    category = "portfolio_value",
    period = "all_time",
  ) => {
    try {
      const response = await apiService.getLeaderboard(category, period);
      if (response.success) {
        setLeaderboard(response.leaderboard || []);
        setUserRank(response.userRank || 0);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  const claimReward = async (achievementId: string) => {
    try {
      const response = await apiService.claimAchievementReward(achievementId);
      if (response.success) {
        toast({
          title: "Reward Claimed!",
          description: response.message,
        });
        await fetchAchievements(); // Refresh achievements
      }
    } catch (error) {
      console.error("Failed to claim reward:", error);
      toast({
        title: "Error",
        description: "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAchievements(),
        fetchUserLevel(),
        fetchLeaderboard(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600 bg-gray-100";
      case "rare":
        return "text-blue-600 bg-blue-100";
      case "epic":
        return "text-purple-600 bg-purple-100";
      case "legendary":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "investment":
        return "📈";
      case "savings":
        return "💰";
      case "streak":
        return "🔥";
      case "milestone":
        return "🏆";
      case "special":
        return "⭐";
      default:
        return "🎯";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-gray-300";
  };

  return {
    achievements,
    userLevel,
    leaderboard,
    userRank,
    loading,
    fetchAchievements,
    fetchUserLevel,
    fetchLeaderboard,
    claimReward,
    getRarityColor,
    getCategoryIcon,
    getProgressColor,
    stats: {
      totalCompleted: achievements.completed.length,
      totalAvailable:
        achievements.completed.length + achievements.inProgress.length,
      completionRate:
        (achievements.completed.length /
          Math.max(
            1,
            achievements.completed.length + achievements.inProgress.length,
          )) *
        100,
    },
  };
};
