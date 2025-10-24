# EAS Build Guide - Cloud APK Generation

## 🚀 **Why EAS Build?**
- ✅ **No disk space issues** - builds in the cloud
- ✅ **Faster builds** - powerful cloud servers
- ✅ **Easy APK download** - direct download link
- ✅ **No local setup** required

## 📱 **Step 1: Setup EAS Build**

### **Install EAS CLI:**
```bash
npm install -g eas-cli
```

### **Login to EAS:**
```bash
eas login
# Follow the prompts to create an Expo account
```

### **Configure EAS:**
```bash
eas build:configure
# This will create eas.json (already created)
```

## 🔧 **Step 2: Build APK in Cloud**

### **Build for Android:**
```bash
# Build development APK
eas build --platform android --profile development

# Build production APK
eas build --platform android --profile production
```

### **What Happens:**
1. **Code uploaded** to EAS servers
2. **Build runs** in the cloud (5-15 minutes)
3. **APK generated** with Mobile Wallet Adapter
4. **Download link** provided

## 📱 **Step 3: Download APK**

### **After Build Completes:**
- **EAS dashboard** shows download link
- **Direct APK download** to your device
- **Install APK** on Android device

## 🎯 **Step 4: Install and Test**

### **Install APK:**
```bash
# Download APK from EAS dashboard
# Transfer to Android device
# Install APK (enable "Install from unknown sources")
```

### **Install Phantom Mobile:**
- Download from Google Play Store
- Create/import your wallet
- Make sure you're on Devnet

### **Connect Wallet:**
1. **Open SamSOL Staking app**
2. **Tap "Connect Wallet"**
3. **Phantom opens** automatically
4. **Approve connection**
5. **Real wallet connected!**

## 🎉 **Benefits of EAS Build**

### **No Local Issues:**
- ✅ **No disk space** problems
- ✅ **No Gradle setup** required
- ✅ **No Android SDK** needed
- ✅ **Works on any machine**

### **Professional Build:**
- ✅ **Optimized APK** for production
- ✅ **Signed APK** ready for distribution
- ✅ **Mobile Wallet Adapter** included
- ✅ **Real wallet support**

## 💰 **EAS Build Pricing**

### **Free Tier:**
- ✅ **30 builds/month** free
- ✅ **Perfect for development**
- ✅ **No credit card** required

### **Paid Plans:**
- **$29/month** for unlimited builds
- **Only needed** for high-volume production

## 🚀 **Quick Start Commands**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to EAS
eas login

# 3. Build APK
eas build --platform android --profile development

# 4. Download APK from dashboard
# 5. Install on Android device
# 6. Connect to Phantom mobile wallet
```

## 🎯 **Expected Result**

### **APK Features:**
- ✅ **Real Mobile Wallet Adapter** - connects to Phantom mobile
- ✅ **Real wallet connection** - your actual wallet address
- ✅ **Real SOL balance** - not simulated data
- ✅ **Full staking/unstaking** - with real SOL transactions

### **No More:**
- ❌ **Disk space issues**
- ❌ **Gradle build failures**
- ❌ **Local Android SDK** setup
- ❌ **Simulated wallet** data

The EAS Build approach is **much more reliable** and **easier** than local builds! 🚀
