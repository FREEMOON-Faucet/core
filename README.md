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


