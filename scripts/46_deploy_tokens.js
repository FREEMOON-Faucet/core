
const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

require("dotenv").config()


let free, fmn


const ADMIN = process.env.ADMIN_PUBLIC
const GOV = process.env.GOV_PUBLIC

const FREE_NAME = "FREE Token"
const FREE_SYMBOL = "FREE"
const FREE_DECIMALS = 18

const FMN_NAME = "FREEMOON Token"
const FMN_SYMBOL = "FMN"
const FMN_DECIMALS = 18



const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const deployTokens = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  try {
    free = await FREE.new(
      FREE_NAME,
      FREE_SYMBOL,
      FREE_DECIMALS,
      ADMIN,
      GOV,
      {from: admin}
    )
    
    logDeployed("FREE Token deployed:", free.address)
  } catch(err) {
    throw new Error(`FREE Token deployment failed: ${err.message}`)
  }

  try {
    fmn = await FMN.new(
      FMN_NAME,
      FMN_SYMBOL,
      FMN_DECIMALS,
      ADMIN,
      GOV,
      {from: admin}
    )

    logDeployed("FMN Token deployed:", fmn.address)
  } catch(err) {
    throw new Error(`FMN Token deployment failed: ${err.message}`)
  }
}


try {
  deployTokens()
} catch(err) {
  console.log(err.message)
}