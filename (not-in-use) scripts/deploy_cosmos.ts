import "dotenv/config";
import fs from "fs";
import path from "path";
import {
    SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import {
    DirectSecp256k1HdWallet,
} from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

const RPC_ENDPOINT = process.env.COSMOS_RPC;
const MNEMONIC = process.env.MNEMONIC;
const PREFIX = process.env.PREFIX;
const DENOM = process.env.NATIVE_DENOM;

const escrowSrcPath = path.resolve(__dirname, '../cosmos/artifacts/escrow_src.wasm');
const escrowDstPath = path.resolve(__dirname, '../cosmos/artifacts/escrow_dst.wasm');

async function main() {
    console.log("Deploying escrow src");
    await deploy(escrowSrcPath);

    console.log("Deploying escrow dst");
    await deploy(escrowDstPath);
}

async function deploy(wasmPath: string) {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
        prefix: PREFIX,
    });
    const [account] = await wallet.getAccounts();

    const client = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        wallet,
        { gasPrice: GasPrice.fromString(`1000${DENOM}`) }
    );

    console.log("Uploading contract...");
    const wasm = fs.readFileSync(wasmPath);
    const uploadRes = await client.upload(account.address, wasm, "auto");

    console.log("Upload complete. Code ID:", uploadRes.codeId);

    // const initMsg = {
    //     // fill with your contract’s instantiate message
    //     count: 0,
    // };

    // const label = "my-contract-instance";

    // console.log("Instantiating contract...");
    // const instantiateRes = await client.instantiate(
    //     account.address,
    //     uploadRes.codeId,
    //     initMsg,
    //     label,
    //     "auto"
    // );

    // console.log("Contract instantiated at:", instantiateRes.contractAddress);
}

main().catch(console.error);
