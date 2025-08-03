"use client";

import { useState, useMemo } from "react";
import { useEthers } from "@/context/EthersContext";

// Static rate: 1 ETH = 21340 OSMO and 1 OSMO = 1/21340 ETH
const EXCHANGE_RATE = {
  "Ethereum->Osmosis": 21340,
  "Osmosis->Ethereum": 1 / 21340,
};

const SwapInterface = () => {
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState<"Ethereum" | "Osmosis">("Ethereum");
  const [to, setTo] = useState<"Ethereum" | "Osmosis">("Osmosis");

  const {
    connectWallet,
    disconnectWallet,
    account,
    isConnected,
    connectKeplr,
    disconnectKeplr,
    cosmosAccount,
    isKeplrConnected,
    createSwap,
  } = useEthers();

  const switchNetworks = () => {
    setFrom(to);
    setTo(from);
  };

  const handleConnect = () => {
    if (from === "Ethereum") {
      connectWallet();
    } else {
      connectKeplr();
    }
  };

  const handleDisconnect = () => {
    if (from === "Ethereum") {
      disconnectWallet?.();
    } else {
      disconnectKeplr?.();
    }
  };

  const handleSwap = () => {
    const swapType = to === "Ethereum" ? "OSMO_TO_ETH" : "ETH_TO_OSMO";
    const fromAmount = amount;
    const toAmount = outputAmount;
    const fromWallet = from === "Ethereum" ? account : cosmosAccount;
    const toWallet = to === "Ethereum" ? account : cosmosAccount;

    if (!fromWallet || !toWallet) {
      alert("Please connect both wallets before swapping.");
      return;
    }

    createSwap(fromAmount, toAmount, fromWallet, toWallet, swapType);
  };

  const isFromWalletConnected =
    from === "Ethereum" ? isConnected : isKeplrConnected;
  const isToWalletConnected = to === "Ethereum" ? isConnected : isKeplrConnected;

  const fromWalletAddress = from === "Ethereum" ? account : cosmosAccount;
  const toWalletAddress = to === "Ethereum" ? account : cosmosAccount;

  const outputAmount = useMemo(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt)) return "0";
    const rateKey = `${from}->${to}` as keyof typeof EXCHANGE_RATE;
    const rate = EXCHANGE_RATE[rateKey];
    return (amt * rate).toFixed(6);
  }, [amount, from, to]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-xl mx-auto mt-10 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-center">Swap Assets</h2>

      <div className="flex justify-between mb-4">
        <div className="w-full">
          <label className="block mb-1 text-gray-600">From</label>
          <div className="bg-gray-100 px-4 py-2 rounded text-center">{from}</div>
        </div>

        <div className="flex items-end mx-4">
          <button
            onClick={switchNetworks}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            ⇄
          </button>
        </div>

        <div className="w-full">
          <label className="block mb-1 text-gray-600">To</label>
          <div className="bg-gray-100 px-4 py-2 rounded text-center">{to}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-gray-600">Amount</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {amount && (
        <div className="mb-4 text-center text-gray-700 font-medium">
          You will receive:{" "}
          <span className="font-semibold">
            {outputAmount} {to}
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mt-6">
        {!isFromWalletConnected ? (
          <button
            className="w-full bg-yellow-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleConnect}
          >
            Connect {from} Wallet
          </button>
        ) : (
          <button
            className="w-full bg-green-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            onClick={handleDisconnect}
          >
            Connected (From): {fromWalletAddress?.slice(0, 6)}...
            {fromWalletAddress?.slice(-4)} (Disconnect)
          </button>
        )}

        {isToWalletConnected && (
          <button
            className="w-full bg-green-600 text-white px-4 py-2 rounded"
            disabled
          >
            Connected (To): {toWalletAddress?.slice(0, 6)}...
            {toWalletAddress?.slice(-4)}
          </button>
        )}
      </div>

      {/* Connect To wallet if not connected */}
      {!isToWalletConnected && (
        <button
          className="w-full bg-yellow-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-4"
          onClick={to === "Ethereum" ? connectWallet : connectKeplr}
        >
          Connect {to} Wallet (To)
        </button>
      )}

      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-6"
        disabled={!amount || !isFromWalletConnected || !isToWalletConnected}
        onClick={handleSwap}
      >
        Swap
      </button>
    </div>
  );
};

export default SwapInterface;
