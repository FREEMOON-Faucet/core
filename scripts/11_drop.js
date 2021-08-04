
const Airdrop = artifacts.require("Airdrop")
const FREE = artifacts.require("FREE")
const Faucet = artifacts.require("Faucet")

const utils = require("./99_utils")
const addresses = require("../addresses")

let admin, user
let airdrop
let free, chng, any, fsnFuse
let faucet

const AIRDROP_ADDRESS = addresses.testnet.airdrop
const FREE_ADDRESS = addresses.testnet.free
const FAUCET_ADDRESS = addresses.testnet.faucet

const CHNG_ADDRESS = "0xf7eD89b804CC22Cb188986Eeb6D5F01d522d5138"
const ANY_ADDRESS = "0x8B0Cb6c96522a5e27466808D6992838044ae7192"
const FSN_FUSE_ADDRESS = "0x2ac2055cea2FDc44850F7fE52EAFD18e64a77984"

// const transfer = async () => {
//   await web3.eth.sendTransaction({from: admin, to: user, value: utils.toWei("1")})
//   chng = await FREE.at(CHNG_ADDRESS)
//   any = await FREE.at(ANY_ADDRESS)
//   fsnFuse = await FREE.at(FSN_FUSE_ADDRESS)

//   await chng.transfer(user, utils.toWei("500000"), {from: admin})
//   await any.transfer(user, utils.toWei("500000"), {from: admin})
//   await fsnFuse.transfer(user, utils.toWei("500000"), {from: admin})
// }

const drop = async () => {
  [ admin ] = await web3.eth.getAccounts()

  airdrop = await Airdrop.at(AIRDROP_ADDRESS)
  free = await FREE.at(FREE_ADDRESS)
  faucet = await Faucet.at(FAUCET_ADDRESS)

//   try {
//     console.log("Subscribing admin ...")

//     await faucet.subscribe(admin, {from: admin, value: utils.toWei("0.0001")})

//     console.log("... Subscribed.")
//   } catch(err) {
//     throw new Error(`Subscribing failed: ${err.message}`)
//   }

  try {
    console.log("Checking claimable by admin ...")

    const claimable = utils.fromWei(await airdrop.getClaimable(admin))
    // console.log(`Claimable by admin: ${claimable}`)

    console.log("Claiming ...")
    await airdrop.claimAirdrop({from: admin})

    const freeBal = utils.fromWei(await free.balanceOf(admin))

    console.log(`Done, FREE balance: ${freeBal}`)
  } catch(err) {
    throw new Error(`Claim failed: ${err.message}`)
  }
}

try {
  drop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
