
const Faucet = artifacts.require("Faucet")

const addresses = require("../addresses")

const FAUCET_ADDRESS = addresses.mainnet.faucet

let faucet

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const newPauseStatus = true // TRUE => PAUSE, FALSE => UNPAUSE SPECIFIED FUNCTIONS

const functionNames = [ // FUNCTIONS TO PAUSE/UNPAUSE
  "subscribe",
  "claim"
]

const pauseFaucet = async () => {
  [ admin ] = await web3.eth.getAccounts()

  faucet = await Faucet.at(FAUCET_ADDRESS)

  try {
    logDeployed("Updating faucet pause status ...")

    await faucet.setPause(newPauseStatus, functionNames, {from: admin})

    logDeployed("Faucet pause status updated successfully.")
  } catch(err) {
    throw new Error(`Faucet pause status update failed: ${err.message}`)
  }
}

try {
  pauseFaucet().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
