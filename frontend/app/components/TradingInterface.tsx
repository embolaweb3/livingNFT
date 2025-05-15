import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent } from "@/components/ui/select";
import { useAccount } from "wagmi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

export default function TradingInterface() {
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [price, setPrice] = useState("-");
  const [amount, setAmount] = useState("");
  const [isBuying, setIsBuying] = useState(true);
  const [chartData, setChartData] = useState([]);
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
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">📈 Multi-Token Trading</h1>

      <Card className="max-w-xl mx-auto bg-gray-900">
        <CardContent className="p-6 grid gap-4">
          <Select onValueChange={(val) => setSelectedToken(tokens.find(t => t.symbol === val))}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              {selectedToken.symbol}
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              {tokens.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-gray-400">Live Price: <span className="text-green-400">${price}</span></div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#ccc" />
              <YAxis stroke="#ccc" domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
              <Line type="monotone" dataKey="price" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <Input
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="flex gap-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                setIsBuying(true);
                handleTrade();
              }}
            >
              Buy
            </Button>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => {
                setIsBuying(false);
                handleTrade();
              }}
            >
              Sell
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
