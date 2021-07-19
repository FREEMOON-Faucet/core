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

let admin, coordinator, governance, user
let faucetLayout, faucetProxy, faucet
let airdropLayout, airdropProxy, airdrop
let free, freemoon, fsn, chng, any, fuseFsn
let categories, odds
let fromNowOneHour, startTime, newTime

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
    utils.toWei("100000000"),
    {from: admin}
  )

  any = await MockAsset.new(
    "Anyswap",
    "ANY",
    utils.toWei("100000000"),
    {from: admin}
  )

  fuseFsn = await MockAsset.new(
    "FUSE/FSN Liquidity Pool",
    "FUSE/FSN",
    utils.toWei("100000000"),
    {from: admin}
  )
}

const spreadAssets = async options => {
  const { fsn, chng, any, fuseFsn } = options
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneHour = startTime + 3605
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
    await airdrop.setAssets()
  })

  it("Should not allow setAssets to be called more than once")

  it("Should allow governance to call setAssets anytime")

  it("Should set initial assets successfully")
})