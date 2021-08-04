
const toWei = val => {
  return web3.utils.toWei(val, "ether")
}

const fromWei = val => {
  return web3.utils.fromWei(val)
}

const getHashes = res => {
  return {
    txHash: res.receipt.transactionHash,
    blockHash: res.receipt.blockHash
  }
}



module.exports = {
  toWei,
  fromWei,
  getHashes
}
