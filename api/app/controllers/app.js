'use strict'

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  async findNewsContents(ctx) {
    let query = ''
    if (ctx.query.limit) {
      query = `OFFSET 0 LIMIT ${ctx.query.limit}`
    } else {
      query = `OFFSET 0 LIMIT 20`
    }

    let sql = `
      SELECT NC.id,
             NC.title,
             REPLACE(NC.contents, '&nbsp;', '') AS contents,
             NC.is_public,
             NC.news_expected_date,
             NC.reporter,
             NC.is_public_reporter_email,
             NC.source_type,
             NC.priority,
             NC.created_by,
             NC.updated_by,
             NC.created_at,
             NC.updated_at,
             (SELECT url FROM upload_file UF WHERE UFM.upload_file_id = UF.id),
             NC.thumbnail_path,
             NC.view_count,
             CAST((SELECT count(1)
                   FROM article_elements
                   WHERE NC.id = article_elements.type_id
                     AND type = 'news'
                     AND good = true) AS INT)              AS good_count,
             CAST((SELECT count(1)
                   FROM article_elements
                   WHERE NC.id = article_elements.type_id
                     AND type = 'news'
                     AND hate = true) AS INT)              AS hate_count,
             CAST((SELECT count(1)
                   FROM comments
                   WHERE NC.id = comments.type_id
                     AND type = 'news') AS INT)            AS comment_count,
             CAST((SELECT count(1)
                   FROM re_comments
                   WHERE NC.id = re_comments.type_id
                     AND type = 'news') AS INT)            AS re_comment_count
      FROM news_contents AS NC
             INNER JOIN upload_file_morph AS UFM
                        ON (NC.id = UFM.related_id AND related_type = 'news_contents' AND field = 'thumbnail')
      WHERE NC.is_public = true
      ORDER BY NC.created_at DESC
        ${query}
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['news-contents'] })
    )
  },
}
