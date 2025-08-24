require('dotenv').config();
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { loadPlatformWallet } from "./wallet";
import { createBurnInstruction, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const connection = new Connection(process.env.RPC_URL!, "confirmed");

export const mintTokens = async (fromAddress: string, toAddress: string, amount: number) => {
    try {
        console.log(`✅ Minting ${amount} staked tokens for ${toAddress}, deposit from ${fromAddress}`);

        // step 1 load the payer wallet and the mint and the user public key
        const payer = loadPlatformWallet();
        const mint = new PublicKey(process.env.STAKED_TOKEN_MINT!);
        const userpubKey = new PublicKey(toAddress);

        // step 2 check if that user have the ata for this token or not if not create it
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            payer, // fee payer
            mint,        // token mint
            userpubKey   // owner of the account
        )

        // step3  Mint tokens into the ATA
        const txn = await mintTo(
            connection,
            payer, // pay for this whole transaction
            mint,
            ata.address,
            payer,   // this is the authority of the mint token
            amount * 1e9
        )

        console.log("transaction", txn);
        return txn;

    } catch (error) {
        console.log("error in minting token", error);
        throw error;
    }
};

// this function creates a transaction to burn staked tokens from user's account
export const burnTokens = async (userPubKey: string, mintToken: string, amount: number) => {
    console.log(`🔥 Burning ${amount} staked tokens from ${userPubKey}`);
    
    const userPublicKey = new PublicKey(userPubKey);
    const mintTokenKey = new PublicKey(mintToken);
    const platformWallet = loadPlatformWallet();

    // Get user's associated token account
    const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        platformWallet, // fee payer
        mintTokenKey,   // minted token ata  
        userPublicKey   // for this public key 
    )

    // Create new transaction
    const tx = new Transaction();
    
    // ADD RECENT BLOCKHASH - This is the missing piece!
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = platformWallet.publicKey;

    // Create burn instruction
    const burnIx = createBurnInstruction(
        ata.address,        // source
        mintTokenKey,       // mint
        userPublicKey,      // owner of tokens
        amount * 1e9,       // amount (adjust for decimals)
        [],                 // multiSigners if needed
        TOKEN_PROGRAM_ID    
    );

    tx.add(burnIx);
    return tx;
};

export const sendNativeTokens = async (
    fromAddress: string,
    toAddress: string,
    amount: number
): Promise<TransactionInstruction> => {
    console.log(`💸 Preparing refund of ${amount} native tokens from ${fromAddress} → ${toAddress}`);
    
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);
    
    // Create a SystemProgram transfer instruction (does NOT send yet)
    const sendInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount * 1e9 // convert SOL to lamports
    });
    
    return sendInstruction;
};