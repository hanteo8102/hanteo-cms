'use strict'

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  async findNewsContents(ctx) {
    let query = ''
    if (ctx.query.limit) {
      query = `OFFSET 0 LIMIT ${ctx.query.limit}`
    } else {
      query = `OFFSET 0 LIMIT 20`
    }

    let sql = `
      SELECT news_contents.*
      FROM news_contents
      WHERE news_contents.is_public = true
      ORDER BY news_contents.created_at DESC
        ${query}
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['news-contents'] })
    )
  },
}
