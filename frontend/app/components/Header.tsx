import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <div className="text-xl text-gray-800 font-bold">
        <Link href="/">🌱 Living NFTs</Link>
      </div>
      <nav className="flex gap-4">
        <Link href="/" className="text-gray-700 hover:underline">Home</Link>
        <Link href="/evolve" className="text-gray-700 hover:underline">Evolve</Link>
        <Link href="/gallery" className="text-gray-700 hover:underline">Gallery</Link>
      </nav>
      <ConnectButton />
    </header>
  );
}
