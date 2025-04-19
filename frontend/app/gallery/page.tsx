"use client"

import { useState } from 'react';
import { fetchSingleCoin } from '../utils/fetchSingleCoin';
import Navbar from '../components/Header';
import { base } from "viem/chains";


export default function Gallery() {
  const [coinAddress, setCoinAddress] = useState('');
  const [coin, setCoin] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!coinAddress) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchSingleCoin(coinAddress,base.id);
      const result = res.data?.zora20Token;
      if (!result) {
        setError('Coin not found. Double-check the address.');
      } else {
        setCoin(result);
        console.log(coin)
      }
    } catch (err) {
      setError('Failed to fetch coin data.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100">
      <Navbar />
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4">🖼 View Your Living Coin</h1>
        <input
          type="text"
          placeholder="Enter Coin Address"
          value={coinAddress}
          onChange={e => setCoinAddress(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleFetch}
          className="w-full bg-indigo-600 text-white py-2 rounded"
        >
          {loading ? 'Loading...' : 'Load Coin'}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}

        {coin && (
          <div className="mt-6 space-y-3">
            <img
              src={coin.mediaContent?.previewImage || '/fallback.png'}
              alt={coin.name}
              className="w-full h-auto rounded"
            />
            <h2 className="text-2xl font-semibold">{coin.name} ({coin.symbol})</h2>
            <p className="text-gray-700">{coin.description}</p>

            {coin && (
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
                <p><strong>Level:</strong> {coin.properties?.level}</p>
                <p><strong>Weather:</strong> {coin.properties?.weather}</p>
                <p><strong>ETH Price:</strong> {coin.properties?.ethPrice}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-4">
              <p><strong>Creator:</strong> {coin.creatorAddress}</p>
              <p><strong>Created:</strong> {new Date(coin.createdAt).toLocaleString()}</p>
              <p><strong>Holders:</strong> {coin.uniqueHolders}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
