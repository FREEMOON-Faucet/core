const FaucetProxy = artifacts.require("FaucetProxy")
const Faucet = artifacts.require("Faucet")
const FREE = artifacts.require("FREE")
const FREEMOON = artifacts.require("FREEMOON")

const utils = require("./99_utils")


let admin, coordinator, governance
let faucet, faucetLayout, faucetProxy
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
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const deployAll = async () => {
  [ admin, coordinator, governance, airdrop ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, categories, odds } = config()
  
  try {
    faucetLayout = await Faucet.new({from: admin})
    faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
    faucet = await Faucet.at(faucetProxy.address, {from: admin})

    logDeployed("FREEMOON-Faucet deployed at: ", faucet.address)
    logDeployed("Proxy deployed at:", faucetProxy.address)
  } catch(err) {
    logDeployed("FREEMOON-Faucet deployment unsuccessful:", err.message)
  }
  
  try {
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

    logDeployed("Faucet initialized successfully.")
  } catch(err) {
    logDeployed("Faucet initialization unsuccessful:", err.message)
  }

  try {
    free = await FREE.new(
      "Free Token",
      "FREE",
      18,
      governance,
      airdrop,
      faucet.address
    )

    logDeployed("FREE Token deployed at: ", free.address)
  } catch(err) {
    logDeployed("FREE Token deployment unsuccessful:", err.message)
  }

  try {
    freemoon = await FREEMOON.new(
      "Freemoon Token",
      "FREEMOON",
      18,
      governance,
      faucet.address
    )

    logDeployed("FREEMOON Token deployed at: ", freemoon.address)
  } catch(err) {
    logDeployed("FREEMOON Token deployment unsuccessful:", err.message)
  }

  try {
    await faucet.setAssets(free.address, freemoon.address, {from: admin})

    logDeployed("Set FREE asset addresses in faucet successfully.")
  } catch(err) {
    logDeployed("Set FREE asset addresses in faucet unsuccessful:", err.message)
  }
}

deployAll()