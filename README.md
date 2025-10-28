# SamSOL Staking Platform

A decentralized staking platform built on Solana that allows users to stake SOL tokens and receive SamSOL tokens in return. The platform consists of a Solana program (smart contract), a Next.js web frontend, and a React Native mobile app.

## 🚀 Live Applications

- **Web App**: [https://lst.100xsam.store/](https://lst.100xsam.store/)
- **Mobile App**: Download `app-release.apk` from the repository

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Contract Details](#contract-details)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## 🔍 Overview

SamSOL Staking Platform enables users to:
- **Stake SOL**: Deposit SOL tokens and receive SamSOL tokens (1:1 ratio)
- **Unstake SamSOL**: Burn SamSOL tokens to withdraw original SOL
- **Cross-platform**: Access via web browser or mobile app
- **Testnet Ready**: Currently deployed on Solana Devnet

The platform uses a vault-based architecture where staked SOL is stored in user-specific Program Derived Addresses (PDAs) and SamSOL tokens are minted/burned accordingly.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │    │  Solana Program │
│   (Next.js)     │    │  (React Native) │    │  (Anchor/Rust)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Solana Devnet  │
                    │   (Testnet)     │
                    └─────────────────┘
```

## ✨ Features

### Core Functionality
- **Staking**: Convert SOL to SamSOL tokens
- **Unstaking**: Convert SamSOL back to SOL
- **Wallet Integration**: Support for Phantom, Solflare, Backpack wallets
- **Mobile Support**: Native mobile app with wallet adapter
- **Real-time Updates**: Live transaction status and balance updates

### Security Features
- **PDA-based Vaults**: Each user has a unique vault for SOL storage
- **Authority Controls**: Global mint authority for SamSOL token management
- **Input Validation**: Comprehensive amount and authorization checks
- **Error Handling**: Detailed error messages and transaction rollbacks

## 🛠️ Tech Stack

### Smart Contract
- **Framework**: Anchor (Solana)
- **Language**: Rust
- **Program ID**: `AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d`
- **Network**: Solana Devnet

### Web Frontend
- **Framework**: Next.js 15.5.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter
- **UI Components**: Lucide React icons, Sonner notifications

### Mobile App
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Wallet**: Solana Mobile Wallet Adapter
- **Platform**: Android (APK available)

## 📁 Project Structure

```
lst-platform-latest/
├── my-new-program/           # Solana smart contract
│   ├── programs/
│   │   └── my-new-program/
│   │       └── src/lib.rs    # Main contract logic
│   ├── tests/                # Contract tests
│   ├── migrations/           # Deployment scripts
│   └── Anchor.toml          # Anchor configuration
├── frontend/                 # Next.js web application
│   ├── components/          # React components
│   │   ├── StakeComponent.tsx
│   │   ├── UnStakeComponent.tsx
│   │   └── WalletConnectionProvider.tsx
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   └── utils/           # Contract utilities
│   └── package.json
├── staking-app/             # React Native mobile app
│   ├── components/          # Mobile components
│   ├── contexts/            # React contexts
│   ├── utils/               # Mobile utilities
│   └── package.json
└── scripts/                 # Utility scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Rust and Cargo
- Solana CLI tools
- Anchor framework
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lst-platform-latest
   ```

2. **Install dependencies for each component**

   **Smart Contract:**
   ```bash
   cd my-new-program
   yarn install
   ```

   **Web Frontend:**
   ```bash
   cd frontend
   npm install
   ```

   **Mobile App:**
   ```bash
   cd staking-app
   npm install
   ```

3. **Configure Solana CLI**
   ```bash
   solana config set --url devnet
   solana-keygen new --outfile ~/.config/solana/staking-wallet.json
   ```

### Running the Applications

**Web Frontend:**
```bash
cd frontend
npm run dev
# Access at http://localhost:3000
```

**Mobile App:**
```bash
cd staking-app
npm start
# Follow Expo CLI instructions
```

**Contract Testing:**
```bash
cd my-new-program
anchor test
```

## 📄 Contract Details

### Program ID
```
AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d
```

### Key Accounts

- **Global Mint Authority**: Controls SamSOL token minting/burning
- **User Stake Account**: Tracks individual user staking data
- **User Vault**: PDA storing user's staked SOL
- **SamSOL Mint**: The token mint for SamSOL

### Instructions

1. **initialize_global_authority**: Sets up the global mint authority
2. **create_user_stake_account**: Creates a user's staking account
3. **stake**: Stakes SOL and mints SamSOL (1:1 ratio)
4. **unstake**: Burns SamSOL and returns SOL

### Error Handling

The contract includes comprehensive error handling:
- `InvalidAmount`: Amount must be greater than 0
- `InsufficientStake`: Not enough staked amount to unstake
- `Unauthorized`: User doesn't own the stake account
- `Overflow/Underflow`: Arithmetic operation errors

## 🔧 Development

### Contract Development

1. **Build the contract:**
   ```bash
   cd my-new-program
   anchor build
   ```

2. **Deploy to devnet:**
   ```bash
   anchor deploy
   ```

3. **Run tests:**
   ```bash
   anchor test
   ```

### Frontend Development

1. **Environment Setup:**
   - Ensure contract is deployed
   - Update contract address in frontend utils
   - Configure RPC endpoint

2. **Development Server:**
   ```bash
   cd frontend
   npm run dev
   ```

### Mobile Development

1. **Expo Development:**
   ```bash
   cd staking-app
   npm start
   ```

2. **Android Build:**
   ```bash
   expo build:android
   ```

## 🚀 Deployment

### Contract Deployment

The contract is currently deployed on Solana Devnet. To redeploy:

```bash
cd my-new-program
anchor deploy --provider.cluster devnet
```

### Web Frontend Deployment

The web frontend is deployed at [https://lst.100xsam.store/](https://lst.100xsam.store/).

### Mobile App Distribution

The Android APK (`app-release.apk`) is available for direct installation.

## 🧪 Testing

### Contract Tests

```bash
cd my-new-program
anchor test
```

### Frontend Testing

```bash
cd frontend
npm run lint
```

### Integration Testing

1. Connect wallet to web app
2. Test staking functionality
3. Verify SamSOL token minting
4. Test unstaking process
5. Confirm SOL withdrawal

## 📱 Demo Videos

*Note: Add your demo video files here. You can:*
- Upload videos to YouTube/Vimeo and link them
- Store videos in a `demos/` folder and reference them
- Use GitHub's video embedding feature

**Web Demo**: [Link to web demo video]
**Mobile Demo**: [Link to mobile demo video]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Live Web App**: [https://lst.100xsam.store/](https://lst.100xsam.store/)
- **Contract on Solana Explorer**: [View Contract](https://explorer.solana.com/address/AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d?cluster=devnet)
- **Repository**: [GitHub Repository]

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: [Your contact information]

---

**Built with ❤️ on Solana**
