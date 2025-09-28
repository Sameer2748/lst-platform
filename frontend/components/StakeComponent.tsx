"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { ArrowRightIcon, CheckCircle, AlertCircle, Clock, XCircle, ArrowDownIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { 
  getSamSOLBalance, 
  checkUserStakeAccount, 
  createUserStakeAccountTransaction, 
  createStakeTransaction,
  getStakedAmount,
  getUserStakePDA,
  getUserVaultPDA,
  createTokenAccountIfNeeded
} from "@/utils/contractUtils";

// Transaction status types
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

interface StatusPopupProps {
    status: TransactionStatus;
    txnId: string;
    amount: string;
    onClose: () => void;
}

const StatusPopup: React.FC<StatusPopupProps> = ({ status, txnId, amount, onClose }) => {
    const getStatusConfig = (status: TransactionStatus) => {
        switch (status) {
            case 'completed':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                    title: 'Transaction Completed!',
                    description: `Successfully staked ${amount} SOL`,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                };
            case 'failed':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    title: 'Transaction Failed',
                    description: 'Your transaction could not be processed',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                };
            case 'cancelled':
                return {
                    icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
                    title: 'Transaction Cancelled',
                    description: 'Your transaction was cancelled',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200'
                };
            case 'processing':
                return {
                    icon: <Clock className="w-16 h-16 text-blue-500 animate-spin" />,
                    title: 'Processing Transaction',
                    description: 'Your transaction is being processed...',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            default: // pending
                return {
                    icon: <Clock className="w-16 h-16 text-gray-500" />,
                    title: 'Transaction Pending',
                    description: 'Waiting for blockchain confirmation...',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200'
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl`}>
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        {config.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {config.title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                        {config.description}
                    </p>
                    {txnId && (
                        <div className="bg-white rounded-lg p-3 mb-6">
                            <p className="text-sm text-gray-500">Transaction ID:</p>
                            <p className="text-xs font-mono break-all text-gray-700">{txnId}</p>
                        </div>
                    )}
                    {(status === 'completed' || status === 'failed' || status === 'cancelled') && (
                        <button
                            onClick={onClose}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const StakeComponent = () => {
    const { publicKey, signTransaction } = useWallet();
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [samsolBalance, setSamsolBalance] = useState<number>(0);
    const [stakedAmount, setStakedAmount] = useState<number>(0);
    const [hasStakeAccount, setHasStakeAccount] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [inputError, setInputError] = useState(false);
    const [stakeStarted, setStakeStarted] = useState(false);
    
    // Transaction popup states
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [currentTxnId, setCurrentTxnId] = useState<string>('');
    const [currentStatus, setCurrentStatus] = useState<TransactionStatus>('pending');

    const connection = useMemo(() => new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || "https://devnet.helius-rpc.com/?api-key=d634c70f-6302-40db-9292-72c25d3dda26",
        "confirmed"
    ), []);

    const samsolImageUrl = "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/uploads/1754915233501-mengyu-xu-2yUG4ZLz8Ck.jpg";
    const solImageUrl = "https://imgs.search.brave.com/YRcgd3-E4u7oewRc-ZSSbJTG3hRm20spgyUM-1BYYeU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/YnJhbmRmZXRjaC5p/by9pZGUwTlV1VEhP/L3cvNDAwL2gvNDAw/L3RoZW1lL2Rhcmsv/aWNvbi5qcGVnP2M9/MWJ4aWQ2NE11cDdh/Y3pld1NBWU1YJnQ9/MTY2NzY0NDU5NjQ2/NQ";

    // Fetch all balances and account info
    const fetchBalances = useCallback(async () => {
        if (!publicKey) return;
        
        setLoading(true);
        try {
            // Fetch SOL balance
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / LAMPORTS_PER_SOL);

            // Fetch SamSOL balance
            const { balance: samsolBal } = await getSamSOLBalance(connection, publicKey);
            setSamsolBalance(samsolBal);

            // Check if user has stake account
            const hasAccount = await checkUserStakeAccount(connection, publicKey);
            setHasStakeAccount(hasAccount);

            // Fetch staked amount if account exists
            if (hasAccount) {
                const staked = await getStakedAmount(connection, publicKey);
                setStakedAmount(staked);
            }

        } catch (err) {
            console.error("Error fetching balances:", err);
            toast.error("Failed to fetch account balances");
        }
        setLoading(false);
    }, [publicKey, connection]);

    useEffect(() => {
        if (publicKey) {
            fetchBalances();
        }
    }, [publicKey, fetchBalances]);

    const handleUseMax = () => {
        if (solBalance) {
            // Leave some SOL for fees (0.01 SOL)
            const maxStake = Math.max(0, solBalance - 0.01);
            setInputAmount(maxStake.toString());
            setInputError(false);
        }
    };

    const handleInputChange = (value: string) => {
        setInputAmount(value);
        if (solBalance !== null && parseFloat(value) > solBalance) {
            setInputError(true);
        } else {
            setInputError(false);
        }
    };

    const handleClosePopup = () => {
        setShowStatusPopup(false);
        setCurrentTxnId('');
        setCurrentStatus('pending');
        // Refresh balances after transaction
        fetchBalances();
    };

    const handleStake = async () => {
        if (!publicKey || !signTransaction || !inputAmount) {
            toast.error("Please connect wallet and enter amount");
            return;
        }

        // Prevent multiple clicks
        if (stakeStarted) {
            console.log("Transaction already in progress");
            return;
        }

        const stakeAmountSOL = parseFloat(inputAmount);
        if (stakeAmountSOL <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (solBalance && stakeAmountSOL > solBalance) {
            toast.error("Insufficient SOL balance");
            return;
        }

        setStakeStarted(true);
        setCurrentStatus('processing');
        setShowStatusPopup(true);

        let txId: string = '';

        try {
            let transaction: Transaction;

            // Check if user needs to create stake account first
            if (!hasStakeAccount) {
                console.log("Creating user stake account...");
                const createAccountTx = await createUserStakeAccountTransaction(publicKey);
                
                // Get fresh blockhash for create account transaction
                const { blockhash: createBlockhash, lastValidBlockHeight: createHeight } = await connection.getLatestBlockhash('finalized');
                createAccountTx.recentBlockhash = createBlockhash;
                createAccountTx.feePayer = publicKey;

                const signedCreateTx = await signTransaction(createAccountTx);
                const createTxId = await connection.sendRawTransaction(signedCreateTx.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed'
                });
                
                console.log("Waiting for stake account creation confirmation...");
                await connection.confirmTransaction({
                    signature: createTxId,
                    blockhash: createBlockhash,
                    lastValidBlockHeight: createHeight
                }, 'confirmed');
                
                console.log("Stake account created:", createTxId);
                setHasStakeAccount(true);
                
                // Wait for account to be available
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            // Create stake transaction with fresh blockhash
            console.log("Creating stake transaction...");
            
            // Check if we need to create token account first
            const { instruction: createTokenAccountIx } = await createTokenAccountIfNeeded(
                connection,
                publicKey,
                publicKey
            );

            // If we need to create token account, do it in a separate transaction first
            if (createTokenAccountIx) {
                console.log("Creating token account first...");
                const createTokenTx = new Transaction().add(createTokenAccountIx);
                
                const { blockhash: tokenBlockhash, lastValidBlockHeight: tokenHeight } = await connection.getLatestBlockhash('finalized');
                createTokenTx.recentBlockhash = tokenBlockhash;
                createTokenTx.feePayer = publicKey;

                const signedTokenTx = await signTransaction(createTokenTx);
                const tokenTxId = await connection.sendRawTransaction(signedTokenTx.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed'
                });
                
                console.log("Waiting for token account creation...");
                await connection.confirmTransaction({
                    signature: tokenTxId,
                    blockhash: tokenBlockhash,
                    lastValidBlockHeight: tokenHeight
                }, 'confirmed');
                
                console.log("Token account created:", tokenTxId);
                // Wait for account to be available
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Now create the stake transaction
            transaction = await createStakeTransaction(connection, publicKey, stakeAmountSOL);
            
            // Get a fresh blockhash for the stake transaction
            const { blockhash: stakeBlockhash, lastValidBlockHeight: stakeHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = stakeBlockhash;
            transaction.feePayer = publicKey;

            console.log("Signing and sending stake transaction...");
            // Sign and send transaction
            const signedTransaction = await signTransaction(transaction);
            
            txId = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 3
            });
            
            setCurrentTxnId(txId);
            setCurrentStatus('pending');

            console.log("Transaction sent:", txId);
            console.log("Waiting for confirmation...");

            // Wait for confirmation with timeout
            const confirmationResult = await Promise.race([
                connection.confirmTransaction({
                    signature: txId,
                    blockhash: stakeBlockhash,
                    lastValidBlockHeight: stakeHeight
                }, 'confirmed'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
                )
            ]);

            console.log("Transaction confirmed:", confirmationResult);
            
            setCurrentStatus('completed');
            toast.success(`Successfully staked ${stakeAmountSOL} SOL!`);
            
            // Clear input and refresh data
            setInputAmount('');
            await fetchBalances();

        } catch (error: any) {
            console.error("Staking error:", error);
            
            if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
                toast.error("Transaction cancelled by user");
                setCurrentStatus('cancelled');
            } else if (error.message?.includes('already been processed')) {
                console.log("Transaction already processed, checking if it succeeded...");
                
                // Wait a bit and then check balances to see if transaction actually went through
                await new Promise(resolve => setTimeout(resolve, 3000));
                await fetchBalances();
                
                // If balances changed, transaction was successful despite the error
                const newSamsolBalance = await getSamSOLBalance(connection, publicKey);
                if (newSamsolBalance.balance > samsolBalance) {
                    setCurrentStatus('completed');
                    toast.success(`Transaction completed! Successfully staked SOL.`);
                    setInputAmount('');
                } else {
                    setCurrentStatus('failed');
                    toast.error("Transaction was processed but status unclear. Please check your balance.");
                }
            } else if (error.message?.includes('Blockhash not found') || error.message?.includes('Confirmation timeout')) {
                console.log("Transaction may have succeeded, checking...");
                
                // For timeout/blockhash errors, check if transaction actually went through
                if (txId) {
                    try {
                        // Check transaction status directly
                        const txStatus = await connection.getSignatureStatus(txId);
                        if (txStatus.value?.confirmationStatus === 'confirmed' || txStatus.value?.confirmationStatus === 'finalized') {
                            setCurrentStatus('completed');
                            toast.success(`Transaction completed! Successfully staked SOL.`);
                            setInputAmount('');
                            await fetchBalances();
                        } else {
                            setCurrentStatus('failed');
                            toast.error("Transaction may have failed. Please try again.");
                        }
                    } catch (statusError) {
                        setCurrentStatus('failed');
                        toast.error("Transaction status unclear. Please check your balance and try again if needed.");
                    }
                } else {
                    setCurrentStatus('failed');
                    toast.error("Transaction expired. Please try again.");
                }
            } else {
                setCurrentStatus('failed');
                toast.error(`Staking failed: ${error.message || 'Unknown error'}`);
            }
            
            // Always refresh balances to get current state
            await fetchBalances();
        } finally {
            setStakeStarted(false);
        }
    };

    if (!publicKey) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center text-gray-400 text-xl px-4">
                <p className="text-center">Connect your wallet to start staking SOL.</p>
            </div>
        );
    }

    if (loading || solBalance === null) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center text-gray-500 text-xl animate-pulse px-4">
                <p className="text-center">Loading balances...</p>
            </div>
        );
    }

    return (
        <div className="pt-16 px-4 md:px-0">
            {/* Status Popup */}
            {showStatusPopup && (
                <StatusPopup
                    status={currentStatus}
                    txnId={currentTxnId}
                    amount={inputAmount}
                    onClose={handleClosePopup}
                />
            )}

            {/* Header - Responsive layout */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0">
                <h1 className="text-4xl md:text-5xl font-bold text-black font-stretch-condensed text-center md:text-left">Get SamSOL</h1>
                <div className="text-center md:text-right">
                    <p className="text-gray-500 text-sm">APY</p>
                    <p className="text-3xl md:text-4xl font-bold text-purple-500">6.92%</p>
                </div>
            </div>

            {/* Balance Display */}
            <div className="mt-4 mb-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-500">SOL Balance</p>
                    <p className="text-xl font-bold text-gray-800">{solBalance.toFixed(4)}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-500">SamSOL Balance</p>
                    <p className="text-xl font-bold text-purple-600">{samsolBalance.toFixed(4)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 col-span-2 md:col-span-1">
                    <p className="text-sm text-gray-500">Total Staked</p>
                    <p className="text-xl font-bold text-green-600">{stakedAmount.toFixed(4)} SOL</p>
                </div>
            </div>

            {/* Account Status Alert */}
            {!hasStakeAccount && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 text-sm">
                        <strong>Note:</strong> This is your first time staking. We'll create your stake account automatically.
                    </p>
                </div>
            )}

            {/* Main staking interface - Different layouts for mobile and desktop */}
            <div className="w-full mt-8 md:mt-12">
                {/* Desktop Layout (hidden on mobile) */}
                <div className="hidden md:grid md:grid-cols-2 relative gap-4">
                    {/* Left - You're staking */}
                    <div className="w-[97%] h-[155px] bg-white rounded-3xl px-3 py-4">
                        <div className="flex justify-between text-black p-2">
                            <h1 className="text-xl font-semibold">You&apos;re staking</h1>
                            <div className="flex justify-center items-center gap-2">
                                <p className="text-sm text-gray-500">{solBalance.toFixed(4)} SOL</p>
                                <button
                                    onClick={handleUseMax}
                                    className="text-purple-600 text-sm font-medium hover:text-purple-700"
                                >
                                    Use Max
                                </button>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="flex items-center justify-between px-2 mt-4">
                            <div className="relative">
                                <div className="flex text-black items-center gap-2 rounded-xl py-2">
                                    <Image className="rounded-full w-10 h-10" src={solImageUrl} alt="sol" width={40} height={40} />
                                    <span className="font-bold text-3xl">SOL</span>
                                </div>
                            </div>

                            <div className="text-right text-gray-400">
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    className={`text-4xl font-bold text-right bg-transparent border-2 ${inputError ? "border-red-400" : "border-transparent"
                                        } outline-none md:w-44 lg:w-46 xl:w-86 rounded-lg p-1 transition-colors`}
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                        {inputError && (
                            <p className="text-sm text-right text-red-500 px-2">Amount cannot be more than balance</p>
                        )}
                    </div>

                    {/* Right - To Receive */}
                    <div className="w-[97%] h-[155px] bg-white rounded-3xl px-3 py-4 justify-self-end">
                        <div className="flex justify-between text-black p-2">
                            <h1 className="text-xl font-semibold">To Receive</h1>
                            <div className="flex justify-center items-center gap-2">
                                <button className="text-gray-600 text-sm font-medium hover:text-purple-700">
                                    0% Price Impact
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 mt-4">
                            <div className="relative">
                                <div className="flex text-black items-center gap-2 rounded-xl py-2">
                                    <Image className="rounded-full w-10 h-10" src={samsolImageUrl} alt="SamSOL" width={40} height={40} />
                                    <span className="font-bold text-3xl">SamSOL</span>
                                </div>
                            </div>

                            <div className="text-right text-gray-400">
                                <input
                                    type="number"
                                    value={(parseFloat(inputAmount) || 0)}
                                    className="text-4xl font-bold text-right bg-transparent border-none outline-none md:w-44 lg:w-46 xl:w-86"
                                    placeholder="0.0"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    {/* Middle Arrow */}
                    <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                        <div className="w-[20px] h-[20px] rounded">
                            <ArrowRightIcon color="#c17bff" />
                        </div>
                    </div>
                </div>

                {/* Mobile Layout (hidden on desktop) */}
                <div className="md:hidden flex flex-col gap-6">
                    {/* You're staking - Mobile */}
                    <div className="w-full bg-white rounded-3xl px-4 py-6">
                        <div className="flex justify-between text-black mb-4">
                            <h1 className="text-lg font-semibold">You&apos;re staking</h1>
                            <div className="flex justify-center items-center gap-2">
                                <p className="text-sm text-gray-500">{solBalance.toFixed(4)} SOL</p>
                                <button
                                    onClick={handleUseMax}
                                    className="text-purple-600 text-sm font-medium hover:text-purple-700"
                                >
                                    Use Max
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex text-black items-center gap-3">
                                <Image className="rounded-full w-12 h-12" src={solImageUrl} alt="sol" width={48} height={48} />
                                <span className="font-bold text-2xl">SOL</span>
                            </div>

                            <div className="text-right">
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    className={`text-2xl font-bold text-right bg-transparent border-2 ${inputError ? "border-red-400" : "border-transparent"
                                        } outline-none w-32 rounded-lg p-2 transition-colors text-gray-700`}
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                        {inputError && (
                            <p className="text-sm text-right text-red-500 mt-2">Amount cannot be more than balance</p>
                        )}
                    </div>

                    {/* Arrow Down for Mobile */}
                    <div className="flex justify-center">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <ArrowDownIcon color="#c17bff" size={24} />
                        </div>
                    </div>

                    {/* To Receive - Mobile */}
                    <div className="w-full bg-white rounded-3xl px-4 py-6">
                        <div className="flex justify-between text-black mb-4">
                            <h1 className="text-lg font-semibold">To Receive</h1>
                            <button className="text-gray-600 text-sm font-medium hover:text-purple-700">
                                0% Price Impact
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex text-black items-center gap-3">
                                <Image className="rounded-full w-12 h-12" src={samsolImageUrl} alt="SamSOL" width={48} height={48} />
                                <span className="font-bold text-2xl">SamSOL</span>
                            </div>

                            <div className="text-right">
                                <input
                                    type="number"
                                    value={(parseFloat(inputAmount) || 0)}
                                    className="text-2xl font-bold text-right bg-transparent border-none outline-none w-42 text-gray-700"
                                    placeholder="0.0"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom section - Responsive */}
                <div className="w-full mt-8">
                    {/* Desktop layout for bottom section */}
                    <div className="hidden md:grid md:grid-cols-2 relative gap-4">
                        <div className="w-[97%] h-[155px] rounded-3xl px-3 py-4"></div>
                        <div className="w-[97%] h-auto rounded-3xl px-3 py-4 justify-self-end">
                            <button 
                                onClick={handleStake} 
                                disabled={inputError || stakeStarted || !inputAmount || parseFloat(inputAmount) <= 0} 
                                className={`w-full h-12 rounded-3xl text-white text-md cursor-pointer font-semibold ${
                                    inputError || stakeStarted || !inputAmount || parseFloat(inputAmount) <= 0
                                        ? "bg-purple-400 text-black cursor-not-allowed" 
                                        : "bg-purple-500 hover:bg-purple-600"
                                } transition-colors`}
                            >
                                {stakeStarted ? "Processing..." : "Convert to SamSOL"}
                            </button>
                            <div className="flex justify-between items-center text-black pt-4 px-2">
                                <p className="text-gray-500 text-sm">1 SamSOL</p>
                                <p className="text-sm">~1 SOL</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile layout for bottom section */}
                    <div className="md:hidden">
                        <button 
                            onClick={handleStake} 
                            disabled={inputError || stakeStarted || !inputAmount || parseFloat(inputAmount) <= 0} 
                            className={`w-full h-14 rounded-3xl text-white text-lg font-semibold ${
                                inputError || stakeStarted || !inputAmount || parseFloat(inputAmount) <= 0
                                    ? "bg-purple-400 text-black cursor-not-allowed" 
                                    : "bg-purple-500 hover:bg-purple-600"
                            } transition-colors`}
                        >
                            {stakeStarted ? "Processing..." : "Convert to SamSOL"}
                        </button>
                        <div className="flex justify-between items-center text-black pt-4 px-2">
                            <p className="text-gray-500 text-sm">1 SamSOL</p>
                            <p className="text-sm">~1 SOL</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StakeComponent;