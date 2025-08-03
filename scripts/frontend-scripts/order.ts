import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Order, Status, SwapInfo } from './orders/types';

interface SwapOpts {
    from: SwapInfo,
    to: SwapInfo
}

export function loadOrder(orderID: number) {
    const orderPath = path.resolve(__dirname, `./orders/${orderID}.json`);
    if (!fs.existsSync(orderPath)) throw new Error(`order:${orderID} does not exist`);

    return JSON.parse(fs.readFileSync(orderPath).toString()) as Order;
}

export function createOrder(orderID: number, swap: SwapOpts) {
    const orderPath = path.resolve(__dirname, `./orders/${orderID}.json`);
    if (fs.existsSync(orderPath)) throw new Error(`order:${orderID} already created`);

    const secret = crypto.randomBytes(32).toString('hex');
    const hashlock = crypto.createHash('sha256').update(secret).digest('hex');

    const order: Order = {
        orderID,
        timestamp: Date.now(),
        swap,
        secret,
        hashlock,
        timelocks: {
            withdrawalPeriod: 30,
            cancellationPeriod: 120,
        },
        status: Status.CREATED,
    }

    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2))
    console.log(`order saved to: ${orderPath}`);
}

// export function takerEscrow(orderID: number, dstEscrow: string) {
//     updateOrder(orderID, (order) => {
//         order.status = Status.TAKER_ESCROW;
//         order.dstEscrow = dstEscrow;
//     });
// }

// export function makerEscrow(orderID: number, srcEscrow: string) {
//     updateOrder(orderID, (order) => {
//         order.status = Status.MAKER_ESCROW;
//         order.srcEscrow = srcEscrow;
//     });
// }

export function updateOrder(orderID: number, updater: (order: Order) => void) {
    const orderPath = path.resolve(__dirname, `./orders/${orderID}.json`);
    if (!fs.existsSync(orderPath)) throw new Error(`order:${orderID} does not exist`);

    const order = JSON.parse(fs.readFileSync(orderPath).toString()) as Order;
    updater(order);
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
}