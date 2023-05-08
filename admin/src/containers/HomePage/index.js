/*
 *
 * HomePage
 *
 */
/* eslint-disable */
import React, { memo, useMemo } from 'react'
import { FormattedMessage } from 'react-intl'
import { get } from 'lodash'
import { auth, LoadingIndicatorPage } from 'strapi-helper-plugin'
import PageTitle from '../../components/PageTitle'
import { useModels } from '../../hooks'

import useFetch from './hooks'
import Container from 'strapi-plugin-upload/admin/src/components/Container'

const HomePage = ({ history: { push } }) => {
  const { error, isLoading, posts } = useFetch()
  // Temporary until we develop the menu API
  const {
    collectionTypes,
    singleTypes,
    isLoading: isLoadingForModels,
  } = useModels()

  const handleClick = (e) => {
    e.preventDefault()

    push(
      '/plugins/content-type-builder/content-types/plugins::users-permissions.user?modalType=contentType&kind=collectionType&actionType=create&settingType=base&forTarget=contentType&headerId=content-type-builder.modalForm.contentType.header-create&header_icon_isCustom_1=false&header_icon_name_1=contentType&header_label_1=null'
    )
  }

  const hasAlreadyCreatedContentTypes = useMemo(() => {
    const filterContentTypes = (contentTypes) =>
      contentTypes.filter((c) => c.isDisplayed)

    return (
      filterContentTypes(collectionTypes).length > 1 ||
      filterContentTypes(singleTypes).length > 0
    )
  }, [collectionTypes, singleTypes])

  if (isLoadingForModels) {
    return <LoadingIndicatorPage />
  }

  const headerId = hasAlreadyCreatedContentTypes
    ? 'HomePage.greetings'
    : 'app.components.HomePage.welcome'
  const username = get(auth.getUserInfo(), 'firstname', '')
  const linkProps = hasAlreadyCreatedContentTypes
    ? {
        id: 'app.components.HomePage.button.blog',
        href: 'https://strapi.io/blog/',
        onClick: () => {},
        type: 'blog',
        target: '_blank',
      }
    : {
        id: 'app.components.HomePage.create',
        href: '',
        onClick: handleClick,
        type: 'documentation',
      }

  return (
    <>
      <FormattedMessage id="HomePage.helmet.title">
        {(title) => <PageTitle title={title} />}
      </FormattedMessage>
      <Container className="container-fluid">
        <div className="col-lg-8 col-md-12">
          <iframe
            width="130%"
            height="1100px"
            src="https://lookerstudio.google.com/embed/reporting/09fdb755-eb74-4591-9efe-76e02159bf41/page/oyFID"
          />
        </div>
      </Container>
    </>
  )
}

export default memo(HomePage)
