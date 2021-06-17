const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FREE = artifacts.require("FREE")
const FREEMOON = artifacts.require("FREEMOON")


let coordinator, governance, user
let faucet, free, freemoon
let fromNowFiveMins, fromNowTenMins, startTime

const toWei = val => {
  return web3.utils.toWei(val, "ether")
}

const fromWei = val => {
  return web3.utils.fromWei(val)
}

const config = () => {
  const lottery = [
    [ "1", "0" ],
    [ "100", "1000000000" ],
    [ "1000", "100000000" ],
    [ "10000", "10000000" ],
    [ "25000", "1000000" ],
    [ "50000", "500000" ],
    [ "100000", "250000" ],
    [ "100000", "100000" ]
  ]

  return {
    subscriptionCost: toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: toWei("1"), // 1 FREE
    categories: lottery.map(cat => toWei(cat[0])), // balances required for each FREEMOON lottery category
    odds: lottery.map(cat => cat[1]) // odds of winning for each category
  }
}

const setUp = async () => {
  [ coordinator, governance, user, airdrop ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, categories, odds } = config()
  
  faucet = await Faucet.new(
    governance,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    categories,
    odds
  )

  free = await FREE.new(
    "Free Token",
    "FREE",
    18,
    governance,
    airdrop,
    faucet.address
  )

  freemoon = await FREEMOON.new(
    "Freemoon Token",
    "FREEMOON",
    18,
    governance,
    faucet.address
  )

  await faucet.initialize(free.address, freemoon.address)
}

const setTimes = async () => {
  fromNowFiveMins = Math.floor(Date.now() / 1000) + 300
  fromNowTenMins = Math.floor(Date.now() / 1000) + 600

  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp
}

const advanceBlockAtTime = async time => {
  let timeResult
  await web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [ time ],
      id: new Date().getTime(),
    },
    (error, res) => {
      if(error) {
        timeResult = error
        return timeResult
      }
    }
  )
}


contract("Freemoon Faucet", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })

  it("TEST", async () => {
    let results = []
    for(let i = 0; i < 8; i++) {
      const res = await faucet.checkWin(i)
      results.push(res)
    }
    console.log(results)
  })
})