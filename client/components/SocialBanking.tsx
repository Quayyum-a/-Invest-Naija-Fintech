import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Split,
  Plus,
  Send,
  DollarSign,
  Calendar,
  Gift,
  Target,
  Share2,
  Crown,
  Trophy,
  Star,
  MessageCircle,
  Heart,
  UserPlus,
  QrCode,
} from "lucide-react";

interface SplitGroup {
  id: string;
  name: string;
  description: string;
  totalAmount: number;
  memberCount: number;
  amountPerPerson: number;
  createdBy: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  dueDate?: string;
  members: GroupMember[];
  category:
    | "bills"
    | "food"
    | "transport"
    | "entertainment"
    | "travel"
    | "other";
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

interface SavingsChallenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  participantCount: number;
  duration: number; // days
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  category: "emergency" | "vacation" | "gadget" | "investment" | "other";
  participants: ChallengeParticipant[];
}

interface ChallengeParticipant {
  id: string;
  name: string;
  avatar?: string;
  contributed: number;
  rank: number;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: "pending" | "joined" | "active";
  joinedAt?: string;
  bonus: number;
  avatar?: string;
}

export default function SocialBanking() {
  const [activeTab, setActiveTab] = useState<
    "splits" | "challenges" | "referrals"
  >("splits");
  const [splitGroups, setSplitGroups] = useState<SplitGroup[]>([]);
  const [challenges, setChallenges] = useState<SavingsChallenge[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

  // Form states
  const [newSplit, setNewSplit] = useState({
    name: "",
    description: "",
    totalAmount: "",
    category: "bills" as const,
    dueDate: "",
    members: [] as string[],
  });

  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    targetAmount: "",
    duration: "30",
    category: "emergency" as const,
  });

  const [referralEmail, setReferralEmail] = useState("");

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      // Mock data
      const mockSplits: SplitGroup[] = [
        {
          id: "1",
          name: "Dinner at Terra Kulture",
          description: "Group dinner celebration",
          totalAmount: 75000,
          memberCount: 5,
          amountPerPerson: 15000,
          createdBy: "You",
          status: "active",
          createdAt: "2024-01-08",
          dueDate: "2024-01-15",
          category: "food",
          members: [
            {
              id: "1",
              name: "You",
              amount: 15000,
              paid: true,
              paidAt: "2024-01-08",
            },
            { id: "2", name: "Kemi Adebayo", amount: 15000, paid: true },
            { id: "3", name: "Tunde Okoye", amount: 15000, paid: false },
            { id: "4", name: "Ngozi Ike", amount: 15000, paid: true },
            { id: "5", name: "Femi Johnson", amount: 15000, paid: false },
          ],
        },
        {
          id: "2",
          name: "Uber to Airport",
          description: "Shared ride to Murtala Mohammed Airport",
          totalAmount: 12000,
          memberCount: 3,
          amountPerPerson: 4000,
          createdBy: "Kemi Adebayo",
          status: "completed",
          createdAt: "2024-01-05",
          category: "transport",
          members: [
            { id: "1", name: "You", amount: 4000, paid: true },
            { id: "2", name: "Kemi Adebayo", amount: 4000, paid: true },
            { id: "3", name: "Tolu Bakare", amount: 4000, paid: true },
          ],
        },
      ];

      const mockChallenges: SavingsChallenge[] = [
        {
          id: "1",
          title: "Emergency Fund Challenge",
          description: "Save ₦500,000 for emergency fund in 6 months",
          targetAmount: 500000,
          currentAmount: 125000,
          participantCount: 12,
          duration: 180,
          startDate: "2024-01-01",
          endDate: "2024-06-30",
          status: "active",
          category: "emergency",
          participants: [
            { id: "1", name: "You", contributed: 25000, rank: 3 },
            { id: "2", name: "Adebayo James", contributed: 30000, rank: 1 },
            { id: "3", name: "Chioma Okafor", contributed: 28000, rank: 2 },
          ],
        },
        {
          id: "2",
          title: "Vacation Fund 2024",
          description: "Group savings for Dubai vacation",
          targetAmount: 1200000,
          currentAmount: 450000,
          participantCount: 8,
          duration: 365,
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          status: "active",
          category: "vacation",
          participants: [
            { id: "1", name: "You", contributed: 75000, rank: 2 },
            { id: "2", name: "Blessing Nkem", contributed: 80000, rank: 1 },
          ],
        },
      ];

      const mockReferrals: Referral[] = [
        {
          id: "1",
          name: "Adebayo Johnson",
          email: "adebayo@email.com",
          status: "active",
          joinedAt: "2024-01-05",
          bonus: 2000,
        },
        {
          id: "2",
          name: "Ngozi Okafor",
          email: "ngozi@email.com",
          status: "joined",
          joinedAt: "2024-01-08",
          bonus: 1500,
        },
        {
          id: "3",
          name: "Tunde Bakare",
          email: "tunde@email.com",
          status: "pending",
          bonus: 0,
        },
      ];

      setSplitGroups(mockSplits);
      setChallenges(mockChallenges);
      setReferrals(mockReferrals);
    } catch (error) {
      console.error("Failed to load social data:", error);
      toast({
        title: "Error",
        description: "Failed to load social banking data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSplit = async () => {
    if (!newSplit.name || !newSplit.totalAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const split: SplitGroup = {
        id: Date.now().toString(),
        name: newSplit.name,
        description: newSplit.description,
        totalAmount: parseFloat(newSplit.totalAmount),
        memberCount: newSplit.members.length + 1, // +1 for creator
        amountPerPerson:
          parseFloat(newSplit.totalAmount) / (newSplit.members.length + 1),
        createdBy: "You",
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
        dueDate: newSplit.dueDate,
        category: newSplit.category,
        members: [
          { id: "creator", name: "You", amount: 0, paid: false },
          ...newSplit.members.map((member, index) => ({
            id: `member_${index}`,
            name: member,
            amount: 0,
            paid: false,
          })),
        ],
      };

      // Update amount per person for all members
      split.members = split.members.map((member) => ({
        ...member,
        amount: split.amountPerPerson,
      }));

      setSplitGroups([split, ...splitGroups]);
      setNewSplit({
        name: "",
        description: "",
        totalAmount: "",
        category: "bills",
        dueDate: "",
        members: [],
      });
      setShowSplitDialog(false);

      toast({
        title: "Success",
        description: "Split group created! Invitations sent to members.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create split group",
        variant: "destructive",
      });
    }
  };

  const handleCreateChallenge = async () => {
    if (!newChallenge.title || !newChallenge.targetAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(newChallenge.duration));

      const challenge: SavingsChallenge = {
        id: Date.now().toString(),
        title: newChallenge.title,
        description: newChallenge.description,
        targetAmount: parseFloat(newChallenge.targetAmount),
        currentAmount: 0,
        participantCount: 1,
        duration: parseInt(newChallenge.duration),
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        status: "active",
        category: newChallenge.category,
        participants: [{ id: "creator", name: "You", contributed: 0, rank: 1 }],
      };

      setChallenges([challenge, ...challenges]);
      setNewChallenge({
        title: "",
        description: "",
        targetAmount: "",
        duration: "30",
        category: "emergency",
      });
      setShowChallengeDialog(false);

      toast({
        title: "Success",
        description: "Savings challenge created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      });
    }
  };

  const handleSendReferral = async () => {
    if (!referralEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const referral: Referral = {
        id: Date.now().toString(),
        name: referralEmail.split("@")[0],
        email: referralEmail,
        status: "pending",
        bonus: 0,
      };

      setReferrals([referral, ...referrals]);
      setReferralEmail("");
      setShowReferralDialog(false);

      toast({
        title: "Success",
        description: "Referral invitation sent successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send referral",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "joined":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "food":
        return "🍽️";
      case "transport":
        return "🚗";
      case "entertainment":
        return "🎭";
      case "travel":
        return "✈️";
      case "bills":
        return "📝";
      case "emergency":
        return "🚨";
      case "vacation":
        return "🏖️";
      case "gadget":
        return "📱";
      case "investment":
        return "📈";
      default:
        return "💰";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Banking</h2>
          <p className="text-gray-600">
            Split bills, save together, and grow your network
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            My QR Code
          </Button>
          <Button className="bg-naira-green text-white">
            <Share2 className="w-4 h-4 mr-2" />
            Share App
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "splits", label: "Bill Splitting", icon: Split },
          { key: "challenges", label: "Savings Challenges", icon: Target },
          { key: "referrals", label: "Referrals", icon: UserPlus },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white text-naira-green shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bill Splitting Tab */}
      {activeTab === "splits" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bill Splitting</h3>
            <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
              <DialogTrigger asChild>
                <Button className="bg-naira-green text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Split
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Bill Split</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="splitName">Bill Name *</Label>
                    <Input
                      id="splitName"
                      value={newSplit.name}
                      onChange={(e) =>
                        setNewSplit({ ...newSplit, name: e.target.value })
                      }
                      placeholder="e.g., Dinner at Terra Kulture"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="splitAmount">Total Amount (₦) *</Label>
                    <Input
                      id="splitAmount"
                      type="number"
                      value={newSplit.totalAmount}
                      onChange={(e) =>
                        setNewSplit({
                          ...newSplit,
                          totalAmount: e.target.value,
                        })
                      }
                      placeholder="75000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="splitDescription">Description</Label>
                    <Textarea
                      id="splitDescription"
                      value={newSplit.description}
                      onChange={(e) =>
                        setNewSplit({
                          ...newSplit,
                          description: e.target.value,
                        })
                      }
                      placeholder="Group dinner celebration"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowSplitDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-naira-green text-white"
                      onClick={handleCreateSplit}
                    >
                      Create Split
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {splitGroups.map((split) => (
              <Card
                key={split.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getCategoryIcon(split.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{split.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {split.description}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(split.status)}>
                      {split.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Amount
                      </p>
                      <p className="text-lg font-semibold text-naira-green">
                        {formatCurrency(split.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Per Person
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(split.amountPerPerson)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Members ({split.memberCount})
                    </p>
                    <div className="space-y-2">
                      {split.members.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.paid ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Paid
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {split.members.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{split.members.length - 3} more members
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-naira-green text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {split.status === "active" ? "Pay Share" : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Savings Challenges Tab */}
      {activeTab === "challenges" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Savings Challenges</h3>
            <Dialog
              open={showChallengeDialog}
              onOpenChange={setShowChallengeDialog}
            >
              <DialogTrigger asChild>
                <Button className="bg-naira-green text-white">
                  <Target className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Savings Challenge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="challengeTitle">Challenge Title *</Label>
                    <Input
                      id="challengeTitle"
                      value={newChallenge.title}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g., Emergency Fund Challenge"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challengeTarget">Target Amount (₦) *</Label>
                    <Input
                      id="challengeTarget"
                      type="number"
                      value={newChallenge.targetAmount}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          targetAmount: e.target.value,
                        })
                      }
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challengeDuration">Duration (days)</Label>
                    <Input
                      id="challengeDuration"
                      type="number"
                      value={newChallenge.duration}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          duration: e.target.value,
                        })
                      }
                      placeholder="30"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowChallengeDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-naira-green text-white"
                      onClick={handleCreateChallenge}
                    >
                      Create Challenge
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getCategoryIcon(challenge.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {challenge.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {formatCurrency(challenge.currentAmount)} /{" "}
                        {formatCurrency(challenge.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-naira-green h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((challenge.currentAmount / challenge.targetAmount) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {Math.round(
                        (challenge.currentAmount / challenge.targetAmount) *
                          100,
                      )}
                      % completed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Participants
                      </p>
                      <p className="text-lg font-semibold">
                        {challenge.participantCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Days Left
                      </p>
                      <p className="text-lg font-semibold">
                        {Math.max(
                          0,
                          Math.ceil(
                            (new Date(challenge.endDate).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24),
                          ),
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Top Contributors
                    </p>
                    <div className="space-y-2">
                      {challenge.participants
                        .slice(0, 3)
                        .map((participant, index) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {index === 0 && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                                {index === 1 && (
                                  <Trophy className="w-4 h-4 text-gray-400" />
                                )}
                                {index === 2 && (
                                  <Star className="w-4 h-4 text-orange-500" />
                                )}
                              </div>
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {participant.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {participant.name}
                              </span>
                            </div>
                            <span className="text-sm font-semibold">
                              {formatCurrency(participant.contributed)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      Invite Friends
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-naira-green text-white"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Contribute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Referrals & Rewards</h3>
            <Dialog
              open={showReferralDialog}
              onOpenChange={setShowReferralDialog}
            >
              <DialogTrigger asChild>
                <Button className="bg-naira-green text-white">
                  <Gift className="w-4 h-4 mr-2" />
                  Refer Friend
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Refer a Friend</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-center p-4 bg-naira-light rounded-lg">
                    <Gift className="w-12 h-12 mx-auto mb-2 text-naira-green" />
                    <h3 className="font-semibold text-naira-green">
                      Earn ₦2,000
                    </h3>
                    <p className="text-sm text-gray-600">
                      For every friend that joins and makes their first
                      investment
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referralEmail">Friend's Email</Label>
                    <Input
                      id="referralEmail"
                      type="email"
                      value={referralEmail}
                      onChange={(e) => setReferralEmail(e.target.value)}
                      placeholder="friend@email.com"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowReferralDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-naira-green text-white"
                      onClick={handleSendReferral}
                    >
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Referrals
                    </p>
                    <p className="text-xl font-bold">{referrals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-naira-light rounded-lg">
                    <DollarSign className="w-5 h-5 text-naira-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Earnings
                    </p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        referrals.reduce((sum, r) => sum + r.bonus, 0),
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Heart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Active Referrals
                    </p>
                    <p className="text-xl font-bold">
                      {referrals.filter((r) => r.status === "active").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {referral.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{referral.name}</h4>
                        <p className="text-sm text-gray-600">
                          {referral.email}
                        </p>
                        {referral.joinedAt && (
                          <p className="text-xs text-gray-500">
                            Joined{" "}
                            {new Date(referral.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(referral.status)}>
                        {referral.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(referral.bonus)}
                        </p>
                        <p className="text-xs text-gray-500">Bonus</p>
                      </div>
                    </div>
                  </div>
                ))}

                {referrals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals yet</p>
                    <p className="text-sm">Invite friends and earn rewards!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
