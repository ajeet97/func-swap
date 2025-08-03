import crypto from 'crypto';
import { loadOrder } from "./Order";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { ethers } from "ethers";
import { createTimelock } from "./timelocks";

const taker = process.env.NEXT_PUBLIC_RESOLVER_COSMOS_ADDR!;
const MNEMONIC = process.env.NEXT_PUBLIC_RESOLVER_COSMOS_MNEMONIC!;
const PREFIX = process.env.NEXT_PUBLIC_PREFIX!;
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_COSMOS_RPC!;

export async function takerCosmosWithdraw() {
    console.log('taker withdrawing on cosmos')

    const order = loadOrder();
    if (order.swap.from.network != 'cosmos') throw new Error('Invalid network for taker withdraw')

    const { DirectSecp256k1HdWallet } = await import("@cosmjs/proto-signing");
    const { GasPrice } = await import("@cosmjs/stargate");

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
        prefix: PREFIX,
    });
    const [account] = await wallet.getAccounts();
    console.log('taker:', account.address);

    const client = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        wallet,
        { gasPrice: GasPrice.fromString('0.001uosmo') }
    );

    const withdrawMsg = {
        secret: order.secret,
        immutables: {
            order_hash: crypto.createHash('sha256').update(`order:${order.orderID}`).digest('hex'),
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
            timelocks: createTimelock(
                BigInt(Math.floor(Date.now() / 1000)),
                30n,
                120n,
                30n,
                120n,
            ),
        }
    };

    console.log('withdraw msg:');
    console.dir(withdrawMsg, { depth: null });

    const res = await client.execute(account.address, order.srcEscrow!, withdrawMsg, 'auto');
    console.log('withdraw tx:', res.transactionHash);
}
