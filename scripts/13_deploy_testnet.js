const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")
const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")
const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")
const MockFRC20 = artifacts.require("MockFRC20")
const MockFRC758 = artifacts.require("MockFRC758")
const ChaingeDexPair = artifacts.require("ChaingeDexPair")

const utils = require("./99_utils")
const BigNumber = require("bignumber.js")

let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdropV2Layout, airdropProxyV2, airdropV2
let free, fmn, pool
let any, chng

const categoriesBal = [
  "1",
  "100",
  "1000",
  "10000",
  "25000",
  "50000",
  "100000",
  "100000"
]

const odds = [
  "0",
  "1000000000",
  "100000000",
  "10000000",
  "1000000",
  "500000",
  "250000",
  "100000"
]

const subscriptionCost = utils.toWei("1")
const cooldownTime = "3600"
const payoutThreshold = "1"
const payoutAmount = utils.toWei("1")
const hotWalletLimit = utils.toWei("50")
const categories = categoriesBal.map(cat => utils.toWei(cat))


const deploy = async () => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()

  console.log(`ADMIN: ${ admin.toLowerCase() }`)
  console.log(`coordinatorINATOR: ${ coordinator.toLowerCase() }`)
  console.log(`governanceERNANCE: ${ governance.toLowerCase() }`)

  // const airdropV2 = await AirdropV2.at("0x947a798F07C94ee0011000a8A39742B2B13FfD70")
  // console.log(`AirdropV2 address: ${ airdropV2.address }`)

  try {
    console.log(`###### Pool ######`)
    pool = await ChaingeDexPair.new()
    console.log(`POOL: ${ pool.address }`)
  } catch(err) {
    console.log(`POOL Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Any ######`)
    any = await MockFRC20.new(
      "Anyswap",
      "ANY",
      utils.toWei("10000000"),
      { from: admin }
    )
    console.log(`ANY: ${ any.address }`)
  } catch(err) {
    console.log(`ANY Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Chng ######`)
    chng = await MockFRC758.new(
      "Chainge Finance",
      "CHNG",
      utils.toWei("10000000"),
      { from: admin }
    )
    console.log(`CHNG: ${ chng.address }`)
  } catch(err) {
    console.log(`CHNG Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Free ######`)
    free = await Free.new(
      "The FREE Token",
      "FREE",
      18,
      admin,
      governance,
      { from: admin }
    )
    console.log(`FREE: ${ free.address }`)
  } catch(err) {
    console.log(`FREE Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Fmn ######`)
    fmn = await Fmn.new(
      "The FREEMOON Token",
      "FMN",
      18,
      admin,
      governance,
      { from: admin }
    )
    console.log(`FMN: ${ fmn.address }`)
  } catch(err) {
    console.log(`FMN Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Initial Mint ######`)
    await fmn.initialMint(governance, { from: admin })
    console.log(`INITIAL MINT Success.`)
  } catch(err) {
    console.log(`INITIAL MINT Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Faucet ######`)
    faucetLayout = await Faucet.new({ from: admin })
    faucetProxy = await FaucetProxy.new(faucetLayout.address, { from: admin })
    faucet = await Faucet.at(faucetProxy.address, { from: admin })
    console.log(`FAUCET: ${ faucet.address }`)
  } catch(err) {
    console.log(`FAUCET Failed: ${ err.message }`)
  }

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
    console.log(`###### Initialize Faucet ######`)
    await faucet.initialize(
      admin,
      governance,
      free.address,
      fmn.address,
      categories,
      odds,
      { from: admin }
    )
    console.log(`INITIALIZE FAUCET Success.`)
  } catch(err) {
    console.log(`INITIALIZE FAUCET Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Update Params ######`)
    await faucet.updateParams(
      admin,
      coordinator,
      subscriptionCost,
      cooldownTime,
      payoutThreshold,
      payoutAmount,
      hotWalletLimit,
      { from: admin }
    )
    console.log(`UPDATE PARAMS Success.`)
  } catch(err) {
    console.log(`UPDATE PARAMS Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Set Mint Invokers ######`)
    await free.setMintInvokers(faucet.address, airdropV2.address, { from: admin })
    await fmn.setMintInvokers(faucet.address, { from: admin })
    console.log(`SET MINT INVOKERS Success.`)
  } catch(err) {
    console.log(`SET MINT INVOKERS Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Initialize Airdrop ######`)
    await airdropV2.initialize(
      admin,
      governance,
      faucet.address,
      free.address,
      fmn.address,
      pool.address,
      { from: admin }
    )
    console.log(`INITIALIZE AIRDROP Success.`)
  } catch(err) {
    console.log(`INTIIALIZE AIRDROP Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Set Assets ######`)
    await airdropV2.setFarmingAssets([ any.address ], [ utils.toWei("0.0001") ], { from: admin })
    await airdropV2.setMintingAssets([ chng.address ], [ utils.toWei("0.0001") ], { from: admin })
    console.log(`SET ASSETS Success.`)
  } catch(err) {
    console.log(`SET ASSETS Failed: ${ err.message }`)
  }

  try {
    console.log(`###### Set Symbols ######`)
    await airdropV2.setSymbols([ any.address, chng.address ], [ "ANY", "CHNG" ], { from: admin })
    console.log(`SET SYMBOLS Success.`)
  } catch(err) {
    console.log(`SET SYMBOLS Failed: ${ err.message }`)
  }

  const now = new BigNumber(Date.now())
  const nowSeconds = now.dividedBy("1000")
  const oneWeek = nowSeconds.plus("604800")
  const twoWeeks = oneWeek.plus("604800")
  const threeWeeks = twoWeeks.plus("604800")

  try {
    console.log(`###### New Term ######`)
    await airdropV2.newTerm(oneWeek.toFixed(0), { from: governance })
    await airdropV2.newTerm(twoWeeks.toFixed(0), { from: governance })
    await airdropV2.newTerm(threeWeeks.toFixed(0), { from: governance })
    console.log(`NEW TERM Success.`)
  } catch(err) {
    console.log(`NEW TERM Failed: ${ err.message }`)
  }
}

try {
  deploy().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
