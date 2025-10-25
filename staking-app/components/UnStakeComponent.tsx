import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import StatusPopup from './StatusPopup';
import SkeletonLoader from './SkeletonLoader';
import LightConfetti from './LightConfetti';
import FloatingTxButton from './FloatingTxButton';
import {
  getSamSOLBalance,
  checkUserStakeAccount,
  createUnstakeTransaction,
  getStakedAmount
} from '../utils/contractUtils';

// Transaction status types
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

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
  
  // Confetti and floating button states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const connection = useMemo(() => new Connection(
    process.env.EXPO_PUBLIC_SOLANA_RPC || "https://devnet.helius-rpc.com/?api-key=d634c70f-6302-40db-9292-72c25d3dda26",
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
      // Parallel fetching for maximum speed
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
    } catch (error) {
      console.error('Error fetching balances:', error);
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
    // Only allow max if user has enough SOL for gas fees (at least 0.005 SOL)
    if (solBalance && solBalance >= 0.005) {
      setInputAmount(samsolBalance.toFixed(4));
    } else {
      console.log("Need at least 0.005 SOL for gas fees");
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

  const handleUnstake = async () => {
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
      console.log("Please enter an amount to unstake");
      return;
    }

    if (unstakeLoading) {
      console.log("Transaction already in progress");
      return;
    }

    if (loading) {
      console.log("Loading wallet data...");
      return;
    }

    const unstakeAmountTokens = parseFloat(inputAmount);
    if (unstakeAmountTokens <= 0) {
      console.log("Please enter a valid amount");
      return;
    }

    if (unstakeAmountTokens > samsolBalance) {
      console.log("Insufficient SamSOL balance");
      return;
    }

    if (!hasStakeAccount) {
      console.log("No stake account found");
      return;
    }

    // Ensure user has enough SOL for gas fees
    if (solBalance === null || solBalance < 0.005) {
      console.log("Need at least 0.005 SOL for transaction fees");
      return;
    }

    setUnstakeLoading(true);
    setCurrentStatus('processing');
    setShowStatusPopup(false); // Let user click floating button to see details
    setShowFloatingButton(true);

    let txId: string = '';

    try {
      const transaction = await createUnstakeTransaction(connection, publicKey, unstakeAmountTokens);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
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
          blockhash,
          lastValidBlockHeight
        }, 'confirmed'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
        )
      ]);

      setCurrentStatus('completed');
      console.log(`Successfully unstaked ${unstakeAmountTokens} SamSOL for SOL!`);
      
      // Trigger confetti celebration! 🎉
      setShowConfetti(true);
      setShowFloatingButton(true);

      setInputAmount('');
      await refreshBalancesQuietly();

    } catch (error: unknown) {
      console.error("Unstaking error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        console.log('Transaction cancelled by user');
        setCurrentStatus('cancelled');
      } else {
        setCurrentStatus('failed');
        console.log(`Unstaking failed: ${errorMessage}`);
      }

      await refreshBalancesQuietly();
    } finally {
      setUnstakeLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <View style={styles.noWalletContainer}>
        <Text style={styles.noWalletText}>Connect your wallet to unstake tokens.</Text>
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
          <Text style={styles.title}>Unstake</Text>
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

        {/* Unstaking Card */}
        <View style={styles.unstakingContainer}>
          <View style={styles.unstakingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>You're unstaking</Text>
              <View style={styles.balanceRow}>
                {loading ? (
                  <SkeletonLoader width={140} height={14} />
                ) : (
                  <>
                    {/* <Text style={styles.balanceText}>{samsolBalance.toFixed(6)} SamSOL</Text> */}
                    <TouchableOpacity 
                      onPress={handleUseMax}
                      disabled={loading || samsolBalance === 0}
                      style={[styles.useMaxButton, (loading || samsolBalance === 0) && styles.disabledButton]}
                    >
                      <Text style={[
                        styles.useMaxText,
                        (loading || samsolBalance === 0) && styles.disabledText
                      ]}>
                        Use Max
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.tokenContainer}>
                <Image source={{ uri: samsolImageUrl }} style={styles.tokenImage} />
                <Text style={styles.tokenSymbol}>SamSOL</Text>
              </View>

              <TextInput
                style={styles.amountInput}
                value={inputAmount}
                onChangeText={setInputAmount}
                placeholder="0.0000"
                keyboardType="decimal-pad"
                placeholderTextColor="#d1d5db"
                maxLength={20}
                editable={!loading && samsolBalance > 0}
              />
            </View>

            {inputAmount && parseFloat(inputAmount) > samsolBalance && (
              <Text style={styles.errorText}>
                Insufficient balance. Max: {samsolBalance.toFixed(4)} SamSOL
              </Text>
            )}
            {solBalance !== null && solBalance < 0.005 && (
              <Text style={styles.errorText}>
                Need at least 0.005 SOL for gas fees
              </Text>
            )}
          </View>

          {/* Unstake Button */}
          <TouchableOpacity
            disabled={
              loading ||
              !signTransaction ||
              unstakeLoading || 
              samsolBalance === 0 || 
              !inputAmount || 
              parseFloat(inputAmount) <= 0 || 
              parseFloat(inputAmount) > samsolBalance || 
              !hasStakeAccount ||
              (solBalance !== null && solBalance < 0.005)
            }
            onPress={handleUnstake}
            style={[
              styles.unstakeButton,
              (loading ||
               !signTransaction ||
               unstakeLoading || 
               samsolBalance === 0 || 
               !inputAmount || 
               parseFloat(inputAmount) <= 0 || 
               parseFloat(inputAmount) > samsolBalance || 
               !hasStakeAccount ||
               (solBalance !== null && solBalance < 0.005)) && styles.disabledUnstakeButton
            ]}
          >
            <Text style={styles.unstakeButtonText}>
              {loading ? 'Loading...' : unstakeLoading ? 'Processing...' : 'Unstake SOL'}
            </Text>
          </TouchableOpacity>

          {/* Exchange Rate */}
          <View style={styles.exchangeRateContainer}>
            <Text style={styles.exchangeRateText}>1 SamSOL</Text>
            <Text style={styles.exchangeRateText}>≈1 SOL</Text>
          </View>
        </View>

        {/* Direct Unstake Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Direct Unstake</Text>
          </View>

          <View style={styles.stepsContainer}>
            {/* Step 1 */}
            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Burn SamSOL tokens</Text>
                <Text style={styles.stepDescription}>
                  Your SamSOL tokens are burned from your wallet, removing them from circulation.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Release staked SOL</Text>
                <Text style={styles.stepDescription}>
                  SOL is released from your personal stake account and transferred back to your wallet.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Receive SOL instantly</Text>
                <Text style={styles.stepDescription}>
                  SOL appears in your wallet immediately with a 1:1 exchange rate.
                </Text>
              </View>
            </View>
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              <Text style={styles.noteBold}>NOTE:</Text> Direct unstaking from your personal stake account. 1:1 exchange rate with no fees or slippage.
            </Text>
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
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  samsolValue: {
    color: '#a855f7',
  },
  stakedValue: {
    color: '#10b981',
  },
  unstakingContainer: {
    marginTop: 8,
  },
  unstakingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
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
  disabledButton: {
    opacity: 0.5,
  },
  useMaxText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9ca3af',
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
    maxWidth: 200,
    flex: 1,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'right',
  },
  unstakeButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 20,
    borderRadius: 32,
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
  disabledUnstakeButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  unstakeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exchangeRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  exchangeRateText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    borderLeftWidth: 5,
    borderLeftColor: '#a855f7',
    paddingLeft: 16,
    marginBottom: 28,
  },
  infoTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  noteContainer: {
    padding: 18,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  noteBold: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
});

export default UnStakeComponent;
