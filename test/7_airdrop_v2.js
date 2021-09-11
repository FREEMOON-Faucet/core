const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Free = artifacts.require("FREE")
const Fmn = artifacts.require("FMN")

const Faucet = artifacts.require("Faucet")
const FaucetProxy = artifacts.require("FaucetProxy")

const AirdropV2 = artifacts.require("AirdropV2")
const AirdropProxyV2 = artifacts.require("AirdropProxyV2")

const MockFRC758 = artifacts.require("MockFRC758")
const ChaingeDexPair = artifacts.require("ChaingeDexPair")

const utils = require("../scripts/99_utils")

const { farmingConfig, mintingConfig } = require("../rewardAssets")

let admin, coordinator, governance
let faucetLayout, faucetProxy, faucet
let airdropV2Layout, airdropProxyV2, airdropV2
let pool
let free, fmn
let chng
let categories, odds
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
  }
}

const initialAssets = () => {
  let farmingAssets = []
  let farmingSymbols = []
  let farmingRewards = []

  for(let i = 0; i < farmingConfig; i++) {
    farmingAssets.push(farmingConfig[i].address)
    farmingSymbols.push(farmingConfig[i].symbol)
    farmingRewards.push(utils.toWei(farmingConfig[i].farmRewardPerSec, "ether"))
  }

  let mintingAssets = []
  let mintingSymbols = []
  let mintingRewards = []

  for(let j = 0; j < mintingConfig; j++) {
    mintingAssets.push(mintingConfig[i].address)
    mintingSymbols.push(mintingConfig[i].symbol)
    mintingRewards.push(utils.toWei(mintingConfig[i].mintRewardPerSec, "ether"))
  }

  return {
    farmingAssets,
    farmingRewards,
    mintingAssets,
    mintingRewards,
    symbols: farmingSymbols.concat(mintingSymbols)
  }
}

const setUp = async () => {
  [ admin, coordinator, governance, user ] = await web3.eth.getAccounts()
  const {
    subscriptionCost,
    cooldownTime,
    payoutThreshold,
    payoutAmount,
    hotWalletLimit,
    categories,
    odds
  } = config()

  pool = await ChaingeDexPair.new()

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

  await airdropV2.initialize(
    admin,
    governance,
    faucet.address,
    free.address,
    fmn.address,
    pool.address,
    { from: admin }
  )

  await free.setMintInvokers(faucet.address, airdropV2.address, { from: admin })
  await fmn.setMintInvokers(faucet.address, { from: admin })

  chng = await MockFRC758.new(
    "Chainge Finance",
    "CHNG",
    utils.toWei("10000000"),
    { from: admin }
  )
}

const setAssets = async () => {
  const { farm, mint } = initialAssets()
  const { farmingAssets, farmingSymbols, farmingRewards } = farm
  const { mintingAssets, mintingSymbols, mintingRewards } = mint

  await airdropV2.setFarmingAssets(farmingAssets, farmingRewards, { from: admin })
  await airdropV2.setMintingAssets(mintingAssets, mintingRewards, { from: admin })

  await airdropV2.setSymbols(farmingAssets.concat(mintingAssets), farmingSymbols.concat(mintingSymbols), { from: admin })
}

const setTimes = async () => {
  startTime = await web3.eth.getBlock("latest")
  startTime = startTime.timestamp

  fromNowOneDay = startTime + 86405
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


contract("AirdropV2 Contract", async () => {
  beforeEach("Re-deploy all, set start time", async () => {
    await setUp()
    await setTimes()
  })

  // INITIAL VALUES
  it("Should set the correct addresses for admin, coordinator and governance", async () => {
    const adminSet = await airdropV2.admin()
    const governanceSet = await airdropV2.governance()

    expect(adminSet).to.equal(admin)
    expect(governanceSet).to.equal(governance)
  })

  it("Should initialize farm assets successfully", async () => {
    const { farmingAssets, farmingRewards } = initialAssets()
    await airdropV2.setFarmingAssets(farmingAssets, farmingRewards, { from: admin })
    for(let i = 0; i < farmingAssets.length; i++) {
      let rewardSet = await airdropV2.farmRewardPerSec(airdropAssets[i])
      expect(utils.fromWei(rewardSet)).to.equal(utils.fromWei(farmingRewards[i]))
    }
  })

  it("Should initialize minting assets successfully", async () => {
    const { mintingAssets, mintingRewards } = initialAssets()
    await airdropV2.setMintingAssets(mintingAssets, mintingRewards, { from: admin })
    for(let i = 0; i < mintingAssets.length; i++) {
      let rewardSet = await airdropV2.mintRewardPerSec(mintingAssets[i])
      expect(utils.fromWei(rewardSet)).to.equal(utils.fromWei(mintRewards[i]))
    }
  })

  // it("Should remove an airdrop asset successfully")

  it("Should remove a minting asset successfully")

  // it("Should not add an airdrop asset if the balance required is zero")

  it("Should not add a minting asset if the daily mint reward is zero")

  // it("Should allow setAirdropAssets to be called once")

  it("Should allow setMintingAssets to be called once")

  // it("Should not allow setAirdropAssets to be called more than once")

  it("Should not allow setMintingAssets to be called more than once")

  // it("Should allow governance to call setAirdropAssets anytime")

  it("Should allow governance to call setMintingAssets anytime")

  // it("Should allow governance to update airdrop parameters")

  // it("Should not allow non-governance address to update airdrop parameters")

  // it("Should allow governance address to remove an airdrop asset anytime")

  it("Should allow governance address to remove a minting asset anytime")

  // it("Should not allow non-governance address to remove airdrop assets")

  it("Should not allow non-governance address to remove minting assets")

  // it("Should airdrop FREE to subscribed address when called")

  // it("Should not allow unsubscribed address to claim FREE airdrop")

  // it("Should only allow an address to claim FREE airdrop if they have waited the required cooldown")

  // it("Should airdrop the claimable amount of FREE when called")

  it("Should mint FREE to subscribed address when called")

  it("Should not allow unsubscribed address to mint FREE")

  it("Should update the position correctly")

  it("Should allow valid position to be liquidated")

  it("Should not allow invalid position to be liquidated")

  it("Should allow governance to update terms")

  it("Should not allow non-governance to update terms")

  it("Should update the terms without affecting the positions")

  // Airdrop Claim Amounts
})