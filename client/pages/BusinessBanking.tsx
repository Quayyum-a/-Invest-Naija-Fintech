import React from "react";
import BusinessAccounts from "../components/BusinessAccounts";
import BulkPayments from "../components/BulkPayments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function BusinessBanking() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accounts">Business Accounts</TabsTrigger>
            <TabsTrigger value="payments">Bulk Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <BusinessAccounts />
          </TabsContent>

          <TabsContent value="payments">
            <BulkPayments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
