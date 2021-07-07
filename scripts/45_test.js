
// const web3FusionExtend = require("web3-fusion-extend")


// web3 = new Web3("https://testway.freemoon.xyz/gate");
// web3 = web3FusionExtend.extend(web3)
// console.log(web3.fsn.consts.FSNToken)

const getChain = async () => {
  console.log(await web3.eth.getChainId())
}

getChain()