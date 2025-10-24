# SamSOL Staking - React Native App

A React Native Expo application for staking SOL to get SamSOL tokens, converted from the original web application.

## Features

- **Stake SOL**: Convert SOL to SamSOL tokens with 6.92% APY
- **Unstake SamSOL**: Convert SamSOL back to SOL instantly
- **Mobile Wallet Integration**: Connect with Phantom and Solflare mobile wallets
- **Real-time Balance Updates**: Live balance tracking and updates
- **Transaction Status**: Real-time transaction status with detailed feedback
- **Responsive Design**: Optimized for both iOS and Android

## Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

## Installation

1. Navigate to the project directory:
```bash
cd staking-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

## Running the App

### iOS Simulator
```bash
npx expo start --ios
```

### Android Emulator
```bash
npx expo start --android
```

### Physical Device
1. Install Expo Go app on your device
2. Scan the QR code from the terminal
3. The app will load on your device

## Project Structure

```
staking-app/
├── App.tsx                          # Main app component
├── components/
│   ├── StakeComponent.tsx          # SOL staking interface
│   ├── UnStakeComponent.tsx        # SamSOL unstaking interface
│   ├── WalletConnect.tsx           # Wallet connection component
│   └── StatusPopup.tsx             # Transaction status modal
├── contexts/
│   └── WalletContext.tsx           # Wallet state management
├── utils/
│   ├── polyfills.ts                # React Native polyfills
│   └── contractUtils.ts            # Solana contract utilities
├── package.json
├── app.json
└── tsconfig.json
```

## Key Features

### Wallet Integration
- Mobile Wallet Adapter for React Native
- Support for Phantom and Solflare wallets
- Secure transaction signing
- Wallet state persistence

### Staking Process
1. Connect wallet
2. Enter SOL amount to stake
3. Create stake account (first time only)
4. Sign and submit transaction
5. Receive SamSOL tokens

### Unstaking Process
1. Enter SamSOL amount to unstake
2. Sign and submit transaction
3. SamSOL tokens are burned
4. Receive equivalent SOL instantly

### Error Handling
- Comprehensive error handling for all transaction types
- User-friendly error messages
- Automatic retry mechanisms
- Transaction status verification

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_SOLANA_RPC=https://devnet.helius-rpc.com/?api-key=your-api-key
```

### Contract Configuration
The app uses the following Solana program configuration:
- Program ID: `AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d`
- SamSOL Mint: `4c1zJyLyTGep3fuP4ZdPPc7PJqupDvyGD3hzSUfQBoDX`
- Global Mint Authority: `5Hg56BGr1u9xvwGPaLDWqrQ9BZ8Yk5eoPcmCyDXysWK4`

## Development

### Code Structure
- **TypeScript**: Full type safety throughout the application
- **React Hooks**: Modern React patterns for state management
- **Context API**: Global state management for wallet connection
- **StyleSheet**: Optimized styling for React Native

### Key Components

#### StakeComponent
- Handles SOL to SamSOL conversion
- Manages stake account creation
- Real-time balance updates
- Transaction status tracking

#### UnStakeComponent
- Handles SamSOL to SOL conversion
- Direct unstaking from personal stake account
- 1:1 exchange rate with no fees
- Instant SOL return

#### WalletContext
- Manages wallet connection state
- Handles transaction signing
- Provides wallet utilities
- Persistent connection state

## Testing

### Manual Testing
1. Test wallet connection with different wallets
2. Test staking with various amounts
3. Test unstaking functionality
4. Test error scenarios (insufficient balance, network issues)
5. Test on both iOS and Android

### Test Scenarios
- First-time staking (account creation)
- Subsequent staking
- Partial unstaking
- Full unstaking
- Error handling
- Network connectivity issues

## Deployment

### Building for Production
```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

### App Store Submission
1. Build the production app
2. Test thoroughly on physical devices
3. Submit to App Store Connect (iOS) or Google Play Console (Android)

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start -c`
2. **Wallet connection issues**: Ensure wallet app is installed and updated
3. **Transaction failures**: Check network connectivity and RPC endpoint
4. **Build issues**: Ensure all dependencies are properly installed

### Debug Mode
Enable debug mode by setting `__DEV__ = true` in your environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the code comments
- Open an issue on GitHub

## Changelog

### Version 1.0.0
- Initial release
- SOL staking functionality
- SamSOL unstaking functionality
- Mobile wallet integration
- Responsive design
- Transaction status tracking
