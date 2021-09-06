
const Airdrop = artifacts.require("Airdrop")
const FREE = artifacts.require("FREE")
const Faucet = artifacts.require("Faucet")
const ChaingeDexPair = artifacts.require("ChaingeDexPair")

const utils = require("./99_utils")
const addresses = require("../addresses")

let admin, user
let airdrop
let free, chng, any, fsnFuse
let faucet
let pool

const AIRDROP_ADDRESS = addresses.mainnet.airdrop
const FREE_ADDRESS = addresses.mainnet.free
const FAUCET_ADDRESS = addresses.mainnet.faucet
const POOL_ADDRESS = "0xeaee692277d8efd28326204751a0b689efc2720d"

const drop = async () => {
  [ admin, c, governance ] = await web3.eth.getAccounts()

  airdrop = await Airdrop.at(AIRDROP_ADDRESS)
  free = await FREE.at(FREE_ADDRESS)
  faucet = await Faucet.at(FAUCET_ADDRESS)
  pool = await ChaingeDexPair.at(POOL_ADDRESS)

  try {
    const { _reserve0, _reserve1, _blockTimestampLast } = await pool.getReserves()
    let reserve0 = web3.utils.fromWei(_reserve0)
    let reserve1 = web3.utils.fromWei(_reserve1)
    let timestamp = _blockTimestampLast.toNumber()

    console.log(`reserve 0: ${ reserve0 }, reserve1: ${ reserve1 }, timestamp: ${ timestamp }`)
  } catch(err) {
    console.log(`Error: ${ err.message }`)
  }
}


drop().then(() => process.exit(0))
