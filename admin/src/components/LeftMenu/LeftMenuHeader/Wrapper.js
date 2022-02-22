import styled from 'styled-components'
import PropTypes from 'prop-types'

import Logo from '../../../assets/images/logo-strapi.png'

// background-color: ${(props) =>
//   props.theme.main.colors.leftMenu['background-header-link']};

const Wrapper = styled.div`
  background-color: ${(props) =>
    props.theme.main.colors.leftMenu['background-header-link']};
  height: ${(props) => props.theme.main.sizes.leftMenu.height};

  .leftMenuHeaderLink {
    &:hover {
      text-decoration: none;
    }
  }

  .projectName {
    display: block;
    width: 100%;
    height: ${(props) => props.theme.main.sizes.leftMenu.height};
    font-size: 2rem;
    color: #fff;
    text-align: center;
    padding-top: 10px;
    font-weight: bold;
    border-bottom: 1px solid rgba(227, 233, 243, 0.75);
  }
`

Wrapper.defaultProps = {
  theme: {
    main: {
      colors: {
        leftMenu: {},
      },
      sizes: {
        header: {},
        leftMenu: {},
      },
    },
  },
}

Wrapper.propTypes = {
  theme: PropTypes.object,
}

export default Wrapper
