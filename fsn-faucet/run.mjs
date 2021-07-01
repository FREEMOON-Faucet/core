// SPDX-License-Identifier: GPL-3.0-or-later

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
import Web3 from "web3" // interacts with blockchain
import web3FusionExtend from "web3-fusion-extend" // interacts with fusion blockchain
import dotenv from "dotenv"

import Address from "./models/Addresses.mjs"

dotenv.config()

const app = express()
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 100 requests per windowMs
})
const port = 3001
const FSN_MAINNET = {
    gateway: "wss://mainnetpublicgateway1.fusionnetwork.io:10001",
    ID: "32659"
}
const FSN_TESTNET = {
    gateway: "wss://testnetpublicgateway1.fusionnetwork.io:10001",
    ID: "46688"
}

// Set network parameters
const NETWORK = FSN_TESTNET

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
    provider = new Web3.providers.WebsocketProvider(NETWORK.gateway)
    provider.on("connect", function() { 
        web3._isConnected = true
    })
    provider.on("error", function(err) {
        provider.disconnect()
    })
    provider.on("end", function(err) {
        web3._isConnected = false
        setTimeout(() => {
            keepWeb3Alive()
        }, 500)
    })
    web3 = new Web3(provider)
    web3 = web3FusionExtend.extend(web3)
}


const payoutFSN = async addr => {
    const FAUCET = await web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
    let tx = {
        from: FAUCET.address,
        to: addr,
        asset: web3.fsn.consts.FSNToken,
        value: web3.utils.toHex(web3.utils.toWei("2", "gwei")),
        chainId: web3.utils.toHex(NETWORK.ID)
    }
    let { gas, gasPrice } = await web3.fsntx.buildSendAssetTx(tx)
    tx.gas = gas
    tx.gasPrice = gasPrice

    try {
        const rawTx = await FAUCET.signTransaction(tx)
        const sent = await web3.eth.sendSignedTransaction(rawTx.rawTransaction)
        return sent
    } catch(err) {
        throw new Error("Sending faucet gas failed: ", err.message)
    }
}


app.post("/api/v1/retrieve", async (req, res) => {
    try {
        // return Bad Request whenever no body was passed
        if (!req.body) return res.sendStatus(400)

        let { walletAddress } = req.body
        walletAddress = walletAddress.toLowerCase()

        // Let's check if the walletAddress is actually valid
        if (!web3.utils.isAddress(walletAddress)) {
            throw new Error("Wallet address does not appear to be valid.")
        }

        // Let's filter out the real ip address from the headers
        let ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress

        // ipAddress, walletAddress -> date (person can only do the faucet every 7 days)
        // const SEVEN_DAYS = moment().subtract("7", "days").toDate()
        const ONE_DAY = moment().subtract("1", "days").toDate()
        
        let walletAppliedRecently = await Address.findOne({
            walletAddress
        }).lean()

        let ipRecent = await Address.findOne({
            ipAddress,
            lastVisit: { $gte: ONE_DAY },
        }).lean()

        let bal = Number(web3.utils.fromWei(await web3.eth.getBalance(walletAddress)))
        let txCount = await web3.eth.getTransactionCount(walletAddress)

        if(walletAppliedRecently) {
            throw new Error("Address has already claimed gas.")
        } else if(ipRecent) {
            throw new Error("Your IP has already claimed gas for an address recently.")
        } else if(txCount !== 0) {
            throw new Error("Must be a new, unused address.")
        } else if(bal) {
            throw new Error("Address has a non-zero balance.")
        }    

        // Let's execute the payout
        let txHash = await payoutFSN(walletAddress)
        txHash = txHash.transactionHash

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
            status: `Success. Gas will be sent to ${walletAddress} shortly.`,
        })
    } catch(err) {
        console.error(err.message)
        res.status(400).send(err.message)
    }
})

app.listen(port, () => {
    console.log(`API Server listening on port ${port}`)
})

keepWeb3Alive()

