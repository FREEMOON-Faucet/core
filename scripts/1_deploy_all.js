const Faucet = artifacts.require("Faucet")
const FREE = artifacts.require("FREE")
const FREEMOON = artifacts.require("FREEMOON")


let owner, governance, user, airdrop
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

const setTimes = async () => {
  fromNowFiveMins = Math.floor(Date.now() / 1000) + 300
  fromNowTenMins = Math.floor(Date.now() / 1000) + 600

  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp
}

const deployFaucet = async () => {
  [ owner, governance, user, airdrop ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, categories, odds } = config()
  
  const faucet = await Faucet.new(
    governance,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    categories,
    odds,
    {from: owner}
  )

  const free = await FREE.new(
    "Free Token",
    "FREE",
    18,
    governance,
    airdrop,
    faucet.address
  )
}

deployFaucet()
