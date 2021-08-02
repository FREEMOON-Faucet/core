const { expect } = require("chai")
const BigNumber = require("bignumber.js")
const truffleAssert = require("truffle-assertions")

const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Airdrop = artifacts.require("Airdrop")

const utils = require("../scripts/99_utils")


let coordinator, governance, admin, user, freeHolder
let faucetLayout, faucetProxy, faucet
let free, fmn
let categories, odds
let fromNowOneHour, startTime, newTime

const config = () => {

  categories = [
    "1",            // 0
    "100",          // 1
    "1000",         // 2
    "10000",        // 3
    "25000",        // 4
    "50000",        // 5
    "100000",       // 6
    "100000"        // 7
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

const setUpCategories = async () => {
  const accs = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
    "0x0000000000000000000000000000000000000005",
    "0x0000000000000000000000000000000000000006",
    "0x0000000000000000000000000000000000000007",
    "0x0000000000000000000000000000000000000008"
  ]

  await free.transfer(accs[1], utils.toWei("1"), {from: freeHolder})
  await free.transfer(accs[2], utils.toWei("100"), {from: freeHolder})
  await free.transfer(accs[3], utils.toWei("1000"), {from: freeHolder})
  await free.transfer(accs[4], utils.toWei("10000"), {from: freeHolder})
  await free.transfer(accs[5], utils.toWei("25000"), {from: freeHolder})
  await free.transfer(accs[6], utils.toWei("50000"), {from: freeHolder})
  await free.transfer(accs[7], utils.toWei("100000"), {from: freeHolder})

  return accs
}

const setUp = async () => {
  [ admin, coordinator, governance, user, freeHolder ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds } = config()

  free = await Free.new(
    "The FREE Token",
    "FREE",
    18,
    admin,
    governance,
    {from: admin}
  )

  fmn = await Fmn.new(
    "The FREEMOON Token",
    "FMN",
    18,
    admin,
    governance,
    {from: admin}
  )

  await free.initialMint(freeHolder, {from: admin})
  await fmn.initialMint(freeHolder, {from: admin})

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})
  
  await faucet.initialize(
    admin,
    governance,
    free.address,
    fmn.address,
    categories,
    odds,
    {from: admin}
  )

  await faucet.updateParams(
    admin,
    coordinator,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    {from: admin}
  )

  airdrop = await Airdrop.new()

  await free.setMintInvokers(faucet.address, airdrop.address, {from: admin})
  await fmn.setMintInvokers(faucet.address, {from: admin})
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneHour = startTime + 3605
}

const checkAndReward = async (account, txHash, blockHash) => {
  const cat = (await faucet.getCategory(account)).toNumber()
  let result = await faucet.checkIfWin(cat, txHash, blockHash)
  let enteredValue = new BigNumber(result["0"].toString())
  let limitValue = new BigNumber(result["1"].toString())

  if(limitValue.isEqualTo("0")) {
    receipt = "Loss"
  } else if(enteredValue.isLessThanOrEqualTo(limitValue)) {
    receipt = await faucet.rewardAndUpdate(account, cat, txHash, blockHash, {from: coordinator})
  } else {
    receipt = "Loss"
  }

  return receipt
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


contract("Faucet Contract", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })

  // INITIAL VALUES
  it("Should set the correct addresses for admin, coordinator and governance", async () => {
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
  it("Should only allow initialize to be called once", async () => {
    const { categories, odds } = config()

    await truffleAssert.fails(
      faucet.initialize(
        admin,
        governance,
        free.address,
        fmn.address,
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
    await truffleAssert.passes(faucet.subscribe(user, {value: utils.toWei("1")}))
  })

  it("Should send FREE to claiming address when it is base address", async () => {
    await faucet.subscribe(user, {from: user, value: utils.toWei("1")})

    const balBefore = Number(utils.fromWei(await free.balanceOf(user)))
    await faucet.claim(user, {from: user})
    const balAfter = Number(utils.fromWei(await free.balanceOf(user)))

    expect(balAfter).to.equal(balBefore + 1)
  })

  it("Should send FREE to other address when claiming address is not base address", async () => {
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
    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})

    const balBefore = Number(utils.fromWei(await fmn.balanceOf(freeHolder)))

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))
    await checkAndReward(freeHolder, txHash, blockHash)

    const balAfter = Number(utils.fromWei(await fmn.balanceOf(freeHolder)))

    expect(balAfter).to.equal(balBefore + 1)
  })

  it("Should send FMN to other address when winning address is not base address", async () => {
    await faucet.subscribe(freeHolder, {from: user, value: utils.toWei("1")})

    const balUserBefore = Number(utils.fromWei(await fmn.balanceOf(user)))
    const balFHBefore = Number(utils.fromWei(await fmn.balanceOf(freeHolder)))

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: user}))
    await checkAndReward(freeHolder, txHash, blockHash)

    const balUserAfter = Number(utils.fromWei(await fmn.balanceOf(user)))
    const balFHAfter = Number(utils.fromWei(await fmn.balanceOf(freeHolder)))

    expect(balFHAfter).to.equal(balFHBefore)
    expect(balUserAfter).to.equal(balUserBefore + 1)
  })

  it("Should send fees to coordinator address if balance is below hotWalletLimit", async () => {
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
    await faucet.subscribe(user, {value: utils.toWei("1")})
    
    await truffleAssert.fails(
      faucet.subscribe(user, {value: utils.toWei("1")}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Given address is already subscribed."
    )
  })


  // CLAIMING
  it("Should allow a subscribed address to claim at a valid time, and receive 1 FREE", async () => {
    await faucet.subscribe(user, {from: user, value: utils.toWei("1")})
    const freeBalBefore = Number(utils.fromWei(await free.balanceOf(user)))

    await truffleAssert.passes(faucet.claim(user))
    const freeBalAfter = Number(utils.fromWei(await free.balanceOf(user)))
    
    expect(freeBalAfter).to.equal(freeBalBefore + 1)
  })

  it("Should emit the entry event for a valid address", async () => {
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const result = await faucet.claim(user)
    expect(result.logs[0].event).to.equal("Entry")
  })

  it("Should allow an address to claim again if it has waited the required cooldown period", async () => {
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await faucet.claim(user)
    await advanceBlockAtTime(fromNowOneHour)

    await truffleAssert.passes(faucet.claim(user))
  })

  it("Should not allow an address to claim if it has not waited the required cooldown period", async () => {
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await faucet.claim(user)
    
    await truffleAssert.fails(
      faucet.claim(user),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: You must wait for your cooldown to end before claiming again."
    )
  })

  it("Should not allow an unsubscribed address to claim", async () => {
    await truffleAssert.fails(
      faucet.claim(user),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only subscribed addresses can claim FREE."
    )
  })


  // COORDINATOR EVENT LISTENER
  it("Should enter the entry into the draw", async () => {
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const { txHash, blockHash } = utils.getHashes(await faucet.claim(user))

    await checkAndReward(user, txHash, blockHash)
  })


  // WINNING THE DRAW
  it("Should emit \"Win\" event and change odds by 10% on lottery win", async () => {
    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})

    let oddsBefore = []
    for(let i = 0; i < 8; i++) {
      oddsBefore.push((await faucet.odds(i)).toNumber())
    }

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))
    const result = await checkAndReward(freeHolder, txHash, blockHash)

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
    const fmnBalBefore = Number(utils.fromWei(await fmn.balanceOf(freeHolder)))
    const result = await checkAndReward(freeHolder, txHash, blockHash)

    claims = (await faucet.claims()).toNumber()
    claimsSinceLastWin = (await faucet.claimsSinceLastWin()).toNumber()
    expect(claims).to.equal(2)
    expect(claimsSinceLastWin).to.equal(0)

    expect(result.logs[0].event).to.equal("Win")

    const fmnBalAfter = Number(utils.fromWei(await fmn.balanceOf(freeHolder)))

    expect(fmnBalAfter).to.equal(fmnBalBefore + 1)
  })


  // LOSING THE DRAW
  it("Should not award FMN after not winning the lottery", async () => {
    await faucet.subscribe(freeHolder, {from: freeHolder, value: utils.toWei("1")})
    const fmnBalBefore = utils.fromWei(await fmn.balanceOf(freeHolder))

    const bal = utils.fromWei(await free.balanceOf(freeHolder))
    await free.burn(utils.toWei(bal), {from: freeHolder})

    const { txHash, blockHash } = utils.getHashes(await faucet.claim(freeHolder, {from: freeHolder}))

    await checkAndReward(freeHolder, txHash, blockHash)
    const fmnBalAfter = utils.fromWei(await fmn.balanceOf(freeHolder))

    expect(fmnBalAfter).to.equal(fmnBalBefore)
  })


  // COORDINATOR & CONTRACT FUNDS
  it("Should send subscription funds to coordinator when coordinator balance is below threshold", async () => {
    const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount } = config()

    await faucet.updateParams(
      admin,
      coordinator,
      subscriptionCost,
      cooldownTime,
      payoutThreshold,
      payoutAmount,
      utils.toWei("100000"),
      {from: governance}
    )

    const coordinatorBalBefore = utils.fromWei(await web3.eth.getBalance(coordinator))
    await faucet.subscribe(admin, {from: admin, value: utils.toWei("1")})
    const coordinatorBalAfter = utils.fromWei(await web3.eth.getBalance(coordinator))

    expect(coordinatorBalAfter).to.equal(String(Number(coordinatorBalBefore) + 1))
  })

  it("Should hold subscription funds in contract when coordinator balance is above threshold", async () => {
    const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount } = config()

    await faucet.updateParams(
      admin,
      coordinator,
      subscriptionCost,
      cooldownTime,
      payoutThreshold,
      payoutAmount,
      utils.toWei("10"),
      {from: governance}
    )

    const faucetBalBefore = utils.fromWei(await web3.eth.getBalance(faucet.address))
    await faucet.subscribe(admin, {from: admin, value: utils.toWei("1")})
    const faucetBalAfter = utils.fromWei(await web3.eth.getBalance(faucet.address))

    expect(faucetBalAfter).to.equal(String(Number(faucetBalBefore) + 1))

  })

  it("Should allow governance to withdraw funds if available", async () => {
    await faucet.subscribe(admin, {from: admin, value: utils.toWei("1")})
    await faucet.subscribe(governance, {from: admin, value: utils.toWei("1")})
    await faucet.subscribe(user, {from: admin, value: utils.toWei("1")})

    await truffleAssert.passes(faucet.withdrawFunds(governance, utils.toWei("2"), {from: governance}))
    await truffleAssert.passes(faucet.withdrawFunds(governance, utils.toWei("1"), {from: governance}))
  })

  it("Should not allow non-governance address to withdraw funds", async () => {
    await faucet.subscribe(admin, {from: admin, value: utils.toWei("1")})

    await truffleAssert.fails(
      faucet.withdrawFunds(governance, utils.toWei("1"), {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the governance address can perform this operation."
    )
  })

  it("Should not allow withdrawal if requested invalid amount", async () => {
    await faucet.subscribe(admin, {from: admin, value: utils.toWei("1")})
    await faucet.subscribe(governance, {from: admin, value: utils.toWei("1")})

    await truffleAssert.fails(
      faucet.withdrawFunds(governance, utils.toWei("3"), {from: governance}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Insufficient FSN funds."
    )
  })

  it("Should give the correct category for the balance of FREE", async () => {
    const accs = await setUpCategories()

    // for(let ii = 0; ii < categories.length; ii++) {
    //   let cat = await faucet.getCategory(accs[ii])
    //   let odds = await faucet.odds(cat)
    //   let balance = utils.fromWei(await free.balanceOf(accs[ii]))
    //   console.log(`Category: ${cat.toString()}, Odds: ${odds.toString()}, Balance: ${balance}`)
    // }

    for(let ii = 0; ii < accs.length; ii++) {
      let cat = (await faucet.getCategory(accs[ii])).toNumber()

      expect(cat).to.equal(ii)
    }
  })

  it("Should give the correct odds for each category", async () => {
    const accs = await setUpCategories()

    for(let ii = 0; ii < accs.length; ii++) {
      let cat = (await faucet.getCategory(accs[ii])).toNumber()
      let checkOdds = (await faucet.odds(cat)).toString()

      expect(checkOdds).to.equal(odds[ii])
    }
  })

  it("Should give the correct balance thresholds for each category", async () => {
    const accs = await setUpCategories()

    for(let ii = 0; ii < accs.length; ii++) {
      let cat = (await faucet.getCategory(accs[ii])).toNumber()
      let balances = utils.fromWei(await faucet.categories(cat))

      expect(balances).to.equal(categories[ii])
    }
  })
})