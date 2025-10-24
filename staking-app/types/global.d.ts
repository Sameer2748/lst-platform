// Global type declarations for wallet integration

interface SolanaProvider {
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  isConnected: boolean;
  publicKey: { toString(): string } | null;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

export {};
