#!/bin/bash
CONTRACT=$1

wasmd query wasm contract-state smart $CONTRACT '{"get_state":{}}' \
  --node http://localhost:26657 \
  -o json | jq
