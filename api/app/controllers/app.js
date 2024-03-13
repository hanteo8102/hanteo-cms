'use strict'

const { sanitizeEntity } = require('strapi-utils')
const _ = require('lodash')
const {
  querySelectorBoard,
  handleCountBoard,
  querySelectorUserContentsBoard,
  handleCountUserContentsBoard,
  querySelectorUserContentsComment,
  handleCountUserContentsComment,
  querySelectorUserContentsGood,
  handleCountUserContentsGood,
  querySelectorUserContentsScrap,
  handleCountUserContentsScrap,
  querySelectorBoardBanners,
} = require('./query')

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
]

const fetch = require('node-fetch')

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
                     AND comments.is_delete = false
                     AND type = 'news') AS INT) AS comment_count,
             CAST((SELECT count(1)
                   FROM re_comments
                   WHERE NC.id = re_comments.type_id
                     AND type = 'news'
                     AND re_comments.is_delete = false) AS INT) AS re_comment_count
      FROM news_contents AS NC
             LEFT JOIN upload_file_morph AS UFM
                       ON (NC.id = UFM.related_id AND related_type = 'news_contents' AND field = 'thumbnail')
      WHERE NC.is_public = true
      ORDER BY NC.priority DESC, NC.created_at DESC
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
    const jobLContents = await strapi.connections.default.raw(
      querySelectorBoard(1, ctx.query.userId)
    )
    const jobLCount = await strapi.connections.default.raw(handleCountBoard(1))
    const jobRContents = await strapi.connections.default.raw(
      querySelectorBoard(2, ctx.query.userId)
    )
    const jobRCount = await strapi.connections.default.raw(handleCountBoard(2))

    const propertyLContents = await strapi.connections.default.raw(
      querySelectorBoard(3, ctx.query.userId)
    )
    const propertyLCount = await strapi.connections.default.raw(
      handleCountBoard(3)
    )
    const propertyRContents = await strapi.connections.default.raw(
      querySelectorBoard(4, ctx.query.userId)
    )
    const propertyRCount = await strapi.connections.default.raw(
      handleCountBoard(4)
    )

    const shoppingLContents = await strapi.connections.default.raw(
      querySelectorBoard(5, ctx.query.userId)
    )
    const shoppingLCount = await strapi.connections.default.raw(
      handleCountBoard(5)
    )
    const shoppingRContents = await strapi.connections.default.raw(
      querySelectorBoard(6, ctx.query.userId)
    )
    const shoppingRCount = await strapi.connections.default.raw(
      handleCountBoard(6)
    )

    const serviceLContents = await strapi.connections.default.raw(
      querySelectorBoard(7, ctx.query.userId)
    )
    const serviceLCount = await strapi.connections.default.raw(
      handleCountBoard(7)
    )
    const serviceRContents = await strapi.connections.default.raw(
      querySelectorBoard(8, ctx.query.userId)
    )
    const serviceRCount = await strapi.connections.default.raw(
      handleCountBoard(8)
    )

    const educationLContents = await strapi.connections.default.raw(
      querySelectorBoard(9, ctx.query.userId)
    )
    const educationLCount = await strapi.connections.default.raw(
      handleCountBoard(9)
    )
    const educationRContents = await strapi.connections.default.raw(
      querySelectorBoard(10, ctx.query.userId)
    )
    const educationRCount = await strapi.connections.default.raw(
      handleCountBoard(10)
    )

    const tripLContents = await strapi.connections.default.raw(
      querySelectorBoard(11, ctx.query.userId)
    )
    const tripLCount = await strapi.connections.default.raw(
      handleCountBoard(11)
    )
    const tripRContents = await strapi.connections.default.raw(
      querySelectorBoard(12, ctx.query.userId)
    )
    const tripRCount = await strapi.connections.default.raw(
      handleCountBoard(12)
    )

    const medicalLContents = await strapi.connections.default.raw(
      querySelectorBoard(13, ctx.query.userId)
    )
    const medicalLCount = await strapi.connections.default.raw(
      handleCountBoard(13)
    )
    const medicalRContents = await strapi.connections.default.raw(
      querySelectorBoard(14, ctx.query.userId)
    )
    const medicalRCount = await strapi.connections.default.raw(
      handleCountBoard(14)
    )

    const lawLContents = await strapi.connections.default.raw(
      querySelectorBoard(15, ctx.query.userId)
    )
    const lawLCount = await strapi.connections.default.raw(handleCountBoard(15))
    const lawRContents = await strapi.connections.default.raw(
      querySelectorBoard(16, ctx.query.userId)
    )
    const lawRCount = await strapi.connections.default.raw(handleCountBoard(16))

    const clubLContents = await strapi.connections.default.raw(
      querySelectorBoard(17, ctx.query.userId)
    )
    const clubLCount = await strapi.connections.default.raw(
      handleCountBoard(17)
    )
    const clubRContents = await strapi.connections.default.raw(
      querySelectorBoard(18, ctx.query.userId)
    )
    const clubRCount = await strapi.connections.default.raw(
      handleCountBoard(18)
    )

    const addressRContents = await strapi.connections.default.raw(
      querySelectorBoard(19, ctx.query.userId)
    )
    const addressRCount = await strapi.connections.default.raw(
      handleCountBoard(19)
    )

    return {
      job: {
        left: {
          contents: jobLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: jobLCount.rows[0].count,
        },
        right: {
          contents: jobRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: jobRCount.rows[0].count,
        },
      },
      property: {
        left: {
          contents: propertyLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: propertyLCount.rows[0].count,
        },
        right: {
          contents: propertyRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: propertyRCount.rows[0].count,
        },
      },
      shopping: {
        left: {
          contents: shoppingLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: shoppingLCount.rows[0].count,
        },
        right: {
          contents: shoppingRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: shoppingRCount.rows[0].count,
        },
      },
      service: {
        left: {
          contents: serviceLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: serviceLCount.rows[0].count,
        },
        right: {
          contents: serviceRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: serviceRCount.rows[0].count,
        },
      },
      education: {
        left: {
          contents: educationLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: educationLCount.rows[0].count,
        },
        right: {
          contents: educationRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: educationRCount.rows[0].count,
        },
      },
      trip: {
        left: {
          contents: tripLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: tripLCount.rows[0].count,
        },
        right: {
          contents: tripRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: tripRCount.rows[0].count,
        },
      },
      medical: {
        left: {
          contents: medicalLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: medicalLCount.rows[0].count,
        },
        right: {
          contents: medicalRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: medicalRCount.rows[0].count,
        },
      },
      law: {
        left: {
          contents: lawLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: lawLCount.rows[0].count,
        },
        right: {
          contents: lawRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: lawRCount.rows[0].count,
        },
      },
      club: {
        left: {
          contents: clubLContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: clubLCount.rows[0].count,
        },
        right: {
          contents: clubRContents.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: clubRCount.rows[0].count,
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
          totalCount: addressRCount.rows[0].count,
        },
      },
    }
  },
  async findAllUserContents(ctx) {
    try {
      const user = ctx.query.userId

      let board = await strapi.connections.default.raw(
        querySelectorUserContentsBoard(user)
      )
      let boardCount = await strapi.connections.default.raw(
        handleCountUserContentsBoard(user)
      )
      let comment = await strapi.connections.default.raw(
        querySelectorUserContentsComment(user)
      )
      let commentCount = await strapi.connections.default.raw(
        handleCountUserContentsComment(user)
      )
      let good = await strapi.connections.default.raw(
        querySelectorUserContentsGood(user)
      )
      let goodCount = await strapi.connections.default.raw(
        handleCountUserContentsGood(user)
      )
      let scrap = await strapi.connections.default.raw(
        querySelectorUserContentsScrap(user)
      )
      let scrapCount = await strapi.connections.default.raw(
        handleCountUserContentsScrap(user)
      )

      return {
        board: {
          contents: board.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['boards'] })
          ),
          totalCount: boardCount.rows[0].count,
        },
        comment: {
          contents: comment.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['comments'] })
          ),
          totalCount: commentCount.rows[0].count,
        },
        good: {
          contents: good.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['article-elements'] })
          ),
          totalCount: goodCount.rows[0].count,
        },
        scrap: {
          contents: scrap.rows.map((entity) =>
            sanitizeEntity(entity, { model: strapi.models['article-elements'] })
          ),
          totalCount: scrapCount.rows[0].count,
        },
      }
    } catch (err) {
      console.log(err.message)
    }
  },
  async findAllBoardBanners(ctx) {
    let jobBanners
    let propertyBanners
    let shoppingBanners
    let serviceBanners
    let lawBanners
    let educationBanners
    let medicalBanners
    let tripBanners
    let clubBanners
    let addressBanners
    await Promise.all([
      strapi.connections.default.raw(querySelectorBoardBanners(1)),
      strapi.connections.default.raw(querySelectorBoardBanners(2)),
      strapi.connections.default.raw(querySelectorBoardBanners(3)),
      strapi.connections.default.raw(querySelectorBoardBanners(4)),
      strapi.connections.default.raw(querySelectorBoardBanners(5)),
      strapi.connections.default.raw(querySelectorBoardBanners(6)),
      strapi.connections.default.raw(querySelectorBoardBanners(7)),
      strapi.connections.default.raw(querySelectorBoardBanners(8)),
      strapi.connections.default.raw(querySelectorBoardBanners(9)),
      strapi.connections.default.raw(querySelectorBoardBanners(10)),
    ]).then((values) => {
      jobBanners = values[0].rows
      propertyBanners = values[1].rows
      shoppingBanners = values[2].rows
      serviceBanners = values[3].rows
      lawBanners = values[4].rows
      educationBanners = values[5].rows
      medicalBanners = values[6].rows
      tripBanners = values[7].rows
      clubBanners = values[8].rows
      addressBanners = values[9].rows
    })

    return {
      job: jobBanners,
      property: propertyBanners,
      shopping: shoppingBanners,
      service: serviceBanners,
      education: educationBanners,
      trip: tripBanners,
      medical: medicalBanners,
      law: lawBanners,
      club: clubBanners,
      address: addressBanners,
    }
  },
  // push 관련
  async sendCommentPush(ctx) {
    const { title, type, typeId, contents, url } = ctx.request.body

    if (type === undefined || typeId === undefined) {
      return 'failed'
    }

    // 토큰 목록 조회
    const agreeList = await strapi.services['comment-push-agree'].find({
      _where: [{ type, type_id: typeId }],
    })

    const userList = []
    agreeList.map((item) => {
      userList.push(item.user_id)
    })

    const tokenList = await strapi.services.token.find({
      _where: [{ user_id_in: userList }],
    })
    
    // 토큰 배열 생성
    const messageToList = []
    tokenList.map((item) => {
      messageToList.push(item.token)
    })

    // 100개씩 그룹 분할
    const messageGroup = []
    const groupCount = Math.ceil(messageToList.length / 100)
    for (let i = 0; i < groupCount; i++) {
      messageGroup.push({
        to: messageToList.splice(0, 100),
        title: title,
        body: contents,
        data: { url: url ? url : 'hanteo://' },
      })
    }
    // 그룹별 전송
    for (let i = 0; i < messageGroup.length; i++) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageGroup[i]),
      })
    }

    return {
      result: 'success',
    }
  },
  async sendAdvertisementPush(ctx) {
    const { title, type, typeId, contents, url } = ctx.request.body

    if (type === undefined || typeId === undefined) {
      return 'failed'
    }

    // 토큰 목록 조회 ()
    const agreeList = await strapi.services['advertisement-push-agree'].find({
      _where: [{ type, type_id: typeId }],
    })
    const userList = []

    agreeList.map((item) => {
      userList.push(item.user_id)
    })

    //해당 유저 토큰 불러오기
    const tokenList = await strapi.services.token.find({
      _where: [{ user_id_in: userList }],
    })
    
    // 토큰 배열 생성
    const messageToList = []
    tokenList.map((item) => {
      messageToList.push(item.token)
    })

    // 100개씩 그룹 분할
    const messageGroup = []
    const groupCount = Math.ceil(messageToList.length / 100)
    for (let i = 0; i < groupCount; i++) {
      messageGroup.push({
        to: messageToList.splice(0, 100),
        title: title,
        body: contents,
        data: { url: url ? url : 'hanteo://' },
      })
    }
    // 그룹별 전송
    for (let i = 0; i < messageGroup.length; i++) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageGroup[i]),
      })
    }

    return {
      result: 'success',
    }
  },
  async sendMemberPush(ctx) {
    const { title, typeId, contents, url } = ctx.request.body

    if (typeId === undefined) {
      return 'failed'
    }

    // 토큰 목록 조회
    const agreeList = await strapi.services['member-push-agree'].find({
      _where: [{ member_id: typeId }],
    })
    const userList = []

    agreeList.map((item) => {
      userList.push(item.user_id)
    })

    //해당 유저 토큰 불러오기
    const tokenList = await strapi.services.token.find({
      _where: [{ user_id_in: userList }],
    })
    
    // 토큰 배열 생성
    const messageToList = []
    tokenList.map((item) => {
      messageToList.push(item.token)
    })

    // 100개씩 그룹 분할
    const messageGroup = []
    const groupCount = Math.ceil(messageToList.length / 100)
    for (let i = 0; i < groupCount; i++) {
      messageGroup.push({
        to: messageToList.splice(0, 100),
        title: title,
        body: contents,
        data: { url: url ? url : 'hanteo://' },
      })
    }
    // 그룹별 전송
    for (let i = 0; i < messageGroup.length; i++) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageGroup[i]),
      })
    }

    return {
      result: 'success',
    }
  },
}
