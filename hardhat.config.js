
require("@nomiclabs/hardhat-truffle5")
require("dotenv").config()

module.exports = {
  solidity: "0.8.5",
  networks: {
    fsnTestnet: {
      url: "https://testnet.anyswap.exchange",
      chainId: 46688,
      accounts: [ process.env.PRIVATE_KEY ]
    },
    fsnMainnet: {
      url: "https://fsn.dev/api",
      chainId: 32659,
      accounts: [ process.env.ADMIN_PRIVATE ]
    }
  },
  mocha: {
    timeout: 600000
  }
}
