
const Airdrop = artifacts.require("Airdrop")
const AirdropProxy = artifacts.require("AirdropProxy")

const utils = require("./99_utils")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC
const COORDINATOR = process.env.COORDINATOR_PUBLIC

const FREE_ADDRESS = "0x60364ad97beb8EC63d19B021677d02D9152b5E51"
const FAUCET_ADDRESS = "0x7aBf00a759f5F377f0cF885D168803E9D326f387"

const FSN = "0xffffffffffffffffffffffffffffffffffffffff"
const CHNG = "0xed0294dbd2a0e52a09c3f38a09f6e03de2c44fcf"
const ANY = "0x0c74199d22f732039e843366a236ff4f61986b32"
const FSN_FUSE = "0xe96ac326ecea1a09ae6e47487c5d8717f73d5a7e"

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
    FSN,
    CHNG,
    ANY,
    FSN_FUSE
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
      COORDINATOR,
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
  const _COORDINATOR = await airdrop.coordinator()
  const _GOV = await airdrop.governance()
  const _AA = utils.fromWei(await airdrop.airdropAmount())
  const _AC = (await airdrop.airdropCooldown()).toString()

  console.log(`
    Admin: ${_ADMIN},
    Coordinator: ${_COORDINATOR},
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
