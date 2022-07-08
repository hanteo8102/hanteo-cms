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

        let fromListSql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.to_user = U.id)
          WHERE from_user = ${userId}
            AND is_from_delete = false
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let toListSql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.from_user = U.id)
          WHERE to_user = ${userId}
            AND is_to_delete = false
            AND is_keep = false
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let keepListSql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.from_user = U.id)
          WHERE to_user = ${userId}
            AND is_keep = true
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let formCountSql = `
          SELECT COUNT(*)
          FROM (SELECT *
                FROM message_boards
                WHERE from_user = ${userId}
                  AND is_from_delete = false) AS a
        `

        let toCountSql = `
          SELECT COUNT(*)
          FROM (SELECT *
                FROM message_boards
                WHERE to_user = ${userId}
                  AND is_to_delete = false
                  AND is_keep = false) AS a
        `

        let keepCountSql = `
          SELECT COUNT(*)
          FROM (SELECT *
                FROM message_boards
                WHERE to_user = ${userId}
                  AND is_keep = true) AS a
        `

        let notReadCountSql = `
          SELECT COUNT(*)-COUNT(read_time) AS count
          FROM message_boards
          WHERE to_user = ${userId}
            AND is_to_delete = false
            AND is_keep = false
        `

        let fromList = await strapi.connections.default.raw(fromListSql)
        let toList = await strapi.connections.default.raw(toListSql)
        let keepList = await strapi.connections.default.raw(keepListSql)
        let fromCount = await strapi.connections.default.raw(formCountSql)
        let toCount = await strapi.connections.default.raw(toCountSql)
        let keepCount = await strapi.connections.default.raw(keepCountSql)
        let notReadCount = await strapi.connections.default.raw(notReadCountSql)

        return {
          notReadCount: notReadCount.rows[0].count,
          from: {
            contents: fromList.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['message-board'] })
            ),
            totalCount: fromCount.rows[0].count,
          },
          to: {
            contents: toList.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['message-board'] })
            ),
            totalCount: toCount.rows[0].count,
          },
          keep: {
            contents: keepList.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['message-board'] })
            ),
            totalCount: keepCount.rows[0].count,
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
        const { removeList, removeTab } = ctx.request.body

        let sql = ``

        if (removeTab === 'FROM') {
          sql = `
            UPDATE message_boards
            SET is_from_delete = true
            WHERE id IN (${removeList.map((item) =>
              item.checked === true ? item.messageId : ''
            )});
          `
        } else if (removeTab === 'TO') {
          sql = `
            UPDATE message_boards
            SET is_to_delete = true
            WHERE id IN (${removeList.map((item) =>
              item.checked === true ? item.messageId : ''
            )});
          `
        } else {
          sql = `
            UPDATE message_boards
            SET is_keep = false
            WHERE id IN (${removeList.map((item) =>
              item.checked === true ? item.messageId : ''
            )});
          `
        }

        let result = await strapi.connections.default.raw(sql)

        return sanitizeEntity(result, { model: strapi.models['message-board'] })
      } catch (err) {
        console.log(err.message)
      }
    }
  },
  async keepChecked(ctx) {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        const { keepList } = ctx.request.body

        let sql = `
          UPDATE message_boards
          SET is_keep = true, is_to_delete = true
          WHERE id IN (${keepList.map((item) =>
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
  async readTimeUpdate(ctx) {
    const { id } = ctx.params
    const { userId } = ctx.request.body
    console.log(ctx.request.body경)
    const updateData = {
      read_time: new Date(),
    }

    await strapi.services['message-board'].update({ id }, updateData)

    let notReadCountSql = `
          SELECT COUNT(*)-COUNT(read_time) AS count
          FROM message_boards
          WHERE to_user = ${userId}
            AND is_to_delete = false
            AND is_keep = false
        `

    let notReadCount = await strapi.connections.default.raw(notReadCountSql)
    return notReadCount.rows[0].count
  },
}
