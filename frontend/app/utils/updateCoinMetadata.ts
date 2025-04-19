import { createCoin, CreateCoinArgs, getCoin, validateMetadataURIContent,updateCoinURI, ValidMetadataURI } from "@zoralabs/coins-sdk";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { Address } from "viem";

dotenv.config();



if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set in .env file");
}
if (!process.env.RPC_URL) {
    throw new Error("RPC_URL is not set in .env file");
}

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

console.log("Account address:", account.address);

const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.RPC_URL),
});

const walletClient = createWalletClient({
    account: account,
    chain: base,
    transport: http(process.env.RPC_URL),
});

function convertToIpfsUri(gatewayUrl: string): string {
    // Extract the CID from the URL
    const cid = gatewayUrl.split('/ipfs/')[1];
    
    if (!cid) {
      throw new Error('Invalid IPFS gateway URL');
    }
    
    // Return as ipfs:// URI
    return `ipfs://${cid}`;
  }

type UpdateCoinURIArgs = {
    coin: Address;    
    newURI: string;
  };


export async function updateCoinMetadata(updateParams : UpdateCoinURIArgs) {
    updateParams.newURI = convertToIpfsUri(updateParams.newURI);
    const result = await updateCoinURI(updateParams, walletClient, publicClient);
    
    console.log("Transaction hash:", result.hash);
    console.log("URI updated event:", result.uriUpdated);
    
    return result;
  }