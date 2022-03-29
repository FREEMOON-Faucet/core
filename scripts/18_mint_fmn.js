
const Fmn = artifacts.require("FREE")

const addresses = require("../addresses")
const fmnAddr = addresses.mainnet.fmn


const mintFmn = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  const fmn = await Fmn.at(fmnAddr)

  const MINT_AMOUNT = web3.utils.toWei("3.25", "ether")
  const MINT_TO = "0xB110b5D29bB920Ae7A6F0e06615177f24B79d5cb"

  console.log(`Minting ${ web3.utils.fromWei(MINT_AMOUNT) } FMN to address ${ MINT_TO } ...`)

  const balanceBefore = web3.utils.fromWei(await fmn.balanceOf(MINT_TO))
  console.log(`Initial balance of receiver: ${ balanceBefore }`)

  try {
    // await fmn.mint(MINT_TO, MINT_AMOUNT, { from: admin })
    const balanceAfter = web3.utils.fromWei(await fmn.balanceOf(MINT_TO))
    console.log(`Success, balance of receiver: ${ balanceAfter } FMN`)
  } catch(err) {
    throw new Error(`Error: failed with ${ err.message }`)
  }
}

try {
  mintFmn()
} catch(err) {
  console.log(err.message)
}
