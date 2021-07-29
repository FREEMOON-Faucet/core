const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const FMN = artifacts.require("FMN")

const utils = require("../scripts/99_utils")


let governance, user, faucet, dummy
let freemoon

const setUp = async () => {
  [ admin, governance, user, faucet, dummy ] = await web3.eth.getAccounts()
  freemoon = await FMN.new("Freemoon Token", "FMN", 18, admin, governance)
}


contract("The FREEMOON Token", () => {
  beforeEach("Re-deploy all", async () => {
    await setUp()
  })

  it("Should set correct values for name, symbol, and decimals", async () => {
    const name = await freemoon.name()
    const symbol = await freemoon.symbol()
    const decimals = await freemoon.decimals()

    expect(name).to.equal("Freemoon Token")
    expect(symbol).to.equal("FMN")
    expect(decimals.toNumber()).to.equal(18)
  })

  it("Should set the correct addresses for admin and governance", async () => {
    const adminSet = await freemoon.admin()
    const governanceSet = await freemoon.governance()

    expect(adminSet).to.equal(admin)
    expect(governanceSet).to.equal(governance)
  })

  it("Should have initial total supply of 10 FMN", async () => {
    const circulatingSupply = utils.fromWei(await freemoon.circulationSupply())

    expect(circulatingSupply).to.equal("10")
  })

  it("Should allow admin to set and faucet address, once", async () => {
    await truffleAssert.passes(freemoon.setMintInvokers(faucet, {from: admin}))
    await truffleAssert.fails(
      freemoon.setMintInvokers(faucet, {from: admin}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the faucet address."
    )
  })

  it("Should allow governance address to update faucet address", async () => {
    await freemoon.setMintInvokers(faucet, {from: admin})
    await truffleAssert.passes(freemoon.setMintInvokers(dummy, {from: governance}))
    const faucetNew = await freemoon.faucet()

    expect(faucetNew).to.equal(dummy)
  })

  it("Should not allow non-governance address to update faucet address", async () => {
    await freemoon.setMintInvokers(faucet, {from: admin})
    await truffleAssert.fails(
      freemoon.setMintInvokers(dummy, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the faucet address."
    )
    const faucetSet = await freemoon.faucet()

    expect(faucetSet).to.equal(faucet)
  })

  it("Should allow faucet address to mint FMN", async () => {
    await freemoon.setMintInvokers(faucet, {from: admin})
    await truffleAssert.passes(freemoon.rewardWinner(user, 0, {from: faucet}))
    const freemoonBal = utils.fromWei(await freemoon.balanceOf(user))

    expect(freemoonBal).to.equal("1")
  })

  it("Should not allow unauthorized address to mint FMN", async () => {
    await freemoon.setMintInvokers(faucet, {from: admin})
    await truffleAssert.fails(
      freemoon.rewardWinner(user, 0, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only faucet has minting privileges."
    )
  })

  it("Should allow user to burn FMN from balance", async () => {
    await freemoon.setMintInvokers(faucet, {from: admin})
    await freemoon.rewardWinner(user, 0, {from: faucet})
    await freemoon.burn(utils.toWei("0.2"), {from: user})
    const freemoonBal = utils.fromWei(await freemoon.balanceOf(user))

    expect(freemoonBal).to.equal("0.8")
  })
})