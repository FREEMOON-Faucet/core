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
    [ "100", "100000" ],
    [ "1000", "10000" ],
    [ "10000", "1000" ],
    [ "25000", "100" ],
    [ "50000", "50" ],
    [ "100000", "25" ],
    [ "100000", "10" ]
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

const testLottery = async (id, tries) => {
  let txHash, blockHash, result
  let wins = []
  let losses = []

  for(let i = 0; i < tries; i++) {
    txHash = web3.utils.soliditySha3(i.toString())
    blockHash = web3.utils.soliditySha3(txHash)

    result = await faucet.checkWin(id, txHash, blockHash)
    result ? wins.push(result) : losses.push(result)
  }

  return [ wins, losses ]
}


contract("Freemoon Faucet", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })

  it("Category zero: 0 in 1", async () => {
    console.log("--- RANDOM NUMBER GENERATOR TESTING ---")

    let txHash, blockHash, result

    txHash = web3.utils.soliditySha3("test")
    blockHash = web3.utils.soliditySha3(txHash)
    result = await faucet.checkWin(0, txHash, blockHash)

    expect(result).to.be.false
  })

  it("Category one: 1 in 1 billion (100,000 in testing)", async () => {
    let [ wins, losses ] = await testLottery(1, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 0.0001%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })

  it("Category two: 1 in 100 million (10,000 in testing)", async () => {
    let [ wins, losses ] = await testLottery(2, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 0.01%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })

  it("Category three: 1 in 10 million (1,000 in testing)", async () => {
    let [ wins, losses ] = await testLottery(3, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 0.1%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })

  it("Category four: 1 in 1 million (100 in testing)", async () => {
    let [ wins, losses ] = await testLottery(4, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 1%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })

  it("Category five: 1 in 500 thousand (50 in testing)", async () => {
    let [ wins, losses ] = await testLottery(5, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 2%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })

  it("Category six: 1 in 250 thousand (25 in testing)", async () => {
    let [ wins, losses ] = await testLottery(6, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 4%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })

  it("Category seven: 1 in 100 thousand (10 in testing)", async () => {
    let [ wins, losses ] = await testLottery(7, 10000)
    
    console.log(`
      Wins: ${wins.length}
      Losses: ${losses.length}
      Expected Ratio: 10%
      Actual Ratio: ${(wins.length / losses.length) * 100}%
    `)
  })
})