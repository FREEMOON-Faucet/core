const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FREE = artifacts.require("FREE")
const FREEMOON = artifacts.require("FREEMOON")

const utils = require("../scripts/99_utils")


let coordinator, governance, user, freeHolder1
let faucet, free, freemoon
let categories, odds
let fromNowOneHour, startTime, newTime

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
    "1" // 100% chance of winning for testing only
  ]

  return {
    subscriptionCost: utils.toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: utils.toWei("1"), // 1 FREE
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const setUp = async () => {
  [ coordinator, governance, user, airdrop, freeHolder1 ] = await web3.eth.getAccounts()
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
    faucet.address,
    {from: freeHolder1}
  )

  freemoon = await FREEMOON.new(
    "Freemoon Token",
    "FREEMOON",
    18,
    governance,
    faucet.address
  )
}

const initialize = async () => {
  await faucet.initialize(free.address, freemoon.address, {from: coordinator})
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneHour = startTime + 3605
}

const advanceBlockAtTime = async time => {
  await web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [ time ],
      id: new Date().getTime(),
    },
    (err, res) => {
      if(err) {
        newTime = err
      }
    }
  )
  const newBlock = await web3.eth.getBlock("latest")
  newTime = newBlock.timestamp
}

const enterIntoDraw = async (account, lottery, tx, block) => {
  return await faucet.resolveEntry(account, lottery, tx, block, {from: coordinator})
}


contract("The FREEMOON Faucet", async () => {
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
    const sc = utils.fromWei(await faucet.subscriptionCost())
    const ct = (await faucet.cooldownTime()).toString()
    const pt = (await faucet.payoutThreshold()).toString()
    const pa = utils.fromWei(await faucet.payoutAmount())

    let { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount } = config()
    subscriptionCost = utils.fromWei(subscriptionCost)
    payoutAmount = utils.fromWei(payoutAmount)

    expect(sc).to.equal(subscriptionCost)
    expect(ct).to.equal(cooldownTime)
    expect(pt).to.equal(payoutThreshold)
    expect(pa).to.equal(payoutAmount)
  })

  it("Should set correct categories", async () => {
    for(let i = 0; i < 8; i++) {
      let category = utils.fromWei(await faucet.categories(i))
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
    await truffleAssert.passes(faucet.updateParams(user, utils.toWei("2"), "86400", "24", utils.toWei("1"), {from: governance}))
  })

  it("Should not allow non-governance address to update faucet parameters", async () => {
    await truffleAssert.fails(
      faucet.updateParams(user, utils.toWei("2"), "86400", "24", utils.toWei("1"), {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the faucet parameters."
    )
  })


  // SUBSCRIBING
  it("Should allow a valid address to subscribe to faucet", async () => {
    await initialize()
    await truffleAssert.passes(faucet.subscribe(user, {value: utils.toWei("1")}))
  })

  it("Should not allow an address overpaying or underpaying to subscribe", async () => {
    await initialize()

    await truffleAssert.fails(
      faucet.subscribe(user, {value: utils.toWei("1.1")}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Invalid FSN amount sent for subscription cost."
    )

    await truffleAssert.fails(
      faucet.subscribe(user, {value: utils.toWei("0.9")}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Invalid FSN amount sent for subscription cost."
    )
  })

  it("Should not allow a subscribed address to subscribe again", async () => {
    await initialize()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    
    await truffleAssert.fails(
      faucet.subscribe(user, {value: utils.toWei("1")}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Given address is already subscribed."
    )
  })


  // ENTERING
  it("Should allow a subscribed address to enter at a valid time, and receive 1 FREE", async () => {
    await initialize()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const freeBalBefore = Number(utils.fromWei(await free.balanceOf(user)))

    await truffleAssert.passes(faucet.enter(user))
    const freeBalAfter = Number(utils.fromWei(await free.balanceOf(user)))
    
    expect(freeBalAfter).to.equal(freeBalBefore + 1)
  })

  it("Should emit the entry event for a valid address", async () => {
    await initialize()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const result = await faucet.enter(user)
    expect(result.logs[0].event).to.equal("Entry")
  })

  it("Should allow an address to enter again if it has waited the required cooldown period", async () => {
    await initialize()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await faucet.enter(user)
    await advanceBlockAtTime(fromNowOneHour)

    await truffleAssert.passes(faucet.enter(user))
  })

  it("Should not allow an address to enter if it has not waited the required cooldown period", async () => {
    await initialize()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await faucet.enter(user)
    
    await truffleAssert.fails(
      faucet.enter(user),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: You must wait for your cooldown to end before entering again."
    )
  })

  it("Should not allow an unsubscribed address to enter", async () => {
    await initialize()
    await truffleAssert.fails(
      faucet.enter(user),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only subscribed addresses can enter the draw."
    )
  })


  // COORDINATOR EVENT LISTENER
  it("Should enter the entry into the draw", async () => {
    await initialize()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.enter(user))

    await enterIntoDraw(user, 1, txHash, blockHash)
  })


  // WINNING THE DRAW
  it("Should emit \"Win\" event and change odds by 10% on lottery win", async () => {
    await initialize()
    await faucet.subscribe(freeHolder1, {from: freeHolder1, value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.enter(freeHolder1, {from: freeHolder1}))
    const result = await enterIntoDraw(freeHolder1, 7, txHash, blockHash)

    expect(result.logs[0].event).to.equal("Win")
  })

  it("Should award 1 FREEMOON after winning the lottery", async () => {
    await initialize()
    await faucet.subscribe(freeHolder1, {from: freeHolder1, value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.enter(freeHolder1, {from: freeHolder1}))
    const freemoonBalBefore = Number(utils.fromWei(await freemoon.balanceOf(freeHolder1)))
    const result = await enterIntoDraw(freeHolder1, 7, txHash, blockHash)

    expect(result.logs[0].event).to.equal("Win")

    const freemoonBalAfter = Number(utils.fromWei(await freemoon.balanceOf(freeHolder1)))

    expect(freemoonBalAfter).to.equal(freemoonBalBefore + 1)
  })


  // LOSING THE DRAW
  it("Should emit \"Loss\" event on lottery loss", async () => {
    await initialize()
    await faucet.subscribe(freeHolder1, {from: freeHolder1, value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.enter(freeHolder1, {from: freeHolder1}))
    const result = await enterIntoDraw(freeHolder1, 0, txHash, blockHash)

    expect(result.logs[0].event).to.equal("Loss")
  })
})