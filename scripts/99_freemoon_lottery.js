
const ENTER = async (account, lottery, tx, block, faucet) => {
  const [ coordinator ] = await web3.eth.getAccounts()
  const result = await faucet.resolveEntry(account, lottery, tx, block, {from: coordinator})
  console.log(result.logs[0].args)
}

module.exports = { ENTER }