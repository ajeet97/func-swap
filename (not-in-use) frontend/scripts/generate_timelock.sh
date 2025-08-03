#!/bin/bash

# Helper to generate Timelocks { dst, src } Uint128 values for CosmosMsg

DEPLOYED_AT=$1
SRC_WITHDRAWAL=$2
SRC_CANCELLATION=$3
DST_WITHDRAWAL=$4
DST_CANCELLATION=$5

# Compute dst timelock Uint128
# dst = deployed_at << 96 | dst_cancellation << 64 | (2 * dst_withdrawal) << 32 | dst_withdrawal
dst=$(echo "($DEPLOYED_AT * 2^96) + ($DST_CANCELLATION * 2^64) + ((2 * $DST_WITHDRAWAL) * 2^32) + $DST_WITHDRAWAL" | bc)

# Compute src timelock Uint128
# src = (2 * src_cancellation) << 96 | src_cancellation << 64 | (2 * src_withdrawal) << 32 | src_withdrawal
src=$(echo "((2 * $SRC_CANCELLATION) * 2^96) + ($SRC_CANCELLATION * 2^64) + ((2 * $SRC_WITHDRAWAL) * 2^32) + $SRC_WITHDRAWAL" | bc)

echo "Timelocks:"
echo "  dst: \"$dst\""
echo "  src: \"$src\""


# usage
# ./generate_timelock.sh \
#   1000000 \
#   1000 \
#   2000 \
#   1500 \
#   2500