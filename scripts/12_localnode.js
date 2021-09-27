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

  console.log(`ADMIN: ${ admin }`)
  console.log(`COORDINATOR: ${ coordinator }`)
  console.log(`GOVERNANCE: ${ governance }`)

  pool = await ChaingeDexPair.new()
  console.log(`POOL: ${ pool.address }`)

  any = await MockFRC20.new(
    "Anyswap",
    "ANY",
    utils.toWei("10000000"),
    { from: admin }
  )
  console.log(`ANY: ${ any.address }`)

  chng = await MockFRC758.new(
    "Chainge Finance",
    "CHNG",
    utils.toWei("10000000"),
    { from: admin }
  )
  console.log(`CHNG: ${ chng.address }`)

  free = await Free.new(
    "The FREE Token",
    "FREE",
    18,
    admin,
    governance,
    { from: admin }
  )
  console.log(`FREE: ${ free.address }`)

  fmn = await Fmn.new(
    "The FREEMOON Token",
    "FMN",
    18,
    admin,
    governance,
    { from: admin }
  )
  console.log(`FMN: ${ fmn.address }`)

  await fmn.initialMint(governance, { from: admin })

  faucetLayout = await Faucet.new({ from: admin })
  faucetProxy = await FaucetProxy.new(faucetLayout.address, { from: admin })
  faucet = await Faucet.at(faucetProxy.address, { from: admin })
  console.log(`Faucet: ${ faucet.address }`)

  airdropV2Layout = await AirdropV2.new({ from: admin })
  airdropProxyV2 = await AirdropProxyV2.new(airdropV2Layout.address, { from: admin })
  airdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })
  console.log(`AirdropV2: ${ airdropV2.address }`)

  await faucet.initialize(
    admin,
    governance,
    free.address,
    fmn.address,
    categories,
    odds,
    { from: admin }
  )

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

  await free.setMintInvokers(faucet.address, airdropV2.address, { from: admin })
  await fmn.setMintInvokers(faucet.address, { from: admin })

  await airdropV2.initialize(
    admin,
    governance,
    faucet.address,
    free.address,
    fmn.address,
    pool.address,
    { from: admin }
  )

  await airdropV2.setFarmingAssets([ any.address ], [ utils.toWei("0.0001") ], { from: admin })
  await airdropV2.setMintingAssets([ chng.address ], [ utils.toWei("0.0001") ], { from: admin })

  await airdropV2.setSymbols([ any.address, chng.address ], [ "ANY", "CHNG" ], { from: admin })

  const now = new BigNumber(Date.now())
  const nowSeconds = now.dividedBy("1000")
  const hourAndHalf = nowSeconds.plus("5400")
  const hour = nowSeconds.plus("3600")
  const halfHour = nowSeconds.plus("1800")

  await airdropV2.newTerm(hourAndHalf.toFixed(0), { from: governance })
  await airdropV2.newTerm(hour.toFixed(0), { from: governance })
  await airdropV2.newTerm(halfHour.toFixed(0), { from: governance })
}

try {
  deploy().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}