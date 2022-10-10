'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const {userId} = ctx.query

    const query = `
      select id as content_id,
             comment_count + re_comment_count as comment_count,
             read_count,
             read_state_id
        from (select t1.id,
                     (select count(1)
                      from comments st1
                      where st1.type = 'board'
                        and st1.type_id = t1.id
                        and st1.is_delete = false ) as comment_count,
                     (select count(1)
                      from re_comments st1
                      where st1.type = 'board'
                        and st1.type_id = t1.id
                        and st1.is_delete = false ) as re_comment_count,
                     t2.read_count,
                     t2.id as read_state_id
              from boards t1
                       left outer join my_page_read_states t2
                                       on t2.content_id = t1.id
                                           and t2.user_id = ${userId}
              where writer = ${userId}
                and t1.is_delete = false) t
    `

    let result = await strapi.connections.default.raw(query)
    return result.rows
  }
};

