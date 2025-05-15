import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent } from "@/components/ui/select";
import { useAccount } from "wagmi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from "recharts";

const tokens = [
  {
    symbol: "EVO1",
    address: "0x...evo1",
  },
  {
    symbol: "EVO2",
    address: "0x...evo2",
  },
  {
    symbol: "EVO3",
    address: "0x...evo3",
  },
];

interface ChartDataPoint {
  time: string;
  price: string;
}

export default function TradingInterface() {
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [price, setPrice] = useState("-");
  const [amount, setAmount] = useState("");
  const [isBuying, setIsBuying] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { address } = useAccount();

  
  useEffect(() => {
    async function fetchPrice() {
      const mockPrice = Math.random() * 5 + 1;
      setPrice(mockPrice.toFixed(2));
      generateChartData(mockPrice);
    }

    function generateChartData(basePrice: number) {
      const data = Array.from({ length: 10 }, (_, i) => ({
        time: `T-${10 - i}`,
        price: (basePrice + Math.random() * 0.4 - 0.2).toFixed(2),
      }));
      setChartData(data);
    }

    fetchPrice();
  }, [selectedToken]);

  const handleTrade = async () => {
    if (!address) return alert("Connect wallet first");
    // TODO: Call Zora trading SDK/contract here
    alert(`${isBuying ? "Buying" : "Selling"} ${amount} ${selectedToken.symbol} at $${price}`);
  };

  return (
   <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
  <div className="max-w-4xl mx-auto">
    <header className="mb-8 text-center">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2">
        📈 Multi-Token Trading
      </h1>
      <p className="text-gray-400 max-w-md mx-auto">
        Trade your dynamic tokens with real-time price charts
      </p>
    </header>

    <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/30">
      <CardContent className="p-6 space-y-6">
        {/* Token Selection */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">Select Token</label>
          <Select onValueChange={(val) => setSelectedToken(tokens.find(t => t.symbol === val)!)}>
            <SelectTrigger className="bg-gray-800 hover:bg-gray-750 border-gray-700 text-white h-12">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
                {selectedToken.symbol}
              </div>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {tokens.map((token) => (
                <SelectItem 
                  key={token.symbol} 
                  value={token.symbol}
                  className="hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
                    {token.symbol}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Display */}
        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <span className="text-gray-400 font-medium">Live Price</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-400">${price}</span>
            <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full">
              +2.3% ▲
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tickMargin={10}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748b" 
                domain={['auto', 'auto']} 
                tick={{ fontSize: 12 }}
                width={40}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#4ade80" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                fill="url(#priceGradient)" 
                strokeWidth={0} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trade Form */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Amount</label>
            <Input
              className="bg-gray-800 border-gray-700 text-white h-12 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold shadow-lg shadow-green-500/10"
              onClick={() => {
                setIsBuying(true);
                handleTrade();
              }}
            >
              Buy {selectedToken.symbol}
            </Button>
            <Button
              size="lg"
              className="h-14 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/10"
              onClick={() => {
                setIsBuying(false);
                handleTrade();
              }}
            >
              Sell {selectedToken.symbol}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Recent Transactions  */}
    <div className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
      {/* Transaction history  */}
      <div className="text-center text-gray-500 py-8">
        <p>Your trading history will appear here</p>
      </div>
    </div>
  </div>
</main>
  );
}
