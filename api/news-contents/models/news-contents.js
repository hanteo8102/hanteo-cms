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
      if(img){
        const url = img[0].split('"')
        const https_img = filterStringsContainingSubstring(url,"https")
        data.thumbnail_path = https_img[0]
      }
      const src = contents.match(/<src[^>]+src="http([^">]+)/g)
      if (src) {
        const url = img[0].split('"')
        const https_img = filterStringsContainingSubstring(url,"https")
        data.thumbnail_path = https_img[0]
      }
    },
    beforeUpdate(params,data) {
      const { contents , thumbnail_path } = data
      if(!thumbnail_path){
        const img = contents.match(/<img[^>]+src="http([^">]+)/g)
        if(img) {
          const url = img[0].split('"')
          const https_img = filterStringsContainingSubstring(url,"https")
          data.thumbnail_path = https_img[0]
        }
        const src = contents.match(/<src[^>]+src="http([^">]+)/g)
        if (src) {
          const url = img[0].split('"')
          const https_img = filterStringsContainingSubstring(url,"https")
          data.thumbnail_path = https_img[0]
        }
      }
    },
  },
}

function filterStringsContainingSubstring(list , target) {
  const filteredList = [];
  for (const item of list) {
      if (item.includes(target)) {
          filteredList.push(item);
      }
  }
  return filteredList;
}
