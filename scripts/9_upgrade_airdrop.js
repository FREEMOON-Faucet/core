
const AirdropProxy = artifacts.require("AirdropProxy")
const AirdropLayout = artifacts.require("NewAirdropLayout")

const AIRDROP_ADDRESS = "0xeE59ee5f266855426E3a519c555dc9cB00aC67b0"

let airdropLayout, airdropProxy

const upgradeAirdrop = async () => {
  airdropProxy = await AirdropProxy.at(AIRDROP_ADDRESS, {from: admin})

  try {
    logDeployed("Deploying new airdrop functional contract ...")

    airdropLayout = await AirdropLayout.new({from: admin})

    logDeployed("New airdrop functional contract deployed:", airdropLayout.address)
  } catch(err) {
    throw new Error(`Deployment of new airdrop functional contract failed: ${err.message}`)
  }

  try {
    logDeployed("Upgrading airdrop contract ...")

    await airdropProxy.upgradeAirdrop(airdropLayout.address, {from: admin})

    logDeployed("Airdrop contract upgraded successfully.")
  } catch(err) {
    throw new Error(`Deployment of new airdrop contract failed: ${err.message}`)
  }

  const NEW_AIRDROP_ADDRESS = await airdropProxy.currentAirdrop()

  console.log(`
    New deployed address: ${airdropLayout.address},
    New address set in airdrop: ${NEW_AIRDROP_ADDRESS},
    - They should be the same.
  `)
}

try {
  upgradeAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
