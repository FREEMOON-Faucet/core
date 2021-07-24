const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Airdrop = artifacts.require("Airdrop")
const AirdropProxy = artifacts.require("AirdropProxy")

const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const MockAsset = artifacts.require("MockAsset")

const utils = require("./99_utils")


let admin, coordinator, governance
let faucet, faucetLayout, faucetProxy
let airdrop, airdropLayout, airdropProxy
let free, freemoon, fsn, chng, any, fsnFuse
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

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const enterIntoDraw = async (account, lottery, tx, block) => {
  return await faucet.resolveEntry(account, lottery, tx, block, {from: coordinator})
}

const deployAll = async () => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()

  // TESTING ONLY >>>>>
  try {
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

    logDeployed("Mock assets deployed successfully:")
    logDeployed("CHNG:", chng.address)
    logDeployed("ANY:", any.address)
    logDeployed("FSN/FUSE:", fsnFuse.address)
  } catch(err) {
    throw new Error(`Mock assets deployment unsuccessful: ${err.message}`)
  }
  // <<<<< TESTING ONLY

  const {
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    categories,
    odds,
    airdropAmount,
    airdropCooldown
  } = config()

  const {
    assets,
    balancesRequired
  } = initialAssets()
  
  try {
    faucetLayout = await Faucet.new({from: admin})
    faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
    faucet = await Faucet.at(faucetProxy.address, {from: admin})

    logDeployed("FREEMOON-Faucet deployed at:", faucet.address)
    logDeployed("FREEMOON-Faucet Proxy deployed at:", faucetProxy.address)
  } catch(err) {
    throw new Error(`FREEMOON-Faucet deployment unsuccessful: ${err.message}`)
  }

  try {
    airdropLayout = await Airdrop.new({from: admin})
    airdropProxy = await AirdropProxy.new(airdropLayout.address, {from: admin})
    airdrop = await Airdrop.at(airdropProxy.address, {from: admin})

    logDeployed("Airdrop deployed at:", airdrop.address)
    logDeployed("Airdrop Proxy deployed at:", airdropProxy.address)
  } catch(err) {
    throw new Error(`Airdrop deployment unsuccessful: ${err.message}`)
  }

  try {
    free = await FREE.new(
      "Free Token",
      "FREE",
      18,
      governance,
      airdrop.address,
      faucet.address
    )

    logDeployed("FREE Token deployed at: ", free.address)
  } catch(err) {
    throw new Error(`FREE Token deployment unsuccessful: ${err.message}`)
  }

  try {
    freemoon = await FMN.new(
      "Freemoon Token",
      "FMN",
      18,
      governance,
      faucet.address
    )

    logDeployed("FMN Token deployed at: ", freemoon.address)
  } catch(err) {
    throw new Error(`FMN Token deployment unsuccessful: ${err.message}`)
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
      hotWalletLimit,
      categories,
      odds
    )

    logDeployed("Faucet initialized successfully.")
  } catch(err) {
    throw new Error(`Faucet initialization unsuccessful: ${err.message}`)
  }

  try {
    await airdrop.initialize(
      admin,
      coordinator,
      governance,
      faucet.address,
      free.address,
      airdropAmount,
      airdropCooldown
    )

    logDeployed("Airdrop initialized successfully.")
  } catch(err) {
    throw new Error(`Airdrop initialization unsuccessful: ${err.message}`)
  }

  try {
    await faucet.setAssets(free.address, freemoon.address, {from: admin})

    logDeployed("Set FREE asset addresses in faucet successful.")
  } catch(err) {
    throw new Error(`Set FREE asset addresses in faucet unsuccessful: ${err.message}`)
  }

  try {
    await airdrop.setAssets(assets, balancesRequired, {from: admin})
    
    logDeployed("Set FSN, CHNG, ANY, FSN/FUSE assets in airdrop successfully.")
  } catch(err) {
    throw new Error(`Set FSN, CHNG, ANY, FSN/FUSE assets in airdrop unsuccessfull: ${err.message}`)
  }

  // try {
  //   await faucet.subscribe(admin, {from: admin, value: utils.toWei("1")})
  //   const { txHash, blockHash } = utils.getHashes(await faucet.claim(admin, {from: admin}))
  //   await enterIntoDraw(admin, 7, txHash, blockHash)
  //   const wins = (await faucet.winners()).toNumber()
  //   if(Number(wins) > 0) logDeployed("Forced win successful, win count:", wins)
  //   else throw new Error(`Unsuccessful attempt at winning lottery.`)
  // } catch(err) {
  //   throw new Error(`Forced win failed: ${err.message}`)
  // }
}

try {
  deployAll()
} catch(err) {
  console.log(err.message)
}
