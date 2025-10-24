import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileWalletAdapter } from '../utils/mobileWalletAdapter';

interface WalletContextType {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadStoredWallet();
  }, []);

  const loadStoredWallet = async () => {
    try {
      const storedWallet = await AsyncStorage.getItem('wallet_address');
      if (storedWallet) {
        // Only set as connected if we can verify the wallet is accessible
        // For stored wallets, we'll need to reconnect to get signing capability
        // So just clear it - user needs to reconnect
        await AsyncStorage.removeItem('wallet_address');
        console.log('Previous wallet found but needs reconnection for signing capability');
      }
    } catch (error) {
      console.error('Error loading stored wallet:', error);
    }
  };

  const connect = async () => {
    if (connecting) return;
    
    setConnecting(true);
    try {
      console.log('Connecting to wallet...');
      
      // Check if we're in a web environment (for development)
      if (typeof window !== 'undefined' && window.solana) {
        // Web environment - connect to Phantom browser extension
        const response = await window.solana.connect();
        const publicKey = new PublicKey(response.publicKey.toString());
        setPublicKey(publicKey);
        setConnected(true);
        await AsyncStorage.setItem('wallet_address', publicKey.toString());
        console.log('Connected to Phantom wallet:', publicKey.toString());
      } else {
        // Mobile environment - use Mobile Wallet Adapter
        console.log('Mobile environment detected - connecting to mobile wallet');
        
        const result = await mobileWalletAdapter.connect();
        setPublicKey(result.publicKey);
        setConnected(true);
        await AsyncStorage.setItem('wallet_address', result.publicKey.toString());
        console.log('Connected to Phantom mobile wallet:', result.publicKey.toString());
      }
      
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      // Show error to user instead of falling back to demo
      throw new Error('Failed to connect to Phantom wallet. Please make sure Phantom app is installed.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await AsyncStorage.removeItem('wallet_address');
      setPublicKey(null);
      setConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Check if we're in a web environment
      if (typeof window !== 'undefined' && window.solana) {
        // Web environment - use Phantom browser extension
        const response = await window.solana.signTransaction(transaction);
        return response;
      } else {
        // Mobile environment - use Mobile Wallet Adapter
        return await mobileWalletAdapter.signTransaction(transaction);
      }
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error('Failed to sign transaction');
    }
  };

  const value: WalletContextType = {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    signTransaction: connected ? signTransaction : null,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
