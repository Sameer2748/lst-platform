import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle, AlertCircle, Clock, XCircle } from './Icons';

// Transaction status types
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

interface StatusPopupProps {
  visible: boolean;
  status: TransactionStatus;
  txnId: string;
  amount: string;
  onClose: () => void;
}

const StatusPopup: React.FC<StatusPopupProps> = ({ 
  visible, 
  status, 
  txnId, 
  amount, 
  onClose 
}) => {
  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle size={64} color="#10b981" />,
          title: 'Transaction Completed!',
          description: `Successfully staked ${amount} SOL`,
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
        };
      case 'failed':
        return {
          icon: <XCircle size={64} color="#ef4444" />,
          title: 'Transaction Failed',
          description: 'Your transaction could not be processed',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={64} color="#f59e0b" />,
          title: 'Transaction Cancelled',
          description: 'Your transaction was cancelled',
          bgColor: '#fffbeb',
          borderColor: '#fed7aa',
        };
      case 'processing':
        return {
          icon: <ActivityIndicator size="large" color="#3b82f6" />,
          title: 'Processing Transaction',
          description: 'Your transaction is being processed...',
          bgColor: '#eff6ff',
          borderColor: '#bfdbfe',
        };
      default: // pending
        return {
          icon: <Clock size={64} color="#6b7280" />,
          title: 'Transaction Pending',
          description: 'Waiting for blockchain confirmation...',
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            <View style={styles.content}>
            <View style={styles.iconContainer}>
              {config.icon}
            </View>
            
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>
            
            {txnId && (
              <View style={styles.txnContainer}>
                <Text style={styles.txnLabel}>Transaction ID:</Text>
                <Text style={styles.txnId}>{txnId}</Text>
              </View>
            )}
            
            {(status === 'completed' || status === 'failed' || status === 'cancelled') && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  container: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  txnContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  txnLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  txnId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StatusPopup;
