import { mintTokens } from "../mintTokens";

async function main() {
  const userAddress = "5fxqKBcGKhx4zs4zdqocYuJxYNk4sCYJ4yXKNyyDebZP"; // Replace with Phantom wallet address
  const amount = 5; // Mint 5 tokens
  await mintTokens("platformWallet", userAddress, amount);
}

main().catch(console.error);
