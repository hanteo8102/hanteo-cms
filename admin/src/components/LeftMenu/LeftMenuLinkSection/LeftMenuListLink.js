import styled from 'styled-components'

const LeftMenuListLink = styled.div`
  max-height: ${({ section }) =>
    section === 'collectionType' ? '2000px' : '180px'};
  margin-bottom: 19px;
  margin-right: 25px;
  overflow: auto;
`

export default LeftMenuListLink
