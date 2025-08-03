import "dotenv/config"
import { ethers } from "ethers";

import EscrowFactoryABI from "./abis/EscrowFactory.json";
import { loadOrder } from "./order";
import { createEvmTimelock } from "./timelock";


const pk = process.env.PRIVATE_KEY;
const factoryAddr = process.env.ESCROW_FACTORY;
const taker = process.env.RESOLVER_EVM_ADDR;

const orderID = 1;

async function makerEscrow() {
    const order = loadOrder(orderID);
    if (order.swap.from.network != 'ethereum') throw new Error('Invalid network for maker escrow')

    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC);
    const signer = new ethers.Wallet(pk, provider);
    const factory = new ethers.Contract(factoryAddr, EscrowFactoryABI, signer);

    const immutables = {
        order_hash: "order-1",
        hashlock: order.hashlock,
        maker: order.swap.from.address,
        taker,
        coin: {
            native: [{
                denom: order.swap.from.token,
                amount: order.swap.from.amount,
            }],
        },
        safety_deposit: ethers.parseUnits('0.001', 6).toString(),
        timelocks: createEvmTimelock(
            BigInt(Math.floor(Date.now() / 1000)),
            30n,
            120n,
            30n,
            120n,
        ),
    }

    factory.createSrcEscrow(immutables, { value: ethers.parseEther('') });
}

async function main() {



}

main().catch(console.error);