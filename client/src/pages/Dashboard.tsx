import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Wallet, PiggyBank, DollarSign } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦2,350,000</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦1,850,000</div>
              <p className="text-xs text-muted-foreground">+15.2% return</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦500,000</div>
              <p className="text-xs text-muted-foreground">
                +8% interest earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Income
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦45,000</div>
              <p className="text-xs text-muted-foreground">From investments</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest financial activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Investment Return</p>
                    <p className="text-sm text-gray-500">Treasury Bill</p>
                  </div>
                  <span className="text-green-600 font-medium">+₦25,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Transfer to Savings</p>
                    <p className="text-sm text-gray-500">Auto-save</p>
                  </div>
                  <span className="text-red-600 font-medium">-₦10,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Mutual Fund Purchase</p>
                    <p className="text-sm text-gray-500">Growth Fund</p>
                  </div>
                  <span className="text-red-600 font-medium">-₦50,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Portfolio</CardTitle>
              <CardDescription>
                Your current investment allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Treasury Bills</span>
                  <span className="font-medium">60%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mutual Funds</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Fixed Deposits</span>
                  <span className="font-medium">15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
