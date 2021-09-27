
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const utils = require("./99_utils")
const addresses = require("../addresses")

require("dotenv").config()

// const GOV = process.env.GOV_PUBLIC

const FREE_ADDRESS = addresses.localnode.free
const FMN_ADDRESS = addresses.localnode.fmn

let admin, coordinator, governance
let free, fmn

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const initialMint = async () => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()

  console.log("Admin: ", admin)

  free = await FREE.at(FREE_ADDRESS)
  fmn = await FMN.at(FMN_ADDRESS)

  try {
    logDeployed("Minting initial supply of FREE ...")

    await free.initialMint(governance, {from: admin})

    const freeBal = utils.fromWei(await free.balanceOf(governance))

    logDeployed("FREE minted successfully:", freeBal)
  } catch(err) {
    throw new Error(`FREE initial mint failed: ${err.message}`)
  }

  try {
    logDeployed("Minting initial supply of FMN ...")

    await fmn.initialMint(governance, {from: admin})

    const fmnBal = utils.fromWei(await fmn.balanceOf(governance))

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
