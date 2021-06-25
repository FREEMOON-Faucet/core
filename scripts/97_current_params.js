const FaucetABI = artifacts.require("Faucet")._json.abi

const utils = require("./99_utils")


let faucet

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}


const readCurrentState = async () => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()
  faucet = new web3.eth.Contract(FaucetABI, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
  
  const adminSet = await faucet.methods.admin().call()
  const coordinatorSet = await faucet.methods.coordinator().call()
  const subscriptionCost = utils.fromWei(await faucet.methods.subscriptionCost().call())
  const cooldownTime = await faucet.methods.cooldownTime().call()
  const payoutThreshold = await faucet.methods.payoutThreshold().call()
  const payoutAmount = utils.fromWei(await faucet.methods.payoutAmount().call())

  logDeployed("Subscription Cost:", subscriptionCost)
  logDeployed("Cooldown Time:", cooldownTime)
  logDeployed("Payout Threshold:", payoutThreshold)
  logDeployed("Payout Amount:", payoutAmount)

  logDeployed("Admin:", adminSet)
  logDeployed("Coordinator:", coordinatorSet)
}

readCurrentState()