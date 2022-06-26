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
    let writerQuery = ''
    let categoryQuery = ''
    let startQuery = ''
    let limitQuery = ''
    if (ctx.query.writer) {
      writerQuery = `AND boards.writer = ${ctx.query.writer}`
    }
    if (ctx.query.category) {
      categoryQuery = `AND boards.category = ${ctx.query.category}`
    }
    if (ctx.query.start) {
      startQuery = `offset ${ctx.query.start}`
    }
    if (ctx.query.limit) {
      limitQuery = `LIMIT ${ctx.query.limit}`
    }

    let sql = `
      select a.*
      from (select boards.*,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND 'like' = true)  AS like_count,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND hate = true) AS hate_count,
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
              AND boards.writing_type != N'일반 게시물'
              ${categoryQuery} ${writerQuery}
            ORDER BY boards.created_at DESC) as a
      UNION ALL
      select b.*
      from (select boards.*,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND 'like' = true)  AS like_count,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND hate = true) AS hate_count,
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
              AND boards.writing_type = N'일반 게시물'
              ${categoryQuery} ${writerQuery}
            ORDER BY boards.created_at DESC ${startQuery} ${limitQuery}) as b
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
      .count({ type_eq: 'board', type_id_eq: id, like: true })
    // 싫어요 카운트
    entity.hate_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'board', type_id_eq: id, hate: true })
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
