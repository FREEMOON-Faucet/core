const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const MockUpgradeable = artifacts.require("MockUpgradeable")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const MockAirdrop = artifacts.require("MockAirdrop")

const Free = artifacts.require("FREE")
const Freemoon = artifacts.require("FMN")

const utils = require("../scripts/99_utils")


let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdrop
let mockFaucetLayout, mockFaucet
let free, freemoon
let categories, odds

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

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})

  airdrop = await MockAirdrop.new()
  
  await faucet.initialize(
    admin,
    coordinator,
    governance,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    categories,
    odds
  )

  free = await Free.new(
    "Free Token",
    "FREE",
    18,
    governance,
    airdrop.address,
    faucet.address,
    {from: admin}
  )

  freemoon = await Freemoon.new(
    "Freemoon Token",
    "FMN",
    18,
    governance,
    faucet.address,
    {from: admin}
  )
}

const setAssets = async () => {
  await faucet.setAssets(free.address, freemoon.address, {from: admin})
}


contract("Freemoon Faucet Upgradeability Tests", async () => {

  it("Should allow deployment of the incorrect contract", async () => {
    [ coordinator, governance, admin, user ] = await web3.eth.getAccounts()
    const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds } = config()

    mockFaucetLayout = await MockUpgradeable.new({from: admin})
    faucetProxy = await FaucetProxy.new(mockFaucetLayout.address, {from: admin})
    mockFaucet = await MockUpgradeable.at(faucetProxy.address, {from: admin})

    airdrop = await MockAirdrop.new()

    await mockFaucet.initialize(
      admin,
      coordinator,
      governance,
      subscriptionCost,
      cooldownTime,
      payoutThreshold,
      payoutAmount,
      hotWalletLimit,
      categories,
      odds
    )

    free = await Free.new(
      "Free Token",
      "FREE",
      18,
      governance,
      airdrop.address,
      mockFaucet.address,
      {from: admin}
    )
  
    freemoon = await Freemoon.new(
      "Freemoon Token",
      "FMN",
      18,
      governance,
      mockFaucet.address,
      {from: admin}
    )
  })

  it("Should upgrade incorrect faucet contract to correct faucet contract", async () => {
    const incorrect = await faucetProxy.currentFaucet()

    faucetLayout = await Faucet.new({from: admin})
    await truffleAssert.passes(faucetProxy.upgradeFaucet(faucetLayout.address, {from: admin}))
    faucet = await Faucet.at(faucetProxy.address, {from: admin})
    await free.updateAuth(faucet.address, airdrop.address, {from: governance})
    await freemoon.updateAuth(faucet.address, {from: governance})

    const correct = await faucetProxy.currentFaucet()

    expect(correct).to.not.equal(incorrect)
  })

  it("Should not allow non-admin to upgrade faucet contract", async () => {
    await setUp()
    const currentBefore = await faucetProxy.currentFaucet()

    mockFaucetLayout = await MockUpgradeable.new({from: admin})
    await truffleAssert.fails(
      faucetProxy.upgradeFaucet(mockFaucetLayout.address, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Invalid address attempting upgrade."
    )

    const currentAfter = await faucetProxy.currentFaucet()
    
    expect(currentAfter).to.equal(currentBefore)
  })

  it("Should allow admin to pause 1 function", async () => {
    await setUp()
    await setAssets()

    await truffleAssert.passes(faucet.setPause(true, [ "subscribe" ], {from: admin}))
  })

  it("Should allow admin to pause all functions", async () => {
    await setUp()
    await setAssets()

    await truffleAssert.passes(faucet.setPause(true, [ "subscribe", "swapTimelockForFree", "claim", "resolveEntry" ], {from: admin}))
  })

  it("Should allow admin to unpause 1 function", async () => {
    await setUp()
    await setAssets()
    await faucet.setPause(true, [ "subscribe" ], {from: admin})

    await truffleAssert.passes(faucet.setPause(false, [ "subscribe" ], {from: admin}))    
  })

  it("Should allow admin to unpause all functions", async () => {
    await setUp()
    await setAssets()
    await faucet.setPause(true, [ "subscribe", "swapTimelockForFree", "claim", "resolveEntry" ], {from: admin})

    await truffleAssert.passes(faucet.setPause(false, [ "subscribe", "swapTimelockForFree", "claim", "resolveEntry" ], {from: admin}))
  })

  it("Should not allow non-admin to pause functions", async () => {
    await setUp()
    await setAssets()
    
    await truffleAssert.fails(
      faucet.setPause(true, [ "subscribe", "swapTimelockForFree", "claim", "resolveEntry" ], {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should not allow non-admin to unpause functions", async () => {
    await setUp()
    await setAssets()
    await faucet.setPause(true, [ "subscribe", "swapTimelockForFree", "claim", "resolveEntry" ], {from: admin})
    
    await truffleAssert.fails(
      faucet.setPause(false, [ "subscribe", "swapTimelockForFree", "claim", "resolveEntry" ], {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should prevent paused functions being called", async () => {
    await setUp()
    await setAssets()
    await faucet.setPause(true, [ "claim" ], {from: admin})
    await truffleAssert.passes(faucet.subscribe(user, {from: user, value: utils.toWei("1")}))

    await truffleAssert.fails(
      faucet.claim(user, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: This function is currently paused."
    )
  })
})
