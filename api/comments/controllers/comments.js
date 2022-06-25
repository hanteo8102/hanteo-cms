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
    const type = ctx.query.type
    const id = ctx.query.type_id

    if (type && id) {
      query = `AND comments.type = '${type}' AND comments.type_id = ${id}`
    }

    let sql = `
      select comments.*,
             (select count(1)
              from article_elements
              where comments.id = article_elements.type_id
                AND type = 'comment'
                AND expression = true)  AS like_count,
             (select count(1)
              from article_elements
              where comments.id = article_elements.type_id
                AND type = 'comment'
                AND expression = false) AS hate_count,
             (select count(1)
              from re_comments
              where comments.id = re_comments.comment) AS re_comment_count,
             U.nick_name
      from comments
             INNER JOIN "users-permissions_user" AS U ON (comments.user = U.id)
      WHERE comments.is_delete = false ${query}
      ORDER BY comments.created_at
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['boards'] })
    )
  },
}
