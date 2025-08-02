#!/bin/bash

set -e

ALICE_ADDR=$(wasmd keys show alice -a --keyring-backend=test)
BOB_ADDR=$(wasmd keys show bob -a --keyring-backend=test)


CONTRACT="wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d"
CODE_ID="1"
SECRET="test_alice_secret"
TARGET=$BOB_ADDR
TX_HASH=""
PROJECT_DIR="$HOME/uniteDefi/func-swap"
CONTRACT="escrow_src.wasm"
PATH_TO_CONTRACT="$PROJECT_DIR/cosmos/artifacts/$CONTRACT"

function input_contract() {
  read -p "Enter code ID (or leave blank to type address): " CODE_ID_INPUT

  if [[ -n "$CODE_ID_INPUT" ]]; then
    CONTRACT=$(wasmd query wasm list-contract-by-code "$CODE_ID_INPUT" -o json | jq -r '.contracts[-1]')
    echo "📦 Resolved latest contract from code ID $CODE_ID_INPUT:"
    echo "➡️  $CONTRACT"
  else
    read -p "Enter contract address: " CONTRACT
  fi
}

function input_code_id() {
  read -p "Enter code ID: " CODE_ID
}

function input_secret() {
  read -p "Enter secret: " SECRET
}

function input_target() {
  read -p "Enter target address: " TARGET
}

function input_tx_hash() {
  read -p "Enter transaction hash: " TX_HASH
}

function store_contract() {
  wasmd tx wasm store $PATH_TO_CONTRACT \
    --from alice \
    --gas auto \
    --fees 5000stake \
    --keyring-backend test \
    --chain-id test-chain-1 \
    --node http://localhost:26657 \
    --broadcast-mode sync \
    -y

    sleep 5
}

function instantiate_contract() {
  input_code_id
  cat <<EOF > instantiate_msg.json
{
  "rescue_delay": 1000,
  "immutables": $(cat immutables.json)
}
EOF
TX=$(wasmd tx wasm instantiate $CODE_ID "$(cat instantiate_msg.json)" \
  --admin $(wasmd keys show alice -a --keyring-backend test) \
  --label "atomic-escrow-instance" \
  --amount 999999stake \
  --from alice \
  --keyring-backend test \
  --gas auto \
  --fees 5000stake \
  --keyring-backend test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  --broadcast-mode sync \
  -y --output json | jq -r '.txhash')

echo "⏳ Waiting for contract to appear..."

sleep 5

CONTRACT=$(wasmd query wasm list-contract-by-code $CODE_ID -o json | jq -r '.contracts[-1]')
echo "✅ Contract deployed at: $CONTRACT"

}

function execute_withdraw() {
  input_contract
  wasmd tx wasm execute $CONTRACT "$(cat withdraw_msg.json)" \
    --from alice \
    --gas auto \
    --fees 5000stake \
    --keyring-backend test \
    --chain-id test-chain-1 \
    --node http://localhost:26657 \
    --broadcast-mode sync \
    -y
}

function execute_cancel() {
  input_contract
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
    --broadcast-mode sync \
    -y
}

function execute_public_withdraw() {
  input_contract
  input_secret
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
    --broadcast-mode sync \
    -y
}

function execute_withdraw_to() {
  input_contract
  input_secret
  input_target
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
    --broadcast-mode sync \
    -y
}

function execute_public_cancel() {
  input_contract
  cat <<EOF > public_cancel_msg.json
{
  "public_cancel": {
    "immutables": $(cat immutables.json)
  }
}
EOF
  wasmd tx wasm execute $CONTRACT "$(cat public_cancel_msg.json)" \
    --from alice \
    --gas auto \
    --fees 5000stake \
    --keyring-backend test \
    --chain-id test-chain-1 \
    --node http://localhost:26657 \
    --broadcast-mode sync \
    -y
}

function query_state() {
  input_contract
  wasmd query wasm contract-state smart $CONTRACT '{"get_state":{}}' \
    --node http://localhost:26657 \
    -o json | jq
}

function query_tx() {
  input_tx_hash
  wasmd query tx $TX_HASH \
    --node http://localhost:26657 \
    -o json | jq
}


function generate_instantiate_msg() {
  mkdir -p archive

  archive_if_exists() {
    local file=$1
    if [[ -f "$file" ]]; then
      local base=$(basename "$file" .json)
      local i=1
      while [[ -f "archive/${base}_$i.json" ]]; do
        ((i++))
      done
      mv "$file" "archive/${base}_$i.json"
      echo "📦 Archived existing $file to archive/${base}_$i.json"
    fi
  }

  echo "🔧 Creating instantiate_msg.json from user input..."
  echo "alice address"
  echo $ALICE_ADDR
  echo "bob address"
  echo $BOB_ADDR
  echo "denom is"
  echo $DENOM
  read -p "Order hash: " ORDER_HASH


 echo "🔐 You can enter your own secret, or leave blank to generate a random one."
read -p "Enter secret (hex string): " SECRET

if [[ -z "$SECRET" ]]; then
  SECRET=$(openssl rand -hex 32)
  echo "🪄 Generated secret: $SECRET"
fi

# Convert secret to binary and hash it
HASHLOCK=$(echo -n "$SECRET" | xxd -r -p | shasum -a 256 | awk '{print $1}')

echo "🔒 Derived hashlock: $HASHLOCK"


  read -p "Maker address (wasm1...): " MAKER
  read -p "Taker address (wasm1...): " TAKER
  read -p "Token denom (e.g., stake): " DENOM
  read -p "Token amount: " AMOUNT
  read -p "Safety deposit amount: " SAFETY_DEPOSIT
  read -p "Rescue delay (seconds): " RESCUE_DELAY

  echo "⏱  Timelock Setup"
  read -p "Deployed at (timestamp or block time as u32): " DEPLOYED_AT
  read -p "Src withdrawal delay: " SRC_WITHDRAWAL
  read -p "Src cancellation delay: " SRC_CANCELLATION
  read -p "Dst withdrawal delay: " DST_WITHDRAWAL
  read -p "Dst cancellation delay: " DST_CANCELLATION

  DST=$(echo "($DEPLOYED_AT * 2^96) + ($DST_CANCELLATION * 2^64) + ((2 * $DST_WITHDRAWAL) * 2^32) + $DST_WITHDRAWAL" | bc)
  SRC=$(echo "((2 * $SRC_CANCELLATION) * 2^96) + ($SRC_CANCELLATION * 2^64) + ((2 * $SRC_WITHDRAWAL) * 2^32) + $SRC_WITHDRAWAL" | bc)

  archive_if_exists "immutables.json"
  archive_if_exists "instantiate_msg.json"

  # Create immutables.json
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
    "dst": "$DST",
    "src": "$SRC"
  }
}
EOF

  # Wrap into instantiate_msg.json
  cat <<EOF > instantiate_msg.json
{
  "rescue_delay": $RESCUE_DELAY,
  "immutables": $(cat immutables.json)
}
EOF

  echo "✅ Generated:"
  echo "  - immutables.json"
  echo "  - instantiate_msg.json"
}


# Menu loop
while true; do
  echo "================= CosmWasm Escrow CLI ================="
  echo "1) Store contract"
  echo "2) Instantiate contract"
  echo "3) Execute: Withdraw"
  echo "4) Execute: Cancel"
  echo "5) Execute: PublicWithdraw"
  echo "6) Execute: WithdrawTo"
  echo "7) Execute: PublicCancel"
  echo "8) Query contract state"
  echo "9) Query transaction"
  echo "10) Generate instantiate_msg.json"
  echo "0) Exit"
  echo "======================================================"
  read -p "Choose an option: " option

  case $option in
    1) store_contract ;;
    2) instantiate_contract ;;
    3) execute_withdraw ;;
    4) execute_cancel ;;
    5) execute_public_withdraw ;;
    6) execute_withdraw_to ;;
    7) execute_public_cancel ;;
    8) query_state ;;
    9) query_tx ;;
    10) generate_instantiate_msg ;;
    0) break ;;
    *) echo "Invalid option!" ;;
  esac

  echo -e "\nPress enter to continue..."
  read
done
