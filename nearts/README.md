# Hello NEAR Contract

The smart contract exposes two methods to enable storing and retrieving a greeting in the NEAR network.

```ts
@NearBindgen({})
class HelloNear {
  greeting: string = "Hello";

  @view // This method is read-only and can be called for free
  get_greeting(): string {
    return this.greeting;
  }

  @call // This method changes the state, for which it cost gas
  set_greeting({ greeting }: { greeting: string }): void {
    // Record a log permanently to the blockchain!
    near.log(`Saving greeting ${greeting}`);
    this.greeting = greeting;
  }
}
```

<br />

# Quickstart

1. Make sure you have installed [node.js](https://nodejs.org/en/download/package-manager/) >= 16.
2. Install the [`NEAR CLI`](https://github.com/near/near-cli#setup)

<br />

## 1. Build and Test the Contract
You can automatically compile and test the contract by running:

```bash
npm run build
```

<br />

## 2. Create an Account and Deploy the Contract
You can create a new account and deploy the contract by running:

```bash
near create-account <your-account.testnet> --useFaucet
near deploy <your-account.testnet> build/release/hello_near.wasm
```

<br />


## 3. Retrieve the Greeting

`get_greeting` is a read-only method (aka `view` method).

`View` methods can be called for **free** by anyone, even people **without a NEAR account**!

```bash
# Use near-cli to get the greeting
near view <your-account.testnet> get_greeting
```

<br />

## 4. Store a New Greeting
`set_greeting` changes the contract's state, for which it is a `call` method.

`Call` methods can only be invoked using a NEAR account, since the account needs to pay GAS for the transaction.

```bash
# Use near-cli to set a new greeting
near call <your-account.testnet> set_greeting '{"greeting":"howdy"}' --accountId <your-account.testnet>
```

**Tip:** If you would like to call `set_greeting` using another account, first login into NEAR using:

```bash
# Use near-cli to login your NEAR account
near login
```

and then use the logged account to sign the transaction: `--accountId <another-account>`.


near create-account hello.mukulvashisht.testnet --masterAccount mukulvashisht.testnet

near send mukulvashisht.testnet hello.mukulvashisht.testnet 5

near deploy hello.mukulvashisht.testnet build/hello_near.wasm

near view hello.mukulvashisht.testnet get_greeting '{}'

near add-credentials sandbox.test.near --seedPhrase "shock party frozen venue hen earn yard board bargain art broccoli above"

Seed phrase: enjoy milk soon sheriff gather gospel fuel rely rough fossil abuse sphere
Key pair: {"publicKey":"ed25519:E6qfYFdRdZZtJySv6JfjLsKx6KxJKkw79cKYswnhZc4R","secretKey":"ed25519:4evzFhEpU2PFD5wvcRTG78Ai9Rmf2Ddg4ZJRyimFn1gPneZLHtXrP8ypWpS8RhzsXxKFk1poJ9ECVtQtw8G3zz3s"}
Implicit account: c2a6dbf2a59a8d1e451be8e30ef6cc80e7a47e482007f07b35c4c0aec1bf86d2
Storing credentials for account: sandbox.test.near (network: sandbox)
Saving key to '~/.near-credentials/sandbox/sandbox.test.near.json'


near call hello.mukulvashisht.testnet set_greeting '{"greeting": "Namaste NEAR!"}' --accountId mukulvashisht.testnet
