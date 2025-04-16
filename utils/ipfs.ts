import fs from 'fs';
import fetch from 'node-fetch'; 
import FormData from 'form-data';
import * as dotenv from 'dotenv';

dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const INFURA_SECRET_KEY = process.env.INFURA_SECRET_KEY;

if (!INFURA_PROJECT_ID || !INFURA_SECRET_KEY) {
  throw new Error('Missing Infura credentials in .env');
}

const INFURA_ENDPOINT = 'https://ipfs.infura.io:5001/api/v0/add';

export async function uploadToIPFS(filePath: string): Promise<string> {
  const file = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(INFURA_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${INFURA_PROJECT_ID}:${INFURA_SECRET_KEY}`).toString('base64'),
    },
    body: formData,
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to upload file to IPFS via Infura');
  }

  const data = await response.json();
  return `https://ipfs.io/ipfs/${data}`;
}
