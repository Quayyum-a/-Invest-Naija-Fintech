import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoPrice {
  symbol: string;
  price: number;
  change: number;
}

export default function CryptoTicker() {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([
    { symbol: "BTC", price: 43250.45, change: 2.45 },
    { symbol: "ETH", price: 2650.75, change: -1.23 },
    { symbol: "BNB", price: 312.45, change: 3.67 },
    { symbol: "ADA", price: 0.485, change: -2.15 },
  ]);

  useEffect(() => {
    // Simulate price updates
    const interval = setInterval(() => {
      setCryptoPrices((prev) =>
        prev.map((crypto) => ({
          ...crypto,
          price: crypto.price * (1 + (Math.random() - 0.5) * 0.001),
          change: crypto.change + (Math.random() - 0.5) * 0.1,
        })),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-gray-900 text-white py-2 overflow-hidden">
      <div
        className="flex space-x-8"
        style={{
          animation: "scroll 30s linear infinite",
        }}
      >
        {cryptoPrices.map((crypto, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <span className="font-bold">{crypto.symbol}</span>
            <span className="font-mono">{formatPrice(crypto.price)}</span>
            <div
              className={`flex items-center text-sm ${
                crypto.change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {crypto.change >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {crypto.change >= 0 ? "+" : ""}
              {crypto.change.toFixed(2)}%
            </div>
          </div>
        ))}
        {/* Duplicate for seamless scroll */}
        {cryptoPrices.map((crypto, index) => (
          <div
            key={`dup-${index}`}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <span className="font-bold">{crypto.symbol}</span>
            <span className="font-mono">{formatPrice(crypto.price)}</span>
            <div
              className={`flex items-center text-sm ${
                crypto.change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {crypto.change >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {crypto.change >= 0 ? "+" : ""}
              {crypto.change.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}
      </style>
    </div>
  );
}
