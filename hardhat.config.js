
require("@nomiclabs/hardhat-truffle5")
require("dotenv").config()

module.exports = {
  solidity: "0.8.5",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
      accounts: [ process.env.ADMIN_PRIVATE ]
    },
    fsnTestnet: {
      url: "https://testway.freemoon.xyz/gate",
      chainId: 46688,
      accounts: [ process.env.ADMIN_PRIVATE ],
      gas: 8000000,
      gasPrice: 5000000000
    },
    fsnMainnet: {
      url: "https://mainway.freemoon.xyz/gate",
      chainId: 32659,
      accounts: [ process.env.ADMIN_PRIVATE ],
      gas: 8000000,
      gasPrice: 3000000000
    }
  },
  mocha: {
    timeout: 600000
  }
}
