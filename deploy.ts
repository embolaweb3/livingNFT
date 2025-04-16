import { createCoin, CreateCoinArgs, getCoin, validateMetadataURIContent, ValidMetadataURI } from "@zoralabs/coins-sdk";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";

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


const coinParams : CreateCoinArgs = {
    name: "Living NFT #1",
    symbol: "LTN",
    uri: "ipfs://bafkreibzvsxu7tw4u3r5dl2suz3sypq4tpc2f4bjmbh2xlhh75ixaukw64",
    payoutRecipient: account.address,
  };
async function createMyCoin(coinParams: CreateCoinArgs) {
    try {
        const result = await createCoin(coinParams, walletClient, publicClient);

        console.log("Transaction hash:", result.hash);
        console.log("Coin address:", result.address);
        console.log("Deployment details:", result.deployment);

        return result;
    } catch (error) {
        console.error("Error creating coin:", error);
        throw error;
    }
}

export async function fetchSingleCoin(address: string, chain: number) {
    const response = await getCoin({
        address,
        chain,
    });

    const coin = response.data?.zora20Token;

    if (coin) {
        console.log("Coin Details:");
        console.log("- Name:", coin.name);
        console.log("- Symbol:", coin.symbol);
        console.log("- Description:", coin.description);
        console.log("- Total Supply:", coin.totalSupply);
        console.log("- Market Cap:", coin.marketCap);
        console.log("- 24h Volume:", coin.volume24h);
        console.log("- Creator:", coin.creatorAddress);
        console.log("- Created At:", coin.createdAt);
        console.log("- Unique Holders:", coin.uniqueHolders);

        console.log("Coin object:", coin)
    }

    return response;
}

function isValidMetadataURI(uri: string): uri is ValidMetadataURI {
    return (
        uri.startsWith('ipfs://') ||
        uri.startsWith('ar://') ||
        uri.startsWith('data:') ||
        uri.startsWith('https://')
    );
}

async function isUriValid(uri: string) {
    if (!isValidMetadataURI(uri)) {
        throw new Error('Invalid metadata URI format. Must start with ipfs://, ar://, data:, or https://');
    }
    try {
        const result = await validateMetadataURIContent(uri);
        console.log("Validation result:", result);
        return result;
    } catch (error) {
        console.error("Error validating URI:", error);
        throw error;
    }
}

const main = async () => {
    //await isUriValid("ipfs://bafkreicevxuczb6bgtqsnq7p7qydpvsgmg2pp3llwgxipzzeby5cs2quke");
    await createMyCoin(coinParams);
    // await fetchSingleCoin("0x8Ff1f3927165520e4e896d5bD672155A4935B6a6", base.id);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});