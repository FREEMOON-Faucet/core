const FaucetABI = artifacts.require("Faucet")._json.abi
const NEW_LOGIC_CONTRACT = artifacts.require("")    // New logic contract name in quotes

let faucet, faucetLayout, faucetProxy
let newLogicContract

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const upgrade = async () => {
  [ admin ] = await web3.eth.getAccounts()

  faucet = new web3.eth.Contract(FaucetABI, "")     // Current faucet proxy address in quotes

  faucetLayout = await NEW_LOGIC_CONTRACT.new({from: admin})
  await faucet.methods.upgradeFaucet(faucetLayout.address, {from: admin})
  newLogicContract = await NEW_LOGIC_CONTRACT.at(faucet.address, {from: admin})

  logDeployed("Faucet logic contract update successfully at:", newLogicContract.address)
}

upgrade()