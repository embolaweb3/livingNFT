
"use client";
import { waitForTransactionReceipt } from "wagmi/actions";
import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract } from "wagmi";
import { createCoinCall } from "@zoralabs/coins-sdk";
import { Address } from "viem";
import { base } from "viem/chains";
import Navbar from "./components/Header";
import { config } from "./utils/wagmiConfig";
import { toast } from "react-toastify";
import TradingInterface from "./components/TradingInterface";

export default function Home() {
  const { address } = useAccount();
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [ipfsUri, setIpfsUri] = useState<string>("");
  const [status, setStatus] = useState("idle");

  const { writeContract } = useWriteContract();

  const handleSubmit = async () => {
    if (!address || !name || !symbol || !desc || !image) return;
    setStatus("uploading");

    try {
      // Upload image
      const fileData = new FormData();
      fileData.append("file", image);
      const imgUpload = await fetch("/api/upload-file", {
        method: "POST",
        body: fileData,
      }).then((res) => res.json());

      if (!imgUpload.pinataURL) throw new Error("Image upload failed");
      const pinataImageURI = imgUpload.pinataURL;

      // Upload metadata
      const metadata = {
        name,
        description: desc,
        image: pinataImageURI,
        properties: { creator: address },
      };

      // const formData = new FormData();
      // formData.append('metadata', JSON.stringify(metadata));

      const metaUpload = await fetch("/api/upload-json", {
        method: "POST",
        body: JSON.stringify(metadata),
      }).then((res) => res.json());

      if (!metaUpload.pinataURL) throw new Error("Metadata upload failed");
      const pinataMetadataURI = metaUpload.pinataURL;

      setIpfsUri(pinataMetadataURI);
      setStatus("creating");

      // Prepare contract call
      const coinParams = {
        name,
        symbol,
        uri: pinataMetadataURI,
        payoutRecipient: address as Address,
        platformReferrer: address as Address,
      };

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
        onSuccess: async(data) => {
          setStatus("done");

          const receipt = await waitForTransactionReceipt(config, {
            hash: data,
            chainId: base.id,
          });

          console.log("Transaction receipt:", receipt);
          // Get previous created coins
          const existingCreatedCoins = JSON.parse(
            localStorage.getItem("createdCoins") || "[]"
          ) as Address[];

          // Add new created coin
          const updatedCreatedCoins = [
            ...existingCreatedCoins,
            receipt.logs[0].address as Address,
          ];

          // Save back
          localStorage.setItem(
            "createdCoins",
            JSON.stringify(updatedCreatedCoins)
          );

          toast.success(
            <div>
              🚀 Coin created!
              <br />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data);
                  toast.info("Txhash copied to clipboard!");
                }}
                className="text-blue-500 underline"
              >
                Copy Txhash
              </button>
            </div>
          );
        },
        onError: (error) => {
          console.error("Contract write error:", error);
          setStatus("error");
          toast.error("Failed to deploy coin. Try again.");
        },
      });
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-900">
      <Navbar />
     <div className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-700/30">
  <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
    🚀 Create Living Coin
  </h1>
  
  <div className="space-y-4">
    <div>
      <label className="block text-gray-300 mb-1 text-sm font-medium">Coin Name</label>
      <input
        type="text"
        placeholder="e.g. Ethereum Evolved"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-gray-300 mb-1 text-sm font-medium">Symbol</label>
      <input
        type="text"
        placeholder="e.g. EVO"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-gray-300 mb-1 text-sm font-medium">Description</label>
      <textarea
        placeholder="Describe your coin's purpose..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={3}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-gray-300 mb-1 text-sm font-medium">Logo Image</label>
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">{image?.name || "PNG, JPG up to 5MB"}</p>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImage(e.target.files?.[0] || null)} 
            className="hidden" 
          />
        </label>
      </div>
    </div>

    <button
      onClick={handleSubmit}
      disabled={status === "uploading" || status === "creating"}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
        status === "error" 
          ? "bg-red-600 hover:bg-red-700" 
          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      } shadow-lg hover:shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {status === "uploading" ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Uploading to IPFS...
        </span>
      ) : status === "creating" ? (
        "Deploying Coin..."
      ) : status === "error" ? (
        "Error - Try Again"
      ) : (
        "Create Coin"
      )}
    </button>

    {ipfsUri && (
      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
        <p className="text-sm text-gray-300 mb-1">Metadata URI:</p>
        <a 
          href={ipfsUri} 
          className="text-blue-400 hover:text-blue-300 text-sm break-all underline underline-offset-2" 
          target="_blank"
          rel="noopener noreferrer"
        >
          {ipfsUri}
        </a>
      </div>
    )}
  </div>
</div>
    <div className="max-w-5xl mx-auto mt-10">
  <h2 className="text-xl font-bold text-gray-600 mb-4">📊 Live Token Trading</h2>
  <TradingInterface />
</div>
    </main>
  );
}
