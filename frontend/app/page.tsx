
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
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <ConnectButton />
        <h1 className="text-2xl text-gray-500 font-bold mb-4">
          🚀 Create Living Coin
        </h1>
        <input
          type="text"
          placeholder="Coin Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-gray-400 p-2 border rounded mb-2"
        />
        <input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full text-gray-400 p-2 border rounded mb-2"
        />
        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full text-gray-400 p-2 border rounded mb-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "uploading" || status === "creating"}
          className="w-full bg-blue-600 text-white py-2 rounded shadow"
        >
          {status === "uploading"
            ? "Uploading to IPFS..."
            : status === "creating"
            ? "Deploying Coin..."
            : status === "error"
            ? "Error - Try Again"
            : "Create Coin"}
        </button>
        {ipfsUri && (
          <p className="mt-4 text-green-600">
            Metadata URI:{" "}
            <a href={ipfsUri} className="underline" target="_blank">
              {ipfsUri}
            </a>
          </p>
        )}
      </div>
    <div className="max-w-5xl mx-auto mt-10">
  <h2 className="text-xl font-bold text-gray-600 mb-4">📊 Live Token Trading</h2>
  <TradingInterface />
</div>
    </main>
  );
}
