
const FaucetProxy = artifacts.require("FaucetProxy")
const FaucetLayout = artifacts.require("NewFaucetLayout")

const FAUCET_ADDRESS = "0x7aBf00a759f5F377f0cF885D168803E9D326f387"

let faucetLayout, faucetProxy

const upgradeFaucet = async () => {
  faucetProxy = await FaucetProxy.at(FAUCET_ADDRESS, {from: admin})

  try {
    logDeployed("Deploying new faucet functional contract ...")

    faucetLayout = await FaucetLayout.new({from: admin})

    logDeployed("New faucet functional contract deployed:", faucetLayout.address)
  } catch(err) {
    throw new Error(`Deployment of new faucet functional contract failed: ${err.message}`)
  }

  try {
    logDeployed("Upgrading faucet contract ...")

    await faucetProxy.upgradeFaucet(faucetLayout.address, {from: admin})

    logDeployed("Faucet contract upgraded successfully.")
  } catch(err) {
    throw new Error(`Deployment of new faucet contract failed: ${err.message}`)
  }

  const NEW_FAUCET_ADDRESS = await faucetProxy.currentFaucet()

  console.log(`
    New deployed address: ${faucetLayout.address},
    New address set in faucet: ${NEW_FAUCET_ADDRESS},
    - They should be the same.
  `)
}

try {
  upgradeFaucet().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
