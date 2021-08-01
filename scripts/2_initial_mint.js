
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const utils = require("./99_utils")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC

const FREE_ADDRESS = "0x60364ad97beb8EC63d19B021677d02D9152b5E51"
const FMN_ADDRESS = "0x3EF3feC91F85926a25732A2bD8bE5f9A8BFC40e1"

let admin
let free, fmn

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
