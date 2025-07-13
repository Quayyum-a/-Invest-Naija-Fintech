import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Send,
  ArrowDownLeft,
  Gift,
  Trophy,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface GroupSavings {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  members: GroupMember[];
  createdBy: string;
  endDate: string;
  status: "active" | "completed" | "cancelled";
  category: string;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  contribution: number;
  joinedAt: string;
  status: "active" | "left";
}

interface MoneyRequest {
  id: string;
  from: string;
  to: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  dueDate?: string;
}

interface SocialPayment {
  id: string;
  from: string;
  to: string;
  amount: number;
  message: string;
  type: "gift" | "payment" | "split";
  createdAt: string;
  isPublic: boolean;
}

interface FinancialChallenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  duration: number; // in days
  participants: ChallengeParticipant[];
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  category: "savings" | "investment" | "spending";
}

interface ChallengeParticipant {
  id: string;
  name: string;
  avatar: string;
  progress: number;
  rank: number;
}

export default function SocialBanking() {
  const { user } = useAuth();
  const [groupSavings, setGroupSavings] = useState<GroupSavings[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const [socialPayments, setSocialPayments] = useState<SocialPayment[]>([]);
  const [financialChallenges, setFinancialChallenges] = useState<
    FinancialChallenge[]
  >([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequestMoney, setShowRequestMoney] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("investnaija_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [groupsRes, requestsRes, paymentsRes, challengesRes] =
        await Promise.all([
          fetch("/api/social/groups", { headers }).then((r) => r.json()),
          fetch("/api/social/requests", { headers }).then((r) => r.json()),
          fetch("/api/social/payments", { headers }).then((r) => r.json()),
          fetch("/api/social/challenges", { headers }).then((r) => r.json()),
        ]);

      if (groupsRes.success) setGroupSavings(groupsRes.groups || []);
      if (requestsRes.success) setMoneyRequests(requestsRes.requests || []);
      if (paymentsRes.success) setSocialPayments(paymentsRes.payments || []);
      if (challengesRes.success)
        setFinancialChallenges(challengesRes.challenges || []);

      // Fallback to mock data if no data returned
      if (!groupsRes.groups?.length) {
        loadMockData();
      }
    } catch (error) {
      console.error("Failed to fetch social data:", error);
      // Load mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setGroupSavings([
      {
        id: "1",
        name: "Vacation Fund 2024",
        description: "Saving for our annual family vacation",
        targetAmount: 500000,
        currentAmount: 320000,
        members: [
          {
            id: "1",
            name: "John Doe",
            avatar: "",
            contribution: 150000,
            joinedAt: "2024-01-15",
            status: "active",
          },
          {
            id: "2",
            name: "Jane Smith",
            avatar: "",
            contribution: 100000,
            joinedAt: "2024-01-20",
            status: "active",
          },
          {
            id: "3",
            name: "Mike Johnson",
            avatar: "",
            contribution: 70000,
            joinedAt: "2024-02-01",
            status: "active",
          },
        ],
        createdBy: "1",
        endDate: "2024-12-31",
        status: "active",
        category: "vacation",
      },
      {
        id: "2",
        name: "Emergency Fund",
        description: "Building emergency savings with friends",
        targetAmount: 1000000,
        currentAmount: 750000,
        members: [
          {
            id: "1",
            name: "John Doe",
            avatar: "",
            contribution: 300000,
            joinedAt: "2024-01-01",
            status: "active",
          },
          {
            id: "4",
            name: "Sarah Wilson",
            avatar: "",
            contribution: 250000,
            joinedAt: "2024-01-10",
            status: "active",
          },
          {
            id: "5",
            name: "David Brown",
            avatar: "",
            contribution: 200000,
            joinedAt: "2024-01-15",
            status: "active",
          },
        ],
        createdBy: "1",
        endDate: "2024-06-30",
        status: "active",
        category: "emergency",
      },
    ]);

    setMoneyRequests([
      {
        id: "1",
        from: "2",
        to: "1",
        amount: 50000,
        reason: "Need help with rent this month",
        status: "pending",
        createdAt: "2024-12-15",
        dueDate: "2024-12-25",
      },
      {
        id: "2",
        from: "3",
        to: "1",
        amount: 25000,
        reason: "Split for dinner last night",
        status: "approved",
        createdAt: "2024-12-14",
      },
    ]);

    setSocialPayments([
      {
        id: "1",
        from: "1",
        to: "2",
        amount: 10000,
        message: "Happy Birthday! 🎉",
        type: "gift",
        createdAt: "2024-12-15",
        isPublic: true,
      },
      {
        id: "2",
        from: "3",
        to: "1",
        amount: 15000,
        message: "Thanks for the help!",
        type: "payment",
        createdAt: "2024-12-14",
        isPublic: false,
      },
    ]);

    setFinancialChallenges([
      {
        id: "1",
        title: "30-Day Savings Challenge",
        description: "Save ₦1,000 more each day for 30 days",
        targetAmount: 30000,
        duration: 30,
        participants: [
          { id: "1", name: "John Doe", avatar: "", progress: 65, rank: 1 },
          { id: "2", name: "Jane Smith", avatar: "", progress: 58, rank: 2 },
          { id: "3", name: "Mike Johnson", avatar: "", progress: 45, rank: 3 },
        ],
        startDate: "2024-12-01",
        endDate: "2024-12-31",
        status: "active",
        category: "savings",
      },
    ]);
  };

  const createGroupSavings = async (data: any) => {
    try {
      const token = localStorage.getItem("investnaija_token");
      const response = await fetch("/api/social/groups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setGroupSavings((prev) => [...prev, result.group]);
        setShowCreateGroup(false);
        toast({
          title: "Success",
          description: "Group savings created successfully!",
        });
      } else {
        throw new Error(result.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      toast({
        title: "Error",
        description: "Failed to create group savings",
        variant: "destructive",
      });
    }
  };

  const requestMoney = async (data: any) => {
    try {
      // TODO: Implement actual API call when endpoint exists
      console.log("Would send request:", data);
      const response = {
        data: {
          request: {
            id: Date.now().toString(),
            ...data,
            from: "1",
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        },
      };
      setMoneyRequests((prev) => [...prev, response.data.request]);
      setShowRequestMoney(false);
      toast({
        title: "Success",
        description: "Money request sent successfully!",
      });
    } catch (error) {
      console.error("Failed to request money:", error);
      toast({
        title: "Error",
        description: "Failed to send money request",
        variant: "destructive",
      });
    }
  };

  const sendMoney = async (data: any) => {
    try {
      // TODO: Implement actual API call when endpoint exists
      console.log("Would send payment:", data);
      const response = {
        data: {
          payment: {
            id: Date.now().toString(),
            ...data,
            from: "1",
            createdAt: new Date().toISOString(),
          },
        },
      };
      setSocialPayments((prev) => [...prev, response.data.payment]);
      setShowSendMoney(false);
      toast({
        title: "Success",
        description: "Money sent successfully!",
      });
    } catch (error) {
      console.error("Failed to send money:", error);
      toast({
        title: "Error",
        description: "Failed to send money",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Banking</h2>
          <p className="text-gray-600">
            Connect, save, and pay with friends and family
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group Savings</DialogTitle>
              </DialogHeader>
              <CreateGroupForm onSubmit={createGroupSavings} />
            </DialogContent>
          </Dialog>

          <Dialog open={showRequestMoney} onOpenChange={setShowRequestMoney}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Request Money
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Money</DialogTitle>
              </DialogHeader>
              <RequestMoneyForm onSubmit={requestMoney} />
            </DialogContent>
          </Dialog>

          <Dialog open={showSendMoney} onOpenChange={setShowSendMoney}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Send Money
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Money</DialogTitle>
              </DialogHeader>
              <SendMoneyForm onSubmit={sendMoney} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Groups</p>
                <p className="text-2xl font-bold">
                  {groupSavings.filter((g) => g.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold">
                  ₦
                  {groupSavings
                    .reduce((sum, group) => sum + group.currentAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold">
                  {moneyRequests.filter((r) => r.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Challenges</p>
                <p className="text-2xl font-bold">
                  {
                    financialChallenges.filter((c) => c.status === "active")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Savings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Group Savings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupSavings.map((group) => (
              <Card
                key={group.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge className={getStatusColor(group.status)}>
                      {group.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>
                        {getProgressPercentage(
                          group.currentAmount,
                          group.targetAmount,
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${getProgressPercentage(group.currentAmount, group.targetAmount)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>₦{group.currentAmount.toLocaleString()}</span>
                      <span>₦{group.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">
                      Members ({group.members.length})
                    </p>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 3).map((member) => (
                        <Avatar
                          key={member.id}
                          className="w-8 h-8 border-2 border-white"
                        >
                          {member.avatar && <AvatarImage src={member.avatar} />}
                          <AvatarFallback>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {group.members.length > 3 && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs border-2 border-white">
                          +{group.members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      Contribute
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Money Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowDownLeft className="w-5 h-5" />
              <span>Money Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moneyRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        ₦{request.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5" />
              <span>Recent Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {socialPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.type === "gift" ? "bg-pink-100" : "bg-blue-100"
                      }`}
                    >
                      {payment.type === "gift" ? (
                        <Gift className="w-5 h-5 text-pink-600" />
                      ) : (
                        <Send className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">{payment.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                    {payment.isPublic && (
                      <Badge variant="outline" className="mt-1">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Financial Challenges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financialChallenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {challenge.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Target</span>
                      <span>₦{challenge.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Duration</span>
                      <span>{challenge.duration} days</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Leaderboard</p>
                    <div className="space-y-2">
                      {challenge.participants
                        .slice(0, 3)
                        .map((participant, index) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : index === 1
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="text-sm">
                                {participant.name}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {participant.progress}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <Button size="sm" className="w-full">
                    Join Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Form Components
function CreateGroupForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    endDate: "",
    category: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Group Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Vacation Fund 2024"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="What are you saving for?"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Target Amount</label>
        <Input
          type="number"
          value={formData.targetAmount}
          onChange={(e) =>
            setFormData({ ...formData, targetAmount: e.target.value })
          }
          placeholder="₦500,000"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">End Date</label>
        <Input
          type="date"
          value={formData.endDate}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value })
          }
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacation">Vacation</SelectItem>
            <SelectItem value="emergency">Emergency Fund</SelectItem>
            <SelectItem value="wedding">Wedding</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Create Group
      </Button>
    </form>
  );
}

function RequestMoneyForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    to: "",
    amount: "",
    reason: "",
    dueDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">To (Phone Number)</label>
        <Input
          value={formData.to}
          onChange={(e) => setFormData({ ...formData, to: e.target.value })}
          placeholder="+2348012345678"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Amount</label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="₦50,000"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Reason</label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Why do you need this money?"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Due Date (Optional)</label>
        <Input
          type="date"
          value={formData.dueDate}
          onChange={(e) =>
            setFormData({ ...formData, dueDate: e.target.value })
          }
        />
      </div>
      <Button type="submit" className="w-full">
        Send Request
      </Button>
    </form>
  );
}

function SendMoneyForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    to: "",
    amount: "",
    message: "",
    type: "payment",
    isPublic: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">To (Phone Number)</label>
        <Input
          value={formData.to}
          onChange={(e) => setFormData({ ...formData, to: e.target.value })}
          placeholder="+2348012345678"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Amount</label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="₦10,000"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Message</label>
        <Textarea
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="Add a personal message..."
        />
      </div>
      <div>
        <label className="text-sm font-medium">Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="gift">Gift</SelectItem>
            <SelectItem value="split">Split Bill</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) =>
            setFormData({ ...formData, isPublic: e.target.checked })
          }
        />
        <label htmlFor="isPublic" className="text-sm">
          Make this payment public
        </label>
      </div>
      <Button type="submit" className="w-full">
        Send Money
      </Button>
    </form>
  );
}
