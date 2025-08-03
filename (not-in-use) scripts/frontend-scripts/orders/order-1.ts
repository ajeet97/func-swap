import crypto from 'crypto'

import { Order, Status } from './types'
import { ethers } from 'ethers';

const secret = crypto.randomBytes(32).toString('hex');
export const order: Order = {
    // orderHash: crypto.createHash('sha256').update('order-1').digest('base64'),
    orderID: 1,
    timestamp: Math.floor(Date.now() / 1000),

    swap: {
        from: {
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            token: '0x0000000000000000000000000000000000000000',
            amount: ethers.parseEther('0.001').toString(),
            network: 'ethereum',
            chainID: 11155111,
        },

        to: {
            address: 'wasm1r66lx8v6tleumkvm9vup5m32hf7mdu5fd2awha',
            token: 'stake',
            amount: ethers.parseUnits('0.001', 6).toString(),
            network: 'cosmos',
            chainID: 'test-chain-1'
        }

    },

    secret,
    hashlock: crypto.createHash('sha256').update(secret).digest('hex'),

    status: Status.CREATED,

    timelocks: {
        withdrawalPeriod: 30,
        cancellationPeriod: 120,
    }
}