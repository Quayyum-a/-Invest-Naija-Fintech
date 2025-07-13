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
  Bot,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Lightbulb,
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  Shield,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface FinancialAdvice {
  id: string;
  type: "investment" | "savings" | "spending" | "goal" | "risk";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionItems: string[];
  estimatedImpact: {
    savings?: number;
    returns?: number;
    risk?: string;
  };
  confidence: number;
}

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  metadata?: any;
}

export default function AIFinancialAdvisor() {
  const { user } = useAuth();
  const [advice, setAdvice] = useState<FinancialAdvice[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    generateFinancialAdvice();
    initializeChat();
  }, []);

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      type: "ai",
      content: `Hello ${user?.firstName || "there"}! I'm your AI financial advisor. I can help you with investment strategies, spending analysis, savings goals, and financial planning. What would you like to discuss today?`,
      timestamp: new Date(),
    };
    setChatMessages([welcomeMessage]);
  };

  const generateFinancialAdvice = async () => {
    try {
      setIsGeneratingAdvice(true);
            // TODO: Implement AI financial advice endpoint
      console.log("Would fetch AI financial advice");
      const response = { data: { advice: mockAdvice } };
      setAdvice(response.data.advice);
    } catch (error) {
      console.error("Failed to generate advice:", error);
      // Fallback to mock advice
      setAdvice(getMockAdvice());
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
            // TODO: Implement AI chat endpoint
      console.log("Would send chat message:", userInput);
      const response = { data: { reply: `I understand you're asking about "${userInput}". As your AI financial advisor, I recommend consulting with a certified financial advisor for personalized advice.` } };
        userId: user?.id,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response.data.response,
        timestamp: new Date(),
        metadata: response.data.metadata,
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAdvice = (): FinancialAdvice[] => [
    {
      id: "1",
      type: "investment",
      title: "Diversify Your Portfolio",
      description:
        "Your current investments are heavily concentrated in one sector. Consider diversifying across different asset classes.",
      priority: "high",
      actionItems: [
        "Allocate 20% to government bonds",
        "Consider index funds for broad market exposure",
        "Review your risk tolerance",
      ],
      estimatedImpact: {
        returns: 8.5,
        risk: "Medium",
      },
      confidence: 85,
    },
    {
      id: "2",
      type: "savings",
      title: "Emergency Fund Boost",
      description:
        "Your emergency fund covers 2 months of expenses. Aim for 6 months for better financial security.",
      priority: "medium",
      actionItems: [
        "Set up automatic monthly transfers",
        "Reduce non-essential spending by 15%",
        "Consider high-yield savings account",
      ],
      estimatedImpact: {
        savings: 150000,
      },
      confidence: 92,
    },
    {
      id: "3",
      type: "spending",
      title: "Optimize Subscription Spending",
      description:
        "You're spending ₦45,000 monthly on subscriptions. Review and cancel unused services.",
      priority: "medium",
      actionItems: [
        "Audit all active subscriptions",
        "Cancel unused streaming services",
        "Negotiate better rates with providers",
      ],
      estimatedImpact: {
        savings: 25000,
      },
      confidence: 78,
    },
  ];

  const getAdviceIcon = (type: string) => {
    switch (type) {
      case "investment":
        return <TrendingUp className="w-5 h-5" />;
      case "savings":
        return <PiggyBank className="w-5 h-5" />;
      case "spending":
        return <BarChart3 className="w-5 h-5" />;
      case "goal":
        return <Target className="w-5 h-5" />;
      case "risk":
        return <Shield className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              AI Financial Advisor
            </h2>
            <p className="text-gray-600">
              Personalized financial insights and recommendations
            </p>
          </div>
        </div>
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with AI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>AI Financial Advisor</span>
              </DialogTitle>
            </DialogHeader>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.metadata && (
                      <div className="mt-2 text-xs opacity-75">
                        {message.metadata.type === "investment" && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Investment Advice</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about investments, savings, or financial planning..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !userInput.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Advice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isGeneratingAdvice
          ? [...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))
          : advice.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getAdviceIcon(item.type)}
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">{item.description}</p>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Action Items:</h4>
                    <ul className="space-y-1">
                      {item.actionItems.map((action, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-start space-x-2"
                        >
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {item.estimatedImpact && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-2">
                        Estimated Impact:
                      </h4>
                      <div className="space-y-1">
                        {item.estimatedImpact.savings && (
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>
                              Save ₦
                              {item.estimatedImpact.savings.toLocaleString()}
                              /month
                            </span>
                          </div>
                        )}
                        {item.estimatedImpact.returns && (
                          <div className="flex items-center space-x-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span>
                              {item.estimatedImpact.returns}% potential returns
                            </span>
                          </div>
                        )}
                        {item.estimatedImpact.risk && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Shield className="w-4 h-4 text-yellow-600" />
                            <span>Risk level: {item.estimatedImpact.risk}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        {item.confidence}% confidence
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">Get Advice</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={generateFinancialAdvice}
            >
              <Lightbulb className="w-6 h-6" />
              <span className="text-sm">Refresh Insights</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Target className="w-6 h-6" />
              <span className="text-sm">Set Goals</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">Portfolio Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}