
const AirdropProxy = artifacts.require("AirdropProxy")
const AirdropLayout = artifacts.require("Airdrop")

const addresses = require("../addresses")

const AIRDROP_ADDRESS = addresses.mainnet.airdrop

let admin
let airdropLayout, airdropProxy

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const upgradeAirdrop = async () => {
  [ admin ] = await web3.eth.getAccounts()
  airdropProxy = await AirdropProxy.at(AIRDROP_ADDRESS)

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

  // airdrop = await AirdropLayout.at(AIRDROP_ADDRESS, {from: admin})

  // try {
  //   logDeployed("Setting new storage variable in airdrop contract ...")

  //   let testVal = "0x1111111111111111111111111111111111111111"

  //   await airdrop.setAddress("testValue", testVal)

  //   logDeployed("New storage variable set:", testVal)
  // } catch(err) {
  //   throw new Error(`Failed to set new storage variable in airdrop contract: ${err.message}`)
  // }

  // const testValSet = (await airdrop.getAddress("testValue")).toString()

  // console.log(`Test value returned from contract: ${testValSet}`)
}

try {
  upgradeAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
