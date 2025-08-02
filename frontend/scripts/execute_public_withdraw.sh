#!/bin/bash
CONTRACT=$1
SECRET=$2

cat <<EOF > public_withdraw_msg.json
{
  "public_withdraw": {
    "secret": "$SECRET",
    "immutables": $(cat immutables.json)
  }
}
EOF

wasmd tx wasm execute $CONTRACT "$(cat public_withdraw_msg.json)" \
  --from alice \
  --gas auto \
  --fees 5000stake \
  --keyring-backend test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  --broadcast-mode block \
  -y
