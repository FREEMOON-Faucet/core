
const FaucetProxy = artifacts.require("FaucetProxy")
const FaucetLayout = artifacts.require("Faucet")

const FAUCET_ADDRESS = require("../addresses").mainnet.faucet

let admin
let faucetLayout, faucetProxy
let newAddress

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const upgradeFaucet = async () => {
  [ admin ] = await web3.eth.getAccounts()
  faucetProxy = await FaucetProxy.at(FAUCET_ADDRESS, {from: admin})

  try {
    logDeployed("Deploying new faucet functional contract ...")

    faucetLayout = await FaucetLayout.new({from: admin})
    newAddress = faucetLayout.address

    logDeployed("New faucet functional contract deployed:", faucetLayout.address)
  } catch(err) {
    throw new Error(`Deployment of new faucet functional contract failed: ${err.message}`)
  }

  try {
    logDeployed("Upgrading faucet contract ...")

    await faucetProxy.upgradeFaucet(newAddress, {from: admin})

    logDeployed("Faucet contract upgraded successfully.")
  } catch(err) {
    throw new Error(`Deployment of new faucet contract failed: ${err.message}`)
  }

  const NEW_FAUCET_ADDRESS = await faucetProxy.currentFaucet()

  console.log(`
    New deployed address: ${newAddress},
    New address set in faucet: ${NEW_FAUCET_ADDRESS},
    - They should be the same.
  `)

//  faucet = await FaucetLayout.at(FAUCET_ADDRESS, {from: admin})

//  try {
//    logDeployed("Setting new storage variable in faucet contract ...")

//    let testVal = 1028

//    await faucet.setUint("testValue", testVal, {from: admin})

//    logDeployed("New storage variable set:", testVal)
//  } catch(err) {
//    throw new Error(`Failed to set new storage variable in faucet contract: ${err.message}`)
//  }

//  const testValSet = (await faucet.getUint("testValue")).toString()

//  console.log(`Test value returned from contract: ${testValSet}`)
}

try {
  upgradeFaucet().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
