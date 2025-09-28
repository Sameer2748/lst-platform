"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "sonner";
import Image from 'next/image';
import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { 
  getSamSOLBalance, 
  checkUserStakeAccount, 
  createUnstakeTransaction,
  getStakedAmount 
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
                    description: `Successfully unstaked ${amount} SamSOL`,
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

const UnStakeComponent = () => {
    const { publicKey, signTransaction } = useWallet();
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [samsolBalance, setSamsolBalance] = useState<number>(0);
    const [stakedAmount, setStakedAmount] = useState<number>(0);
    const [hasStakeAccount, setHasStakeAccount] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [unstakeLoading, setUnstakeLoading] = useState(false);
    
    // Transaction popup states
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [currentTxnId, setCurrentTxnId] = useState<string>('');
    const [currentStatus, setCurrentStatus] = useState<TransactionStatus>('pending');

    const connection = useMemo(() => new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || "https://devnet.helius-rpc.com/?api-key=d634c70f-6302-40db-9292-72c25d3dda26",
        "confirmed"
    ), []);
    
    const samsolImageUrl = "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/uploads/1754915233501-mengyu-xu-2yUG4ZLz8Ck.jpg";

    const fetchBalances = useCallback(async () => {
        if (!publicKey) {
            console.error('Wallet not connected');
            return;
        }

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

        } catch (error) {
            console.error('Error fetching balances:', error);
            toast.error("Failed to fetch account balances");
        } finally {
            setLoading(false);
        }
    }, [publicKey, connection]);

    useEffect(() => {
        if (publicKey) {
            fetchBalances();
        }
    }, [publicKey, fetchBalances]);

    const handleUseMax = () => {
        setInputAmount(samsolBalance.toString());
    };

    const handleClosePopup = () => {
        setShowStatusPopup(false);
        setCurrentTxnId('');
        setCurrentStatus('pending');
        // Refresh balances after transaction
        fetchBalances();
    };

    // Get balance for display
    const getBalance = () => {
        if (!publicKey) return '0.000';
        if (loading) return '...';
        return samsolBalance.toFixed(6);
    };

    const handleUnstake = async () => {
        if (!publicKey || !signTransaction || !inputAmount) {
            toast.error("Please connect wallet and enter amount");
            return;
        }

        // Prevent multiple clicks
        if (unstakeLoading) {
            console.log("Transaction already in progress");
            return;
        }

        const unstakeAmountTokens = parseFloat(inputAmount);
        if (unstakeAmountTokens <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (unstakeAmountTokens > samsolBalance) {
            toast.error("Insufficient SamSOL balance");
            return;
        }

        if (!hasStakeAccount) {
            toast.error("No stake account found. Please stake first.");
            return;
        }

        setUnstakeLoading(true);
        setCurrentStatus('processing');
        setShowStatusPopup(true);

        let txId: string = '';

        try {
            // Store initial balances to compare later
            const initialSamsolBalance = samsolBalance;
            const initialSolBalance = solBalance;

            // Create unstake transaction
            console.log("Creating unstake transaction...");
            const transaction = await createUnstakeTransaction(connection, publicKey, unstakeAmountTokens);
            
            // Get fresh blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            console.log("Signing and sending unstake transaction...");
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
                    blockhash,
                    lastValidBlockHeight
                }, 'confirmed'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
                )
            ]);

            console.log("Transaction confirmed:", confirmationResult);
            
            setCurrentStatus('completed');
            toast.success(`Successfully unstaked ${unstakeAmountTokens} SamSOL for SOL!`);
            
            // Clear input and refresh data
            setInputAmount('');
            await fetchBalances();

        } catch (error: any) {
            console.error("Unstaking error:", error);
            
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
                if (newSamsolBalance.balance < samsolBalance) {
                    setCurrentStatus('completed');
                    toast.success(`Transaction completed! Successfully unstaked SamSOL.`);
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
                            toast.success(`Transaction completed! Successfully unstaked SamSOL.`);
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
            } else if (error.message?.includes('InsufficientStake')) {
                setCurrentStatus('failed');
                toast.error("You don't have enough staked SOL to unstake this amount");
            } else {
                setCurrentStatus('failed');
                toast.error(`Unstaking failed: ${error.message || 'Unknown error'}`);
            }
            
            // Always refresh balances to get current state
            await fetchBalances();
        } finally {
            setUnstakeLoading(false);
        }
    };

    // Get symbol for display
    const getSymbol = () => {
        return 'SamSOL';
    };

    if (!publicKey) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center text-gray-400 text-xl px-4">
                <p className="text-center">Connect your wallet to unstake tokens.</p>
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
        <div className="pt-16 px-2 sm:px-4 md:px-0 w-full">
            {/* Status Popup */}
            {showStatusPopup && (
                <StatusPopup
                    status={currentStatus}
                    txnId={currentTxnId}
                    amount={inputAmount}
                    onClose={handleClosePopup}
                />
            )}

            {/* Header - Responsive */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0 mb-8 md:mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-black text-center md:text-left">Unstake</h1>
                </div>
                <div className="text-center md:text-right">
                    <p className="text-gray-500 text-sm">APY</p>
                    <p className="text-3xl md:text-4xl font-bold text-purple-500">6.92%</p>
                </div>
            </div>

            {/* Balance Display */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-500">SOL Balance</p>
                    <p className="text-xl font-bold text-gray-800">{solBalance?.toFixed(4) || '0.0000'}</p>
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
            {!hasStakeAccount && samsolBalance > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800 text-sm">
                        <strong>Warning:</strong> No stake account found. You may have SamSOL from external sources. 
                        Unstaking requires an active stake account.
                    </p>
                </div>
            )}

            {samsolBalance === 0 && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-gray-600 text-sm">
                        You don't have any SamSOL tokens to unstake. Start by staking some SOL first.
                    </p>
                </div>
            )}

            {/* Main Layout - Different for mobile and desktop */}
            <div className="w-full">
                {/* Desktop Layout (2 columns) */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-8">
                    {/* Left Side - Unstaking Form */}
                    <div className="space-y-4">
                        {/* You're unstaking card */}
                        <div className="w-full h-[155px] bg-white rounded-3xl px-6 py-4">
                            <div className="flex justify-between text-black mb-4">
                                <h1 className="text-xl font-semibold">You&apos;re unstaking</h1>
                                <div className="flex justify-center items-center gap-2">
                                    <p className="text-sm text-gray-500">
                                        {getBalance()} {getSymbol()}
                                    </p>
                                    <button
                                        onClick={handleUseMax}
                                        disabled={loading || samsolBalance === 0}
                                        className="text-purple-600 text-sm font-medium hover:text-purple-700 disabled:text-gray-400"
                                    >
                                        Use Max
                                    </button>
                                </div>
                            </div>

                            {/* Token Selection and Input */}
                            <div className="flex items-center justify-between">
                                {/* Token Display */}
                                <div className="flex text-black items-center gap-3">
                                    <Image 
                                        className="w-10 h-10 rounded-full"
                                        src={samsolImageUrl}
                                        alt="SamSOL"
                                        width={40}
                                        height={40}
                                    />
                                    <span className="font-semibold text-2xl">{getSymbol()}</span>
                                </div>

                                {/* Amount Input */}
                                <div className="text-right">
                                    <input
                                        type="number"
                                        value={inputAmount}
                                        onChange={(e) => setInputAmount(e.target.value)}
                                        className="text-4xl font-bold text-right bg-transparent border-none outline-none w-44 sm:w-64 md:w-84 pr-5 text-gray-700"
                                        placeholder="0.000"
                                        max={samsolBalance}
                                        disabled={loading || samsolBalance === 0}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Balance Error */}
                        {inputAmount && parseFloat(inputAmount) > samsolBalance && (
                            <p className="text-sm text-red-500 px-2">
                                Insufficient balance. Max: {samsolBalance.toFixed(6)} {getSymbol()}
                            </p>
                        )}

                        {/* Unstake Button */}
                        <button
                            disabled={unstakeLoading || samsolBalance === 0 || !inputAmount || parseFloat(inputAmount) <= 0 || parseFloat(inputAmount) > samsolBalance || !hasStakeAccount}
                            onClick={handleUnstake}
                            className="w-full h-14 rounded-3xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white text-md cursor-pointer font-semibold transition-colors disabled:cursor-not-allowed"
                        >
                            {unstakeLoading ? 'Processing...' : 'Unstake SOL'}
                        </button>

                        {/* Exchange Rate */}
                        <div className="flex justify-between items-center text-black px-2">
                            <p className="text-gray-500 text-sm">1 {getSymbol()}</p>
                            <p className="text-sm">≈1 SOL</p>
                        </div>
                    </div>

                    {/* Right Side - Instant Unstake Info */}
                    <div className="bg-white rounded-3xl p-6">
                        <div className="border-l-4 border-purple-500 pl-4 mb-6">
                            <h2 className="text-2xl font-bold text-black mb-2">Direct Unstake</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1 */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black mb-1">Burn SamSOL tokens</h3>
                                    <p className="text-sm text-gray-600">
                                        Your SamSOL tokens are burned from your wallet, removing them from circulation.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black mb-1">Release staked SOL</h3>
                                    <p className="text-sm text-gray-600">
                                        The equivalent amount of SOL is released from your personal stake account and transferred back to your wallet.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black mb-1">Receive SOL instantly</h3>
                                    <p className="text-sm text-gray-600">
                                        SOL appears in your wallet immediately with a 1:1 exchange rate. No waiting periods or penalties.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600">
                                <strong className="text-gray-800">NOTE:</strong> This is direct unstaking from your personal stake account. 
                                You get exactly 1 SOL for every 1 SamSOL token with no fees or slippage. 
                                Your original staked SOL is returned to you instantly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile/Tablet Layout (single column) */}
                <div className="lg:hidden space-y-6">
                    {/* Unstaking Form - Mobile */}
                    <div className="w-full bg-white rounded-3xl px-4 py-6">
                        <div className="flex justify-between text-black mb-4">
                            <h1 className="text-lg font-semibold">You&apos;re unstaking</h1>
                            <div className="flex justify-center items-center gap-2">
                                <p className="text-sm text-gray-500">
                                    {getBalance()} {getSymbol()}
                                </p>
                                <button
                                    onClick={handleUseMax}
                                    disabled={loading || samsolBalance === 0}
                                    className="text-purple-600 text-sm font-medium hover:text-purple-700 disabled:text-gray-400"
                                >
                                    Use Max
                                </button>
                            </div>
                        </div>

                        {/* Token Selection and Input - Mobile */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex text-black items-center gap-3">
                                <Image
                                    className="w-12 h-12 rounded-full"
                                    src={samsolImageUrl}
                                    alt="SamSOL"
                                    width={48}
                                    height={48}
                                />
                                <span className="font-semibold text-2xl">{getSymbol()}</span>
                            </div>

                            <div className="text-right">
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => setInputAmount(e.target.value)}
                                    className="text-2xl font-bold text-right bg-transparent border-2 border-transparent focus:border-purple-200 outline-none w-32 rounded-lg p-2 text-gray-700"
                                    placeholder="0.000"
                                    max={samsolBalance}
                                    disabled={loading || samsolBalance === 0}
                                />
                            </div>
                        </div>

                        {/* Balance Error - Mobile */}
                        {inputAmount && parseFloat(inputAmount) > samsolBalance && (
                            <p className="text-sm text-red-500 mb-4">
                                Insufficient balance. Max: {samsolBalance.toFixed(6)} {getSymbol()}
                            </p>
                        )}

                        {/* Unstake Button - Mobile */}
                        <button
                            disabled={unstakeLoading || samsolBalance === 0 || !inputAmount || parseFloat(inputAmount) <= 0 || parseFloat(inputAmount) > samsolBalance || !hasStakeAccount}
                            onClick={handleUnstake}
                            className="w-full h-14 rounded-3xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white text-lg font-semibold transition-colors mb-4 disabled:cursor-not-allowed"
                        >
                            {unstakeLoading ? 'Processing...' : 'Unstake SOL'}
                        </button>

                        {/* Exchange Rate - Mobile */}
                        <div className="flex justify-between items-center text-black">
                            <p className="text-gray-500 text-sm">1 {getSymbol()}</p>
                            <p className="text-sm">≈1 SOL</p>
                        </div>
                    </div>

                    {/* Direct Unstake Info - Mobile */}
                    <div className="bg-white rounded-3xl p-4 sm:p-6">
                        <div className="border-l-4 border-purple-500 pl-4 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Direct Unstake</h2>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            {/* Step 1 - Mobile */}
                            <div className="flex gap-3 sm:gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black mb-1 text-sm sm:text-base">Burn SamSOL tokens</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Your SamSOL tokens are burned from your wallet, removing them from circulation.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 - Mobile */}
                            <div className="flex gap-3 sm:gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black mb-1 text-sm sm:text-base">Release staked SOL</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        SOL is released from your personal stake account and transferred back to your wallet.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 - Mobile */}
                            <div className="flex gap-3 sm:gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black mb-1 text-sm sm:text-base">Receive SOL instantly</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        SOL appears in your wallet immediately with a 1:1 exchange rate.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Note - Mobile */}
                        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs sm:text-sm text-gray-600">
                                <strong className="text-gray-800">NOTE:</strong> Direct unstaking from your personal stake account. 
                                1:1 exchange rate with no fees or slippage.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnStakeComponent;