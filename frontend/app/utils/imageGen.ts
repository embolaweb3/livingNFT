import sharp from 'sharp';

interface GenerateImageParams {
  weather: string;
  ethPrice: number;
  level: number;
}


const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!;

export async function generateImage({ weather, ethPrice, level }: GenerateImageParams) {
  const overlayText = `${weather} | ${ethPrice} | Level ${level}`;

  // Step 1: Get a relevant image from Unsplash API
  const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(weather)}&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`);
  
  if (!res.ok) {
    throw new Error(`Unsplash API failed: ${res.statusText}`);
  }

  const data = await res.json();
  const imageUrl = data.urls.regular; 

  // Step 2: Fetch the image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // Step 3: Create SVG overlay
  const svgOverlay = Buffer.from(`
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          font-family: Arial, sans-serif;
          font-size: 28px;
          fill: white;
          stroke: black;
          stroke-width: 1;
        }
      </style>
      <text x="40" y="480">${overlayText}</text>
    </svg>
  `);

  return await sharp(imageBuffer)
    .resize(512, 512)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
