'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  /**
   * Retrieve a record.
   *
   * @return {Object}
   */

  async findOne(ctx) {
    const { id } = ctx.params

    const entity = await strapi.services['news-contents'].findOne({ id })

    // 좋아요 카운트
    entity.like_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'news', type_id_eq: id, expression: true })
    // 싫어요 카운트
    entity.hate_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'news', type_id_eq: id, expression: false })
    // 코멘트 카운트
    const commentCount = await strapi
      .query('comments')
      .count({ type_eq: 'news', type_id_eq: id })

    const reCommentCount = await strapi
      .query('re-comments')
      .count({ type_eq: 'news', type_id_eq: id })

    entity.comment_count = commentCount + reCommentCount
    // 1차 댓글
    entity.comment = await strapi
      .query('comments')
      .find({ type_eq: 'news', type_id_eq: 1178 })

    return sanitizeEntity(entity, { model: strapi.models['news-contents'] })
  },
}
