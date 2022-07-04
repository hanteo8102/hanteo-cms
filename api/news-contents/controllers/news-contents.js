'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  /**
   * Retrieve a record.
   *
   * @return {Object}
   */

  async findOne(ctx) {
    const { id } = ctx.params

    const entity = await strapi.services['news-contents'].findOne({ id })

    // 좋아요 카운트
    entity.good_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'news', type_id_eq: id, good: true })
    // 싫어요 카운트
    entity.hate_count = await strapi
      .query('article-elements')
      .count({ type_eq: 'news', type_id_eq: id, hate: true })
    // 코멘트 카운트
    const commentCount = await strapi
      .query('comments')
      .count({ type_eq: 'news', type_id_eq: id })

    const reCommentCount = await strapi
      .query('re-comments')
      .count({ type_eq: 'news', type_id_eq: id })

    entity.comment_count = commentCount + reCommentCount
    // 1차 댓글
    entity.comment = await strapi
      .query('comments')
      .find({ type_eq: 'news', type_id_eq: 1178 })

    return sanitizeEntity(entity, { model: strapi.models['news-contents'] })
  },
  async search(ctx) {
    let startQuery = ''
    let limitQuery = ''
    const { keyword, start, limit } = ctx.query

    if (start) {
      startQuery = `OFFSET ${ctx.query.start}`
    }

    if (limit) {
      limitQuery = `LIMIT ${ctx.query.limit}`
    }
    let newsListSql = `SELECT *
                       FROM news_contents
                       WHERE is_public = true
                         AND title LIKE '%${keyword}%'
                          OR contents LIKE '%${keyword}%'
                       ORDER BY created_at DESC
                         ${startQuery} ${limitQuery}`
    let newsCountSql = `SELECT COUNT(*)
                        FROM (SELECT *
                              FROM news_contents
                              WHERE is_public = true
                                AND title LIKE '%${keyword}%'
                                 OR contents LIKE '%${keyword}%') AS a`
    let bannerListSql = `SELECT *
                         FROM banners
                         WHERE is_public = true
                           AND position = N'카테고리 페이지 상단'
                           AND (company_name LIKE '%${keyword}%'
                           OR main_banner_text LIKE '%${keyword}%'
                           OR sub_banner_text LIKE '%${keyword}%'
                           OR site_url LIKE '%${keyword}%'
                           OR contact_info LIKE '%${keyword}%')
                         ORDER BY created_at DESC ${startQuery} ${limitQuery}`
    let bannerCountSql = `SELECT COUNT(*)
                          FROM (SELECT *
                                FROM banners
                                WHERE is_public = true
                                  AND position = N'카테고리 페이지 상단'
                                  AND (company_name LIKE '%${keyword}%'
                                  AND main_banner_text LIKE '%${keyword}%'
                                  OR sub_banner_text LIKE '%${keyword}%'
                                  OR site_url LIKE '%${keyword}%'
                                  OR contact_info LIKE '%${keyword}%')) AS a`
    let boardListSql = `SELECT t1.*, U.nick_name
                        FROM boards t1
                               INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                        WHERE is_delete = false
                          AND title LIKE '%${keyword}%'
                           OR contents LIKE '%${keyword}%'
                        ORDER BY t1.created_at DESC
                          ${startQuery} ${limitQuery}`
    let boardCountSql = `SELECT COUNT(*)
                         FROM (SELECT *
                               FROM boards
                               WHERE is_delete = false
                                 AND title LIKE '%${keyword}%'
                                  OR contents LIKE '%${keyword}%') AS a`

    let newsList = await strapi.connections.default.raw(newsListSql)
    let newsCount = await strapi.connections.default.raw(newsCountSql)
    let bannerList = await strapi.connections.default.raw(bannerListSql)
    let bannerCount = await strapi.connections.default.raw(bannerCountSql)
    let boardList = await strapi.connections.default.raw(boardListSql)
    let boardCount = await strapi.connections.default.raw(boardCountSql)

    return {
      newsList: {
        contents: newsList.rows.map((entity) =>
          sanitizeEntity(entity, { model: strapi.models['news-contents'] })
        ),
        totalCount: newsCount.rows[0].count,
      },
      bannerList: {
        contents: bannerList.rows.map((entity) =>
          sanitizeEntity(entity, { model: strapi.models['banner'] })
        ),
        totalCount: bannerCount.rows[0].count,
      },
      boardList: {
        contents: boardList.rows.map((entity) =>
          sanitizeEntity(entity, { model: strapi.models['boards'] })
        ),
        totalCount: boardCount.rows[0].count,
      },
    }
  },
  async updateViewCount(ctx) {
    let newsId = ctx.params.id
    let sql = `UPDATE news_contents SET view_count = view_count + 1 WHERE id = ${newsId}`
    await strapi.connections.default.raw(sql)
    return 'OK'
  },
}
