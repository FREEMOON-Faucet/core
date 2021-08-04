
const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const utils = require("./99_utils")
const addresses = require("../addresses")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC
const COORDINATOR = process.env.COORDINATOR_PUBLIC

const FREE_ADDRESS = addresses.testnet.free
const FMN_ADDRESS = addresses.testnet.fmn

// const FAUCET_ADDRESS = addresses.testnet.faucet

let admin
let faucetLayout, faucetProxy, faucet

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

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
    hotWalletLimit: utils.toWei("50"), // 50 FSN max wallet balance
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FMN lottery category
    odds: odds // odds of winning for each category
  }
}

const deployFaucet = async () => {
  [ admin ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds } = config()

  try {
    logDeployed("Deploying faucet function contract ...")

    faucetLayout = await Faucet.new({from: admin})

    logDeployed("Faucet function contract deployment successful:", faucetLayout.address)
  } catch(err) {
    throw new Error(`Faucet function contract deployment failed: ${err.message}`)
  }

  try {
    logDeployed("Deploying faucet proxy contract ...")

    faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})

    logDeployed("Faucet proxy contract deployment successful:", faucetProxy.address)
  } catch(err) {
    throw new Error(`Faucet proxy contract deployment failed: ${err.message}`)
  }

  faucet = await Faucet.at(faucetProxy.address, {from: admin})

  try {
    logDeployed("Initializing faucet contract ...")
    
    await faucet.initialize(
      admin,
      GOV,
      FREE_ADDRESS,
      FMN_ADDRESS,
      categories,
      odds,
      {from: admin}
    )

    logDeployed("Faucet initialized successfully.")
  } catch(err) {
    throw new Error(`Faucet initialization failed: ${err.message}`)
  }

  try {
    logDeployed("Updating faucet parameters with initial values ...")
    
    await faucet.updateParams(
      admin,
      COORDINATOR,
      subscriptionCost,
      cooldownTime,
      payoutThreshold,
      payoutAmount,
      hotWalletLimit,
      {from: admin}
    )

    logDeployed("Faucet parameters updated with initial values successfully.")
  } catch(err) {
    throw new Error(`Faucet parameters failed to update with initial values: ${err.message}`)
  }
  
  const _ADMIN = await faucet.admin()
  const _COORDINATOR = await faucet.coordinator()
  const _GOV = await faucet.governance()
  const _SC = utils.fromWei(await faucet.subscriptionCost())
  const _CT = (await faucet.cooldownTime()).toString()
  const _PT = await faucet.payoutThreshold()
  const _PA = utils.fromWei(await faucet.payoutAmount())
  const _HWL = utils.fromWei(await faucet.hotWalletLimit())

  console.log(`
    Admin: ${_ADMIN},
    Coordinator: ${_COORDINATOR},
    Governance: ${_GOV},
    -----------------
    Subscription Cost: ${_SC},
    Cooldown Time: ${_CT},
    Payout Threshold: ${_PT},
    Payout Amount: ${_PA},
    Hot Wallet Limit: ${_HWL}
  `)
}

try {
  deployFaucet().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
