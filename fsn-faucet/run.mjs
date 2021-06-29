import express from "express" // web framework
import compression from "compression" // makes files smaller, thus app is faster
import Mongoose from "mongoose" // mongodb object modelling tool
import cors from "cors" // allow cross origin resource sharing
import _ from "lodash" // utility functions for javascript
import BigNumber from "bignumber.js" // arbitrary precision arithmetic
import helmet from "helmet" // secure app by setting http headers
import moment from "moment" // date library
import bodyParser from "body-parser" // parse incoming request bodies
import rateLimit from "express-rate-limit" // limit repeated requests to the api
import Web3 from "web3"

import Address from "./models/Addresses.mjs"


const app = express()
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 100 requests per windowMs
})
const port = 3001
const FSN_MAINNET = "wss://mainnetpublicgateway1.fusionnetwork.io:10001"
const FSN_TESTNET = "wss://testnetpublicgateway1.fusionnetwork.io:10001"
let web3
let provider

// apply to all requests
app.use(limiter)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(helmet())

// Database
Mongoose.connect(
  "mongodb+srv://dbUser:b2ebnBRjsNAp1DFS@fsn-addresses.yn8dh.mongodb.net/faucet",
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)


const keepWeb3Alive = () => {
  provider = new Web3.providers.WebsocketProvider(FSN_MAINNET)
  provider.on("connect", function() {
    console.log(`Web3 has successfully connected`)
    web3._isConnected = true
  })
  provider.on("error", function(err) {
    console.log(`Web3 has disconnected, ${err}`)
    provider.disconnect()
  })
  provider.on("end", function(err) {
    console.log(`Web3 lost connection, reconnecting ...`)
    web3._isConnected = false
    setTimeout(() => {
      keepWeb3Alive()
    }, 500)
  })
  web3 = new Web3(provider)
}


const payoutFSN = async addr => {
  return "1234567"
}


app.post("/api/v1/retrieve", async (req, res) => {
  try {
    // return Bad Request whenever no body was passed
    if (!req.body) return res.sendStatus(400)

    let { walletAddress } = req.body

    // Let's check if the walletAddress is actually valid
    if (!web3.utils.isAddress(walletAddress)) {
      throw new Error("Walletaddress does not appear to be valid.")
    }

    // Let's filter out the real ip address from the headers
    let ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress

    // ipAddress, walletAddress -> date (person can only do the faucet every 7 days)
    const SEVEN_DAYS = moment().subtract("7", "days").toDate()
    let walletAppliedRecently = await Address.findOne({
      walletAddress,
      lastVisit: { $gte: SEVEN_DAYS },
    }).lean()

    let ipRecent = await Address.findOne({
        ipAddress,
        lastVisit: { $gte: SEVEN_DAYS },
    }).lean()

    if (walletAppliedRecently || ipRecent) {
      throw new Error("User has recently got FSN from faucet")
    }

    let txCount = await web3.eth.getTransactionCount(walletAddress)

    if (txCount !== 0) {
      throw new Error("This wallet address is not an empty account")
    }

    // Let's execute the payout
    let txHash = await payoutFSN()

    await Address.updateOne(
      {
        walletAddress,
        ipAddress,
      },
      { walletAddress, ipAddress, lastVisit: new Date() },
      { upsert: true }
    )

    return res.json({
      txHash,
      status: "success",
    })
  } catch(err) {
    console.error(err)
    res.status(400).send(err.message)
  }
})

app.listen(port, () => {
  console.log(`API Server listening on port ${port}`)
})

keepWeb3Alive()
