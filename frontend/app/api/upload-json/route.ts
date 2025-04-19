import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const metadata = await req.json(); // read plain JSON body

    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          pinata_api_key: process.env.PINATA_KEY!,
          pinata_secret_api_key: process.env.PINATA_SECRET!,
        },
      }
    );

    return NextResponse.json({
      success: true,
      pinataURL: `ipfs://${res.data.IpfsHash}`,
    });
  } catch (err: any) {
    console.error('[UPLOAD JSON ERROR]', err?.response?.data || err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
