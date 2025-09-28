import { 
  Connection, 
  PublicKey, 
  Keypair, 
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import fs from 'fs';
import os from 'os';

const PROGRAM_ID = new PublicKey("your-program-id");

const connection = new Connection("your-rpc-url", "confirmed");

// Instruction discriminator for initialize_global_authority (from your IDL)
const INITIALIZE_GLOBAL_AUTHORITY_DISCRIMINATOR = Buffer.from([76, 115, 176, 42, 255, 174, 171, 99]);

async function main() {
  console.log("Initializing Global Authority...\n");
  
  // Load your staking wallet
  const walletPath = os.homedir() + '/.config/solana/staking-wallet.json';
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  
  console.log("Payer:", payer.publicKey.toBase58());
  console.log("Program ID:", PROGRAM_ID.toBase58());
  
  try {
    // Find global mint authority PDA
    const [globalMintAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_mint_authority")],
      PROGRAM_ID
    );
    
    console.log("Global Mint Authority PDA:", globalMintAuthorityPDA.toBase58());
    
    // Check if already initialized
    const globalAuthorityInfo = await connection.getAccountInfo(globalMintAuthorityPDA);
    if (globalAuthorityInfo) {
      console.log("Global mint authority already exists!");
      return;
    }
    
    // Create initialize instruction
    const initGlobalKeys = [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: globalMintAuthorityPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ];
    
    const initGlobalIx = new TransactionInstruction({
      keys: initGlobalKeys,
      programId: PROGRAM_ID,
      data: INITIALIZE_GLOBAL_AUTHORITY_DISCRIMINATOR
    });
    
    const initTx = new Transaction().add(initGlobalIx);
    const initSig = await sendAndConfirmTransaction(connection, initTx, [payer]);
    console.log("Global mint authority initialized:", initSig);
    
    console.log("\nInitialization Complete!");
    console.log("Global Mint Authority PDA:", globalMintAuthorityPDA.toBase58());
    
  } catch (error) {
    console.error("Initialization failed:", error.message);
    console.error(error);
  }
}

main().catch(console.error);