


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

const impersonate = async () => {
  const whale = await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [ "0xaeec0986b77ef22de5bc15db59544ce07945ea56" ]
  })

  console.log(whale)
}

async function throwsError(promise) {
  console.log("here")
  let msg = 'No Exception'
  try {
    await promise
  } catch(e) {
    msg = e.message
  }
  return (
    msg.includes('Transaction reverted') ||
    msg.includes('VM Exception while processing transaction: revert') ||
    msg.includes('invalid opcode') ||
    msg.includes('exited with an error (status 0)')
  )
}



module.exports = {
  toWei,
  fromWei,
  getHashes,
  impersonate,
  throwsError
}
