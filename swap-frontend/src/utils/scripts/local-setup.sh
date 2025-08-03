GENESIS_FILE="~/.wasmd/config/genesis.json"

if [[ -f "$GENESIS_FILE" ]]; then
    echo "Initializing wasmd node..."

    # Initialize the node with a moniker (name) and a specific chain ID
    wasmd init demo --chain-id=test-chain-1
    
    # Add key pairs for alice and bob accounts
    wasmd keys add alice --keyring-backend=test
    wasmd keys add bob --keyring-backend=test
    
    # Add genesis accounts with initial balances
    wasmd genesis add-genesis-account alice "1000000000000stake" --keyring-backend=test
    wasmd genesis add-genesis-account bob "1000000000000stake" --keyring-backend=test
    
    # Create a genesis transaction for the alice account, making alice a validator
    wasmd genesis gentx alice "250000000stake" --chain-id=test-chain-1 --amount="250000000stake" --keyring-backend=test
    
    # Collect genesis transactions to finalize the genesis file
    wasmd genesis collect-gentxs
fi

echo "Starting wasmd node..."
wasmd start