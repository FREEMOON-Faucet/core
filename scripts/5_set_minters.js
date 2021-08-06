
const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const addresses = require("../addresses")

const FREE_ADDRESS = addresses.testnet.free
const FMN_ADDRESS = addresses.testnet.fmn
const FAUCET_ADDRESS = addresses.testnet.faucet
const AIRDROP_ADDRESS = addresses.testnet.airdrop

let admin
let free, fmn

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const setMinters = async () => {
  [ admin] = await web3.eth.getAccounts()

  free = await Free.at(FREE_ADDRESS)
  fmn = await Fmn.at(FMN_ADDRESS)

  try {
    logDeployed("Setting mint invokers in FREE token contract ...")

    await free.setMintInvokers(FAUCET_ADDRESS, AIRDROP_ADDRESS, {from: admin})

    logDeployed("Mint invokers set in FREE contract successfully.")
  } catch(err) {
    throw new Error(`Failed to set mint invokers in FREE contract: ${err.message}`)
  }

  try {
    logDeployed("Setting mint invokers in FMN token contract ...")

    await fmn.setMintInvokers(FAUCET_ADDRESS, {from: admin})

    logDeployed("Mint invokers set in FMN contract successfully.")
  } catch(err) {
    throw new Error(`Failed to set mint invokers in FMN contract: ${err.message}`)
  }

  const _FREE_FAUCET = await free.faucet()
  const _AIRDROP = await free.airdrop()

  const _FMN_FAUCET = await fmn.faucet()

  console.log(`
    FREE:
    - Faucet: ${_FREE_FAUCET}
    - Airdrop: ${_AIRDROP}

    FMN:
    - Faucet: ${_FMN_FAUCET}
  `)
}

try {
  setMinters().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
