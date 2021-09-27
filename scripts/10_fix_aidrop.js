
const Airdrop = artifacts.require("Airdrop")

const addresses = require("../addresses")

const AIRDROP_ADDRESS = addresses.mainnet.airdrop

let admin
let airdrop

const logDeployed = (msg, addr) => {
  if(addr) console.log(`${msg} ${addr}`)
  else console.log(`${msg}`)
}

const assetAddresses = [
  "0x35c2637312f69f425bba3bd01e63231091db818e",
  "0x31c2f8ffce91918e2256faa36f3dc5e609aee1e0",
  "0x6933eb3d600db893c19fece96acecb3b0ccf340a",
  "0x468d2a99bcc779fdb1f4b3b714a2757c35d6d744",
  "0xB80A6C4F2a279ec91921ca30da726c534462125C",
  "0xed0294dbd2a0e52a09c3f38a09f6e03de2c44fcf",
  "0x0c74199d22f732039e843366a236ff4f61986b32",
  "0xe96ac326ecea1a09ae6e47487c5d8717f73d5a7e",
  "0x4d0caf7bad07667d27ce13cb820c39fb60e9e1b9",
  "0x223949f336a067629bc2e9aa6d8fc84d712c8174",
  "0xeaee692277d8efd28326204751a0b689efc2720d",
  "0x60add91ae0e79416e930972594ff48ae2f34a65f",
  "0xd713b42a1695d5afe40eb8d203c285e0444b12e4",
  "0x6a69b46e072a0c9fb8c7c08bd70aaedcc0211782",
  "0x7ba62ccb1d4eb01096a55c097d770e71d6470ad4",
  "0x2331ce79654d01e3c64282d38c965924ee804b82",
  "0x3039737104055f2b3a9c1d0ecfac82e4c15f54ac",
  "0x34ea7affd817743535bc828fff709e4702a15328",
  "0x656df9ad297c80e8233c39625a09a307e0835f1e",
  "0xb443d4fd37a5f58385d75ed942880fde7f23de2f",
  "0x87d8ead810efd317af3a478506c56ab4f8969bf0",
  "0xf473900ff13d2d3b46375637ea8dc0f92b529264",
  "0x049DdC3CD20aC7a2F6C867680F7E21De70ACA9C3",
  "0x412a3fe4db6b5a73f7f460d10a009bec0c44b24c",
  "0x4d37f8c6d1aad7b8d1dfd128da20059cb9dae2df"
]

const fixAirdrop = async () => {
  [ admin ] = await web3.eth.getAccounts()
  airdrop = await Airdrop.at(AIRDROP_ADDRESS)

  try {
    logDeployed("Fixing airdrop contract ...")

    await airdrop.fixAirdropList(assetAddresses, {from: admin})

    logDeployed("Fixed airdrop successfully.")
  } catch(err) {
    throw new Error(`Fixing airdrop failed: ${err.message}`)
  }

  const newAirdropAssetCount = (await airdrop.airdropAssetCount()).toNumber()

  console.log(`
    Length of list set: ${assetAddresses.length},
    New airdrop asset list: ${newAirdropAssetCount},
    - They should be the same.
  `)
}

try {
  fixAirdrop().then(() => process.exit(0))
} catch(err) {
  console.log(err.message)
}
