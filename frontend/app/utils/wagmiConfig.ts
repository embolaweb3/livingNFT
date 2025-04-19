'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Living Coin',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, 
  chains: [base, baseSepolia],
  ssr: true,
});
