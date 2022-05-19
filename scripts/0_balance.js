
const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")
const { web3 } = require("hardhat")
const addresses = require("../addresses")

const freeAddr = addresses.mainnet.free
const fmnAddr = addresses.mainnet.fmn
const checkAddr = "0x482cdCbdd72ef307997153Ee7eb627B7a2348d34"

const token2addr = "0x9Fb9a33956351cf4fa040f65A13b835A3C8764E3"


const balance = async () => {
  //const free = await Free.at(freeAddr)
  //const fmn = await Fmn.at(fmnAddr)
  const token2 = await Free.at(token2addr)

  const fsnBalWei = await web3.eth.getBalance(checkAddr)
  const fsnBal = web3.utils.fromWei(fsnBalWei)

  //const freeBalWei = await free.balanceOf(checkAddr)
  //const freeBal = web3.utils.fromWei(freeBalWei)
  //const fmnBalWei = await fmn.balanceOf(checkAddr)
  //const fmnBal = web3.utils.fromWei(fmnBalWei)

  const token2Bal = (await token2.balanceOf(checkAddr)).toString()

  console.log(`\nFor address ${ checkAddr }:
  `)
  console.log(`FSN:    ${ fsnBal }`)
  //console.log(`FREE:   ${ freeBal }`)
  //console.log(`FMN:    ${ fmnBal }`)
  console.log(`Token2:  ${ token2Bal }`)
}

balance()
