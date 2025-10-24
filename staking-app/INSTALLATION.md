# Installation Guide - SamSOL Staking React Native App

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd staking-app
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup
```bash
cd staking-app
npm install
npx expo start
```

## Prerequisites

### Required Software
1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Mobile Development Environment**
   
   **For iOS Development:**
   - macOS with Xcode
   - iOS Simulator (installed with Xcode)
   
   **For Android Development:**
   - Android Studio
   - Android SDK and emulator

### Mobile Wallets
Install one or both of these wallets on your device:
- **Phantom** (iOS/Android)
- **Solflare** (iOS/Android)

## Installation Steps

### 1. Clone and Navigate
```bash
cd /Users/manmohan/Desktop/web3-cohort/staking-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
echo "EXPO_PUBLIC_SOLANA_RPC=https://devnet.helius-rpc.com/?api-key=d634c70f-6302-40db-9292-72c25d3dda26" > .env
```

### 4. Start Development Server
```bash
npx expo start
```

## Running the App

### Development Server
The development server will start and show:
- QR code for physical device testing
- Options to open in iOS/Android simulators
- Metro bundler logs

### iOS Simulator
```bash
npx expo start --ios
```
- Requires macOS and Xcode
- Opens iOS Simulator automatically
- App loads with hot reload enabled

### Android Emulator
```bash
npx expo start --android
```
- Requires Android Studio setup
- Opens Android Emulator automatically
- App loads with hot reload enabled

### Physical Device
1. Install **Expo Go** app on your device
2. Scan the QR code from the terminal
3. App loads on your device
4. Enable developer mode for debugging

## Testing the App

### 1. Wallet Connection
- Tap "Connect Wallet" button
- Select your preferred wallet (Phantom/Solflare)
- Authorize the connection
- Verify wallet address is displayed

### 2. Staking Test
1. **Switch to Stake tab**
2. **Enter amount** (e.g., 0.1 SOL)
3. **Tap "Convert to SamSOL"**
4. **Sign transaction** in wallet
5. **Wait for confirmation**
6. **Verify SamSOL balance updates**

### 3. Unstaking Test
1. **Switch to Unstake tab**
2. **Enter SamSOL amount**
3. **Tap "Unstake SOL"**
4. **Sign transaction** in wallet
5. **Wait for confirmation**
6. **Verify SOL balance updates**

### 4. Error Handling Test
- Try staking more SOL than available
- Try unstaking more SamSOL than available
- Test with no wallet connected
- Test network connectivity issues

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
npx expo start -c
```
Clears cache and restarts bundler.

#### 2. Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 3. Expo CLI Issues
```bash
npm uninstall -g @expo/cli
npm install -g @expo/cli@latest
```

#### 4. Wallet Connection Issues
- Ensure wallet app is installed and updated
- Check if wallet supports the current network (Devnet)
- Try disconnecting and reconnecting
- Clear app data and restart

#### 5. Transaction Failures
- Check network connectivity
- Verify RPC endpoint is working
- Ensure sufficient SOL for transaction fees
- Check if wallet has enough balance

#### 6. Build Issues
```bash
npx expo doctor
```
Runs diagnostics and suggests fixes.

### Debug Mode
Enable debug mode by setting `__DEV__ = true` in your environment or using:
```bash
npx expo start --dev-client
```

## Development Tips

### Hot Reload
- Changes to code automatically reload the app
- State is preserved during hot reload
- Use `r` in terminal to manually reload

### Debugging
- Use React Native Debugger
- Enable remote debugging in Expo Go
- Check Metro bundler logs for errors
- Use console.log for debugging

### Performance
- Use React DevTools for component inspection
- Monitor memory usage in device settings
- Test on both iOS and Android
- Test on different device sizes

## Production Build

### Building for iOS
```bash
npx expo build:ios
```
- Requires Apple Developer account
- Generates .ipa file for App Store
- Test on physical device before submission

### Building for Android
```bash
npx expo build:android
```
- Generates .apk or .aab file
- Test on physical device before submission
- Upload to Google Play Console

### App Store Submission
1. Build production app
2. Test thoroughly on physical devices
3. Prepare app store assets (screenshots, descriptions)
4. Submit to App Store Connect (iOS) or Google Play Console (Android)

## Support

### Getting Help
1. Check this installation guide
2. Review the main README.md
3. Check Expo documentation
4. Review Solana web3.js documentation
5. Open an issue on GitHub

### Useful Commands
```bash
# Start development server
npx expo start

# Clear cache and start
npx expo start -c

# Run on specific platform
npx expo start --ios
npx expo start --android

# Build for production
npx expo build:ios
npx expo build:android

# Check for issues
npx expo doctor

# Install specific package
npm install package-name

# Update dependencies
npm update
```

## Next Steps

After successful installation:
1. Test all functionality thoroughly
2. Customize the UI if needed
3. Add additional features
4. Test on multiple devices
5. Prepare for production deployment

Happy coding! 🚀
