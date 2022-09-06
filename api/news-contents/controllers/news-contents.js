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

    let sql = `
      SELECT news_contents.id,
             news_contents.title,
             REPLACE(news_contents.contents, '&nbsp;', '') AS contents,
             news_contents.is_public,
             news_contents.news_expected_date,
             news_contents.reporter,
             news_contents.is_public_reporter_email,
             news_contents.source_type,
             news_contents.priority,
             news_contents.created_by,
             news_contents.updated_by,
             news_contents.created_at,
             news_contents.updated_at,
             news_contents.thumbnail_path,
             news_contents.view_count,
             CAST((SELECT count(1)
                   FROM article_elements
                   WHERE news_contents.id = article_elements.type_id
                     AND type = 'news'
                     AND good = true) AS INT)              AS good_count,
             CAST((SELECT count(1)
                   FROM article_elements
                   WHERE news_contents.id = article_elements.type_id
                     AND type = 'news'
                     AND hate = true) AS INT)              AS hate_count,
             CAST((SELECT count(1)
                   FROM comments
                   WHERE news_contents.id = comments.type_id
                     AND type = 'news') AS INT)            AS comment_count,
             CAST((SELECT count(1)
                   FROM re_comments
                   WHERE news_contents.id = re_comments.type_id
                     AND type = 'news') AS INT)            AS re_comment_count
      FROM news_contents
      WHERE news_contents.is_public = true
        AND news_contents.id = ${id}
    `

    let result = await strapi.connections.default.raw(sql)

    return sanitizeEntity(result.rows[0], {
      model: strapi.models['news-contents'],
    })
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
                         AND (title LIKE '%${keyword}%'
                         OR contents LIKE '%${keyword}%')
                       ORDER BY created_at DESC
                         ${startQuery} ${limitQuery}`
    let newsCountSql = `SELECT COUNT(*)
                        FROM (SELECT *
                              FROM news_contents
                              WHERE is_public = true
                                AND (title LIKE '%${keyword}%'
                                OR contents LIKE '%${keyword}%')) AS a`
    let bannerListSql = `SELECT B.id,
                                B.company_name,
                                B.created_by,
                                B.updated_by,
                                B.created_at,
                                B.updated_at,
                                B.main_banner_text,
                                B.sub_banner_text,
                                B.site_url,
                                B.contents,
                                B.position,
                                B.is_public,
                                B.contact_info,
                                B.priority,
                                B.small_thumbnail_path,
                                B.big_thumbnail_path,
                                B.banner_category,
                                UF.url AS small_banner_image
                         FROM banners B
                                LEFT JOIN upload_file AS UF ON UF.id = (SELECT upload_file_id
                                                                        FROM upload_file_morph AS UFM
                                                                        WHERE UFM.related_id = B.id
                                                                          AND UFM.related_type = 'banners'
                                                                          AND UFM.field = 'small_banner_image')
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
                                  OR main_banner_text LIKE '%${keyword}%'
                                  OR sub_banner_text LIKE '%${keyword}%'
                                  OR site_url LIKE '%${keyword}%'
                                  OR contact_info LIKE '%${keyword}%')) AS a`
    let boardListSql = `SELECT t1.*
                             , U.nick_name
                             , (SELECT COUNT(*)
                                FROM comments st1
                                WHERE st1.type = 'board'
                                  AND st1.type_id = t1.id) AS comment_count
                             , (SELECT COUNT(*)
                                FROM re_comments st1
                                WHERE st1.type = 'board'
                                  AND st1.type_id = t1.id
                                  AND st1.is_delete = false) AS re_comment_count
                        FROM boards t1
                               INNER JOIN "users-permissions_user" AS U ON (t1.writer = U.id)
                        WHERE is_delete = false
                          AND (title LIKE '%${keyword}%'
                          OR contents LIKE '%${keyword}%')
                        ORDER BY t1.created_at DESC
                          ${startQuery} ${limitQuery}`
    let boardCountSql = `SELECT COUNT(*)
                         FROM (SELECT *
                               FROM boards
                               WHERE is_delete = false
                                 AND (title LIKE '%${keyword}%'
                                 OR contents LIKE '%${keyword}%')) AS a`

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
    let sql = `UPDATE news_contents
               SET view_count = view_count + 1
               WHERE id = ${newsId}`
    await strapi.connections.default.raw(sql)
    return 'OK'
  },
}
