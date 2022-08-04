'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')
const _ = require('lodash')

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async findMeBoards(ctx) {
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
            ${startQuery} ${limitQuery}
        `

        let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT boards.*,
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
            AND boards.writer = ${userId}) AS a
        `

        let result = await strapi.connections.default.raw(sql)
        let result2 = await strapi.connections.default.raw(sql2)

        return {
          contents: result.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: result2.rows[0].count,
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },

  async findMeComments(ctx) {
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
                 CASE
                   WHEN comments.type = 'news' then 0
                   WHEN comments.type = 'board'
                     THEN (SELECT view_count
                           FROM boards st1
                           WHERE st1.id = comments.type_id)
                   END                                     AS view_count,
                 (SELECT CAST(count(1) AS INT)
                  FROM comments
                  WHERE comments.is_delete = false
                    AND comments.writer = ${userId})       AS total_count
          FROM comments
                 INNER JOIN "users-permissions_user" AS U ON (comments.writer = U.id)
          WHERE comments.is_delete = false
            AND comments.writer = ${userId}
          ORDER BY comments.created_at DESC
            ${startQuery} ${limitQuery}
        `

        let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT comments.*,
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
            AND comments.writer = ${userId}) AS a
        `

        let result = await strapi.connections.default.raw(sql)
        let result2 = await strapi.connections.default.raw(sql2)

        return {
          contents: result.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['comments'] })
          ),
          totalCount: result2.rows[0].count,
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },

  async findMeGood(ctx) {
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
          SELECT DISTINCT id,
                          type,
                          category,
                          title,
                          created_at,
                          view_count,
                          good_count,
                          writing_type,
                          nick_name,
                          (comment_count + re_comment_count) AS comment_count
          FROM (SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , t1.created_at
                     , writing_type
                     , U.nick_name AS nick_name
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
                       INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                WHERE t1.id IN
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
                     , N'뉴스' as writing_type
                     , source_type as nick_name
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
                     , writing_type
                     , U.nick_name AS nick_name
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
                       INNER JOIN "users-permissions_user" AS U ON (t2.writer = U.id)
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${userId})
                UNION ALL
                SELECT t1.id
                     , 'news'                     AS type
                     , 0                 AS category
                     , t1.title
                     , t1.created_at
                     , 'news' as writing_type
                     , source_type AS nick_name
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
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT DISTINCT id,
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
                     , 'news'                     AS type
                     , 0                 AS category
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

        let result = await strapi.connections.default.raw(sql)
        let result2 = await strapi.connections.default.raw(sql2)

        return {
          contents: result.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['article-elements'] })
          ),
          totalCount: result2.rows[0].count,
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },
  async findMeScrap(ctx) {
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
          SELECT DISTINCT id,
                          type,
                          category,
                          title,
                          created_at,
                          view_count,
                          good_count,
                          writing_type,
                          nick_name,
                          (comment_count + re_comment_count) AS comment_count
          FROM (SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , t1.created_at
                     , writing_type
                     , U.nick_name AS nick_name
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND scrap = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id) AS re_comment_count
                FROM boards t1
                       INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                WHERE t1.id IN
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
                     , N'뉴스' as writing_type
                     , source_type as nick_name
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND scrap = true)         AS good_count
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
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT DISTINCT id,
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
                           AND scrap = true)         AS good_count
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
                           AND scrap = true)         AS good_count
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

        let result = await strapi.connections.default.raw(sql)
        let result2 = await strapi.connections.default.raw(sql2)

        return {
          contents: result.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['article-elements'] })
          ),
          totalCount: result2.rows[0].count,
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },
  async findAnotherUserBoards(ctx) {
    let startQuery = ''
    let limitQuery = ''
    let start = ctx.query.start
    let limit = ctx.query.limit
    let userId = ctx.params.id

    if (start) {
      startQuery = `OFFSET ${ctx.query.start}`
    }

    if (limit) {
      limitQuery = `LIMIT ${ctx.query.limit}`
    }

    let sql = `
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
            ${startQuery} ${limitQuery}
        `

    let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT boards.*,
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
            AND boards.writer = ${userId}) AS a
        `

    let result = await strapi.connections.default.raw(sql)
    let result2 = await strapi.connections.default.raw(sql2)

    return {
      contents: result.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['boards'] })
      ),
      totalCount: result2.rows[0].count,
    }
  },
  async findAnotherUserComments(ctx) {
    let startQuery = ''
    let limitQuery = ''
    let start = ctx.query.start
    let limit = ctx.query.limit
    let userId = ctx.params.id

    if (start) {
      startQuery = `OFFSET ${ctx.query.start}`
    }

    if (limit) {
      limitQuery = `LIMIT ${ctx.query.limit}`
    }

    let sql = `
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
            ${startQuery} ${limitQuery}
        `

    let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT comments.*,
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
            AND comments.writer = ${userId}) AS a
        `

    let result = await strapi.connections.default.raw(sql)
    let result2 = await strapi.connections.default.raw(sql2)

    return {
      contents: result.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['comments'] })
      ),
      totalCount: result2.rows[0].count,
    }
  },
  async findAnotherUserGood(ctx) {
    let startQuery = ''
    let limitQuery = ''
    let start = ctx.query.start
    let limit = ctx.query.limit
    let userId = ctx.params.id

    if (start) {
      startQuery = `OFFSET ${ctx.query.start}`
    }

    if (limit) {
      limitQuery = `LIMIT ${ctx.query.limit}`
    }

    let sql = `
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
                     , 'news'                     AS type
                     , 0                 AS category
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
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

    let sql2 = `
        SELECT COUNT(*) FROM
          (SELECT DISTINCT id,
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
                     , 'news'                     AS type
                     , 0                 AS category
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

    let result = await strapi.connections.default.raw(sql)
    let result2 = await strapi.connections.default.raw(sql2)

    return {
      contents: result.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['article-elements'] })
      ),
      totalCount: result2.rows[0].count,
    }
  },
  async updateVisitorCountAnotherUser(ctx) {
    let userId = ctx.params.id
    let sql = `UPDATE "users-permissions_user" SET visitor_count = visitor_count + 1 WHERE id = ${userId}`
    await strapi.connections.default.raw(sql)
    return 'OK'
  },
}
