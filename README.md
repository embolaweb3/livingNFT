

# 🧬 Living Coin Creator — A Zora Coin SDK dApp

This project allows users to dynamically create and deploy "Living Coins" that evolve using the [Zora Coin SDK](https://docs.zora.co/docs/zora-network/sdks/coin-sdk), upload NFT metadata and images to IPFS via [Pinata](https://www.pinata.cloud/), and interact with the blockchain using [wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/), and evolve the tokens based on real-world data .

You're right — thanks for catching that. Here's how we can update both the README and the changelog to include the **evolve** feature.

---

One of the core innovations of this project is the "Living NFT" concept — tokens that evolve based on real-world data or AI logic. The metadata and image of each coin can be updated to reflect changes over time.

- Each coin stores a metadata URI on IPFS.
- Metadata can include dynamically changing traits or visual states.
- An admin or automation process (e.g., cron job, webhook) can periodically:
  - Generate updated metadata and images.
  - Re-upload to IPFS.
  - Update the URI via contract upgrade or frontend.

This makes the NFTs **dynamic** rather than static, opening up use cases like:
- Gamified progression
- AI-trained evolution (mood, traits, visuals)
- Community or event-based transformations

---


## 🚀 Features

- ✅ Upload images to IPFS via Pinata
- ✅ Upload metadata JSON to IPFS
- ✅ Create and deploy a Zora ERC-20 Coin via the Zora Coin SDK
- ✅ Evolve the tokens based on real-world data and update the tokens metadata
- ✅ Real-time user feedback with `react-toastify`
- ✅ RainbowKit for seamless wallet connection
- ✅ Deployed coins shown on a separate gallery page

---

## 📦 Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS
- **Wallets & Blockchain**: wagmi v2, Viem, RainbowKit
- **Smart Contract SDK**: Zora Coin SDK
- **File Upload**: Pinata IPFS
- **Notifications**: react-toastify

---

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/embolaweb3/livingNFT
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your environment

Create a `.env.local` file and add your Pinata API credentials:

```env
PINATA_KEY=your_pinata_api_key
PINATA_SECRET=your_pinata_secret_api_key
```

---

## 💡 How It Works

### 1. Upload Image to IPFS

A user selects an image file, which is uploaded via the `/api/upload-file` route using `formData`. The response contains the IPFS URL to be embedded in the NFT metadata.

### 2. Upload Metadata to IPFS

Metadata is built dynamically with the user’s input and posted to the `/api/upload-json` route, which uploads it to Pinata and returns the IPFS URI.

### 3. Deploy Coin via Zora Coin SDK

After IPFS upload, we build the contract call using `createCoinCall` and execute it with `useWriteContract` (from wagmi), allowing real-time interaction with the Zora protocol.


## 🧪 Sample Metadata

```json
{
  "name": "Solar Coin",
  "description": "A dynamic coin that reflects solar activity.",
  "image": "ipfs://bafybeia...",
  "properties": {
    "creator": "0xabc123..."
  }
}
```

---

## 🔔 UX Enhancements

- Toast notifications for success and error feedback using `react-toastify`.
- Smart error handling and loading states (`uploading`, `creating`, `done`, `error`).
- After deployment, users are shown the IPFS URI of the coin metadata.
- **Planned:** Redirect users to a gallery page with automatic listing of created coins.

---

## ✅ To-Do / Improvements

- [ ] Save deployed token address to a local or cloud database (for easier user tracking)
- [ ] Create a Gallery page to view all created tokens
- [ ] Add dynamic NFT traits or evolutions
- [ ] Improve error messages with more detail (e.g. Pinata limits, contract errors)

---

## 🧾 License

MIT — free to use, modify, and contribute.

---

## ✨ Credits

Built with ❤️ for a Zora hackathon using:
- [Zora Coin SDK](https://docs.zora.co/docs/zora-network/sdks/coin-sdk)
- [Wagmi](https://wagmi.sh/)
- [Pinata](https://www.pinata.cloud/)
- [Viem](https://viem.sh/)
- [RainbowKit](https://www.rainbowkit.com/)

---