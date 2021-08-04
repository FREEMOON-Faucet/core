
const Airdrop = artifacts.require("Airdrop")
const FREE = artifacts.require("FREE")

const utils = require("./99_utils")

let admin, user
let airdrop
let free, chng, any, fsnFuse

const AIRDROP_ADDRESS = "0x60364ad97beb8EC63d19B021677d02D9152b5E51"
const FREE_ADDRESS = "0xeE59ee5f266855426E3a519c555dc9cB00aC67b0"

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

  // console.log("Transferring to user ...")
  // await transfer()

  try {
    console.log("Airdropping to admin ...")

    const claimable = utils.fromWei(await airdrop.getClaimable(admin))
    console.log(`Claimable by admin: ${claimable}`)

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
