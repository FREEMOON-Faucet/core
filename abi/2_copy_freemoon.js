const fs = require("fs")

console.log("Reading from artifacts ...")

fs.readFile("artifacts/contracts/tokens/FMN.sol/FMN.json" , "utf8", readingFile)

function readingFile(error, data) {
  if(error) {
    console.log(error)
  } else {
    abi = (JSON.parse(data)).abi

    fs.writeFile("abi/freemoon.js", JSON.stringify(abi), "utf8", writeFile)
  }
}

function writeFile(error) {
  if(error) {
    console.log(error)
  } else {
    console.log("ABI copied into freemoon.js")
  }
}

