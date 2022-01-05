
const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")

const utils = require("./99_utils")
const BigNumber = require("bignumber.js")
const dotenv = require("dotenv")
const addresses = require("../addresses")

const { farmingConfig, mintingConfig } = require("../rewardAssets")

dotenv.config()

const COORD = process.env.COORD
const GOV = process.env.GOV
const FAUCET = addresses.mainnet.faucet
const FREE = addresses.mainnet.free
const FMN = addresses.mainnet.fmn
const POOL = addresses.mainnet.pool

let admin
let airdropV2Layout, airdropProxyV2, airdropV2
let farmAddresses = [], farmAmounts = [], farmSymbols = []
let mintAddresses = [], mintAmounts = [], mintSymbols = []


farmingConfig.forEach(farm => {
  farmAddresses.push(farm.address)
  farmAmounts.push("1")
  farmSymbols.push(farm.symbol)
})

mintingConfig.forEach(mint => {
  mintAddresses.push(mint.address)
  mintAmounts.push("1")
  mintSymbols.push(mint.symbol)
})


const deploy = async () => {
  [ admin ] = await web3.eth.getAccounts()

  console.log(`admin: ${ admin.toLowerCase() }`)
  console.log(`coordinator: ${ COORD.toLowerCase() }`)
  console.log(`governance: ${ GOV.toLowerCase() }`)

  try {
    console.log(`###### Airdrop V2 ######`)
    airdropV2Layout = await AirdropV2.new({ from: admin })
    airdropProxyV2 = await AirdropProxyV2.new(airdropV2Layout.address, { from: admin })
    airdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })
    console.log(`AIRDROPV2: ${ airdropV2.address }`)
  } catch(err) {
    console.log(`AIRDROPV2 Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Initialize Airdrop ######`)
    await airdropV2.initialize(
      admin,
      GOV,
      FAUCET,
      FREE,
      FMN,
      POOL,
      { from: admin }
    )
    console.log(`INITIALIZE AIRDROP Success.`)
  } catch(err) {
    console.log(`INTIIALIZE AIRDROP Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Set Assets ######`)
    await airdropV2.setFarmingAssets(farmAddresses, farmAmounts, { from: admin })
    await airdropV2.setMintingAssets(mintAddresses, mintAmounts, { from: admin })
    console.log(`SET ASSETS Success.`)
  } catch(err) {
    console.log(`SET ASSETS Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Set Symbols ######`)
    await airdropV2.setSymbols(farmAddresses.concat(mintAddresses), farmSymbols.concat(mintSymbols), { from: admin })
    console.log(`SET SYMBOLS Success.`)
  } catch(err) {
    console.log(`SET SYMBOLS Failed: ${ err.message }`)
  }

  try {
    let adminSet = await airdropV2.admin()
    let govSet = await airdropV2.governance()
    let faucetSet = await airdropV2.faucet()
    let freeSet = await airdropV2.free()
    let fmnSet = await airdropV2.fmn()
    let poolSet = await airdropV2.pool()
    console.log(`
      Admin: ${ adminSet }
      Gov: ${ govSet }
      Faucet: ${ faucetSet }
      Free: ${ freeSet }
      Fmn: ${ fmnSet }
      Pool: ${ poolSet }
    `)
  } catch(err) {
    console.log(`Could not get values: ${ err.message }`)
  }

  try {
    console.log(`Pausing unlock ...`)
    await airdropV2.setPause(true, [ "unlock" ], { from: admin })
    console.log(`Paused.`)
  } catch(err) {
    console.log(`Could not pause: ${ err.message }`)
  }

  // const now = new BigNumber(Date.now())
  // const nowSeconds = now.dividedBy("1000")
  // const oneWeek = nowSeconds.plus("604800")
  // const twoWeeks = oneWeek.plus("604800")
  // const threeWeeks = twoWeeks.plus("604800")

  // try {
  //   console.log(`###### New Term ######`)
  //   await airdropV2.newTerm(oneWeek.toFixed(0), { from: GOV })
  //   await airdropV2.newTerm(twoWeeks.toFixed(0), { from: GOV })
  //   await airdropV2.newTerm(threeWeeks.toFixed(0), { from: GOV })
  //   console.log(`NEW TERM Success.`)
  // } catch(err) {
  //   console.log(`NEW TERM Failed: ${ err.message }`)
  // }
}

try {
  deploy().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}