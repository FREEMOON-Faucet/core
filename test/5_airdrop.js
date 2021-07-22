const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Airdrop = artifacts.require("Airdrop")
const AirdropProxy = artifacts.require("AirdropProxy")

const Free = artifacts.require("FREE")
const Freemoon = artifacts.require("FMN")

const MockAsset = artifacts.require("MockAsset")

const utils = require("../scripts/99_utils")

let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdropLayout, airdropProxy, airdrop
let free, freemoon, fsn, chng, any, fsnFuse
let categories, odds, assets, balancesRequired
let fromNowOneDay, startTime, newTime

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
    "19000",
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

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})

  airdropLayout = await Airdrop.new({from: admin})
  airdropProxy = await AirdropProxy.new(airdropLayout.address, {from: admin})
  airdrop = await Airdrop.at(airdropProxy.address, {from: admin})

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
  
  await faucet.initialize(
    admin,
    coordinator,
    governance,
    airdrop.address,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    categories,
    odds
  )

  await faucet.setAssets(
    free.address,
    freemoon.address
  )

  await airdrop.initialize(
    admin,
    coordinator,
    governance,
    faucet.address,
    free.address,
    airdropAmount,
    airdropCooldown
  )

  fsn = {
    address: "0xffffffffffffffffffffffffffffffffffffffff"
  }

  chng = await MockAsset.new(
    "Chainge",
    "CHNG",
    utils.toWei("50000"),
    {from: admin}
  )

  any = await MockAsset.new(
    "Anyswap",
    "ANY",
    utils.toWei("10000"),
    {from: admin}
  )

  fsnFuse = await MockAsset.new(
    "FSN/FUSE Liquidity Pool",
    "FSN/FUSE",
    utils.toWei("100"),
    {from: admin}
  )
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneDay = startTime + 86405
}

const advanceBlockAtTime = async time => {
  await web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [ time ],
      id: new Date().getTime(),
    },
    (err, res) => {
      if(err) {
        newTime = err
      }
    }
  )
  const newBlock = await web3.eth.getBlock("latest")
  newTime = newBlock.timestamp
}

const setAssets = async () => {
  const { assets, balancesRequired } = initialAssets()
  await airdrop.setAssets(assets, balancesRequired)
}


contract("Airdrop Contract", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })

  // INITIAL VALUES
  it("Should set the correct addresses for admin, coordinator and governance", async () => {
    const adminSet = await airdrop.admin()
    const coordinatorSet = await airdrop.coordinator()
    const governanceSet = await airdrop.governance()

    expect(adminSet).to.equal(admin)
    expect(coordinatorSet).to.equal(coordinator)
    expect(governanceSet).to.equal(governance)
  })

  it("Should set correct initial airdrop parameters", async () => {
    const aa = utils.fromWei(await airdrop.airdropAmount())
    const ac = (await airdrop.airdropCooldown()).toString()
    const freeSet = await airdrop.free()
    const faucetSet = await airdrop.faucet()

    let { airdropAmount, airdropCooldown } = config()
    airdropAmount = utils.fromWei(airdropAmount)

    expect(aa).to.equal(airdropAmount)
    expect(ac).to.equal(airdropCooldown)
    expect(freeSet).to.equal(free.address)
    expect(faucetSet).to.equal(faucet.address)
  })

  // ADDRESS RESTRICTIONS
  it("Should allow setAssets to be called once", async () => {
    const { assets, balancesRequired } = initialAssets()
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired))
  })

  it("Should not allow setAssets to be called more than once", async () => {
    const { assets, balancesRequired } = initialAssets()
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired))
    await truffleAssert.fails(
      airdrop.setAssets(assets, balancesRequired),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the governance address can set assets after initialization."
    )
  })

  it("Should allow governance to call setAssets anytime", async () => {
    const { assets, balancesRequired } = initialAssets()
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired, {from: governance}))
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired, {from: governance}))
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired, {from: governance}))
  })

  it("Should set initial assets successfully", async () => {
    const { assets, balancesRequired } = initialAssets()
    await airdrop.setAssets(assets, balancesRequired)
    for(let i = 0; i < assets.length; i++) {
      let balanceRequirementSet = await airdrop.balRequiredFor(assets[i])
      expect(utils.fromWei(balanceRequirementSet)).to.equal(utils.fromWei(balancesRequired[i]))
    }
  })

  it("Should airdrop the right amount of FREE to subscribed address when called", async () => {
    await setAssets()
    await faucet.subscribe(admin, {value: utils.toWei("1")})
    const freeBalBefore = utils.fromWei(await free.balanceOf(admin))
    await airdrop.claimAirdrop(admin)
    const freeBalAfter = utils.fromWei(await free.balanceOf(admin))

    expect(freeBalAfter).to.equal(String(Number(freeBalBefore) + 4))
  })

//   it("Should airdrop the right amount of FREE to subscribed address", async () => {
//     const { assets, balancesRequired } = initialAssets()
//     await airdrop.setAssets(assets, balancesRequired)
//     await faucet.subscribe(admin, {value: utils.toWei("1")})
//     const freeBalBefore = utils.fromWei(await free.balanceOf(admin))
//     await airdrop.airdrop()
//     const freeBalAfter = utils.fromWei(await free.balanceOf(admin))

//     expect(freeBalAfter).to.equal(String(Number(freeBalBefore) + 4))
//   })

//   it("Should not airdrop FREE to unsubscribed address, regardless of balances", async () => {
//     const { assets, balancesRequired } = initialAssets()
//     await airdrop.setAssets(assets, balancesRequired)
//     const freeBalBefore = utils.fromWei(await free.balanceOf(admin))
//     await airdrop.airdrop()
//     const freeBalAfter = utils.fromWei(await free.balanceOf(admin))
//     expect(freeBalAfter).to.equal(freeBalBefore)
//   })

//   it("Should not airdrop FREE to subscribed address with insufficient balances", async () => {
//     const { assets, balancesRequired } = initialAssets()
//     await airdrop.setAssets(assets, balancesRequired)
//     await faucet.subscribe(admin, {value: utils.toWei("1")})

//     await airdrop.setAssets(
//       assets,
//       [ "20001", "50001", "10001", "101"].map(bal => utils.toWei(bal)),
//       {from: governance}
//     )

//     const freeBalBefore = utils.fromWei(await free.balanceOf(admin))
//     await airdrop.airdrop()
//     const freeBalAfter = utils.fromWei(await free.balanceOf(admin))

//     expect(freeBalAfter).to.equal(freeBalBefore)
//   })

//   it("Should only be callable once per set airdrop cooldown", async () => {
//     const { assets, balancesRequired } = initialAssets()
//     await airdrop.setAssets(assets, balancesRequired)
//     await airdrop.airdrop()

//     await truffleAssert.fails(
//       airdrop.airdrop(),
//       truffleAssert.ErrorType.REVERT,
//       "FREEMOON: Airdrop has already taken place recently."
//     )

//     await advanceBlockAtTime(fromNowOneDay)

//     await truffleAssert.passes(airdrop.airdrop())
//   })
})