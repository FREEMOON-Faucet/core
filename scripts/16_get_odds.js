
const Faucet = artifacts.require("Faucet")

const addresses = require("../addresses")

const faucetAddr = addresses.mainnet.faucet

const getOdds = async () => {
  const faucet = await Faucet.at(faucetAddr)

  let categories = []
  let odds = []

  for(let i = 0; i < 8; i++) {
    let category = web3.utils.fromWei(await faucet.categories(i))
    let odd = (await faucet.odds(i)).toString()
    categories.push(category.replace(/\B(?=(\d{3})+(?!\d))/g, ","))
    odds.push(odd.replace(/\B(?=(\d{3})+(?!\d))/g, ","))
  }

  // Log the odds for category 0
  console.log(`0: <${ categories[ 0 ] } FREE: ${ odds[ 0 ] }`)

  // Log the odds for category 1-6
  for(let i = 1; i < 7; i++) {
    console.log(`${ i }: ${ categories[ i - 1 ] } to ${ categories[ i ] } FREE: 1 in ${ odds[ i ]}`)
  }

  // Log the odds for category 7
  console.log(`7: >=${ categories[ 7 ] } FREE: 1 in ${ odds[ 7 ]}`)
}

try {
  getOdds().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}