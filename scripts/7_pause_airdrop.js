
const Airdrop = artifacts.require("Airdrop")

const AIRDROP_ADDRESS = ""

let airdrop

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const newPauseStatus = true // TRUE => PAUSE, FALSE => UNPAUSE SPECIFIED FUNCTIONS

const functionNames = [ // FUNCTIONS TO PAUSE/UNPAUSE
  "claimAirdrop"
]

const pauseAirdrop = async () => {
  [ admin ] = await web3.eth.getAccounts()

  airdrop = await Airdrop.at(AIRDROP_ADDRESS)

  try {
    logDeployed("Updating airdrop pause status ...")

    await airdrop.setPause(newPauseStatus, functionNames, {from: admin})

    logDeployed("Airdrop pause status updated successfully.")
  } catch(err) {
    throw new Error(`Airdrop pause status update failed: ${err.message}`)
  }
}

try {
  pauseAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
