
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const utils = require("./99_utils")
const addresses = require("../addresses")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC

const FREE_ADDRESS = addresses.testnet.free
const FMN_ADDRESS = addresses.testnet.fmn

let admin
let free, fmn

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const initialMint = async () => {
  [ admin ] = await web3.eth.getAccounts()

  console.log("Admin: ", admin)

  free = await FREE.at(FREE_ADDRESS)
  fmn = await FMN.at(FMN_ADDRESS)

  try {
    logDeployed("Minting initial supply of FREE ...")

    await free.initialMint(GOV, {from: admin})

    const freeBal = utils.fromWei(await free.balanceOf(GOV))

    logDeployed("FREE minted successfully:", freeBal)
  } catch(err) {
    throw new Error(`FREE initial mint failed: ${err.message}`)
  }

  try {
    logDeployed("Minting initial supply of FMN ...")

    await fmn.initialMint(GOV, {from: admin})

    const fmnBal = utils.fromWei(await fmn.balanceOf(GOV))

    logDeployed("FMN minted successfully:", fmnBal)
  } catch(err) {
    throw new Error(`FMN initial mint failed: ${err.message}`)
  }
}

try {
  initialMint().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
