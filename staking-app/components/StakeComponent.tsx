import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useWallet } from "../contexts/WalletContext";
import { Connection, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { ArrowDown } from "./Icons";
import StatusPopup from "./StatusPopup";
import SkeletonLoader from "./SkeletonLoader";
import LightConfetti from "./LightConfetti";
import FloatingTxButton from "./FloatingTxButton";
import {
  getSamSOLBalance,
  checkUserStakeAccount,
  createUserStakeAccountTransaction,
  createStakeTransaction,
  getStakedAmount,
  createTokenAccountIfNeeded
} from "../utils/contractUtils";

// Transaction status types
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

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
  
  // Confetti and floating button states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const connection = useMemo(() => new Connection(
    process.env.EXPO_PUBLIC_SOLANA_RPC || "https://devnet.helius-rpc.com/?api-key=d634c70f-6302-40db-9292-72c25d3dda26",
    "confirmed"
  ), []);

  const samsolImageUrl = "https://solana-launchpad-assets.s3.ap-south-1.amazonaws.com/uploads/1754915233501-mengyu-xu-2yUG4ZLz8Ck.jpg";
  const solImageUrl = "https://imgs.search.brave.com/R0Co0bsNhdyEjIgBD4lTffUBuxL7PGFDf14_979lQlk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc2Vla2xvZ28u/Y29tL2xvZ28tcG5n/LzY0LzMvc29sYW5h/LWxvZ28tcG5nX3Nl/ZWtsb2dvLTY0MDI2/Ni5wbmc";

  // Fetch all balances and account info - OPTIMIZED with parallel fetching
  const fetchBalances = useCallback(async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      // Fetch ALL data in parallel for maximum speed
      const [
        balance,
        { balance: samsolBal },
        hasAccount,
      ] = await Promise.all([
        connection.getBalance(publicKey),
        getSamSOLBalance(connection, publicKey),
        checkUserStakeAccount(connection, publicKey),
      ]);

      // Update balances immediately
      setSolBalance(balance / LAMPORTS_PER_SOL);
      setSamsolBalance(samsolBal);
      setHasStakeAccount(hasAccount);

      // Fetch staked amount only if account exists (this is fast)
      if (hasAccount) {
        const staked = await getStakedAmount(connection, publicKey);
        setStakedAmount(staked);
      } else {
        setStakedAmount(0);
      }
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  const refreshBalancesQuietly = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      // Parallel fetching for fast refresh
      const [
        balance,
        { balance: samsolBal },
        hasAccount,
      ] = await Promise.all([
        connection.getBalance(publicKey),
        getSamSOLBalance(connection, publicKey),
        checkUserStakeAccount(connection, publicKey),
      ]);

      setSolBalance(balance / LAMPORTS_PER_SOL);
      setSamsolBalance(samsolBal);
      setHasStakeAccount(hasAccount);

      if (hasAccount) {
        const staked = await getStakedAmount(connection, publicKey);
        setStakedAmount(staked);
      } else {
        setStakedAmount(0);
      }
    } catch (err) {
      console.error("Error refreshing balances:", err);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    }
  }, [publicKey, fetchBalances]);

  // Auto-hide confetti after 3 seconds and floating button after 5 seconds
  useEffect(() => {
    if (showConfetti) {
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      return () => clearTimeout(confettiTimer);
    }
  }, [showConfetti]);

  useEffect(() => {
    if (showFloatingButton && (currentStatus === 'completed' || currentStatus === 'failed')) {
      const buttonTimer = setTimeout(() => {
        setShowFloatingButton(false);
      }, 5000);
      
      return () => clearTimeout(buttonTimer);
    }
  }, [showFloatingButton, currentStatus]);

  const handleUseMax = () => {
    if (solBalance) {
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

  const handleClosePopup = async () => {
    setShowStatusPopup(false);
    setCurrentTxnId('');
    setCurrentStatus('pending');
    
    if (currentStatus === 'completed') {
      await refreshBalancesQuietly();
    }
  };

  const handleStake = async () => {
    // Comprehensive wallet check
    if (!publicKey) {
      console.log("Please connect your wallet first");
      return;
    }

    if (!signTransaction) {
      console.log("Wallet not fully initialized");
      return;
    }

    if (!inputAmount) {
      console.log("Please enter an amount to stake");
      return;
    }

    if (stakeStarted) {
      console.log("Transaction already in progress");
      return;
    }

    if (loading) {
      console.log("Loading wallet data...");
      return;
    }

    const stakeAmountSOL = parseFloat(inputAmount);
    if (stakeAmountSOL <= 0) {
      console.log("Please enter a valid amount");
      return;
    }

    if (solBalance && stakeAmountSOL > solBalance) {
      console.log("Insufficient SOL balance");
      return;
    }

    setStakeStarted(true);
    setCurrentStatus('processing');
    setShowStatusPopup(false); // Let user click floating button to see details
    setShowFloatingButton(true);

    let txId: string = '';

    try {
      if (!hasStakeAccount) {
        console.log("Creating user stake account...");
        const createAccountTx = await createUserStakeAccountTransaction(publicKey);
        
        const { blockhash: createBlockhash, lastValidBlockHeight: createHeight } = await connection.getLatestBlockhash('finalized');
        createAccountTx.recentBlockhash = createBlockhash;
        createAccountTx.feePayer = publicKey;

        const signedCreateTx = await signTransaction(createAccountTx);
        const createTxId = await connection.sendRawTransaction(signedCreateTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        
        await connection.confirmTransaction({
          signature: createTxId,
          blockhash: createBlockhash,
          lastValidBlockHeight: createHeight
        }, 'confirmed');
        
        setHasStakeAccount(true);
        // Account is now available, no delay needed
      }

      const { instruction: createTokenAccountIx } = await createTokenAccountIfNeeded(
        connection,
        publicKey,
        publicKey
      );

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
        
        await connection.confirmTransaction({
          signature: tokenTxId,
          blockhash: tokenBlockhash,
          lastValidBlockHeight: tokenHeight
        }, 'confirmed');
        
        // Account is confirmed and available immediately
      }

      const transaction = await createStakeTransaction(connection, publicKey, stakeAmountSOL);
      
      const { blockhash: stakeBlockhash, lastValidBlockHeight: stakeHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = stakeBlockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      
      txId = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      
      setCurrentTxnId(txId);
      setCurrentStatus('pending');

      await Promise.race([
        connection.confirmTransaction({
          signature: txId,
          blockhash: stakeBlockhash,
          lastValidBlockHeight: stakeHeight
        }, 'confirmed'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
        )
      ]);
      
      setCurrentStatus('completed');
      console.log(`Successfully staked ${stakeAmountSOL} SOL!`);
      
      // Trigger confetti celebration! 🎉
      setShowConfetti(true);
      setShowFloatingButton(true);
      
      setInputAmount('');
      await refreshBalancesQuietly();

    } catch (error: unknown) {
      console.error("Staking error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setCurrentStatus('cancelled');
      } else {
        setCurrentStatus('failed');
      }
      
      await refreshBalancesQuietly();
    } finally {
      setStakeStarted(false);
    }
  };

  if (!publicKey) {
    return (
      <View style={styles.noWalletContainer}>
        <Text style={styles.noWalletText}>Connect your wallet to start staking.</Text>
      </View>
    );
  }

  return (
    <>
      {/* Lightweight Confetti Animation */}
      <LightConfetti active={showConfetti} duration={3000} />
      
      {/* Floating Transaction Status Button */}
      <FloatingTxButton
        visible={showFloatingButton}
        status={currentStatus}
        onPress={() => setShowStatusPopup(!showStatusPopup)}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StatusPopup
          visible={showStatusPopup}
          status={currentStatus}
          txnId={currentTxnId}
          amount={inputAmount}
          onClose={handleClosePopup}
        />

      <View style={styles.content}>
        {/* Header with Title and APY */}
        <View style={styles.header}>
          <Text style={styles.title}>Get SamSOL</Text>
          <View style={styles.apyContainer}>
            <Text style={styles.apyLabel}>APY</Text>
            <Text style={styles.apyValue}>6.92%</Text>
          </View>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, styles.halfCard]}>
            <Text style={styles.balanceLabel}>SOL Balance</Text>
            {loading || solBalance === null ? (
              <SkeletonLoader width="80%" height={26} style={{ alignSelf: 'center' }} />
            ) : (
              <Text style={styles.balanceValue}>{solBalance.toFixed(4)}</Text>
            )}
          </View>
          <View style={[styles.balanceCard, styles.halfCard]}>
            <Text style={styles.balanceLabel}>SamSOL Balance</Text>
            {loading ? (
              <SkeletonLoader width="80%" height={26} style={{ alignSelf: 'center' }} />
            ) : (
              <Text style={[styles.balanceValue, styles.samsolValue]}>{samsolBalance.toFixed(4)}</Text>
            )}
          </View>
        </View>

        {/* Total Staked Card */}
        <View style={[styles.balanceCard, styles.fullCard]}>
          <Text style={styles.balanceLabel}>Total Staked</Text>
          {loading ? (
            <SkeletonLoader width="60%" height={26} style={{ alignSelf: 'center' }} />
          ) : (
            <Text style={[styles.balanceValue, styles.stakedValue]}>{stakedAmount.toFixed(4)} SOL</Text>
          )}
        </View>

        {/* Staking Cards */}
        <View style={styles.stakingContainer}>
          {/* You're staking card */}
          <View style={styles.stakingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>You're staking</Text>
              <View style={styles.balanceRow}>
                {loading || solBalance === null ? (
                  <SkeletonLoader width={120} height={14} />
                ) : (
                  <>
                    <Text style={styles.balanceText}>{solBalance.toFixed(4)} SOL</Text>
                    <TouchableOpacity onPress={handleUseMax} style={styles.useMaxButton}>
                      <Text style={styles.useMaxText}>Use Max</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.tokenContainer}>
                <Image source={{ uri: solImageUrl }} style={styles.tokenImage} />
                <Text style={styles.tokenSymbol}>SOL</Text>
              </View>

              <TextInput
                style={[styles.amountInput, inputError && styles.inputError]}
                value={inputAmount}
                onChangeText={handleInputChange}
                placeholder="0.0"
                keyboardType="decimal-pad"
                placeholderTextColor="#d1d5db"
              />
            </View>
            {inputError && (
              <Text style={styles.errorText}>Amount exceeds balance</Text>
            )}
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <ArrowDown size={36} color="#a855f7" />
          </View>

          {/* To Receive card */}
          <View style={styles.stakingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>To Receive</Text>
              <Text style={styles.priceImpactText}>0% Price Impact</Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.tokenContainer}>
                <Image source={{ uri: samsolImageUrl }} style={styles.tokenImage} />
                <Text style={styles.tokenSymbol}>SamSOL</Text>
              </View>

              <Text style={[styles.amountInput, styles.disabledInput]}>
                {inputAmount ? parseFloat(inputAmount).toFixed(1) : '0'}
              </Text>
            </View>
          </View>

          {/* Convert Button */}
          <TouchableOpacity 
            onPress={handleStake} 
            disabled={
              loading || 
              !signTransaction || 
              inputError || 
              stakeStarted || 
              !inputAmount || 
              parseFloat(inputAmount) <= 0
            } 
            style={[
              styles.convertButton,
              (loading || 
               !signTransaction || 
               inputError || 
               stakeStarted || 
               !inputAmount || 
               parseFloat(inputAmount) <= 0) && styles.disabledButton
            ]}
          >
            <Text style={styles.convertButtonText}>
              {loading ? "Loading..." : stakeStarted ? "Processing..." : "Convert to SamSOL"}
            </Text>
          </TouchableOpacity>

          {/* Exchange Rate */}
          <View style={styles.exchangeRateContainer}>
            <Text style={styles.exchangeRateText}>1 SamSOL</Text>
            <Text style={styles.exchangeRateText}>~1 SOL</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f0fa',
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f1f0fa',
  },
  noWalletText: {
    fontSize: 20,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f1f0fa',
  },
  loadingText: {
    fontSize: 20,
    color: '#6b7280',
    marginTop: 16,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000000',
  },
  apyContainer: {
    alignItems: 'flex-end',
  },
  apyLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  apyValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#a855f7',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  halfCard: {
    flex: 1,
  },
  fullCard: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    textAlign:"center"
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign:"center"

  },
  samsolValue: {
    color: '#a855f7',
  },
  stakedValue: {
    color: '#10b981',
  },
  stakingContainer: {
    marginTop: 8,
  },
  stakingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  balanceText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  useMaxButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  useMaxText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  priceImpactText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  tokenSymbol: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
  },
  amountInput: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'right',
    backgroundColor: 'transparent',
    borderWidth: 0,
    minWidth: 120,
    color: '#9ca3af',
  },
  inputError: {
    color: '#ef4444',
  },
  disabledInput: {
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'right',
    marginTop: 8,
  },
  arrowContainer: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 20,
  },
  convertButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 20,
    borderRadius: 32,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#a855f7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  convertButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exchangeRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  exchangeRateText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default StakeComponent;
