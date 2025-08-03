import "dotenv/config";
import crypto from 'crypto';
import {
    SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import {
    DirectSecp256k1HdWallet,
} from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

// import { order } from './orders/order-2'
import { ethers } from "ethers";
import { loadOrder } from "./Order";
import { createTimelock } from "./timelocks";

export async function makerCosmosEscrow(client: any, accountAddress: string) {
    // todo: change address to cosmo
    console.log("account address: ", accountAddress)
    const RESOLVER_COSMOS_ADDR = "osmo15xgu3ueqlpakse8ma2u4dvq3y7n6zte80khuu9"
    const order = loadOrder()
    if (order.swap.from.network != 'cosmos') throw new Error('Invalid network for maker escrow')

    // const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
    //     prefix: "osmo",
    // });
    // const [account] = await wallet.getAccounts();
    // console.log('account:', account.address);

    if (accountAddress != order.swap.from.address) {
        throw new Error('wallet does not match with maker address');
    }

    // const client = await SigningCosmWasmClient.connectWithSigner(
    //     "https://rpc.testnet.osmosis.zone",
    //     wallet,
    //     { gasPrice: GasPrice.fromString('1000uosmo') }
    // );

    const initMsg = {
        // rescue delay is not being used as of now
        rescue_delay: 1200, // 20 minutes

        immutables: {
            order_hash: "order-1",
            hashlock: order.hashlock,
            maker: order.swap.from.address,
            taker: RESOLVER_COSMOS_ADDR,
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
        denom: "uosmo",
        amount: initMsg.immutables.safety_deposit,
    }];

    if (initMsg.immutables.coin.native[0]?.denom == "uosmo") {
        funds[0].amount = (BigInt(funds[0].amount) + BigInt(initMsg.immutables.coin.native[0].amount)).toString();
    } else if (initMsg.immutables.coin.native) {
        funds.push(initMsg.immutables.coin.native[0])
    } else {
        throw new Error('Cw20 token not supported yet')
    }

    const label = 'maker-escrow-order-' + order.orderID;
    console.log("Instantiating contract...");
    const instantiateRes = await client.instantiate(
        accountAddress,
        12790,
        initMsg,
        label,
        "auto",
        { funds }
    );

    console.log("Contract instantiated at:", instantiateRes.contractAddress);
    localStorage.setItem("deployedAddress", instantiateRes.contractAddress)
}



