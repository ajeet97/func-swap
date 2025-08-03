#!/bin/bash

CODE_ID=$1

cat <<EOF > instantiate_msg.json
{
  "rescue_delay": 1000,
  "immutables": $(cat immutables.json)
}
EOF

wasmd tx wasm instantiate $CODE_ID "$(cat instantiate_msg.json)" \
  --from alice \
  --amount 1001000stake \
  --label "atomic-escrow-instance" \
  --gas auto \
  --fees 5000stake \
  --keyring-backend test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  --broadcast-mode block \
  -y


# usage
# ./instantiate_contract.sh 1
