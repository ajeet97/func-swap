import crypto from 'crypto';
import { ethers } from "ethers";
import { loadOrder } from "./Order";

import EscrowFactoryABI from "../abis/EscrowFactory.json";
import { createEvmTimelock } from './timelocks';

const taker = process.env.NEXT_PUBLIC_RESOLVER_EVM_ADDR!;
const pk = process.env.NEXT_PUBLIC_RESOLVER_EVM_PK!;
const factoryAddr = '0x9CA8EEFbe7CB1827be7781eD713b74955f1be0be'

export async function takerCosmosFill() {
    console.log("taker evm rpc: ", process.env.NEXT_PUBLIC_EVM_RPC)
    const order = loadOrder();
    if (order.swap.to.network != 'ethereum') throw new Error('Invalid network for maker escrow')

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_EVM_RPC);
    const signer = new ethers.Wallet(pk, provider);
    const factory = new ethers.Contract(factoryAddr, EscrowFactoryABI, signer);

    const immutables = {
        orderHash: '0x' + crypto.createHash('sha256').update(`order:${order.orderID}`).digest('hex'),
        hashlock: '0x' + order.hashlock,
        maker: order.swap.to.address,
        taker,
        token: '0x0000000000000000000000000000000000000000', // hardcoded to eth for now, but any erc20 will work
        amount: order.swap.to.amount,
        safetyDeposit: ethers.parseUnits('0.001', 6).toString(),
        timelocks: createEvmTimelock(
            BigInt(Math.floor(Date.now() / 1000)),
            30n,
            120n,
            30n,
            120n,
        ),
    }

    console.log('Immutables:')
    console.dir(immutables, { depth: null });

    const funds = (BigInt(order.swap.to.amount) + BigInt(immutables.safetyDeposit)).toString()

    const escrow = await factory.addressOfEscrowDst(immutables);
    console.log('\ndst escrow:', escrow);

    await factory.createDstEscrow(immutables, { value: funds });
    console.log("dst escrow created");
}