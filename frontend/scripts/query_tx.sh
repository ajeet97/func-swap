#!/bin/bash
TX_HASH=$1

wasmd query tx $TX_HASH \
  --node http://localhost:26657 \
  -o json | jq
