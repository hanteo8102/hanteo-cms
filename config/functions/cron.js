'use strict'

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#cron-tasks
 */

const moment = require('moment')

module.exports = {
  '0 * * * * *': {
    task: async () => {
      const result = await strapi.query('news-contents').find({
        news_expected_date_null: false,
      })
      result.map((item) => {
        if (!item.is_public) {
          const timeCheck = moment().isAfter(item.news_expected_date)
          if (timeCheck) {
            strapi.query('news-contents').update(
              { id: item.id },
              {
                is_public: true,
              }
            )
          }
        }
      })
    },
    options: {
      tz: 'Asia/Tokyo',
    },
  },
}
