import { ethers } from "ethers";
import { createOrder } from "./order";

createOrder(1, {
    from: {
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        token: '0x0000000000000000000000000000000000000000',
        amount: ethers.parseEther('0.001').toString(),
        network: 'ethereum',
        chainID: 11155111,
    },

    to: {
        address: 'wasm1r66lx8v6tleumkvm9vup5m32hf7mdu5fd2awha',
        token: 'stake',
        amount: ethers.parseUnits('0.001', 6).toString(),
        network: 'cosmos',
        chainID: 'test-chain-1'
    }
});