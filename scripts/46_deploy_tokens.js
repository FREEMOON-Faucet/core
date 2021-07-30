
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const utils = require("./99_utils")

require("dotenv").config()


let free, fmn


const ADMIN = process.env.ADMIN_PUBLIC
const GOV = process.env.GOV_PUBLIC

const FREE_NAME = "TEST"
const FREE_SYMBOL = "TEST"
const FREE_DECIMALS = 18

const FMN_NAME = "TEST"
const FMN_SYMBOL = "TEST"
const FMN_DECIMALS = 18



const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const deployTokens = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  console.log("Admin: ", admin)

  free = await FREE.at("0x0b411E45715ef246b81Fa21DABDA122ACca2B134")
  fmn = await FMN.at("0xeA029dCC2991eFA7C4d18E97b94000E5669f9A83")

  // try {
  //   logDeployed("Deploying FREE Token ...")

  //   free = await FREE.new(
  //     FREE_NAME,
  //     FREE_SYMBOL,
  //     FREE_DECIMALS,
  //     ADMIN,
  //     GOV,
  //     {from: admin}
  //   )
    
  //   logDeployed("FREE Token deployed:", free.address)
  // } catch(err) {
  //   throw new Error(`FREE Token deployment failed: ${err.message}`)
  // }

  // try {
  //   logDeployed("Deploying FMN Token ...")

  //   fmn = await FMN.new(
  //     FMN_NAME,
  //     FMN_SYMBOL,
  //     FMN_DECIMALS,
  //     ADMIN,
  //     GOV,
  //     {from: admin}
  //   )

  //   logDeployed("FMN Token deployed:", fmn.address)
  // } catch(err) {
  //   throw new Error(`FMN Token deployment failed: ${err.message}`)
  // }

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
