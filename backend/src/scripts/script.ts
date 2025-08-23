import { PublicKey } from '@solana/web3.js';

const programId = new PublicKey("YourProgramIdHere");
const seed = Buffer.from("vault");

(async()=>{
    const [vaultPDA, bump] =  await PublicKey.findProgramAddress([seed], programId);
    console.log("Vault PDA:", vaultPDA.toBase58());
})()