import sharp from 'sharp';
interface GenerateImageParams {
    weather: string;
    ethPrice: number;
    level: number;
  }

export async function generateImage({ weather, ethPrice, level }:GenerateImageParams) {
  const overlayText = `${weather} | ${ethPrice} | Level ${level}`;

  return await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    }
  })
  .composite([
    {
      input: Buffer.from(`<svg><text x="10" y="50" font-size="24" fill="white">${overlayText}</text></svg>`),
      top: 200,
      left: 50,
    },
  ])
  .png()
  .toBuffer();
}
