'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {

    const query = {
      _where: [
        {type: ctx.request.body.type},
        {type_id: ctx.request.body.type_id}
      ]
    }
    let complainsEntity = await strapi.services.complain.find(query)

    if(complainsEntity.length === 0) {
      complainsEntity = await strapi.services.complain.create({
        type: ctx.request.body.type,
        type_id: ctx.request.body.type_id,
        writer: ctx.request.body.writer,
        contents: ctx.request.body.contents,
      })
    } else {
      complainsEntity = complainsEntity[0]
    }

    const entity = await strapi.services['complain-history'].create({...ctx.request.body, complain: complainsEntity.id});
    return sanitizeEntity(entity, { model: strapi.models['complain-history'] });
  },
};
