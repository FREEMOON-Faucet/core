const FaucetABI = artifacts.require("Faucet")._json.abi


let admin
let faucet

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}


const setPause = async (pause, list) => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()

  faucet = new web3.eth.Contract(FaucetABI, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") // Current faucet proxy address in quotes
  
  try {
    await faucet.methods.setPause(pause, list).send({from: governance})

    pause ? logDeployed("Functions paused successfully:", list) : logDeployed("Functions unpaused successfully:", list)
  } catch(err) {
    logDeployed("Function pause state update unsuccessful:", err.message)
  }
}

setPause(
  true, // Set to true to pause, false to unpause

  // List of function names to pause/unpause
  [
    "subscribe",
    "swapTimelockForFree",
    "enter",
    "resolveEntry"
  ]
)