import "dotenv/config";
import crypto from 'crypto';
import {
    SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import {
    DirectSecp256k1HdWallet,
} from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

import { order } from './orders/order-2'
import { ethers } from "ethers";
import { createTimelock } from "./timelock";

const RPC_ENDPOINT = process.env.COSMOS_RPC;
const MNEMONIC = process.env.MNEMONIC;
const PREFIX = process.env.PREFIX;
const NATIVE_DENOM = process.env.NATIVE_DENOM;
const ESCROW_SRC_CODE_ID = Number(process.env.COSMOS_ESCROW_SRC_CODE_ID);

const taker = process.env.RESOLVER_COSMOS_ADDR;

async function makerEscrow() {
    if (order.swap.from.network != 'cosmos') throw new Error('Invalid network for maker escrow')

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
        prefix: PREFIX,
    });
    const [account] = await wallet.getAccounts();
    console.log('account:', account.address);

    if (account.address != order.swap.from.address) {
        throw new Error('wallet does not match with maker address');
    }

    const client = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        wallet,
        { gasPrice: GasPrice.fromString('1000stake') }
    );

    const initMsg = {
        // rescue delay is not being used as of now
        rescue_delay: 1200, // 20 minutes

        immutables: {
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
            timelocks: createTimelock(
                BigInt(Math.floor(Date.now() / 1000)),
                30n,
                120n,
                30n,
                120n,
            ),
        }
    };

    console.log('init msg:');
    console.dir(initMsg, { depth: null });

    const funds = [{
        denom: NATIVE_DENOM,
        amount: initMsg.immutables.safety_deposit,
    }];

    if (initMsg.immutables.coin.native[0]?.denom == NATIVE_DENOM) {
        funds[0].amount = (BigInt(funds[0].amount) + BigInt(initMsg.immutables.coin.native[0].amount)).toString();
    } else if (initMsg.immutables.coin.native) {
        funds.push(initMsg.immutables.coin.native[0])
    } else {
        throw new Error('Cw20 token not supported yet')
    }

    const label = 'maker-escrow-order-' + order.orderID;
    console.log("Instantiating contract...");
    const instantiateRes = await client.instantiate(
        account.address,
        ESCROW_SRC_CODE_ID,
        initMsg,
        label,
        "auto",
        { funds }
    );

    console.log("Contract instantiated at:", instantiateRes.contractAddress);
}

async function main() {
    await makerEscrow();
}

main().catch(console.error)