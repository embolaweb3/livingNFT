"use client"
import { useEffect, useState } from 'react';
import { fetchSingleCoin } from '../utils/fetchSingleCoin';
import Navbar from '../components/Header';
import { base } from "viem/chains";
import { staticDemoCoins } from '../utils/demoCoins';
import { fetchMetadataFromIPFS } from '../utils/fetchMetadataFromIPFS';

interface Coin {
  name: string;
  symbol: string;
  description: string;
  address: string;
  tokenUri?: string;
  creatorAddress: string;

};



export default function Gallery() {
  const [coinAddresses, setCoinAddresses] = useState<string[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [manualAddress, setManualAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const created = JSON.parse(localStorage.getItem('createdCoins') || '[]') as string[];
    const evolved = JSON.parse(localStorage.getItem('evolvedCoins') || '[]') as string[];
    const all = Array.from(new Set([...created, ...evolved]));
      // Remove duplicates if user already has any of the static examples
    const mergedAddresses = [
      ...all,
      ...staticDemoCoins.filter(addr => !all.includes(addr)),
    ];

    setCoinAddresses(evolved);
  }, []);

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      try {
        const promises = coinAddresses.map(address =>
          fetchSingleCoin(address, base.id).then(res => res.data?.zora20Token)
        );
        const results = await Promise.all(promises);
        const validCoins = results.filter(Boolean);

        setCoins(validCoins);

        // Fetch metadata for each
        for (const coin of validCoins as Coin[]) {
          if (coin?.tokenUri) {
            try {
              const meta = await fetchMetadataFromIPFS(coin.tokenUri);
              setMetadata(prev => ({ ...prev, [coin.address]: meta }));
            } catch (e) {
              console.error('Failed fetching metadata for', coin.address);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load coins.');
      }
      setLoading(false);
    };

    if (coinAddresses.length > 0) {
      fetchCoins();
    }
  }, [coinAddresses]);

  const handleManualSearch = async () => {
    if (!manualAddress) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchSingleCoin(manualAddress, base.id);
      const result = res.data?.zora20Token;
      if (!result) {
        setError('Coin not found. Double-check the address.');
      } else {
        setCoins(prev => [result as Coin, ...prev.filter(c => c.address !== result.address)]);
        if ((result as Coin).tokenUri) {
          const meta = await fetchMetadataFromIPFS((result as Coin).tokenUri!);
          setMetadata(prev => ({ ...prev, [result.address]: meta }));
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch coin.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl text-gray-700 font-bold mb-6 text-center">🖼 Your Living Coins</h1>

        {/* Manual Search */}
        <div className="max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Enter Coin Address"
            value={manualAddress}
            onChange={e => setManualAddress(e.target.value)}
            className="w-full text-gray-400 p-2 border rounded mb-2"
          />
          <button
            onClick={handleManualSearch}
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            {loading ? 'Searching...' : 'Search Coin'}
          </button>
          {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        </div>

        {/* Gallery */}
        {coins.length === 0 && !loading && (
          <p className="text-center text-gray-500">No coins found. Create or evolve a coin first!</p>
        )}

       <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {coins.map((coin) => {
    const meta = metadata[coin.address];

    return (
      <div 
        key={coin.address} 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:shadow-indigo-500/20"
      >
        <div className="p-5 flex flex-col h-full">
          <div className="relative overflow-hidden rounded-lg mb-4">
            <img
              src={
                meta?.image
                  ? meta.image.startsWith('ipfs://')
                    ? meta.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                    : meta.image
                  : '/fallback.png'
              }
              alt={meta?.name || coin.name}
              className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white text-xs px-2 py-1 rounded">
              {coin.symbol}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 line-clamp-1">
            {meta?.name || coin.name}
          </h2>
          
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {meta?.description || coin.description}
          </p>

          {meta?.properties && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-800/50 rounded p-2">
                <p className="text-indigo-400 text-xs font-medium">Level</p>
                <p className="text-white text-sm">{meta.properties.level}</p>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <p className="text-indigo-400 text-xs font-medium">Weather</p>
                <p className="text-white text-sm">{meta.properties.weather}</p>
              </div>
              <div className="bg-gray-800/50 rounded p-2 col-span-2">
                <p className="text-indigo-400 text-xs font-medium">ETH Price</p>
                <p className="text-white text-sm font-mono">{meta.properties.ethPrice} ETH</p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400">
              <div>
                <p className="font-medium text-gray-300">Creator</p>
                <p className="truncate max-w-[120px]">{coin.creatorAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-300">Created</p>
                <p>{new Date(coin.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                <span className="font-medium text-gray-300 mr-1">Holders:</span>
                {coin.uniqueHolders}
              </span>
              <button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full transition-colors">
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
      </div>
    </main>
  );
}
