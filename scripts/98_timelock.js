const web3FusionExtend = require('web3-fusion-extend')

const Faucet = artifacts.require("Faucet")
const FREE = artifacts.require("FREE")
const FREEMOON = artifacts.require("FREEMOON")

const utils = require("./99_utils")


const web3fsn = web3FusionExtend.extend(web3)
const FSN = web3fsn.fsn.consts.FSN

let coordinator, governance, user
let faucet, free, freemoon
let categories, odds
let startBal, startTlBal, endBal, endTlBal

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
    subscriptionCost: utils.toWei("0.00001"),
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: utils.toWei("1"), // 1 FREE
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const setUp = async () => {
  [ coordinator, governance, user, airdrop, freeHolder1 ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, categories, odds } = config()
  
  faucet = await Faucet.new(
    governance,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    categories,
    odds
  )

  free = await FREE.new(
    "Free Token",
    "FREE",
    18,
    governance,
    airdrop,
    faucet.address
  )

  freemoon = await FREEMOON.new(
    "Freemoon Token",
    "FREEMOON",
    18,
    governance,
    faucet.address
  )

  console.log("FREE: ", free.address)
  console.log("FREEMOON: ", freemoon.address)
  console.log("Faucet: ", faucet.address)
}

const initialize = async () => {
  await faucet.initialize(free.address, freemoon.address, {from: coordinator})
}


const testTimelockSwap = async () => {
  await setUp()
  await initialize()

  startBal = utils.fromWei(await web3fsn.fsn.getBalance(FSN, coordinator))
  startTlBal = utils.fromWei(await web3fsn.fsn.getTimeLockBalance(FSN, coordinator))
  
  await faucet.subscribe({from: coordinator, value: utils.toWei("0.00001")})
  await faucet.timelockToFree({from: coordinator, value: utils.toWei("2")})

  endBal = utils.fromWei(await web3fsn.fsn.getBalance(FSN, coordinator))
  endTlBal = utils.fromWei(await web3fsn.fsn.getTimeLockBalance(FSN, coordinator))

  console.log("Start balance: ", startBal)
  console.log("Start TL: ", startTlBal)
  console.log("End balance: ", endBal)
  console.log("End TL: ", endTlBal)
}

testTimelockSwap()