"use client";
import { useState } from 'react';
import StakeComponent from "../../components/StakeComponent";
import UnStakeComponent from "../../components/UnStakeComponent";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const [activeTab, setActiveTab] = useState('stake');


;

  return (
    <div className="min-h-screen   bg-[#f1f0fa] py-4 sm:py-6 md:py-8">
      <div className="container w-full px-2 sm:px-4 md:px-6 lg:px-22 ">
        
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="rounded-xl pb-1 w-full sm:w-auto">
            <div className="flex w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('stake')}
                className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'stake'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Stake
              </button>
              <button
                onClick={() => setActiveTab('unstake')}
                className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'unstake'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Unstake
              </button>
            </div>
          </div>
          
          {/* Wallet button - responsive sizing */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <div className="scale-90 sm:scale-100">
              <WalletMultiButton />
            </div>
          </div>
        </div>

        <div className="w-full h-[2px] bg-purple-400 rounded-xl mt-4"></div>

        {/* Content */}
        <div className="w-full">
          {activeTab === 'stake' ? <StakeComponent/> : <UnStakeComponent/>}
        </div>
      </div>
    </div>
  );
};