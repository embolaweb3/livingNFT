import { getCoin} from "@zoralabs/coins-sdk";
import * as dotenv from "dotenv";

dotenv.config();

export async function fetchSingleCoin(address: string, chain: number) {
    const response = await getCoin({
        address,
        chain,
    });

    return response;
}