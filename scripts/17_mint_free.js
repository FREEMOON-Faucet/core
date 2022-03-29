
const Free = artifacts.require("FREE")

const addresses = require("../addresses")
const freeAddr = addresses.mainnet.free


const mintFree = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  const free = await Free.at(freeAddr)

  const MINT_AMOUNT = web3.utils.toWei("123520246.132137977765922968", "ether")
  const MINT_TO = "0x829a3eFCD90d237BbCD9a021D748705ae05b188E"

  console.log(`Minting ${ web3.utils.fromWei(MINT_AMOUNT) } FREE to address ${ MINT_TO } ...`)

  const balanceBefore = web3.utils.fromWei(await free.balanceOf(MINT_TO))
  console.log(`Initial balance of receiver: ${ balanceBefore }`)

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
