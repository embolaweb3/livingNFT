'use client';

import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './utils/wagmiConfig';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider>
              {children}
              <ToastContainer />
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
