import React from "react";
import InvestmentProducts from "../components/InvestmentProducts";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Investments() {
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

        <InvestmentProducts />
      </div>
    </div>
  );
}
