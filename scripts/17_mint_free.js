
const Free = artifacts.require("FREE")

const addresses = require("../addresses")
const freeAddr = addresses.mainnet.free


const mintFree = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  const free = await Free.at(freeAddr)

  const MINT_AMOUNT = web3.utils.toWei("", "ether")
  const MINT_TO = ""

  console.log(`Minting ${ web3.utils.fromWei(MINT_AMOUNT) } FREE to address ${ MINT_TO } ...`)

  const balanceBefore = web3.utils.fromWei(await free.balanceOf(MINT_TO))
  console.log(`Initial balance of receiver: ${ balanceBefore } FREE`)

  try {
    // await free.mint(MINT_TO, MINT_AMOUNT, { from: admin })
    const balanceAfter = web3.utils.fromWei(await free.balanceOf(MINT_TO))
    console.log(`Success, balance of receiver: ${ balanceAfter } FREE`)
  } catch(err) {
    throw new Error(`Error: failed with ${ err.message }`)
  }
}

try {
  mintFree()
} catch(err) {
  console.log(err.message)
}
