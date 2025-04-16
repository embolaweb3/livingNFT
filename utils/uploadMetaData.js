import { uploadJSONToIPFS } from "./pinata.js";

const metaData = {
    name: "Living NFT #1",
    description: "This NFT evolves based on real-world data.",
    image: "https://gateway.pinata.cloud/ipfs/QmdhbvNzNDsFXqGEc8toEKtx4s24hELSGEp5uTTNSJDU1w",
    properties: {
        "weather": "Clear",
        "ethPrice": "$3,000",
        "season": "Spring",
        "level": 1
    }
};


(async () => {
    const metadataCID = await uploadJSONToIPFS(metaData);
    console.log("Metadata IPFS:", metadataCID);
})();
