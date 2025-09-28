import { 
  Connection, 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { 
  getOrCreateAssociatedTokenAccount, 
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import bs58 from "bs58";

const PROGRAM_ID = new PublicKey("");
const SAMSOL_MINT = new PublicKey("");
// you will get this after running the script initialize-global-auth.js for your contract 
const GLOBAL_MINT_AUTHORITY_PDA = new PublicKey("");

// Instruction discriminators from your IDL
const CREATE_USER_STAKE_DISCRIMINATOR = Buffer.from([179, 34, 161, 2, 154, 58, 57, 29]);
const STAKE_DISCRIMINATOR = Buffer.from([206, 176, 202, 18, 200, 209, 179, 108]);
const UNSTAKE_DISCRIMINATOR = Buffer.from([90, 95, 107, 42, 205, 124, 50, 225]);

// Test wallet private key shuld have some sol
const TEST_PRIVATE_KEY = "your-private-key";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function serializeU64(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
}

async function main() {
  // Setup
  const connection = new Connection("your-rpc-url", "confirmed");
  
  // Create test user
  const testUser = Keypair.fromSecretKey(bs58.decode(TEST_PRIVATE_KEY));
  console.log("Test User:", testUser.publicKey.toBase58());
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("SamSOL Mint:", SAMSOL_MINT.toBase58());
  console.log("Global Authority:", GLOBAL_MINT_AUTHORITY_PDA.toBase58());
  
  try {
    // Find PDAs
    const [userStakePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_stake"), testUser.publicKey.toBuffer()],
      PROGRAM_ID
    );
    
    const [userVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_vault"), testUser.publicKey.toBuffer()],
      PROGRAM_ID
    );
    
    console.log("User Stake PDA:", userStakePDA.toBase58());
    console.log("User Vault PDA:", userVaultPDA.toBase58());
    
    console.log(" Test 1: Verify contract setup");
    
    const globalAuthorityInfo = await connection.getAccountInfo(GLOBAL_MINT_AUTHORITY_PDA);
    if (!globalAuthorityInfo) {
      throw new Error("Global mint authority not found!");
    }
    console.log(" Global mint authority exists");
    
    const mintInfo = await getMint(connection, SAMSOL_MINT);
    if (!mintInfo.mintAuthority?.equals(GLOBAL_MINT_AUTHORITY_PDA)) {
      throw new Error(`Token mint authority not set to global PDA! Current: ${mintInfo.mintAuthority?.toBase58()}`);
    }
    console.log(" Token mint authority correctly set to global PDA");
    

    console.log(" Test 2: Create user stake account");
    

    let userStakeInfo = await connection.getAccountInfo(userStakePDA);
    if (!userStakeInfo) {
      const createStakeKeys = [
        { pubkey: testUser.publicKey, isSigner: true, isWritable: true },
        { pubkey: userStakePDA, isSigner: false, isWritable: true },
        { pubkey: userVaultPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ];
      
      const createStakeIx = new TransactionInstruction({
        keys: createStakeKeys,
        programId: PROGRAM_ID,
        data: CREATE_USER_STAKE_DISCRIMINATOR
      });
      
      const createTx = new Transaction().add(createStakeIx);
      const createSig = await sendAndConfirmTransaction(connection, createTx, [testUser]);
      console.log(" User stake account created:", createSig);
      
      await sleep(2000);
    } else {
      console.log(" User stake account already exists");
    }
    

    console.log(" Test 3: Setup user token account");
    
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      testUser,
      SAMSOL_MINT,
      testUser.publicKey
    );
    console.log(" User token account:", userTokenAccount.address.toBase58());
    
    // Test 4: Stake SOL
    console.log(" Test 4: Stake SOL");
    
    const stakeAmount = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL
    
    const initialSolBalance = await connection.getBalance(testUser.publicKey);
    const initialTokenBalance = await getAccount(connection, userTokenAccount.address);
    const initialVaultBalance = await connection.getBalance(userVaultPDA);
    
    console.log("Before staking:");
    console.log(`- User SOL: ${(initialSolBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`- User SamSOL: ${initialTokenBalance.amount.toString()} tokens`);
    console.log(`- Vault SOL: ${(initialVaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    

    const stakeKeys = [
      { pubkey: testUser.publicKey, isSigner: true, isWritable: true },
      { pubkey: userStakePDA, isSigner: false, isWritable: true },
      { pubkey: userVaultPDA, isSigner: false, isWritable: true },
      { pubkey: GLOBAL_MINT_AUTHORITY_PDA, isSigner: false, isWritable: false },
      { pubkey: GLOBAL_MINT_AUTHORITY_PDA, isSigner: false, isWritable: false }, // global_mint_authority_info
      { pubkey: SAMSOL_MINT, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount.address, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];
    
    const stakeDataWithAmount = Buffer.concat([
      STAKE_DISCRIMINATOR,
      serializeU64(stakeAmount)
    ]);
    
    const stakeIx = new TransactionInstruction({
      keys: stakeKeys,
      programId: PROGRAM_ID,
      data: stakeDataWithAmount
    });
    
    const stakeTx = new Transaction().add(stakeIx);
    const stakeSig = await sendAndConfirmTransaction(connection, stakeTx, [testUser]);
    console.log(" Stake transaction:", stakeSig);
    
    await sleep(3000);
    
    // Check final balances
    const finalSolBalance = await connection.getBalance(testUser.publicKey);
    const finalTokenBalance = await getAccount(connection, userTokenAccount.address);
    const finalVaultBalance = await connection.getBalance(userVaultPDA);
    
    console.log("After staking:");
    console.log(`- User SOL: ${(finalSolBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`- User SamSOL: ${finalTokenBalance.amount.toString()} tokens`);
    console.log(`- Vault SOL: ${(finalVaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    
    // Verify stake worked
    const tokensReceived = Number(finalTokenBalance.amount) - Number(initialTokenBalance.amount);
    const vaultReceived = finalVaultBalance - initialVaultBalance;
    
    console.log("Verification:");
    console.log(`- Tokens received: ${tokensReceived} (expected: ${stakeAmount})`);
    console.log(`- Vault received: ${vaultReceived} (expected: ${stakeAmount})`);
    
    if (tokensReceived === stakeAmount && vaultReceived === stakeAmount) {
      console.log(" Staking successful!");
    } else {
      console.log(" Staking verification failed");
    }
    
    // Test 5: Unstake partial amount
    console.log("\n💸 Test 5: Unstake partial SOL");
    
    const unstakeAmount = 0.05 * LAMPORTS_PER_SOL; // 0.05 SOL
    
    const preUnstakeSol = await connection.getBalance(testUser.publicKey);
    const preUnstakeTokens = await getAccount(connection, userTokenAccount.address);
    const preUnstakeVault = await connection.getBalance(userVaultPDA);
    
    console.log("Before unstaking:");
    console.log(`- User SOL: ${(preUnstakeSol / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`- User SamSOL: ${preUnstakeTokens.amount.toString()} tokens`);
    console.log(`- Vault SOL: ${(preUnstakeVault / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    
    // Create unstake instruction
    const unstakeKeys = [
      { pubkey: testUser.publicKey, isSigner: true, isWritable: true },
      { pubkey: userStakePDA, isSigner: false, isWritable: true },
      { pubkey: userVaultPDA, isSigner: false, isWritable: true },
      { pubkey: GLOBAL_MINT_AUTHORITY_PDA, isSigner: false, isWritable: false },
      { pubkey: SAMSOL_MINT, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount.address, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];
    
    const unstakeDataWithAmount = Buffer.concat([
      UNSTAKE_DISCRIMINATOR,
      serializeU64(unstakeAmount)
    ]);
    
    const unstakeIx = new TransactionInstruction({
      keys: unstakeKeys,
      programId: PROGRAM_ID,
      data: unstakeDataWithAmount
    });
    
    const unstakeTx = new Transaction().add(unstakeIx);
    const unstakeSig = await sendAndConfirmTransaction(connection, unstakeTx, [testUser]);
    console.log(" Unstake transaction:", unstakeSig);
    
    await sleep(3000);
    
    // Check final balances
    const postUnstakeSol = await connection.getBalance(testUser.publicKey);
    const postUnstakeTokens = await getAccount(connection, userTokenAccount.address);
    const postUnstakeVault = await connection.getBalance(userVaultPDA);
    
    console.log("After unstaking:");
    console.log(`- User SOL: ${(postUnstakeSol / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`- User SamSOL: ${postUnstakeTokens.amount.toString()} tokens`);
    console.log(`- Vault SOL: ${(postUnstakeVault / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    
    // Verify unstake worked
    const tokensBurned = Number(preUnstakeTokens.amount) - Number(postUnstakeTokens.amount);
    const vaultReduced = preUnstakeVault - postUnstakeVault;
    
    console.log("Verification:");
    console.log(`- Tokens burned: ${tokensBurned} (expected: ${unstakeAmount})`);
    console.log(`- Vault reduced: ${vaultReduced} (expected: ${unstakeAmount})`);
    
    if (tokensBurned === unstakeAmount && vaultReduced === unstakeAmount) {
      console.log(" Unstaking successful!");
    } else {
      console.log(" Unstaking verification failed");
    }
    
  } catch (error) {
    console.error(" Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

main().catch(console.error);