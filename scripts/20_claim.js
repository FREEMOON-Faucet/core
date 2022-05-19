
const Faucet = artifacts.require("Faucet")
const Free = artifacts.require("FREE")

const addresses = require("../addresses")
const faucetAddr = addresses.mainnet.faucet
const freeAddr = addresses.mainnet.free


const claim = async () => {
  const [ admin ] = await web3.eth.getAccounts()

  const faucet = await Faucet.at(faucetAddr)
  const free = await Free.at(freeAddr)

  console.log(`Claiming for address ${ admin } ...`)

  const freeBalWeiBefore = await free.balanceOf(admin)
  const freeBalBefore = web3.utils.fromWei(freeBalWeiBefore)

  console.log(`FREE bal before: ${ freeBalBefore }`)

  try {
    // await faucet.claim(admin, { from: admin })

    const freeBalWeiAfter = await free.balanceOf(admin)
    const freeBalAfter = web3.utils.fromWei(freeBalWeiAfter)

    console.log(`Success. FREE bal after: ${ freeBalAfter }`)
  } catch(err) {
    throw new Error(`Error: failed with ${ err.message }`)
  }
}

try {
  claim()
} catch(err) {
  console.log(err.message)
}
