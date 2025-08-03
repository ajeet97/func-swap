#!/bin/bash
CONTRACT=$1

wasmd tx wasm execute $CONTRACT "$(cat withdraw_msg.json)" \
  --from alice \
  --gas auto \
  --fees 5000stake \
  --keyring-backend test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  --broadcast-mode block \
  -y
