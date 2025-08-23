require('dotenv').config();
import { Keypair } from "@solana/web3.js";

import bs58 from "bs58";

export function loadPlatformWallet() {
    
  const secretBase58 = process.env.PLATFORM_WALLET_SECRET_JSON! ;
  const secret = bs58.decode(secretBase58);   // decode base58 → Uint8Array
  return Keypair.fromSecretKey(secret);
}
