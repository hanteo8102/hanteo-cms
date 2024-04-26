import React, { useState } from 'react'
import PropTypes from 'prop-types'
import matchSorter from 'match-sorter'
import { sortBy } from 'lodash'
import { FormattedMessage } from 'react-intl'
import { auth } from 'strapi-helper-plugin'

import LeftMenuLink from '../LeftMenuLink'
import LeftMenuLinkHeader from '../LeftMenuLinkHeader'
import LeftMenuListLink from './LeftMenuListLink'
import EmptyLinksList from './EmptyLinksList'
import EmptyLinksListWrapper from './EmptyLinksListWrapper'

const LeftMenuLinksSection = ({
  section,
  searchable,
  location,
  links,
  emptyLinksListMessage,
  shrink,
}) => {
  const [search, setSearch] = useState('')

  const userInfo = auth.getUserInfo()

  const filteredList = sortBy(
    matchSorter(links, search, {
      keys: ['label'],
    }),
    'label'
  )

  const handleLabel = (defaultLabel) => {
    console.log(defaultLabel)
    switch (defaultLabel) {
      case 'AdvertisementPushAgrees':
        return '광고주게시판 알림이력'
      case 'MemberPushAgrees':
        return '멤버 알림이력'
      case 'Users':
        return '회원'
      case 'Boards':
        return '게시판'
      case 'Categories':
        return '카테고리'
      case 'Notices':
        return '공지'
      case 'NewsContents':
        return '뉴스'
      case 'NewsPapers':
        return '한터 신문'
      case 'Banners':
        return '배너 광고'
      case 'BannerCategories':
        return '배너 카테고리'
      case 'Popups':
        return '팝업'
      case 'ArticleElements':
        return '리액션'
      case 'Comments':
        return '댓글'
      case 'ReComments':
        return '대댓글'
      case 'MessageBoards':
        return '쪽지함'
      case 'BlockUserLists':
        return '차단 리스트'
      case 'AddressBooks':
        return '주소록 카테고리'
      case 'AddressGroups':
        return '주소록 그룹'
      case 'AddressLists':
        return '주소록 리스트'
      case 'AdvertisementBoards':
        return '광고주 게시판'
      case 'ComplainTypes':
        return '신고 유형'
      case 'ComplainHistories':
        return '신고 이력'
      case 'Complains':
        return '신고 관리'
      case 'CommentPushAgrees':
        return '댓글 알림이력'
      case 'PushHistories':
        return '푸시알림 관리'
      case 'Tokens':
        return '토큰 관리'
      case 'MyPageReadStates':
        return '마이페이지 관리'
      case 'WithdrawalTypes':
        return '회원탈퇴'
      case 'WithdrawalHistories':
        return '회원탈퇴 기록'
      case 'ViewBoards':
        return '읽은 게시물'
      default:
        return defaultLabel
    }
  }

  if (userInfo.roles[0].id >= 2 && section === 'general') {
    return null
  }

  return (
    <>
      <LeftMenuLinkHeader
        section={section}
        searchable={searchable}
        setSearch={setSearch}
        search={search}
      />
      <LeftMenuListLink section={section} shrink={shrink}>
        {filteredList.length > 0 ? (
          filteredList.map((link, index) => {
            if (
              link.destination === '/marketplace' ||
              link.destination === '/list-plugins'
            ) {
              return null
            }
            return (
              <LeftMenuLink
                location={location}
                // There is no id or unique value in the link object for the moment.
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                iconName={link.icon}
                label={handleLabel(link.label)}
                destination={link.destination}
                notificationsCount={link.notificationsCount || 0}
                search={link.search}
              />
            )
          })
        ) : (
          <EmptyLinksListWrapper>
            <FormattedMessage
              id={emptyLinksListMessage}
              defaultMessage="No plugins installed yet"
            >
              {(msg) => <EmptyLinksList>{msg}</EmptyLinksList>}
            </FormattedMessage>
          </EmptyLinksListWrapper>
        )}
      </LeftMenuListLink>
    </>
  )
}

LeftMenuLinksSection.defaultProps = {
  shrink: false,
}

LeftMenuLinksSection.propTypes = {
  section: PropTypes.string.isRequired,
  searchable: PropTypes.bool.isRequired,
  shrink: PropTypes.bool,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  links: PropTypes.arrayOf(PropTypes.object).isRequired,
  emptyLinksListMessage: PropTypes.string,
}

LeftMenuLinksSection.defaultProps = {
  emptyLinksListMessage: 'components.ListRow.empty',
}

export default LeftMenuLinksSection
