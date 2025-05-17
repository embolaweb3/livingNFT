"use client";
import React, { useState } from "react";
import { waitForTransactionReceipt } from "wagmi/actions";
import { getWeather, getETHPriceUSD } from "../utils/dataFetchers";
import { config } from "../utils/wagmiConfig";
import Navbar from "../components/Header";
import { Address } from "viem";
import { toast } from "react-toastify";
import { base } from "viem/chains";
import { updateCoinURICall } from "@zoralabs/coins-sdk";
import { useAccount, useWriteContract } from "wagmi";
import { fetchSingleCoin } from '../utils/fetchSingleCoin';


export default function Evolve() {
  const [coinAddress, setCoinAddress] = useState("");
  const [status, setStatus] = useState("idle");

  const { writeContract } = useWriteContract();

  const handleEvolve = async () => {
    setStatus("evolving");
    const weather = await getWeather();
    const ethPrice = await getETHPriceUSD();
    const level =  Math.floor(Math.random() * 5) + 1;

    const imageGenRes = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ weather, ethPrice, level }),
    });

    if (!imageGenRes.ok) {
      console.error("Image generation failed");
      setStatus("idle");
      return;
    }

    // read the image as ArrayBuffer
    const arrayBuffer = await imageGenRes.arrayBuffer();

    //  prepare FormData to upload to IPFS
    const fileData = new FormData();
    fileData.append("file", new Blob([arrayBuffer]), "evolved-image.png");

    const uploadRes = await fetch("/api/upload-file", {
      method: "POST",
      body: fileData,
    }).then((res) => res.json());

    const imageRes = await uploadRes;

    if (imageRes?.pinataURL) {
       const res = await fetchSingleCoin(coinAddress, base.id);
      const result = res.data?.zora20Token;
      const metadata = {
        name: `Evolved Coin | ${result?.name}`,
        description:`${result?.description}`,
        image: imageRes.pinataURL,
        properties: { weather, ethPrice, level },
      };

      const metaUpload = await fetch("/api/upload-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      const metaRes = await metaUpload.json();

      if (metaRes?.pinataURL) {
        // Define update parameters
        const updateParams = {
          coin: coinAddress as Address,
          newURI: metaRes.pinataURL,
        };
        const contractCallParams = updateCoinURICall(updateParams);

        // Extract the needed parameters for writeContract
        const writeParams = {
          abi: contractCallParams.abi,
          address: contractCallParams.address,
          functionName: contractCallParams.functionName,
          args: contractCallParams.args,
          value: contractCallParams.value,
          chainId: base.id,
        };

        writeContract(writeParams, {
          onSuccess: async (txHash) => {
            setStatus("done");
           
            const receipt = await waitForTransactionReceipt(config, {
              hash: txHash,
              chainId: base.id,
            });

             toast.success(
              <div>
                🚀 Coin Evolved!
                <br />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(receipt.to as Address);
                    toast.info("Evolved Coin Address copied to clipboard!");
                  }}
                  className="text-blue-500 underline"
                >
                  Copy Evolved Coin Address
                </button>
              </div>,
               {
            autoClose: false, 
            closeOnClick: false, 
          }
          );
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
            console.error("Contract write error:", error);
            setStatus("error");
            toast.error('Failed to evolve coin. Try again.');
          },
        });
      }
    } else {
      console.error("Upload failed:", imageRes.message);
      toast.error('Failed to evolve coin. Try again.');
      setStatus("idle");
    }
  };

  function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
  return (
   <main className="min-h-screen bg-gray-950 text-white p-6">
  <Navbar />
  <div className="max-w-xl mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-700/30">
    <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
      🔄 Evolve Your Coin
    </h1>
    
    <div className="space-y-6">
      <div>
        <label className="block text-gray-300 mb-2 text-sm font-medium">
          Coin Address
        </label>
        <input
          type="text"
          placeholder="0x..."
          value={coinAddress}
          onChange={(e) => setCoinAddress(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={handleEvolve}
        disabled={status === "evolving"}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
          status === "evolving"
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        } shadow-lg hover:shadow-purple-500/20`}
      >
        {status === "evolving" ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Evolving...
          </span>
        ) : (
          "Update Metadata"
        )}
      </button>
    </div>
  </div>
</main>
  );
}
