CONTRACT="escrow_src.wasm"
CHAIN_ID="test-chain-1"
PROJECT_DIR="$HOME/ETHGlobal/func-swap"

# Upload the contract
RESP=$(wasmd tx wasm store "$PROJECT_DIR/cosmos2/artifacts/$CONTRACT" \
  --from alice \
  --gas 2000000 \
  -y \
  --chain-id=$CHAIN_ID \
  -o json \
  --keyring-backend=test)

TX_HASH=$(echo "$RESP" | jq -r '.txhash')

echo "* Tx: $TX_HASH"

# Wait for the transaction to be processed
sleep 6

# Fetch the transaction details
RESP=$(wasmd q tx $TX_HASH -o json)
 
# Extract the code ID
CODE_ID=$(echo "$RESP" | jq -r '.events[]| select(.type=="store_code").attributes[]| select(.key=="code_id").value')
 
# Print code id
echo "* Code id: $CODE_ID"