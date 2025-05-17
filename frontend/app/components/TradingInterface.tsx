"use client";
import { useState, useEffect, useMemo } from 'react';
import { tradeCoinCall, getCoinsTopVolume24h } from "@zoralabs/coins-sdk";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Address, parseEther, formatEther } from "viem";
import { base } from "viem/chains";
import { CardContent,Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SelectTrigger,SelectItem,SelectContent } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { toast } from "react-toastify";


// ERC20 ABI for balance checking
const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

interface Token {
  symbol: string;
  address: Address;
  name: string;
  volume24h?: string;
  marketCap?: string;
}

interface Transaction {
  hash: Address;
  type: 'buy' | 'sell';
  amount: string;
  token: string;
  timestamp: number;
}

export default function TradingInterface() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [price, setPrice] = useState("0.00");
  const [amount, setAmount] = useState("");
  const [priceInETH, setPriceInETH] = useState(0); 
  const [priceInUSD, setPriceInUSD] = useState(0); 
  const [userBalance, setUserBalance] = useState("0");
  const [chartData, setChartData] = useState<{ time: string; price: string }[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [priceChange, setPriceChange] = useState(0);

  // Fetch top 10 volume coins
  useEffect(() => {
    const fetchTopCoins = async () => {
      try {
        setIsLoadingTokens(true);
        const response = await getCoinsTopVolume24h({ count: 10 });
      const fetchedTokens = response.data?.exploreList?.edges?.map((edge: any) => ({
  symbol: edge.node.symbol,
  address: edge.node.address,
  name: edge.node.name,
  volume24h: edge.node.volume24h,
  coingeckoId: edge.node.name.toLowerCase().replace(/\s+/g, '-') // Auto-generate ID
})) || [];
        
        setTokens(fetchedTokens);
        if (fetchedTokens.length > 0) {
          setSelectedToken(fetchedTokens[0]);
        }
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchTopCoins();
  }, []);

  const fetchRealPrice = async (token: Token) => {
  // Generate CoinGecko ID from token name
  const coingeckoId = token.name
    .toLowerCase()
    .replace(/\s+/g, '-')    // Replace spaces with -
    .replace(/[^a-z0-9-]/g, ''); // Remove special chars

  try {
    console.log(coingeckoId)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) throw new Error('Failed to fetch price');
    
    const data = await response.json();
    console.log(data,'data')
    // Handle case where token exists but has no price data yet
    if (!data[coingeckoId]) {
      toast.error(`${token.name} has no price feed, select another one`)
      return { price: "0.00", change: 0 };
    }

    return {
      price: data[coingeckoId].usd || "0.00",
      change: data[coingeckoId].usd_24h_change?.toFixed(2) || 0
    };
  } catch (error) {
    console.error(`Price fetch failed for ${token.name}:`, error);
    return { price: "0.00", change: 0 };
  }
};

useEffect(() => {
  if (!selectedToken) return;

  const updatePrice = async () => {
    const { price, change } = await fetchRealPrice(selectedToken);
    console.log(price,'aa')
    setPrice(price);
    setPriceChange(change);
    
    setChartData(prev => [...prev.slice(-29), { // Keep last 30 points
      time: new Date().toLocaleTimeString(),
      price: price
      
    }]);

      const coingeckoId = selectedToken.name.toLowerCase().replace(/\s+/g, '-');
        const cgResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd,eth`
        );
        const cgData = await cgResponse.json();
        
        if (cgData[coingeckoId]) {
          setPriceInETH(cgData[coingeckoId].eth || 0);
          setPriceInUSD(cgData[coingeckoId].usd || 0);
        }
  };

  // First update immediately
  updatePrice(); 
  
  // Then update every 30 seconds
  const interval = setInterval(updatePrice, 30000);
  return () => clearInterval(interval);
}, [selectedToken]);
 

  //  Fetch user token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedToken?.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!]
  })as {
  data: bigint | undefined;
  refetch: () => void;
};;

    const { ethValue, usdValue } = useMemo(() => {
    const tokenAmount = parseFloat(amount) || 0;
    return {
      ethValue: (tokenAmount * priceInETH).toFixed(6),
      usdValue: (tokenAmount * priceInUSD)
    };
  }, [amount, priceInETH, priceInUSD]);

  // Trade functions
  const { 
    writeContract: buy, 
    data: buyHash,
    isPending: isBuyPending,
    error: buyError,
    reset: resetBuy,
    isSuccess : buySuccess
  } = useWriteContract();

  const { 
    writeContract: sell, 
    data: sellHash,
    isPending: isSellPending,
    error: sellError,
    reset: resetSell,
    isSuccess : sellSuccess
  } = useWriteContract();

  // Transaction receipts
  const { isLoading: isBuyConfirming,isSuccess: isBuyConfirmed  } = useWaitForTransactionReceipt({ hash: buyHash });
  const { isLoading: isSellConfirming, isSuccess: isSellConfirmed  } = useWaitForTransactionReceipt({ hash: sellHash });

  
  useEffect(() => {
  if (isBuyConfirmed) {
    toast.success('Coin bought successfully');
    resetBuy(); // Reset the buy state after showing toast
    refetchBalance();
  }
}, [isBuyConfirmed]);

useEffect(() => {
  if (isSellConfirmed) {
    toast.success('Coin sold successfully');
    resetSell(); // Reset the sell state after showing toast
    refetchBalance();
  }
}, [isSellConfirmed]);

   const handleTrade = (direction: "buy" | "sell") => {
    if (!address) return toast.warning("Connect wallet first");
    if (!amount || isNaN(parseFloat(amount))) return toast.error("Invalid amount");

    const tradeConfig = {
      direction,
      target: selectedToken!.address,
      args: {
        recipient: address,
        orderSize: parseEther(ethValue),
        minAmountOut: BigInt(0),
        tradeReferrer: "0x0000000000000000000000000000000000000000" as Address,
      }
    };

    const params = {
      ...tradeCoinCall(tradeConfig),
      value: direction === "buy" ? parseEther(ethValue) : undefined,
      chainId: base.id
    };

    direction === "buy" ? buy(params) : sell(params);
    refetchBalance()
  };

 

  if (isLoadingTokens) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2 text-center">
          📈 Top Volume Trading
        </h1>

        <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/30">
          <CardContent className="p-6 space-y-6">
            {/* Token Selection */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Select Token</label>
              <Select 
                onValueChange={(val:any) => setSelectedToken(tokens.find(t => t.symbol === val) || null)}
                value={selectedToken?.symbol || ""}
              >
                <SelectTrigger className="bg-gray-800 hover:bg-gray-750 border-gray-700 text-white h-12">
                  {selectedToken ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
                      {selectedToken.symbol}
                    </div>
                  ) : "Select a token"}
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
                        <div>
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-xs text-gray-400 block">24h Vol: {token.volume24h}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              
        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label>Amount ({selectedToken?.symbol})</label>
            <span className="text-sm text-gray-500">
              {/* Balance: {userBalance} */}
            </span>
          </div>
          
          {/* <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
          /> */}
          
          <div className="text-sm text-gray-500">
            ≈ {ethValue} ETH (${usdValue})
          </div>
        </div>
            </div>

            {/* Price Display */}
           {selectedToken && (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div>
                    <span className="text-gray-400 font-medium">Live Price</span>
                    {tokenBalance !== undefined && (
                      <div className="text-xs text-gray-500">
                        Balance: {formatEther(tokenBalance).slice(0, 6)} {selectedToken.symbol}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-400">${price}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      priceChange >= 0 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange)}%
                    </span>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                      <Line type="monotone" dataKey="price" stroke="#4ade80" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Trade Form */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Amount</label>
                    <Input
                      className="bg-gray-800 border-gray-700 text-white h-12"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e:any) => setAmount(e.target.value)}
                      type="number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      disabled={isBuyPending || isBuyConfirming || !selectedToken}
                      className="h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
                      onClick={() => handleTrade("buy")}
                    >
                      {(isBuyPending || isBuyConfirming) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Spinner />
                          {isBuyConfirming ? "Confirming..." : "Buying..."}
                        </span>
                      ) : `Buy ${selectedToken?.symbol}`}
                    </Button>

                    <Button
                      size="lg"
                      disabled={isSellPending || isSellConfirming || !selectedToken}
                      className="h-14 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                      onClick={() => handleTrade("sell")}
                    >
                      {(isSellPending || isSellConfirming) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Spinner />
                          {isSellConfirming ? "Confirming..." : "Selling..."}
                        </span>
                      ) : `Sell ${selectedToken?.symbol}`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
