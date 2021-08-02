
const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const FREE_ADDRESS = "0x60364ad97beb8EC63d19B021677d02D9152b5E51"
const FMN_ADDRESS = "0x3EF3feC91F85926a25732A2bD8bE5f9A8BFC40e1"
const FAUCET_ADDRESS = "0x7aBf00a759f5F377f0cF885D168803E9D326f387"
const AIRDROP_ADDRESS = "0xeE59ee5f266855426E3a519c555dc9cB00aC67b0"

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
}

try {
  setMinters().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
