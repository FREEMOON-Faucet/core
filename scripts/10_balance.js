
const FMN = artifacts.require("FMN")
const addresses = require("../addresses")

const FMN_ADDRESS = addresses.mainnet.fmn
const CHECK_ADDR = ""


const check = async () => {
  const fmn = await FMN.at(FMN_ADDRESS)

  const bal = await fmn.balanceOf(CHECK_ADDR)
  const balFmn = web3.utils.fromWei(bal)

  console.log(`FMN balance of ${ CHECK_ADDR } : ${ balFmn }`)
}

check()