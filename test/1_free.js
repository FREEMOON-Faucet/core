const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const FREE = artifacts.require("FREE")

const utils = require("../scripts/99_utils")


let admin, governance, user, faucet, airdrop, dummy1, dummy2
let free

const setUp = async () => {
  [ admin, governance, user, faucet, airdrop, dummy1, dummy2 ] = await web3.eth.getAccounts()
  free = await FREE.new("Free Token", "FREE", 18, admin, governance, {from: admin})
}
 

contract("The FREE Token", () => {
  beforeEach("Re-deploy all", async () => {
    await setUp()
  })

  it("Should set correct values for name, symbol, and decimals", async () => {
    const name = await free.name()
    const symbol = await free.symbol()
    const decimals = await free.decimals()

    expect(name).to.equal("Free Token")
    expect(symbol).to.equal("FREE")
    expect(decimals.toNumber()).to.equal(18)
  })

  it("Should set the correct addresses for admin and governance", async () => {
    const adminSet = await free.admin()
    const governanceSet = await free.governance()

    expect(adminSet).to.equal(admin)
    expect(governanceSet).to.equal(governance)
  })

  it("Should have initial total supply of 100 000 000 FREE", async () => {
    const circulatingSupply = utils.fromWei(await free.circulationSupply())

    expect(circulatingSupply).to.equal("100000000")
  })

  it("Should not allow total supply to surpass 100 000 000 000 FREE", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await free.mint(admin, utils.toWei("99900000000"), {from: faucet})
    await truffleAssert.fails(
      free.mint(admin, utils.toWei("1"), {from: faucet}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Cannot mint more tokens."
    )
  })

  it("Should allow admin to set airdrop and faucet addresses, once", async () => {
    await truffleAssert.passes(free.setMintInvokers(faucet, airdrop, {from: admin}))
    await truffleAssert.fails(
      free.setMintInvokers(faucet, airdrop, {from: admin}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the airdrop and/or the faucet addresses."
    )
  })

  it("Should allow governance address to set airdrop and faucet addresses", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await truffleAssert.passes(free.setMintInvokers(dummy1, dummy2, {from: governance}))
    const faucetNew = await free.faucet()
    const airdropNew = await free.airdrop()

    expect(faucetNew).to.equal(dummy1)
    expect(airdropNew).to.equal(dummy2)
  })

  it("Should not allow non-governance address to update airdrop and faucet addresses", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await truffleAssert.fails(
      free.setMintInvokers(dummy1, dummy2, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the airdrop and/or the faucet addresses."
    )
    const airdropSet = await free.airdrop()
    const faucetSet = await free.faucet()

    expect(airdropSet).to.equal(airdrop)
    expect(faucetSet).to.equal(faucet)
  })

  it("Should allow airdrop address to mint FREE", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await truffleAssert.passes(free.mint(user, utils.toWei("1"), {from: airdrop}))
    const freeBal = utils.fromWei(await free.balanceOf(user))

    expect(freeBal).to.equal("1")
  })

  it("Should allow faucet address to mint FREE", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await truffleAssert.passes(free.mint(user, utils.toWei("1"), {from: faucet}))
    const freeBal = utils.fromWei(await free.balanceOf(user))

    expect(freeBal).to.equal("1")
  })

  it("Should not allow unauthorized address to mint FREE", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await truffleAssert.fails(
      free.mint(user, utils.toWei("1"), {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only faucet and airdrop have minting privileges."
    )
  })

  it("Should allow user to burn FREE from balance", async () => {
    await free.setMintInvokers(faucet, airdrop, {from: admin})
    await free.mint(user, utils.toWei("10"), {from: airdrop})
    await free.burn(utils.toWei("5"), {from: user})
    const freeBal = utils.fromWei(await free.balanceOf(user))

    expect(freeBal).to.equal("5")
  })
})