"use client"
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract } from 'wagmi';
import { createCoinCall } from '@zoralabs/coins-sdk';
import { Address } from 'viem';
import { base } from 'viem/chains';
import Navbar from './components/Header';
import { toast } from 'react-toastify';

export default function Home() {
  const { address } = useAccount();
  const [name, setName] = useState<string>('');
  const [symbol, setSymbol] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [ipfsUri, setIpfsUri] = useState<string>('');
  const [status, setStatus] = useState('idle');

  const { writeContract } = useWriteContract();

  const handleSubmit = async () => {
    if (!address || !name || !symbol || !desc || !image) return;
    setStatus('uploading');

    try {
      // Upload image
      const fileData = new FormData();
      fileData.append('file', image);
      const imgUpload = await fetch('/api/upload-file', {
        method: 'POST',
        body: fileData,
      }).then(res => res.json());

      if (!imgUpload.pinataURL) throw new Error('Image upload failed');
      const pinataImageURI = imgUpload.pinataURL;

      // Upload metadata
      const metadata = {
        name,
        description: desc,
        image: pinataImageURI,
        properties: { creator: address }
      };

      // const formData = new FormData();
      // formData.append('metadata', JSON.stringify(metadata));
      
      const metaUpload = await fetch('/api/upload-json', {
        method: 'POST',
        body: JSON.stringify(metadata),  
      }).then(res => res.json());

      if (!metaUpload.pinataURL) throw new Error('Metadata upload failed');
      const pinataMetadataURI = metaUpload.pinataURL;
      
      setIpfsUri(pinataMetadataURI);
      setStatus('creating');

      // Prepare contract call
      const coinParams = {
        name,
        symbol,
        uri: pinataMetadataURI,
        payoutRecipient: address as Address,
        platformReferrer: address as Address,
      };

      console.log(coinParams)
      const contractCallParams = createCoinCall(coinParams);
      
      // Extract the needed parameters for writeContract
      const writeParams = {
        abi: (await contractCallParams).abi,
        address: (await contractCallParams).address,
        functionName: (await contractCallParams).functionName,
        args: (await contractCallParams).args,
        value: (await contractCallParams).value,
        chainId: base.id,
      };

      // Write to contract
      writeContract(writeParams, {
        onSuccess: (data) => {
          setStatus('done');
          localStorage.setItem('lastCreatedCoin', data);
          toast.success(
            <div>
              🚀 Coin created!
              <br />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.contractAddress)
                  toast.info('Address copied to clipboard!')
                }}
                className="text-blue-500 underline"
              >
                Copy Address
              </button>
            </div>
          );
          
        },
        onError: (error) => {
          console.error('Contract write error:', error);
          setStatus('error');
          toast.error('Failed to deploy coin. Try again.');
        }
      });

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <ConnectButton />
        <h1 className="text-2xl font-bold mb-4">🚀 Create Living Coin</h1>
        <input
          type="text"
          placeholder="Coin Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <textarea
          placeholder="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={status === 'uploading' || status === 'creating'}
          className="w-full bg-blue-600 text-white py-2 rounded shadow"
        >
          {status === 'uploading' 
            ? 'Uploading to IPFS...' 
            : status === 'creating' 
              ? 'Deploying Coin...' 
              : status === 'error'
                ? 'Error - Try Again'
                : 'Create Coin'}
        </button>
        {ipfsUri && (
          <p className="mt-4 text-green-600">
            Metadata URI: <a href={ipfsUri} className="underline" target="_blank">{ipfsUri}</a>
          </p>
        )}
      </div>
    </main>
  );
}