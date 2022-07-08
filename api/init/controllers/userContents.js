'use strict'

/**
 * A set of functions called "actions" for `init`
 */

const { sanitizeEntity } = require('strapi-utils')
module.exports = {
  initByMe: async (ctx) => {
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        const { id: userId } = await strapi.plugins[
          'users-permissions'
        ].services.jwt.getToken(ctx)

        let boardListSql = `
          SELECT boards.*,
                 (SELECT count(1)
                  FROM article_elements
                  WHERE boards.id = article_elements.type_id
                    AND type = 'board'
                    AND good = true)    AS good_count,
                 (SELECT count(1)
                  FROM article_elements
                  WHERE boards.id = article_elements.type_id
                    AND type = 'board'
                    AND hate = true)    AS hate_count,
                 (SELECT count(1)
                  FROM comments
                  WHERE boards.id = comments.type_id
                    AND type = 'board') AS comment_count,
                 (SELECT count(1)
                  FROM re_comments
                  WHERE boards.id = re_comments.type_id
                    AND type = 'board') AS re_comment_count,
                 U.nick_name
          FROM boards
                 INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
            AND boards.writing_type = N'일반 게시물'
            AND boards.writer = ${userId}
          ORDER BY boards.created_at DESC
          OFFSET 0 LIMIT 20
        `

        let commentListSql = `
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
                   END                                     AS category,
                 (SELECT CAST(count(1) AS INT)
                  FROM comments
                  WHERE comments.is_delete = false
                    AND comments.writer = ${userId})       AS total_count
          FROM comments
                 INNER JOIN "users-permissions_user" AS U ON (comments.writer = U.id)
          WHERE comments.is_delete = false
            AND comments.writer = ${userId}
          ORDER BY comments.created_at DESC
          OFFSET 0 LIMIT 20
        `

        let goodListSql = `
          SELECT DISTINCT id,
                          type,
                          category,
                          title,
                          created_at,
                          view_count,
                          good_count,
                          (comment_count + re_comment_count) AS comment_count
          FROM (SELECT id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM boards t1
                WHERE id IN
                      (SELECT type_id
                       FROM article_elements
                       WHERE type = 'board'
                         AND good = true
                         AND writer = ${userId})
                UNION ALL
                SELECT id
                     , 'news'                      AS type
                     , 0                           AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM news_contents t1
                WHERE id IN (SELECT type_id
                             FROM article_elements
                             WHERE type = 'news'
                               AND good = true
                               AND writer = ${userId})
                UNION ALL
                SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , t1.title
                     , t1.created_at
                     , t1.view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM boards t1
                       INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board'
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${userId})
                UNION ALL
                SELECT t1.id
                     , 'news'                      AS type
                     , 0                           AS category
                     , t1.title
                     , t1.created_at
                     , t1.view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM news_contents t1
                       INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news'
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${userId})) AS a
          ORDER BY created_at DESC
          OFFSET 0 LIMIT 20
        `

        let fromListSql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.to_user = U.id)
          WHERE from_user = ${userId}
            AND is_from_delete = false
          ORDER BY created_at DESC
          OFFSET 0 LIMIT 20
        `

        let toListSql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.from_user = U.id)
          WHERE to_user = ${userId}
            AND is_to_delete = false
            AND is_keep = false
          ORDER BY created_at DESC
          OFFSET 0 LIMIT 20
        `

        let keepListSql = `
          SELECT M.*, U.nick_name
          FROM message_boards M
                 INNER JOIN "users-permissions_user" AS U ON (M.from_user = U.id)
          WHERE to_user = ${userId}
            AND is_keep = true
          ORDER BY created_at DESC
          OFFSET 0 LIMIT 20
        `

        let scrapListSql = `
          SELECT DISTINCT id,
                          type,
                          category,
                          title,
                          created_at,
                          view_count,
                          good_count,
                          (comment_count + re_comment_count) AS comment_count
          FROM (SELECT id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND scrap = true)        AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM boards t1
                WHERE id IN
                      (SELECT type_id
                       FROM article_elements
                       WHERE type = 'board'
                         AND scrap = true
                         AND writer = ${userId})
                UNION ALL
                SELECT id
                     , 'news'                      AS type
                     , 0                           AS category
                     , title
                     , created_at
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND scrap = true)        AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM news_contents t1
                WHERE id IN (SELECT type_id
                             FROM article_elements
                             WHERE type = 'news'
                               AND scrap = true
                               AND writer = ${userId})) AS a
          ORDER BY created_at DESC
          OFFSET 0 LIMIT 20
        `

        let boardCountSql = `
          SELECT COUNT(*)
          FROM boards
          WHERE boards.is_delete = false
            AND boards.writing_type = N'일반 게시물'
            AND boards.writer = ${userId}
        `

        let commentCountSql = `
          SELECT COUNT(*)
          FROM comments
          WHERE comments.is_delete = false
            AND comments.writer = ${userId}
        `

        let goodCountSql = `
          SELECT COUNT(*)
          FROM (SELECT DISTINCT id,
                                type,
                                category,
                                title,
                                created_at,
                                view_count,
                                good_count,
                                (comment_count + re_comment_count) AS comment_count
                FROM (SELECT id
                           , 'board'                     AS type
                           , t1.category                 AS category
                           , title
                           , created_at
                           , view_count
                           , (SELECT COUNT(*)
                              FROM article_elements st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id
                                AND good = true)         AS good_count
                           , (SELECT COUNT(*)
                              FROM comments st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id) AS comment_count
                           , (SELECT COUNT(*)
                              FROM re_comments st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id) AS re_comment_count
                      FROM boards t1
                      WHERE id IN
                            (SELECT type_id
                             FROM article_elements
                             WHERE type = 'board'
                               AND good = true
                               AND writer = ${userId})
                      UNION ALL
                      SELECT id
                           , 'news'                      AS type
                           , 0                           AS category
                           , title
                           , created_at
                           , view_count
                           , (SELECT COUNT(*)
                              FROM article_elements st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id
                                AND good = true)         AS good_count
                           , (SELECT COUNT(*)
                              FROM comments st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id) AS comment_count
                           , (SELECT COUNT(*)
                              FROM re_comments st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id) AS re_comment_count
                      FROM news_contents t1
                      WHERE id IN (SELECT type_id
                                   FROM article_elements
                                   WHERE type = 'news'
                                     AND good = true
                                     AND writer = ${userId})
                      UNION ALL
                      SELECT t1.id
                           , 'board'                     AS type
                           , t1.category                 AS category
                           , t1.title
                           , t1.created_at
                           , t1.view_count
                           , (SELECT COUNT(*)
                              FROM article_elements st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id
                                AND good = true)         AS good_count
                           , (SELECT COUNT(*)
                              FROM comments st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id) AS comment_count
                           , (SELECT COUNT(*)
                              FROM re_comments st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id) AS re_comment_count
                      FROM boards t1
                             INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board'
                      WHERE t2.id IN (SELECT type_id
                                      FROM article_elements t3
                                      WHERE type = 'comment'
                                        AND good = true
                                        AND writer = ${userId})
                      UNION ALL
                      SELECT t1.id
                           , 'news'                      AS type
                           , 0                           AS category
                           , t1.title
                           , t1.created_at
                           , t1.view_count
                           , (SELECT COUNT(*)
                              FROM article_elements st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id
                                AND good = true)         AS good_count
                           , (SELECT COUNT(*)
                              FROM comments st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id) AS comment_count
                           , (SELECT COUNT(*)
                              FROM re_comments st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id) AS re_comment_count
                      FROM news_contents t1
                             INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news'
                      WHERE t2.id IN (SELECT type_id
                                      FROM article_elements t3
                                      WHERE type = 'comment'
                                        AND good = true
                                        AND writer = ${userId})) AS aa) AS a
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
          SELECT COUNT(read_time)
          FROM (SELECT *
                FROM message_boards
                WHERE from_user = ${userId}
                  AND is_to_delete = false
                  AND is_keep = false) AS a
        `

        let scrapCountSql = `
          SELECT COUNT(*)
          FROM (SELECT DISTINCT id,
                                type,
                                category,
                                title,
                                created_at,
                                view_count,
                                good_count,
                                (comment_count + re_comment_count) AS comment_count
                FROM (SELECT id
                           , 'board'                     AS type
                           , t1.category                 AS category
                           , title
                           , created_at
                           , view_count
                           , (SELECT COUNT(*)
                              FROM article_elements st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id
                                AND scrap = true)        AS good_count
                           , (SELECT COUNT(*)
                              FROM comments st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id) AS comment_count
                           , (SELECT COUNT(*)
                              FROM re_comments st1
                              WHERE st1.type = 'board'
                                AND st1.type_id = t1.id) AS re_comment_count
                      FROM boards t1
                      WHERE id IN
                            (SELECT type_id
                             FROM article_elements
                             WHERE type = 'board'
                               AND scrap = true
                               AND writer = ${userId})
                      UNION ALL
                      SELECT id
                           , 'news'                      AS type
                           , 0                           AS category
                           , title
                           , created_at
                           , view_count
                           , (SELECT COUNT(*)
                              FROM article_elements st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id
                                AND scrap = true)        AS good_count
                           , (SELECT COUNT(*)
                              FROM comments st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id) AS comment_count
                           , (SELECT COUNT(*)
                              FROM re_comments st1
                              WHERE st1.type = 'news'
                                AND st1.type_id = t1.id) AS re_comment_count
                      FROM news_contents t1
                      WHERE id IN (SELECT type_id
                                   FROM article_elements
                                   WHERE type = 'news'
                                     AND scrap = true
                                     AND writer = ${userId})) AS aa) AS a
        `

        let boardList = await strapi.connections.default.raw(boardListSql)
        let commentList = await strapi.connections.default.raw(commentListSql)
        let goodList = await strapi.connections.default.raw(goodListSql)
        let fromList = await strapi.connections.default.raw(fromListSql)
        let toList = await strapi.connections.default.raw(toListSql)
        let keepList = await strapi.connections.default.raw(keepListSql)
        let scrapList = await strapi.connections.default.raw(scrapListSql)
        let boardCount = await strapi.connections.default.raw(boardCountSql)
        let commentCount = await strapi.connections.default.raw(commentCountSql)
        let goodCount = await strapi.connections.default.raw(goodCountSql)
        let fromCount = await strapi.connections.default.raw(formCountSql)
        let toCount = await strapi.connections.default.raw(toCountSql)
        let keepCount = await strapi.connections.default.raw(keepCountSql)
        let notReadCount = await strapi.connections.default.raw(notReadCountSql)
        let scrapCount = await strapi.connections.default.raw(scrapCountSql)

        return {
          board: {
            contents: boardList.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['boards'] })
            ),
            totalCount: boardCount.rows[0].count,
          },
          comment: {
            contents: commentList.rows.map((entity) =>
              sanitizeEntity(entity, { model: strapi.models['comments'] })
            ),
            totalCount: commentCount.rows[0].count,
          },
          good: {
            contents: goodList.rows.map((entity) =>
              sanitizeEntity(entity, {
                model: strapi.models['article-elements'],
              })
            ),
            totalCount: goodCount.rows[0].count,
          },
          messageBoard: {
            notReadCount: notReadCount.rows[0].count,
            from: {
              contents: fromList.rows.map((entity) =>
                sanitizeEntity(entity, {
                  model: strapi.models['message-board'],
                })
              ),
              totalCount: fromCount.rows[0].count,
            },
            to: {
              contents: toList.rows.map((entity) =>
                sanitizeEntity(entity, {
                  model: strapi.models['message-board'],
                })
              ),
              totalCount: toCount.rows[0].count,
            },
            keep: {
              contents: keepList.rows.map((entity) =>
                sanitizeEntity(entity, {
                  model: strapi.models['message-board'],
                })
              ),
              totalCount: keepCount.rows[0].count,
            },
          },
          scrap: {
            contents: scrapList.rows.map((entity) =>
              sanitizeEntity(entity, {
                model: strapi.models['article-elements'],
              })
            ),
            totalCount: scrapCount.rows[0].count,
          },
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },
}
