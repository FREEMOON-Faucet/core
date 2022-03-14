
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")
const AirdropV2Layout = artifacts.require("AirdropV2")

const addresses = require("../addresses")

const AIRDROP_ADDRESS = addresses.mainnet.airdropV2

let admin
let airdropV2Layout, airdropProxyV2
let newAddress

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const upgradeAirdrop = async () => {
  [ admin ] = await web3.eth.getAccounts()
  airdropProxyV2 = await AirdropProxyV2.at(AIRDROP_ADDRESS)

  try {
    logDeployed("Deploying new airdrop functional contract ...")

    airdropV2Layout = await AirdropV2Layout.new({from: admin})
    newAddress = airdropV2Layout.address

    logDeployed("New airdrop functional contract deployed:", newAddress)
  } catch(err) {
    throw new Error(`Deployment of new airdrop functional contract failed: ${err.message}`)
  }

  try {
    logDeployed("Upgrading airdrop contract ...")

    await airdropProxyV2.upgradeAirdrop(newAddress, {from: admin})

    logDeployed("Airdrop contract upgraded successfully.")
  } catch(err) {
    throw new Error(`Deployment of new airdrop contract failed: ${err.message}`)
  }

  const NEW_AIRDROP_ADDRESS = await airdropProxyV2.currentAirdrop()

  console.log(`
    New deployed address: ${newAddress},
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
