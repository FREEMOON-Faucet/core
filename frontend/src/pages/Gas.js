import { useState, useEffect } from "react"
import styled from "styled-components"
import { RiGasStationFill } from "react-icons/ri"
import axios from "axios"
import Web3 from "web3"

const GasContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`

const Title = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 40px;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
`

const Bar = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 60%;
  max-width: 650px;
  height: 40px;
  margin-top: 20px;

  @media screen and (orientation: portrait) {
    flex-direction: column;
    width: 80%;
    height: 100px;
  }
`

const Input = styled.input`
  text-align: center;
  width: 100%;
  max-width: 550px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: 2px solid black;
  border-radius: 4px;
  font-family: Courier New;
  font-size: 1.2rem;
  letter-spacing: 1px;
`

const Fill = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 40px;
  margin: 0;
  border: 2px solid black;
  border-radius: 4px;
  cursor: pointer;

  @media screen and (orientation: portrait) {
    width: 100%;
    max-width: 650px;
    margin-top: 2px;
  }
`

const Message = styled.div`
  width: 80%;
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-top: 10px;
`

const Detail = styled.p`
  display: flex;
  justify-content: center;
  width: 70%;
  margin: 20px 0;
  font-size: 1.2rem;
  text-align: center;
`


export default function Gas({ provider }) {

  const [ address, setAddress ] = useState("")
  const [ message, setMessage ] = useState("Connect wallet or input address to receive gas.")

  useEffect(() => {
    if(provider) {
      setAddress(provider.accounts[0])
    }
  }, [ provider ])

  const validate = async () => {
    if(address.length === 42) {
      setAddress("")
      try {
        setMessage(`Please wait ...`)
        const response = await axios.post(`http://localhost:3001/api/v1/retrieve`, {
          walletAddress: address
        })
        setMessage(`Success. Transaction hash: ${response.data.txHash}`)
      } catch(err) {
        if(err.response) setMessage(err.response.data)
        else setMessage(`Failed to connect to faucet.`)
      }
    }
  }

  return (
    <GasContainer>
      <Title>FSN Gas Faucet</Title>
      <Detail>
        Here you can claim FSN gas for an address. There are a number of requirements that quantify a valid address. It must have zero balance.
        It must have zero outgoing historical transactions. In other words, the address must be brand new. You can only request gas for a new address
        once per day.
      </Detail>
      <Bar>
        <Input placeholder="Your Fusion address here ..." value={address} onChange={e => setAddress(e.target.value)} spellCheck="false"/>
        <Fill onClick={() => validate()}>
          <RiGasStationFill size="40"/>
        </Fill>
      </Bar>
      <Message>
        {message}
      </Message>

    </GasContainer>
  )
}
