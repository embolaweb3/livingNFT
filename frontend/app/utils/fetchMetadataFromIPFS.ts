export async function fetchMetadataFromIPFS(ipfsUri: string) {
  if (!ipfsUri.startsWith('ipfs://')) return null;
  const gatewayUrl = ipfsUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  const res = await fetch(gatewayUrl);
  if (!res.ok) throw new Error('Failed to fetch metadata from IPFS');
  return await res.json();
}