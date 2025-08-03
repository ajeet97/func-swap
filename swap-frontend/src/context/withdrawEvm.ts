import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import { ESCROW_ABI } from "../contracts/EscrowDst"; // put your ABI here or inline
import { FACTORY_ABI } from "../contracts/EscrowFactoryABI"; // if needed
import { BrowserProvider } from "ethers";

const ESCROW_FACTORY_ADDRESS = "0xYourFactoryAddressHere"; // update this
const ESCROW_CONTRACT_ADDRESS = "0xYourEscrowImplementationAddress"; // will be computed

// Create packed timelocks structure
const createEvmTimelock = (
  now: bigint,
  takerLock: bigint,
  makerLock: bigint,
  takerTimeout: bigint,
  makerTimeout: bigint
): bigint => {
  return (
    (now << 0n) |
    (takerLock << 64n) |
    (makerLock << 128n) |
    (takerTimeout << 192n) |
    (makerTimeout << 224n)
  );
};

// Fetch the escrow address deterministically from the factory
const getEscrowAddress = async (
  signer: ethers.Signer,
  factoryAddress: string,
  immutables: any
): Promise<string> => {
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
  const address = await factory.addressOfEscrowDst(immutables);
  return address;
};

// Main withdraw function
export const withdrawFromEscrow = async (
  orderID: string,
  order: any,
  taker: string,
  secret: string,
  immutables: string
) => {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const orderHash = keccak256(toUtf8Bytes(`order:${orderID}`));

  const now = BigInt(Math.floor(Date.now() / 1000));
  const timelocks = createEvmTimelock(now, 30n, 120n, 30n, 120n);

//   const immutables = {
//     orderHash,
//     hashlock: order.hashlock,
//     maker: BigInt(order.swap.from.address),
//     taker: BigInt(taker),
//     token: BigInt("0x0000000000000000000000000000000000000000"),
//     amount: BigInt(order.swap.to.amount),
//     safetyDeposit: ethers.parseUnits("0.001", 6),
//     timelocks
//   };

  const escrowAddress = await getEscrowAddress(signer, ESCROW_FACTORY_ADDRESS, immutables);
  console.log("Using Escrow at:", escrowAddress);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);

  const tx = await escrow.withdraw(secret, immutables);
  await tx.wait();

  console.log("✅ Withdraw successful with tx:", tx.hash);
};





