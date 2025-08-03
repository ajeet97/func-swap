export function createTimelock(
    deployedAt: bigint,
    srcWithdrawal: bigint,
    srcCancellation: bigint,
    dstWithdrawal: bigint,
    dstCancellation: bigint,
) {
    return {
        dst: (deployedAt << 96n
            | dstCancellation << 64n
            | (2n * dstWithdrawal) << 32n
            | dstWithdrawal).toString(),
        src: ((2n * srcCancellation) << 96n
            | srcCancellation << 64n
            | (2n * srcWithdrawal) << 32n
            | srcWithdrawal).toString(),
    }
}

export function createEvmTimelock(
    deployedAt: bigint,
    srcWithdrawal: bigint,
    srcCancellation: bigint,
    dstWithdrawal: bigint,
    dstCancellation: bigint,
) {
    return (
        deployedAt << 224n
        | dstCancellation << 192n
        | (2n * dstWithdrawal) << 160n
        | dstWithdrawal << 128n
        | (2n * srcCancellation) << 96n
        | srcCancellation << 64n
        | (2n * srcWithdrawal) << 32n
        | srcWithdrawal
    ).toString();
}