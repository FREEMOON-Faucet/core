const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")
const BigNumber = require("bignumber.js")

const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")

const MockFRC758 = artifacts.require("MockFRC758")
const MockFRC20 = artifacts.require("MockFRC20")
const ChaingeDexPair = artifacts.require("ChaingeDexPair")

const utils = require("../scripts/99_utils")

let admin, coordinator, governance, user, dummy
let faucetLayout, faucetProxy, faucet
let airdropV2Layout, airdropProxyV2, airdropV2
let pool
let free, fmn
let any, farm1, farm2, farm3
let chng, mint1, mint2, mint3
let categories, odds
let startTime, newTime
let oneDay, fourMonths, eightMonths, oneYear, oneYearMinusOne
let fromNowOneDay, fromNowFourMonths, fromNowEightMonths, fromNowOneYear, fromNowOneYearMinusOne

const LONG = 2
const MEDIUM = 1
const SHORT = 0

const paramConfig = () => {
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
    subscriptionCost: utils.toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: utils.toWei("1"), // 1 FREE
    hotWalletLimit: utils.toWei("50"), // 50 FSN max wallet balance
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds // odds of winning for each category
  }
}

const assetConfig = () => {
  const farmingAssets = [
    any.address,
    farm1.address,
    farm2.address,
    farm3.address
  ]

  const mintingAssets = [
    chng.address,
    mint1.address,
    mint2.address,
    mint3.address
  ]

  const farmingRewards = [
    "0.00001",
    "0.00001",
    "0.00001",
    "0.00001"
  ]

  const mintingRewards = [
    "0.00001",
    "0.00001",
    "0.00001",
    "0.00001"
  ]

  const symbols = [
    "ANY",
    "FM1",
    "FM2",
    "FM3",
    "CHNG",
    "MNT1",
    "MNT2",
    "MNT3"
  ]

  return {
    farmingAssets,
    farmingRewards,
    mintingAssets,
    mintingRewards,
    symbols
  }
}

const deploy = async () => {
  [ admin, coordinator, governance, user, dummy ] = await web3.eth.getAccounts()

  const {
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    categories,
    odds
  } = paramConfig()

  pool = await ChaingeDexPair.new()

  any = await MockFRC20.new(
    "Anyswap",
    "ANY",
    utils.toWei("10000000"),
    { from: admin }
  )

  farm1 = await MockFRC20.new(
    "Farm1",
    "FM1",
    utils.toWei("10000000"),
    { from: admin }
  )

  farm2 = await MockFRC20.new(
    "Farm2",
    "FM2",
    utils.toWei("10000000"),
    { from: admin }
  )

  farm3 = await MockFRC20.new(
    "Farm3",
    "FM3",
    utils.toWei("10000000"),
    { from: admin }
  )

  chng = await MockFRC758.new(
    "Chainge Finance",
    "CHNG",
    utils.toWei("10000000"),
    { from: admin }
  )

  mint1 = await MockFRC758.new(
    "Mint1",
    "MNT1",
    utils.toWei("10000000"),
    { from: admin }
  )

  mint2 = await MockFRC758.new(
    "Mint2",
    "MNT2",
    utils.toWei("10000000"),
    { from: admin }
  )

  mint3 = await MockFRC758.new(
    "Mint3",
    "MNT3",
    utils.toWei("10000000"),
    { from: admin }
  )

  free = await Free.new(
    "The FREE Token",
    "FREE",
    18,
    admin,
    governance,
    { from: admin }
  )

  fmn = await Fmn.new(
    "The FREEMOON Token",
    "FMN",
    18,
    admin,
    governance,
    { from: admin }
  )

  await fmn.initialMint(governance, { from: admin })

  faucetLayout = await Faucet.new({ from: admin })
  faucetProxy = await FaucetProxy.new(faucetLayout.address, { from: admin })
  faucet = await Faucet.at(faucetProxy.address, { from: admin })

  airdropV2Layout = await AirdropV2.new({ from: admin })
  airdropProxyV2 = await AirdropProxyV2.new(airdropV2Layout.address, { from: admin })
  airdropV2 = await AirdropV2.at(airdropProxyV2.address, { from: admin })

  await faucet.initialize(
    admin,
    governance,
    free.address,
    fmn.address,
    categories,
    odds,
    { from: admin }
  )

  await faucet.updateParams(
    admin,
    coordinator,
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    { from: admin }
  )

  await free.setMintInvokers(faucet.address, airdropV2.address, { from: admin })
  await fmn.setMintInvokers(faucet.address, { from: admin })
}

const initialize = async () => {
  await airdropV2.initialize(
    admin,
    governance,
    faucet.address,
    free.address,
    fmn.address,
    pool.address,
    { from: admin }
  )
}

const setAssets = async () => {
  let { farmingAssets, mintingAssets, farmingRewards, mintingRewards } = assetConfig()

  farmingRewards = farmingRewards.map(farm => utils.toWei(farm))
  mintingRewards = mintingRewards.map(mint => utils.toWei(mint))

  await airdropV2.setFarmingAssets(farmingAssets, farmingRewards, { from: admin })
  await airdropV2.setMintingAssets(mintingAssets, mintingRewards, { from: admin })
}

const setSymbols = async () => {
  const { farmingAssets, mintingAssets, symbols } = assetConfig()

  await airdropV2.setSymbols(farmingAssets.concat(mintingAssets), symbols, { from: admin })
}

const setTerms = async ts => {
  await airdropV2.newTerm(ts, { from: governance })
}

const setAll = async () => {
  await initialize()
  await setAssets()
  await setSymbols()
}

const stakeThis = async () => {
  const { farmingAssets } = assetConfig()
  return {
    asset: farmingAssets[0],
    amount: utils.toWei("10")
  }
}

const lockThis = async () => {
  const { mintingAssets } = assetConfig()
  return {
    asset: mintingAssets[0],
    amount: utils.toWei("10")
  }
}

const transferFarmAsset = async (to, amount) => {
  await any.transfer(to, utils.toWei(amount), { from: admin })
}

const transferMintAsset = async (to, amount) => {
  await chng.transfer(to, utils.toWei(amount), { from: admin })
}

const transferFmn = async to => {
  await fmn.transfer(to, utils.toWei("10"), { from: governance })
  await fmn.approve(airdropV2.address, utils.toWei("2"), { from: to })
}

const approveAirdrop = async from => {
  await any.approve(airdropV2.address, utils.toWei("100"), { from: from })
  await chng.approve(airdropV2.address, utils.toWei("100"), { from: from })
}

const subscribe = async account => {
  await faucet.subscribe(account, { from: admin, value: utils.toWei("1") })
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = new BigNumber(startTime.timestamp)
  
  oneDay = new BigNumber("86400")
  fourMonths = oneDay.multipliedBy("30").multipliedBy("4")
  eightMonths = fourMonths.multipliedBy("2")
  oneYear = oneDay.multipliedBy("365")
  oneYearMinusOne = oneYear.minus(oneDay)

  fromNowOneDay = startTime.plus(oneDay)
  fromNowFourMonths = startTime.plus(fourMonths)
  fromNowEightMonths = startTime.plus(eightMonths)
  fromNowOneYear = startTime.plus(oneYear)
  fromNowOneYearMinusOne = startTime.plus(oneYearMinusOne)
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

const formatTimeBal = bal => {
  let amountArray = bal["0"]
  let tokenStartArray = bal["1"]
  let tokenEndArray = bal["2"]

  amountArray = amountArray.map(amt => utils.fromWei(amt))
  tokenStartArray = tokenStartArray.map(tks => tks.toString())
  tokenEndArray = tokenEndArray.map(tke => tke.toString())

  let balances = []
  for(let i = 0; i < amountArray.length; i++) {
    balances.push({
      amount: amountArray[i],
      start: tokenStartArray[i],
      end: tokenEndArray[i]
    })
  }

  return balances
}


contract("AirdropV2 Contract", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await deploy()
    await setTimes()
  })

  // // initialize
  // it("set correct admin, governance", async () => {
  //   await initialize()
  //   const adminSet = await airdropV2.admin()
  //   const govSet = await airdropV2.governance()
  //   expect(adminSet).to.equal(admin)
  //   expect(govSet).to.equal(governance)
  // })

  // it("set correct faucet, free, fmn, pool", async () => {
  //   await initialize()
  //   const faucetSet = await airdropV2.faucet()
  //   const freeSet = await airdropV2.free()
  //   const fmnSet = await airdropV2.fmn()
  //   const poolSet = await airdropV2.pool()
  //   expect(faucetSet).to.equal(faucet.address)
  //   expect(freeSet).to.equal(free.address)
  //   expect(fmnSet).to.equal(fmn.address)
  //   expect(poolSet).to.equal(pool.address)
  // })

  // it("can only be called once", async () => {
  //   await initialize()
  //   await truffleAssert.fails(
  //     airdropV2.initialize(
  //       admin,
  //       governance,
  //       faucet.address,
  //       free.address,
  //       fmn.address,
  //       pool.address,
  //       { from: admin }
  //     ),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Airdrop contract can only be initialized once."
  //   )
  // })

  // // set farming assets
  // it("set farming assets can't be called by non-admin/non-gov", async () => {
  //   let { farmingAssets, farmingRewards } = assetConfig()
  //   farmingRewards = farmingRewards.map(farm => utils.toWei(farm))
  //   await initialize()
  //   await truffleAssert.fails(
  //     airdropV2.setFarmingAssets(farmingAssets, farmingRewards, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can set assets after initialization."
  //   )
  // })

  // it("set farming assets can't be called by admin twice", async () => {
  //   let { farmingAssets, farmingRewards } = assetConfig()
  //   farmingRewards = farmingRewards.map(farm => utils.toWei(farm))
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.setFarmingAssets(farmingAssets, farmingRewards, { from: admin }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can set assets after initialization."
  //   )
  // })

  // it("sets correct farm addresses", async () => {
  //   const { farmingAssets } = assetConfig()
  //   await setAll()
  //   for(let i = 0; i < farmingAssets.length; i++) {
  //     let currentAddr = await airdropV2.farmingAssets(i)
  //     expect(currentAddr).to.equal(farmingAssets[i])
  //   }
  // })

  // it("sets correct farm rewards for each", async () => {
  //   const { farmingAssets, farmingRewards } = assetConfig()
  //   await setAll()
  //   for(let i = 0; i < farmingAssets.length; i++) {
  //     let currentReward = utils.fromWei(await airdropV2.farmRewardPerSec(farmingAssets[i]))
  //     expect(currentReward).to.equal(farmingRewards[i])
  //   }
  // })

  // it("sets correct length of farm list", async () => {
  //   const { farmingAssets } = assetConfig()
  //   await setAll()
  //   const farmingLength = (await airdropV2.farmingAssetCount()).toNumber()
  //   expect(farmingLength).to.equal(farmingAssets.length)
  // })

  // it("updating farm token doesn't affect farm list", async () => {
  //   const { farmingAssets } = assetConfig()
  //   let updatingAsset = farmingAssets[0]
  //   let newRewards = utils.toWei("123")
  //   await setAll()
  //   const lengthBefore = (await airdropV2.farmingAssetCount()).toNumber()
  //   await airdropV2.setFarmingAssets([ updatingAsset ], [ newRewards ], { from: governance })
  //   const lengthAfter = (await airdropV2.farmingAssetCount()).toNumber()
  //   expect(lengthAfter).to.equal(lengthBefore)
  // })

  // // set minting assets
  // it("set minting assets can't be called by non-admin/ non-gov", async () => {
  //   let { mintingAssets, mintingRewards } = assetConfig()
  //   mintingRewards = mintingRewards.map(mint => utils.toWei(mint))
  //   await initialize()
  //   await truffleAssert.fails(
  //     airdropV2.setMintingAssets(mintingAssets, mintingRewards, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can set assets after initialization."
  //   )
  // })

  // it("set minting assets can't be called by admin twice", async () => {
  //   let { mintingAssets, mintingRewards } = assetConfig()
  //   mintingRewards = mintingRewards.map(mint => utils.toWei(mint))
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.setMintingAssets(mintingAssets, mintingRewards, { from: admin }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can set assets after initialization."
  //   )
  // })

  // it("sets correct mint addresses", async () => {
  //   const { mintingAssets } = assetConfig()
  //   await setAll()
  //   for(let i = 0; i < mintingAssets.length; i++) {
  //     let currentAddr = await airdropV2.mintingAssets(i)
  //     expect(currentAddr).to.equal(mintingAssets[i])
  //   }
  // })

  // it("sets correct mint rewards for each", async () => {
  //   const { mintingAssets, mintingRewards } = assetConfig()
  //   await setAll()
  //   for(let i = 0; i < mintingAssets.length; i++) {
  //     let currentReward = utils.fromWei(await airdropV2.mintRewardPerSec(mintingAssets[i]))
  //     expect(currentReward).to.equal(mintingRewards[i])
  //   }
  // })

  // it("sets correct length of mint list", async () => {
  //   const { mintingAssets } = assetConfig()
  //   await setAll()
  //   const mintingLength = (await airdropV2.mintingAssetCount()).toNumber()
  //   expect(mintingLength).to.equal(mintingAssets.length)
  // })

  // it("updating mint token doesn't affect mint list", async () => {
  //   const { mintingAssets } = assetConfig()
  //   let updatingAsset = mintingAssets[0]
  //   let newRewards = utils.toWei("123")
  //   await setAll()
  //   const lengthBefore = (await airdropV2.mintingAssetCount()).toNumber()
  //   await airdropV2.setMintingAssets([ updatingAsset ], [ newRewards ], { from: governance })
  //   const lengthAfter = (await airdropV2.mintingAssetCount()).toNumber()
  //   expect(lengthAfter).to.equal(lengthBefore)
  // })

  // // set symbols
  // it("set symbols can't be called by non-admin/non-gov", async () => {
  //   const { farmingAssets, mintingAssets, symbols } = assetConfig()
  //   await initialize()
  //   await setAssets()
  //   await truffleAssert.fails(
  //     airdropV2.setSymbols(farmingAssets.concat(mintingAssets), symbols, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can set symbols after initialization."
  //   )
  // })

  // it("set symbols can't be called by admin twice", async () => {
  //   const { farmingAssets, mintingAssets, symbols } = assetConfig()
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.setSymbols(farmingAssets.concat(mintingAssets), symbols, { from: admin }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can set symbols after initialization."
  //   )
  // })

  // it("sets correct symbols for each address", async () => {
  //   const { farmingAssets, mintingAssets, symbols } = assetConfig()
  //   const allAddresses = farmingAssets.concat(mintingAssets)
  //   await setAll()
  //   for(let i = 0; i < symbols.length; i++) {
  //     let currentSymbol = await airdropV2.assetSymbol(allAddresses[i])
  //     expect(currentSymbol).to.equal(symbols[i])
  //   }
  // })

  // // remove farm asset
  // it("remove farm asset can't be called by non-gov", async () => {
  //   const { farmingAssets } = assetConfig()
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.removeFarmAsset(farmingAssets[0], { from: admin }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can remove assets."
  //   )
  // })

  // it("decrements length of farm list, removes farm token", async () => {
  //   const { farmingAssets } = assetConfig()
  //   await setAll()
  //   const lengthBefore = (await airdropV2.farmingAssetCount()).toNumber()
  //   await airdropV2.removeFarmAsset(farmingAssets[0], { from: governance })
  //   const lengthAfter = (await airdropV2.farmingAssetCount()).toNumber()
  //   expect(lengthAfter).to.equal(lengthBefore - 1)
  // })

  // // remove mint asset
  // it("remove mint asset can't be called by non-gov", async () => {
  //   const { mintingAssets } = assetConfig()
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.removeMintAsset(mintingAssets[0], { from: admin }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only the governance address can remove assets."
  //   )
  // })

  // it("decrements length of mint list, removes mint token", async () => {
  //   const { mintingAssets } = assetConfig()
  //   await setAll()
  //   const lengthBefore = (await airdropV2.mintingAssetCount()).toNumber()
  //   await airdropV2.removeMintAsset(mintingAssets[0], { from: governance })
  //   const lengthAfter = (await airdropV2.mintingAssetCount()).toNumber()
  //   expect(lengthAfter).to.equal(lengthBefore - 1)
  // })

  // // stake
  // it("ensures sender address is subscribed to FREEMOON Faucet", async () => {
  //   await setAll()
  //   const { asset, amount } = await stakeThis()
  //   await truffleAssert.fails(
  //     airdropV2.stake(asset, amount, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This address is not subscribed to the FREEMOON Faucet."
  //   )
  // })

  // it("doesn't allow token that isn't on farm list", async () => {
  //   await setAll()
  //   await subscribe(user)
  //   const { amount } = await stakeThis()
  //   await truffleAssert.fails(
  //     airdropV2.stake(dummy, amount, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This token is not an accepted FREE farm."
  //   )
  // })

  // it("adds to farm balance", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const farmBal = utils.fromWei(await airdropV2.farmBalance(user, asset))
  //   expect(farmBal).to.equal(utils.fromWei(amount))
  // })

  // it("transfers correct amount of tokens, if allowance is right", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   const balBefore = Number(utils.fromWei(await any.balanceOf(user)))
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const balAfter = Number(utils.fromWei(await any.balanceOf(user)))
  //   expect(balAfter).to.equal(balBefore - 10)
  // })

  // it("add to farm balance harvests correct rewards and updates balance", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const freeBalBefore = Number(utils.fromWei(await free.balanceOf(user)))
  //   const farmBalBefore = Number(utils.fromWei(await airdropV2.farmBalance(user, asset)))
  //   await advanceBlockAtTime(fromNowOneDay)
  //   await airdropV2.stake(asset, utils.toWei("5"), { from: user })
  //   const freeBalAfter = Number(utils.fromWei(await free.balanceOf(user)))
  //   const farmBalAfter = Number(utils.fromWei(await airdropV2.farmBalance(user, asset)))
  //   expect(freeBalAfter).to.be.greaterThan(freeBalBefore)
  //   expect(farmBalAfter).to.equal(farmBalBefore + 5)
  // })

  // // unstake
  // it("doesn't allow token that isn't on farm list", async () => {
  //   await setAll()
  //   await subscribe(user)
  //   const { amount } = await stakeThis()
  //   await truffleAssert.fails(
  //     airdropV2.unstake(dummy, amount, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This token is not an accepted FREE farm."
  //   )
  // })

  // it("doesn't allow withdrawing an amount greater than farm balance", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   await truffleAssert.fails(
  //     airdropV2.unstake(asset, utils.toWei("11"), { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Not enough of this token deposited."
  //   )
  // })

  // it("harvest any rewards", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const freeBalBefore = Number(utils.fromWei(await free.balanceOf(user)))
  //   await airdropV2.unstake(asset, amount, { from: user })
  //   const freeBalAfter = Number(utils.fromWei(await free.balanceOf(user)))
  //   expect(freeBalAfter).to.be.greaterThan(freeBalBefore)
  // })

  // it("subs from farm balance", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const farmBalBefore = Number(utils.fromWei(await airdropV2.farmBalance(user, asset)))
  //   await airdropV2.unstake(asset, utils.toWei("5"), { from: user })
  //   const farmBalAfter = Number(utils.fromWei(await airdropV2.farmBalance(user, asset)))
  //   expect(farmBalAfter).to.equal(farmBalBefore - 5)
  // })

  // it("transfers correct amount of tokens", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const tokenBalBefore = Number(utils.fromWei(await any.balanceOf(user)))
  //   await airdropV2.unstake(asset, amount, { from: user })
  //   const tokenBalAfter = Number(utils.fromWei(await any.balanceOf(user)))
  //   expect(tokenBalAfter).to.equal(tokenBalBefore + Number(utils.fromWei(amount)))
  // })

  // it("sub from farm balance harvests correct rewards and updates balance", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   const freeBalBefore = Number(utils.fromWei(await free.balanceOf(user)))
  //   const farmBalBefore = Number(utils.fromWei(await airdropV2.farmBalance(user, asset)))
  //   await advanceBlockAtTime(fromNowOneDay)
  //   await airdropV2.unstake(asset, utils.toWei("5"), { from: user })
  //   const freeBalAfter = Number(utils.fromWei(await free.balanceOf(user)))
  //   const farmBalAfter = Number(utils.fromWei(await airdropV2.farmBalance(user, asset)))
  //   expect(freeBalAfter).to.be.greaterThan(freeBalBefore)
  //   expect(farmBalAfter).to.equal(farmBalBefore - 5)
  // })

  // // harvest
  // it("doesn't allow token that isn't on farm list", async () => {
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.harvest(dummy, { from: user }),
  //     "FREEMOON: This token is not an accepted FREE farm."
  //   )
  // })

  // it("should mint correct amount of rewards", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   await advanceBlockAtTime(fromNowOneDay)
  //   const freeBalBefore = Number(Number(utils.fromWei(await free.balanceOf(user))).toFixed(2))
  //   const rewards = Number(Number(utils.fromWei(await airdropV2.getFarmRewards(user, asset))).toFixed(2))
  //   await airdropV2.unstake(asset, amount, { from: user })
  //   const freeBalAfter = Number(Number(utils.fromWei(await free.balanceOf(user))).toFixed(2))
  //   expect(freeBalAfter).to.equal(freeBalBefore + rewards)
  // })

  // it("if rewards greater than zero, update timestamp", async () => {
  //   await setAll()
  //   await transferFarmAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   const { asset, amount } = await stakeThis()
  //   await airdropV2.stake(asset, amount, { from: user })
  //   await advanceBlockAtTime(fromNowOneDay)
  //   const timestampBefore = (await airdropV2.lastModification(user, asset)).toNumber()
  //   await airdropV2.unstake(asset, amount, { from: user })
  //   const timestampAfter = (await airdropV2.lastModification(user, asset)).toNumber()
  //   expect(timestampAfter).to.not.equal(timestampBefore)
  // })

  // // lock
  // it("ensures sender address is subscribed to FREEMOON Faucet", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await truffleAssert.fails(
  //     airdropV2.lock(asset, amount, LONG, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This address is not subscribed to the FREEMOON Faucet."
  //   )
  // })

  // it("doesn't allow token that isn't on mint list", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { amount } = await lockThis()
  //   await truffleAssert.fails(
  //     airdropV2.lock(dummy, amount, LONG, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This token is not an accepted FREE minter."
  //   )
  // })

  // it("ensure valid term timestamp", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await truffleAssert.fails(
  //     airdropV2.lock(asset, amount, MEDIUM, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This term is not yet valid."
  //   )
  // })

  // it("cannot add to a term pool if closer than 1 day away", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await advanceBlockAtTime(fromNowOneYearMinusOne.toNumber())
  //   await truffleAssert.fails(
  //     airdropV2.lock(asset, amount, LONG, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Cannot time slice for less than one day."
  //   )
  // })

  // it("adds to the position balance", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   const termEnd = await airdropV2.termEnd(LONG)
  //   const positionId = await airdropV2.getPositionId(user, asset, termEnd)
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const balLocked = utils.fromWei(await airdropV2.positionBalance(positionId))
  //   expect(balLocked).to.equal(utils.fromWei(amount))
  // })

  // it("adds to existing balance", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   const termEnd = await airdropV2.termEnd(LONG)
  //   const positionId = await airdropV2.getPositionId(user, asset, termEnd)
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const balLockedBefore = Number(utils.fromWei(await airdropV2.positionBalance(positionId)))
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const balLockedAfter = Number(utils.fromWei(await airdropV2.positionBalance(positionId)))
  //   expect(balLockedAfter).to.equal(balLockedBefore + Number(utils.fromWei(amount)))
  // })

  // it("transfers correct slice, if allowance is right", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const timeframeLocked = formatTimeBal(await chng.sliceOf(airdropV2.address))
  //   const sliceCreated = timeframeLocked[1]
  //   expect(sliceCreated.amount).to.equal(utils.fromWei(amount))
  //   expect(Number(sliceCreated.end - Number(sliceCreated.start) - oneYear.toNumber())).to.be.lessThanOrEqual(10)
  // })

  // it("mints correct amount of rewards", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const termEnd = await airdropV2.termEnd(LONG)
  //   const mintable = utils.fromWei(await airdropV2.getMintRewards(asset, amount, termEnd))
  //   const freeBal = utils.fromWei(await free.balanceOf(user))
  //   expect(freeBal).to.equal(mintable)
  // })

  // // unlock
  // it("doesn't allow token that isn't on mint list", async () => {
  //   await setAll()
  //   await subscribe(user)
  //   const { amount } = await lockThis()
  //   await truffleAssert.fails(
  //     airdropV2.unlock(dummy, amount, LONG, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: This token is not an accepted FREE minter."
  //   )
  // })

  // it("must have at least the specified amount in position balance", async () => {
  //   await setAll()
  //   await subscribe(user)
  //   const { asset, amount } = await lockThis()
  //   await truffleAssert.fails(
  //     airdropV2.unlock(asset, amount, LONG, { from: user }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Specified amount of tokens is not locked in this position."
  //   )
  // })

  // it("subs from the position balance", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await transferFmn(user)
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   const termEnd = await airdropV2.termEnd(LONG)
  //   const positionId = await airdropV2.getPositionId(user, asset, termEnd)
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const posBalBefore = utils.fromWei(await airdropV2.positionBalance(positionId))
  //   await airdropV2.unlock(asset, utils.toWei("5"), LONG, { from: user })
  //   const posBalAfter = utils.fromWei(await airdropV2.positionBalance(positionId))
  //   expect(Number(posBalAfter)).to.equal(Number(posBalBefore) - 5)
  // })

  // it("transfers correct amount of fmn, if allowance is right", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await transferFmn(user)
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   await airdropV2.unlock(asset, amount, LONG, { from: user })
  //   const freeBal = await free.balanceOf(user)
  //   const fmnCost = utils.fromWei(await airdropV2.freeToFmn(freeBal))
  //   const fmnBal = utils.fromWei(await fmn.balanceOf(governance))
  //   expect(Number(fmnCost).toFixed(10)).to.equal(Number(fmnBal).toFixed(10))
  // })

  // it("transfers correct slice from position", async () => {
  //   await setAll()
  //   await transferMintAsset(user, "100")
  //   await transferFmn(user)
  //   await approveAirdrop(user)
  //   await subscribe(user)
  //   await setTerms(fromNowOneYear)
  //   const { asset, amount } = await lockThis()
  //   await airdropV2.lock(asset, amount, LONG, { from: user })
  //   const sliceOfAirdrop = formatTimeBal(await chng.sliceOf(airdropV2.address))
  //   const sliceAmountAirdrop = sliceOfAirdrop[1].amount
  //   const sliceEndAirdrop = sliceOfAirdrop[1].end
  //   await airdropV2.unlock(asset, amount, LONG, { from: user })
  //   const sliceOfUser = formatTimeBal(await chng.sliceOf(user))
  //   const sliceAmountUser = sliceOfUser[1].amount
  //   const sliceStartUser = sliceOfUser[1].start
  //   expect(sliceStartUser).to.equal(sliceEndAirdrop)
  //   expect(sliceAmountUser).to.equal(sliceAmountAirdrop)
  // })

  // // new term
  // it("new term can't be called by non-gov", async () => {
  //   await setAll()
  //   await truffleAssert.fails(
  //     airdropV2.newTerm(fromNowOneYear, { from: admin }),
  //     truffleAssert.ErrorType.REVERT,
  //     "FREEMOON: Only governance can set new terms."
  //   )
  // })

  // it("set long term to timestamp", async () => {
  //   await setAll()
  //   await airdropV2.newTerm(fromNowOneYear, { from: governance })
  //   const newLongTerm = (await airdropV2.termEnd(LONG)).toString()
  //   expect(newLongTerm).to.equal(fromNowOneYear.toString())
  // })

  // it("set medium term to prev long term", async () => {
  //   await setAll()
  //   await airdropV2.newTerm(fromNowEightMonths, { from: governance })
  //   await airdropV2.newTerm(fromNowOneYear, { from: governance })
  //   const newMediumTerm = (await airdropV2.termEnd(MEDIUM)).toString()
  //   expect(newMediumTerm).to.equal(fromNowEightMonths.toString())
  // })

  // it("set short term to prev medium term", async () => {
  //   await setAll()
  //   await airdropV2.newTerm(fromNowFourMonths, { from: governance })
  //   await airdropV2.newTerm(fromNowEightMonths, { from: governance })
  //   await airdropV2.newTerm(fromNowOneYear, { from: governance })
  //   const newShortTerm = (await airdropV2.termEnd(SHORT)).toString()
  //   expect(newShortTerm).to.equal(fromNowFourMonths.toString())
  // })

  // get farm rewards
  it("get correct rewards for a position", async () => {
    await setAll()
    await transferFarmAsset(user, "100")
    await approveAirdrop(user)
    const { asset, amount } = await stakeThis()
    const block = await web3.eth.getBlock("latest")
  })

  // get mint rewards
  it("get correct rewards for a potential position")

  // free to fmn
  it("gets correct conversion from free to fmn")

  // get position id
  it("gets a valid hash of a position")

  // farming asset count
  it("gets correct farm list length")

  // minting asset count
  it("gets correct mint list length")


  // term shift
  it("term shift should not affect positions")
})