
const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")

const MockFRC20 = artifacts.require("MockFRC20")
const MockFRC758 = artifacts.require("MockFRC758")

const utils = require("./99_utils")
const addresses = require("../addresses")
// const rewardAssets = require("../rewardAssets")

require("dotenv").config()

// const GOV = process.env.GOV_PUBLIC

// const FREE_ADDRESS = addresses.testnet.free
// const FAUCET_ADDRESS = addresses.testnet.faucet

let admin, coordinator, governance
let airdropV2Layout, airdropProxyV2, airdropV2

const deployAirdrop = async () => {
  [ admin, coordinator, governance ] = await web3.eth.getAccounts()

  try {
    console.log("Deploying airdrop function contract ...")

    airdropV2Layout = await AirdropV2.new({ from: admin })

    console.log("Airdrop function contract deployment successful: ", airdropV2Layout.address)
  } catch(err) {
    throw new Error(`Airdrop function contract deployment failed: ${ err.message }`)
  }

  try {
    console.log("Deploying airdrop proxy contract ...")

    airdropProxyV2 = await AirdropProxyV2.new(airdropV2Layout.address, { from: admin })

    console.log("Airdrop proxy contract deployment successful: ", airdropProxyV2.address)
  } catch(err) {
    throw new Error(`Airdrop proxy contract deployment failed: ${ err.message }`)
  }

  airdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })
  
  try {
    console.log("Initializing airdrop contract ...")
    
    await airdropV2.initialize(
      admin,
      governance,
      FAUCET_ADDRESS,
      FREE_ADDRESS,
      {from: admin}
    )

    console.log("Airdrop initialized successfully.")
  } catch(err) {
    throw new Error(`Airdrop initialization failed: ${ err.message }`)
  }
  
  const _ADMIN = await airdrop.admin()
  const _GOV = await airdrop.governance()

  console.log(`
    Admin: ${ _ADMIN },
    Governance: ${ _GOV },
    -----------------
  `)
}

try {
  deployAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
