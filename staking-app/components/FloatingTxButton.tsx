import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, Animated } from 'react-native';

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

interface FloatingTxButtonProps {
  visible: boolean;
  status: TransactionStatus;
  onPress: () => void;
}

const FloatingTxButton: React.FC<FloatingTxButtonProps> = ({ visible, status, onPress }) => {
  if (!visible) return null;

  const renderIcon = () => {
    switch (status) {
      case 'processing':
      case 'pending':
        return <ActivityIndicator size="small" color="#fff" />;
      case 'completed':
        return (
          <View style={styles.iconContainer}>
            <View style={styles.checkmark}>
              <View style={styles.checkmarkStem} />
              <View style={styles.checkmarkKick} />
            </View>
          </View>
        );
      case 'failed':
        return (
          <View style={styles.iconContainer}>
            <View style={styles.cross}>
              <View style={styles.crossLine1} />
              <View style={styles.crossLine2} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'completed':
        return '#10b981'; // Green
      case 'failed':
        return '#ef4444'; // Red
      case 'processing':
      case 'pending':
        return '#a855f7'; // Purple
      default:
        return '#a855f7';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.floatingButton, { backgroundColor: getBackgroundColor() }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {renderIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  checkmarkStem: {
    position: 'absolute',
    width: 3,
    height: 12,
    backgroundColor: '#fff',
    left: 11,
    top: 4,
    transform: [{ rotate: '45deg' }],
  },
  checkmarkKick: {
    position: 'absolute',
    width: 3,
    height: 6,
    backgroundColor: '#fff',
    left: 6,
    top: 10,
    transform: [{ rotate: '-45deg' }],
  },
  cross: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  crossLine1: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: '#fff',
    left: 8.5,
    top: 0,
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: '#fff',
    left: 8.5,
    top: 0,
    transform: [{ rotate: '-45deg' }],
  },
});

export default FloatingTxButton;

