"use client"
import { useState } from 'react';
import { updateCoinMetadata } from '../utils/updateCoinMetadata';
import { getWeather, getETHPriceUSD } from '../utils/dataFetchers';
import { generateImage } from '../utils/imageGen';
import { Readable } from 'stream';
import Navbar from '../components/Header';
import { Address } from 'viem';
import { updateCoinURICall } from "@zoralabs/coins-sdk";
import { useContractWrite, useSimulateContract } from "wagmi";
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

    const { imageBuffer } = await imageGenRes.json();

    const fileData = new FormData();
    fileData.append('file', new Blob([new Uint8Array(imageBuffer)]), 'evolved-image.png');

    const uploadRes = await fetch('/api/upload-file', {
      method: 'POST',
      body: fileData,
    }).then(res => res.json());

    const imageRes = await uploadRes.json();

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
        abi: (await contractCallParams).abi,
        address: (await contractCallParams).address,
        functionName: (await contractCallParams).functionName,
        args: (await contractCallParams).args,
        value: (await contractCallParams).value,
        chainId: base.id,
      };

      writeContract(writeParams,{
        onSuccess : (txHash)=>{
          setStatus('done');
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