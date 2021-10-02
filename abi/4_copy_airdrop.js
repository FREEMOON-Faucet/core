const fs = require("fs")

console.log("Reading from artifacts ...")

fs.readFile("artifacts/contracts/airdrop-v2/AirdropV2.sol/AirdropV2.json", "utf8", readingFile)

function readingFile(error, data) {
  if(error) {
    console.log(error)
  } else {
    abi = (JSON.parse(data)).abi

    fs.writeFile("abi/airdrop.js", JSON.stringify(abi, null, 2), "utf8", writeFile)
  }
}

function writeFile(error) {
  if(error) {
    console.log(error)
  } else {
    console.log("ABI copied into airdrop.js")
  }
}

