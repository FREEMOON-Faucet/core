
const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")
const { web3 } = require("hardhat")
const addresses = require("../addresses")

const freeAddr = addresses.mainnet.free
const fmnAddr = addresses.mainnet.fmn
const checkAddr = "0x482cdCbdd72ef307997153Ee7eb627B7a2348d34"


const balance = async () => {
  const free = await Free.at(freeAddr)
  const fmn = await Fmn.at(fmnAddr)

  const fsnBalWei = await web3.eth.getBalance(checkAddr)
  const fsnBal = web3.utils.fromWei(fsnBalWei)

  const freeBalWei = await free.balanceOf(checkAddr)
  const freeBal = web3.utils.fromWei(freeBalWei)
  const fmnBalWei = await fmn.balanceOf(checkAddr)
  const fmnBal = web3.utils.fromWei(fmnBalWei)

  console.log(`\nFor address ${ checkAddr }:
  `)
  console.log(`FSN:    ${ fsnBal }`)
  console.log(`FREE:   ${ freeBal }`)
  console.log(`FMN:    ${ fmnBal }`)
}

balance()