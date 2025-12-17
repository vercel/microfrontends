export function generatePortFromName({
  name,
  minPort = 3000,
  maxPort = 8000,
}: {
  name: string;
  minPort?: number;
  maxPort?: number;
}): number {
  if (!name) {
    throw new Error('Name is required to generate a port');
  }

  // hash the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    // Convert to 32-bit
    hash |= 0;
  }
  hash = Math.abs(hash);

  // Map the hash to the port range
  const range = maxPort - minPort;
  const port = minPort + (hash % range);

  return port;
}
