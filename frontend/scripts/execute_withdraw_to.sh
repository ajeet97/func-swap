#!/bin/bash
CONTRACT=$1
SECRET=$2
TARGET=$3

cat <<EOF > withdraw_to_msg.json
{
  "withdraw_to": {
    "secret": "$SECRET",
    "target": "$TARGET",
    "immutables": $(cat immutables.json)
  }
}
EOF

wasmd tx wasm execute $CONTRACT "$(cat withdraw_to_msg.json)" \
  --from alice \
  --gas auto \
  --fees 5000stake \
  --keyring-backend test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  --broadcast-mode block \
  -y
