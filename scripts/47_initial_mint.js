
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const utils = require("./99_utils")

require("dotenv").config()


let free, fmn



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

    await free.initialMint(admin, {from: admin})

    const freeBal = utils.fromWei(await free.balanceOf(admin))

    logDeployed("FREE minted successfully:", freeBal)
  } catch(err) {
    throw new Error(`FREE initial mint failed: ${err.message}`)
  }

  try {
    logDeployed("Minting initial supply of FMN ...")

    await fmn.initialMint(admin, {from: admin})

    const fmnBal = utils.fromWei(await fmn.balanceOf(admin))

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
