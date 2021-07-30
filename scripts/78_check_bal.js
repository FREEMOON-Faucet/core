const FREE = artifacts.require("FREE")
const FMN = artifacts.require("FMN")

const GOV = "0xfa321bf55bda4df52883c297a2be7e75dce2813c"
const freeAddress = "0x6403eDe3b7604ea4883670c670BeA288618BD5F2"
const fmnAddress = "0xB80A6C4F2a279ec91921ca30da726c534462125C"

const check = async () => {
  const free = await FREE.at(freeAddress)
  const fmn = await FMN.at(fmnAddress)

  const govBalFree = web3.utils.fromWei(await free.balanceOf(GOV))
  const govBalFmn = web3.utils.fromWei(await fmn.balanceOf(GOV))

  console.log(`FREE balance: ${govBalFree}`)
  console.log(`FMN balance: ${govBalFmn}`)
}

try {
  check()
} catch(err) {
  console.log(err.message)
}
