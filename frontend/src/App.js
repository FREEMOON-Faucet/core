import { useState } from "react"
import styled from "styled-components"
import { FaPlug } from "react-icons/fa"
import GlobalStyle from "./globalStyle"
import logo from "./icons/android-chrome-512x512.png"
import Content from "./pages/Content"

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
`

const Logo = styled.img`
  width: 20%;
  max-width: 120px;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 1% 0;
`

const Title = styled.div`
  display: flex;
  justify-content: center;
  font-size: 2rem;
  text-align: center;
  margin: 0.2% 0;
`

const Subtitle = styled.div`
  display: flex;
  justify-content: center;
  font-size: 1.5rem;
  font-style: italic;
  text-align: center;
`

const Nav = styled.ul`
  list-style: none;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 80%;
  height: 50px;
  margin: 1% 0;
  padding: 0;

  @media screen and (orientation: portrait) {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 80%;
    height: 200px;
  }
`

const Tab = styled.li`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: ${props => props.wallet ? "30px" : "200px"};
  width: ${props => props.wallet ? "2%" : "30%"};
  height: 100%;
  margin: ${props => props.wallet ? "0 0 0 2%" : "0"};
  padding: 0 1%;
  border-top: ${props => props.wallet ? "1px solid #000" : "0"};
  border-right: ${props => props.wallet ? "1px solid #000" : "0"};
  border-left: ${props => props.wallet ? "1px solid #000" : "0"};
  border-bottom: ${props => props.active ? "2px solid #000" : "1px solid #000"};
  border-radius: ${props => props.wallet ? "4px" : "0"};
  text-align: center;
  font-size: 20px;
  font-weight: ${props => props.active ? "600" : "300"};
  cursor: pointer;
  opacity: ${props => props.connected || (!props.wallet && !props.active) ? "0.7" : "1"};

  @media screen and (orientation: portrait) {
    max-width: 100%;
    width: 100%;
    height: 30%;
    margin: ${props => props.wallet ? "2% 0" : "0"};
  }
`

function App() {

  const [ accounts, setAccounts ] = useState([])
  const [ provider, setProvider ] = useState({})
  const [ active, setActive ] = useState(0)

  const connect = async () => {
    const ethereum = window.ethereum
    if(ethereum) {
      try {
        setAccounts(await ethereum.request({ method: "eth_requestAccounts" }))
        setProvider(ethereum)
      } catch(err) {
        console.log(err.message)
        setAccounts([])
      }
    } else {
      setAccounts([])
    }

  }

  const checkConnect = () => {
    return window.ethereum.isConnected()
  }

  return (
    <AppContainer>
      <GlobalStyle/>
      <Header>
        <Logo src={logo} alt="The FREEMOON Faucet"/>
        <Title>
          The FREEMOON Faucet
        </Title>
        <Subtitle>
          Money on Tap
        </Subtitle>
      </Header>
      <Nav>
        <Tab active={active === 0} onClick={() => setActive(0)}>Gas Faucet</Tab>
        <Tab active={active === 1} onClick={() => setActive(1)}>FREEMOON Faucet</Tab>
        <Tab active={active === 2} onClick={() => setActive(2)}>Airdrops</Tab>
        <Tab active={active === 3} onClick={() => setActive(3)}>Bot Army</Tab>
        <Tab active={false} wallet={true} connected={accounts.length > 0} onClick={() => checkConnect() ? connect() : ""}><FaPlug size={25}/></Tab>
      </Nav>
      <Content display={active} provider={{ accounts: accounts, web3: provider }}/>
    </AppContainer>
  );
}

export default App
