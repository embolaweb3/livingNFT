"use client"
import { useEffect, useState } from 'react';
import { fetchSingleCoin } from '../utils/fetchSingleCoin';
import Navbar from '../components/Header';
import { base } from "viem/chains";
import { staticDemoCoins } from '../utils/demoCoins';

interface Coin {
  name: string;
  symbol: string;
  description: string;
  address: string;
  tokenUri?: string;
  creatorAddress: string;

};


export async function fetchMetadataFromIPFS(ipfsUri: string) {
  if (!ipfsUri.startsWith('ipfs://')) return null;
  const gatewayUrl = ipfsUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  const res = await fetch(gatewayUrl);
  if (!res.ok) throw new Error('Failed to fetch metadata from IPFS');
  return await res.json();
}

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

    setCoinAddresses(mergedAddresses);
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
    <main className="min-h-screen bg-gray-100 p-6">
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
              <div key={coin.address} className="bg-white rounded shadow p-4 flex flex-col items-center">
                <img
                  src={
                    meta?.image
                      ? meta.image.startsWith('ipfs://')
                        ? meta.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                        : meta.image
                      : '/fallback.png'
                  }
                  alt={coin.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
                <h2 className="text-xl font-semibold text-center">{meta?.name || coin.name} ({coin.symbol})</h2>
                <p className="text-gray-600 text-center text-sm mb-2">{meta?.description || coin.description}</p>

                {meta?.properties && (
                  <div className="text-xs text-gray-500 w-full mt-2">
                    <p><strong>🔢Level:</strong> {meta.properties.level}</p>
                    <p><strong>🌤 Weather:</strong> {meta.properties.weather}</p>
                    <p><strong>💰 ETH Price:</strong> {meta.properties.ethPrice}</p>
                  </div>
                )}

                <div className="text-xs text-gray-400 w-full mt-2 border-t pt-2">
                  <p><strong>Creator:</strong> {coin.creatorAddress}</p>
                  <p><strong>Created:</strong> {new Date(coin.createdAt).toLocaleString()}</p>
                  <p><strong>Holders:</strong> {coin.uniqueHolders}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
