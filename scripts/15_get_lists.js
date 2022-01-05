
const AirdropV2 = artifacts.require("AirdropV2")

const dotenv = require("dotenv")
const addresses = require("../addresses")

dotenv.config()

const AIRDROP = addresses.mainnet.airdropV2

let admin, airdrop


const getLists = async () => {
  [ admin ] = await web3.eth.getAccounts()

  airdrop = await AirdropV2.at(AIRDROP, { from: admin })
  
  const farmCount = await airdrop.airdropAssetCount().toNumber()

  let results = []

  for(let i = 0; i < farmCount; i++) {
    results.push(await airdrop.farmAssets(i))
  }

  console.log(results)
}

getLists()