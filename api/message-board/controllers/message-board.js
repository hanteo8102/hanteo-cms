'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require('strapi-utils')
const _ = require('lodash')

module.exports = {
  async findByMe(ctx) {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        let startQuery = ''
        let limitQuery = ''
        let start = ctx.query.start
        let limit = ctx.query.limit

        const { id: userId } = await strapi.plugins[
          'users-permissions'
        ].services.jwt.getToken(ctx)

        if (start) {
          startQuery = `OFFSET ${ctx.query.start}`
        }

        if (limit) {
          limitQuery = `LIMIT ${ctx.query.limit}`
        }

        let sql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.to_user = U.id)
          WHERE from_user = ${userId}
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let sql2 = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.from_user = U.id)
          WHERE to_user = ${userId}
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let sql3 = `
          SELECT COUNT(*)
          FROM (SELECT *
                FROM message_boards
                WHERE from_user = ${userId}) AS a
        `

        let sql4 = `
          SELECT COUNT(*)
          FROM (SELECT *
                FROM message_boards
                WHERE to_user = ${userId}) AS a
        `

        let result = await strapi.connections.default.raw(sql)
        let result2 = await strapi.connections.default.raw(sql2)
        let result3 = await strapi.connections.default.raw(sql3)
        let result4 = await strapi.connections.default.raw(sql4)

        return {
          from: {
            contents: result.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['message-board'] })
            ),
            totalCount: result3.rows[0].count,
          },
          to: {
            contents: result2.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['message-board'] })
            ),
            totalCount: result4.rows[0].count,
          },
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },
  async removeChecked(ctx) {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        const { body } = ctx.request

        let sql = `
          DELETE FROM message_boards WHERE id IN (${body.map((item) =>
            item.checked === true ? item.messageId : ''
          )});
        `

        let result = await strapi.connections.default.raw(sql)

        return sanitizeEntity(result, { model: strapi.models['message-board'] })
      } catch (err) {
        console.log(err.message)
      }
    }
  },
  async update(ctx) {
    const { id } = ctx.params
    const updateData = {
      read_time: new Date(),
    }

    let entity = await strapi.services['message-board'].update(
      { id },
      updateData
    )

    return sanitizeEntity(entity, { model: strapi.models['message-board'] })
  },
}
