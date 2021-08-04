
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

const impersonate = async acc => {
  const result = await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ acc ]
  })

  return result
}



module.exports = {
  toWei,
  fromWei,
  getHashes,
  impersonate
}
