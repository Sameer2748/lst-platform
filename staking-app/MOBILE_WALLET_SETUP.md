# Mobile Wallet Connection Setup

## 📱 **How to Connect to Your Phantom Mobile Wallet**

### 🚀 **Step 1: Install Phantom Mobile App**
1. **Download Phantom** from App Store (iOS) or Google Play (Android)
2. **Create or import** your wallet
3. **Make sure you're on Devnet** (for testing) or Mainnet (for real transactions)

### 🔧 **Step 2: Build and Install the App**

#### **For iOS:**
```bash
# Build for iOS
npx expo build:ios

# Or run in iOS Simulator
npx expo start --ios
```

#### **For Android:**
```bash
# Build for Android
npx expo build:android

# Or run in Android Emulator
npx expo start --android
```

### 📱 **Step 3: Connect Your Wallet**

1. **Open the SamSOL Staking app** on your device
2. **Tap "Connect Wallet"** button
3. **Phantom will open** automatically
4. **Approve the connection** in Phantom
5. **Your real wallet** will be connected!

## 🔧 **Technical Implementation**

### **Mobile Wallet Adapter (MWA)**
The app now uses Solana's Mobile Wallet Adapter protocol:

```typescript
// Connects to any compatible mobile wallet
const result = await mobileWalletAdapter.connect();
// Returns your real wallet address and public key
```

### **Supported Wallets:**
- ✅ **Phantom Mobile** (primary)
- ✅ **Solflare Mobile** (secondary)
- ✅ **Any MWA-compatible wallet**

### **Deep Linking Setup:**
- **App Scheme**: `samsolstaking://`
- **Handles wallet callbacks** automatically
- **Seamless user experience**

## 🎯 **Connection Flow**

### **1. App Requests Connection**
```
SamSOL App → "Connect Wallet" → Mobile Wallet Adapter
```

### **2. Wallet Opens**
```
Mobile Wallet Adapter → Phantom Mobile App
```

### **3. User Approves**
```
Phantom Mobile → User approves → Returns to SamSOL App
```

### **4. Real Wallet Connected**
```
SamSOL App ← Real wallet address & public key
```

## ⚠️ **Important Notes**

### **For Testing:**
- **Use Devnet** - no real SOL required
- **Test with small amounts** first
- **Check transaction history** in Phantom

### **For Production:**
- **Switch to Mainnet** in app configuration
- **Use real SOL** (be careful!)
- **Test thoroughly** before large transactions

## 🔄 **Fallback System**

The app has a **3-tier fallback system**:

1. **Primary**: Mobile Wallet Adapter (real wallet)
2. **Secondary**: Web Phantom Extension (if in browser)
3. **Fallback**: Demo wallet (if mobile connection fails)

## 🛠️ **Configuration**

### **Network Settings:**
```typescript
// In mobileWalletAdapter.ts
const authorizationResult = await wallet.authorize({
  cluster: 'devnet', // Change to 'mainnet-beta' for production
  identity: {
    name: 'SamSOL Staking App',
    uri: 'https://samsolstaking.app',
    icon: 'https://samsolstaking.app/icon.png',
  },
});
```

### **Deep Link Configuration:**
```json
// In app.json
{
  "scheme": "samsolstaking",
  "ios": {
    "infoPlist": {
      "CFBundleURLTypes": [
        {
          "CFBundleURLSchemes": ["samsolstaking"]
        }
      ]
    }
  }
}
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Wallet not found"**
   - Make sure Phantom is installed
   - Check if MWA is supported

2. **"Connection failed"**
   - Try disconnecting and reconnecting
   - Check network connection

3. **"Transaction failed"**
   - Ensure sufficient SOL for fees
   - Check if wallet is unlocked

### **Debug Steps:**
1. **Check console logs** for error messages
2. **Verify Phantom is installed** and updated
3. **Test with small amounts** first
4. **Check network settings** (devnet vs mainnet)

## 🎉 **Success!**

Once connected, you'll see:
- ✅ **Your real wallet address** (not demo)
- ✅ **Your actual SOL balance** (not fake)
- ✅ **Real transaction signing** through Phantom
- ✅ **Full staking/unstaking functionality**

The app will now connect to your **real Phantom mobile wallet** and use your **actual SOL balance**! 🚀
