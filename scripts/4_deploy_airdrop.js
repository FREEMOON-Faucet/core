
const Airdrop = artifacts.require("AirdropV2")
const AirdropProxy = artifacts.require("AirdropProxyV2")

const utils = require("./99_utils")
const addresses = require("../addresses")

require("dotenv").config()

const GOV = process.env.GOV_PUBLIC

const FREE_ADDRESS = addresses.testnet.free
const FAUCET_ADDRESS = addresses.testnet.faucet

const initialAssets = [
  { address: "0xB80A6C4F2a279ec91921ca30da726c534462125C", symbol: "FMN", balance: "0.003" },
  { address: "0xed0294dbd2a0e52a09c3f38a09f6e03de2c44fcf", symbol: "CHNG", balance: "5000" },
  { address: "0x0c74199d22f732039e843366a236ff4f61986b32", symbol: "ANY", balance: "2000" },
  { address: "0xe96ac326ecea1a09ae6e47487c5d8717f73d5a7e", symbol: "FSN/FUSE (AnySwap", balance: "100" },
  { address: "0x35c2637312f69f425bba3bd01e63231091db818e", symbol: "FSN/FMN (Chainge)", balance: "2" },
  { address: "0x31c2f8ffce91918e2256faa36f3dc5e609aee1e0", symbol: "FSN/FMN (AnySwap)", balance: "50" },
  { address: "0x6933eb3d600db893c19fece96acecb3b0ccf340a", symbol: "FSN/FREE (Chainge)", balance: "700" },
  { address: "0x468d2a99bcc779fdb1f4b3b714a2757c35d6d744", symbol: "FSN/FREE (AnySwap)", balance: "50" },
  { address: "0x223949f336a067629bc2e9aa6d8fc84d712c8174", symbol: "CHNG/FMN (Chainge)", balance: "6" },
  { address: "0xeaee692277d8efd28326204751a0b689efc2720d", symbol: "FREE/FMN (Chainge)", balance: "60" },
  { address: "0x60add91ae0e79416e930972594ff48ae2f34a65f", symbol: "BTC/FREE (Chainge)", balance: "0.00011" },
  { address: "0xd713b42a1695d5afe40eb8d203c285e0444b12e4", symbol: "FSN/BTC (Chainge)", balance: "0.0000000155" },
  { address: "0x6a69b46e072a0c9fb8c7c08bd70aaedcc0211782", symbol: "FSN/ETH (Chainge)", balance: "1.17" },
  { address: "0x7ba62ccb1d4eb01096a55c097d770e71d6470ad4", symbol: "FSN/BNB (Chainge)", balance: "5" },
  { address: "0x2331ce79654d01e3c64282d38c965924ee804b82", symbol: "FSN/HT (Chainge)", balance: "21" },
  { address: "0x3039737104055f2b3a9c1d0ecfac82e4c15f54ac", symbol: "FSN/TRX (Chainge)", balance: "0.000214" },
  { address: "0x34ea7affd817743535bc828fff709e4702a15328", symbol: "FSN/OKT (Chainge)", balance: "10" },
  { address: "0x656df9ad297c80e8233c39625a09a307e0835f1e", symbol: "FSN/FIL (Chainge)", balance: "12" },
  { address: "0xb443d4fd37a5f58385d75ed942880fde7f23de2f", symbol: "FSN/MATIC (Chainge)", balance: "90" },
  { address: "0x87d8ead810efd317af3a478506c56ab4f8969bf0", symbol: "FSN/FTM (Chainge)", balance: "80" },
  { address: "0xf473900ff13d2d3b46375637ea8dc0f92b529264", symbol: "FSN/USDC (Chainge)", balance: "0.0001" },
  { address: "0x049DdC3CD20aC7a2F6C867680F7E21De70ACA9C3", symbol: "FSN/ANY (AnySwap)", balance: "2.05" },
  { address: "0x412a3fe4db6b5a73f7f460d10a009bec0c44b24c", symbol: "FSN/LTC (AnySwap)", balance: "22" },
  { address: "0x4d0caf7bad07667d27ce13cb820c39fb60e9e1b9", symbol: "FSN/CHNG (AnySwap)", balance: "0.0037" },
  { address: "0x4d37f8c6d1aad7b8d1dfd128da20059cb9dae2df", symbol: "FREE/CHNG (Chainge)", balance: "5000" },
]

let admin
let airdropLayout, airdropProxy, airdrop

const config = () => {
  return {
    airdropAmount: utils.toWei("1"), // 1 FREE paid per airdrop valid asset balance
    airdropCooldown: "86400" // 1 day between airdrops
  }
}

const initialAssets = () => {
  assets = initialAssets.map(asset => asset.address)
  symbols = initialAssets.map(asset => asset.symbol)
  balancesRequired = initialAssets.map(asset => asset.balance)

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
    console.log("Deploying airdrop function contract ...")

    airdropLayout = await Airdrop.new({ from: admin })

    console.log("Airdrop function contract deployment successful: ", airdropLayout.address)
  } catch(err) {
    throw new Error(`Airdrop function contract deployment failed: ${ err.message }`)
  }

  try {
    console.log("Deploying airdrop proxy contract ...")

    airdropProxy = await AirdropProxy.new(airdropLayout.address, { from: admin })

    console.log("Airdrop proxy contract deployment successful: ", airdropProxy.address)
  } catch(err) {
    throw new Error(`Airdrop proxy contract deployment failed: ${ err.message }`)
  }

  airdrop = await Airdrop.at(airdropProxy.address, { from: admin })
  
  try {
    console.log("Initializing airdrop contract ...")
    
    await airdrop.initialize(
      admin,
      GOV,
      FAUCET_ADDRESS,
      FREE_ADDRESS,
      {from: admin}
    )

    console.log("Airdrop initialized successfully.")
  } catch(err) {
    throw new Error(`Airdrop initialization failed: ${ err.message }`)
  }

  try {
    console.log("Updating airdrop parameters with initial values ...")
    
    await airdrop.updateParams(
      admin,
      airdropAmount,
      airdropCooldown,
      {from: admin}
    )

    console.log("Airdrop parameters updated with initial values successfully.")
  } catch(err) {
    throw new Error(`Airdrop parameters failed to update with initial values: ${ err.message }`)
  }

  try {
    console.log("Setting initial assets in airdrop ...")

    await airdrop.setAssets(assets, balancesRequired, { from: admin })

    console.log("Set initial assets in airdrop successfully.")
  } catch(err) {
    throw new Error(`Setting initial assets in airdrop failed: ${ err.message }`)
  }
  
  const _ADMIN = await airdrop.admin()
  const _GOV = await airdrop.governance()
  const _AA = utils.fromWei(await airdrop.airdropAmount())
  const _AC = (await airdrop.airdropCooldown()).toString()

  const count = await airdrop.airdropAssetCount()
  for(let i = 0; i < count; i++) {
    let asset = await airdrop.airdropAssets(i)
    let bal = utils.fromWei(await airdrop.balanceRequired(asset))
    console.log(`
      Asset ${ asset }: Required ${bal}
      -----------------
    `)
  }

  console.log(`
    Admin: ${ _ADMIN },
    Governance: ${ _GOV },
    -----------------
    Airdrop Amount: ${ _AA },
    Airdrop Cooldown: ${ _AC }
  `)
}

try {
  deployAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
