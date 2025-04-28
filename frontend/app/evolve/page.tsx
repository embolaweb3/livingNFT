"use client"
import { useState } from 'react';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { getWeather, getETHPriceUSD } from '../utils/dataFetchers';
import { config } from '../utils/wagmiConfig';
import Navbar from '../components/Header';
import { Address } from 'viem';
import { base } from 'viem/chains';

import { updateCoinURICall } from "@zoralabs/coins-sdk";
import { useAccount, useWriteContract } from 'wagmi';


export default function Evolve() {
  const [coinAddress, setCoinAddress] = useState('');
  const [status, setStatus] = useState('idle');

    const { writeContract } = useWriteContract();

  const handleEvolve = async () => {
    setStatus('evolving');
    const weather = await getWeather();
    const ethPrice = await getETHPriceUSD();
    const level = 2;

    const imageGenRes = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ weather, ethPrice, level })
    })

    if (!imageGenRes.ok) {
      console.error('Image generation failed');
      setStatus('idle');
      return;
    }

    // read the image as ArrayBuffer
    const arrayBuffer = await imageGenRes.arrayBuffer();

    //  prepare FormData to upload to IPFS
    const fileData = new FormData();
    fileData.append('file', new Blob([arrayBuffer]), 'evolved-image.png');

    const uploadRes = await fetch('/api/upload-file', {
      method: 'POST',
      body: fileData,
    }).then(res => res.json());

    const imageRes = await uploadRes

    if (imageRes?.pinataURL) {

      const metadata = {
        name: `Evolved Coin`,
        description: 'Updated with real-world data.',
        image: imageRes.pinataURL,
        properties: { weather, ethPrice, level }
      };

      const metaUpload = await fetch('/api/upload-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      const metaRes = await metaUpload.json();

      if (metaRes?.pinataURL) {

        // Define update parameters
      const updateParams = { coin: coinAddress as Address, newURI: metaRes.pinataURL }
      const contractCallParams = updateCoinURICall(updateParams);
      
      // Extract the needed parameters for writeContract
      const writeParams = {
        abi: (contractCallParams).abi,
        address: (contractCallParams).address,
        functionName: (contractCallParams).functionName,
        args: (contractCallParams).args,
        value: (contractCallParams).value,
        chainId: base.id,
      };

      writeContract(writeParams,{
        onSuccess : async(txHash)=>{
          console.log(txHash)
          setStatus('done');
          const receipt = await waitForTransactionReceipt(config,{
            hash: txHash,
            chainId:  base.id,  
          });

          // Get previous coins
          const existingCoins = JSON.parse(
            localStorage.getItem("evolvedCoins") || "[]"
          ) as Address[];

          // Add new coin
          const updatedCoins = [...existingCoins, receipt.to as Address];

          // Save back
          localStorage.setItem("evolvedCoins", JSON.stringify(updatedCoins));
        },
        onError: (error) => {
          console.error('Contract write error:', error);
          setStatus('error');
          // toast.error('Failed to deploy coin. Try again.');
        }
      })
      }

    } else {
      console.error('Upload failed:', imageRes.message);
      setStatus('idle');
    }

  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4">🔁 Evolve Your Coin</h1>
        <input
          type="text"
          placeholder="Coin Address"
          value={coinAddress}
          onChange={e => setCoinAddress(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleEvolve}
          disabled={status === 'evolving'}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          {status === 'evolving' ? 'Evolving...' : 'Update Metadata'}
        </button>
      </div>
    </main>
  );
}