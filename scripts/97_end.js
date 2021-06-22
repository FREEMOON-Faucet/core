
const freeABI = require("../artifacts/contracts/tokens/FREE.sol").abi
const freemoonABI = require("../artifacts/contracts/tokens/FREEMOON.sol").abi
const faucetABI = require("../artifacts/contracts/FSNContract.sol").abi

const destroyAll = async () => {

  const [ coordinator ] = await web3.eth.getAccounts()

  const free = new web3.eth.Contract("", freeABI)
  const freemoon = new web3.eth.Contract("", freemoonABI)
  const faucet = new web3.eth.Contract("", faucetABI)

  await free.destroyContract({from: coordinator})
  await freemoon.destroyContract({from: coordinator})
  await faucet.destroyContract({from: coordinator})
}

destroyAll()