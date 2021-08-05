
const Airdrop = artifacts.require("Airdrop")
const AirdropProxy = artifacts.require("AirdropProxy")

const utils = require("./99_utils")
const addresses = require("../addresses")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC

const FREE_ADDRESS = addresses.testnet.free
const FAUCET_ADDRESS = addresses.testnet.faucet

// const FSN = addresses.testnet.fsn
const CHNG = addresses.testnet.chng
const ANY = addresses.testnet.any
const FSN_FUSE = addresses.testnet.fsnFuse

let admin
let airdropLayout, airdropProxy, airdrop

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const config = () => {
  return {
    airdropAmount: utils.toWei("1"), // 1 FREE paid per airdrop valid asset balance
    airdropCooldown: "86400" // 1 day between airdrops
  }
}

const initialAssets = () => {
  assets = [
    // FSN,
    CHNG,
    ANY,
    FSN_FUSE
  ]

  balancesRequired = [
    // "20000",
    "50000",
    "10000",
    "100"
  ]

  return {
    assets,
    balancesRequired: balancesRequired.map(bal => utils.toWei(bal))
  }
}

const deployAirdrop = async () => {
  [ admin ] = await web3.eth.getAccounts()
  const { airdropAmount, airdropCooldown } = config()
  const { assets, balancesRequired } = initialAssets()

  try {
    logDeployed("Deploying airdrop function contract ...")

    airdropLayout = await Airdrop.new({from: admin})

    logDeployed("Airdrop function contract deployment successful:", airdropLayout.address)
  } catch(err) {
    throw new Error(`Airdrop function contract deployment failed: ${err.message}`)
  }

  try {
    logDeployed("Deploying airdrop proxy contract ...")

    airdropProxy = await AirdropProxy.new(airdropLayout.address, {from: admin})

    logDeployed("Airdrop proxy contract deployment successful:", airdropProxy.address)
  } catch(err) {
    throw new Error(`Airdrop proxy contract deployment failed: ${err.message}`)
  }

  airdrop = await Airdrop.at(airdropProxy.address, {from: admin})
  
  try {
    logDeployed("Initializing airdrop contract ...")
    
    await airdrop.initialize(
      admin,
      GOV,
      FAUCET_ADDRESS,
      FREE_ADDRESS,
      {from: admin}
    )

    logDeployed("Airdrop initialized successfully.")
  } catch(err) {
    throw new Error(`Airdrop initialization failed: ${err.message}`)
  }

  try {
    logDeployed("Updating airdrop parameters with initial values ...")
    
    await airdrop.updateParams(
      admin,
      airdropAmount,
      airdropCooldown,
      {from: admin}
    )

    logDeployed("Airdrop parameters updated with initial values successfully.")
  } catch(err) {
    throw new Error(`Airdrop parameters failed to update with initial values: ${err.message}`)
  }

  try {
    logDeployed("Setting initial assets in airdrop ...")

    await airdrop.setAssets(assets, balancesRequired, {from: admin})

    logDeployed("Set initial assets in airdrop successfully.")
  } catch(err) {
    throw new Error(`Setting initial assets in airdrop failed: ${err.message}`)
  }
  
  const _ADMIN = await airdrop.admin()
  const _GOV = await airdrop.governance()
  const _AA = utils.fromWei(await airdrop.airdropAmount())
  const _AC = (await airdrop.airdropCooldown()).toString()

  console.log(`
    Admin: ${_ADMIN},
    Governance: ${_GOV},
    -----------------
    Airdrop Amount: ${_AA},
    Airdrop Cooldown: ${_AC}
  `)
}

try {
  deployAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
