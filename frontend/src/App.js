import { useState } from "react"
import styled from "styled-components"
import GlobalStyle from "./globalStyle"
import logo from "./icons/android-chrome-512x512.png"
import Content from "./pages/Content"

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`

const Logo = styled.img`
  width: 120px;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
  height: 200px;
`

const Name = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 50px;
`

const Title = styled.div`
  display: flex;
  justify-content: center;
  font-size: 2rem;
` 
const Subtitle = styled.div`
  display: flex;
  justify-content: center;
  font-size: 1.5rem;
`

const Nav = styled.ul`
  list-style: none;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 80%;
  height: 40px;
  margin: 0;
  padding: 0;
`

const Tab = styled.li`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 100%;
  outline: ${props => props.active ? "2px solid black" : "1px solid black"};
  font-size: 0.9rem;
  cursor: pointer;
`

function App() {
  const [ active, setActive ] = useState(0)

  return (
    <AppContainer>
      <GlobalStyle />
      <Logo src={logo}/>
      <Header>
        <Name>
          <Title>
            The FREEMOON Faucet
          </Title>
          <Subtitle>
            Money on Tap
          </Subtitle>
        </Name>
        <Nav>
          <Tab active={active === 0} onClick={() => setActive(0)}>Gas Faucet</Tab>
          <Tab active={active === 1} onClick={() => setActive(1)}>FREEMOON Faucet</Tab>
          <Tab active={active === 2} onClick={() => setActive(2)}>Airdrops</Tab>
          <Tab active={active === 3} onClick={() => setActive(3)}>Bot Army</Tab>
        </Nav>
      </Header>
      <Content display={active}>

      </Content>
    </AppContainer>
  );
}

export default App
