const BigNumber = require("bignumber.js")
const { expect } = require("chai")

const LotteryFaucet = artifacts.require("LotteryFaucet")


let coordinator

const config = () => {
  return [
    "0",
    "100000",
    "10000",
    "1000",
    "100",
    "50",
    "25",
    "10"
  ]
}

const setUp = async () => {
  [ coordinator ] = await web3.eth.getAccounts()
  const odds = config()
  
  lotteryFaucet = await LotteryFaucet.new(
    coordinator,
    odds
  )
}

const testLottery = async id => {
  let tries = 100000
  let txHash, blockHash, result
  let wins = []
  let losses = []

  for(let i = 0; i < tries; i++) {
    txHash = web3.utils.soliditySha3(i.toString(), Math.floor(Math.random() * i))
    blockHash = web3.utils.soliditySha3(txHash)

    result = await lotteryFaucet.checkWin(id, txHash, blockHash)
    result ? wins.push(result) : losses.push(result)
  }

  return [ wins, losses ]
}

const log = (expected, w, l) => {
  console.log(`
  --------------------------------------------------------------
    Wins: ${w.length}
    Losses: ${l.length}
    Expected Win Rate: ${expected}%
    Actual Win Rate: ${(BigNumber(w.length).dividedBy(BigNumber(l.length)).multipliedBy("100")).toString()}%
  `)
}


contract("Random Number Generator Testing", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
  })

  it("Category zero: 0 in 1", async () => {

    let txHash, blockHash, result

    txHash = web3.utils.soliditySha3("test")
    blockHash = web3.utils.soliditySha3(txHash)
    result = await lotteryFaucet.checkWin(0, txHash, blockHash)

    expect(result).to.be.false
  })

  it("Category one: 1 in 1 billion (100,000 in testing)", async () => {
    let [ wins, losses ] = await testLottery(1)
    log("0.001", wins, losses)
  })

  it("Category two: 1 in 100 million (1 in 10,000 in testing)", async () => {
    let [ wins, losses ] = await testLottery(2)
    log("0.01", wins, losses)
  })

  it("Category three: 1 in 10 million (1 in 1,000 in testing)", async () => {
    let [ wins, losses ] = await testLottery(3)
    log("0.1", wins, losses)
  })

  it("Category four: 1 in 1 million (1 in 100 in testing)", async () => {
    let [ wins, losses ] = await testLottery(4)
    log("1", wins, losses)
  })

  it("Category five: 1 in 500 thousand (1 in 50 in testing)", async () => {
    let [ wins, losses ] = await testLottery(5)
    log("2", wins, losses)
  })

  it("Category six: 1 in 250 thousand (1 in 25 in testing)", async () => {
    let [ wins, losses ] = await testLottery(6)
    log("4", wins, losses)
  })

  it("Category seven: 1 in 100 thousand (1 in 10 in testing)", async () => {
    let [ wins, losses ] = await testLottery(7)
    log("10", wins, losses)
  })
})