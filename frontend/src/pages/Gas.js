import { useState } from "react"
import styled from "styled-components"
import { RiGasStationFill } from "react-icons/ri"
import Web3 from "web3"
import axios from "axios"

const GasContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  height: 350px;
`

const Input = styled.input`
  text-align: center;
  width: 600px;
  height: 40px;
  border: 2px solid black;
  font-family: Courier New;
  font-size: 1.2rem;
  letter-spacing: 1px;
`

const Fill = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 50px;
  outline: 2px solid black;
`

const Message = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50%;
  height: 200px;
  font-size: 1.4rem;
  text-align: center;
`


export default function Gas() {

  const web3 = new Web3(Web3.givenProvider)

  const [ address, setAddress ] = useState("")
//  const [ message, setMessage ] = useState("")

  const validate = async () => {
    if(address.length === 42) {
      console.log("sending")
      const res = await axios.post("http://207.180.248.107:3001/api/v1/retrieve", {
        walletAddress: address
      })
//      setMessage(res.data)
      setAddress("")
    }
  }

  return (
    <GasContainer>
      <Input placeholder="Your FSN Testnet address here ..." value={address} onChange={e => setAddress(e.target.value)}/>
      <Fill onClick={() => validate()}>
        <RiGasStationFill size="40"/>
      </Fill>
    </GasContainer>
  )
}
