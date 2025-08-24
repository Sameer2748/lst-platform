"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {  ArrowRightIcon, CheckCircle, AlertCircle, Clock, XCircle, ArrowDownIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios"
import Image from "next/image";


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
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
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
                    <div className="bg-white rounded-lg p-3 mb-6">
                        <p className="text-sm text-gray-500">Transaction ID:</p>
                        <p className="text-xs font-mono break-all text-gray-700">{txnId}</p>
                    </div>
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
    // const [samsolDetail, setSamSolDetail] = useState<TokenDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [inputError, setInputError] = useState(false);
    const [stakeStarted, setStakeStarted] = useState(false);
    
    // New states for transaction polling
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [currentTxnId, setCurrentTxnId] = useState<string>('');
    const [currentStatus, setCurrentStatus] = useState<TransactionStatus>('pending');
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    const connection = useMemo(() => new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
        "confirmed"
    ), []);

    const vaultKey = new PublicKey(process.env.PLATFORM_WALLET! || "DTceCyCi4ypRbHqjo4S7huHQr3j9NAcNf4wHkvN5A1cT")
    const Backend_url = process.env.BACKEND_URL! || "https://lst-backend.100xsam.store";
    const samsolImageUrl = "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/uploads/1754915233501-mengyu-xu-2yUG4ZLz8Ck.jpg"
    const solImageUrl = "https://imgs.search.brave.com/YRcgd3-E4u7oewRc-ZSSbJTG3hRm20spgyUM-1BYYeU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/YnJhbmRmZXRjaC5p/by9pZGUwTlV1VEhP/L3cvNDAwL2gvNDAw/L3RoZW1lL2Rhcmsv/aWNvbi5qcGVnP2M9/MWJ4aWQ2NE11cDdh/Y3pld1NBWU1YJnQ9/MTY2NzY0NDU5NjQ2/NQ"

    // Fetch SOL balance
    const fetchSol = useCallback(async () => {
        setLoading(true);
        try {
            const balance = await connection.getBalance(publicKey!);
            setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (err) {
            console.error("Error fetching SOL balance:", err);
        }
        setLoading(false);
    }, [publicKey,connection]);
    // const fetchSamSol = async () => {
    //     if (!publicKey) {
    //       console.error('Wallet not connected');
    //       return;
    //     }
      
    //     // Replace this with the actual SAMSOL token mint address
    //     const SAMSOL_MINT_ADDRESS = "5fp4btmfcwqhmoxf8TJc4Zj7rgRafJJi8KwLu743kVuZ";
        
    //     try {
    //       const connection = new Connection(
    //         process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
    //         "confirmed"
    //       );
      
    //       // Get token accounts for this specific mint
    //       const resp = await connection.getParsedTokenAccountsByOwner(
    //         publicKey,
    //         { 
    //           mint: new PublicKey(SAMSOL_MINT_ADDRESS)
    //         },
    //         "confirmed"
    //       );
      
    //       if (resp.value.length === 0) {
    //         console.log('No SAMSOL tokens found in wallet');
    //         setSamSolDetail(null);
    //         return;
    //       }
      
    //       // Get the first (usually only) token account for this mint
    //       const tokenAccount = resp.value[0];
    //       const info = tokenAccount.account.data.parsed.info;
          
          
    //       const rawTokenData = {
    //         tokenAccount: tokenAccount.pubkey.toBase58(),
    //         mint: info.mint as string,
    //         amount: BigInt(info.tokenAmount.amount as string),
    //         decimals: info.tokenAmount.decimals as number,
    //         uiAmount: info.tokenAmount.uiAmount as number | null,
    //         owner: info.owner as string,
    //       };
      
    //       // Only proceed if there's a positive balance
    //       if (rawTokenData.amount <= BigInt(0)) {
    //         console.log('SAMSOL token balance is zero');
    //         setSamSolDetail(null);
    //         return;
    //       }
      
    //       // Create UMI instance for metadata fetching
    //       const umi = createUmi(
    //         process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"
    //       ).use(mplTokenMetadata());
      
    //       try {
    //         // Fetch token metadata
    //         const asset = await fetchDigitalAsset(umi, umiPk(SAMSOL_MINT_ADDRESS));
    //         const onchainName = asset.metadata.name;
    //         const onchainSymbol = asset.metadata.symbol;
    //         const uri = asset.metadata.uri;
      
    //         // Fetch off-chain metadata if URI exists
    //         let offchain: any = null;
    //         if (uri && /^https?:\/\//i.test(uri)) {
    //           try {
    //             const res = await fetch(uri);
    //             if (res.ok) {
    //               offchain = await res.json();
    //             }
    //           } catch (error) {
    //             console.error('Error fetching off-chain metadata:', error);
    //           }
    //         }
      
    //         // Combine all token details
    //         const tokenDetail: TokenDetail = {
    //           ...rawTokenData,
    //           onchainName,
    //           onchainSymbol,
    //           metadataUri: uri || null,
    //           image: offchain?.image ?? null,
    //           description: offchain?.description ?? null,
    //         };
      
    //         setSamSolDetail(tokenDetail);
    //         console.log('SAMSOL token details:', tokenDetail);
      
    //       } catch (metadataError) {
    //         console.error('Error fetching metadata:', metadataError);
            
    //         // Set token details without metadata
    //         const tokenDetail: TokenDetail = {
    //           ...rawTokenData,
    //           onchainName: null,
    //           onchainSymbol: null,
    //           metadataUri: null,
    //           image: null,
    //           description: null,
    //         };
      
    //         setSamSolDetail(tokenDetail);
    //       }
      
    //     } catch (error) {
    //       console.error('Error fetching SAMSOL token:', error);
    //       setSamSolDetail(null);
    //     }
    //   };
    useEffect(() => {
        if (!publicKey) return;
        fetchSol();
        // fetchSamSol()
        
    }, [publicKey, fetchSol]);

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // Function to check transaction status
    const checkTransactionStatus = async (txnId: string): Promise<TransactionStatus> => {
        try {
            const response = await axios.get(`${Backend_url}/transactions/status/${txnId}`);
            return response.data.status as TransactionStatus;
        } catch (error) {
            console.error('Error checking transaction status:', error);
            return 'pending'; // Default to pending on error
        }
    };

    // Function to start polling for transaction status
    const startPolling = (txnId: string) => {
        setCurrentTxnId(txnId);
        setCurrentStatus('pending');
        setShowStatusPopup(true);

        const interval = setInterval(async () => {
            const status = await checkTransactionStatus(txnId);
            setCurrentStatus(status);

            // Stop polling if transaction is in a final state
            if (status === 'completed' || status === 'failed' || status === 'cancelled') {
                clearInterval(interval);
                setPollingInterval(null);
            }
        }, 3000); // Poll every 3 seconds

        setPollingInterval(interval);

        // Safety timeout - stop polling after 5 minutes
        setTimeout(() => {
            if (interval) {
                clearInterval(interval);
                setPollingInterval(null);
                setCurrentStatus('failed'); // Assume failed after timeout
            }
        }, 300000); // 5 minutes
    };

    const handleUseMax = () => {
        setInputAmount(solBalance?.toString() ?? "0");
        setInputError(false);
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
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
        setCurrentTxnId('');
        setCurrentStatus('pending');
    };

    const handleStake = async () => {
        if (!publicKey || !signTransaction) {
            toast.error("Wallet not connected or cannot sign transactions");
            return;
        }

        if (!inputAmount || parseFloat(inputAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const userWallet = new PublicKey(publicKey!);
        setStakeStarted(true);

        try {
            toast.info("Initiating stake transaction...");

            // Create transaction in backend
            const response = await axios.post(`${Backend_url}/stake-init`, {
                userWallet: publicKey,
                amount: parseFloat(inputAmount)
            });
            
            const txnId = response.data.txId || response.data.txnId || response.data.transactionId || response.data.id;
            console.log("Backend transaction ID:", txnId);
            console.log("Full backend response:", response.data);

            if (!txnId) {
                throw new Error("No transaction ID received from backend");
            }

            // Create blockchain transaction
            const txn = new Transaction();
            txn.add(
                SystemProgram.transfer({
                    fromPubkey: userWallet,
                    toPubkey: vaultKey,
                    lamports: parseFloat(inputAmount) * 1e9,
                })
            );

            // Get a recent blockhash
            txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            txn.feePayer = userWallet;

            // Sign and send transaction
            console.log("Signing transaction...");
            const signedTx = await signTransaction(txn);

            // Send transaction
            const solanaSignature = await connection.sendRawTransaction(signedTx.serialize());
            console.log("Solana transaction signature:", solanaSignature);

            // Start background confirmation (non-blocking)
            connection.confirmTransaction({ 
                signature: solanaSignature, 
                blockhash: (await connection.getLatestBlockhash()).blockhash, 
                lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight 
            }, "confirmed")
                .then(() => console.log("Solana transaction confirmed"))
                .catch(err => console.error("Solana confirmation failed:", err));

            toast.success("Transaction submitted successfully!");

            // Start polling for status updates
            startPolling(txnId);

            // Reset form and fetch the token detail again  
            fetchSol();
            setInputAmount('');
            
        } catch (error) {
            console.error("Error during staking:", error);
            toast.error("Failed to submit transaction. Please try again.");
        } finally {
            setStakeStarted(false);
        }
    };

    if (!publicKey) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center text-gray-400 text-xl px-4">
                <p className="text-center">Connect your wallet to see SOL balance.</p>
            </div>
        );
    }

    if (loading || solBalance === null) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center text-gray-500 text-xl animate-pulse px-4">
                <p className="text-center">Loading SOL balance...</p>
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
                                    <Image className="rounded-full w-10 h-10 " src={solImageUrl} alt="samsol" />
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
                                    <Image className="rounded-full w-10 h-10 " src={samsolImageUrl} alt="Sam" />
                                    <span className="font-bold text-3xl">Sam</span>
                                </div>
                            </div>

                            <div className="text-right text-gray-400">
                                <input
                                    type="number"
                                    value={(parseFloat(inputAmount) || 0)}
                                    className="text-4xl font-bold text-right bg-transparent border-none outline-none   md:w-44 lg:w-46 xl:w-86"
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
                                <Image className="rounded-full w-12 h-12" src={solImageUrl} alt="sol" />
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
                                <Image className="rounded-full w-12 h-12" src={samsolImageUrl} alt="Sam" />
                                <span className="font-bold text-2xl">Sam</span>
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
                                className={`w-full h-12 rounded-3xl text-white text-md cursor-pointer text-semibold ${
                                    inputError === true || stakeStarted || !inputAmount || parseFloat(inputAmount) <= 0
                                        ? "bg-purple-400 text-black" 
                                        : "bg-purple-500 hover:bg-purple-600"
                                } transition-colors`}
                            >
                                {stakeStarted ? "Processing..." : "Convert to Sam"}
                            </button>
                            <div className="flex justify-between items-center text-black pt-4 px-2">
                                <p className="text-gray-500 text-sm">1 Sam</p>
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
                                inputError === true || stakeStarted || !inputAmount || parseFloat(inputAmount) <= 0
                                    ? "bg-purple-400 text-black" 
                                    : "bg-purple-500 hover:bg-purple-600"
                            } transition-colors`}
                        >
                            {stakeStarted ? "Processing..." : "Convert to Sam"}
                        </button>
                        <div className="flex justify-between items-center text-black pt-4 px-2">
                            <p className="text-gray-500 text-sm">1 Sam</p>
                            <p className="text-sm">~1 SOL</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StakeComponent;