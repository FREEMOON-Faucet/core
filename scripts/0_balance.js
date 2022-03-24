
const FMN = artifacts.require("FMN")
const addresses = require("../addresses")

const FMN_ADDRESS = addresses.mainnet.oldFmn
const CHECK_ADDR = "0x9867951c59b3506051748336a29be1ff919f157e"


const check = async () => {
  const fmn = await FMN.at(FMN_ADDRESS)

  const bal = await fmn.balanceOf(CHECK_ADDR)
  const balFmn = web3.utils.fromWei(bal)

  console.log(`FMN balance of ${ CHECK_ADDR } : ${ balFmn }`)
}

check()