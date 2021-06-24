const FaucetABI = artifacts.require("Faucet")._json.abi

let faucet

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const setPause = async (pause, list) => {
  [ admin ] = await web3.eth.getAccounts()

  faucet = new web3.eth.Contract(FaucetABI, "")     // Current faucet proxy address in quotes

  await faucet.setPause(pause, list)

  logDeployed("Function pause state updated successfully.", list)
}

setPause(
  true,                                             // Set to true to pause, false to unpause
  [
    "subscribe",                                    // List of function names to pause/unpause
    "swapTimelockForFree",
    "enter",
    "resolveEntry"
  ]
)