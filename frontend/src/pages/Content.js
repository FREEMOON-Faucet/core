import styled from "styled-components"
import Gas from "./Gas"

export default function Content({ display }) {

  if(display === 0) {
    return (
      <>
        <Gas />
      </>
    )
  } else if(display === 1) {
    return (
      <>
      </>
    )
  } else if(display === 2) {
    return (
      <>
      </>
    )
  } else if(display === 3) {
    return (
      <>
      </>
    )
  }
}