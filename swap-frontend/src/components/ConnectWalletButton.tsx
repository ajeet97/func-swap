// src/components/ConnectWalletButton.tsx
"use client";

import { useEthers } from "@/context/EthersContext";

export default function ConnectWalletButton() {
    const {
      account,
      connectWallet,
      isConnected,
      cosmosAccount,
      connectKeplr,
      isKeplrConnected,
    } = useEthers();
  
    const baseClasses = "px-4 py-2 text-white rounded transition-colors duration-300 w-full";
  
    const metamaskButtonClasses = isConnected
      ? `bg-green-600 hover:bg-red-700 ${baseClasses}`
      : `bg-yellow-500 hover:bg-green-600 ${baseClasses}`;
  
    const keplrButtonClasses = isKeplrConnected
      ? `bg-green-600 hover:bg-red-700 ${baseClasses}`
      : `bg-yellow-500 hover:bg-green-600 ${baseClasses}`;
  
    return (
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mx-auto">
        <button onClick={connectWallet} className={metamaskButtonClasses}>
          {isConnected
            ? `Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}`
            : "Connect Wallet"}
        </button>
  
        <button onClick={connectKeplr} className={keplrButtonClasses}>
          {isKeplrConnected
            ? `Connected: ${cosmosAccount?.slice(0, 6)}...${cosmosAccount?.slice(-4)}`
            : "Connect Keplr Wallet"}
        </button>
      </div>
    );
  }
  
