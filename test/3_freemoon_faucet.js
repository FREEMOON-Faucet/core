const { expect } = require("chai")
const BigNumber = require("bignumber.js")
const truffleAssert = require("truffle-assertions")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Free = artifacts.require("FREE")
const Freemoon = artifacts.require("FMN")

const utils = require("../scripts/99_utils")


let coordinator, governance, admin, user, freeHolder
let faucetLayout, faucetProxy, faucet
let free, freemoon
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
    hotWalletLimit: utils.toWei("10"), // 10 FSN max wallet balance
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const setUp = async () => {
  [ admin, governance, coordinator, user, airdrop, freeHolder ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds } = config()

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})
  
  await faucet.initialize(
    admin,
    coordinator,
    governance,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    categories,
    odds
  )

  free = await Free.new(
    "Free Token",
    "FREE",
    18,
    governance,
    airdrop,
    faucet.address,
    {from: freeHolder}
  )

  freemoon = await Freemoon.new(
    "Freemoon Token",
    "FMN",
    18,
    governance,
    faucet.address,
    {from: freeHolder}
  )
}

const setAssets = async () => {
  await faucet.setAssets(free.address, freemoon.address, {from: admin})
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneHour = startTime + 3605
}

const enterIntoDraw = async (account, lottery, tx, block) => {
  return await faucet.resolveEntry(account, lottery, tx, block, {from: coordinator})
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

const balanceDown = async () => {
  const bal = utils.fromWei(await web3.eth.getBalance(coordinator))
  if(bal > 1) {
    await web3.eth.sendTransaction({from: coordinator, to: admin, value: utils.toWei(String(bal - 1), "ether")})
  }
}

const balanceUp = async () => {
  const bal = utils.fromWei(await web3.eth.getBalance(admin))
  if(bal > 1000) {
    await web3.eth.sendTransaction({from: admin, to: coordinator, value: utils.toWei("10", "ether")})
  }
}


contract("The FREEMOON Faucet", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })


  // INITIAL VALUES
  it("Should set the correct addresses for coordinator and governance", async () => {
    const adminSet = await faucet.admin()
    const coordinatorSet = await faucet.coordinator()
    const governanceSet = await faucet.governance()

    expect(adminSet).to.equal(admin)
    expect(coordinatorSet).to.equal(coordinator)
    expect(governanceSet).to.equal(governance)
  })

  it("Should set correct initial faucet parameters", async () => {
    const sc = utils.fromWei(await faucet.subscriptionCost())
    const ct = (await faucet.cooldownTime()).toString()
    const pt = (await faucet.payoutThreshold()).toString()
    const pa = utils.fromWei(await faucet.payoutAmount())
    const hwl = utils.fromWei(await faucet.hotWalletLimit())

    let { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit } = config()
    subscriptionCost = utils.fromWei(subscriptionCost)
    payoutAmount = utils.fromWei(payoutAmount)
    hotWalletLimit = utils.fromWei(hotWalletLimit)

    expect(sc).to.equal(subscriptionCost)
    expect(ct).to.equal(cooldownTime)
    expect(pt).to.equal(payoutThreshold)
    expect(pa).to.equal(payoutAmount)
    expect(hwl).to.equal(hotWalletLimit)
  })

  it("Should set correct categories", async () => {
    for(let i = 0; i < 8; i++) {
      let category = utils.fromWei(await faucet.categories(i))
      expect(category).to.equal(categories[i])
    }
  })

  it("Should set correct odds", async () => {
    for(let i = 0; i < 7; i++) {
      let odd = (await faucet.odds(i)).toString()
      expect(odd).to.equal(odds[i])
    }
  })


  // ADDRESS RESTRICTIONS
  it("Should allow admin address to call setAssets", async () => {
    await truffleAssert.passes(faucet.setAssets(free.address, freemoon.address, {from: admin}))
  })

  it("Should not allow non-admin address to call setAssets", async () => {
    await truffleAssert.fails(
      faucet.setAssets(free.address, freemoon.address, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the admin address can perform this operation."
    )
  })

  it("Should only allow setAssets to be called once", async () => {
    await faucet.setAssets(free.address, freemoon.address, {from: admin})
    
    await truffleAssert.fails(
      faucet.setAssets(free.address, freemoon.address, {from: admin}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Assets can only ever be set once."
    )
  })

  it("Should only allow initialize to be called once", async () => {
    const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds } = config()

    await truffleAssert.fails(
      faucet.initialize(
        admin,
        coordinator,
        governance,
        subscriptionCost,
        cooldownTime,
        payoutThreshold,
        payoutAmount,
        hotWalletLimit,
        categories,
        odds,
        {from: admin}
      ),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Faucet contract can only be initialized once."
    )
  })

  it("Should allow governance address to update faucet parameters", async () => {
    await truffleAssert.passes(faucet.updateParams(user, admin, utils.toWei("2"), "86400", "24", utils.toWei("1"), utils.toWei("11"), {from: governance}))
  })

  it("Should not allow non-governance address to update faucet parameters", async () => {
    await truffleAssert.fails(
      faucet.updateParams(user, admin, utils.toWei("2"), "86400", "24", utils.toWei("1"), utils.toWei("11"), {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the governance address can perform this operation."
    )
  })


  // SUBSCRIBING
  it("Should allow a valid address to subscribe to faucet", async () => {
    await setAssets()
    await truffleAssert.passes(faucet.subscribe(user, {value: utils.toWei("1")}))
  })

  it("Should send FREE to claiming address when it is base address", async () => {
    await setAssets()

    await faucet.subscribe(user, {from: user, value: utils.toWei("1")})

    const balBefore = Number(utils.fromWei(await free.balanceOf(user)))
    await faucet.claim(user, {from: user})
    const balAfter = Number(utils.fromWei(await free.balanceOf(user)))

    expect(balAfter).to.equal(balBefore + 1)
  })

  it("Should send FREE to other address when claiming address is not base address", async () => {
    await setAssets()

    await faucet.subscribe(user, {from: admin, value: utils.toWei("1")})

    const balUserBefore = Number(utils.fromWei(await free.balanceOf(user)))
    const balAdminBefore = Number(utils.fromWei(await free.balanceOf(admin)))

    await faucet.claim(user, {from: user})

    const balUserAfter = Number(utils.fromWei(await free.balanceOf(user)))
    const balAdminAfter = Number(utils.fromWei(await free.balanceOf(admin)))

    expect(balUserAfter).to.equal(balUserBefore)
    expect(balAdminAfter).to.equal(balAdminBefore + 1)
  })

  it("Should send FMN to winning address when it is base address", async () => {
    await setAssets()

    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})

    const balBefore = Number(utils.fromWei(await freemoon.balanceOf(freeHolder)))

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))
    const result = await enterIntoDraw(freeHolder, 7, txHash, blockHash)

    const balAfter = Number(utils.fromWei(await freemoon.balanceOf(freeHolder)))

    expect(balAfter).to.equal(balBefore + 1)
  })

  it("Should send FMN to other address when winning address is not base address", async () => {
    await setAssets()

    await faucet.subscribe(freeHolder, {from: user, value: utils.toWei("1")})

    const balUserBefore = Number(utils.fromWei(await freemoon.balanceOf(user)))
    const balFHBefore = Number(utils.fromWei(await freemoon.balanceOf(freeHolder)))

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: user}))
    const result = await enterIntoDraw(freeHolder, 7, txHash, blockHash)

    const balUserAfter = Number(utils.fromWei(await freemoon.balanceOf(user)))
    const balFHAfter = Number(utils.fromWei(await freemoon.balanceOf(freeHolder)))

    expect(balFHAfter).to.equal(balFHBefore)
    expect(balUserAfter).to.equal(balUserBefore + 1)
  })

  it("Should send fees to coordinator address if balance is below hotWalletLimit", async () => {
    await setAssets()
    await balanceDown() // Here we lower the balance to less than hotWalletLimit

    const coordinatorBalBefore = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))
    const faucetBalBefore = Number(utils.fromWei(await web3.eth.getBalance(faucet.address)))

    await faucet.subscribe(user, {value: utils.toWei("1")})

    const coordinatorBalAfter = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))
    const faucetBalAfter = Number(utils.fromWei(await web3.eth.getBalance(faucet.address)))

    expect(coordinatorBalAfter).to.equal(coordinatorBalBefore + 1)
    expect(faucetBalAfter).to.equal(faucetBalBefore)
  })

  it("Should withhold fees if coordinator address has hotWalletLimit", async () => {
    await setAssets()
    await balanceUp()

    const coordinatorBalBefore = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))
    const faucetBalBefore = Number(utils.fromWei(await web3.eth.getBalance(faucet.address)))

    await faucet.subscribe(user, {value: utils.toWei("1")})

    const coordinatorBalAfter = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))
    const faucetBalAfter = Number(utils.fromWei(await web3.eth.getBalance(faucet.address)))

    expect(coordinatorBalAfter).to.equal(coordinatorBalBefore)
    expect(faucetBalAfter).to.equal(faucetBalBefore + 1)
  })

  it("Should send fees to coordinator until hotWalletLimit reached", async () => {
    await setAssets()
    await balanceDown()
    let accounts = await web3.eth.getAccounts()
    let i, balNow
    const { hotWalletLimit } = config()
    let hwl = Number(utils.fromWei(hotWalletLimit))

    const balBefore = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))

    for(i = 0; i < hwl; i++) {
      await faucet.subscribe(accounts[i + 1], {value: utils.toWei("1")})
      balNow = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))
      expect(balNow).to.equal(balBefore + 1 + i)
    }

    await faucet.subscribe(accounts[i + 2], {value: utils.toWei("1")})
    const balAfter = Number(utils.fromWei(await web3.eth.getBalance(coordinator)))
    expect(balAfter).to.equal(balNow)
  })

  it("Should not allow an address overpaying or underpaying to subscribe", async () => {
    await setAssets()

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
    await setAssets()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    
    await truffleAssert.fails(
      faucet.subscribe(user, {value: utils.toWei("1")}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Given address is already subscribed."
    )
  })


  // CLAIMING
  it("Should allow a subscribed address to claim at a valid time, and receive 1 FREE", async () => {
    await setAssets()
    await faucet.subscribe(user, {from: user, value: utils.toWei("1")})
    const freeBalBefore = Number(utils.fromWei(await free.balanceOf(user)))

    await truffleAssert.passes(faucet.claim(user))
    const freeBalAfter = Number(utils.fromWei(await free.balanceOf(user)))
    
    expect(freeBalAfter).to.equal(freeBalBefore + 1)
  })

  it("Should emit the entry event for a valid address", async () => {
    await setAssets()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const result = await faucet.claim(user)
    expect(result.logs[0].event).to.equal("Entry")
  })

  it("Should allow an address to claim again if it has waited the required cooldown period", async () => {
    await setAssets()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await faucet.claim(user)
    await advanceBlockAtTime(fromNowOneHour)

    await truffleAssert.passes(faucet.claim(user))
  })

  it("Should not allow an address to claim if it has not waited the required cooldown period", async () => {
    await setAssets()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await faucet.claim(user)
    
    await truffleAssert.fails(
      faucet.claim(user),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: You must wait for your cooldown to end before claiming again."
    )
  })

  it("Should not allow an unsubscribed address to claim", async () => {
    await setAssets()
    await truffleAssert.fails(
      faucet.claim(user),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only subscribed addresses can claim FREE."
    )
  })


  // COORDINATOR EVENT LISTENER
  it("Should enter the entry into the draw", async () => {
    await setAssets()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.claim(user))

    await enterIntoDraw(user, 1, txHash, blockHash)
  })


  // WINNING THE DRAW
  it("Should emit \"Win\" event and change odds by 10% on lottery win", async () => {
    await setAssets()
    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})

    let oddsBefore = []
    for(let i = 0; i < 8; i++) {
      oddsBefore.push((await faucet.odds(i)).toNumber())
    }

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))
    const result = await enterIntoDraw(freeHolder, 7, txHash, blockHash)

    let oddsAfter = []
    for(let i = 0; i < 8; i++) {
      oddsAfter.push((await faucet.odds(i)).toNumber())
    }
    for(let i = 0; i < 7; i++) { // ignoring the last category seeing as it is 1 in testing
      expect(oddsAfter[i]).to.equal(BigNumber(oddsBefore[i]).multipliedBy("1.1").toNumber())
    }

    expect(result.logs[0].event).to.equal("Win")
  })

  it("Should award 1 FMN after winning the lottery", async () => {
    await setAssets()

    await faucet.subscribe(user, {from: user, value: utils.toWei("1")})
    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})

    let claims = (await faucet.claims()).toNumber()
    expect(claims).to.equal(0)
    let claimsSinceWin = (await faucet.claimsSinceLastWin()).toNumber()
    expect(claimsSinceWin).to.equal(0)

    await faucet.claim(user, {from: user})

    claims = (await faucet.claims()).toNumber()
    claimsSinceLastWin = (await faucet.claimsSinceLastWin()).toNumber()
    expect(claims).to.equal(1)
    expect(claimsSinceLastWin).to.equal(1)

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))
    const freemoonBalBefore = Number(utils.fromWei(await freemoon.balanceOf(freeHolder)))
    const result = await enterIntoDraw(freeHolder, 7, txHash, blockHash)

    claims = (await faucet.claims()).toNumber()
    claimsSinceLastWin = (await faucet.claimsSinceLastWin()).toNumber()
    expect(claims).to.equal(2)
    expect(claimsSinceLastWin).to.equal(0)

    expect(result.logs[0].event).to.equal("Win")

    const freemoonBalAfter = Number(utils.fromWei(await freemoon.balanceOf(freeHolder)))

    expect(freemoonBalAfter).to.equal(freemoonBalBefore + 1)
  })


  // LOSING THE DRAW
  it("Should emit \"Loss\" event on lottery loss", async () => {
    await setAssets()
    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))
    const result = await enterIntoDraw(freeHolder, 0, txHash, blockHash)

    expect(result.logs[0].event).to.equal("Loss")
  })
})