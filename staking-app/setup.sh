#!/bin/bash

echo "🚀 Setting up SamSOL Staking React Native App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Solana RPC Endpoint
EXPO_PUBLIC_SOLANA_RPC=https://devnet.helius-rpc.com/?api-key=d634c70f-6302-40db-9292-72c25d3dda26
EOL
fi

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npx expo start"
echo ""
echo "To run on iOS simulator:"
echo "  npx expo start --ios"
echo ""
echo "To run on Android emulator:"
echo "  npx expo start --android"
echo ""
echo "Happy coding! 🎉"
