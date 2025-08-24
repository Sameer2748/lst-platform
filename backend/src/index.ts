require('dotenv').config();
import express from "express";
import { burnTokens, mintTokens, sendNativeTokens } from './mintTokens';
import { PrismaClient } from '@prisma/client';
import { loadPlatformWallet } from "./wallet";
import { Connection, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import cors from "cors"
const app = express();
app.use(cors());
app.use(express.json());
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
    const VAULT_ADDRESS = "5fxqKBcGKhx4zs4zdqocYuJxYNk4sCYJ4yXKNyyDebZP"; // your vault

    try {
        // Loop through all tokenTransfers in case multiple transfers in one tx
        console.log("Helius webhook body:", req.body);
        const deposits = req.body[0].tokenTransfers.filter(
            (t:any) => t.toUserAccount === VAULT_ADDRESS
        );

        if (deposits.length === 0) {
            return res.status(200).send("No deposits to vault, ignoring");
        }

        for (const deposit of deposits) {
            const { fromUserAccount, toUserAccount, mint, tokenAmount } = deposit;

            // Find pending transaction created earlier
            const txRecord = await db.transaction.findFirst({
                where: { user: fromUserAccount, amountReceived: tokenAmount, status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });

            if (!txRecord) {
                console.warn(`No matching transaction for ${fromUserAccount} of amount ${tokenAmount}`);
                continue; // skip this deposit
            }

            try {
                // Mint sSOL & update Vault and transaction
                const mintTxSig = await mintTokens(fromUserAccount, toUserAccount, tokenAmount);

                await db.$transaction([
                    db.vault.update({
                        where: { id: "1" },
                        data: { totalSOL: { increment: tokenAmount }, totalSSOL: { increment: tokenAmount } }
                    }),
                    db.transaction.update({
                        where: { id: txRecord.id },
                        data: { status: 'completed', txSignature: mintTxSig }
                    })
                ]);

                console.log(`Deposit processed for ${fromUserAccount} amount ${tokenAmount}`);

            } catch (mintErr) {
                console.error("Mint failed", mintErr);

                // Refund SOL if minting fails
                const refundIx = await sendNativeTokens(platformWallet.publicKey.toBase58(), fromUserAccount, tokenAmount);
                const refundTx = new Transaction().add(refundIx);
                const txSig = await sendAndConfirmTransaction(connection, refundTx, [platformWallet]);

                await db.transaction.update({
                    where: { id: txRecord.id },
                    data: { status: 'refunded', txSignature: txSig }
                });

                console.log(`Deposit refunded to ${fromUserAccount}`);
            }
        }

        res.send("Deposit processing complete");

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal error");
    }
});


// UNSTAKE
app.post('/unstake', async (req, res) => {
    const { userWallet, amount, signedBurnTx } = req.body;
    const connection = new Connection(process.env.RPC_URL!, "confirmed");

    // Ensure Vault record exists
    let vault = await db.vault.findFirst();
    if (!vault) {
        vault = await db.vault.create({ data: {} });
    }

    // 1️⃣ Return partially signed transaction if frontend hasn't signed burn yet
    if (!signedBurnTx) {
        const burnTxn = await burnTokens(userWallet, process.env.STAKED_TOKEN_MINT!, amount);
        const platformWallet = loadPlatformWallet();
        const refundIx = await sendNativeTokens(platformWallet.publicKey.toBase58(), userWallet, amount);
        burnTxn.add(refundIx);

        const serializedTx = burnTxn.serialize({ requireAllSignatures: false });
        return res.send({ tx: serializedTx.toString("base64") });
    }

    // 2️⃣ If frontend sent signed burn txn, finalize and submit
    const platformWallet = loadPlatformWallet();
    const tx = Transaction.from(Buffer.from(signedBurnTx, "base64"));
    tx.partialSign(platformWallet);

    const txSig = await sendAndConfirmTransaction(connection, tx, [platformWallet]);

    // Update Vault totals atomically after successful unstake
    await db.vault.update({
        where: { id: vault.id },
        data: {
            totalSOL: { decrement: amount },
            totalSSOL: { decrement: amount }
        }
    });

    res.send({ success: true, txSig });
});

// STATUS CHECK
app.get('/transactions/status', async (req, res) => {
    const { user } = req.query;
    const transactions = await db.transaction.findMany({
        where: { user: user as string },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    res.json(transactions);
});

app.listen(3003, () => {
    console.log('Server running on port 3000');
});
