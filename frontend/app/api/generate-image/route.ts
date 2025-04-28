import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '../../utils/imageGen';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {

  try {
    const { weather, ethPrice, level } = await req.json()

    const buffer = await generateImage({ weather, ethPrice, level });

    return new NextResponse(buffer,{
      status : 200,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({
      error : 'Failed to generate image',
      status : 500
    })
  }
}
