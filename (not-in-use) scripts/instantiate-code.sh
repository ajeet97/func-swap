# Set up addresses
ALICE_ADDR=$(wasmd keys show alice -a --keyring-backend=test)
BOB_ADDR=$(wasmd keys show bob -a --keyring-backend=test)

CODE_ID=4

# IMMUTABLES="""{
#   \"order_hash\": \"order_1\",
#   \"hashlock\": \"0x27e095953b17944ef3a8ae37d093f9cd0c3a9bd8606a65b4e602aa37c0d6108e\",
#   \"maker\": \"wasm1uft7ud295pc0u496j7xh9535r4ffq2mxllnn4j\",
#   \"taker\": \"wasm1dwe5armpq5vsucyulcynfzgx5qgf7gcveqhxqz\",
#   \"token\": \"stake\",
#   \"amount\": \"1000000\",
#   \"safety_deposit\": \"1000\",
#   \"timelocks\": {
#     \"dst\": \"138970969992213996810240144128499253248\",
#     \"src\": \"0\"
#   }
# }"""

# secret: 0xdb44e0898fad0fe3643304a065d2b8b74502546d0876f1908cc512e2d76a1e28
IMMUTABLES='{
  "order_hash": "order_1",
  "hashlock": "0x4880eef8594c359132719b76f8c1041a1484e92c3c087ef6575dc47b9b477da5",
  "maker": "wasm1uft7ud295pc0u496j7xh9535r4ffq2mxllnn4j",
  "taker": "wasm1dwe5armpq5vsucyulcynfzgx5qgf7gcveqhxqz",
  "coin": {
    "native": [
      {
        "denom": "stake",
        "amount": "1000000"
      }
    ]
  },
  "safety_deposit": "1000",
  "timelocks": {
    "dst": "138972037433247551493660541946142130176",
    "src": "0"
  }
}'
INIT='{"rescue_delay":1000, "immutables":'"$IMMUTABLES"' }'

echo $INIT

# Instantiate the contract
RESP=$(wasmd tx wasm instantiate "$CODE_ID" "$INIT" \
  --admin="$ALICE_ADDR" \
  --from alice \
  --amount="1001000stake" \
  --label "escrow_src_1" \
  --gas 1000000 \
  -y \
  --chain-id=test-chain-1 \
  -o json \
  --keyring-backend=test)

TX_HASH=$(echo "$RESP" | jq -r '.txhash')

echo "* Tx: $TX_HASH"

echo "* RESP: $RESP"

# Wait for the transaction to be processed
sleep 6

# Fetch the transaction details
wasmd q tx $TX_HASH -o json | jq

# Query the contract address
CONTRACT=$(wasmd query wasm list-contract-by-code "$CODE_ID" -o json | jq -r '.contracts[-1]')
 
# Print the contract address
echo "* Contract address: $CONTRACT"