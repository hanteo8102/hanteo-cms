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
}
