import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '../../utils/imageGen';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weather, ethPrice, level } = body;

    const buffer = await generateImage({ weather, ethPrice, level });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({
      error: 'Failed to generate image',
      details: (error as Error).message,
    }, { status: 500 });
  }
}
