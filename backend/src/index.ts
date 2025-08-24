require('dotenv').config();
import express from "express";
import { burnTokens, mintTokens, sendNativeTokens } from './mintTokens';
import { PrismaClient } from '@prisma/client';
import { loadPlatformWallet } from "./wallet";
import { Connection, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import cors from "cors"


const app = express();
app.use(express.json());
app.use(cors());
const db = new PrismaClient();

app.post('/stake-init', async (req, res) => {
    const { userWallet, amount } = req.body;

    try {
        // Ensure Vault exists
        let vault = await db.vault.findFirst();
        if (!vault) {
            vault = await db.vault.create({ data: {} });
        }

        // Create transaction record (pending)
        const txRecord = await db.transaction.create({
            data: {
                user: userWallet,
                tokenReceived: "SOL",
                amountReceived: amount,
                stakedTokenMinted: process.env.STAKED_TOKEN_MINT!,
                amountStaked: amount,
                status: 'pending'
            }
        });

        // Return txId to frontend
        res.send({ txId: txRecord.id });

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to create stake transaction');
    }
});

// HELIUS WEBHOOK
app.post('/helius', async (req, res) => {
    const connection = new Connection(process.env.RPC_URL!, "confirmed");
    const platformWallet = loadPlatformWallet();
    const VAULT_ADDRESS = "DTceCyCi4ypRbHqjo4S7huHQr3j9NAcNf4wHkvN5A1cT"; // your vault

    try {
        const transactions = Array.isArray(req.body) ? req.body : [req.body];

        // Fetch the first vault row once
        let vault = await db.vault.findFirst();
        if (!vault) {
            vault = await db.vault.create({
                data: { totalSOL: 0, totalSSOL: 0 }
            });
        }

        for (const tx of transactions) {
            console.log(tx);

            const deposits = (tx.nativeTransfers ?? []).filter((t: any) => {
                console.log("Checking native transfer:", {
                    toUserAccount: t.toUserAccount,
                    VAULT_ADDRESS
                });
                return t.toUserAccount === VAULT_ADDRESS;
            });

            if (deposits.length === 0) {
                console.log("No deposits to vault in this transaction, skipping.");
                continue;
            }

            for (const deposit of deposits) {
                const { fromUserAccount, toUserAccount, amount } = deposit;
                const amountSOL = amount / 1e9; // lamports → SOL

                const txRecord = await db.transaction.findFirst({
                    where: { user: fromUserAccount, amountReceived: amountSOL, status: 'pending' },
                    orderBy: { createdAt: 'desc' }
                });

                if (!txRecord) {
                    console.warn(`No matching transaction for ${fromUserAccount} of amount ${amountSOL}`);
                    continue;
                }

                try {
                    const mintTxSig = await mintTokens(toUserAccount, fromUserAccount, amountSOL);

                    await db.$transaction([
                        db.vault.update({
                            where: { id: vault.id },
                            data: { totalSOL: { increment: amountSOL }, totalSSOL: { increment: amountSOL } }
                        }),
                        db.transaction.update({
                            where: { id: txRecord.id },
                            data: { status: 'completed', txSignature: mintTxSig }
                        })
                    ]);

                    console.log(`Deposit processed for ${fromUserAccount} amount ${amountSOL}`);

                } catch (mintErr) {
                    console.error("Mint failed", mintErr);

                    const refundIx = await sendNativeTokens(platformWallet.publicKey.toBase58(), fromUserAccount, amountSOL);
                    const refundTx = new Transaction().add(refundIx);
                    const txSig = await sendAndConfirmTransaction(connection, refundTx, [platformWallet]);

                    await db.transaction.update({
                        where: { id: txRecord.id },
                        data: { status: 'refunded', txSignature: txSig }
                    });

                    console.log(`Deposit refunded to ${fromUserAccount}`);
                }
            }
        }

        res.send("Webhook processed successfully");

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal error");
    }
});


// UNSTAKE - Pre-sign platform wallet, user only signs once
app.post('/unstake', async (req, res) => {
    console.log('🚀 UNSTAKE REQUEST STARTED');
    console.log('Request body:', req.body);
    
    const { userWallet, amount, signedBurnTx } = req.body;
    const connection = new Connection(process.env.RPC_URL!, "confirmed");

    console.log(`📝 Parameters: userWallet=${userWallet}, amount=${amount}, hasSignedTx=${!!signedBurnTx}`);

    try {
        console.log('🏦 Checking vault record...');
        let vault = await db.vault.findFirst();
        if (!vault) {
            console.log('⚠️ No vault found, creating new one...');
            vault = await db.vault.create({ data: {} });
            console.log('✅ New vault created with ID:', vault.id);
        } else {
            console.log('✅ Vault found with ID:', vault.id);
        }

        // 1️⃣ Create transaction with platform pre-signature
        if (!signedBurnTx) {
            console.log('📋 STEP 1: Creating transaction with platform pre-signature...');
            
            try {
                console.log('🔥 Creating burn transaction...');
                const burnTxn = await burnTokens(userWallet, process.env.STAKED_TOKEN_MINT!, amount);
                console.log('✅ Burn transaction created successfully');

                console.log('💰 Loading platform wallet...');
                const platformWallet = loadPlatformWallet();
                console.log('✅ Platform wallet loaded:', platformWallet.publicKey.toBase58());

                console.log('💸 Creating refund instruction...');
                const refundIx = await sendNativeTokens(
                    platformWallet.publicKey.toBase58(),
                    userWallet,
                    amount
                );
                console.log('✅ Refund instruction created');

                console.log('🔧 Adding refund instruction to burn transaction...');
                burnTxn.add(refundIx);

                console.log('🔍 Transaction before platform signing:');
                console.log('  - Fee payer:', burnTxn.feePayer?.toBase58());
                console.log('  - Instructions count:', burnTxn.instructions.length);
                console.log('  - Signatures needed:', burnTxn.signatures.length);

                // 🔑 CRITICAL: Platform wallet pre-signs the transaction
                console.log('✍️ Platform wallet pre-signing transaction...');
                burnTxn.partialSign(platformWallet);
                console.log('✅ Platform wallet signature added');

                console.log('🔍 Transaction after platform signing:');
                console.log('  - Signatures with platform:', burnTxn.signatures.map(s => ({
                    pubkey: s.publicKey.toBase58(),
                    hasSig: !!s.signature
                })));

                console.log('📦 Serializing pre-signed transaction...');
                const serializedTx = burnTxn.serialize({ requireAllSignatures: false });
                console.log('✅ Pre-signed transaction serialized, length:', serializedTx.length);

                console.log('🎯 STEP 1 COMPLETE: Returning pre-signed transaction to frontend');
                return res.send({ 
                    tx: serializedTx.toString("base64"),
                    message: "Platform wallet has pre-signed. User signature needed."
                });
                
            } catch (error: any) {
                console.error('❌ ERROR in Step 1:', error);
                console.error('Error details:', error.message);
                return res.status(500).send({ error: 'Failed to create pre-signed transaction' });
            }
        }

        // 2️⃣ Submit the fully signed transaction (both platform + user signatures)
        console.log('📋 STEP 2: Submitting fully signed transaction...');
        
        try {
            console.log('📦 Deserializing fully signed transaction...');
            const tx = Transaction.from(Buffer.from(signedBurnTx, "base64"));
            console.log('✅ Transaction deserialized');
            
            console.log('🔍 Verifying all signatures:');
            const sigInfo = tx.signatures.map(s => ({
                pubkey: s.publicKey.toBase58(),
                hasSig: !!s.signature,
                isPlatform: s.publicKey.toBase58() === loadPlatformWallet().publicKey.toBase58(),
                isUser: s.publicKey.toBase58() === userWallet
            }));
            console.log('  - Signature status:', sigInfo);
            
            const allSigned = tx.signatures.every(sig => sig.signature !== null);
            console.log('✅ All signatures present:', allSigned);

            if (!allSigned) {
                throw new Error('Transaction missing required signatures');
            }

            // No need to add more signatures - they're all there!
            console.log('🚀 Submitting fully signed transaction to network...');
            const txSig = await sendAndConfirmTransaction(connection, tx, []);
            console.log('✅ Transaction submitted successfully! Signature:', txSig);

            console.log('🏦 Updating vault totals...');
            await db.vault.update({
                where: { id: vault.id },
                data: {
                    totalSOL: { decrement: amount },
                    totalSSOL: { decrement: amount }
                }
            });
            console.log('✅ Vault totals updated');

            console.log('🎯 STEP 2 COMPLETE: Unstake successful!');
            res.send({ 
                success: true, 
                txSig,
                message: `Successfully unstaked ${amount} tokens`
            });
            
        } catch (error: any) {
            console.error('❌ ERROR in Step 2:', error);
            console.error('Error message:', error.message);
            
            // Enhanced error debugging
            if (error.message.includes('Signature verification failed')) {
                console.error('🔍 DETAILED SIGNATURE DEBUG:');
                try {
                    const tx = Transaction.from(Buffer.from(signedBurnTx, "base64"));
                    console.error('  - Fee payer:', tx.feePayer?.toBase58());
                    console.error('  - Recent blockhash:', tx.recentBlockhash);
                    console.error('  - Instructions requiring signatures:', tx.instructions.map((ix, i) => ({
                        instruction: i,
                        programId: ix.programId.toBase58(),
                        signers: ix.keys.filter(k => k.isSigner).map(k => k.pubkey.toBase58())
                    })));
                    console.error('  - Actual signatures:', tx.signatures.map(s => ({
                        publicKey: s.publicKey.toBase58(),
                        hasSignature: !!s.signature,
                        signatureLength: s.signature?.length || 0
                    })));
                } catch (debugError: any) {
                    console.error('  - Failed to debug transaction:', debugError.message);
                }
            }
            
            return res.status(500).send({ 
                error: 'Failed to submit transaction',
                details: error.message 
            });
        }

    } catch (error: any) {
        console.error('❌ CRITICAL ERROR in unstake endpoint:', error);
        console.error('Error message:', error.message);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// STATUS CHECK
app.get('/transactions/status/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await db.transaction.findUnique({
            where: { id: id }
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({ status: transaction.status });
    } catch (error) {
        console.error('Error fetching transaction status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3003, () => {
    console.log('Server running on port 3000');
});
