'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    let query = ''
    if (ctx.query.category) {
      query = `AND boards.category = ${ctx.query.category}`
    }

    let sql = `
      select boards.*,
             (select count(1)
              from 'article_elements'
              where boards.id = article_elements.type_id
                AND type = 'board'
                AND expression = true)  AS like_count,
             (select count(1)
              from article_elements
              where boards.id = article_elements.type_id
                AND type = 'board'
                AND expression = false) AS hate_count,
             (select count(1)
              from comments
              where boards.id = comments.type_id
                AND type = 'board')     AS comment_count,
             (select count(1)
              from re_comments
              where boards.id = re_comments.type_id
                AND type = 'board')     AS re_comment_count,
             U.nick_name
      from boards
             INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
      WHERE boards.is_delete = false
        ${query}
      ORDER BY boards.created_at DESC
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['boards'] })
    )
  },
  async findOne(ctx) {
    const { id } = ctx.params

    const entity = await strapi.services['boards'].findOne({ id })

    // 좋아요 카운트
    entity.like_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'board', type_id_eq: id, expression: true })
    // 싫어요 카운트
    entity.hate_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'board', type_id_eq: id, expression: false })
    // 코멘트 카운트
    const commentCount = await strapi
      .query('comments')
      .count({ type_eq: 'board', type_id_eq: id })

    const reCommentCount = await strapi
      .query('re-comments')
      .count({ type_eq: 'board', type_id_eq: id })

    entity.comment_count = commentCount + reCommentCount
    // 1차 댓글
    entity.comment = await strapi
      .query('comments')
      .find({ type_eq: 'board', type_id_eq: id })

    return sanitizeEntity(entity, { model: strapi.models['boards'] })
  },
}
