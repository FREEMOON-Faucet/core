const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")

const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const ChaingeDexPair = artifacts.require("ChaingeDexPair")

const MockAsset = artifacts.require("MockAsset")

const utils = require("../scripts/99_utils")

let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdropV2Layout, airdropProxyV2, airdropV2, mockAirdropV2Layout
let free, fmn, pool, mockAsset
let categories, odds

const allFunctions = [
  "stake",
  "unstake",
  "harvest",
  "lock",
  "unlock"
]

const config = () => {
  categories = [
    "1",
    "100",
    "1000",
    "10000",
    "25000",
    "50000",
    "100000",
    "100000"
  ]

  odds = [
    "0",
    "1000000000",
    "100000000",
    "10000000",
    "1000000",
    "500000",
    "250000",
    "100000"
  ]

  return {
    subscriptionCost: utils.toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: utils.toWei("1"), // 1 FREE
    hotWalletLimit: utils.toWei("10"), // 10 FSN max wallet balance
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const setUp = async () => {
  [ admin, coordinator, governance, user ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds } = config()

  pool = await ChaingeDexPair.new()

  free = await Free.new(
    "The FREE Token",
    "FREE",
    18,
    admin,
    governance,
    { from: admin }
  )

  fmn = await Fmn.new(
    "The FREEMOON Token",
    "FMN",
    18,
    admin,
    governance,
    { from: admin }
  )

  mockAsset = await MockAsset.new(
    "Mock Asset",
    "EXP",
    utils.toWei("1000"),
    { from: admin }
  )

  faucetLayout = await Faucet.new({ from: admin })
  faucetProxy = await FaucetProxy.new(faucetLayout.address, { from: admin })
  faucet = await Faucet.at(faucetProxy.address, { from: admin })

  airdropV2Layout = await AirdropV2.new({ from: admin })
  airdropProxyV2 = await AirdropProxyV2.new(airdropV2Layout.address, { from: admin })
  airdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })
  
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

  await airdropV2.initialize(
    admin,
    governance,
    faucet.address,
    free.address,
    fmn.address,
    pool.address,
    { from: admin }
  )

  await free.setMintInvokers(faucet.address, airdropV2.address, { from: admin })
  await fmn.setMintInvokers(faucet.address, { from: admin })
}


contract("AirdropV2 Upgradeability Tests", async () => {
  it("Should allow deployment of the incorrect contract", async () => {
    [ admin, coordinator, governance, user ] = await web3.eth.getAccounts()
    faucetLayout = await Faucet.new({ from: admin })
    faucetProxy = await FaucetProxy.new(faucetLayout.address, { from: admin })
    faucet = await Faucet.at(faucetProxy.address, { from: admin })
    mockAirdropV2Layout = await AirdropV2.new({ from: admin })
    airdropProxyV2 = await AirdropProxyV2.new(mockAirdropV2Layout.address, { from: admin })
    mockAirdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })
  })

  it("Should upgrade incorrect airdrop contract to correct airdrop contract", async () => {
    await setUp()
    const incorrect = await airdropProxyV2.currentAirdrop()
    airdropV2Layout = await AirdropV2.new({ from: admin })
    await truffleAssert.passes(airdropProxyV2.upgradeAirdrop(airdropV2Layout.address, { from: admin }))
    airdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })
    await free.setMintInvokers(faucet.address, airdropV2.address, { from: governance })
    const correct = await airdropProxyV2.currentAirdrop()
    expect(correct).to.not.equal(incorrect)
    expect(correct).to.equal(airdropV2Layout.address)
  })

  it("Should not allow non-admin to upgrade airdrop contract", async () => {
    await setUp()
    const currentBefore = await airdropProxyV2.currentAirdrop()
    mockAirdropV2Layout = await AirdropV2.new({ from: admin })
    await truffleAssert.fails(
      airdropProxyV2.upgradeAirdrop(mockAirdropV2Layout.address, { from: user }),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Invalid address attempting upgrade."
    )
    const currentAfter = await airdropProxyV2.currentAirdrop()
    expect(currentAfter).to.equal(currentBefore)
  })

  it("Should allow admin to pause all functions", async () => {
    await setUp()
    await truffleAssert.passes(airdropV2.setPause(true, allFunctions, { from: admin }))
  })

  it("Should allow admin to unpause all functions", async () => {
    await setUp()
    await faucet.setPause(true, allFunctions, { from: admin })
    await truffleAssert.passes(faucet.setPause(false, allFunctions, { from: admin }))
  })

  it("Should not allow non-admin to pause functions", async () => {
    await setUp()
    await truffleAssert.fails(
      faucet.setPause(true, [ "stake" ], { from: user }),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should not allow non-admin to unpause functions", async () => {
    await setUp()
    await faucet.setPause(true, [ "stake" ], { from: admin })
    await truffleAssert.fails(
      faucet.setPause(false, [ "stake" ], { from: user }),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should prevent paused functions being called", async () => {
    await setUp()
    await airdropV2.setPause(true, [ "stake" ], { from: admin })
    await faucet.subscribe(user, { from: user, value: utils.toWei("1") })
    await truffleAssert.fails(
      airdropV2.stake(mockAsset.address, utils.toWei("10"), { from: user }),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: This function is currently paused."
    )
  })
})
