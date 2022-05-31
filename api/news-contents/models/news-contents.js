'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is created
    beforeCreate(data) {
      const { contents } = data
      const img = contents.match(/<img[^>]+src="http([^">]+)/g)
      if (img) {
        const url = img[0].split('"')
        data.thumbnail_path = url[1]
      }
    },
  },
}
