"use client"; // required in Next.js App Router

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

type EthersContextType = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  connectWallet: () => Promise<void>;
};

const EthersContext = createContext<EthersContextType | undefined>(undefined);

export const EthersProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
    } else {
      alert("Please install MetaMask.");
    }
  };

  return (
    <EthersContext.Provider value={{ provider, signer, account, connectWallet }}>
      {children}
    </EthersContext.Provider>
  );
};

export const useEthersContext = () => {
  const context = useContext(EthersContext);
  if (!context) throw new Error("useEthersContext must be used within EthersProvider");
  return context;
};
