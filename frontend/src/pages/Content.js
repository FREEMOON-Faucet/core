import styled from "styled-components"
import Gas from "./Gas"

const ContentContainer = styled.div`
  width: 100%;
  height: 100%;
  margin-top: 20px;
`

export default function Content({ display, provider }) {

  if(display === 0) {
    return (
      <ContentContainer>
        <Gas provider={provider}/>
      </ContentContainer>
    )
  } else if(display === 1) {
    return (
      <ContentContainer>
      </ContentContainer>
    )
  } else if(display === 2) {
    return (
      <ContentContainer>
      </ContentContainer>
    )
  } else if(display === 3) {
    return (
      <ContentContainer>
      </ContentContainer>
    )
  }
}