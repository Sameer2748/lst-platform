import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";
import bs58 from "bs58";


// 
const PRIVATE_KEY_BASE58 = "your-token-authority-wallet-private-key";

// NEW Token mint (your updated token)
const NEW_SAMSOL_MINT = new PublicKey("4c1zJyLyTGep3fuP4ZdPPc7PJqupDvyGD3hzSUfQBoDX");

// Program ID (NEW deployed program)
const PROGRAM_ID = new PublicKey("AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d");

// NEW seed for global mint authority
const GLOBAL_SEED = "global_mint_authority";

// -------------------------
// MAIN FUNCTION
// -------------------------
(async () => {
  try {
    // Connect to Devnet
    const connection = new Connection("your-rpc-url", "confirmed");

    // Decode Base58 private key
    const secretKey = bs58.decode(PRIVATE_KEY_BASE58);
    const wallet = Keypair.fromSecretKey(secretKey);

    console.log("Wallet public key:", wallet.publicKey.toBase58());
    console.log("New SamSOL Mint:", NEW_SAMSOL_MINT.toBase58());
    console.log("Program ID:", PROGRAM_ID.toBase58());

    // Derive GLOBAL PDA for mint authority (not user-specific)
    const [globalMintAuthorityPDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      PROGRAM_ID
    );

    console.log("Global Mint Authority PDA:", globalMintAuthorityPDA.toBase58());
    console.log("Bump:", bump);

    // Create transaction to set mint authority to GLOBAL PDA
    const tx = new Transaction().add(
      createSetAuthorityInstruction(
        NEW_SAMSOL_MINT,           // mint
        wallet.publicKey,          // current authority (your wallet)
        AuthorityType.MintTokens,  // set mint authority
        globalMintAuthorityPDA     // new authority (GLOBAL PDA)
      )
    );

    const txSig = await sendAndConfirmTransaction(connection, tx, [wallet]);
    console.log("✅ Transaction confirmed. Signature:", txSig);
    console.log(`✅ Mint authority of new SamSOL is now set to GLOBAL PDA: ${globalMintAuthorityPDA.toBase58()}`);
    
    console.log("\n🎉 Now ANY user can stake and get SamSOL tokens!");

  } catch (error) {
    console.error("❌ Error:", error);
  }
})();