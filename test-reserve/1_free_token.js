const { expect } = require("chai")
const truffleAssert = require("truffle-assertions")

const FREE = artifacts.require("FREE")


let governance, user, airdrop, faucet, dummy1, dummy2
let free

const toWei = val => {
  return web3.utils.toWei(val, "ether")
}

const fromWei = val => {
  return web3.utils.fromWei(val)
}

const setUp = async () => {
  [ governance, user, airdrop, faucet, dummy1, dummy2 ] = await web3.eth.getAccounts()
  free = await FREE.new("Free Token", "FREE", 18, governance, airdrop, faucet)
}
 

contract("FREE Token", () => {
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

  it("Should set the correct addresses for governance, airdrop, and faucet", async () => {
    const governanceSet = await free.governance()
    const airdropSet = await free.airdrop()
    const faucetSet = await free.faucet()

    expect(governanceSet).to.equal(governance)
    expect(airdropSet).to.equal(airdrop)
    expect(faucetSet).to.equal(faucet)
  })

  it("Should have initial total supply of 100 000 000 FREE", async () => {
    const circulatingSupply = fromWei(await free.circulationSupply())

    expect(circulatingSupply).to.equal("100000000")
  })

  it("Should allow governance address to update airdrop and faucet addresses", async () => {
    await truffleAssert.passes(free.updateAuth(dummy1, dummy2, {from: governance}))
    const airdropNew = await free.airdrop()
    const faucetNew = await free.faucet()

    expect(airdropNew).to.equal(dummy1)
    expect(faucetNew).to.equal(dummy2)
  })

  it("Should not allow non-governance address to update airdrop and faucet addresses", async () => {
    await truffleAssert.fails(
      free.updateAuth(dummy1, dummy2, {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only governance votes can update the airdrop and/or the faucet addresses."
    )
    const airdropSet = await free.airdrop()
    const faucetSet = await free.faucet()

    expect(airdropSet).to.equal(airdrop)
    expect(faucetSet).to.equal(faucet)
  })

  it("Should allow airdrop address to mint FREE into user's account", async () => {
    await truffleAssert.passes(free.mint(user, toWei("1"), {from: airdrop}))
    const freeBal = fromWei(await free.balanceOf(user))

    expect(freeBal).to.equal("1")
  })

  it("Should allow faucet address to mint FREE", async () => {
    await truffleAssert.passes(free.mint(user, toWei("1"), {from: faucet}))
    const freeBal = fromWei(await free.balanceOf(user))

    expect(freeBal).to.equal("1")
  })

  it("Should not allow unauthorized address to mint FREE", async () => {
    await truffleAssert.fails(
      free.mint(user, toWei("1"), {from: user}),
      truffleAssert.ErrorType.REVERT,
      "FREEMOON: Only faucet and airdrop have minting privileges."
    )
  })

  it("Should allow user to burn FREE from balance", async () => {
    await free.mint(user, toWei("10"), {from: airdrop})
    await free.burn(toWei("5"), {from: user})
    const freeBal = fromWei(await free.balanceOf(user))

    expect(freeBal).to.equal("5")
  })
})