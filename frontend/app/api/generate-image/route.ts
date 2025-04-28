import { NextApiRequest, NextApiResponse } from 'next';
import { generateImage } from '../../utils/imageGen';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { weather, ethPrice, level } = JSON.parse(req.body.toString());

    const buffer = await generateImage({ weather, ethPrice, level });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}
