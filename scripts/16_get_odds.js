
const Faucet = artifacts.require("Faucet")

const addresses = require("../addresses")

const faucetAddr = addresses.mainnet.faucet

const getOdds = async () => {
  const faucet = await Faucet.at(faucetAddr)

  let categories = []
  let odds = []

  for(let i = 0; i < 8; i++) {
    categories.push(web3.utils.fromWei(await faucet.categories(i)))
  }

  for(let i = 0; i < 8; i++) {
    odds.push((await faucet.odds(i)).toString())
  }

  console.log(categories)
  console.log(odds)
}

try {
  getOdds().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}