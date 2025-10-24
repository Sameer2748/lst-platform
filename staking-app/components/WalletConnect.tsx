import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useWallet } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const { publicKey, connected, connecting, connect, disconnect, signTransaction } = useWallet();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <TouchableOpacity style={[styles.button, styles.connectingButton]} disabled>
        <ActivityIndicator color="#ffffff" size="small" />
        <Text style={styles.buttonText}>Connecting...</Text>
      </TouchableOpacity>
    );
  }

  // Only show connected state if we have BOTH publicKey AND signTransaction
  if (connected && publicKey && signTransaction) {
    return (
      <View style={styles.connectedContainer}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>
            {truncateAddress(publicKey.toString())}
          </Text>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If wallet is not fully initialized, show connect button
  return (
    <TouchableOpacity style={styles.button} onPress={connect}>
      <Text style={styles.buttonText}>Connect Wallet</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  connectingButton: {
    backgroundColor: '#9333ea',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addressContainer: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  addressText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  disconnectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  disconnectText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WalletConnect;
