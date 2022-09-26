'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */



const {sanitizeEntity} = require("strapi-utils");
module.exports = {
  async create(ctx) {

    if(!ctx.request.body.token)
      return

    const query = {
      _where: [
        {token: ctx.request.body.token},
      ]
    }

    const findResult = await strapi.services.token.find(query)
    let entity;

    if(findResult.length === 0) {
      entity = await strapi.services.token.create(ctx.request.body);
    } else {
      entity = await strapi.services.token.update({id: findResult[0].id}, ctx.request.body);
    }

    return sanitizeEntity(entity, {model: strapi.models.token})
  }
};
