const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")
const addresses = require("../addresses")
const network = addresses.testnet

const dotenv = require("dotenv")
dotenv.config()

let admin
let airdropV2Layout, airdropProxyV2, airdropV2

const GOV = process.env.GOV
const FAUCET = network.faucet
const FREE = network.free
const FMN = network.fmn
const POOL = network.pool


const deploy = async () => {
  [ admin ] = await web3.eth.getAccounts()
  
  try {
    console.log("Deploying layout ...")
    airdropV2Layout = await AirdropV2.new()
    console.log(`Deployed layout at ${ airdropV2Layout.address }`)
  } catch(err) {
    console.log(`Could not deploy layout: ${ err.message }`)
  }

  try {
    console.log("Deploying proxy ...")
    airdropProxyV2 = await AirdropProxyV2.new(airdropV2Layout.address)
    console.log(`Deployed proxy at ${ airdropProxyV2.address }`)
  } catch(err) {
    console.log(`Could not deploy proxy: ${ err.message }`)
  }

  try {
    console.log("Initializing ...")
    airdropV2 = await AirdropV2.at(airdropProxyV2.address)
    await airdropV2.initialize(admin, GOV, FAUCET, FREE, FMN, POOL)
    console.log(`Successfully initialized.`)
  } catch(err) {
    console.log(`Could not initialize: ${ err.message }`)
  }

  const adminSet = await airdropV2.admin()
  const govSet = await airdropV2.governance()
  const faucetSet = await airdropV2.faucet()
  const freeSet = await airdropV2.free()
  const fmnSet = await airdropV2.fmn()
  const poolSet = await airdropV2.pool()
  console.log(`
    Initialization:
      admin: ${ adminSet }
      gov: ${ govSet }
      faucet: ${ faucetSet }
      free: ${ freeSet }
      fmn: ${ fmnSet }
      pool: ${ poolSet }
  `)

  // Pause unlock feature until further developments
  try {
    console.log("Pausing unlock ...")
    airdropV2 = await AirdropV2.at(airdropProxyV2.address)
    await airdropV2.setPause(true, [ "unlock" ])
    console.log(`Successfully paused unlock.`)
  } catch(err) {
    console.log(`Could not pause unlock: ${ err.message }`)
  }
}

try {
  deploy().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}