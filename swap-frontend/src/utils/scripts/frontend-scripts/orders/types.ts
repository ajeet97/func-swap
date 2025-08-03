export type Network = 'cosmos' | 'ethereum'

export enum Status {
    CREATED,
    TAKER_ESCROW,
    MAKER_ESCROW,
    MAKER_CLAIM,
    TAKER_CLAIM,
    CANCELLED,
}

export interface SwapInfo {
    address: string,
    token: string,
    amount: string,

    network: Network,
    chainID: string | number,
}

export interface Order {
    orderID: number,
    timestamp: number,

    swap: {
        from: SwapInfo,
        to: SwapInfo
    },

    secret: string,
    hashlock: string,

    timelocks: {
        withdrawalPeriod: number,
        cancellationPeriod: number,
    },

    status: Status,


    srcEscrow?: string,
    dstEscrow?: string,
    srcClaimTx?: string,
    dstClaimTx?: string,
}