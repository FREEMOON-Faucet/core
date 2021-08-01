const FaucetABI = artifacts.require("Faucet")._json.abi

const utils = require("./99_utils")


let governance
let faucet

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

// If you do not wish to change one or more of the settings, leave it blank here.
const config = {
  admin: "",  // The new admin address
  coordinator: "",  // The new coordinator address
  subscriptionCost: "2",  // The new subscription cost in FSN
  cooldownTime: "86400",  // The new cooldown time, ie. time subscriber must wait before entering again
  payoutThreshold: "",  // The new payout threshold, ie. the amount of times a subscriber must enter before being awarded FREE
  payoutAmount: ""  // The new payout amount, ie. the amount of FREE a subscriber is awarded upon reaching the payout threshold
}


const updateParams = async newVals => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()
  let { admin: a, coordinator: c, subscriptionCost: sc, cooldownTime: ct, payoutThreshold: pt, payoutAmount: pa } = newVals

  faucet = new web3.eth.Contract(FaucetABI, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")  // Current faucet proxy address in quotes

  if(!a) a = await faucet.methods.admin().call()
  if(!c) c = await faucet.methods.coordinator().call()
  if(!sc) sc = utils.fromWei(await faucet.methods.subscriptionCost().call())
  if(!ct) ct = await faucet.methods.cooldownTime().call()
  if(!pt) pt = await faucet.methods.payoutThreshold().call()
  if(!pa) pa = utils.fromWei(await faucet.methods.payoutAmount().call())

  try {
    await faucet.methods.updateParams(
      a,
      c,
      utils.toWei(sc),
      ct,
      pt,
      utils.toWei(pa)
    ).send({from: governance})

    logDeployed("Faucet parameters updated successfully:", [ a, c, sc, ct, pt, pa ])
  } catch(err) {
    logDeployed("Faucet parameter update unsuccessful:", err.message)
  }
}

updateParams(config)