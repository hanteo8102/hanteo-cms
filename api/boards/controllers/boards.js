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
    let writerQuery = ''
    let categoryQuery = ''
    let startQuery = ''
    let limitQuery = ''

    if (ctx.query.writer) {
      writerQuery = `AND boards.writer = ${ctx.query.writer}`
    }
    if (ctx.query.category) {
      categoryQuery = `AND boards.category = ${ctx.query.category}`
    }
    if (ctx.query.start) {
      startQuery = `offset ${ctx.query.start}`
    }
    if (ctx.query.limit) {
      limitQuery = `LIMIT ${ctx.query.limit}`
    }

    let sql = `
      select a.*
      from (select boards.id,
                   boards.title,
                   boards.contents,
                   boards.writer,
                   boards.is_delete,
                   boards.category,
                   boards.writing_type,
                   boards.color_type,
                   boards.view_count,
                   boards.created_by,
                   boards.updated_by,
                   boards.created_at,
                   boards.updated_at,
                   0 < (SELECT COUNT(*)
                        FROM block_user_lists
                        WHERE user_id = ${ctx.query.userId}
                          AND boards.writer = block_user_id) AS isBlock,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND good = true)                       AS good_count,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND hate = true)                       AS hate_count,
                   (select count(1)
                    from comments
                    where boards.id = comments.type_id
                      AND type = 'board')                    AS comment_count,
                   (select count(1)
                    from re_comments
                    where boards.id = re_comments.type_id
                      AND type = 'board')                    AS re_comment_count,
                   U.nick_name
            from boards
                   INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
            WHERE boards.is_delete = false
              AND boards.writing_type != N'일반 게시물'
              ${categoryQuery} ${writerQuery}
            ORDER BY boards.created_at DESC) as a
      UNION ALL
      select b.*
      from (select boards.id,
                   CASE
                     WHEN 0 < (SELECT COUNT(*)
                               FROM block_user_lists
                               WHERE user_id = ${ctx.query.userId}
                                 AND boards.writer = block_user_id)
                       THEN N'차단된 멤버의 게시글입니다.'
                     ELSE boards.title
                     END                                     AS title,
                   CASE
                     WHEN 0 < (SELECT COUNT(*)
                               FROM block_user_lists
                               WHERE user_id = ${ctx.query.userId}
                                 AND boards.writer = block_user_id)
                       THEN ''
                     ELSE boards.contents
                     END                                     AS contents,
                   boards.writer,
                   boards.is_delete,
                   boards.category,
                   boards.writing_type,
                   boards.color_type,
                   boards.view_count,
                   boards.created_by,
                   boards.updated_by,
                   boards.created_at,
                   boards.updated_at,
                   0 < (SELECT COUNT(*)
                        FROM block_user_lists
                        WHERE user_id = ${ctx.query.userId}
                          AND boards.writer = block_user_id) AS isBlock,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND good = true)                       AS good_count,
                   (select count(1)
                    from article_elements
                    where boards.id = article_elements.type_id
                      AND type = 'board'
                      AND hate = true)                       AS hate_count,
                   (select count(1)
                    from comments
                    where boards.id = comments.type_id
                      AND type = 'board')                    AS comment_count,
                   (select count(1)
                    from re_comments
                    where boards.id = re_comments.type_id
                      AND type = 'board')                    AS re_comment_count,
                   U.nick_name
            from boards
                   INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
            WHERE boards.is_delete = false
              AND boards.writing_type = N'일반 게시물'
              ${categoryQuery} ${writerQuery}
            ORDER BY boards.created_at DESC ${startQuery} ${limitQuery}) as b
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['boards'] })
    )
  },
  async findOne(ctx) {
    const { id } = ctx.params
    const { userId } = ctx.query

    let sql = `
      SELECT boards.id,
             CASE
               WHEN 0 < (SELECT COUNT(*)
                         FROM block_user_lists
                         WHERE user_id = ${userId}
                           AND boards.writer = block_user_id)
                 THEN N'차단된 멤버의 게시글입니다.'
               ELSE boards.title
               END                                     AS title,
             CASE
               WHEN 0 < (SELECT COUNT(*)
                         FROM block_user_lists
                         WHERE user_id = ${userId}
                           AND boards.writer = block_user_id)
                 THEN ''
               ELSE boards.contents
               END                                     AS contents,
             boards.writer,
             boards.is_delete,
             boards.category,
             boards.writing_type,
             boards.color_type,
             CAST(boards.view_count AS INT),
             boards.created_by,
             boards.updated_by,
             boards.created_at,
             boards.updated_at,
             (SELECT MAX(id) FROM boards AS BBB WHERE BBB.id < boards.id AND BBB.category = boards.category AND BBB.writing_type = '일반 게시물') AS prev,
             (SELECT MIN(id) FROM boards AS BBB WHERE BBB.id > boards.id AND BBB.category = boards.category AND BBB.writing_type = '일반 게시물') AS next,
             (SELECT MAX(id) FROM boards AS BBB WHERE BBB.id < boards.id AND BBB.category = boards.category AND BBB.writing_type != '일반 게시물') AS notice_prev,
             (SELECT MIN(id) FROM boards AS BBB WHERE BBB.id > boards.id AND BBB.category = boards.category AND BBB.writing_type != '일반 게시물') AS notice_next,
             0 < (SELECT COUNT(*)
                  FROM block_user_lists
                  WHERE user_id = ${userId}
                    AND boards.writer = block_user_id) AS isBlock,
             CAST((select count(1)
              from article_elements
              where boards.id = article_elements.type_id
                AND type = 'board'
                AND good = true) AS INT)                       AS good_count,
             CAST((select count(1)
              from article_elements
              where boards.id = article_elements.type_id
                AND type = 'board'
                AND hate = true) AS INT)                       AS hate_count,
             CAST((select count(1)
              from comments
              where boards.id = comments.type_id
                AND type = 'board') AS INT)                    AS comment_count,
             CAST((select count(1)
              from re_comments
              where boards.id = re_comments.type_id
                AND type = 'board') AS INT)                    AS re_comment_count,
             U.nick_name
      from boards
             INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
      WHERE boards.is_delete = false
        AND boards.id = ${id}
    `

    let result = await strapi.connections.default.raw(sql)

    return sanitizeEntity(result.rows[0], { model: strapi.models['boards'] })
  },
  async updateViewCount(ctx) {
    let boardId = ctx.params.id
    let sql = `UPDATE boards SET view_count = view_count + 1 WHERE id = ${boardId}`
    await strapi.connections.default.raw(sql)
    return 'OK'
  },
}
