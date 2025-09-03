import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Smartphone,
  Shield,
  TrendingUp,
  Wallet,
  Zap,
  Users,
  Star,
  ChevronRight,
  X,
  CheckCircle,
  Bitcoin,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CryptoTicker from "../components/CryptoTicker";

export default function Index() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-naira-green to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">₦</span>
            </div>
            <span className="font-bold text-xl text-gray-900">InvestNaija</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("security")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="hidden md:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-naira-green hover:bg-green-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Crypto Ticker */}
      <CryptoTicker />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-naira-green/10 text-naira-green border-naira-green/20">
              <Star className="w-3 h-3 mr-1" />
              Nigeria's #1 Micro-Investment App
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Start investing with just{" "}
              <span className="text-naira-green">₦100</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Automatically round up your spending and invest the spare change.
              Build wealth effortlessly with Nigeria's smartest micro-investing
              platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-naira-green hover:bg-green-600 text-white px-8 py-4 text-lg"
                >
                  Start Investing Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-naira-green" />
                SEC Compliant
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-naira-green" />
                50,000+ Active Users
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-naira-green" />
                ₦2.5B+ Invested
              </div>
            </div>
          </div>
        </div>

        {/* Floating Phone Mockup */}
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 hidden xl:block">
          <div className="w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
            <div className="w-full h-full bg-white rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="w-6 h-6 bg-naira-green rounded-full"></div>
                <div className="text-xs font-medium">InvestNaija</div>
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="bg-gradient-to-r from-naira-green to-green-600 text-white p-4 rounded-xl mb-4">
                <div className="text-xs opacity-80">Total Balance</div>
                <div className="text-xl font-bold">₦15,847.32</div>
                <div className="text-xs opacity-80">+₦247.32 this week</div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose InvestNaija?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for Nigerians, with features that make
              investing accessible to everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-naira-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Round-up Investing
                </h3>
                <p className="text-gray-600 mb-4">
                  Automatically round up purchases to the nearest ₦100 and
                  invest the spare change. Start building wealth without even
                  thinking about it.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center mb-6">
                  <Wallet className="w-6 h-6 text-naira-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Instant Naira Wallet
                </h3>
                <p className="text-gray-600 mb-4">
                  Fund your wallet instantly via bank transfer or card. Withdraw
                  anytime back to your bank account with zero hidden fees.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-naira-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Smart Portfolio
                </h3>
                <p className="text-gray-600 mb-4">
                  Invest in carefully selected money market funds and treasury
                  bills. Get competitive returns backed by Nigerian government
                  securities.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6 text-naira-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Mobile-First Design
                </h3>
                <p className="text-gray-600 mb-4">
                  Inspired by OPay's seamless experience. Fast, intuitive, and
                  designed specifically for Nigerian users on mobile.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-naira-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Bank-Level Security
                </h3>
                <p className="text-gray-600 mb-4">
                  Your funds are protected with AES-256 encryption, 2FA
                  authentication, and full compliance with CBN and SEC
                  regulations.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                  <Bitcoin className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Cryptocurrency Trading
                </h3>
                <p className="text-gray-600 mb-4">
                  Buy and sell Bitcoin, Ethereum, and other major
                  cryptocurrencies. Real-time price tracking and secure wallet
                  management.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Smart Insights
                </h3>
                <p className="text-gray-600 mb-4">
                  Track your financial health with intelligent insights,
                  spending patterns, and portfolio performance metrics.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-naira-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Gamified Experience
                </h3>
                <p className="text-gray-600 mb-4">
                  Earn badges, track streaks, and celebrate milestones as you
                  build wealth. Making investing fun and engaging for everyone.
                </p>
                <div className="flex items-center text-naira-green font-medium">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bank-Level Security
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your investments are protected with the highest security standards
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">AES-256 Encryption</h3>
                <p className="text-gray-600">
                  All your data is encrypted with military-grade security
                  standards
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">CBN Regulated</h3>
                <p className="text-gray-600">
                  Fully compliant with Central Bank of Nigeria regulations
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">2FA Protected</h3>
                <p className="text-gray-600">
                  Two-factor authentication for all sensitive operations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees. Start investing with just ₦100
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 border-naira-green relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-naira-green text-white">
                Most Popular
              </Badge>
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
                <div className="text-4xl font-bold text-naira-green mb-4">
                  ₦0
                </div>
                <p className="text-gray-600 mb-6">Monthly fee</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-naira-green mr-3" />
                    Round-up investing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-naira-green mr-3" />
                    Auto-investing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-naira-green mr-3" />
                    Money market funds
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-naira-green mr-3" />
                    24/7 customer support
                  </li>
                </ul>
                <Link to="/register">
                  <Button className="w-full bg-naira-green hover:bg-green-600 text-white">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold mb-2">Transaction Fees</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  0.5%
                </div>
                <p className="text-gray-600 mb-6">Per transaction only</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                    No monthly fees
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                    No setup fees
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                    No withdrawal fees
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                    No minimum balance
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-gray-300">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-naira-green to-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Building Wealth?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Nigerians who are already investing their spare
            change and building a better financial future.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-naira-green hover:bg-gray-50 px-8 py-4 text-lg font-medium"
            >
              Start Your Investment Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-naira-green to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">₦</span>
                </div>
                <span className="font-bold text-xl">InvestNaija</span>
              </div>
              <p className="text-gray-400 mb-4">
                Nigeria's premier micro-investing platform. Start building
                wealth with just ₦100.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 InvestNaija. All rights reserved. Licensed by SEC
              Nigeria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
