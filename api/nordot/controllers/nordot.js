'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const axios = require('axios')
const qs = require('qs')

module.exports = {
  find: async (ctx) => {
    const limit = ctx.request.query.limit

    const NordotAPI = axios.create({
      baseURL: process.env.NORDOT_API_URL,
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${process.env.NORDOT_API_TOKEN}`,
        'Contents-Type': 'application/json;charset=utf-8',
      },
    })

    let response
    const query = qs.stringify({
      unit_id: process.env.NORDOT_API_UNIT_ID,
      status: 'public',
      published: true,
      limit,
    })
    try {
      response = await NordotAPI.get(`/curator/curations.list?${query}`)
      console.log(response)
    } catch (e) {
      console.log(e)
    }
    return response.body
  },
}
