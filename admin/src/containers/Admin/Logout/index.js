/**
 *
 * Logout
 *
 */

/* eslint-disable */
import React, {useState} from 'react';
import {FormattedMessage} from 'react-intl';
import {withRouter} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'reactstrap';
import {get} from 'lodash';
import {auth} from 'strapi-helper-plugin';
import Wrapper from './components';

const Logout = ({history: {push}}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hanteoHomepage = 'https://hanteo2050.com/';

  const handleGoToMe = () => {
    push({
      pathname: `/me`,
    });
  };

  const onGoToHomePage = () => {
    window.open(hanteoHomepage, '_blank');
  }

  const handleLogout = () => {
    auth.clearAppStorage();
    push('/auth/login');
  };

  const toggle = () => setIsOpen(prev => !prev);

  const userInfo = auth.getUserInfo();
  // const displayName =
  //   userInfo && userInfo.firstname && userInfo.lastname
  //     ? get(userInfo, 'username', '')
  //     : `${userInfo.lastname}${userInfo.firstname}`;

  const displayName = userInfo && userInfo.username
    ? `${userInfo.username}`
    : userInfo && userInfo.firstname && userInfo.lastname
      ? `${userInfo.lastname}${userInfo.firstname}`
      : `${userInfo.email}`;

  return (
    <Wrapper>
      <ButtonDropdown isOpen={isOpen} toggle={toggle}>
        <DropdownToggle>
          {displayName}
          <FontAwesomeIcon icon="caret-down"/>
        </DropdownToggle>
        <DropdownMenu className="dropDownContent">
          {/*<a href={hanteoHomepage} target="_blank" rel="noopener noreferrer">*/}
          <DropdownItem className="item" onClick={onGoToHomePage}>
            <FormattedMessage id="app.components.Logout.homepage"/>
          </DropdownItem>
          {/*</a>*/}
          <DropdownItem onClick={handleGoToMe} className="item">
            <FormattedMessage id="app.components.Logout.profile"/>
          </DropdownItem>
          <DropdownItem onClick={handleLogout}>
            <FormattedMessage id="app.components.Logout.logout"/>
            <FontAwesomeIcon icon="sign-out-alt"/>
          </DropdownItem>
        </DropdownMenu>
      </ButtonDropdown>
    </Wrapper>
  );
};

export default withRouter(Logout);
