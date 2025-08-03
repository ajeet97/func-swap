// src/contexts/EthersContext.tsx
"use client";

// import "dotenv/config";
// import './envConfig.ts'
// import '../../envConfig';
import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { createOrder } from "./Order";
import { makerCosmosEscrow } from "./makerEscrowOsmToEth";
import { takerCosmosFill } from "./takerFillOsmToEth";
import { makerCosmosWithdraw } from "./makerWithdrawOsmToEth";
import { takerCosmosWithdraw } from "./takerWithdrawOsmToEth";

type EthersContextType = {
  account: string | null;
  cosmosAccount: string | null;
  connectWallet: () => Promise<void>;
  connectKeplr: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  disconnectKeplr: () => Promise<void>;
  createSwap: (fromAmount: string, toAmount: string, from: string, to: string, swapType: string) => Promise<void>;
  isConnected: boolean;
  isKeplrConnected: boolean;
};

const EthersContext = createContext<EthersContextType | undefined>(undefined);

export const EthersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);

  // const [account, setAccount] = useState(null)
  const [cosmosAccount, setCosmosAccount] = useState(null)
  const [amount, setAmount] = useState('0.0005')
  const [recipient, setRecipient] = useState('neutron1at23g9fv3eqcsxj68fstfn0qhhqw0k0s54e7ky')
  const [swapResult, setSwapResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [cosmosNetworkInfo, setCosmosNetworkInfo] = useState(null)
  const [swapDetails, setSwapDetails] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState([
    { id: 1, title: 'Lock ETH on Ethereum', status: 'pending', txHash: null },
    { id: 2, title: 'Lock NTRN on Neutron', status: 'pending', txHash: null },
    { id: 3, title: 'Claim NTRN (reveals secret)', status: 'pending', txHash: null },
    { id: 4, title: 'Claim ETH (completes swap)', status: 'pending', txHash: null }
  ])


  const disconnectWallet = async () => {
    setAccount(null);
    // setIsConnected(false);
  };

  const disconnectKeplr = async () => {
    setCosmosAccount(null);
    // setIsKeplrConnected(false);
  };

  const connectKeplr = async () => {
    if (!window.keplr) {
      alert('Please install Keplr wallet!')
      return
    }

    try {
      // Suggest the Osmosis testnet chain to Keplr
      await window.keplr.experimentalSuggestChain({
        chainId: 'osmo-test-5',
        chainName: 'Osmosis Testnet',
        rpc: 'https://rpc.osmotest5.osmosis.zone',
        rest: 'https://lcd.osmotest5.osmosis.zone',
        bip44: {
          coinType: 118,
        },
        bech32Config: {
          bech32PrefixAccAddr: 'osmo',
          bech32PrefixAccPub: 'osmopub',
          bech32PrefixValAddr: 'osmovaloper',
          bech32PrefixValPub: 'osmovaloperpub',
          bech32PrefixConsAddr: 'osmovalcons',
          bech32PrefixConsPub: 'osmovalconspub',
        },
        currencies: [
          {
            coinDenom: 'OSMO',
            coinMinimalDenom: 'uosmo',
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'OSMO',
            coinMinimalDenom: 'uosmo',
            coinDecimals: 6,
            gasPriceStep: {
              low: 0.01,
              average: 0.025,
              high: 0.04,
            },
          },
        ],
        stakeCurrency: {
          coinDenom: 'OSMO',
          coinMinimalDenom: 'uosmo',
          coinDecimals: 6,
        },
        features: ['stargate', 'ibc-transfer'],
      })

      // Enable Osmosis testnet
      await window.keplr.enable('osmo-test-5')

      // Get the offline signer for Osmosis testnet
      const offlineSigner = window.keplr.getOfflineSigner('osmo-test-5')
      const accounts = await offlineSigner.getAccounts()

      // Setup CosmWasm client for Osmosis
      const { SigningCosmWasmClient } = await import('@cosmjs/cosmwasm-stargate')
      const { GasPrice } = await import('@cosmjs/stargate')

      const gasPrice = GasPrice.fromString('0.025uosmo')
      const client = await SigningCosmWasmClient.connectWithSigner(
        'https://rpc.testnet.osmosis.zone',
        offlineSigner,
        { gasPrice }
      )

      const balance = await client.getBalance(accounts[0].address, 'uosmo')

      setCosmosAccount(accounts[0].address)
      setCosmosNetworkInfo({
        chainId: 'osmo-test-5',
        balance: (parseInt(balance.amount) / 1000000).toFixed(6),
        client: client
      })

      setSwapResult(`✅ Keplr connected to Osmosis testnet!`)
    } catch (error) {
      console.error('Keplr connection failed:', error)
      alert('Failed to connect Keplr: ' + error.message)
    }
  }




  const updateStep = (stepId: any, status: any, txHash = null) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, txHash } : step
    ))
  }

  const doCompleteSwap = async () => {
    if (!amount || !recipient) {
      alert('Please fill in all fields')
      return
    }

    if (networkInfo?.chainId !== '11155111') {
      alert('Please connect to Sepolia testnet first!')
      return
    }

    if (!cosmosAccount) {
      alert('Please connect Keplr wallet first!')
      return
    }

    setLoading(true)
    setCurrentStep(1)
    setSwapResult('🚀 Starting complete cross-chain atomic swap...')

    try {
      // STEP 1: Lock ETH on Ethereum and get swap details
      const swapData = await lockEthOnEthereum()

      // STEP 2: Lock NTRN on Neutron using swap data
      await lockNtrnOnNeutron(swapData)

      // STEP 3: Claim NTRN (reveals secret)
      await claimNtrnFromNeutron(swapData)

      // STEP 4: Claim ETH (completes swap)
      await claimEthFromEthereum(swapData)

      setSwapResult(`🎉 COMPLETE ATOMIC SWAP SUCCESS!
        
All 4 steps completed successfully!
✅ ETH locked on Ethereum
✅ NTRN locked on Neutron  
✅ NTRN claimed (secret revealed)
✅ ETH claimed (swap complete)

🌉 Perfect cross-chain atomic swap demonstration!`)

    } catch (error) {
      console.error('Complete swap failed:', error)
      setSwapResult(`❌ Swap failed at step ${currentStep}: ${error.message}`)
    }

    setLoading(false)
  }

  const createSwap = async (fromAmount: string, toAmount: string, from: string, to: string, swapType: string) => {
    console.log(fromAmount, toAmount, swapType, from, to);
    if (swapType == "ETH_TO_OSMO") {
      createOrder({
        from: {
          address: from,
          token: "0x0000000000000000000000000000000000000000",
          amount: ethers.parseUnits(fromAmount, 18).toString(),
          network: "ethereum",
          chainID: "11155111"
        }, to: {
          address: to,
          token: "uosmo",
          amount: ethers.parseUnits(toAmount, 6).toString(),
          network: "cosmos",
          chainID: "osmo-test-5"
        }
      })
    } else {
      createOrder({
        from: {
          address: from,
          token: "uosmo",
          amount: ethers.parseUnits(fromAmount, 6).toString(),
          network: "cosmos",
          chainID: "osmo-test-5"
        }, to: {
          address: to,
          token: "0x0000000000000000000000000000000000000000",
          amount: ethers.parseUnits(toAmount, 18).toString(),
          network: "ethereum",
          chainID: "11155111"
        }
      })


      const offlineSigner = window.keplr.getOfflineSigner('osmo-test-5')
      const accounts = await offlineSigner.getAccounts()

      // Get balance using CosmJS
      const { SigningCosmWasmClient } = await import('@cosmjs/cosmwasm-stargate')
      const { GasPrice } = await import('@cosmjs/stargate')

      const gasPrice = GasPrice.fromString('0.025uosmo')
      const client = await SigningCosmWasmClient.connectWithSigner(
        'https://rpc.testnet.osmosis.zone',
        offlineSigner,
        { gasPrice }
      )
      console.log(accounts[0])
      await makerCosmosEscrow(client, accounts[0].address)
      console.log("maker done ")

      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log("taker starting ")
      await takerCosmosFill()
      console.log("taker done ")

      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log("maker claiming...")
      await makerCosmosWithdraw();
      console.log('maker claimed')

      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('taker claiming...')
      await takerCosmosWithdraw();
      console.log('taker claimed')
    }

  }

  const connectWallet = async () => {
    console.log("rpc url", process.env.NEXT_PUBLIC_EVM_RPC);
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    } catch (error) {
      console.error("Wallet connection failed", error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
    }
  }, []);




  return (
    <EthersContext.Provider
      value={{
        account,
        cosmosAccount,
        connectWallet,
        connectKeplr,
        disconnectWallet,
        disconnectKeplr,
        createSwap,
        isConnected: !!account,
        isKeplrConnected: !!cosmosAccount,
      }}
    >
      {children}
    </EthersContext.Provider>
  );
};

export const useEthers = () => {
  const context = useContext(EthersContext);
  if (!context) throw new Error("useEthers must be used within EthersProvider");
  return context;
};
