'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async customDelete(ctx) {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        const { userId, blockUserId } = ctx.query

        let sql = `
        DELETE
        FROM block_user_lists
        WHERE user_id = ${userId}
          AND block_user_id = ${blockUserId};
      `

        await strapi.connections.default.raw(sql)

        return 'OK'
      } catch (err) {
        console.log(err.message)
      }
    }
    // return result.rows.map((entity) =>
    //   sanitizeEntity(entity, { model: strapi.models['block-user-list'] })
    // )
  },
}
