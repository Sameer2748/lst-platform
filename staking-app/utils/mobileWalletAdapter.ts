// utils/mobileWalletAdapter.ts
import { PublicKey, Transaction } from '@solana/web3.js';
import { 
  transact as mwaTransact,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { decode as decodeBase64 } from 'base-64';

export interface MobileWalletAdapter {
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  isConnected: boolean;
  publicKey: PublicKey | null;
}

class MobileWalletAdapterImpl implements MobileWalletAdapter {
  private _publicKey: PublicKey | null = null;
  private _isConnected = false;
  private _authToken: string | null = null;

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    try {
      console.log('Connecting to Phantom mobile wallet...');
      
      const result = await mwaTransact(async (wallet) => {
        // Request authorization
        const authResult = await wallet.authorize({
          cluster: 'devnet',
          identity: {
            name: 'SamSOL Staking',
            uri: 'https://samsolstaking.app',
          },
        });

        console.log('Authorization result:', authResult);

        // The address comes as a base64 string
        const addressBase64 = authResult.accounts[0].address;
        
        // Decode base64 to bytes
        const addressBytes = Uint8Array.from(atob(addressBase64), c => c.charCodeAt(0));
        
        // Create PublicKey from bytes
        const publicKey = new PublicKey(addressBytes);

        console.log('Decoded public key:', publicKey.toString());

        return { 
          publicKey, 
          authToken: authResult.auth_token 
        };
      });

      this._publicKey = result.publicKey;
      this._authToken = result.authToken;
      this._isConnected = true;
      
      console.log('✅ Successfully connected to wallet:', result.publicKey.toString());
      return { publicKey: result.publicKey };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Failed to connect to Phantom wallet');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mwaTransact(async (wallet) => {
        await wallet.deauthorize({ auth_token: this._authToken || '' });
      });
    } catch (error) {
      console.log('Deauthorization error (may be expected):', error);
    } finally {
      this._publicKey = null;
      this._authToken = null;
      this._isConnected = false;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._publicKey || !this._authToken) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Signing transaction...');
      
      const result = await mwaTransact(async (wallet) => {
        // Reauthorize with the stored token
        await wallet.reauthorize({
          auth_token: this._authToken || '',
          identity: {
            name: 'SamSOL Staking',
            uri: 'https://samsolstaking.app',
          },
        });

        // Sign the transaction
        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });

        return signedTransactions[0];
      });

      console.log('✅ Transaction signed successfully');
      return result;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this._publicKey || !this._authToken) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Signing multiple transactions...');
      
      const result = await mwaTransact(async (wallet) => {
        // Reauthorize with the stored token
        await wallet.reauthorize({
          auth_token: this._authToken || '',
          identity: {
            name: 'SamSOL Staking',
            uri: 'https://samsolstaking.app',
          },
        });

        // Sign all transactions
        return await wallet.signTransactions({ transactions });
      });

      console.log('✅ All transactions signed successfully');
      return result;
    } catch (error) {
      console.error('Batch signing failed:', error);
      throw error;
    }
  }
}

export const mobileWalletAdapter = new MobileWalletAdapterImpl();