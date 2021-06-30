# The FREEMOON Faucet - Money on Tap

## Quick Setup

To clone repository and install dependencies, in a terminal, run:

```bash
git clone https://github.com/paddyc1/FREEMOON-Faucet.git
cd FREEMOON-Faucet
npm install
```

## Tests

To compile and view test results, run:

```bash
npx hardhat compile
npx hardhat test
```

## Start Local Network

To run a local network used for testing, run:

```bash
npx hardhat node
```

## Scripts

> All of the following commands should be run with `--network` followed by the desired network, eg. "localhost"

To deploy all contracts, run:

```bash
npx hardhat run scripts/1_deploy_all.js
```

To update faucet contract parameters, run:

```bash
npx hardhat run scripts/2_update_params.js
```

To upgrade faucet logic contract, run:

```bash
npx hardhat run scripts/3_upgrade_faucet.js
```

To pause/unpause functions, run:

```bash
npx hardhat run scripts/4_pause.js
```

## FSN Faucet

To run FSN Faucet on Fusion Testnet, add FSN supplier hot wallet private key to .env file:

```
PRIVATE_KEY="0xaaaaa"
```

Make sure port 3001 is open.

Run:

```bash
npm start
```

Users can now request gas, once a day, for new wallets only. Users cannot make more than 1 request per day, from any IP address.

## Request Testnet Gas (2 gwei)

To make a request, in a terminal, run:

```bash
curl --location --request POST 'http://164.68.100.146:3001/api/v1/retrieve' \
--header 'Content-Type: application/json' \
--data-raw '{
    "walletAddress": "<ADDRESS>" }'
```

Where \<ADDRESS\> gets replace with the address to be funded.
