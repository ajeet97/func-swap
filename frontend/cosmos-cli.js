const { StargateClient } = require("@cosmjs/stargate");

async function main() {
  const rpcEndpoint = "http://localhost:26657"; // public endpoint
  const client = await StargateClient.connect(rpcEndpoint);

  const chainId = await client.getChainId();
  console.log("Connected to chain:", chainId);

  const height = await client.getHeight();
  console.log("Current block height:", height);

  const balance = await client.getAllBalances("cosmos1...");
  console.log("Balance:", balance);
}

main();



/**
 * 
 * Withdraw Query
 
wasmd tx wasm execute wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d "$(cat withdraw_msg.json)" \
  --from alice \
  --fees 5000stake \
  --gas 500000 \
  --keyring-backend=test \
  --chain-id test-chain-1 \
  --node http://localhost:26657 \
  -y -o json
{"height":"0","txhash":"408EE5957345DA9B61B0BA3A7A104876C59984306297CF21FD590D060FC85AC8","codespace":"","code":0,"data":"","raw_log":"","logs":[],"info":"","gas_wanted":"0","gas_used":"0","tx":null,"timestamp":"","events":[]}

code: 0
codespace: ""
data: ""
events: []
gas_used: "0"
gas_wanted: "0"
height: "0"
info: ""
logs: []
raw_log: ""
timestamp: ""
tx: null
txhash: 93047285F3F7B2118640C180FA265DCE38892592871DD38374819E0A8ABB2589

wasmd query tx 93047285F3F7B2118640C180FA265DCE38892592871DD38374819E0A8ABB2589 --node http://localhost:26657 -o json | jq





 */