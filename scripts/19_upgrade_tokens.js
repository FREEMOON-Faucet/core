
const Faucet = artifacts.require("Faucet")

const addresses = require("../addresses")
const faucetAddr = addresses.mainnet.faucet
const freeAddr = addresses.mainnet.free
const fmnAddr = addresses.mainnet.fmn


const upgradeTokens = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  const faucet = await Faucet.at(faucetAddr)

  console.log(`Upgrading FREE to ${ freeAddr } & FMN to ${ fmnAddr } ...`)

  const freeBefore = await faucet.getFree()
  const fmnBefore = await faucet.getFmn()

  console.log(`FREE before: ${ freeBefore }, FMN before: ${ fmnBefore }`)

  try {
    // await faucet.upgradeTokens(freeAddr, fmnAddr, { from: admin })
    const freeAfter = await faucet.getFree()
    const fmnAfter = await faucet.getFmn()

    console.log(`Success. FREE after: ${ freeAfter }, FMN after: ${ fmnAfter }.`)
  } catch(err) {
    throw new Error(`Error: failed with ${ err.message }`)
  }
}

try {
  upgradeTokens()
} catch(err) {
  console.log(err.message)
}
