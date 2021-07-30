
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

require("dotenv").config()

const utils = require("./99_utils")


let free, fmn


const GOV = process.env.GOV_PUBLIC


const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const deployTokens = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  console.log("Admin: ", admin)

  free = await FREE.at("")
  fmn = await FMN.at("")

  try {
    logDeployed("Minting initial supply of FREE ...")

    await free.initialMint(GOV, {from: admin, gas: 8000000, gasPrice: 4000000000})

    const freeBal = utils.fromWei(await free.balanceOf(GOV))

    logDeployed("FREE minted successfully:", freeBal)
  } catch(err) {
    throw new Error(`FREE initial mint failed: ${err.message}`)
  }

  try {
    logDeployed("Minting initial supply of FMN ...")

    await fmn.initialMint(GOV, {from: admin, gas: 8000000, gasPrice: 4000000000})

    const fmnBal = utils.fromWei(await fmn.balanceOf(GOV))

    logDeployed("FMN minted successfully:", fmnBal)
  } catch(err) {
    throw new Error(`FMN initial mint failed: ${err.message}`)
  }
}


try {
  deployTokens().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
