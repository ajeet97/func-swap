import { ethers } from "ethers";

export const ESCROW_ABI = [ /* Your full ABI pasted here */ ];

export const ESCROW_CONTRACT_ADDRESS = "0xYourEscrowContractAddress"; // replace with actual address

export function getEscrowContract(signerOrProvider: ethers.Signer | ethers.Provider, escrowContractAddress: string) {
  return new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signerOrProvider);
}
