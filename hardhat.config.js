
require("@nomiclabs/hardhat-truffle5")
require("dotenv").config()

module.exports = {
  solidity: "0.8.5",
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://fsn.dev/api",
      //   blockNumber: 4776000
      // }
    },
    fsnTestnet: {
      url: "https://testnet.fsn.dev/api",
      chainId: 46688,
      accounts: [ process.env.PRIVATE_KEY ]
    }
  },
  mocha: {
    timeout: 600000
  }
}