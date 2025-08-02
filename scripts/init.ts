import crypto from 'crypto';
import * as ethers from 'ethers'
import * as fs from 'fs';

// pub order_hash: String,
//     pub hashlock: String,
//     pub maker: Addr,
//     pub taker: Addr,
//     pub coin: cw20::Balance,
//     pub safety_deposit: u128,
//     pub timelocks: Timelocks,

interface Immutables {
    order_hash: string;
    hashlock: string;
    maker: string;
    taker: string;
    coin: {
        native?: { denom: string, amount: string }[],
        cw20?: { address: string, amount: string }
    },
    // token: string,
    // amount: string,
    safety_deposit: string,
    timelocks: {
        dst: string,
        src: string,
    }
}

const rescue_delay = 100;

const ALICE = 'wasm1uft7ud295pc0u496j7xh9535r4ffq2mxllnn4j'
const BOB = 'wasm1dwe5armpq5vsucyulcynfzgx5qgf7gcveqhxqz'

const secret = '0x' + crypto.randomBytes(32).toString('hex');
const hashlock = ethers.sha256(secret);

const immutables: Immutables = {
    order_hash: 'order_1',
    hashlock,
    maker: ALICE,
    taker: BOB,
    coin: {
        native: [{
            denom: 'stake',
            amount: '1000000',
        }]
    },
    // token: 'stake',
    // amount: '1000000',
    safety_deposit: '1000',
    timelocks: createTimelock(0, 0, 100),
};

function createTimelock(withdrawalPeriod: number, publicWithdrawalPeriod: number, cancellationPeriod: number) {
    const now_sec = Math.floor(Date.now() / 1000)
    const dst = (BigInt(now_sec) << 96n) | (BigInt(cancellationPeriod) << 64n) | (BigInt(publicWithdrawalPeriod) << 32n) | BigInt(withdrawalPeriod);
    return {
        dst: dst.toString(),
        src: '0'
    }
}

console.log('secret:', secret);
console.log(JSON.stringify(immutables, null, 2));
fs.writeFileSync('msg.json', JSON.stringify({ rescue_delay, immutables }, null, 2))