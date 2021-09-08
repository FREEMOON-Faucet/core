const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Airdrop = artifacts.require("Airdrop")
const AirdropProxy = artifacts.require("AirdropProxy")

const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const MockAsset = artifacts.require("MockAsset")

const utils = require("../scripts/99_utils")

let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdropLayout, airdropProxy, airdrop
let free, fmn, fsn, chng, any, fsnFuse
let categories, odds, assets, balancesRequired

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
    odds: odds, // odds of winning for each category
    airdropAmount: utils.toWei("1"), // 1 FREE paid per airdrop valid asset balance
    airdropCooldown: "86400" // 1 day between airdrops
  }
}

const initialAssets = () => {
  assets = [
    fsn.address,
    chng.address,
    any.address,
    fsnFuse.address
  ]

  balancesRequired = [
    "20000",
    "50000",
    "10000",
    "100"
  ]

  return {
    assets,
    balancesRequired: balancesRequired.map(bal => utils.toWei(bal))
  }
}

const setUp = async () => {
  [ admin, coordinator, governance, user ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds, airdropAmount, airdropCooldown } = config()

  free = await Free.new(
    "The FREE Token",
    "FREE",
    18,
    admin,
    governance,
    {from: admin}
  )

  fmn = await Fmn.new(
    "The FREEMOON Token",
    "FMN",
    18,
    admin,
    governance,
    {from: admin}
  )

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})

  airdropLayout = await Airdrop.new({from: admin})
  airdropProxy = await AirdropProxy.new(airdropLayout.address, {from: admin})
  airdrop = await Airdrop.at(airdropProxy.address, {from: admin})
  
  await faucet.initialize(
    admin,
    governance,
    free.address,
    fmn.address,
    categories,
    odds,
    {from: admin}
  )

  await faucet.updateParams(
    admin,
    coordinator,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    {from: admin}
  )

  await airdrop.initialize(
    admin,
    governance,
    faucet.address,
    free.address,
    {from: admin}
  )

  await airdrop.updateParams(
    admin,
    airdropAmount,
    airdropCooldown,
    {from: admin}
  )

  await free.setMintInvokers(faucet.address, airdrop.address, {from: admin})
  await fmn.setMintInvokers(faucet.address, {from: admin})

  fsn = {
    address: "0xffffffffffffffffffffffffffffffffffffffff"
  }

  chng = await MockAsset.new(
    "Chainge",
    "CHNG",
    utils.toWei("100000000"),
    {from: admin}
  )

  any = await MockAsset.new(
    "Anyswap",
    "ANY",
    utils.toWei("100000000"),
    {from: admin}
  )

  fsnFuse = await MockAsset.new(
    "FSN/FUSE Liquidity Pool",
    "FSN/FUSE",
    utils.toWei("100000000"),
    {from: admin}
  )

  const { assets, balancesRequired } = initialAssets()
  await airdrop.setAssets(assets, balancesRequired, {from: admin})
}


contract("Airdrop Upgradeability Tests", async () => {

  it("Should allow deployment of the incorrect contract", async () => {
    [ admin, coordinator, governance, user ] = await web3.eth.getAccounts()

    faucetLayout = await Faucet.new({from: admin})
    faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
    faucet = await Faucet.at(faucetProxy.address, {from: admin})

    mockAirdropLayout = await Airdrop.new({from: admin})
    airdropProxy = await AirdropProxy.new(mockAirdropLayout.address, {from: admin})
    mockAirdrop = await Airdrop.at(airdropProxy.address, {from: admin})
  })

  it("Should upgrade incorrect airdrop contract to correct airdrop contract", async () => {
    await setUp()
    const incorrect = await airdropProxy.currentAirdrop()

    airdropLayout = await Airdrop.new({from: admin})
    await truffleAssert.passes(airdropProxy.upgradeAirdrop(airdropLayout.address, {from: admin}))
    airdrop = await Airdrop.at(airdropProxy.address, {from: admin})
    await free.setMintInvokers(faucet.address, airdrop.address, {from: governance})

    const correct = await airdropProxy.currentAirdrop()

    expect(correct).to.not.equal(incorrect)
  })

  it("Should not allow non-admin to upgrade airdrop contract", async () => {
    await setUp()
    const currentBefore = await airdropProxy.currentAirdrop()

    mockAirdropLayout = await Airdrop.new({from: admin})
    await truffleAssert.fails(
      airdropProxy.upgradeAirdrop(mockAirdropLayout.address, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Invalid address attempting upgrade."
    )

    const currentAfter = await airdropProxy.currentAirdrop()
    
    expect(currentAfter).to.equal(currentBefore)
  })

  it("Should allow admin to pause all functions", async () => {
    await setUp()

    await truffleAssert.passes(airdrop.setPause(true, [ "claimAirdrop" ], {from: admin}))
  })

  it("Should allow admin to unpause all functions", async () => {
    await setUp()
    await faucet.setPause(true, [ "claimAirdrop" ], {from: admin})

    await truffleAssert.passes(faucet.setPause(false, [ "claimAirdrop" ], {from: admin}))
  })

  it("Should not allow non-admin to pause functions", async () => {
    await setUp()
    
    await truffleAssert.fails(
      faucet.setPause(true, [ "claimAirdrop" ], {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should not allow non-admin to unpause functions", async () => {
    await setUp()
    await faucet.setPause(true, [ "claimAirdrop" ], {from: admin})
    
    await truffleAssert.fails(
      faucet.setPause(false, [ "claimAirdrop" ], {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should prevent paused functions being called", async () => {
    await setUp()
    await airdrop.setPause(true, [ "claimAirdrop" ], {from: admin})
    await truffleAssert.passes(faucet.subscribe(user, {from: user, value: utils.toWei("1")}))

    await truffleAssert.fails(
      airdrop.claimAirdrop({from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: This function is currently paused."
    )
  })
})
