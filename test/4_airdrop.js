const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const Airdrop = artifacts.require("Airdrop")
const AirdropProxy = artifacts.require("AirdropProxy")

const MockAsset = artifacts.require("MockAsset")

const utils = require("../scripts/99_utils")

let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdropLayout, airdropProxy, airdrop
let free, fmn, fsn, chng, any, fsnFuse
let categories, odds, assets, balancesRequired
let fromNowOneDay, startTime, newTime

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
    subscriptionCost: utils.toWei("1"), // 1 FSN
    cooldownTime: "3600", // 1 hour
    payoutThreshold: "1", // 1 entry == receive FREE
    payoutAmount: utils.toWei("1"), // 1 FREE
    hotWalletLimit: utils.toWei("10"), // 10 FSN max wallet balance
    categories: categories.map(cat => utils.toWei(cat)), // balances required for each FREEMOON lottery category
    odds: odds, // odds of winning for each category
    airdropAmount: utils.toWei("1"), // 1 FREE paid per airdrop valid asset balance
    airdropCooldown: "86400" // 1 day between airdrops
  }
}

const initialAssets = () => {
  assets = [
    fsn.address,
    chng.address,
    any.address,
    fsnFuse.address
  ]

  balancesRequired = [
    "20000",
    "50000",
    "10000",
    "100"
  ]

  return {
    assets,
    balancesRequired: balancesRequired.map(bal => utils.toWei(bal))
  }
}

const setUp = async () => {
  [ admin, coordinator, governance, user ] = await web3.eth.getAccounts()
  const { subscriptionCost, cooldownTime, payoutThreshold, payoutAmount, hotWalletLimit, categories, odds, airdropAmount, airdropCooldown } = config()

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

  faucetLayout = await Faucet.new({from: admin})
  faucetProxy = await FaucetProxy.new(faucetLayout.address, {from: admin})
  faucet = await Faucet.at(faucetProxy.address, {from: admin})

  airdropLayout = await Airdrop.new({from: admin})
  airdropProxy = await AirdropProxy.new(airdropLayout.address, {from: admin})
  airdrop = await Airdrop.at(airdropProxy.address, {from: admin})
  
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

  await airdrop.initialize(
    admin,
    governance,
    faucet.address,
    free.address,
    {from: admin}
  )

  await airdrop.updateParams(
    admin,
    airdropAmount,
    airdropCooldown,
    {from: admin}
  )

  await free.setMintInvokers(faucet.address, airdrop.address, {from: admin})
  await fmn.setMintInvokers(faucet.address, {from: admin})

  fsn = {
    address: "0xffffffffffffffffffffffffffffffffffffffff"
  }

  chng = await MockAsset.new(
    "Chainge",
    "CHNG",
    utils.toWei("100000000"),
    {from: admin}
  )

  any = await MockAsset.new(
    "Anyswap",
    "ANY",
    utils.toWei("100000000"),
    {from: admin}
  )

  fsnFuse = await MockAsset.new(
    "FSN/FUSE Liquidity Pool",
    "FSN/FUSE",
    utils.toWei("100000000"),
    {from: admin}
  )
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneDay = startTime + 86405
}

const spreadAssets = async send => {
  await chng.transfer(user, utils.toWei(send.chng), {from: admin})
  await any.transfer(user, utils.toWei(send.any), {from: admin})
  await fsnFuse.transfer(user, utils.toWei(send.fsnFuse), {from: admin})
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

const setAssets = async () => {
  const { assets, balancesRequired } = initialAssets()
  await airdrop.setAssets(assets, balancesRequired)
}


contract("Airdrop Contract", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })

  // INITIAL VALUES
  it("Should set the correct addresses for admin, coordinator and governance", async () => {
    const adminSet = await airdrop.admin()
    const governanceSet = await airdrop.governance()

    expect(adminSet).to.equal(admin)
    expect(governanceSet).to.equal(governance)
  })

  it("Should set correct initial airdrop parameters", async () => {
    const aa = utils.fromWei(await airdrop.airdropAmount())
    const ac = (await airdrop.airdropCooldown()).toString()

    let { airdropAmount, airdropCooldown } = config()
    airdropAmount = utils.fromWei(airdropAmount)

    expect(aa).to.equal(airdropAmount)
    expect(ac).to.equal(airdropCooldown)
  })

  it("Should set initial assets successfully", async () => {
    const { assets, balancesRequired } = initialAssets()
    await airdrop.setAssets(assets, balancesRequired, {from: admin})
    for(let i = 0; i < assets.length; i++) {
      let balanceRequirementSet = await airdrop.balanceRequired(assets[i])
      expect(utils.fromWei(balanceRequirementSet)).to.equal(utils.fromWei(balancesRequired[i]))
    }
  })

  it("Should remove an airdrop asset successfully", async () => {
    await setAssets()
    await truffleAssert.passes(airdrop.removeAsset(assets[0], {from: governance}))
  })

  it("Should not add an asset if the balance required value is zero", async () => {
    let mockAssetAddress = "0x1234567890abcdef1234567890abcdef12345678"
    let { assets, balancesRequired } = initialAssets()
    assets.push(mockAssetAddress)
    balancesRequired.push(utils.toWei("0"))

    await truffleAssert.fails(
      airdrop.setAssets(assets, balancesRequired),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Cannot set balance required for an asset to zero."
    )
  })

  // ADDRESS RESTRICTIONS
  it("Should allow setAssets to be called once", async () => {
    const { assets, balancesRequired } = initialAssets()
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired))
  })

  it("Should not allow setAssets to be called more than once", async () => {
    const { assets, balancesRequired } = initialAssets()
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired))
    await truffleAssert.fails(
      airdrop.setAssets(assets, balancesRequired),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the governance address can set assets after initialization."
    )
  })

  it("Should allow governance to call setAssets anytime", async () => {
    const { assets, balancesRequired } = initialAssets()
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired, {from: governance}))
    await truffleAssert.passes(airdrop.setAssets(assets, balancesRequired, {from: governance}))
  })

  it("Should allow governance address to update airdrop parameters", async () => {
    await truffleAssert.passes(airdrop.updateParams(user, utils.toWei("2"), "3600", {from: governance}))
  })

  it("Should not allow non-governance address to update airdrop parameters", async () => {
    await truffleAssert.fails(
      truffleAssert.passes(airdrop.updateParams(user, utils.toWei("2"), "3600", {from: user})),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the governance address can perform this operation."
    )
  })

  it("Should allow governance address to remove an asset anytime and decrement length", async () => {
    await setAssets()
    const lengthBefore = (await airdrop.airdropAssetCount()).toNumber()
    await truffleAssert.passes(airdrop.removeAsset(chng.address, {from: governance}))
    const lengthAfter = (await airdrop.airdropAssetCount()).toNumber()
    expect(lengthAfter).to.equal(lengthBefore - 1)
  })

  it("Should not allow non-governance address to remove assets", async () => {
    await setAssets()
    await truffleAssert.fails(
      airdrop.removeAsset(chng.address, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only the governance address can remove assets."
    )
  })

  // Airdrop Claims
  it("Should airdrop FREE to subscribed address when called", async () => {
    await setAssets()
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const freeBalBefore = utils.fromWei(await free.balanceOf(user))
    await airdrop.claimAirdrop({from: user})
    const freeBalAfter = utils.fromWei(await free.balanceOf(user))

    expect(Number(freeBalAfter)).to.greaterThanOrEqual(Number(freeBalBefore))
  })

  it("Should not allow unsubscribed address to claim airdrop", async () => {
    await setAssets()
    await truffleAssert.fails(
      airdrop.claimAirdrop({from: admin}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only faucet subscribers can claim airdrops."
    )
  })

  it("Should only allow an address to claim airdrop if they have waited the required cooldown", async () => {
    await setAssets()
    await spreadAssets({chng: "50000", any: "0", fsnFuse: "0"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await airdrop.claimAirdrop({from: user})
    await truffleAssert.fails(
      airdrop.claimAirdrop({from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: This address has claimed airdrop recently."
    )

    await advanceBlockAtTime(fromNowOneDay)

    await truffleAssert.passes(airdrop.claimAirdrop({from: user}))
  })

  it("Should airdrop the claimable amount of FREE when called", async () => {
    await setAssets()
    await spreadAssets({chng: "50000", any: "10000", fsnFuse: "100"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))
    const freeBalBefore = utils.fromWei(await free.balanceOf(user))
    await airdrop.claimAirdrop({from: user})
    const freeBalAfter = utils.fromWei(await free.balanceOf(user))
    expect(Number(freeBalAfter)).to.equal(Number(freeBalBefore) + Number(claimable))
  })

  // Airdrop Claim Amounts
  it("Should return 1 FREE claimable", async () => {
    await setAssets()
    await spreadAssets({chng: "50000", any: "0", fsnFuse: "0"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))
    
    expect(claimable).to.equal("1")
  })

  it("Should return 5 FREE claimable", async () => {
    await setAssets()
    await spreadAssets({chng: "99000", any: "34000", fsnFuse: "199"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))
    
    expect(claimable).to.equal("5")
  })

  it("Should return 10 FREE claimable", async () => {
    await setAssets()
    await spreadAssets({chng: "278000", any: "47000", fsnFuse: "120"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))
    
    expect(claimable).to.equal("10")
  })

  it("Should return 20 FREE claimable", async () => {
    await setAssets()
    await spreadAssets({chng: "792374", any: "21042", fsnFuse: "331.5"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))
    
    expect(claimable).to.equal("20")
  })

  it("Should return 100 FREE claimable", async () => {
    await setAssets()
    await spreadAssets({chng: "1049873", any: "703943", fsnFuse: "1023"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))

    expect(claimable).to.equal("100")
  })

  it("Should return 0 FREE after recent airdrop claim", async () => {
    await setAssets()
    await spreadAssets({chng: "93842", any: "28342", fsnFuse: "293"})
    await faucet.subscribe(user, {value: utils.toWei("1")})
    await airdrop.claimAirdrop({from: user})
    const claimable = utils.fromWei(await airdrop.getClaimable(user))

    expect(claimable).to.equal("0")
  })
})