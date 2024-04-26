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
          select a.*
          from (SELECT boards.*,
          (SELECT -1 ) AS banner_category,
          (SELECT count(1)
          FROM article_elements
          INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
          WHERE boards.id = article_elements.type_id
          AND type = 'board'
          AND article_elements.is_delete = false
          AND good = true)    AS good_count,
          (SELECT count(1)
          FROM article_elements
          INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
          WHERE boards.id = article_elements.type_id
          AND type = 'board'
          AND article_elements.is_delete = false
          AND hate = true)    AS hate_count,
          (SELECT count(1)
          FROM comments
          INNER JOIN "users-permissions_user" AS U ON comments.writer = U.id
          WHERE boards.id = comments.type_id
          AND comments.is_delete = false
          AND type = 'board') AS comment_count,
          (SELECT count(1)
          FROM re_comments
          INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
          WHERE boards.id = re_comments.type_id
          AND re_comments.is_delete = false
          AND type = 'board') AS re_comment_count,
          U.nick_name,
          (SELECT view_boards.id
          FROM view_boards
          WHERE view_boards.board_num = boards.id::VARCHAR
          AND view_boards.user_num = ${userId}::VARCHAR
          AND view_boards.board_type = 'board') AS view_board
          FROM boards
          INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
          AND boards.writer = ${userId}
          ORDER BY boards.created_at DESC) as a
          UNION ALL
          select b.*
          from (
          SELECT advertisement_boards.id,
          advertisement_boards.title,
          advertisement_boards.contents,
          advertisement_boards.writer,
          advertisement_boards.writing_type,
          advertisement_boards.color_type,
          advertisement_boards.is_delete,
          advertisement_boards.category,
          advertisement_boards.view_count,
          advertisement_boards.created_by,
          advertisement_boards.updated_by,
          advertisement_boards.created_at,
          advertisement_boards.updated_at,
          advertisement_boards.board_expected_date,
          advertisement_boards.board_expired_date,
          (SELECT banners.banner_category
          FROM banners 
          WHERE banners.id = advertisement_boards.category
          )    AS banner_category,
          (SELECT count(1)
          FROM article_elements
          INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
          WHERE advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND good = true)    AS good_count,
          (SELECT count(1)
          FROM article_elements
          INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
          WHERE advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND hate = true)    AS hate_count,
          (SELECT count(1)
          FROM comments
          INNER JOIN "users-permissions_user" AS U ON comments.writer = U.id
          WHERE advertisement_boards.id = comments.type_id
          AND comments.is_delete = false
          AND type = 'advertisement') AS comment_count,
          (SELECT count(1)
          FROM re_comments
          INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
          WHERE advertisement_boards.id = re_comments.type_id
          AND re_comments.is_delete = false
          AND type = 'advertisement') AS re_comment_count,
          U.nick_name,
          (SELECT id
          FROM view_boards
          WHERE view_boards.board_num = advertisement_boards.id::VARCHAR
          AND view_boards.user_num = ${userId}::VARCHAR
          AND view_boards.board_type = 'advertisement') AS view_board
          FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writer = ${userId}
          ORDER BY advertisement_boards.created_at DESC)as b
          order by created_at DESC
          ${startQuery} ${limitQuery}
        `
        

        let sql2 = `
        SELECT COUNT(*)
        FROM ( select a.*
        from (SELECT boards.*
        FROM boards
        WHERE boards.is_delete = false
        AND boards.writer = ${userId}) as a
        UNION ALL
        select b.*
        from (
        SELECT advertisement_boards.id,
        advertisement_boards.title,
        advertisement_boards.contents,
        advertisement_boards.writer,
        advertisement_boards.writing_type,
        advertisement_boards.color_type,
        advertisement_boards.is_delete,
        advertisement_boards.category,
        advertisement_boards.view_count,
        advertisement_boards.created_by,
        advertisement_boards.updated_by,
        advertisement_boards.created_at,
        advertisement_boards.updated_at,
        advertisement_boards.board_expected_date,
        advertisement_boards.board_expired_date
        FROM advertisement_boards
        WHERE advertisement_boards.is_delete = false
        AND advertisement_boards.writer = ${userId})as b
        ) AS c`

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
                  INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
                  WHERE comments.id = article_elements.type_id
                  AND type = 'comment'
                  AND article_elements.is_delete = false
                  AND good = true)                   AS good_count,
                 (SELECT count(1)
                  FROM article_elements
                  INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
                  WHERE comments.id = article_elements.type_id
                  AND type = 'comment'
                  AND article_elements.is_delete = false
                  AND hate = false)                  AS hate_count,
                 (SELECT count(1)
                  FROM re_comments
                  INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
                  WHERE comments.id = re_comments.comment
                  AND re_comments.is_delete = false) AS re_comment_count,
                 U.nick_name,
                 CASE
                   WHEN comments.type = 'news' then 0
                   WHEN comments.type = 'board'
                     THEN (SELECT category
                           FROM boards st1
                           WHERE st1.id = comments.type_id)
				          WHEN comments.type = 'advertisement'
                     THEN (SELECT bs.banner_category
                  FROM advertisement_boards ab , banners bs
                  WHERE ab.id = comments.type_id AND bs.id = ab.category)
                   END    AS category,
                 CASE
                   WHEN comments.type = 'news' then 0
                   WHEN comments.type = 'board'
                     THEN (SELECT view_count
                           FROM boards st1
                           WHERE st1.id = comments.type_id)
                    WHEN comments.type = 'advertisement'
                              THEN (SELECT ab.view_count
                      FROM advertisement_boards ab
                      WHERE ab.id = comments.type_id)
                   END                                 AS view_count,
                 (SELECT CAST(count(1) AS INT)
                  FROM comments
                  WHERE comments.is_delete = false
                    AND comments.writer = ${userId})   AS total_count,
                  CASE
                  WHEN comments.type = 'news' then 0
                  WHEN comments.type = 'board' then 0
                  WHEN comments.type = 'advertisement'
                    THEN (SELECT ab.category
                    FROM advertisement_boards ab
                    WHERE ab.id = comments.type_id)
                  END                                 AS banner_category
          FROM comments
                 INNER JOIN "users-permissions_user" AS U ON (comments.writer = U.id)
          WHERE comments.is_delete = false
            AND comments.writer = ${userId}
          ORDER BY comments.created_at DESC
            ${startQuery} ${limitQuery} 
        `

        let sql2 = `
          SELECT COUNT(*)
          FROM (SELECT comments.*
            FROM comments
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
                          contents,
                          created_at,
                          view_count,
                          good_count,
                          writing_type,
                          color_type,
                          nick_name,
                          (comment_count + re_comment_count) AS comment_count,
                          banner_category
          FROM (SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , t1.title
                     , t1.contents
                     , t1.created_at
                     , t1.writing_type
                     , t1.color_type
                     , U.nick_name                 AS nick_name
                     , t1.view_count,
                      (SELECT COUNT(*)
                        FROM article_elements st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false
                          AND good = true)         AS good_count,
                      (SELECT COUNT(*)
                        FROM comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS comment_count,
                      (SELECT COUNT(*)
                        FROM re_comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS re_comment_count,
                      (SELECT -1) AS banner_category
                FROM boards t1
                       INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                WHERE t1.id IN
                      (SELECT type_id
                       FROM article_elements
                       WHERE type = 'board'
                         AND article_elements.is_delete = false
                         AND good = true
                         AND writer = ${userId})
                  AND t1.is_delete = false
                UNION ALL
                SELECT id
                     , 'news'                      AS type
                     , 0                           AS category
                     , title
                     , contents
                     , created_at
                     , N'뉴스'                       as writing_type
                     , N'없음(일반 게시물)'               as color_type
                     , source_type                 as nick_name
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS re_comment_count,
                          (SELECT -1) AS banner_category
                FROM news_contents t1
                WHERE id IN (SELECT type_id
                             FROM article_elements
                             WHERE type = 'news'
                               AND article_elements.is_delete = false
                               AND good = true
                               AND writer = ${userId})
                  AND t1.is_public = true
                UNION ALL
                SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , t1.title
                     , t1.contents
                     , t1.created_at
                     , t1.writing_type
                     , t1.color_type
                     , U.nick_name                 AS nick_name
                     , t1.view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS re_comment_count,
                          (SELECT -1) AS banner_category
                FROM boards t1
                       INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board' AND t2.is_delete = false
                       INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${userId})
                  AND t1.is_delete = false
                UNION ALL
                SELECT t1.id
                     , 'news'                      AS type
                     , 0                           AS category
                     , t1.title
                     , t1.contents
                     , t1.created_at
                     , N'뉴스'                      as writing_type
                     , N'없음(일반 게시물)'               as color_type
                     , source_type                 AS nick_name
                     , t1.view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id
                          AND good = true)         AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS re_comment_count,
                          (SELECT -1) AS banner_category
                    FROM news_contents t1
                       INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news' AND t2.is_delete = false
                WHERE t2.id IN (SELECT type_id
                                FROM article_elements t3
                                WHERE type = 'comment'
                                  AND good = true
                                  AND writer = ${userId})
                  AND t1.is_public = true
                  UNION ALL
                  SELECT t1.id
                  , 'advertisement'                     AS type
                  , t1.category                 AS category
                  , t1.title
                  , t1.contents
                  , t1.created_at
                  , t1.writing_type
                  , t1.color_type
                  , U.nick_name                 AS nick_name
                  , t1.view_count,
                   (SELECT COUNT(*)
                     FROM article_elements st1
                     INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                     WHERE st1.type = 'advertisement'
                       AND st1.type_id = t1.id
                       AND st1.is_delete = false
                       AND good = true)         AS good_count,
                   (SELECT COUNT(*)
                     FROM comments st1
                     INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                     WHERE st1.type = 'advertisement'
                       AND st1.is_delete = false
                       AND st1.type_id = t1.id) AS comment_count,
                   (SELECT COUNT(*)
                     FROM re_comments st1
                     INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                     WHERE st1.type = 'advertisement'
                       AND st1.is_delete = false
                       AND st1.type_id = t1.id) AS re_comment_count,
                    (SELECT ba.banner_category
                      FROM banners ba
                      WHERE ba.id = t1.category) AS banner_category
             FROM advertisement_boards t1
                    INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
             WHERE t1.id IN
                   (SELECT type_id
                    FROM article_elements
                    WHERE type = 'advertisement'
                      AND article_elements.is_delete = false
                      AND good = true
                      AND writer = ${userId})
               AND t1.is_delete = false
                     UNION ALL
                SELECT t1.id
                  , 'advertisement'                     AS type
                  , t1.category                 AS category
                  , t1.title
                  , t1.contents
                  , t1.created_at
                  , t1.writing_type
                  , t1.color_type
                  , U.nick_name                 AS nick_name
                  , t1.view_count,
                   (SELECT COUNT(*)
                     FROM article_elements st1
                     INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                     WHERE st1.type = 'advertisement'
                       AND st1.is_delete = false
                       AND st1.type_id = t1.id
                       AND good = true)         AS good_count,
                   (SELECT COUNT(*)
                     FROM comments st1
                     INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                     WHERE st1.type = 'advertisement'
                       AND st1.is_delete = false
                       AND st1.type_id = t1.id) AS comment_count,
                   (SELECT COUNT(*)
                     FROM re_comments st1
                     INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                     WHERE st1.type = 'advertisement'
                       AND st1.is_delete = false
                       AND st1.type_id = t1.id) AS re_comment_count,
                    (SELECT ba.banner_category
                    FROM banners ba
                    WHERE ba.id = t1.category) AS banner_category
             FROM advertisement_boards t1
                    INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'advertisement' AND t2.is_delete = false
                    INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
             WHERE t2.id IN (SELECT type_id
                             FROM article_elements t3
                             WHERE type = 'comment'
                               AND good = true
                               AND writer = ${userId})
               AND t1.is_delete = false
                  ) AS a
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let sql2 = `
        SELECT COUNT(*)
        FROM (SELECT DISTINCT id,
                        type,
                        category,
                        title,
                        contents,
                        created_at,
                        view_count,
                        good_count,
                        writing_type,
                        color_type,
                        nick_name,
                        (comment_count + re_comment_count) AS comment_count,
                        banner_category
        FROM (SELECT t1.id
                   , 'board'                     AS type
                   , t1.category                 AS category
                   , t1.title
                   , t1.contents
                   , t1.created_at
                   , t1.writing_type
                   , t1.color_type
                   , U.nick_name                 AS nick_name
                   , t1.view_count,
                    (SELECT COUNT(*)
                      FROM article_elements st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'board'
                        AND st1.type_id = t1.id
                        AND st1.is_delete = false
                        AND good = true)         AS good_count,
                    (SELECT COUNT(*)
                      FROM comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'board'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS comment_count,
                    (SELECT COUNT(*)
                      FROM re_comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'board'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS re_comment_count,
                    (SELECT -1) AS banner_category
              FROM boards t1
                     INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
              WHERE t1.id IN
                    (SELECT type_id
                     FROM article_elements
                     WHERE type = 'board'
                       AND article_elements.is_delete = false
                       AND good = true
                       AND writer = ${userId})
                AND t1.is_delete = false
              UNION ALL
              SELECT id
                   , 'news'                      AS type
                   , 0                           AS category
                   , title
                   , contents
                   , created_at
                   , N'뉴스'                       as writing_type
                   , N'없음(일반 게시물)'               as color_type
                   , source_type                 as nick_name
                   , view_count
                   , (SELECT COUNT(*)
                      FROM article_elements st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'news'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id
                        AND good = true)         AS good_count
                   , (SELECT COUNT(*)
                      FROM comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'news'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS comment_count
                   , (SELECT COUNT(*)
                      FROM re_comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'news'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS re_comment_count,
                        (SELECT -1) AS banner_category
              FROM news_contents t1
              WHERE id IN (SELECT type_id
                           FROM article_elements
                           WHERE type = 'news'
                             AND article_elements.is_delete = false
                             AND good = true
                             AND writer = ${userId})
                AND t1.is_public = true
              UNION ALL
              SELECT t1.id
                   , 'board'                     AS type
                   , t1.category                 AS category
                   , t1.title
                   , t1.contents
                   , t1.created_at
                   , t1.writing_type
                   , t1.color_type
                   , U.nick_name                 AS nick_name
                   , t1.view_count
                   , (SELECT COUNT(*)
                      FROM article_elements st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'board'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id
                        AND good = true)         AS good_count
                   , (SELECT COUNT(*)
                      FROM comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'board'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS comment_count
                   , (SELECT COUNT(*)
                      FROM re_comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'board'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS re_comment_count,
                        (SELECT -1) AS banner_category
              FROM boards t1
                     INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board' AND t2.is_delete = false
                     INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
              WHERE t2.id IN (SELECT type_id
                              FROM article_elements t3
                              WHERE type = 'comment'
                                AND good = true
                                AND writer = ${userId})
                AND t1.is_delete = false
              UNION ALL
              SELECT t1.id
                   , 'news'                      AS type
                   , 0                           AS category
                   , t1.title
                   , t1.contents
                   , t1.created_at
                   , N'뉴스'                      as writing_type
                   , N'없음(일반 게시물)'               as color_type
                   , source_type                 AS nick_name
                   , t1.view_count
                   , (SELECT COUNT(*)
                      FROM article_elements st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'news'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id
                        AND good = true)         AS good_count
                   , (SELECT COUNT(*)
                      FROM comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'news'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS comment_count
                   , (SELECT COUNT(*)
                      FROM re_comments st1
                      INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                      WHERE st1.type = 'news'
                        AND st1.is_delete = false
                        AND st1.type_id = t1.id) AS re_comment_count,
                        (SELECT -1) AS banner_category
                  FROM news_contents t1
                     INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news' AND t2.is_delete = false
              WHERE t2.id IN (SELECT type_id
                              FROM article_elements t3
                              WHERE type = 'comment'
                                AND good = true
                                AND writer = ${userId})
                AND t1.is_public = true
                UNION ALL
                SELECT t1.id
                , 'advertisement'                     AS type
                , t1.category                 AS category
                , t1.title
                , t1.contents
                , t1.created_at
                , t1.writing_type
                , t1.color_type
                , U.nick_name                 AS nick_name
                , t1.view_count,
                 (SELECT COUNT(*)
                   FROM article_elements st1
                   INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                   WHERE st1.type = 'advertisement'
                     AND st1.type_id = t1.id
                     AND st1.is_delete = false
                     AND good = true)         AS good_count,
                 (SELECT COUNT(*)
                   FROM comments st1
                   INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                   WHERE st1.type = 'advertisement'
                     AND st1.is_delete = false
                     AND st1.type_id = t1.id) AS comment_count,
                 (SELECT COUNT(*)
                   FROM re_comments st1
                   INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                   WHERE st1.type = 'advertisement'
                     AND st1.is_delete = false
                     AND st1.type_id = t1.id) AS re_comment_count,
                  (SELECT ba.banner_category
                    FROM banners ba
                    WHERE ba.id = t1.category) AS banner_category
           FROM advertisement_boards t1
                  INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
           WHERE t1.id IN
                 (SELECT type_id
                  FROM article_elements
                  WHERE type = 'advertisement'
                    AND article_elements.is_delete = false
                    AND good = true
                    AND writer = ${userId})
             AND t1.is_delete = false
                   UNION ALL
              SELECT t1.id
                , 'advertisement'                     AS type
                , t1.category                 AS category
                , t1.title
                , t1.contents
                , t1.created_at
                , t1.writing_type
                , t1.color_type
                , U.nick_name                 AS nick_name
                , t1.view_count,
                 (SELECT COUNT(*)
                   FROM article_elements st1
                   INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                   WHERE st1.type = 'advertisement'
                     AND st1.is_delete = false
                     AND st1.type_id = t1.id
                     AND good = true)         AS good_count,
                 (SELECT COUNT(*)
                   FROM comments st1
                   INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                   WHERE st1.type = 'advertisement'
                     AND st1.is_delete = false
                     AND st1.type_id = t1.id) AS comment_count,
                 (SELECT COUNT(*)
                   FROM re_comments st1
                   INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                   WHERE st1.type = 'advertisement'
                     AND st1.is_delete = false
                     AND st1.type_id = t1.id) AS re_comment_count,
                  (SELECT ba.banner_category
                  FROM banners ba
                  WHERE ba.id = t1.category) AS banner_category
           FROM advertisement_boards t1
                  INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'advertisement' AND t2.is_delete = false
                  INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
           WHERE t2.id IN (SELECT type_id
                           FROM article_elements t3
                           WHERE type = 'comment'
                             AND good = true
                             AND writer = ${userId})
             AND t1.is_delete = false
                ) AS a ) AS aa
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
                          contents,
                          created_at,
                          view_count,
                          good_count,
                          writing_type,
                          nick_name,
                          (comment_count + re_comment_count) AS comment_count,
                          banner_category
          FROM (SELECT t1.id
                     , 'board'                     AS type
                     , t1.category                 AS category
                     , title
                     , contents
                     , t1.created_at
                     , writing_type
                     , U.nick_name                 AS nick_name
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false
                          AND scrap = true)        AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'board'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS re_comment_count,
                        (SELECT -1)      AS banner_category
                FROM boards t1
                       INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                WHERE t1.id IN
                      (SELECT type_id
                       FROM article_elements
                       WHERE type = 'board'
                         AND scrap = true
                         AND article_elements.is_delete = false
                         AND writer = ${userId})
                  AND t1.is_delete = false
                UNION ALL
                SELECT id
                     , 'news'                      AS type
                     , 0                           AS category
                     , title
                     , contents
                     , created_at
                     , N'뉴스'                       as writing_type
                     , source_type                 as nick_name
                     , view_count
                     , (SELECT COUNT(*)
                        FROM article_elements st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.type_id = t1.id
                          AND st1.is_delete = false
                          AND scrap = true)        AS good_count
                     , (SELECT COUNT(*)
                        FROM comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS comment_count
                     , (SELECT COUNT(*)
                        FROM re_comments st1
                        INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                        WHERE st1.type = 'news'
                          AND st1.is_delete = false
                          AND st1.type_id = t1.id) AS re_comment_count,
                      (SELECT -1)      AS banner_category
                FROM news_contents t1
                WHERE id IN (SELECT type_id
                             FROM article_elements
                             WHERE type = 'news'
                               AND scrap = true
                               AND article_elements.is_delete = false
                               AND writer = ${userId})
                  AND t1.is_public = true
                  UNION ALL
                  SELECT t1.id
                          , 'advertisement'                     AS type
                          , t1.category                 AS category
                          , title
                          , contents
                          , t1.created_at
                          , writing_type
                          , U.nick_name                 AS nick_name
                          , view_count
                          , (SELECT COUNT(*)
                            FROM article_elements st1
                            INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                            WHERE st1.type = 'advertisement'
                              AND st1.type_id = t1.id
                              AND st1.is_delete = false
                              AND scrap = true)        AS good_count
                          , (SELECT COUNT(*)
                            FROM comments st1
                            INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                            WHERE st1.type = 'advertisement'
                              AND st1.is_delete = false
                              AND st1.type_id = t1.id) AS comment_count
                          , (SELECT COUNT(*)
                            FROM re_comments st1
                            INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                            WHERE st1.type = 'advertisement'
                              AND st1.is_delete = false
                              AND st1.type_id = t1.id) AS re_comment_count,
                            (SELECT ba.banner_category
                            FROM banners ba
                            WHERE ba.id = t1.category) AS banner_category
                    FROM advertisement_boards t1
                            INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                    WHERE t1.id IN
                          (SELECT type_id
                            FROM article_elements
                            WHERE type = 'advertisement'
                              AND scrap = true
                              AND article_elements.is_delete = false
                              AND writer = ${userId})
                      AND t1.is_delete = false
                  ) AS a
          ORDER BY created_at DESC ${startQuery} ${limitQuery}
        `

        let sql2 = `
            SELECT COUNT(*)
            FROM (SELECT t1.id
            , 'board'                     AS type
            , t1.category                 AS category
            , title
            , contents
            FROM boards t1
            INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
            WHERE t1.id IN
            (SELECT type_id
            FROM article_elements
            WHERE type = 'board'
            AND scrap = true
            AND article_elements.is_delete = false
            AND writer = ${userId})
            AND t1.is_delete = false
            UNION ALL
            SELECT id
            , 'news'                      AS type
            , 0                           AS category
            , title
            , contents
            FROM news_contents t1
            WHERE id IN (SELECT type_id
              FROM article_elements
              WHERE type = 'news'
                AND scrap = true
                AND article_elements.is_delete = false
                AND writer = ${userId})
            AND t1.is_public = true
            UNION ALL
            SELECT t1.id
            , 'advertisement'                     AS type
            , t1.category                 AS category
            , title
            , contents
            FROM advertisement_boards t1
            WHERE t1.id IN
            (SELECT type_id
              FROM article_elements
              WHERE type = 'advertisement'
                AND scrap = true
                AND article_elements.is_delete = false
                AND writer = ${userId})
            AND t1.is_delete = false
          ) AS aa
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
  async findBoardSubscription(ctx){
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        let startQuery = ''
        let limitQuery = ''
        let start = ctx.query.start
        let limit = ctx.query.limit
        const { id: userId } = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx)

        if (start) {
          startQuery = `OFFSET ${ctx.query.start}`
        }

        if (limit) {
          limitQuery = `LIMIT ${ctx.query.limit}`
        }

        let sql = `
          SELECT b.* FROM (
          SELECT advertisement_boards.id,
          advertisement_boards.title,
          advertisement_boards.contents,
          advertisement_boards.writer,
          advertisement_boards.writing_type,
          advertisement_boards.color_type,
          advertisement_boards.is_delete,
          advertisement_boards.category,
          advertisement_boards.view_count,
          advertisement_boards.created_by,
          advertisement_boards.updated_by,
          advertisement_boards.created_at,
          advertisement_boards.updated_at,
          advertisement_boards.board_expected_date,
          advertisement_boards.board_expired_date,
          (SELECT banners.banner_category
          FROM banners 
          WHERE banners.id = advertisement_boards.category
          )
          AS banner_category,
          (SELECT count(1)
          FROM article_elements
          INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
          WHERE advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND good = true)
          AS good_count,
          (SELECT count(1)
          FROM article_elements
          INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
          WHERE advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND hate = true)
          AS hate_count,
          (SELECT count(1)
          FROM comments
          WHERE advertisement_boards.id = comments.type_id
          AND comments.is_delete = false
          AND type = 'advertisement')
          AS comment_count,
          (SELECT count(1)
          FROM re_comments
          INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
          WHERE advertisement_boards.id = re_comments.type_id
          AND re_comments.is_delete = false
          AND type = 'advertisement')
          AS re_comment_count,
          U.nick_name,
          (SELECT view_boards.id
          FROM view_boards
          WHERE view_boards.board_num = advertisement_boards.id::VARCHAR
          AND view_boards.user_num = ${userId}::VARCHAR
          AND view_boards.board_type = 'advertisement') AS view_board
          FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND category in (select type_id from advertisement_push_agrees where user_id = ${userId} AND updated_at < advertisement_boards.updated_at)
          ORDER BY advertisement_boards.created_at DESC)as b
          order by created_at DESC ${startQuery} ${limitQuery}
        `

        let sql2 = `
          SELECT COUNT(*) FROM(
          SELECT advertisement_boards.id
          FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND category in (select type_id from advertisement_push_agrees 
          where user_id = ${userId} AND updated_at < advertisement_boards.updated_at)
          ORDER BY advertisement_boards.created_at DESC)as b
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
  async findMemberSubscription(ctx){
    //게시글 (메인, 광고주)에 작성한 글 불러오기
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try {
        let startQuery = ''
        let limitQuery = ''
        let start = ctx.query.start
        let limit = ctx.query.limit

        const { id: userId } = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx)

        if (start) {
          startQuery = `OFFSET ${ctx.query.start}`
        }

        if (limit) {
          limitQuery = `LIMIT ${ctx.query.limit}`
        }

        let sql = `
        select a.*
        from (SELECT boards.*, (SELECT -1) AS banner_category,
        'board' AS type,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND good = true)    AS good_count,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND hate = true)    AS hate_count,
        (SELECT count(1)
        FROM comments
        INNER JOIN "users-permissions_user" AS U ON comments.writer = U.id
        WHERE boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'board') AS comment_count,
        (SELECT count(1)
        FROM re_comments
        INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
        WHERE boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'board') AS re_comment_count,
        U.nick_name,
        (SELECT view_boards.id
        FROM view_boards
        WHERE view_boards.board_num = boards.id::VARCHAR
        AND view_boards.user_num = ${userId}::VARCHAR
        AND view_boards.board_type = 'board') AS view_board
        FROM boards
        INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
        WHERE boards.is_delete = false
        AND boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < boards.created_at)
        ORDER BY boards.created_at DESC) as a
        UNION ALL
        select b.*
        from (
        SELECT advertisement_boards.id,
        advertisement_boards.title,
        advertisement_boards.contents,
        advertisement_boards.writer,
        advertisement_boards.writing_type,
        advertisement_boards.color_type,
        advertisement_boards.is_delete,
        advertisement_boards.category,
        advertisement_boards.view_count,
        advertisement_boards.created_by,
        advertisement_boards.updated_by,
        advertisement_boards.created_at,
        advertisement_boards.updated_at,
        advertisement_boards.board_expected_date,
        advertisement_boards.board_expired_date,
        (SELECT banners.banner_category FROM banners WHERE banners.id = advertisement_boards.category)
        AS banner_category,
        'advertisement' AS type,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE advertisement_boards.id = article_elements.type_id
        AND type = 'advertisement'
        AND article_elements.is_delete = false
        AND good = true)    AS good_count,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE advertisement_boards.id = article_elements.type_id
        AND type = 'advertisement'
        AND article_elements.is_delete = false
        AND hate = true)    AS hate_count,
        (SELECT count(1)
        FROM comments
        INNER JOIN "users-permissions_user" AS U ON comments.writer = U.id
        WHERE advertisement_boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'advertisement') AS comment_count,
        (SELECT count(1)
        FROM re_comments
        INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
        WHERE advertisement_boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'advertisement') AS re_comment_count,
        U.nick_name,
        (SELECT view_boards.id
        FROM view_boards
        WHERE view_boards.board_num = advertisement_boards.id::VARCHAR
        AND view_boards.user_num = ${userId}::VARCHAR
        AND view_boards.board_type = 'advertisement') AS view_board
        FROM advertisement_boards
        INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
        WHERE advertisement_boards.is_delete = false
        AND advertisement_boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < advertisement_boards.created_at)
        ORDER BY advertisement_boards.created_at DESC )as b
          order by created_at DESC ${startQuery} ${limitQuery}
        `
        let sql2 = `
          SELECT COUNT(*) FROM(
          select a.* from (SELECT boards.id FROM boards
          INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
          AND boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < boards.created_at)
          ORDER BY boards.created_at DESC) as a
          UNION ALL
          select b.* from ( SELECT advertisement_boards.id FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < advertisement_boards.created_at)
          ORDER BY advertisement_boards.created_at DESC )as b
          )as c
        `

        let result = await strapi.connections.default.raw(sql)
        let result2 = await strapi.connections.default.raw(sql2)

        return {
          contents: result.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['article-elements'] })
          ),
          totalCount: result2.rows[0].count
        }
      } catch (err) {
        console.log(err.message)
      }
    }
  },

  async getSubscriptionCount(ctx){
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
      try{
        const { id: userId } = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx)

        let sql1 = `
          SELECT COUNT(*) FROM(
          select a.* from (SELECT boards.id FROM boards
          INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
          AND boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < boards.created_at)
          ORDER BY boards.created_at DESC) as a
          UNION ALL
          select b.* from ( SELECT advertisement_boards.id FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < advertisement_boards.created_at)
          ORDER BY advertisement_boards.created_at DESC )as b
          UNION ALL
          SELECT c.* FROM(
          SELECT advertisement_boards.id
          FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND category in (select type_id from advertisement_push_agrees 
          where user_id = ${userId} AND updated_at < advertisement_boards.updated_at)
          ORDER BY advertisement_boards.created_at DESC)as c
          )as d
        `
        let sql2 = `
          SELECT COUNT(*) FROM(
          select a.* from (SELECT boards.id FROM boards
          INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
          AND boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < boards.created_at)
          ORDER BY boards.created_at DESC) as a
          UNION ALL
          select b.* from ( SELECT advertisement_boards.id FROM advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writer in (select member_id from "member_push_agrees" where user_id = ${userId} AND created_at < advertisement_boards.created_at)
          ORDER BY advertisement_boards.created_at DESC)as b
          )as c
        `

        let result1 = await strapi.connections.default.raw(sql1)
        let result2 = await strapi.connections.default.raw(sql2)

        return {
          totalCount: result1.rows[0].count,
          viewCount: result2.rows[0].count,
        }

      }catch(err){
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
      select a.*
      from (SELECT boards.*,
        (SELECT -1) AS banner_category,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND good = true)    AS good_count,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND hate = true)    AS hate_count,
        (SELECT count(1)
        FROM comments
        INNER JOIN "users-permissions_user" AS U ON comments.writer = U.id
        WHERE boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'board') AS comment_count,
        (SELECT count(1)
        FROM re_comments
        INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
        WHERE boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'board') AS re_comment_count,
        U.nick_name
      FROM boards
      INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
      WHERE boards.is_delete = false
      AND boards.writer = ${userId}
      ORDER BY boards.created_at DESC) as a
      UNION ALL
      select b.*
      from (
      SELECT advertisement_boards.id,
      advertisement_boards.title,
      advertisement_boards.contents,
      advertisement_boards.writer,
      advertisement_boards.writing_type,
      advertisement_boards.color_type,
      advertisement_boards.is_delete,
      advertisement_boards.category,
      advertisement_boards.view_count,
      advertisement_boards.created_by,
      advertisement_boards.updated_by,
      advertisement_boards.created_at,
      advertisement_boards.updated_at,
      advertisement_boards.board_expected_date,
      advertisement_boards.board_expired_date,
        (SELECT banners.banner_category
        FROM banners 
        WHERE banners.id = advertisement_boards.category
        )    AS banner_category,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE advertisement_boards.id = article_elements.type_id
        AND type = 'advertisement'
        AND article_elements.is_delete = false
        AND good = true)    AS good_count,
        (SELECT count(1)
        FROM article_elements
        INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
        WHERE advertisement_boards.id = article_elements.type_id
        AND type = 'advertisement'
        AND article_elements.is_delete = false
        AND hate = true)    AS hate_count,
        (SELECT count(1)
        FROM comments
        INNER JOIN "users-permissions_user" AS U ON comments.writer = U.id
        WHERE advertisement_boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'advertisement') AS comment_count,
        (SELECT count(1)
        FROM re_comments
        INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
        WHERE advertisement_boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'advertisement') AS re_comment_count,
        U.nick_name
      FROM advertisement_boards
      INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
      WHERE advertisement_boards.is_delete = false
      AND advertisement_boards.writer = ${userId}
      ORDER BY advertisement_boards.created_at DESC)as b
      order by created_at DESC
      ${startQuery} ${limitQuery}
    `

  let sql2 = `
    SELECT COUNT(*)
    FROM ( select a.*
    from (SELECT boards.*
    FROM boards
    WHERE boards.is_delete = false
    AND boards.writer = ${userId}) as a
    UNION ALL
    select b.*
    from (
    SELECT advertisement_boards.id,
    advertisement_boards.title,
    advertisement_boards.contents,
    advertisement_boards.writer,
    advertisement_boards.writing_type,
    advertisement_boards.color_type,
    advertisement_boards.is_delete,
    advertisement_boards.category,
    advertisement_boards.view_count,
    advertisement_boards.created_by,
    advertisement_boards.updated_by,
    advertisement_boards.created_at,
    advertisement_boards.updated_at,
    advertisement_boards.board_expected_date,
    advertisement_boards.board_expired_date
    FROM advertisement_boards
    WHERE advertisement_boards.is_delete = false
    AND advertisement_boards.writer = ${userId})as b
    ) AS c`

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
            INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
            WHERE comments.id = article_elements.type_id
              AND type = 'comment'
              AND article_elements.is_delete = false
              AND good = true)                   AS good_count,
           (SELECT count(1)
            FROM article_elements
            INNER JOIN "users-permissions_user" AS U ON article_elements.writer = U.id
            WHERE comments.id = article_elements.type_id
              AND type = 'comment'
              AND article_elements.is_delete = false
              AND hate = false)                  AS hate_count,
           (SELECT count(1)
            FROM re_comments
            INNER JOIN "users-permissions_user" AS U ON re_comments.writer = U.id
            WHERE comments.id = re_comments.comment
              AND re_comments.is_delete = false) AS re_comment_count,
           U.nick_name,
           CASE
             WHEN comments.type = 'news' then 0
             WHEN comments.type = 'board'
               THEN (SELECT category
                     FROM boards st1
                     WHERE st1.id = comments.type_id)
            WHEN comments.type = 'advertisement'
               THEN (SELECT bs.banner_category
            FROM advertisement_boards ab , banners bs
            WHERE ab.id = comments.type_id AND bs.id = ab.category)
             END    AS category,
           CASE
             WHEN comments.type = 'news' then 0
             WHEN comments.type = 'board'
               THEN (SELECT view_count
                     FROM boards st1
                     WHERE st1.id = comments.type_id)
              WHEN comments.type = 'advertisement'
                        THEN (SELECT ab.view_count
                FROM advertisement_boards ab
                WHERE ab.id = comments.type_id)
             END                                 AS view_count,
           (SELECT CAST(count(1) AS INT)
            FROM comments
            WHERE comments.is_delete = false
              AND comments.writer = ${userId})   AS total_count,
            CASE
            WHEN comments.type = 'news' then 0
            WHEN comments.type = 'board' then 0
            WHEN comments.type = 'advertisement'
              THEN (SELECT ab.category
              FROM advertisement_boards ab
              WHERE ab.id = comments.type_id)
            END                                 AS banner_category
    FROM comments
           INNER JOIN "users-permissions_user" AS U ON (comments.writer = U.id)
    WHERE comments.is_delete = false
      AND comments.writer = ${userId}
    ORDER BY comments.created_at DESC
      ${startQuery} ${limitQuery} 
  `

  let sql2 = `
    SELECT COUNT(*)
    FROM (SELECT comments.*
      FROM comments
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
                    contents,
                    created_at,
                    view_count,
                    good_count,
                    writing_type,
                    color_type,
                    nick_name,
                    (comment_count + re_comment_count) AS comment_count,
                    banner_category
    FROM (SELECT t1.id
               , 'board'                     AS type
               , t1.category                 AS category
               , t1.title
               , t1.contents
               , t1.created_at
               , t1.writing_type
               , t1.color_type
               , U.nick_name                 AS nick_name
               , t1.view_count,
                (SELECT COUNT(*)
                  FROM article_elements st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'board'
                    AND st1.type_id = t1.id
                    AND st1.is_delete = false
                    AND good = true)         AS good_count,
                (SELECT COUNT(*)
                  FROM comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'board'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS comment_count,
                (SELECT COUNT(*)
                  FROM re_comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'board'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS re_comment_count,
                (SELECT -1) AS banner_category
          FROM boards t1
                 INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
          WHERE t1.id IN
                (SELECT type_id
                 FROM article_elements
                 WHERE type = 'board'
                   AND article_elements.is_delete = false
                   AND good = true
                   AND writer = ${userId})
            AND t1.is_delete = false
          UNION ALL
          SELECT id
               , 'news'                      AS type
               , 0                           AS category
               , title
               , contents
               , created_at
               , N'뉴스'                       as writing_type
               , N'없음(일반 게시물)'               as color_type
               , source_type                 as nick_name
               , view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'news'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'news'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'news'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS re_comment_count,
                    (SELECT -1) AS banner_category
          FROM news_contents t1
          WHERE id IN (SELECT type_id
                       FROM article_elements
                       WHERE type = 'news'
                         AND article_elements.is_delete = false
                         AND good = true
                         AND writer = ${userId})
            AND t1.is_public = true
          UNION ALL
          SELECT t1.id
               , 'board'                     AS type
               , t1.category                 AS category
               , t1.title
               , t1.contents
               , t1.created_at
               , t1.writing_type
               , t1.color_type
               , U.nick_name                 AS nick_name
               , t1.view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'board'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'board'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'board'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS re_comment_count,
                    (SELECT -1) AS banner_category
          FROM boards t1
                 INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board' AND t2.is_delete = false
                 INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
          WHERE t2.id IN (SELECT type_id
                          FROM article_elements t3
                          WHERE type = 'comment'
                            AND good = true
                            AND writer = ${userId})
            AND t1.is_delete = false
          UNION ALL
          SELECT t1.id
               , 'news'                      AS type
               , 0                           AS category
               , t1.title
               , t1.contents
               , t1.created_at
               , N'뉴스'                      as writing_type
               , N'없음(일반 게시물)'               as color_type
               , source_type                 AS nick_name
               , t1.view_count
               , (SELECT COUNT(*)
                  FROM article_elements st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'news'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id
                    AND good = true)         AS good_count
               , (SELECT COUNT(*)
                  FROM comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'news'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS comment_count
               , (SELECT COUNT(*)
                  FROM re_comments st1
                  INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                  WHERE st1.type = 'news'
                    AND st1.is_delete = false
                    AND st1.type_id = t1.id) AS re_comment_count,
                    (SELECT -1) AS banner_category
              FROM news_contents t1
                 INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news' AND t2.is_delete = false
          WHERE t2.id IN (SELECT type_id
                          FROM article_elements t3
                          WHERE type = 'comment'
                            AND good = true
                            AND writer = ${userId})
            AND t1.is_public = true
            UNION ALL
            SELECT t1.id
            , 'advertisement'                     AS type
            , t1.category                 AS category
            , t1.title
            , t1.contents
            , t1.created_at
            , t1.writing_type
            , t1.color_type
            , U.nick_name                 AS nick_name
            , t1.view_count,
             (SELECT COUNT(*)
               FROM article_elements st1
               INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
               WHERE st1.type = 'advertisement'
                 AND st1.type_id = t1.id
                 AND st1.is_delete = false
                 AND good = true)         AS good_count,
             (SELECT COUNT(*)
               FROM comments st1
               INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
               WHERE st1.type = 'advertisement'
                 AND st1.is_delete = false
                 AND st1.type_id = t1.id) AS comment_count,
             (SELECT COUNT(*)
               FROM re_comments st1
               INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
               WHERE st1.type = 'advertisement'
                 AND st1.is_delete = false
                 AND st1.type_id = t1.id) AS re_comment_count,
              (SELECT ba.banner_category
                FROM banners ba
                WHERE ba.id = t1.category) AS banner_category
       FROM advertisement_boards t1
              INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
       WHERE t1.id IN
             (SELECT type_id
              FROM article_elements
              WHERE type = 'advertisement'
                AND article_elements.is_delete = false
                AND good = true
                AND writer = ${userId})
         AND t1.is_delete = false
               UNION ALL
          SELECT t1.id
            , 'advertisement'                     AS type
            , t1.category                 AS category
            , t1.title
            , t1.contents
            , t1.created_at
            , t1.writing_type
            , t1.color_type
            , U.nick_name                 AS nick_name
            , t1.view_count,
             (SELECT COUNT(*)
               FROM article_elements st1
               INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
               WHERE st1.type = 'advertisement'
                 AND st1.is_delete = false
                 AND st1.type_id = t1.id
                 AND good = true)         AS good_count,
             (SELECT COUNT(*)
               FROM comments st1
               INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
               WHERE st1.type = 'advertisement'
                 AND st1.is_delete = false
                 AND st1.type_id = t1.id) AS comment_count,
             (SELECT COUNT(*)
               FROM re_comments st1
               INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
               WHERE st1.type = 'advertisement'
                 AND st1.is_delete = false
                 AND st1.type_id = t1.id) AS re_comment_count,
              (SELECT ba.banner_category
              FROM banners ba
              WHERE ba.id = t1.category) AS banner_category
       FROM advertisement_boards t1
              INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'advertisement' AND t2.is_delete = false
              INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
       WHERE t2.id IN (SELECT type_id
                       FROM article_elements t3
                       WHERE type = 'comment'
                         AND good = true
                         AND writer = ${userId})
         AND t1.is_delete = false
            ) AS a
    ORDER BY created_at DESC ${startQuery} ${limitQuery}
  `

  let sql2 = `
  SELECT COUNT(*)
  FROM (SELECT DISTINCT id,
                  type,
                  category,
                  title,
                  contents,
                  created_at,
                  view_count,
                  good_count,
                  writing_type,
                  color_type,
                  nick_name,
                  (comment_count + re_comment_count) AS comment_count,
                  banner_category
  FROM (SELECT t1.id
             , 'board'                     AS type
             , t1.category                 AS category
             , t1.title
             , t1.contents
             , t1.created_at
             , t1.writing_type
             , t1.color_type
             , U.nick_name                 AS nick_name
             , t1.view_count,
              (SELECT COUNT(*)
                FROM article_elements st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'board'
                  AND st1.type_id = t1.id
                  AND st1.is_delete = false
                  AND good = true)         AS good_count,
              (SELECT COUNT(*)
                FROM comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'board'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS comment_count,
              (SELECT COUNT(*)
                FROM re_comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'board'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS re_comment_count,
              (SELECT -1) AS banner_category
        FROM boards t1
               INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
        WHERE t1.id IN
              (SELECT type_id
               FROM article_elements
               WHERE type = 'board'
                 AND article_elements.is_delete = false
                 AND good = true
                 AND writer = ${userId})
          AND t1.is_delete = false
        UNION ALL
        SELECT id
             , 'news'                      AS type
             , 0                           AS category
             , title
             , contents
             , created_at
             , N'뉴스'                       as writing_type
             , N'없음(일반 게시물)'               as color_type
             , source_type                 as nick_name
             , view_count
             , (SELECT COUNT(*)
                FROM article_elements st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'news'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id
                  AND good = true)         AS good_count
             , (SELECT COUNT(*)
                FROM comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'news'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS comment_count
             , (SELECT COUNT(*)
                FROM re_comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'news'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS re_comment_count,
                  (SELECT -1) AS banner_category
        FROM news_contents t1
        WHERE id IN (SELECT type_id
                     FROM article_elements
                     WHERE type = 'news'
                       AND article_elements.is_delete = false
                       AND good = true
                       AND writer = ${userId})
          AND t1.is_public = true
        UNION ALL
        SELECT t1.id
             , 'board'                     AS type
             , t1.category                 AS category
             , t1.title
             , t1.contents
             , t1.created_at
             , t1.writing_type
             , t1.color_type
             , U.nick_name                 AS nick_name
             , t1.view_count
             , (SELECT COUNT(*)
                FROM article_elements st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'board'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id
                  AND good = true)         AS good_count
             , (SELECT COUNT(*)
                FROM comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'board'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS comment_count
             , (SELECT COUNT(*)
                FROM re_comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'board'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS re_comment_count,
                  (SELECT -1) AS banner_category
        FROM boards t1
               INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'board' AND t2.is_delete = false
               INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
        WHERE t2.id IN (SELECT type_id
                        FROM article_elements t3
                        WHERE type = 'comment'
                          AND good = true
                          AND writer = ${userId})
          AND t1.is_delete = false
        UNION ALL
        SELECT t1.id
             , 'news'                      AS type
             , 0                           AS category
             , t1.title
             , t1.contents
             , t1.created_at
             , N'뉴스'                      as writing_type
             , N'없음(일반 게시물)'               as color_type
             , source_type                 AS nick_name
             , t1.view_count
             , (SELECT COUNT(*)
                FROM article_elements st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'news'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id
                  AND good = true)         AS good_count
             , (SELECT COUNT(*)
                FROM comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'news'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS comment_count
             , (SELECT COUNT(*)
                FROM re_comments st1
                INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
                WHERE st1.type = 'news'
                  AND st1.is_delete = false
                  AND st1.type_id = t1.id) AS re_comment_count,
                  (SELECT -1) AS banner_category
            FROM news_contents t1
               INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'news' AND t2.is_delete = false
        WHERE t2.id IN (SELECT type_id
                        FROM article_elements t3
                        WHERE type = 'comment'
                          AND good = true
                          AND writer = ${userId})
          AND t1.is_public = true
          UNION ALL
          SELECT t1.id
          , 'advertisement'                     AS type
          , t1.category                 AS category
          , t1.title
          , t1.contents
          , t1.created_at
          , t1.writing_type
          , t1.color_type
          , U.nick_name                 AS nick_name
          , t1.view_count,
           (SELECT COUNT(*)
             FROM article_elements st1
             INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
             WHERE st1.type = 'advertisement'
               AND st1.type_id = t1.id
               AND st1.is_delete = false
               AND good = true)         AS good_count,
           (SELECT COUNT(*)
             FROM comments st1
             INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
             WHERE st1.type = 'advertisement'
               AND st1.is_delete = false
               AND st1.type_id = t1.id) AS comment_count,
           (SELECT COUNT(*)
             FROM re_comments st1
             INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
             WHERE st1.type = 'advertisement'
               AND st1.is_delete = false
               AND st1.type_id = t1.id) AS re_comment_count,
            (SELECT ba.banner_category
              FROM banners ba
              WHERE ba.id = t1.category) AS banner_category
     FROM advertisement_boards t1
            INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
     WHERE t1.id IN
           (SELECT type_id
            FROM article_elements
            WHERE type = 'advertisement'
              AND article_elements.is_delete = false
              AND good = true
              AND writer = ${userId})
       AND t1.is_delete = false
             UNION ALL
        SELECT t1.id
          , 'advertisement'                     AS type
          , t1.category                 AS category
          , t1.title
          , t1.contents
          , t1.created_at
          , t1.writing_type
          , t1.color_type
          , U.nick_name                 AS nick_name
          , t1.view_count,
           (SELECT COUNT(*)
             FROM article_elements st1
             INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
             WHERE st1.type = 'advertisement'
               AND st1.is_delete = false
               AND st1.type_id = t1.id
               AND good = true)         AS good_count,
           (SELECT COUNT(*)
             FROM comments st1
             INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
             WHERE st1.type = 'advertisement'
               AND st1.is_delete = false
               AND st1.type_id = t1.id) AS comment_count,
           (SELECT COUNT(*)
             FROM re_comments st1
             INNER JOIN "users-permissions_user" AS U ON st1.writer = U.id
             WHERE st1.type = 'advertisement'
               AND st1.is_delete = false
               AND st1.type_id = t1.id) AS re_comment_count,
            (SELECT ba.banner_category
            FROM banners ba
            WHERE ba.id = t1.category) AS banner_category
     FROM advertisement_boards t1
            INNER JOIN comments t2 ON t1.id = t2.type_id AND t2.type = 'advertisement' AND t2.is_delete = false
            INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
     WHERE t2.id IN (SELECT type_id
                     FROM article_elements t3
                     WHERE type = 'comment'
                       AND good = true
                       AND writer = ${userId})
       AND t1.is_delete = false
          ) AS a ) AS aa
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
    let sql = `UPDATE "users-permissions_user"
               SET visitor_count = visitor_count + 1
               WHERE id = ${userId}`
    await strapi.connections.default.raw(sql)
    return 'OK'
  },
}
