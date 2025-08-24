"use client";
import Image from "next/image";
import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import StakeComponent from "../../components/StakeComponent";
import UnStakeComponent from "../../components/UnStakeComponent";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const tokens = [
  {
    symbol: 'SOL',
    name: 'Solana',
    balance: '0.0193',
    usdValue: '$3.94',
    icon: '🟣'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '100.50',
    usdValue: '$100.50',
    icon: '🔵'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    balance: '1000000',
    usdValue: '$25.30',
    icon: '🟠'
  }
];
export default function Home() {

  const [activeTab, setActiveTab] = useState('stake');

  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
    setShowDropdown(false);
  };

  const handleUseMax = () => {
    setInputAmount(selectedToken.balance);
  };


  return (
    <div className="min-h-screen bg-[#f1f0fa] py-8">
      <div className="container  px-22">
      
        {/* Tab Navigation */}
        <div className="flex justify-between  ">
          <div className=" rounded-xl pb-1 ">
            <button
              onClick={() => setActiveTab('stake')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'stake'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveTab('unstake')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'unstake'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Unstake
            </button>
          </div>
          <WalletMultiButton />
        </div>

        <div className="w-full h-[2px] bg-purple-400 rounded-xl"></div>

        {/* Content */}
        <div className="">
          {activeTab === 'stake' ? <StakeComponent/> : <UnStakeComponent/>}
        </div>
      </div>
    </div>
  );
};


