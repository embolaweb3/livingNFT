import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const data = new FormData()
    data.append('file', buffer, file.name)

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
      headers: {
        ...data.getHeaders(),
        pinata_api_key: process.env.PINATA_KEY!,
        pinata_secret_api_key: process.env.PINATA_SECRET!,
      },
    })

    return NextResponse.json({
      success: true,
      pinataURL: `ipfs://${res.data.IpfsHash}`,
    })
  } catch (err: any) {
    console.error('[UPLOAD FILE ERROR]', err?.response?.data || err.message)
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

// pinataURL: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,