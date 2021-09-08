const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const Fmn = artifacts.require("FMN")

const utils = require("../scripts/99_utils")


let governance, user, faucet, dummy
let fmn

const setUp = async () => {
  [ admin, governance, user, faucet, dummy ] = await web3.eth.getAccounts()

  fmn = await Fmn.new(
    "The FREEMOON Token",
    "FMN",
    18,
    admin,
    governance,
    {from: admin}
  )
}


contract("The FREEMOON Token", () => {
  beforeEach("Re-deploy all", async () => {
    await setUp()
  })

  it("Should set correct values for name, symbol, and decimals", async () => {
    const name = await fmn.name()
    const symbol = await fmn.symbol()
    const decimals = await fmn.decimals()

    expect(name).to.equal("The FREEMOON Token")
    expect(symbol).to.equal("FMN")
    expect(decimals.toNumber()).to.equal(18)
  })

  it("Should set the correct addresses for admin and governance", async () => {
    const adminSet = await fmn.admin()
    const governanceSet = await fmn.governance()

    expect(adminSet).to.equal(admin)
    expect(governanceSet).to.equal(governance)
  })

  it("Should have initial total supply of 10 FMN", async () => {
    const circulatingSupply = utils.fromWei(await fmn.circulationSupply())

    expect(circulatingSupply).to.equal("10")
  })

  it("Should allow admin to set and faucet address, once", async () => {
    await truffleAssert.passes(fmn.setMintInvokers(faucet, {from: admin}))
    await truffleAssert.fails(
      fmn.setMintInvokers(faucet, {from: admin}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the faucet address."
    )
  })

  it("Should allow governance address to update faucet address", async () => {
    await fmn.setMintInvokers(faucet, {from: admin})
    await truffleAssert.passes(fmn.setMintInvokers(dummy, {from: governance}))
    const faucetNew = await fmn.faucet()

    expect(faucetNew).to.equal(dummy)
  })

  it("Should not allow non-governance address to update faucet address", async () => {
    await fmn.setMintInvokers(faucet, {from: admin})
    await truffleAssert.fails(
      fmn.setMintInvokers(dummy, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the faucet address."
    )
    const faucetSet = await fmn.faucet()

    expect(faucetSet).to.equal(faucet)
  })

  it("Should allow faucet address to mint FMN", async () => {
    await fmn.setMintInvokers(faucet, {from: admin})
    await truffleAssert.passes(fmn.rewardWinner(user, 0, {from: faucet}))
    const fmnBal = utils.fromWei(await fmn.balanceOf(user))

    expect(fmnBal).to.equal("1")
  })

  it("Should not allow unauthorized address to mint FMN", async () => {
    await fmn.setMintInvokers(faucet, {from: admin})
    await truffleAssert.fails(
      fmn.rewardWinner(user, 0, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only faucet has minting privileges."
    )
  })

  it("Should allow user to burn FMN from balance", async () => {
    await fmn.setMintInvokers(faucet, {from: admin})
    await fmn.rewardWinner(user, 0, {from: faucet})
    await fmn.burn(utils.toWei("0.2"), {from: user})
    const fmnBal = utils.fromWei(await fmn.balanceOf(user))

    expect(fmnBal).to.equal("0.8")
  })
})