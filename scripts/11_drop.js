
const Airdrop = artifacts.require("Airdrop")
const FREE = artifacts.require("FREE")
const Faucet = artifacts.require("Faucet")

const utils = require("./99_utils")
const addresses = require("../addresses")

let admin, user
let airdrop
let free, chng, any, fsnFuse
let faucet

const AIRDROP_ADDRESS = addresses.mainnet.airdrop
const FREE_ADDRESS = addresses.mainnet.free
const FAUCET_ADDRESS = addresses.mainnet.faucet

const CHNG_ADDRESS = addresses.mainnet.chng
const ANY_ADDRESS = addresses.mainnet.any
const FSN_FUSE_ADDRESS = addresses.mainnet.fsnFuse

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
  [ admin, c, governance ] = await web3.eth.getAccounts()

  airdrop = await Airdrop.at(AIRDROP_ADDRESS)
  free = await FREE.at(FREE_ADDRESS)
  faucet = await Faucet.at(FAUCET_ADDRESS)

  // try {
  //   console.log("Updating airdrop parameters ...")
  //   await airdrop.updateParams(admin, utils.toWei("1"), "10", {from: admin})
  //   console.log("Done")
  // } catch(err) {
  //   throw new Error(`Update failed: ${err.message}`)
  // }

  // try {
  //   console.log("Subscribing admin ...")

  //   await faucet.subscribe(admin, {from: admin, value: utils.toWei("0.0001")})

  //   console.log("... Subscribed.")
  // } catch(err) {
  //   throw new Error(`Subscribing failed: ${err.message}`)
  // }

  // for(let i = 0; i < 4; i++) {
  //   let asset = await airdrop.airdropAssets(i)
  //   console.log(asset)
  //   console.log(utils.fromWei(await airdrop.balanceRequired(asset)))
  //   console.log("--------------------")
  // }

  // try {
  //   console.log("Checking claimable by admin ...")

  //   const count = (await airdrop.airdropAssetCount()).toNumber()
  //   let asset, claimableFor
  //   let claimable = 0

  //   for(let i = 0; i < count; i++) {
  //     asset = await airdrop.airdropAssets(i)
  //     claimableFor = Number(utils.fromWei(await airdrop.getClaimable(admin, asset)))
  //     console.log(claimableFor)
  //     claimable += claimableFor
  //   }
    
  //   console.log(`Claimable by admin: ${claimable}`)

  //   console.log("Claiming ...")
  //   await airdrop.claimAirdrop({from: admin})

  //   const freeBal = utils.fromWei(await free.balanceOf(admin))

  //   console.log(`Done, FREE balance: ${freeBal}`)
  // } catch(err) {
  //   throw new Error(`Claim failed: ${err.message}`)
  // }
}

try {
  drop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
