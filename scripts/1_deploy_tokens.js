
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC

const FREE_NAME = "The FREE Token"
const FREE_SYMBOL = "FREE"
const FREE_DECIMALS = 18

const FMN_NAME = "The FREEMOON Token"
const FMN_SYMBOL = "FMN"
const FMN_DECIMALS = 18

let admin
let free, fmn

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const deployTokens = async () => {
  [ admin ] = await web3.eth.getAccounts()

  console.log("Admin: ", admin)
  console.log("Governance: ", GOV)

  try {
    logDeployed("Deploying FREE Token ...")

    free = await FREE.new(
      FREE_NAME,
      FREE_SYMBOL,
      FREE_DECIMALS,
      admin,
      GOV,
      {from: admin}
    )
    
    logDeployed("FREE Token deployed:", free.address)
  } catch(err) {
    throw new Error(`FREE Token deployment failed: ${err.message}`)
  }

  try {
    logDeployed("Deploying FMN Token ...")

    fmn = await FMN.new(
      FMN_NAME,
      FMN_SYMBOL,
      FMN_DECIMALS,
      admin,
      GOV,
      {from: admin}
    )

    logDeployed("FMN Token deployed:", fmn.address)
  } catch(err) {
    throw new Error(`FMN Token deployment failed: ${err.message}`)
  }
}

try {
  deployTokens().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
