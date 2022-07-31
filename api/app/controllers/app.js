'use strict'

const { sanitizeEntity } = require('strapi-utils')
const _ = require('lodash')
const { querySelector, handleCount } = require('./query')

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
]

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
                     AND good = true) AS INT)   AS good_count,
             CAST((SELECT count(1)
                   FROM article_elements
                   WHERE NC.id = article_elements.type_id
                     AND type = 'news'
                     AND hate = true) AS INT)   AS hate_count,
             CAST((SELECT count(1)
                   FROM comments
                   WHERE NC.id = comments.type_id
                     AND type = 'news') AS INT) AS comment_count,
             CAST((SELECT count(1)
                   FROM re_comments
                   WHERE NC.id = re_comments.type_id
                     AND type = 'news') AS INT) AS re_comment_count
      FROM news_contents AS NC
             LEFT JOIN upload_file_morph AS UFM
                       ON (NC.id = UFM.related_id AND related_type = 'news_contents' AND field = 'thumbnail')
      WHERE NC.is_public = true
      ORDER BY NC.created_at DESC, NC.priority DESC
        ${query}
    `

    let result = await strapi.connections.default.raw(sql)

    return result.rows.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models['news-contents'] })
    )
  },
  async confirmCheck(ctx) {
    if (ctx.query.email || ctx.query.identifier) {
      if (ctx.query.email) {
        let sql = `
          SELECT *
          FROM "users-permissions_user"
          WHERE email = '${ctx.query.email}'
        `
        const result = await strapi.connections.default.raw(sql)
        if (result.rows.length) {
          return result.rows[0]
        } else {
          return ctx.notFound()
        }
      } else if (ctx.query.identifier) {
        let sql = `
          SELECT *
          FROM "users-permissions_user"
          WHERE username = '${ctx.query.identifier}'
        `
        const result = await strapi.connections.default.raw(sql)
        if (result.rows.length) {
          return result.rows[0]
        } else {
          return ctx.notFound()
        }
      } else {
        return ctx.notFound()
      }
    } else {
      return ctx.notFound()
    }
  },
  async updateProfile(ctx) {
    const { id } = ctx.request.body
    const updateData = {
      ...ctx.request.body,
    }

    const data = await strapi.plugins['users-permissions'].services.user.edit(
      { id },
      updateData
    )

    ctx.send(data)
  },
  async findAllBoard(ctx) {
    const jobLContents = strapi.connections.default.raw(
      querySelector(1, ctx.query.userId)
    )
    const jobLCount = await strapi.connections.default.raw(handleCount(1))
    const jobRContents = await strapi.connections.default.raw(
      querySelector(2, ctx.query.userId)
    )
    const jobRCount = await strapi.connections.default.raw(handleCount(2))

    const propertyLContents = strapi.connections.default.raw(
      querySelector(3, ctx.query.userId)
    )
    const propertyLCount = await strapi.connections.default.raw(handleCount(3))
    const propertyRContents = await strapi.connections.default.raw(
      querySelector(4, ctx.query.userId)
    )
    const propertyRCount = await strapi.connections.default.raw(handleCount(4))

    const shoppingLContents = strapi.connections.default.raw(
      querySelector(5, ctx.query.userId)
    )
    const shoppingLCount = await strapi.connections.default.raw(handleCount(5))
    const shoppingRContents = await strapi.connections.default.raw(
      querySelector(6, ctx.query.userId)
    )
    const shoppingRCount = await strapi.connections.default.raw(handleCount(6))

    const serviceLContents = strapi.connections.default.raw(
      querySelector(7, ctx.query.userId)
    )
    const serviceLCount = await strapi.connections.default.raw(handleCount(7))
    const serviceRContents = await strapi.connections.default.raw(
      querySelector(8, ctx.query.userId)
    )
    const serviceRCount = await strapi.connections.default.raw(handleCount(8))

    const educationLContents = strapi.connections.default.raw(
      querySelector(9, ctx.query.userId)
    )
    const educationLCount = await strapi.connections.default.raw(handleCount(9))
    const educationRContents = await strapi.connections.default.raw(
      querySelector(10, ctx.query.userId)
    )
    const educationRCount = await strapi.connections.default.raw(
      handleCount(10)
    )

    const tripLContents = strapi.connections.default.raw(
      querySelector(11, ctx.query.userId)
    )
    const tripLCount = await strapi.connections.default.raw(handleCount(11))
    const tripRContents = await strapi.connections.default.raw(
      querySelector(12, ctx.query.userId)
    )
    const tripRCount = await strapi.connections.default.raw(handleCount(12))

    const medicalLContents = strapi.connections.default.raw(
      querySelector(13, ctx.query.userId)
    )
    const medicalLCount = await strapi.connections.default.raw(handleCount(13))
    const medicalRContents = await strapi.connections.default.raw(
      querySelector(14, ctx.query.userId)
    )
    const medicalRCount = await strapi.connections.default.raw(handleCount(14))

    const lawLContents = strapi.connections.default.raw(
      querySelector(15, ctx.query.userId)
    )
    const lawLCount = await strapi.connections.default.raw(handleCount(15))
    const lawRContents = await strapi.connections.default.raw(
      querySelector(16, ctx.query.userId)
    )
    const lawRCount = await strapi.connections.default.raw(handleCount(16))

    const clubLContents = strapi.connections.default.raw(
      querySelector(17, ctx.query.userId)
    )
    const clubLCount = await strapi.connections.default.raw(handleCount(17))
    const clubRContents = await strapi.connections.default.raw(
      querySelector(18, ctx.query.userId)
    )
    const clubRCount = await strapi.connections.default.raw(handleCount(18))

    const addressRContents = strapi.connections.default.raw(
      querySelector(19, ctx.query.userId)
    )
    const addressRCount = await strapi.connections.default.raw(handleCount(19))

    return {
      job: {
        left: {
          contents: jobLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: jobLCount,
        },
        right: {
          contents: jobRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: jobRCount,
        },
      },
      property: {
        left: {
          contents: propertyLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: propertyLCount,
        },
        right: {
          contents: propertyRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: propertyRCount,
        },
      },
      shopping: {
        left: {
          contents: shoppingLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: shoppingLCount,
        },
        right: {
          contents: shoppingRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: shoppingRCount,
        },
      },
      service: {
        left: {
          contents: serviceLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: serviceLCount,
        },
        right: {
          contents: serviceRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: serviceRCount,
        },
      },
      education: {
        left: {
          contents: educationLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: educationLCount,
        },
        right: {
          contents: educationRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: educationRCount,
        },
      },
      trip: {
        left: {
          contents: tripLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: tripLCount,
        },
        right: {
          contents: tripRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: tripRCount,
        },
      },
      medical: {
        left: {
          contents: medicalLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: medicalLCount,
        },
        right: {
          contents: medicalRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: medicalRCount,
        },
      },
      law: {
        left: {
          contents: lawLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: lawLCount,
        },
        right: {
          contents: lawRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: lawRCount,
        },
      },
      club: {
        left: {
          contents: clubLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: clubLCount,
        },
        right: {
          contents: clubRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: clubRCount,
        },
      },
      address: {
        left: {
          contents: [],
          totalCount: 0,
        },
        right: {
          contents: addressRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: addressRCount,
        },
      },
    }
  },
}
