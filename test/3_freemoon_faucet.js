const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FREE = artifacts.require("FREE")
const FREEMOON = artifacts.require("FREEMOON")


let coordinator, governance, user
let faucet, free, freemoon
let categories, odds
let fromNowFiveMins, fromNowTenMins, startTime

const toWei = val => {
  return web3.utils.toWei(val, "ether")
}

const fromWei = val => {
  return web3.utils.fromWei(val)
}

const config = () => {

  categories = [
    "1",
    "100",
    "1000",
    "10000",
    "25000",
    "50000",
    "100000",
    "100000"
  ]

  odds = [
    "0",
    "1000000000",
    "100000000",
    "10000000",
    "1000000",
    "500000",
    "250000",
    "100000"
  ]

  return {
    subscriptionCost: toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: toWei("1"), // 1 FREE
    categories: categories.map(cat => toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
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


  // INITIAL VALUES
  it("Should set the correct addresses for coordinator and governance", async () => {
    const coordinatorSet = await faucet.coordinator()
    const governanceSet = await faucet.governance()

    expect(coordinatorSet).to.equal(coordinator)
    expect(governanceSet).to.equal(governance)
  })

  it("Should set correct initial faucet parameters", async () => {
    const sc = fromWei(await faucet.subscriptionCost())
    const ct = (await faucet.cooldownTime()).toString()
    const pt = (await faucet.payoutThreshold()).toString()
    const pa = fromWei(await faucet.payoutAmount())

    let { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount } = config()
    subscriptionCost = fromWei(subscriptionCost)
    payoutAmount = fromWei(payoutAmount)

    expect(sc).to.equal(subscriptionCost)
    expect(ct).to.equal(cooldownTime)
    expect(pt).to.equal(payoutThreshold)
    expect(pa).to.equal(payoutAmount)
  })

  it("Should set correct categories", async () => {
    for(let i = 0; i < 8; i++) {
      let category = fromWei(await faucet.categories(i))
      expect(category).to.equal(categories[i])
    }
  })

  it("Should set correct odds", async () => {
    for(let i = 0; i < 8; i++) {
      let odd = (await faucet.odds(i)).toString()
      expect(odd).to.equal(odds[i])
    }
  })


  // ADDRESS RESTRICTIONS
  it("Should allow coordinator address to call initialize", async () => {
    await truffleAssert.passes(faucet.initialize(free.address, freemoon.address, {from: coordinator}))
  })

  it("Should not allow non-coordinator address to call initialize", async () => {
    await truffleAssert.fails(
      faucet.initialize(free.address, freemoon.address, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only coordinator can call this function."
    )
  })

  it("Should only allow initialize to be called once", async () => {
    await faucet.initialize(free.address, freemoon.address, {from: coordinator})

    await truffleAssert.fails(
      faucet.initialize(free.address, freemoon.address, {from: coordinator}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Asset addresses can only ever be set once."
    )
  })

  it("Should allow governance address to update faucet parameters", async () => {
    await truffleAssert.passes(faucet.updateParams(toWei("2"), "86400", "24", toWei("1"), {from: governance}))
  })

  it("Should not allow non-governance address to update faucet parameters", async () => {
    await truffleAssert.fails(
      faucet.updateParams(toWei("2"), "86400", "24", toWei("1"), {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the faucet parameters."
    )
  })


  // SUBSCRIBING
  it("Should allow a valid address to subscribe to faucet")

  it("Should not allow an address overpaying or underpaying to subscribe")

  it("Should not allow a subscribed address to subscribe again")
})