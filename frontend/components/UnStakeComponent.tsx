import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPk } from "@metaplex-foundation/umi";
import Image from 'next/image';
interface OffchainMetadata {
    image?: string;
    description?: string;
    [key: string]: unknown;
  }
  
// Define the interface for the token details
interface TokenDetail {
    tokenAccount: string;
    mint: string;
    amount: bigint;
    decimals: number;
    uiAmount: number | null;
    owner: string;
    onchainName: string | null;
    onchainSymbol: string | null;
    metadataUri: string | null;
    image: string | null;
    description: string | null;
}

const UnStakeComponent = () => {
    const { publicKey, signTransaction } = useWallet();
    const [samsolDetail, setSamSolDetail] = useState<TokenDetail | null>({
        tokenAccount: "21E7eUyhwhqkxssZ5A2VwKiRUkmKjAJL9P4DwXsRVgHx",
        mint: "5fp4btmfcwqhmoxf8TJc4Zj7rgRafJJi8KwLu743kVuZ",
        amount: BigInt(5000000000), // bigint
        decimals: 9,
        uiAmount: 5,
        owner: "5fxqKBcGKhx4zs4zdqocYuJxYNk4sCYJ4yXKNyyDebZP",
        onchainName: "Sameer",
        onchainSymbol: "Sam",
        metadataUri: "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/metadata/1754915236079-Sam-metadata.json",
        image: "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/uploads/1754915233501-mengyu-xu-2yUG4ZLz8Ck.jpg",
        description: "Lets go sameer",
      });
const [loading, setLoading] = useState(false);
const [inputAmount, setInputAmount] = useState('');
const [unstakeLoading, setUnstakeLoading] = useState(false);
const [unstakeStatus, setUnstakeStatus] = useState<string>('');

const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
    "confirmed"
), []);
const samsolImageUrl = "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/uploads/1754915233501-mengyu-xu-2yUG4ZLz8Ck.jpg";
const Backend_url = process.env.BACKEND_URL! || "https://lst-backend.100xsam.store";

const fetchSamSol = useCallback(async () => {
    if (!publicKey) {
        console.error('Wallet not connected');
        return;
    }

    const SAMSOL_MINT_ADDRESS = "5fp4btmfcwqhmoxf8TJc4Zj7rgRafJJi8KwLu743kVuZ";

    setLoading(true);
    try {
        // Get token accounts for this specific mint
        const resp = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            {
                mint: new PublicKey(SAMSOL_MINT_ADDRESS)
            },
            "confirmed"
        );

        if (resp.value.length === 0) {
            console.log('No SAMSOL tokens found in wallet');
            setSamSolDetail(null);
            return;
        }

        // Get the first (usually only) token account for this mint
        const tokenAccount = resp.value[0];
        const info = tokenAccount.account.data.parsed.info;

        const rawTokenData = {
            tokenAccount: tokenAccount.pubkey.toBase58(),
            mint: info.mint as string,
            amount: BigInt(info.tokenAmount.amount as string),
            decimals: info.tokenAmount.decimals as number,
            uiAmount: info.tokenAmount.uiAmount as number | null,
            owner: info.owner as string,
        };

        // Only proceed if there's a positive balance
        if (rawTokenData.amount <= BigInt(0)) {
            console.log('SAMSOL token balance is zero');
            setSamSolDetail(null);
            return;
        }

        // Create UMI instance for metadata fetching
        const umi = createUmi(
            process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"
        ).use(mplTokenMetadata());

        try {
            // Fetch token metadata
            const asset = await fetchDigitalAsset(umi, umiPk(SAMSOL_MINT_ADDRESS));
            const onchainName = asset.metadata.name;
            const onchainSymbol = asset.metadata.symbol;
            const uri = asset.metadata.uri;

            // Fetch off-chain metadata if URI exists
            let offchain: OffchainMetadata | null = null;
            if (uri && /^https?:\/\//i.test(uri)) {
                try {
                    const res = await fetch(uri);
                    if (res.ok) {
                        offchain = await res.json();
                    }
                } catch (error) {
                    console.error('Error fetching off-chain metadata:', error);
                }
            }

            // Combine all token details
            const tokenDetail: TokenDetail = {
                ...rawTokenData,
                onchainName,
                onchainSymbol,
                metadataUri: uri || null,
                image: offchain?.image ?? null,
                description: offchain?.description ?? null,
            };

            setSamSolDetail(tokenDetail);
            console.log('SAMSOL token details:', tokenDetail);

        } catch (metadataError) {
            console.error('Error fetching metadata:', metadataError);

            // Set token details without metadata
            const tokenDetail: TokenDetail = {
                ...rawTokenData,
                onchainName: null,
                onchainSymbol: null,
                metadataUri: null,
                image: null,
                description: null,
            };

            setSamSolDetail(tokenDetail);
        }

    } catch (error) {
        console.error('Error fetching SAMSOL token:', error);
        setSamSolDetail(null);
    } finally {
        setLoading(false);
    }
}, [publicKey, connection]);

useEffect(() => {
    if (publicKey) {
        fetchSamSol();
    }
}, [publicKey,fetchSamSol]);

const handleUseMax = () => {
    if (samsolDetail && samsolDetail.uiAmount) {
        setInputAmount(samsolDetail.uiAmount.toString());
    }
};

// Get balance for display
const getBalance = () => {
    if (!publicKey) return '0.000';
    if (loading) return '...';
    if (!samsolDetail || !samsolDetail.uiAmount) return '0.000';
    return samsolDetail.uiAmount.toFixed(6);
};

const handleUnstake = async () => {
    if (!publicKey || !signTransaction || !samsolDetail || !inputAmount) {
        console.error('Missing required data for unstaking');
        return;
    }

    const amount = parseFloat(inputAmount);
    if (amount <= 0 || amount > (samsolDetail.uiAmount || 0)) {
        console.error('Invalid amount');
        return;
    }

    setUnstakeLoading(true);
    setUnstakeStatus('Preparing transaction...');

    try {
        // Step 1: Get pre-signed transaction from backend
        setUnstakeStatus('Creating pre-signed transaction...');
        console.log('🚀 Step 1: Requesting pre-signed transaction from backend');

        const response = await fetch(`${Backend_url}/unstake`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userWallet: publicKey.toBase58(),
                amount: amount,
                // No signedBurnTx - this is the first call
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend response error:', response.status, errorText);
            throw new Error(`Failed to create transaction: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Received pre-signed transaction from backend');
        console.log('Backend message:', data.message);

        if (!data.tx) {
            throw new Error('No transaction returned from backend');
        }

        // Step 2: User signs the pre-signed transaction
        setUnstakeStatus('Waiting for your signature...');
        console.log('🔏 Step 2: User signing the pre-signed transaction');

        const transaction = Transaction.from(Buffer.from(data.tx, 'base64'));

        console.log('📝 Requesting signature from Phantom wallet...');
        const signedTransaction = await signTransaction(transaction);
        console.log('✅ Transaction signed by user');

        // Step 3: Send fully signed transaction back for submission
        setUnstakeStatus('Submitting transaction...');
        console.log('🚀 Step 3: Sending fully signed transaction to backend');

        const finalResponse = await fetch(`${Backend_url}/unstake`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userWallet: publicKey.toBase58(),
                amount: amount,
                signedBurnTx: Buffer.from(signedTransaction.serialize()).toString('base64'),
            }),
        });

        console.log('📡 Fully signed transaction sent to backend');

        if (!finalResponse.ok) {
            const errorText = await finalResponse.text();
            console.error('Final submission error:', finalResponse.status, errorText);
            throw new Error(`Transaction submission failed: ${finalResponse.status}`);
        }

        const finalData = await finalResponse.json();
        console.log('✅ Final response from backend:', finalData);

        if (finalData.success) {
            setUnstakeStatus('Unstake successful!');
            console.log('🎉 Transaction completed! Signature:', finalData.txSig);
            console.log('Success message:', finalData.message);

            // Clear input and refresh balance
            setInputAmount('');
            await fetchSamSol(); // Refresh token balance

            // Clear success message after 3 seconds
            setTimeout(() => {
                setUnstakeStatus('');
            }, 3000);
        } else {
            throw new Error(`Unstake failed: ${JSON.stringify(finalData)}`);
        }

    } catch (error: unknown) {
        console.error('❌ Unstake error:', error);

        // More specific error messages
        let errorMessage = 'Unstake failed. Please try again.';
        if (error instanceof Error) {
            if (error.message.includes('User rejected')) {
                errorMessage = 'Transaction cancelled by user.';
            } else if (error.message.includes('Insufficient funds')) {
                errorMessage = 'Insufficient balance for transaction.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
        }

        setUnstakeStatus(errorMessage);

        // Clear error message after 5 seconds
        setTimeout(() => {
            setUnstakeStatus('');
        }, 5000);
    } finally {
        setUnstakeLoading(false);
        console.log('🏁 Unstake process completed');
    }
};

// Get symbol for display
const getSymbol = () => {
    return samsolDetail?.onchainSymbol || 'Sam';
};

if (!publicKey) {
    return (
        <div className="w-full h-[60vh] flex items-center justify-center text-gray-400 text-xl px-4">
            <p className="text-center">Connect your wallet to unstake tokens.</p>
        </div>
    );
}

return (
    <div className="pt-16 px-2 sm:px-4 md:px-0 w-full">
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
                                    disabled={loading || !samsolDetail}
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
                                    src={samsolDetail?.image || samsolImageUrl}
                                    alt="SamSOL"
                                />
                                <span className="font-semibold text-2xl">{getSymbol()}</span>
                            </div>

                            {/* Amount Input */}
                            <div className="text-right">
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => setInputAmount(e.target.value)}
                                    className="text-4xl font-bold text-right bg-transparent border-none outline-none w-44 sm:w-64 md:w-84 pr-5 text-gray-300"
                                    placeholder="0.000"
                                    max={samsolDetail?.uiAmount || 0}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Unstake Button */}
                    <button
                        disabled={unstakeLoading || !samsolDetail || !inputAmount || parseFloat(inputAmount) <= 0 || parseFloat(inputAmount) > (samsolDetail?.uiAmount || 0)}
                        onClick={handleUnstake}
                        className="w-full h-14 rounded-3xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white text-md cursor-pointer font-semibold transition-colors"
                    >
                        {unstakeLoading ? 'Processing...' : 'Unstake SOL'}
                    </button>

                    {/* Status Message */}
                    {unstakeStatus && (
                        <div className={`text-center text-sm px-2 ${unstakeStatus.includes('successful') ? 'text-green-600' :
                            unstakeStatus.includes('failed') ? 'text-red-500' :
                                'text-blue-500'
                            }`}>
                            {unstakeStatus}
                        </div>
                    )}

                    {/* Exchange Rate */}
                    <div className="flex justify-between items-center text-black px-2">
                        <p className="text-gray-500 text-sm">1 {getSymbol()}</p>
                        <p className="text-sm">≈1.226 SOL</p>
                    </div>

                    {/* Balance Error */}
                    {inputAmount && samsolDetail && parseFloat(inputAmount) > (samsolDetail.uiAmount || 0) && (
                        <p className="text-sm text-red-500 px-2">
                            Insufficient balance. Max: {samsolDetail.uiAmount} {getSymbol()}
                        </p>
                    )}
                </div>

                {/* Right Side - Instant Unstake Info */}
                <div className="bg-white rounded-3xl p-6">
                    <div className="border-l-4 border-purple-500 pl-4 mb-6">
                        <h2 className="text-2xl font-bold text-black mb-2">Instant Unstake</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold text-black mb-1">Swap Sam for SOL via Jupiter</h3>
                                <p className="text-sm text-gray-600">
                                    Jupiter aggregates liquidity from various DEXs to find you the best price for your swap.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold text-black mb-1">Review price impact and slippage</h3>
                                <p className="text-sm text-gray-600">
                                    Price impact shows how your trade affects the market price. High price impact means you may receive less SOL than expected. Slippage tolerance protects you from price changes while your transaction is processing.
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
                                    Once the swap is confirmed, you will receive SOL in your wallet immediately, ready to use.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600">
                            <strong className="text-gray-800">NOTE:</strong> Instant unstaking via Jupiter may have higher fees due to price impact, but offers immediate liquidity without waiting for epoch boundaries. For better rates with larger amounts, consider using Delayed Unstake.
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
                                disabled={loading || !samsolDetail}
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
                                src={samsolDetail?.image || samsolImageUrl}
                                alt="SamSOL"
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
                                max={samsolDetail?.uiAmount || 0}
                            />
                        </div>
                    </div>

                    {/* Balance Error - Mobile */}
                    {inputAmount && samsolDetail && parseFloat(inputAmount) > (samsolDetail.uiAmount || 0) && (
                        <p className="text-sm text-red-500 mb-4">
                            Insufficient balance. Max: {samsolDetail.uiAmount} {getSymbol()}
                        </p>
                    )}

                    {/* Unstake Button - Mobile */}
                    <button
                        disabled={unstakeLoading || !samsolDetail || !inputAmount || parseFloat(inputAmount) <= 0 || parseFloat(inputAmount) > (samsolDetail?.uiAmount || 0)}
                        onClick={handleUnstake}
                        className="w-full h-14 rounded-3xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white text-lg font-semibold transition-colors mb-4"
                    >
                        {unstakeLoading ? 'Processing...' : 'Unstake SOL'}
                    </button>

                    {/* Status Message - Mobile */}
                    {unstakeStatus && (
                        <div className={`text-center text-sm mb-4 ${unstakeStatus.includes('successful') ? 'text-green-600' :
                            unstakeStatus.includes('failed') ? 'text-red-500' :
                                'text-blue-500'
                            }`}>
                            {unstakeStatus}
                        </div>
                    )}

                    {/* Exchange Rate - Mobile */}
                    <div className="flex justify-between items-center text-black">
                        <p className="text-gray-500 text-sm">1 {getSymbol()}</p>
                        <p className="text-sm">≈1.226 SOL</p>
                    </div>
                </div>

                {/* Instant Unstake Info - Mobile */}
                <div className="bg-white rounded-3xl p-4 sm:p-6">
                    <div className="border-l-4 border-purple-500 pl-4 mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Instant Unstake</h2>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        {/* Step 1 - Mobile */}
                        <div className="flex gap-3 sm:gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold text-black mb-1 text-sm sm:text-base">Swap Sam for SOL via Jupiter</h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Jupiter aggregates liquidity from various DEXs to find you the best price for your swap.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 - Mobile */}
                        <div className="flex gap-3 sm:gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold text-black mb-1 text-sm sm:text-base">Review price impact and slippage</h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Price impact shows how your trade affects the market price. High price impact means you may receive less SOL than expected.
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
                                    Once the swap is confirmed, you will receive SOL in your wallet immediately, ready to use.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Note - Mobile */}
                    <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-600">
                            <strong className="text-gray-800">NOTE:</strong> Instant unstaking via Jupiter may have higher fees due to price impact, but offers immediate liquidity without waiting for epoch boundaries.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default UnStakeComponent;