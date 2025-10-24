// Import polyfills at the very top - MUST be first
import './utils/polyfills';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { WalletProvider } from './contexts/WalletContext';
import WalletConnect from './components/WalletConnect';
import StakeComponent from './components/StakeComponent';
import UnStakeComponent from './components/UnStakeComponent';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f1f0fa" />
        <View style={styles.splashContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SamSOL</Text>
            <Text style={styles.logoSubtext}>Staking Platform</Text>
          </View>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <WalletProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f1f0fa" />
        
        {/* Header with Tab Navigation and Wallet */}
        <View style={styles.header}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('stake')}
              style={[
                styles.tabButton,
                activeTab === 'stake' && styles.activeTabButton
              ]}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'stake' && styles.activeTabText
              ]}>
                Stake
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('unstake')}
              style={[
                styles.tabButton,
                activeTab === 'unstake' && styles.activeTabButton
              ]}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'unstake' && styles.activeTabText
              ]}>
                Unstake
              </Text>
            </TouchableOpacity>
          </View>
          
          <WalletConnect />
        </View>

        {/* Tab Indicator */}
        <View style={styles.tabIndicator} />

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'stake' ? <StakeComponent /> : <UnStakeComponent />}
        </View>
      </SafeAreaView>
    </WalletProvider>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#f1f0fa',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#a855f7',
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f0fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f1f0fa',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabIndicator: {
    height: 2,
    backgroundColor: '#c4b5fd',
    borderRadius: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
});

export default App;
