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
    let writerQuery = ''
    const type = ctx.query.type
    const id = ctx.query.type_id
    const writer = ctx.query.writer

    if (type && id) {
      query = `AND comments.type = '${type}' AND comments.type_id = ${id}`
    }

    if (writer) {
      writerQuery = `AND comments.writer = '${writer}'`
    }

    let sql = `
      SELECT comments.*,
             (SELECT count(1)
              FROM article_elements
              WHERE comments.id = article_elements.type_id
                AND type = 'comment'
                AND good = true)                       AS good_count,
             (SELECT count(1)
              FROM article_elements
              WHERE comments.id = article_elements.type_id
                AND type = 'comment'
                AND hate = false)                      AS hate_count,
             (SELECT count(1)
              FROM re_comments
              WHERE comments.id = re_comments.comment) AS re_comment_count,
             U.nick_name,
             CASE
               WHEN comments.type = 'news' then 0
               WHEN comments.type = 'board'
                 THEN (SELECT category
                       FROM boards st1
                       WHERE st1.id = comments.type_id)
               end                                     AS category
      FROM comments
             INNER JOIN "users-permissions_user" AS U ON (comments.writer = U.id)
      WHERE comments.is_delete = false ${query} ${writerQuery}
      ORDER BY comments.created_at
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['comments'] })
    )
  },

  async findByType(ctx) {
    let typeQuery = ''
    let startQuery = ''
    let limitQuery = ''
    const type = ctx.query.type
    const type_id = ctx.query.type_id
    const start = ctx.query.start
    const limit = ctx.query.limit

    if (type && type_id) {
      typeQuery = `AND t1.type = '${type}' AND t1.type_id = ${type_id}`
    }

    if (ctx.query.start) {
      startQuery = `offset ${start}`
    }

    if (ctx.query.limit) {
      limitQuery = `LIMIT ${limit}`
    }

    let sql = `
      SELECT t1.*,
             (SELECT COUNT(*)
              FROM article_elements st1
              WHERE st1.type = 'comment'
                AND st1.type_id = t1.id
                AND st1.good = TRUE)     AS GOOD_COUNT,
             (SELECT COUNT(*)
              FROM article_elements st1
              WHERE st1.type = 'comment'
                AND st1.type_id = t1.id
                AND st1.hate = TRUE)     AS HATE_COUNT,
             (SELECT COUNT(*)
              FROM re_comments st1
              WHERE st1.type = t1.type
                AND st1.type_id = t1.type_id
                AND st1.comment = t1.id) AS RE_COMMENT_COUNT,
             t2.username,
             t2.nick_name
      FROM comments t1
             INNER JOIN "users-permissions_user" t2 ON t1.writer = t2.id
      WHERE is_delete = FALSE
        ${typeQuery}
      ORDER BY t1.created_at ASC ${startQuery} ${limitQuery}
    `

    let sql2 = `
      SELECT t1.*,
             t2.username,
             t2.nick_name,
             (SELECT nick_name FROM "users-permissions_user" AS t3 WHERE t1.hash_user = t3.id) AS hash_user_nick_name
      FROM re_comments t1
             INNER JOIN "users-permissions_user" t2 ON t1.writer = t2.id
      WHERE is_delete = FALSE
        ${typeQuery}
      ORDER BY t1.created_at ASC
    `

    let result = await strapi.connections.default.raw(sql)
    let result2 = await strapi.connections.default.raw(sql2)

    return {
      commentList: result.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['comments'] })
      ),
      reCommentList: result2.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['re-comments'] })
      ),
    }
  },
}
