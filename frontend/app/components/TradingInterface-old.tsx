// "use client";
// import { useState, useEffect, useMemo } from 'react';
// import { tradeCoinCall, getCoinsTopVolume24h } from "@zoralabs/coins-sdk";
// import { useAccount, useContractWrite, usePrepareContractWrite, useContractRead, useWriteContract } from 'wagmi';
// import { Address, parseEther, formatEther } from "viem";
// import { base } from "viem/chains";
// import { Card, CardContent, Button, Input, Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui";
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';

// // ERC20 ABI for balance checking
// const erc20Abi = [
//   {
//     constant: true,
//     inputs: [{ name: "_owner", type: "address" }],
//     name: "balanceOf",
//     outputs: [{ name: "balance", type: "uint256" }],
//     type: "function",
//   },
// ] as const;

// interface Token {
//   symbol: string;
//   address: Address;
//   name: string;
//   volume24h?: string;
//   marketCap?: string;
// }

// interface Transaction {
//   hash: Address;
//   type: 'buy' | 'sell';
//   amount: string;
//   token: string;
//   timestamp: number;
// }

// export default function TradingInterface() {
//   const { address } = useAccount();
//   const [tokens, setTokens] = useState<Token[]>([]);
//   const [selectedToken, setSelectedToken] = useState<Token | null>(null);
//   const [price, setPrice] = useState("0.00");
//   const [amount, setAmount] = useState("");
//   const [chartData, setChartData] = useState<{ time: string; price: string }[]>([]);
//   const [isLoadingTokens, setIsLoadingTokens] = useState(true);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [priceChange, setPriceChange] = useState(0);

//   // Fetch top 5 volume coins
//   useEffect(() => {
//     const fetchTopCoins = async () => {
//       try {
//         setIsLoadingTokens(true);
//         const response = await getCoinsTopVolume24h({ count: 5 });
//         const fetchedTokens = response.data?.exploreList?.edges?.map((edge: any) => ({
//           symbol: edge.node.symbol,
//           address: edge.node.address,
//           name: edge.node.name,
//           volume24h: edge.node.volume24h,
//           marketCap: edge.node.marketCap
//         })) || [];
        
//         setTokens(fetchedTokens);
//         if (fetchedTokens.length > 0) {
//           setSelectedToken(fetchedTokens[0]);
//         }
//       } catch (error) {
//         console.error("Failed to fetch tokens:", error);
//       } finally {
//         setIsLoadingTokens(false);
//       }
//     };

//     fetchTopCoins();
//   }, []);

//   // Fetch token balance
//   const { data: tokenBalance, refetch: refetchBalance } = useContractRead({
//     address: selectedToken?.address,
//     abi: erc20Abi,
//     functionName: 'balanceOf',
//     args: [address as Address],
//     // enabled: !!selectedToken && !!address,
//     // watch: true
//   });

//   // Mock price feed with change calculation - replace with real data
//   useEffect(() => {
//     if (!selectedToken) return;

//     let previousPrice = parseFloat(price);
//     const interval = setInterval(() => {
//       const newPrice = (Math.random() * 5 + 1).toFixed(2);
//       const numericNewPrice = parseFloat(newPrice);
      
//       // Calculate price change percentage
//       const change = previousPrice !== 0 
//         ? ((numericNewPrice - previousPrice) / previousPrice) * 100 
//         : 0;
      
//       setPriceChange(parseFloat(change.toFixed(2)));
//       setPrice(newPrice);
//       previousPrice = numericNewPrice;
      
//       setChartData(prev => {
//         const newData = [...prev];
//         if (newData.length >= 10) newData.shift();
//         return [...newData, { 
//           time: new Date().toLocaleTimeString(), 
//           price: newPrice 
//         }];
//       });
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [selectedToken]);


//   // Buy Configuration
//   const { config: buyConfig } = usePrepareContractWrite({
//     ...tradeCoinCall({
//       direction: "buy" as const,
//       target: selectedToken?.address as Address,
//       args: {
//         recipient: address!,
//         orderSize: parseEther(amount || "0"),
//         minAmountOut: BigInt(0),
//         tradeReferrer: "0x0000000000000000000000000000000000000000" as Address,
//       }
//     }),
//     value: parseEther(amount || "0"),
//     enabled: !!address && parseFloat(amount) > 0
//   });

//   const { 
//     writeContract: buy, 
//     status: buyStatus,
//     reset: resetBuy 
//   } = useWriteContract(buyConfig);

//   // Sell Configuration
//   const { config: sellConfig } = usePrepareContractWrite({
//     ...tradeCoinCall({
//       direction: "sell" as const,
//       target: selectedToken!.address as Address,
//       args: {
//         recipient: address!,
//         orderSize: parseEther(amount || "0"),
//         minAmountOut: BigInt(0),
//         tradeReferrer: "0x0000000000000000000000000000000000000000" as Address,
//       }
//     }),
//     enabled: !!address && parseFloat(amount) > 0
//   });

//   const { 
//     writeContract: sell, 
//     status: sellStatus,
//     reset: resetSell 
//   } = useWriteContract(sellConfig);

//   const handleTrade = (direction: 'buy' | 'sell') => {
//     if (!address) return alert("Connect wallet first");
//     if (!amount || isNaN(parseFloat(amount))) return alert("Invalid amount");

//     direction === 'buy' ? buy?.() : sell?.();
//   };

//   if (isLoadingTokens) {
//     return (
//       <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2 text-center">
//           📈 Top Volume Trading
//         </h1>

//         <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/30">
//           <CardContent className="p-6 space-y-6">
//             {/* Token Selection */}
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-300">Select Token</label>
//               <Select 
//                 onValueChange={(val) => setSelectedToken(tokens.find(t => t.symbol === val) || null)}
//                 value={selectedToken?.symbol || ""}
//               >
//                 <SelectTrigger className="bg-gray-800 hover:bg-gray-750 border-gray-700 text-white h-12">
//                   {selectedToken ? (
//                     <div className="flex items-center gap-2">
//                       <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
//                       {selectedToken.symbol}
//                     </div>
//                   ) : "Select a token"}
//                 </SelectTrigger>
//                 <SelectContent className="bg-gray-800 border-gray-700 text-white">
//                   {tokens.map((token) => (
//                     <SelectItem 
//                       key={token.symbol} 
//                       value={token.symbol}
//                       className="hover:bg-gray-700 focus:bg-gray-700"
//                     >
//                       <div className="flex items-center gap-2">
//                         <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-blue-500" />
//                         <div>
//                           <span className="font-medium">{token.symbol}</span>
//                           <span className="text-xs text-gray-400 block">Vol: {token.volume24h}</span>
//                         </div>
//                       </div>
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Price Display */}
//             {selectedToken && (
//               <>
//                 <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
//                   <div>
//                     <span className="text-gray-400 font-medium">Live Price</span>
//                     {tokenBalance !== undefined && (
//                       <div className="text-xs text-gray-500">
//                         Balance: {formatEther(tokenBalance || BigInt(0)).slice(0, 6)} {selectedToken.symbol}
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="text-2xl font-bold text-green-400">${price}</span>
//                     <span className={`text-xs px-2 py-1 rounded-full ${
//                       priceChange >= 0 
//                         ? 'bg-green-900/30 text-green-400' 
//                         : 'bg-red-900/30 text-red-400'
//                     }`}>
//                       {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange)}%
//                     </span>
//                   </div>
//                 </div>

//                 {/* Chart */}
//                 <div className="h-[250px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={chartData}>
//                       <defs>
//                         <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8}/>
//                           <stop offset="100%" stopColor="#4ade80" stopOpacity={0.1}/>
//                         </linearGradient>
//                       </defs>
//                       <XAxis dataKey="time" stroke="#64748b" tickMargin={10} tick={{ fontSize: 12 }}/>
//                       <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 12 }} width={40}/>
//                       <Tooltip contentStyle={{ 
//                         backgroundColor: '#1e293b',
//                         borderColor: '#334155',
//                         borderRadius: '0.5rem',
//                         boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
//                       }}/>
//                       <Line 
//                         type="monotone" 
//                         dataKey="price" 
//                         stroke="#4ade80" 
//                         strokeWidth={2} 
//                         dot={false}
//                         activeDot={{ r: 6, strokeWidth: 0 }}
//                       />
//                       <Area 
//                         type="monotone" 
//                         dataKey="price" 
//                         fill="url(#priceGradient)" 
//                         strokeWidth={0} 
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>

//                 {/* Trade Form */}
//                 <div className="space-y-4">
//                   <div className="space-y-1">
//                     <label className="text-sm font-medium text-gray-300">Amount</label>
//                     <Input
//                       className="bg-gray-800 border-gray-700 text-white h-12 focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       placeholder="0.00"
//                       value={amount}
//                       onChange={(e) => setAmount(e.target.value)}
//                       type="number"
//                       min="0"
//                       step="0.01"
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-3">
//                     <Button
//                       size="lg"
//                       disabled={!buy || isBuying}
//                       className={`h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold shadow-lg shadow-green-500/10 ${
//                         !buy || isBuying ? 'opacity-70' : ''
//                       }`}
//                       onClick={() => handleTrade(true)}
//                     >
//                       {isBuying ? (
//                         <span className="flex items-center justify-center gap-2">
//                           <Spinner />
//                           Buying...
//                         </span>
//                       ) : (
//                         `Buy ${selectedToken.symbol}`
//                       )}
//                     </Button>
//                     <Button
//                       size="lg"
//                       disabled={!sell || isSelling}
//                       className={`h-14 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/10 ${
//                         !sell || isSelling ? 'opacity-70' : ''
//                       }`}
//                       onClick={() => handleTrade(false)}
//                     >
//                       {isSelling ? (
//                         <span className="flex items-center justify-center gap-2">
//                           <Spinner />
//                           Selling...
//                         </span>
//                       ) : (
//                         `Sell ${selectedToken.symbol}`
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         {/* Transaction History */}
//         {transactions.length > 0 && (
//           <Card className="mt-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-lg shadow-black/30">
//             <CardContent className="p-6">
//               <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
//               <div className="space-y-3">
//                 {transactions.map((tx, index) => (
//                   <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
//                     <div className="flex items-center gap-2">
//                       <div className={`w-3 h-3 rounded-full ${
//                         tx.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
//                       }`} />
//                       <span className="font-medium">{tx.type.toUpperCase()}</span>
//                       <span className="text-gray-400">{tx.amount} {tx.token}</span>
//                     </div>
//                     <a 
//                       href={`https://basescan.org/tx/${tx.hash}`} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2"
//                     >
//                       View
//                     </a>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </main>
//   );
// }

// function Spinner() {
//   return (
//     <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
//       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//     </svg>
//   );
// }