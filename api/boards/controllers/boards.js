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
  //모든 게시판 글
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
      from (select boards.id, boards.title,boards.contents,boards.writer,
        boards.is_delete,boards.category,boards.writing_type,boards.color_type,
        boards.view_count,boards.created_by,boards.updated_by,boards.created_at,
        boards.updated_at,boards.board_expected_date, boards.board_expired_date,
        0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${ctx.query.userId}
        AND boards.writer = block_user_id) AS isBlock,
        (select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND good = true)                       AS good_count,
        (select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND hate = true)                       AS hate_count,
        (select count(1)
        from comments
        inner join "users-permissions_user" AS U ON U.id = comments.writer
        where boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'board')                    AS comment_count,
        (select count(1)
        from re_comments
        inner join "users-permissions_user" AS U ON U.id = re_comments.writer
        where boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'board')                    AS re_comment_count,
        U.nick_name,
        (SELECT view_boards.id
        FROM view_boards
        WHERE view_boards.board_num = boards.id::VARCHAR
        AND view_boards.user_num = ${ctx.query.userId}::VARCHAR
        AND view_boards.board_type = 'board') AS view_board
        from boards
        INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
        WHERE boards.is_delete = false
        AND CURRENT_TIMESTAMP >= boards.board_expected_date
        AND boards.writing_type != N'일반 게시물'
        ${categoryQuery} ${writerQuery}
        ORDER BY boards.created_at DESC OFFSET 0 LIMIT 5) as a
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
        boards.writer, boards.is_delete, boards.category, boards.writing_type,
        boards.color_type, boards.view_count, boards.created_by,
        boards.updated_by, boards.created_at, boards.updated_at,
        boards.board_expected_date, boards.board_expired_date,
        0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${ctx.query.userId}
        AND boards.writer = block_user_id) AS isBlock,
        (select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND good = true)                       AS good_count,
        (select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND hate = true)                       AS hate_count,
        (select count(1)
        from comments
        inner join "users-permissions_user" AS U ON U.id = comments.writer
        where boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'board')                    AS comment_count,
        (select count(1)
        from re_comments
        inner join "users-permissions_user" AS U ON U.id = re_comments.writer
        where boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'board')                    AS re_comment_count,
        U.nick_name,
        (SELECT view_boards.id
        FROM view_boards
        WHERE view_boards.board_num = boards.id::VARCHAR
        AND view_boards.user_num = ${ctx.query.userId}::VARCHAR
        AND view_boards.board_type = 'board') AS view_board
        from boards
        INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
        WHERE boards.is_delete = false
        AND CURRENT_TIMESTAMP >= boards.board_expected_date
        AND boards.writing_type = N'일반 게시물'
        ${categoryQuery} ${writerQuery}
        ORDER BY boards.created_at DESC ${startQuery} ${limitQuery}) as b
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
        categoryQuery = `AND boards.category = ${category}`
      }

      let sql = `
          SELECT count(*) FROM (
          select boards.id
          from boards
          INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
          AND CURRENT_TIMESTAMP >= boards.board_expected_date
          AND boards.writing_type = N'일반 게시물'
          ${categoryQuery}
          ORDER BY boards.created_at DESC) as b
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
        SELECT boards.id,
        CASE
        WHEN 0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${userId}
        AND boards.writer = block_user_id)
        THEN N'차단된 멤버의 게시글입니다.'
        ELSE boards.title
        END AS title,
        CASE
        WHEN 0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${userId}
        AND boards.writer = block_user_id)
        THEN ''
        ELSE boards.contents
        END AS contents,
        boards.writer, boards.is_delete, boards.category, boards.writing_type,
        boards.color_type, CAST(boards.view_count AS INT), boards.created_by,
        boards.updated_by, boards.created_at, boards.updated_at,
        boards.board_expected_date, boards.board_expired_date,
        (SELECT MAX(BBB.id)
        FROM boards AS BBB, "users-permissions_user" AS u
        WHERE BBB.id < boards.id
        AND BBB.category = boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type = '일반 게시물'
        AND BBB.writer = u.id)       AS prev,
        (SELECT MIN(BBB.id)
        FROM boards AS BBB, "users-permissions_user" AS u
        WHERE BBB.id > boards.id
        AND BBB.category = boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type = '일반 게시물'
        AND BBB.writer = u.id) AS next,
        (SELECT MAX(id)
        FROM boards AS BBB
        WHERE BBB.id < boards.id
        AND BBB.category = boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type != '일반 게시물') AS notice_prev,
        (SELECT MIN(id)
        FROM boards AS BBB
        WHERE BBB.id > boards.id
        AND BBB.category = boards.category
        AND BBB.is_delete = false
        AND BBB.writing_type != '일반 게시물') AS notice_next,
        0 < (SELECT COUNT(*)
        FROM block_user_lists
        WHERE user_id = ${userId}
        AND boards.writer = block_user_id) AS isBlock,
        CAST((select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND good = true) AS INT) AS good_count,
        CAST((select count(1)
        from article_elements
        inner join "users-permissions_user" AS U ON U.id = article_elements.writer
        where boards.id = article_elements.type_id
        AND type = 'board'
        AND article_elements.is_delete = false
        AND hate = true) AS INT) AS hate_count,
        CAST((select count(1)
        from comments
        inner join "users-permissions_user" AS U ON U.id = comments.writer
        where boards.id = comments.type_id
        AND comments.is_delete = false
        AND type = 'board') AS INT) AS comment_count,
        CAST((select count(1)
        from re_comments
        inner join "users-permissions_user" AS U ON U.id = re_comments.writer
        where boards.id = re_comments.type_id
        AND re_comments.is_delete = false
        AND type = 'board') AS INT) AS re_comment_count,
        U.nick_name,
        (SELECT view_boards.id
        FROM view_boards
        WHERE view_boards.board_num = boards.id::VARCHAR
        AND view_boards.user_num = ${userId}::VARCHAR
        AND view_boards.board_type = 'board') AS view_board
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
    let sql = `UPDATE boards
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
          UPDATE boards
          SET is_delete = TRUE
          WHERE id = ${contentsId};
          UPDATE comments
          SET is_delete = TRUE
          WHERE type = 'board'
            AND type_id = ${contentsId};
          UPDATE re_comments
          SET is_delete = TRUE
          WHERE type = 'board'
            AND type_id = ${contentsId};
          UPDATE article_elements
          SET is_delete = TRUE
          WHERE type = 'board'
            AND type_id = ${contentsId};
          UPDATE article_elements
          SET is_delete = TRUE
          WHERE type = 'comment'
            AND type_id IN (SELECT id FROM comments WHERE type = 'board' AND type_id = ${contentsId});
          UPDATE article_elements
          SET is_delete = true
          WHERE type = 're-comment'
            AND type_id IN (SELECT id FROM re_comments WHERE type = 'board' AND type_id = ${contentsId});
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
