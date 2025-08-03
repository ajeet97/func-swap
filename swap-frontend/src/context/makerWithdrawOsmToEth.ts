import crypto from 'crypto';
import { ethers } from "ethers";
import { loadOrder } from "./Order";

import EscrowDstABI from "../abis/EscrowDst.json";
import EscrowFactoryABI from "../abis/EscrowFactory.json";
import { createEvmTimelock } from './timelocks';

const taker = process.env.NEXT_PUBLIC_RESOLVER_EVM_ADDR!;
const pk = process.env.NEXT_PUBLIC_RESOLVER_EVM_PK!;
const factoryAddr = '0x9CA8EEFbe7CB1827be7781eD713b74955f1be0be'

export async function makerCosmosWithdraw() {
    const order = loadOrder();
    if (order.swap.to.network != 'ethereum') throw new Error('Invalid network for maker withdraw')

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_EVM_RPC);
    const signer = new ethers.Wallet(pk, provider);
    const factory = new ethers.Contract(factoryAddr, EscrowFactoryABI, signer);

    const immutables = {
        orderHash: '0x' + crypto.createHash('sha256').update(`order:${order.orderID}`).digest('hex'),
        hashlock: '0x' + order.hashlock,
        maker: order.swap.to.address,
        taker,
        token: order.swap.to.token,
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

    const escrowAddr = await factory.addressOfEscrowDst(immutables);
    console.log('\ndst escrow:', escrowAddr);

    const escrow = new ethers.Contract(escrowAddr, EscrowDstABI, signer);

    await escrow.withdraw('0x' + order.secret, immutables);
    console.log("funds claimed on ethereum");
}