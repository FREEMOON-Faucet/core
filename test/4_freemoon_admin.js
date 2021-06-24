const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Free = artifacts.require("FREE")
const Freemoon = artifacts.require("FREEMOON")

const utils = require("../scripts/99_utils")


let coordinator, governance, admin
let faucetLayout, faucetProxy, faucet
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
    "1" // 100% chance of winning for testing only
  ]

  return {
    subscriptionCost: utils.toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: utils.toWei("1"), // 1 FREE
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const setUp = async () => {
  [ coordinator, governance, admin, user, airdrop ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, categories, odds } = config()

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})
  
  await faucet.initialize(
    admin,
    coordinator,
    governance,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    categories,
    odds
  )

  free = await Free.new(
    "Free Token",
    "FREE",
    18,
    governance,
    airdrop,
    faucet.address,
    {from: freeHolder}
  )

  freemoon = await Freemoon.new(
    "Freemoon Token",
    "FREEMOON",
    18,
    governance,
    faucet.address,
    {from: freeHolder}
  )
}

const setAssets = async () => {
  await faucet.setAssets(free.address, freemoon.address, {from: admin})
}


contract("Freemoon Faucet Upgradeability Tests", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
  })

  it("")
})