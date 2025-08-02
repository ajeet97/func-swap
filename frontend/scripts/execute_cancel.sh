#!/bin/bash
CONTRACT=$1

cat <<EOF > cancel_msg.json
{
  "cancel": {
    "immutables": $(cat immutables.json)
  }
}
EOF

wasmd tx wasm execute $CONTRACT "$(cat cancel_msg.json)" \
  --from alice \
  --gas auto \
  --fees 5000stake \
  --keyring-backend test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  --broadcast-mode block \
  -y
