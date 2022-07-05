'use strict'

/**
 * A set of functions called "actions" for `init`
 */

const { sanitizeEntity } = require('strapi-utils')
module.exports = {
  findAll: async (ctx) => {
    let sql = `
      SELECT *
      FROM popups
      ORDER BY created_at DESC OFFSET 0 LIMIT 1
    `

    let result = await strapi.connections.default.raw(sql)

    return {
      popup: {
        contents: result.rows.map((entity) =>
          sanitizeEntity(entity, { model: strapi.models['popup'] })
        ),
      },
    }
  },
}
