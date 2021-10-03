const TimeframeInteraction = artifacts.require("TimeframeInteraction")
const MockFRC758 = artifacts.require("MockFRC758")

let timeframeInteraction, token
let deployer

const interact = async () => {
  [ deployer ] = await web3.eth.getAccounts()
  console.log(`Deployer: ${ deployer }`)

  try {
    console.log(`Deploying token ...`)
    let name = "Token"
    let symbol = "TKN"
    let initSupply = web3.utils.toWei("50", "ether")
    token = await MockFRC758.new(name, symbol, initSupply)
    console.log(`Deployed token at ${ token.address }`)
  } catch(err) {
    console.log(`Failed to deploy token: ${ err.message }`)
  }

  try {
    console.log(`Deploying contract ...`)
    timeframeInteraction = await TimeframeInteraction.new(token.address)
    console.log(`Deployed TimeframeInteraction at ${ timeframeInteraction.address }`)
  } catch(err) {
    console.log(`Failed to deploy contract: ${ err.message }`)
  }

  try {
    console.log(`Locking in ...`)
    let fifty = web3.utils.toWei("50", "ether")
    await token.approve(timeframeInteraction.address, fifty)
    await timeframeInteraction.lockIn(fifty)
    console.log(`Done`)
  } catch(err) {
    console.log(`Could not lock in: ${ err.message }`)
  }

  try {
    console.log(`Unlocking ...`)
    await timeframeInteraction.lockOut()
    console.log(`Done`)
  } catch(err) {
    console.log(`Could not lock out: ${ err.message }`)
  }
}

try {
  interact().then(() => process.exit(0))
} catch(err) {
  console.log(err)
}