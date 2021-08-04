
require("@nomiclabs/hardhat-truffle5")
require("dotenv").config()

module.exports = {
  solidity: {
    compilers:[
      {    
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "byzantium",
          outputSelection: {
            "*": {
              "*": [
                "evm.bytecode.object",
                "evm.deployedBytecode.object",
                "abi",
                "evm.bytecode.sourceMap",
                "evm.deployedBytecode.sourceMap",
                "metadata"
              ],
              "": ["ast"]
            }
          }
        } 
      },
      {    
        version: "0.8.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "byzantium",
          outputSelection: {
            "*": {
              "*": [
                "evm.bytecode.object",
                "evm.deployedBytecode.object",
                "abi",
                "evm.bytecode.sourceMap",
                "evm.deployedBytecode.sourceMap",
                "metadata"
              ],
              "": ["ast"]
            }
          }
        } 
      }
    ]
  },
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
      gasPrice: 10000000000
    },
    fsnMainnet: {
      url: "https://mainway.freemoon.xyz/gate",
      chainId: 32659,
      accounts: [ process.env.ADMIN_PRIVATE ],
      gas: 8000000,
      gasPrice: 4000000000
    }
  },
  mocha: {
    timeout: 600000
  }
}
