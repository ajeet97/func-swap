#!/bin/bash

# Inputs
DEPLOYED_AT=$1
SRC_WITHDRAWAL=$2
SRC_CANCELLATION=$3
DST_WITHDRAWAL=$4
DST_CANCELLATION=$5
ORDER_HASH=$6
HASHLOCK=$7
MAKER=$8
TAKER=$9
DENOM=${10}
AMOUNT=${11}
SAFETY_DEPOSIT=${12}
SECRET=${13}

# Compute dst and src
dst=$(echo "($DEPLOYED_AT * 2^96) + ($DST_CANCELLATION * 2^64) + ((2 * $DST_WITHDRAWAL) * 2^32) + $DST_WITHDRAWAL" | bc)
src=$(echo "((2 * $SRC_CANCELLATION) * 2^96) + ($SRC_CANCELLATION * 2^64) + ((2 * $SRC_WITHDRAWAL) * 2^32) + $SRC_WITHDRAWAL" | bc)

# Generate immutables.json
cat <<EOF > immutables.json
{
  "order_hash": "$ORDER_HASH",
  "hashlock": "$HASHLOCK",
  "maker": "$MAKER",
  "taker": "$TAKER",
  "coin": {
    "native": [
      {
        "denom": "$DENOM",
        "amount": "$AMOUNT"
      }
    ]
  },
  "safety_deposit": "$SAFETY_DEPOSIT",
  "timelocks": {
    "dst": "$dst",
    "src": "$src"
  }
}
EOF

# Generate withdraw_msg.json
cat <<EOF > withdraw_msg.json
{
  "withdraw": {
    "secret": "$SECRET",
    "immutables": $(cat immutables.json)
  }
}
EOF

echo "✅ Generated immutables.json and withdraw_msg.json"




# ./generate_withdraw_msg.sh 1000000 1000 2000 1500 2500 "order_1" "0xabc123..." "wasm1maker..." "wasm1taker..." "stake" "1000000" "1000" "0xsecret..."
