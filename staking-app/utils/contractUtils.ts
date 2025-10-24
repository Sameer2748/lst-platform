// utils/contractUtils.ts - Adapted for React Native
import { 
  Connection, 
  PublicKey, 
  Keypair, 
  SystemProgram,
  TransactionInstruction,
  Transaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

export const CONTRACT_CONFIG = {
  PROGRAM_ID: new PublicKey("AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d"),
  SAMSOL_MINT: new PublicKey("4c1zJyLyTGep3fuP4ZdPPc7PJqupDvyGD3hzSUfQBoDX"),
  GLOBAL_MINT_AUTHORITY_PDA: new PublicKey("5Hg56BGr1u9xvwGPaLDWqrQ9BZ8Yk5eoPcmCyDXysWK4"),
};

const INSTRUCTION_DISCRIMINATORS = {
  CREATE_USER_STAKE: Buffer.from([179, 34, 161, 2, 154, 58, 57, 29]),
  STAKE: Buffer.from([206, 176, 202, 18, 200, 209, 179, 108]),
  UNSTAKE: Buffer.from([90, 95, 107, 42, 205, 124, 50, 225]),
};

function serializeU64(value: number): Buffer {
  const buffer = Buffer.alloc(8);
  const view = new DataView(buffer.buffer);
  view.setBigUint64(0, BigInt(value), true); 
  return buffer;
}

export function getUserStakePDA(userPublicKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_stake"), userPublicKey.toBuffer()],
    CONTRACT_CONFIG.PROGRAM_ID
  );
}

export function getUserVaultPDA(userPublicKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_vault"), userPublicKey.toBuffer()],
    CONTRACT_CONFIG.PROGRAM_ID
  );
}

export async function checkUserStakeAccount(
  connection: Connection,
  userPublicKey: PublicKey
): Promise<boolean> {
  const [userStakePDA] = getUserStakePDA(userPublicKey);
  const accountInfo = await connection.getAccountInfo(userStakePDA);
  return accountInfo !== null && accountInfo.owner.equals(CONTRACT_CONFIG.PROGRAM_ID);
}

export async function getSamSOLBalance(
  connection: Connection,
  userPublicKey: PublicKey
): Promise<{ balance: number; tokenAccount: PublicKey | null }> {
  try {
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      Keypair.generate(), 
      CONTRACT_CONFIG.SAMSOL_MINT,
      userPublicKey,
      false, 
      "confirmed",
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenBalance = await getAccount(connection, userTokenAccount.address);
    const mintInfo = await getMint(connection, CONTRACT_CONFIG.SAMSOL_MINT);
    
    return {
      balance: Number(tokenBalance.amount) / Math.pow(10, mintInfo.decimals),
      tokenAccount: userTokenAccount.address
    };
  } catch (error) {
    console.log("No SamSOL token account found or error:", error);
    return { balance: 0, tokenAccount: null };
  }
}

// Get user's staked SOL amount from PDA
export async function getStakedAmount(
  connection: Connection,
  userPublicKey: PublicKey
): Promise<number> {
  try {
    const [userStakePDA] = getUserStakePDA(userPublicKey);
    const accountInfo = await connection.getAccountInfo(userStakePDA);
    
    if (!accountInfo || accountInfo.data.length < 49) {
      return 0;
    }
    
    const stakedAmountLamports = accountInfo.data.readBigUInt64LE(40);
    return Number(stakedAmountLamports) / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error reading staked amount:", error);
    return 0;
  }
}

export async function createTokenAccountIfNeeded(
  connection: Connection,
  payer: PublicKey,
  userPublicKey: PublicKey
): Promise<{ instruction: TransactionInstruction | null; address: PublicKey }> {
  const tokenAccountAddress = await getAssociatedTokenAddress(
    CONTRACT_CONFIG.SAMSOL_MINT,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
  if (accountInfo) {
    return { instruction: null, address: tokenAccountAddress };
  }

  const createTokenAccountIx = createAssociatedTokenAccountInstruction(
    payer, // payer
    tokenAccountAddress, // ata
    userPublicKey, // owner
    CONTRACT_CONFIG.SAMSOL_MINT, // mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return { instruction: createTokenAccountIx, address: tokenAccountAddress };
}

export async function createUserStakeAccountTransaction(
  userPublicKey: PublicKey
): Promise<Transaction> {
  const [userStakePDA] = getUserStakePDA(userPublicKey);
  const [userVaultPDA] = getUserVaultPDA(userPublicKey);
  
  const keys = [
    { pubkey: userPublicKey, isSigner: true, isWritable: true },
    { pubkey: userStakePDA, isSigner: false, isWritable: true },
    { pubkey: userVaultPDA, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId: CONTRACT_CONFIG.PROGRAM_ID,
    data: INSTRUCTION_DISCRIMINATORS.CREATE_USER_STAKE
  });

  return new Transaction().add(instruction);
}

export async function createStakeTransaction(
  connection: Connection,
  userPublicKey: PublicKey,
  stakeAmountSOL: number
): Promise<Transaction> {
  const stakeAmountLamports = Math.floor(stakeAmountSOL * LAMPORTS_PER_SOL);
  const [userStakePDA] = getUserStakePDA(userPublicKey);
  const [userVaultPDA] = getUserVaultPDA(userPublicKey);
  
  const userTokenAccountAddress = await getAssociatedTokenAddress(
    CONTRACT_CONFIG.SAMSOL_MINT,
    userPublicKey,
    false, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const keys = [
    { pubkey: userPublicKey, isSigner: true, isWritable: true },
    { pubkey: userStakePDA, isSigner: false, isWritable: true },
    { pubkey: userVaultPDA, isSigner: false, isWritable: true }, // user_vault
    { pubkey: CONTRACT_CONFIG.GLOBAL_MINT_AUTHORITY_PDA, isSigner: false, isWritable: false },
    { pubkey: CONTRACT_CONFIG.GLOBAL_MINT_AUTHORITY_PDA, isSigner: false, isWritable: false }, // global_mint_authority_info
    { pubkey: CONTRACT_CONFIG.SAMSOL_MINT, isSigner: false, isWritable: true },
    { pubkey: userTokenAccountAddress, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
  ];

  const stakeData = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.STAKE,
    serializeU64(stakeAmountLamports)
  ]);

  const instruction = new TransactionInstruction({
    keys,
    programId: CONTRACT_CONFIG.PROGRAM_ID,
    data: stakeData
  });

  return new Transaction().add(instruction);
}

export async function createUnstakeTransaction(
  connection: Connection,
  userPublicKey: PublicKey,
  unstakeAmountTokens: number
): Promise<Transaction> {
  const mintInfo = await getMint(connection, CONTRACT_CONFIG.SAMSOL_MINT);
  const unstakeAmountLamports = Math.floor(unstakeAmountTokens * Math.pow(10, mintInfo.decimals));
  
  const [userStakePDA] = getUserStakePDA(userPublicKey);
  const [userVaultPDA] = getUserVaultPDA(userPublicKey);
  
  const userTokenAccountAddress = await getAssociatedTokenAddress(
    CONTRACT_CONFIG.SAMSOL_MINT,
    userPublicKey,
    false, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const keys = [
    { pubkey: userPublicKey, isSigner: true, isWritable: true },
    { pubkey: userStakePDA, isSigner: false, isWritable: true },
    { pubkey: userVaultPDA, isSigner: false, isWritable: true }, // user_vault
    { pubkey: CONTRACT_CONFIG.GLOBAL_MINT_AUTHORITY_PDA, isSigner: false, isWritable: false },
    { pubkey: CONTRACT_CONFIG.SAMSOL_MINT, isSigner: false, isWritable: true },
    { pubkey: userTokenAccountAddress, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
  ];

  const unstakeData = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.UNSTAKE,
    serializeU64(unstakeAmountLamports)
  ]);

  const instruction = new TransactionInstruction({
    keys,
    programId: CONTRACT_CONFIG.PROGRAM_ID,
    data: unstakeData
  });

  return new Transaction().add(instruction);
}
