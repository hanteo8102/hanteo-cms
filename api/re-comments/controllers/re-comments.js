'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async customRemove(ctx) {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        const { id: contentsId } = ctx.params
        const { id: userId } = await strapi.plugins[
          'users-permissions'
        ].services.jwt.getToken(ctx)

        if (userId) {
          let sql = `
            UPDATE re_comments
            SET is_delete = TRUE
            WHERE id = ${contentsId};
            UPDATE article_elements
            SET is_delete = TRUE
            WHERE type = 're-comment'
              AND type_id = ${contentsId};
          `

          await strapi.connections.default.raw(sql)

          return 'OK'
        } else {
          return ctx.notFound()
        }
      } catch (err) {
        return ctx.notFound(err)
      }
    }
  },
}
