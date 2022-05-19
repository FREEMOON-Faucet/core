
const Free = artifacts.require("FREE")

const addresses = require("../addresses")
const freeAddr = addresses.mainnet.free
const faucetAddr = addresses.mainnet.faucet


const addFreeMinter = async () => {
  const [ admin ] = await web3.eth.getAccounts()
  
  const free = await Free.at(freeAddr)
  const isMinterBefore = await free.isController(faucetAddr)

  console.log(`Address ${ faucetAddr } is FREE minter before: ${ isMinterBefore }.`)

  try {
    // await free.addController(faucetAddr, { from: admin })

    const isMinterAfter = await free.isController(faucetAddr)

    console.log(`Address ${ faucetAddr } is FREE minter after: ${ isMinterAfter }.`)
  } catch(err) {
    console.log(err.message)
  }
}

try {
  addFreeMinter()
} catch(err) {
  console.log(err.message)
}
