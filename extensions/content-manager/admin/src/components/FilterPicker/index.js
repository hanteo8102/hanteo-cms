import React, { memo, useCallback, useMemo, useReducer, useRef } from 'react'
import { withRouter } from 'react-router'
import PropTypes from 'prop-types'
import { capitalize, get } from 'lodash'
import { Collapse } from 'reactstrap'
import { FormattedMessage } from 'react-intl'
import {
  PluginHeader,
  getFilterType,
  useUser,
  findMatchingPermissions,
  useGlobalContext,
} from 'strapi-helper-plugin'

import pluginId from '../../pluginId'
import { formatFiltersToQuery, getTrad } from '../../utils'
import Container from '../Container'
import FilterPickerOption from '../FilterPickerOption'
import { Flex, Span, Wrapper } from './components'
import init from './init'
import reducer, { initialState } from './reducer'

const NOT_ALLOWED_FILTERS = [
  'json',
  'component',
  'media',
  'richtext',
  'dynamiczone',
]

function FilterPicker({
  contentType,
  filters,
  isOpen,
  metadatas,
  name,
  toggleFilterPickerState,
  setQuery,
  slug,
}) {
  const { emitEvent } = useGlobalContext()
  const emitEventRef = useRef(emitEvent)
  const { userPermissions } = useUser()
  const readActionAllowedFields = useMemo(() => {
    const matchingPermissions = findMatchingPermissions(userPermissions, [
      {
        action: 'plugins::content-manager.explorer.read',
        subject: slug,
      },
    ])

    return get(matchingPermissions, ['0', 'properties', 'fields'], [])
  }, [userPermissions, slug])

  let timestamps = get(contentType, ['options', 'timestamps'])

  if (!Array.isArray(timestamps)) {
    timestamps = []
  }

  const actions = [
    {
      label: getTrad(
        'components.FiltersPickWrapper.PluginHeader.actions.clearAll'
      ),
      kind: 'secondary',
      onClick: () => {
        toggleFilterPickerState()
        setQuery({ _where: [] }, 'remove')
      },
    },
    {
      label: getTrad(
        'components.FiltersPickWrapper.PluginHeader.actions.apply'
      ),
      kind: 'primary',
      type: 'submit',
    },
  ]

  const allowedAttributes = Object.keys(get(contentType, ['attributes']), {})
    .filter((attr) => {
      const current = get(contentType, ['attributes', attr], {})

      if (
        !readActionAllowedFields.includes(attr) &&
        attr !== 'id' &&
        !timestamps.includes(attr)
      ) {
        return false
      }

      return (
        !NOT_ALLOWED_FILTERS.includes(current.type) &&
        current.type !== undefined
      )
    })
    .sort()
    .map((attr) => {
      const current = get(contentType, ['attributes', attr], {})

      return { name: attr, type: current.type, options: current.enum || null }
    })

  const [state, dispatch] = useReducer(reducer, initialState, () =>
    init(initialState, allowedAttributes[0] || {})
  )

  const modifiedData = state.get('modifiedData').toJS()
  const handleChange = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: name.split('.'),
      value,
    })
  }

  const nameTranslate = (name) => {
    switch (name) {
      case 'Boards':
        return '게시판'
      case 'Banners':
        return '배너 광고'
      case 'Categories':
        return '카테고리'
      case 'BannerCategories':
        return '배너 카테고리'
      case 'Popups':
        return '팝업'
      case 'NewsContents':
        return '뉴스'
      case 'NewsPapers':
        return '한터 신문'
      case 'Notices':
        return '공지'
      case 'Users':
        return '회원'
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
      case 'AdvertisementBoard':
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
      case 'AdvertisementPushAgrees':
        return '광고주게시판 알림이력'
      case 'MemberPushAgrees':
        return '멤버 알림이력'
      case 'ViewBoards':
        return '읽은 게시물'
      default:
        return name
    }
  }

  const renderTitle = () => (
    <FormattedMessage
      id={`${pluginId}.components.FiltersPickWrapper.PluginHeader.title.filter`}
    >
      {(message) => (
        <span>
          {capitalize(nameTranslate(name))}&nbsp;-&nbsp;
          <span>{message}</span>
        </span>
      )}
    </FormattedMessage>
  )

  const initialFilter = useMemo(() => {
    const type = get(allowedAttributes, [0, 'type'], '')
    const [filter] = getFilterType(type)

    let value = ''

    switch (type) {
      case 'boolean': {
        value = 'true'
        break
      }
      case 'number': {
        value = 0
        break
      }
      case 'enumeration': {
        value = get(allowedAttributes, [0, 'options', 0], '')
        break
      }
      default: {
        value = ''
      }
    }

    const initFilter = {
      name: get(allowedAttributes, [0, 'name'], ''),
      filter: filter.value,
      value,
    }

    return initFilter
  }, [allowedAttributes])

  // Set the filters when the collapse is opening
  const handleEntering = () => {
    const currentFilters = filters
    const initialFilters = currentFilters.length
      ? currentFilters
      : [initialFilter]

    dispatch({
      type: 'SET_FILTERS',
      initialFilters,
      attributes: get(contentType, 'attributes', {}),
    })
  }

  const addFilter = () => {
    dispatch({
      type: 'ADD_FILTER',
      filter: initialFilter,
    })
  }

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const nextFilters = formatFiltersToQuery(modifiedData, metadatas)
      const useRelation = nextFilters._where.some((obj) =>
        Object.keys(obj)[0].includes('.')
      )

      emitEventRef.current('didFilterEntries', { useRelation })
      setQuery({ ...nextFilters, page: 1 })
      toggleFilterPickerState()
    },
    [modifiedData, setQuery, toggleFilterPickerState, metadatas]
  )

  const handleRemoveFilter = (index) => {
    if (index === 0 && modifiedData.length === 1) {
      toggleFilterPickerState()

      return
    }

    dispatch({
      type: 'REMOVE_FILTER',
      index,
    })
  }

  const getAttributeType = useCallback(
    (filter) => {
      const attributeType = get(
        contentType,
        ['attributes', filter.name, 'type'],
        ''
      )

      if (attributeType === 'relation') {
        return get(
          metadatas,
          [filter.name, 'list', 'mainField', 'schema', 'type'],
          'string'
        )
      }

      return attributeType
    },
    [contentType, metadatas]
  )

  return (
    <Collapse isOpen={isOpen} onEntering={handleEntering}>
      <Container style={{ backgroundColor: 'white', paddingBottom: 0 }}>
        <form onSubmit={handleSubmit}>
          <PluginHeader
            actions={actions}
            title={renderTitle}
            description={{
              id: `${pluginId}.components.FiltersPickWrapper.PluginHeader.description`,
            }}
          />
          <Wrapper>
            {modifiedData.map((filter, key) => (
              <FilterPickerOption
                {...filter}
                allowedAttributes={allowedAttributes}
                index={key}
                modifiedData={modifiedData}
                onChange={handleChange}
                onClickAddFilter={addFilter}
                onRemoveFilter={handleRemoveFilter}
                type={getAttributeType(filter)}
                showAddButton={key === modifiedData.length - 1}
                // eslint-disable-next-line react/no-array-index-key
                key={key}
                collectionName={name}
              />
            ))}
          </Wrapper>
          <Flex>
            <Span onClick={toggleFilterPickerState}>
              <FormattedMessage id="content-manager.components.FiltersPickWrapper.hide" />
              &nbsp;
            </Span>
          </Flex>
        </form>
      </Container>
    </Collapse>
  )
}

FilterPicker.defaultProps = {
  name: '',
}

FilterPicker.propTypes = {
  contentType: PropTypes.object.isRequired,
  filters: PropTypes.array.isRequired,
  isOpen: PropTypes.bool.isRequired,
  metadatas: PropTypes.object.isRequired,
  name: PropTypes.string,
  setQuery: PropTypes.func.isRequired,
  slug: PropTypes.string.isRequired,
  toggleFilterPickerState: PropTypes.func.isRequired,
}

export default withRouter(memo(FilterPicker))
