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
                AND article_elements.is_delete = false
                AND good = true)                       AS good_count,
             (SELECT count(1)
              FROM article_elements
              WHERE comments.id = article_elements.type_id
                AND type = 'comment'
                AND article_elements.is_delete = false
                AND hate = false)                      AS hate_count,
             (SELECT count(1)
              FROM re_comments
              WHERE comments.id = re_comments.comment
                AND re_comments.is_delete = false) AS re_comment_count,
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
      ORDER BY comments.created_at DESC
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
    const { userId, type, type_id, start, limit } = ctx.query

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
      SELECT t1.id,
             CASE
               WHEN 0 < (SELECT COUNT(*)
                         FROM block_user_lists
                         WHERE user_id = ${userId}
                           AND t1.writer = block_user_id)
                 THEN N'차단된 멤버의 댓글입니다.'
               ELSE t1.contents
               END                                 AS contents,
             t1.created_by,
             t1.updated_by,
             t1.created_at,
             t1.updated_at,
             t1.type,
             t1.type_id,
             t1.is_delete,
             t1.writer,
             0 < (SELECT COUNT(*)
                  FROM block_user_lists
                  WHERE user_id = ${userId}
                    AND t1.writer = block_user_id) AS is_block,
             (SELECT CAST(COUNT(*) AS INT)
              FROM article_elements st1
              WHERE st1.type = 'comment'
                AND st1.type_id = t1.id
                AND st1.good = TRUE)               AS GOOD_COUNT,
             (SELECT CAST(COUNT(*) AS INT)
              FROM article_elements st1
              WHERE st1.type = 'comment'
                AND st1.type_id = t1.id
                AND st1.hate = TRUE)               AS HATE_COUNT,
             (SELECT CAST(COUNT(*) AS INT)
              FROM re_comments st1
              WHERE st1.type = t1.type
                AND st1.type_id = t1.type_id
                AND st1.comment = t1.id
                AND st1.is_delete = false)           AS RE_COMMENT_COUNT,
             t2.username,
             t2.nick_name
      FROM comments t1
             INNER JOIN "users-permissions_user" t2 ON t1.writer = t2.id
      WHERE is_delete = FALSE
        ${typeQuery}
      ORDER BY t1.created_at DESC ${startQuery} ${limitQuery}
    `

    let sql2 = `
      SELECT t1.id,
             CASE
               WHEN 0 < (SELECT COUNT(*)
                         FROM block_user_lists
                         WHERE user_id = ${userId}
                           AND t1.writer = block_user_id)
                 THEN N'차단된 멤버의 댓글입니다.'
               ELSE t1.contents
               END                                                                             AS contents,
             t1.comment,
             t1.created_by,
             t1.updated_by,
             t1.created_at,
             t1.updated_at,
             t1.hash_user,
             t1.type,
             t1.type_id,
             t1.is_delete,
             t1.writer,
             t2.username,
             t2.nick_name,
             (SELECT nick_name FROM "users-permissions_user" AS t3 WHERE t1.hash_user = t3.id) AS hash_user_nick_name
      FROM re_comments t1
             INNER JOIN "users-permissions_user" t2 ON t1.writer = t2.id
      WHERE is_delete = FALSE
        ${typeQuery}
      ORDER BY t1.created_at DESC
    `

    let sql3 = `
      SELECT COUNT(*),
      FROM comments t1
      WHERE t1.is_delete = FALSE
        ${typeQuery}
    `

    let sql4 = `
      SELECT COUNT(*),
      FROM re_comments t1
      WHERE t1.is_delete = FALSE
        ${typeQuery}
    `

    let result = await strapi.connections.default.raw(sql)
    let result2 = await strapi.connections.default.raw(sql2)
    let result3 = await strapi.connections.default.raw(sql3)
    let result4 = await strapi.connections.default.raw(sql4)

    return {
      commentList: result.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['comments'] })
      ),
      reCommentList: result2.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['re-comments'] })
      ),
      totalCount: result3.count + result4.count,
    }
  },
  async customRemove(ctx) {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        const { id: contentsId } = ctx.params
        const { id: userId } = await strapi.plugins[
          'users-permissions'
        ].services.jwt.getToken(ctx)

        if (userId) {
          let sql = `
            UPDATE comments
            SET is_delete = TRUE
            WHERE id = ${contentsId};
            UPDATE re_comments
            SET is_delete = TRUE
            WHERE comment = ${contentsId};
            UPDATE article_elements
            SET is_delete = TRUE
            WHERE type = 'comment'
              AND type_id = ${contentsId};
            UPDATE article_elements
            SET is_delete = TRUE
            WHERE type = 're-comment'
              AND type_id IN (SELECT id FROM re_comments WHERE comment = ${contentsId});
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
