'use strict';

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
        writerQuery = `AND advertisement_boards.writer = ${ctx.query.writer}`
      }
      if (ctx.query.category) {
        categoryQuery = `AND advertisement_boards.category = ${ctx.query.category}`
      }
      if (ctx.query.start) {
        startQuery = `offset ${ctx.query.start}`
      }
      if (ctx.query.limit) {
        limitQuery = `LIMIT ${ctx.query.limit}`
      }
  
      let sql = `
          select a.*
          from (select advertisement_boards.id,advertisement_boards.title,
          advertisement_boards.contents,advertisement_boards.writer,
          advertisement_boards.is_delete,advertisement_boards.category,
          advertisement_boards.writing_type,advertisement_boards.color_type,
          advertisement_boards.view_count,advertisement_boards.created_by,
          advertisement_boards.updated_by,advertisement_boards.created_at,
          advertisement_boards.updated_at,advertisement_boards.board_expected_date,
          advertisement_boards.board_expired_date,
          0 < (SELECT COUNT(*)
          FROM block_user_lists
          WHERE user_id = ${ctx.query.userId}
          AND advertisement_boards.writer = block_user_id) AS isBlock,
          (select count(1)
          from article_elements
          inner join "users-permissions_user" AS U ON U.id = article_elements.writer
          where advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND good = true) AS good_count,
          (select count(1)
          from article_elements
          inner join "users-permissions_user" AS U ON U.id = article_elements.writer
          where advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND hate = true) AS hate_count,
          (select count(1)
          from comments
          inner join "users-permissions_user" AS U ON U.id = comments.writer
          where advertisement_boards.id = comments.type_id
          AND comments.is_delete = false
          AND type = 'advertisement') AS comment_count,
          (select count(1)
          from re_comments
          inner join "users-permissions_user" AS U ON U.id = re_comments.writer
          where advertisement_boards.id = re_comments.type_id
          AND re_comments.is_delete = false
          AND type = 'advertisement') AS re_comment_count,
          U.nick_name,
          (SELECT view_boards.id
          FROM view_boards
          WHERE view_boards.board_num = advertisement_boards.id::VARCHAR
          AND view_boards.user_num = ${ctx.query.userId}::VARCHAR
          AND view_boards.board_type = 'advertisement') AS view_board
          from advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writing_type != N'일반 게시물'
          ${categoryQuery} ${writerQuery}
          ORDER BY advertisement_boards.created_at DESC limit 5) as a
          UNION ALL
          select b.*
          from (select advertisement_boards.id,
          CASE
          WHEN 0 < (SELECT COUNT(*)
          FROM block_user_lists
          WHERE user_id = ${ctx.query.userId}
          AND advertisement_boards.writer = block_user_id)
          THEN N'차단된 멤버의 게시글입니다.'
          ELSE advertisement_boards.title
          END AS title,
          CASE
          WHEN 0 < (SELECT COUNT(*)
          FROM block_user_lists
          WHERE user_id = ${ctx.query.userId}
          AND advertisement_boards.writer = block_user_id)
          THEN ''
          ELSE advertisement_boards.contents
          END AS contents,
          advertisement_boards.writer,advertisement_boards.is_delete,
          advertisement_boards.category,advertisement_boards.writing_type,
          advertisement_boards.color_type,advertisement_boards.view_count,
          advertisement_boards.created_by,advertisement_boards.updated_by,
          advertisement_boards.created_at,advertisement_boards.updated_at,
          advertisement_boards.board_expected_date,advertisement_boards.board_expired_date,
          0 < (SELECT COUNT(*)
          FROM block_user_lists
          WHERE user_id = ${ctx.query.userId}
          AND advertisement_boards.writer = block_user_id) AS isBlock,
          (select count(1)
          from article_elements
          inner join "users-permissions_user" AS U ON U.id = article_elements.writer
          where advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND good = true) AS good_count,
          (select count(1)
          from article_elements
          inner join "users-permissions_user" AS U ON U.id = article_elements.writer
          where advertisement_boards.id = article_elements.type_id
          AND type = 'advertisement'
          AND article_elements.is_delete = false
          AND hate = true) AS hate_count,
          (select count(1)
          from comments
          inner join "users-permissions_user" AS U ON U.id = comments.writer
          where advertisement_boards.id = comments.type_id
          AND comments.is_delete = false
          AND type = 'advertisement') AS comment_count,
          (select count(1)
          from re_comments
          inner join "users-permissions_user" AS U ON U.id = re_comments.writer
          where advertisement_boards.id = re_comments.type_id
          AND re_comments.is_delete = false
          AND type = 'advertisement') AS re_comment_count,
          U.nick_name,
          (SELECT view_boards.id
          FROM view_boards
          WHERE view_boards.board_num = advertisement_boards.id::VARCHAR
          AND view_boards.user_num = ${ctx.query.userId}::VARCHAR
          AND view_boards.board_type = 'advertisement') AS view_board
          from advertisement_boards
          INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writing_type = N'일반 게시물'
          ${categoryQuery} ${writerQuery}
          ORDER BY advertisement_boards.created_at DESC ${startQuery} ${limitQuery}) as b
      `
  
      let result = await strapi.connections.default.raw(sql)
  
      return result.rows.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models['boards'] })
      )

    },
    async findCount(ctx){
      try {
        const { category } = ctx.request.body
        
        let categoryQuery = ''
  
        if (category) {
          categoryQuery = `AND advertisement_boards.category = ${category}`
        }
  
        let sql = `
          select count(*) from (SELECT advertisement_boards.id
          from advertisement_boards
          WHERE advertisement_boards.is_delete = false
          AND advertisement_boards.writing_type = N'일반 게시물'
          ${categoryQuery}
          ORDER BY advertisement_boards.created_at DESC) as b
        `
  
        let result = await strapi.connections.default.raw(sql)

        return {
          totalCount: result.rows[0].count,
        }
      } catch (err) {
        console.log(err.message)
      }
    },
    async findOne(ctx) {
      const { id } = ctx.params
      const { userId } = ctx.query
  
      let sql = `
        SELECT advertisement_boards.id,
        CASE
        WHEN 0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${userId}
        AND advertisement_boards.writer = block_user_id)
        THEN N'차단된 멤버의 게시글입니다.'
        ELSE advertisement_boards.title
        END                                     AS title,
        CASE
        WHEN 0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${userId}
        AND advertisement_boards.writer = block_user_id)
        THEN ''
        ELSE advertisement_boards.contents
        END                                     AS contents,
        advertisement_boards.writer,
        advertisement_boards.is_delete,
        advertisement_boards.category,
        advertisement_boards.writing_type,
        advertisement_boards.color_type,
        CAST(advertisement_boards.view_count AS INT),
        advertisement_boards.created_by,
        advertisement_boards.updated_by,
        advertisement_boards.created_at,
        advertisement_boards.updated_at,
        advertisement_boards.board_expected_date,
        advertisement_boards.board_expired_date,
        (SELECT MAX(id)
        FROM advertisement_boards AS BBB
        WHERE BBB.id < advertisement_boards.id
        AND BBB.category = advertisement_boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type = '일반 게시물')       AS prev,
        (SELECT MIN(id)
        FROM advertisement_boards AS BBB
        WHERE BBB.id > advertisement_boards.id
        AND BBB.category = advertisement_boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type = '일반 게시물')       AS next,
        (SELECT MAX(id)
        FROM advertisement_boards AS BBB
        WHERE BBB.id < advertisement_boards.id
        AND BBB.category = advertisement_boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type != '일반 게시물')      AS notice_prev,
        (SELECT MIN(id)
        FROM advertisement_boards AS BBB
        WHERE BBB.id > advertisement_boards.id
        AND BBB.category = advertisement_boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type != '일반 게시물')      AS notice_next,
        0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${userId}
        AND advertisement_boards.writer = block_user_id) AS isBlock,
        CAST((select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where advertisement_boards.id = article_elements.type_id
        AND type = 'advertisement'
        AND article_elements.is_delete = false
        AND good = true) AS INT)          AS good_count,
        CAST((select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where advertisement_boards.id = article_elements.type_id
        AND type = 'advertisement'
        AND article_elements.is_delete = false
        AND hate = true) AS INT)          AS hate_count,
        CAST((select count(1)
        from comments
        inner join "users-permissions_user" AS U ON U.id = comments.writer
        where advertisement_boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'advertisement') AS INT)       AS comment_count,
        CAST((select count(1)
        from re_comments
        inner join "users-permissions_user" AS U ON U.id = re_comments.writer
        where advertisement_boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'advertisement') AS INT)       AS re_comment_count,
        U.nick_name,
        (SELECT view_boards.id
        FROM view_boards
        WHERE view_boards.board_num = advertisement_boards.id::VARCHAR
        AND view_boards.user_num = ${userId}::VARCHAR
        AND view_boards.board_type = 'advertisement') AS view_board
        from advertisement_boards
        INNER JOIN "users-permissions_user" AS U ON (advertisement_boards.writer = U.id)
        WHERE advertisement_boards.is_delete = false
        AND advertisement_boards.id = ${id}
      `
  
      let result = await strapi.connections.default.raw(sql)
  
      return sanitizeEntity(result.rows[0], { model: strapi.models['boards'] })
    },
    async updateViewCount(ctx) {
      let boardId = ctx.params.id
      let sql = `UPDATE advertisement_boards
                 SET view_count = view_count + 1
                 WHERE id = ${boardId}`
      await strapi.connections.default.raw(sql)
      return 'OK'
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
            UPDATE advertisement_boards
            SET is_delete = TRUE
            WHERE id = ${contentsId};
            UPDATE comments
            SET is_delete = TRUE
            WHERE type = 'advertisement'
              AND type_id = ${contentsId};
            UPDATE re_comments
            SET is_delete = TRUE
            WHERE type = 'advertisement'
              AND type_id = ${contentsId};
            UPDATE article_elements
            SET is_delete = TRUE
            WHERE type = 'advertisement'
              AND type_id = ${contentsId};
            UPDATE article_elements
            SET is_delete = TRUE
            WHERE type = 'comment'
              AND type_id IN (SELECT id FROM comments WHERE type = 'advertisement' AND type_id = ${contentsId});
            UPDATE article_elements
            SET is_delete = true
            WHERE type = 're-comment'
              AND type_id IN (SELECT id FROM re_comments WHERE type = 'advertisement' AND type_id = ${contentsId});
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
  
