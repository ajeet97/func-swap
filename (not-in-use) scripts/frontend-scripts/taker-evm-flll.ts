import "dotenv/config"
import crypto from 'crypto'
import { ethers } from "ethers";

import EscrowFactoryABI from "./abis/EscrowFactory.json";
import { loadOrder } from "./order";
import { createEvmTimelock } from "./timelock";

const pk = process.env.RESOLVER_EVM_PK;
const factoryAddr = process.env.ESCROW_FACTORY;
const taker = process.env.RESOLVER_EVM_ADDR;

const orderID = 2;

async function takerFill() {
    const order = loadOrder(orderID);
    if (order.swap.to.network != 'ethereum') throw new Error('Invalid network for maker escrow')

    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC);
    const signer = new ethers.Wallet(pk, provider);
    const factory = new ethers.Contract(factoryAddr, EscrowFactoryABI, signer);

    // bytes32 orderHash;
    //     bytes32 hashlock;  // Hash of the secret.
    //     Address maker;
    //     Address taker;
    //     Address token;
    //     uint256 amount;
    //     uint256 safetyDeposit;
    //     Timelocks timelocks;
    const immutables = {
        orderHash: '0x' + crypto.createHash('sha256').update(`order:${orderID}`).digest('hex'),
        hashlock: '0x' + order.hashlock,
        maker: order.swap.to.address,
        taker,
        token: '0x0000000000000000000000000000000000000000',
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

async function main() {
    await takerFill();
}

main().catch(console.error);